import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const NEGOTIATION_TYPES = [
  'DISCOUNT',
  'QUANTITY',
  'LINE_CHANGE',
  'COMMENT',
]

export async function POST(request) {
  try {
    const session = await getSession()

    if (!session || session.type !== 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: session.userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const {
      quotationId,
      quotationLineId,
      type,
      proposedDiscount,
      proposedQuantity,
      message,
    } = body

    if (!quotationId) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      )
    }

    if (!type || !NEGOTIATION_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid negotiation type',
        },
        { status: 400 }
      )
    }

    /*
     * IMPORTANT:
     * The quotation is looked up using BOTH the
     * quotation ID and the authenticated customer ID.
     *
     * This prevents Customer A from negotiating
     * Customer B's quotation.
     */
    const quotation =
      await prisma.quotation.findFirst({
        where: {
          id: quotationId,
          customerId: customer.id,
        },

        include: {
          lines: {
            select: {
              id: true,
              quotationId: true,
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
     * Customer cannot negotiate a quotation that
     * has already been confirmed or cancelled.
     */
    if (
      quotation.status === 'CONFIRMED' ||
      quotation.status === 'CANCELLED'
    ) {
      return NextResponse.json(
        {
          error:
            'This quotation can no longer be negotiated',
        },
        { status: 400 }
      )
    }

    /*
     * If this is a line-level request, make sure
     * the line actually belongs to this quotation.
     */
    if (quotationLineId) {
      const lineBelongsToQuote =
        quotation.lines.some(
          (line) =>
            line.id === quotationLineId
        )

      if (!lineBelongsToQuote) {
        return NextResponse.json(
          {
            error:
              'Quotation line does not belong to this quotation',
          },
          { status: 400 }
        )
      }
    }

    /*
     * Validate discount.
     */
    let discount = null

    if (proposedDiscount !== undefined &&
        proposedDiscount !== null &&
        proposedDiscount !== '') {
      discount = Number(proposedDiscount)

      if (
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > 100
      ) {
        return NextResponse.json(
          {
            error:
              'Discount must be between 0 and 100',
          },
          { status: 400 }
        )
      }
    }

    /*
     * Validate quantity.
     */
    let quantity = null

    if (proposedQuantity !== undefined &&
        proposedQuantity !== null &&
        proposedQuantity !== '') {
      quantity = Number(proposedQuantity)

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              'Quantity must be greater than zero',
          },
          { status: 400 }
        )
      }
    }

    /*
     * Require appropriate data for the
     * corresponding negotiation type.
     */
    if (
      type === 'DISCOUNT' &&
      discount === null
    ) {
      return NextResponse.json(
        {
          error:
            'A proposed discount is required',
        },
        { status: 400 }
      )
    }

    if (
      type === 'QUANTITY' &&
      quantity === null
    ) {
      return NextResponse.json(
        {
          error:
            'A proposed quantity is required',
        },
        { status: 400 }
      )
    }

    if (
      (type === 'LINE_CHANGE' ||
        type === 'COMMENT') &&
      !String(message || '').trim()
    ) {
      return NextResponse.json(
        {
          error:
            'A message is required for this request',
        },
        { status: 400 }
      )
    }

    /*
     * Prevent duplicate pending requests for
     * the exact same quotation/line/type.
     */
    const existingPending =
      await prisma.negotiationRequest.findFirst({
        where: {
          quotationId: quotation.id,
          customerId: customer.id,
          quotationLineId:
            quotationLineId || null,
          type,
          status: 'PENDING',
        },
      })

    if (existingPending) {
      return NextResponse.json(
        {
          error:
            'There is already a pending request of this type',
        },
        { status: 409 }
      )
    }

    const result =
      await prisma.$transaction(async (tx) => {
        /*
         * Create the real negotiation record.
         */
        const negotiation =
          await tx.negotiationRequest.create({
            data: {
              quotationId: quotation.id,
              customerId: customer.id,
              quotationLineId:
                quotationLineId || null,
              type,
              proposedDiscount:
                discount,
              proposedQuantity:
                quantity,
              message:
                message
                  ? String(message).trim()
                  : null,
              status: 'PENDING',
            },

            select: {
              id: true,
              quotationId: true,
              quotationLineId: true,
              type: true,
              proposedDiscount: true,
              proposedQuantity: true,
              message: true,
              status: true,
              createdAt: true,
            },
          })

        /*
         * Move the quotation into the negotiation
         * stage so the Sales Workspace can see that
         * the customer has interacted with it.
         */
        await tx.quotation.update({
          where: {
            id: quotation.id,
          },

          data: {
            status: 'UNDER_NEGOTIATION',
            lastActivityAt: new Date(),
          },
        })

        /*
         * Audit trail.
         *
         * AuditLog.actorId is for internal User records,
         * so the customer action is represented through
         * the quotation + negotiation relationship.
         */
        await tx.auditLog.create({
          data: {
            quotationId: quotation.id,
            action: 'CUSTOMER_NEGOTIATION_REQUESTED',
            entityType: 'NegotiationRequest',
            entityId: negotiation.id,
            details: {
              customerId: customer.id,
              type,
              quotationLineId:
                quotationLineId || null,
              proposedDiscount:
                discount,
              proposedQuantity:
                quantity,
              message:
                message
                  ? String(message).trim()
                  : null,
            },
          },
        })

        return negotiation
      })

    return NextResponse.json(
      {
        success: true,
        negotiation: result,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Customer negotiation error:',
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