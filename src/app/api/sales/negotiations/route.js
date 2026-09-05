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
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (
      !user ||
      !user.isActive ||
      user.role === 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    /*
     * Sales Rep:
     *   Only sees negotiations belonging to
     *   quotations they own.
     *
     * Sales Manager / Finance:
     *   Can see all negotiation requests.
     */

    const where =
      user.role === 'SALES_REP'
        ? {
            quotation: {
              ownerId: user.id,
            },
          }
        : {}

    const negotiations =
      await prisma.negotiationRequest.findMany({
        where,

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              tier: true,
            },
          },

          quotation: {
            select: {
              id: true,
              quoteNumber: true,
              status: true,
              blendedRiskScore: true,
              approvalRound: true,
              ownerId: true,
              lastActivityAt: true,
            },
          },

          quotationLine: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              discountPercent: true,

              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  price: true,
                  taxPercent: true,

                  category: {
                    select: {
                      id: true,
                      name: true,
                      discountCeilingPercent: true,
                    },
                  },
                },
              },
            },
          },

          resolvedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },

        orderBy: [
          {
            status: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      })

    return NextResponse.json({
      negotiations,
    })
  } catch (error) {
    console.error(
      'Get sales negotiations error:',
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