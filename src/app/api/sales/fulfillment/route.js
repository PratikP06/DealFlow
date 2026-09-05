import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()

    if (
      !session ||
      session.type !== 'internal'
    ) {
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
            ownerId: user.id,
            status: {
              in: [
                'APPROVED',
                'CONFIRMED',
              ],
            },
          }
        : {
            status: {
              in: [
                'APPROVED',
                'CONFIRMED',
              ],
            },
          }

    const quotations =
      await prisma.quotation.findMany({
        where,

        select: {
          id: true,
          quoteNumber: true,
          status: true,
          fulfillmentStatus: true,
          deliveryPromiseDate: true,
          updatedAt: true,

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
              quantity: true,
              lineType: true,

              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  type: true,
                },
              },

              allocations: {
                select: {
                  id: true,
                  warehouseId: true,
                  allocatedQuantity: true,
                  backorderQuantity: true,
                  status: true,

                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                      location: true,
                    },
                  },
                },

                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          },
        },

        orderBy: {
          updatedAt: 'desc',
        },
      })

    return NextResponse.json({
      quotations,
    })
  } catch (error) {
    console.error(
      'Fulfillment list error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to fetch fulfillment data',
      },
      { status: 500 }
    )
  }
}