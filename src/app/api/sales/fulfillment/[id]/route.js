import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request,
  { params }
) {
  try {
    const session =
      await getSession()

    if (
      !session ||
      session.type !== 'internal'
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },

        select: {
          id: true,
          role: true,
        },
      })

    if (
      !user ||
      user.role === 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Quotation ID is required',
        },
        { status: 400 }
      )
    }

    const quotation =
      await prisma.quotation.findUnique({
        where: {
          id,
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
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  type: true,
                  unit: true,
                },
              },

              allocations: {
                include: {
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

            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

    if (!quotation) {
      return NextResponse.json(
        {
          error:
            'Quotation not found',
        },
        { status: 404 }
      )
    }

    /*
     * Sales reps may only see their own
     * quotations.
     *
     * Managers and Finance may review
     * quotations across the workspace.
     */
    if (
      quotation.ownerId !== user.id &&
      user.role !== 'SALES_MANAGER' &&
      user.role !== 'FINANCE'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    /*
     * Fulfillment tracking only makes
     * sense after the commercial quote
     * has been approved/confirmed.
     */
    if (
      ![
        'APPROVED',
        'CONFIRMED',
      ].includes(
        quotation.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Fulfillment is available after quotation approval',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      quotation
    )
  } catch (error) {
    console.error(
      'Fulfillment detail error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to fetch fulfillment detail',
      },
      { status: 500 }
    )
  }
}