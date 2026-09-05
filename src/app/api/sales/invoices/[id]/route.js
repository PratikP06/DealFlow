import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const roundMoney = (value) =>
  Math.round(
    (Number(value) +
      Number.EPSILON) *
      100
  ) / 100

const addInterval = (
  date,
  interval
) => {
  const next = new Date(date)

  if (interval === 'MONTHLY') {
    next.setMonth(
      next.getMonth() + 1
    )
  }

  if (interval === 'QUARTERLY') {
    next.setMonth(
      next.getMonth() + 3
    )
  }

  if (interval === 'YEARLY') {
    next.setFullYear(
      next.getFullYear() + 1
    )
  }

  return next
}

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

export async function GET() {
  try {
    const user =
      await getInternalUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const where =
      user.role === 'SALES_REP'
        ? {
            quotation: {
              ownerId: user.id,
            },
          }
        : {}

    const invoices =
      await prisma.invoice.findMany({
        where,

        select: {
          id: true,
          invoiceNumber: true,
          quotationId: true,
          type: true,
          status: true,
          subtotal: true,
          taxAmount: true,
          totalAmount: true,
          paidAmount: true,
          creditAmount: true,
          creditReason: true,
          issueDate: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,

          quotation: {
            select: {
              id: true,
              quoteNumber: true,
              status: true,

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

          _count: {
            select: {
              payments: true,
              lines: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      })

    return NextResponse.json({
      invoices,
    })
  } catch (error) {
    console.error(
      'Sales invoices GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to fetch invoices',
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user =
      await getInternalUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body =
      await request.json()

    const quotationId =
      body?.quotationId

    if (!quotationId) {
      return NextResponse.json(
        {
          error:
            'quotationId is required',
        },
        { status: 400 }
      )
    }

    const quotation =
      await prisma.quotation.findUnique(
        {
          where: {
            id: quotationId,
          },

          include: {
            lines: {
              include: {
                product: true,
                subscriptionPlan: true,
              },
            },
          },
        }
      )

    if (!quotation) {
      return NextResponse.json(
        {
          error:
            'Quotation not found',
        },
        { status: 404 }
      )
    }

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

    if (
      quotation.status !==
      'CONFIRMED'
    ) {
      return NextResponse.json(
        {
          error:
            'Invoices can only be generated from confirmed quotations',
        },
        { status: 400 }
      )
    }

    const oneTimeLines =
      quotation.lines.filter(
        (line) =>
          line.lineType ===
          'ONE_TIME'
      )

    const recurringLines =
      quotation.lines.filter(
        (line) =>
          line.lineType ===
          'RECURRING'
      )

    const existingOneTime =
      await prisma.invoice.findFirst(
        {
          where: {
            quotationId,
            type: 'ONE_TIME',
          },

          select: {
            id: true,
            invoiceNumber: true,
          },
        }
      )

    const result =
      await prisma.$transaction(
        async (tx) => {
          let invoice = null

          if (
            oneTimeLines.length >
              0 &&
            !existingOneTime
          ) {
            const invoiceLines =
              oneTimeLines.map(
                (line) => {
                  const quantity =
                    Number(
                      line.quantity
                    )

                  const unitPrice =
                    Number(
                      line.unitPrice
                    )

                  const discount =
                    Number(
                      line.discountPercent ||
                        0
                    )

                  const tax =
                    Number(
                      line.taxPercentSnapshot ||
                        0
                    )

                  const gross =
                    quantity *
                    unitPrice

                  const lineAmount =
                    roundMoney(
                      gross *
                        (1 -
                          discount /
                            100)
                    )

                  return {
                    productId:
                      line.productId,

                    description:
                      line.product
                        .name,

                    lineType:
                      line.lineType,

                    quantity,
                    unitPrice,
                    discountPercent:
                      discount,
                    taxPercent: tax,
                    lineAmount,
                  }
                }
              )

            const subtotal =
              roundMoney(
                invoiceLines.reduce(
                  (
                    sum,
                    line
                  ) =>
                    sum +
                    line.lineAmount,
                  0
                )
              )

            const taxAmount =
              roundMoney(
                invoiceLines.reduce(
                  (
                    sum,
                    line
                  ) =>
                    sum +
                    line.lineAmount *
                      (line.taxPercent /
                        100),
                  0
                )
              )

            const totalAmount =
              roundMoney(
                subtotal +
                  taxAmount
              )

            const invoiceNumber =
              `INV-${Date.now()
                .toString()
                .slice(-8)}`

            const issueDate =
              new Date()

            const dueDate =
              new Date(
                issueDate
              )

            dueDate.setDate(
              dueDate.getDate() +
                30
            )

            invoice =
              await tx.invoice.create(
                {
                  data: {
                    invoiceNumber,
                    quotationId,

                    type: 'ONE_TIME',

                    status: 'ISSUED',

                    subtotal,
                    taxAmount,
                    totalAmount,

                    paidAmount: 0,
                    creditAmount: 0,

                    issueDate,
                    dueDate,

                    lines: {
                      create:
                        invoiceLines,
                    },
                  },
                }
              )
          }

          if (
            recurringLines.length >
            0
          ) {
            for (
              const line of recurringLines
            ) {
              const existingSchedule =
                await tx.billingScheduleEntry.findFirst(
                  {
                    where: {
                      quotationLineId:
                        line.id,
                    },
                  }
                )

              if (
                existingSchedule
              ) {
                continue
              }

              const start =
                quotation.confirmedAt ||
                new Date()

              const end =
                addInterval(
                  start,
                  line
                    .subscriptionPlan
                    ?.billingInterval
                )

              const amount =
                roundMoney(
                  Number(
                    line.quantity
                  ) *
                    Number(
                      line.unitPrice
                    ) *
                    (1 -
                      Number(
                        line.discountPercent ||
                          0
                      ) /
                        100) *
                    (1 +
                      Number(
                        line.taxPercentSnapshot ||
                          0
                      ) /
                        100)
                )

              await tx.billingScheduleEntry.create(
                {
                  data: {
                    quotationId,

                    quotationLineId:
                      line.id,

                    periodStart:
                      start,

                    periodEnd:
                      end,

                    billingDate:
                      start,

                    quantity:
                      line.quantity,

                    amount,

                    status:
                      'SCHEDULED',
                  },
                }
              )
            }
          }

          return invoice
        }
      )

    return NextResponse.json(
      {
        message:
          existingOneTime
            ? 'Invoice already exists'
            : 'Billing generated successfully',

        invoiceId:
          result?.id ||
          existingOneTime?.id ||
          null,

        invoiceNumber:
          result?.invoiceNumber ||
          existingOneTime?.invoiceNumber ||
          null,

        recurringSchedulesCreated:
          recurringLines.length >
          0,
      },

      {
        status:
          existingOneTime
            ? 200
            : 201,
      }
    )
  } catch (error) {
    console.error(
      'Sales invoice generation error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to generate invoice',
      },
      { status: 500 }
    )
  }
}