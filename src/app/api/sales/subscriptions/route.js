import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    const where =
      user.role === 'SALES_REP'
        ? {
            lineType: 'RECURRING',
            quotation: {
              ownerId: user.id,
            },
          }
        : {
            lineType: 'RECURRING',
          }

    const subscriptions =
      await prisma.quotationLine.findMany({
        where,

        select: {
          id: true,
          quotationId: true,
          productId: true,
          subscriptionPlanId: true,
          lineType: true,
          quantity: true,
          unitPrice: true,
          discountPercent: true,
          taxPercentSnapshot: true,
          createdAt: true,
          updatedAt: true,

          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              type: true,
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
              ownerId: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  tier: true,
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
            },
            orderBy: {
              billingDate: 'asc',
            },
          },
        },

        orderBy: {
          updatedAt: 'desc',
        },
      })

    const formatted = subscriptions.map(
      (subscription) => {
        const upcomingBilling =
          subscription.billingSchedules.find(
            (entry) =>
              entry.status === 'SCHEDULED'
          )

        return {
          id: subscription.id,

          quotation: subscription.quotation,

          product: subscription.product,

          plan: subscription.subscriptionPlan,

          quantity: subscription.quantity,
          unitPrice: subscription.unitPrice,
          discountPercent:
            subscription.discountPercent,
          taxPercent:
            subscription.taxPercentSnapshot,

          quotationStatus:
            subscription.quotation.status,

          nextBillingDate:
            upcomingBilling?.billingDate || null,

          nextBillingAmount:
            upcomingBilling?.amount || null,

          billingScheduleCount:
            subscription.billingSchedules.length,

          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        }
      }
    )

    return NextResponse.json(formatted)
  } catch (error) {
    console.error(
      'Sales subscriptions GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to fetch subscriptions',
      },
      { status: 500 }
    )
  }
}