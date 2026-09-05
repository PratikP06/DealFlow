import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const session = await getSession()

    if (!session || session.type !== 'internal') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        role: true,
      },
    })

    if (!user || user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params

    const subscription =
      await prisma.quotationLine.findFirst({
        where: {
          id,
          lineType: 'RECURRING',

          ...(user.role === 'SALES_REP'
            ? {
                quotation: {
                  ownerId: user.id,
                },
              }
            : {}),
        },

        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              description: true,
              type: true,
              price: true,
              costPrice: true,
              marginPercent: true,
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
              isActive: true,
            },
          },

          quotation: {
            select: {
              id: true,
              quoteNumber: true,
              status: true,
              blendedRiskScore: true,
              approvalRound: true,
              fulfillmentStatus: true,
              deliveryPromiseDate: true,
              createdAt: true,
              updatedAt: true,

              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  tier: true,
                },
              },

              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },

              invoices: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  type: true,
                  status: true,
                  subtotal: true,
                  taxAmount: true,
                  totalAmount: true,
                  paidAmount: true,
                  creditAmount: true,
                  issueDate: true,
                  dueDate: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },

          billingSchedules: {
            select: {
              id: true,
              periodStart: true,
              periodEnd: true,
              billingDate: true,
              quantity: true,
              amount: true,
              status: true,
              invoiceId: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              billingDate: 'asc',
            },
          },
        },
      })

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'Subscription not found',
        },
        { status: 404 }
      )
    }

    const upcomingBilling =
      subscription.billingSchedules.filter(
        (entry) =>
          entry.status === 'SCHEDULED'
      )

    return NextResponse.json({
      id: subscription.id,

      quotation: subscription.quotation,

      product: subscription.product,

      plan: subscription.subscriptionPlan,

      line: {
        lineType: subscription.lineType,
        quantity: subscription.quantity,
        unitPrice: subscription.unitPrice,
        discountPercent:
          subscription.discountPercent,
        taxPercent:
          subscription.taxPercentSnapshot,
        marginPercent:
          subscription.marginPercentSnapshot,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },

      billing: {
        nextBillingDate:
          upcomingBilling[0]?.billingDate ||
          null,

        nextBillingAmount:
          upcomingBilling[0]?.amount ||
          null,

        upcoming: upcomingBilling,

        allEntries:
          subscription.billingSchedules,
      },

      invoices:
        subscription.quotation.invoices,
    })
  } catch (error) {
    console.error(
      'Sales subscription detail GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to fetch subscription',
      },
      { status: 500 }
    )
  }
}