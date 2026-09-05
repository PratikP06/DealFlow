import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      role: true
    }
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
        ownerId: user.id
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            tier: true,
            email: true
          }
        },
        lines: {
          include: {
            product: {
              include: {
                category: true
              }
            },
            subscriptionPlan: true
          }
        },
        approvalSteps: {
          include: {
            actedBy: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
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
      role: true
    }
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
      deliveryPromiseDate
    } = data

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Customer and at least one line required' },
        { status: 400 }
      )
    }

    /*
     * Customer has:
     * - tier
     * - priceList
     *
     * DiscountTierRule is a separate model keyed by tier.
     */
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId
      },
      include: {
        priceList: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const discountTierRule =
      await prisma.discountTierRule.findUnique({
        where: {
          tier: customer.tier
        }
      })

    const tierMaxDiscount = Number(
      discountTierRule?.maxDiscountPercent ?? 0
    )

    const processedLines = []
    let blendedRiskScore = 0

    for (const line of lines) {
      const product = await prisma.product.findUnique({
        where: {
          id: line.productId
        },
        include: {
          category: true
        }
      })

      if (!product) {
        return NextResponse.json(
          {
            error: `Product ${line.productId} not found`
          },
          { status: 400 }
        )
      }

      const categoryMaxDiscount = Number(
        product.category?.discountCeilingPercent ?? 0
      )

      const allowedDiscount = Math.min(
        tierMaxDiscount,
        categoryMaxDiscount
      )

      const requestedDiscount = Number(
        line.discountPercent || 0
      )

      const discountOverage = Math.max(
        0,
        requestedDiscount - allowedDiscount
      )

      blendedRiskScore += discountOverage

      /*
       * Determine the actual unit price.
       * Customer-specific price list takes priority over
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
                productId: product.id
              }
            }
          })

        if (priceListItem) {
          unitPrice = Number(priceListItem.price)
        }
      }

      const quantity = Number(line.quantity)

      processedLines.push({
        productId: product.id,

        subscriptionPlanId:
          line.subscriptionPlanId || null,

        lineType:
          line.lineType || 'ONE_TIME',

        quantity,

        unitPrice,

        discountPercent: requestedDiscount,

        allowedDiscountPercentSnapshot:
          allowedDiscount,

        discountOveragePercent:
          discountOverage,

        taxPercentSnapshot:
          Number(product.taxPercent || 0),

        marginPercentSnapshot:
          product.marginPercent
            ? Number(product.marginPercent)
            : null,

        isUpsellAdd:
          line.isUpsellAdd || false
      })
    }

    /*
     * Generate quotation number.
     */
    const quoteNumber =
      `Q-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 10000)
      ).padStart(4, '0')}`

    /*
     * Create quotation.
     */
    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber,

        customerId,

        ownerId: user.id,

        status: status || 'DRAFT',

        blendedRiskScore,

        approvalRound: 0,

        fulfillmentStatus: 'PENDING',

        deliveryPromiseDate:
          deliveryPromiseDate
            ? new Date(deliveryPromiseDate)
            : null,

        lastActivityAt: new Date(),

        lines: {
          create: processedLines
        }
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            tier: true,
            email: true
          }
        },

        lines: {
          include: {
            product: {
              include: {
                category: true
              }
            },
            subscriptionPlan: true
          }
        }
      }
    })

    /*
     * Audit trail.
     */
    await prisma.auditLog.create({
      data: {
        quotationId: quotation.id,

        actorId: user.id,

        action:
          status === 'PENDING_APPROVAL'
            ? 'QUOTE_SUBMITTED'
            : 'QUOTE_CREATED',

        entityType: 'Quotation',

        entityId: quotation.id,

        details: {
          source: 'sales_rep',
          status: status || 'DRAFT'
        }
      }
    })

    /*
     * Automatic approval routing.
     */
    if (
      status === 'PENDING_APPROVAL' &&
      blendedRiskScore > 0
    ) {
      const approvalRules =
        await prisma.approvalRule.findMany({
          where: {
            isActive: true
          },
          orderBy: {
            priority: 'desc'
          }
        })

      for (const rule of approvalRules) {
        const minRisk = Number(
          rule.minRiskScore
        )

        const maxRisk = rule.maxRiskScore
          ? Number(rule.maxRiskScore)
          : Infinity

        if (
          blendedRiskScore >= minRisk &&
          blendedRiskScore <= maxRisk
        ) {
          if (rule.requiredRoles.length > 0) {
            for (
              let i = 0;
              i < rule.requiredRoles.length;
              i++
            ) {
              await prisma.approvalStep.create({
                data: {
                  quotationId: quotation.id,

                  approvalRound: 1,

                  stepOrder: i + 1,

                  approverRole:
                    rule.requiredRoles[i],

                  status: 'PENDING'
                }
              })
            }

            await prisma.quotation.update({
              where: {
                id: quotation.id
              },

              data: {
                approvalRound: 1,

                status: 'PENDING_APPROVAL'
              }
            })
          }

          break
        }
      }
    }

    /*
     * Return the newly created quotation.
     */
    const finalQuotation =
      await prisma.quotation.findUnique({
        where: {
          id: quotation.id
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              tier: true,
              email: true
            }
          },

          lines: {
            include: {
              product: {
                include: {
                  category: true
                }
              },

              subscriptionPlan: true
            }
          },

          approvalSteps: {
            include: {
              actedBy: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

    return NextResponse.json(finalQuotation)
  } catch (error) {
    console.error(
      'Create quotation error:',
      error
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}