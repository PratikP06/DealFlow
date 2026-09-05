import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getInternalUser() {
  const session = await getSession()

  if (
    !session ||
    session.type !== 'internal'
  ) {
    return null
  }

  return prisma.user.findUnique({
    where: {
      id: session.userId,
    },

    select: {
      id: true,
      role: true,
    },
  })
}

/*
 * GET
 *
 * Returns one complete invoice.
 */
export async function GET(
  request,
  { params }
) {
  try {
    const user =
      await getInternalUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Forbidden',
        },
        {
          status: 403,
        }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Invoice ID is required',
        },
        {
          status: 400,
        }
      )
    }

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id,
        },

        include: {
          quotation: {
            include: {
              customer: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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
                  unit: true,
                },
              },
            },
          },

          payments: {
            orderBy: {
              paidAt: 'desc',
            },
          },

          billingEntries: {
            orderBy: {
              billingDate: 'asc',
            },

            include: {
              quotationLine: {
                include: {
                  product: {
                    select: {
                      id: true,
                      sku: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

    if (!invoice) {
      return NextResponse.json(
        {
          error: 'Invoice not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Sales representatives can only see invoices
     * belonging to quotations they own.
     *
     * Managers and Finance can see all invoices.
     */
    if (
      user.role === 'SALES_REP' &&
      invoice.quotation.ownerId !==
        user.id
    ) {
      return NextResponse.json(
        {
          error: 'Forbidden',
        },
        {
          status: 403,
        }
      )
    }

    const total =
      Number(
        invoice.totalAmount || 0
      )

    const paid =
      Number(
        invoice.paidAmount || 0
      )

    const credit =
      Number(
        invoice.creditAmount || 0
      )

    const outstanding =
      Math.max(
        0,
        total - paid - credit
      )

    return NextResponse.json({
      invoice,

      outstandingAmount:
        outstanding,
    })
  } catch (error) {
    console.error(
      'Get invoice detail error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load invoice',
      },
      {
        status: 500,
      }
    )
  }
}

/*
 * POST
 *
 * Records a payment against the invoice.
 */
export async function POST(
  request,
  { params }
) {
  try {
    const user =
      await getInternalUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Forbidden',
        },
        {
          status: 403,
        }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Invoice ID is required',
        },
        {
          status: 400,
        }
      )
    }

    const body =
      await request.json()

    const amount =
      Number(body.amount)

    const method =
      body.method

    const reference =
      body.reference?.trim() ||
      null

    const paidAt =
      body.paidAt
        ? new Date(body.paidAt)
        : new Date()

    /*
     * Validate amount.
     */
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            'Payment amount must be greater than zero',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Match Prisma PaymentMethod enum.
     */
    const validMethods = [
      'CASH',
      'BANK_TRANSFER',
      'CARD',
      'UPI',
      'OTHER',
    ]

    if (
      !validMethods.includes(method)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid payment method',
        },
        {
          status: 400,
        }
      )
    }

    if (
      Number.isNaN(
        paidAt.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid payment date',
        },
        {
          status: 400,
        }
      )
    }

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id,
        },

        include: {
          quotation: {
            select: {
              ownerId: true,
            },
          },
        },
      })

    if (!invoice) {
      return NextResponse.json(
        {
          error:
            'Invoice not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Sales Rep can only operate on their
     * own quotations.
     */
    if (
      user.role === 'SALES_REP' &&
      invoice.quotation.ownerId !==
        user.id
    ) {
      return NextResponse.json(
        {
          error: 'Forbidden',
        },
        {
          status: 403,
        }
      )
    }

    if (
      invoice.status === 'VOID'
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot record payment on a void invoice',
        },
        {
          status: 400,
        }
      )
    }

    const total =
      Number(
        invoice.totalAmount || 0
      )

    const alreadyPaid =
      Number(
        invoice.paidAmount || 0
      )

    const credit =
      Number(
        invoice.creditAmount || 0
      )

    const outstanding =
      Math.max(
        0,
        total -
          alreadyPaid -
          credit
      )

    if (amount > outstanding + 0.01) {
      return NextResponse.json(
        {
          error:
            `Payment exceeds outstanding amount of ₹${outstanding.toFixed(
              2
            )}`,
        },
        {
          status: 400,
        }
      )
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const payment =
            await tx.payment.create({
              data: {
                invoiceId: id,

                amount,

                method,

                reference,

                paidAt,
              },
            })

          const newPaidAmount =
            alreadyPaid + amount

          const newOutstanding =
            Math.max(
              0,
              total -
                newPaidAmount -
                credit
            )

          let newStatus =
            'PARTIALLY_PAID'

          if (
            newOutstanding <=
            0.01
          ) {
            newStatus = 'PAID'
          }

          const updatedInvoice =
            await tx.invoice.update({
              where: {
                id,
              },

              data: {
                paidAmount:
                  newPaidAmount,

                status:
                  newStatus,
              },
            })

          await tx.auditLog.create({
            data: {
              quotationId:
                invoice.quotation
                  ? undefined
                  : undefined,

              actorId: user.id,

              action:
                'INVOICE_PAYMENT_RECORDED',

              entityType:
                'Invoice',

              entityId: id,

              details: {
                paymentId:
                  payment.id,

                amount,

                method,

                reference,
              },
            },
          })

          return {
            payment,
            invoice:
              updatedInvoice,
          }
        }
      )

    return NextResponse.json({
      success: true,

      payment:
        result.payment,

      invoice:
        result.invoice,
    })
  } catch (error) {
    console.error(
      'Record invoice payment error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to record payment',
      },
      {
        status: 500,
      }
    )
  }
}