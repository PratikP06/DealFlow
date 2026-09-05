import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculateQuotationRisk,
} from '@/lib/risk'

export async function PATCH(
  request,
  { params }
) {
  try {
    /*
     * -------------------------------------------------------
     * AUTHENTICATION
     * -------------------------------------------------------
     */

    const session = await getSession()

    if (!session || session.type !== 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      )
    }

    /*
     * -------------------------------------------------------
     * REQUEST
     * -------------------------------------------------------
     */

    const body = await request.json()

    if (body.action !== 'CONFIRM') {
      return NextResponse.json(
        {
          error:
            'Unsupported quotation action',
        },
        { status: 400 }
      )
    }

    /*
     * -------------------------------------------------------
     * LOAD CUSTOMER QUOTATION
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * customerId is checked together with quotation id.
     *
     * A customer can therefore never confirm another
     * customer's quotation just by changing the URL.
     */

    const quotation =
      await prisma.quotation.findFirst({
        where: {
          id,
          customerId: session.userId,
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              tier: true,
            },
          },

          lines: {
            select: {
              id: true,
              productId: true,
              discountPercent: true,
              quantity: true,
              unitPrice: true,
            },
          },

          negotiations: {
            where: {
              status: 'PENDING',
            },

            select: {
              id: true,
            },
          },
        },
      })

    if (!quotation) {
      return NextResponse.json(
        {
          error:
            'Quotation not found or access denied',
        },
        { status: 404 }
      )
    }

    /*
     * -------------------------------------------------------
     * STATUS VALIDATION
     * -------------------------------------------------------
     *
     * Customer can confirm an APPROVED or SENT quotation.
     *
     * UNDER_NEGOTIATION can only be confirmed when there
     * are no pending negotiation requests and the final
     * risk check passes.
     *
     * CONFIRMED and CANCELLED cannot be confirmed again.
     *
     * DRAFT and PENDING_APPROVAL are not customer-facing.
     */

    if (
      quotation.status === 'CONFIRMED' ||
      quotation.status === 'CANCELLED'
    ) {
      return NextResponse.json(
        {
          error:
            'Quotation cannot be confirmed in its current state',
        },
        { status: 400 }
      )
    }

    if (
      quotation.status === 'DRAFT' ||
      quotation.status === 'PENDING_APPROVAL'
    ) {
      return NextResponse.json(
        {
          error:
            'Quotation is not ready for customer confirmation',
        },
        { status: 409 }
      )
    }

    /*
     * -------------------------------------------------------
     * PENDING NEGOTIATIONS
     * -------------------------------------------------------
     *
     * Customer must not confirm while a negotiation request
     * is still waiting for the sales team.
     */

    if (quotation.negotiations.length > 0) {
      return NextResponse.json(
        {
          error:
            'Resolve pending negotiation requests before confirmation',
        },
        { status: 400 }
      )
    }

    /*
     * -------------------------------------------------------
     * SERVER-SIDE RISK RECHECK
     * -------------------------------------------------------
     *
     * Never trust the browser to tell us that the quotation
     * is safe.
     *
     * Recalculate the risk using the current quotation
     * lines before confirming.
     */

    const risk =
      await calculateQuotationRisk(
        quotation.customerId,
        quotation.lines.map(
          (line) => ({
            productId:
              line.productId,

            discountPercent:
              Number(
                line.discountPercent
              ),
          })
        )
      )

    /*
     * If the quotation now requires approval, customer
     * confirmation cannot bypass the approval chain.
     */

    if (risk.approvalRequired) {
      return NextResponse.json(
        {
          error:
            'This quotation requires approval before it can be confirmed',

          blendedRiskScore:
            risk.blendedRiskScore,

          requiredRoles:
            risk.requiredRoles,
        },
        { status: 409 }
      )
    }

    /*
     * -------------------------------------------------------
     * CONFIRM QUOTATION
     * -------------------------------------------------------
     */

    const result =
      await prisma.$transaction(
        async (tx) => {
          const now = new Date()

          const updated =
            await tx.quotation.update({
              where: {
                id: quotation.id,
              },

              data: {
                status: 'CONFIRMED',

                confirmedAt:
                  now,

                lastActivityAt:
                  now,
              },

              select: {
                id: true,
                quoteNumber: true,
                status: true,
                confirmedAt: true,
                lastActivityAt: true,
              },
            })

          /*
           * Audit trail
           */

          await tx.auditLog.create({
            data: {
              quotationId:
                quotation.id,

              action:
                'CUSTOMER_CONFIRMED_QUOTATION',

              entityType:
                'Quotation',

              entityId:
                quotation.id,

              details: {
                customerId:
                  session.userId,

                previousStatus:
                  quotation.status,

                newStatus:
                  'CONFIRMED',

                blendedRiskScore:
                  risk.blendedRiskScore,

                requiredRoles:
                  risk.requiredRoles,
              },
            },
          })

          return updated
        }
      )

    return NextResponse.json({
      success: true,

      quotation: result,
    })
  } catch (error) {
    console.error(
      'Customer quotation confirmation error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Internal server error',
      },
      { status: 500 }
    )
  }
}