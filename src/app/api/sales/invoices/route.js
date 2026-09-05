import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const roundMoney = (value) =>
  Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100

function addInterval(date, interval) {
  const next = new Date(date)

  if (interval === 'MONTHLY') {
    next.setMonth(next.getMonth() + 1)
  }

  if (interval === 'QUARTERLY') {
    next.setMonth(next.getMonth() + 3)
  }

  if (interval === 'YEARLY') {
    next.setFullYear(next.getFullYear() + 1)
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

/*
 * Generate the one-time invoice and recurring billing
 * schedule for an approved quotation.
 *
 * This function is intentionally idempotent:
 * running it multiple times will NOT create duplicate
 * one-time invoices.
 */
async function generateInvoiceForQuotation(
  quotationId
) {
  return prisma.$transaction(async (tx) => {
    const quotation =
      await tx.quotation.findUnique({
        where: {
          id: quotationId,
        },

        include: {
          customer: true,

          lines: {
            include: {
              product: true,
              subscriptionPlan: true,
            },
          },
        },
      })

    if (!quotation) {
      throw new Error(
        'Quotation not found'
      )
    }

    /*
     * Invoice generation is triggered by approval.
     *
     * CONFIRMED is also accepted so older confirmed
     * quotations can still be brought into billing.
     */
    if (
      quotation.status !== 'APPROVED' &&
      quotation.status !== 'CONFIRMED'
    ) {
      throw new Error(
        'Invoices can only be generated for approved quotations'
      )
    }

    const oneTimeLines =
      quotation.lines.filter(
        (line) =>
          line.lineType === 'ONE_TIME'
      )

    const recurringLines =
      quotation.lines.filter(
        (line) =>
          line.lineType === 'RECURRING'
      )

    /*
     * -------------------------------------------------------
     * CHECK EXISTING ONE-TIME INVOICE
     * -------------------------------------------------------
     */

    let invoice =
      await tx.invoice.findFirst({
        where: {
          quotationId,
          type: 'ONE_TIME',
        },

        include: {
          lines: true,
        },
      })

    /*
     * -------------------------------------------------------
     * CREATE ONE-TIME INVOICE
     * -------------------------------------------------------
     */

    if (
      oneTimeLines.length > 0 &&
      !invoice
    ) {
      const invoiceLines =
        oneTimeLines.map((line) => {
          const quantity =
            Number(line.quantity)

          const unitPrice =
            Number(line.unitPrice)

          const discount =
            Number(
              line.discountPercent || 0
            )

          const tax =
            Number(
              line.taxPercentSnapshot || 0
            )

          const gross =
            quantity * unitPrice

          const lineAmount =
            roundMoney(
              gross *
                (1 -
                  discount / 100)
            )

          return {
            productId:
              line.productId,

            description:
              line.product?.name ||
              'Product',

            lineType:
              line.lineType,

            quantity,

            unitPrice,

            discountPercent:
              discount,

            taxPercent:
              tax,

            lineAmount,
          }
        })

      const subtotal =
        roundMoney(
          invoiceLines.reduce(
            (sum, line) =>
              sum + line.lineAmount,
            0
          )
        )

      const taxAmount =
        roundMoney(
          invoiceLines.reduce(
            (sum, line) =>
              sum +
              line.lineAmount *
                (line.taxPercent / 100),
            0
          )
        )

      const totalAmount =
        roundMoney(
          subtotal + taxAmount
        )

      /*
       * Unique invoice number.
       */
      const invoiceNumber =
        `INV-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )
          .toString()
          .padStart(3, '0')}`

      const issueDate =
        new Date()

      const dueDate =
        new Date(issueDate)

      /*
       * Hackathon default payment term:
       * 30 days.
       */
      dueDate.setDate(
        dueDate.getDate() + 30
      )

      invoice =
        await tx.invoice.create({
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
              create: invoiceLines,
            },
          },

          include: {
            lines: true,
          },
        })

      /*
       * Audit invoice generation.
       */
      await tx.auditLog.create({
        data: {
          quotationId,

          action:
            'INVOICE_AUTO_GENERATED',

          entityType:
            'Invoice',

          entityId:
            invoice.id,

          details: {
            invoiceNumber:
              invoice.invoiceNumber,

            invoiceType:
              'ONE_TIME',

            source:
              'quotation_approved',
          },
        },
      })
    }

    /*
     * -------------------------------------------------------
     * RECURRING BILLING SCHEDULE
     * -------------------------------------------------------
     *
     * Recurring quotation lines do not become one-time
     * invoices. They get billing schedule entries.
     */

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

      if (existingSchedule) {
        continue
      }

      const start =
        quotation.confirmedAt ||
        quotation.approvedAt ||
        new Date()

      const interval =
        line.subscriptionPlan
          ?.billingInterval ||
        'MONTHLY'

      const end =
        addInterval(
          start,
          interval
        )

      const amount =
        roundMoney(
          Number(line.quantity) *
            Number(line.unitPrice) *
            (1 -
              Number(
                line.discountPercent || 0
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

    return invoice
  })
}

/*
 * ---------------------------------------------------------
 * GET INVOICES
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * Before returning invoices, automatically generate missing
 * invoices for every APPROVED quotation visible to this
 * user.
 *
 * Therefore there is NO manual "Generate Invoice" step.
 */
export async function GET() {
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

    /*
     * Sales Rep:
     * only their own quotations.
     *
     * Manager / Finance:
     * all quotations.
     */

    const quotationWhere =
      user.role === 'SALES_REP'
        ? {
            ownerId: user.id,
          }
        : {}

    /*
     * Find approved quotations.
     */
    const approvedQuotations =
      await prisma.quotation.findMany({
        where: {
          ...quotationWhere,

          status: {
            in: [
              'APPROVED',
              'CONFIRMED',
            ],
          },
        },

        select: {
          id: true,
        },
      })

    /*
     * Automatically generate missing invoices.
     *
     * Promise.all is intentionally used here because
     * each quotation is independent.
     *
     * The helper itself is idempotent.
     */

    await Promise.all(
      approvedQuotations.map(
        async (quotation) => {
          try {
            await generateInvoiceForQuotation(
              quotation.id
            )
          } catch (error) {
            /*
             * One broken quotation should not make the
             * entire invoice list unavailable.
             */
            console.error(
              `Auto invoice generation failed for quotation ${quotation.id}:`,
              error
            )
          }
        }
      )
    )

    /*
     * -------------------------------------------------------
     * LOAD INVOICES
     * -------------------------------------------------------
     */

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
      {
        status: 500,
      }
    )
  }
}

/*
 * ---------------------------------------------------------
 * POST
 * ---------------------------------------------------------
 *
 * Kept for backwards compatibility.
 *
 * If something in the existing UI/API still calls
 * POST /api/sales/invoices, it will work.
 *
 * The user no longer needs to use this manually.
 */
export async function POST(
  request
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
        {
          status: 400,
        }
      )
    }

    const quotation =
      await prisma.quotation.findUnique({
        where: {
          id: quotationId,
        },

        select: {
          id: true,
          ownerId: true,
          status: true,
        },
      })

    if (!quotation) {
      return NextResponse.json(
        {
          error:
            'Quotation not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Ownership check.
     */

    if (
      quotation.ownerId !== user.id &&
      user.role !== 'SALES_MANAGER' &&
      user.role !== 'FINANCE'
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

    /*
     * Only approved/confirmed quotations.
     */

    if (
      quotation.status !== 'APPROVED' &&
      quotation.status !== 'CONFIRMED'
    ) {
      return NextResponse.json(
        {
          error:
            'Invoice can only be generated for an approved quotation',
        },
        {
          status: 400,
        }
      )
    }

    const invoice =
      await generateInvoiceForQuotation(
        quotationId
      )

    return NextResponse.json(
      {
        success: true,

        message:
          'Invoice generated successfully',

        invoiceId:
          invoice?.id || null,

        invoiceNumber:
          invoice?.invoiceNumber || null,
      },
      {
        status: 201,
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
          error.message ||
          'Failed to generate invoice',
      },
      {
        status: 500,
      }
    )
  }
}