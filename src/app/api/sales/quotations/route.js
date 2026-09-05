import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateRiskFromLines } from '@/lib/risk'

export async function GET() {
  const session = await getSession()

  if (!session || session.type !== 'internal') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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

  try {
    const quotations = await prisma.quotation.findMany({
      where: {
        ownerId: user.id,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            tier: true,
            email: true,
          },
        },

        lines: {
          include: {
            product: {
              include: {
                category: true,
              },
            },

            subscriptionPlan: true,
          },
        },

        approvalSteps: {
          include: {
            actedBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(quotations)
  } catch (error) {
    console.error('Get quotations error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const session = await getSession()

  if (!session || session.type !== 'internal') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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

  try {
    const data = await request.json()

    const {
      customerId,
      lines,
      status,
      deliveryPromiseDate,
    } = data

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json(
        {
          error: 'Customer and at least one line required',
        },
        { status: 400 }
      )
    }

    /*
     * -------------------------------------------------------
     * CUSTOMER
     * -------------------------------------------------------
     */

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },

      include: {
        priceList: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    /*
     * DiscountTierRule is a separate model.
     * It is keyed by Customer.tier.
     */

    const discountTierRule =
      await prisma.discountTierRule.findUnique({
        where: {
          tier: customer.tier,
        },
      })

    const tierMaxDiscount = Number(
      discountTierRule?.maxDiscountPercent ?? 0
    )

    /*
     * -------------------------------------------------------
     * PROCESS QUOTATION LINES
     * -------------------------------------------------------
     */

    const processedLines = []

    /*
     * These are passed to the centralized risk calculator.
     */
    const riskLines = []

    for (const line of lines) {
      const product = await prisma.product.findUnique({
        where: {
          id: line.productId,
        },

        include: {
          category: true,
        },
      })

      if (!product) {
        return NextResponse.json(
          {
            error: `Product ${line.productId} not found`,
          },
          { status: 400 }
        )
      }

      const requestedDiscount = Number(
        line.discountPercent || 0
      )

      /*
       * -----------------------------------------------------
       * PRICE
       * -----------------------------------------------------
       *
       * Customer price list takes priority over
       * the product's default price.
       */

      let unitPrice = Number(
        line.unitPrice || product.price
      )

      if (customer.priceList) {
        const priceListItem =
          await prisma.priceListItem.findUnique({
            where: {
              priceListId_productId: {
                priceListId: customer.priceList.id,
                productId: product.id,
              },
            },
          })

        if (priceListItem) {
          unitPrice = Number(
            priceListItem.price
          )
        }
      }

      const quantity = Number(
        line.quantity
      )

      /*
       * -----------------------------------------------------
       * RISK INPUT
       * -----------------------------------------------------
       *
       * The actual blended risk calculation happens
       * centrally in src/lib/risk.js.
       */

      riskLines.push({
        productId: product.id,

        discountPercent:
          requestedDiscount,

        product: {
          category: {
            discountCeilingPercent:
              product.category
                ?.discountCeilingPercent || 0,
          },
        },
      })

      /*
       * -----------------------------------------------------
       * QUOTATION LINE
       * -----------------------------------------------------
       *
       * We calculate the snapshot values here as well,
       * using the same formula as risk.js.
       */

      const categoryMaxDiscount = Number(
        product.category
          ?.discountCeilingPercent ?? 0
      )

      const allowedDiscount = Math.min(
        tierMaxDiscount,
        categoryMaxDiscount
      )

      const discountOverage = Math.max(
        0,
        requestedDiscount - allowedDiscount
      )

      processedLines.push({
        productId: product.id,

        subscriptionPlanId:
          line.subscriptionPlanId || null,

        lineType:
          line.lineType || 'ONE_TIME',

        quantity,

        unitPrice,

        discountPercent:
          requestedDiscount,

        allowedDiscountPercentSnapshot:
          allowedDiscount,

        discountOveragePercent:
          discountOverage,

        taxPercentSnapshot:
          Number(
            product.taxPercent || 0
          ),

        marginPercentSnapshot:
          product.marginPercent
            ? Number(product.marginPercent)
            : null,

        isUpsellAdd:
          line.isUpsellAdd || false,
      })
    }

    /*
     * -------------------------------------------------------
     * CENTRALIZED BLENDED RISK CALCULATION
     * -------------------------------------------------------
     */

    const riskResult = calculateRiskFromLines({
      customerDiscountLimit:
        tierMaxDiscount,

      lines: riskLines,
    })

    const blendedRiskScore =
      riskResult.blendedRiskScore

    /*
     * -------------------------------------------------------
     * APPROVAL REQUIREMENT
     * -------------------------------------------------------
     */

    const approvalRequired =
      riskResult.approvalRequired

    /*
     * -------------------------------------------------------
     * QUOTATION NUMBER
     * -------------------------------------------------------
     */

    const quoteNumber =
      `Q-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 10000)
      ).padStart(4, '0')}`

    /*
     * -------------------------------------------------------
     * CREATE QUOTATION
     * -------------------------------------------------------
     */

    const quotation =
      await prisma.quotation.create({
        data: {
          quoteNumber,

          customerId,

          ownerId: user.id,

          status:
            status || 'DRAFT',

          blendedRiskScore,

          approvalRound: 0,

          fulfillmentStatus:
            'PENDING',

          deliveryPromiseDate:
            deliveryPromiseDate
              ? new Date(
                  deliveryPromiseDate
                )
              : null,

          lastActivityAt:
            new Date(),

          lines: {
            create: processedLines,
          },
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              tier: true,
              email: true,
            },
          },

          lines: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },

              subscriptionPlan: true,
            },
          },
        },
      })

    /*
     * -------------------------------------------------------
     * AUDIT LOG
     * -------------------------------------------------------
     */

    await prisma.auditLog.create({
      data: {
        quotationId:
          quotation.id,

        actorId:
          user.id,

        action:
          status === 'PENDING_APPROVAL'
            ? 'QUOTE_SUBMITTED'
            : 'QUOTE_CREATED',

        entityType:
          'Quotation',

        entityId:
          quotation.id,

        details: {
          source: 'sales_rep',

          status:
            status || 'DRAFT',

          blendedRiskScore,

          approvalRequired,

          requiredRoles:
            riskResult.requiredRoles,
        },
      },
    })

    /*
     * -------------------------------------------------------
     * AUTOMATIC APPROVAL ROUTING
     * -------------------------------------------------------
     */

    if (
      status === 'PENDING_APPROVAL' &&
      approvalRequired
    ) {
      /*
       * Use configured ApprovalRules if available.
       *
       * The risk score decides whether approval is needed.
       * The ApprovalRule decides the configured chain.
       */

      const approvalRules =
        await prisma.approvalRule.findMany({
          where: {
            isActive: true,
          },

          orderBy: {
            priority: 'desc',
          },
        })

      let matchedRule = null

      for (const rule of approvalRules) {
        const minRisk =
          Number(rule.minRiskScore)

        const maxRisk =
          rule.maxRiskScore !== null
            ? Number(rule.maxRiskScore)
            : Infinity

        if (
          blendedRiskScore >= minRisk &&
          blendedRiskScore <= maxRisk
        ) {
          matchedRule = rule
          break
        }
      }

      /*
       * If a configured rule matches, use it.
       * Otherwise fall back to the centralized risk routing.
       */

      const requiredRoles =
        matchedRule?.requiredRoles?.length
          ? matchedRule.requiredRoles
          : riskResult.requiredRoles

      for (
        let i = 0;
        i < requiredRoles.length;
        i++
      ) {
        await prisma.approvalStep.create({
          data: {
            quotationId:
              quotation.id,

            approvalRound:
              1,

            stepOrder:
              i + 1,

            approverRole:
              requiredRoles[i],

            status:
              'PENDING',
          },
        })
      }

      await prisma.quotation.update({
        where: {
          id: quotation.id,
        },

        data: {
          approvalRound: 1,

          status:
            'PENDING_APPROVAL',
        },
      })
    }

    /*
     * -------------------------------------------------------
     * FINAL RESPONSE
     * -------------------------------------------------------
     */

    const finalQuotation =
      await prisma.quotation.findUnique({
        where: {
          id: quotation.id,
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              tier: true,
              email: true,
            },
          },

          lines: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },

              subscriptionPlan: true,
            },
          },

          approvalSteps: {
            include: {
              actedBy: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

    return NextResponse.json(
      finalQuotation
    )
  } catch (error) {
    console.error(
      'Create quotation error:',
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