import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
        tier: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    /*
     * -------------------------------------------------------
     * CUSTOMER QUOTATIONS
     * -------------------------------------------------------
     *
     * Customers can see quotations that have reached the
     * customer-facing stage.
     *
     * DRAFT and PENDING_APPROVAL remain internal.
     *
     * APPROVED is included because low-risk quotations are
     * automatically approved by the sales quotation API.
     *
     * SENT is included for quotations explicitly sent to
     * the customer.
     *
     * UNDER_NEGOTIATION is included while the customer and
     * sales team are negotiating.
     *
     * CONFIRMED is included so the customer can still view
     * confirmed quotations.
     */

    const quotations = await prisma.quotation.findMany({
      where: {
        customerId: customer.id,

        status: {
          in: [
            'APPROVED',
            'SENT',
            'UNDER_NEGOTIATION',
            'CONFIRMED',
          ],
        },
      },

      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        lines: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                type: true,
                unit: true,
                taxPercent: true,

                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },

            subscriptionPlan: {
              select: {
                id: true,
                name: true,
                price: true,
                billingInterval: true,
                durationMonths: true,
                prorationEnabled: true,
                cancellationCreditEnabled: true,
              },
            },

            negotiationRequests: {
              orderBy: {
                createdAt: 'desc',
              },

              select: {
                id: true,
                quotationLineId: true,
                type: true,
                proposedDiscount: true,
                proposedQuantity: true,
                message: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                resolvedAt: true,
              },
            },
          },
        },

        negotiations: {
          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            quotationLineId: true,
            type: true,
            proposedDiscount: true,
            proposedQuantity: true,
            message: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            resolvedAt: true,

            resolvedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        billingSchedules: {
          orderBy: {
            billingDate: 'asc',
          },

          select: {
            id: true,
            quotationLineId: true,
            periodStart: true,
            periodEnd: true,
            billingDate: true,
            quantity: true,
            amount: true,
            status: true,
          },
        },
      },

      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      customer,
      quotations,
    })
  } catch (error) {
    console.error(
      'Customer quotations error:',
      error
    )

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}