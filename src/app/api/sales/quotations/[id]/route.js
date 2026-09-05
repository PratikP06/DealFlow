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

    // Next.js dynamic route params are async
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      )
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id
      },
      include: {
        customer: {
          include: {
            priceList: true
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

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // Sales reps can only access their own quotations.
    // Managers and Finance can access quotations for approval/review.
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

    return NextResponse.json(quotation)

  } catch (error) {
    console.error('Get quotation error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


export async function PATCH(request, { params }) {
  try {
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

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      )
    }

    const data = await request.json()

    const {
      lines,
      status,
      deliveryPromiseDate
    } = data

    const existingQuote =
      await prisma.quotation.findUnique({
        where: {
          id
        },

        include: {
          customer: {
            include: {
              priceList: true,
              discountTierRule: true
            }
          },

          lines: true
        }
      })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    if (existingQuote.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (
      existingQuote.status === 'APPROVED' ||
      existingQuote.status === 'CONFIRMED'
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot modify approved/confirmed quotation'
        },
        { status: 400 }
      )
    }

    let blendedRiskScore = 0

    const tierMaxDiscount =
      existingQuote.customer.discountTierRule
        ?.maxDiscountPercent || 0

    const processedLines = []

    if (lines && lines.length > 0) {
      for (const line of lines) {
        const product =
          await prisma.product.findUnique({
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
              error:
                `Product ${line.productId} not found`
            },
            { status: 400 }
          )
        }

        const categoryMaxDiscount =
          product.category
            ?.discountCeilingPercent || 0

        const allowedDiscount = Math.min(
          Number(tierMaxDiscount),
          Number(categoryMaxDiscount)
        )

        const requestedDiscount =
          Number(line.discountPercent || 0)

        const discountOverage = Math.max(
          0,
          requestedDiscount - allowedDiscount
        )

        blendedRiskScore += discountOverage

        let unitPrice =
          Number(line.unitPrice) ||
          Number(product.price)

        if (existingQuote.customer.priceList) {
          const priceListItem =
            await prisma.priceListItem.findUnique({
              where: {
                priceListId_productId: {
                  priceListId:
                    existingQuote.customer.priceList.id,
                  productId: product.id
                }
              }
            })

          if (priceListItem) {
            unitPrice =
              Number(priceListItem.price)
          }
        }

        processedLines.push({
          productId: product.id,

          subscriptionPlanId:
            line.subscriptionPlanId || null,

          lineType:
            line.lineType || 'ONE_TIME',

          quantity:
            Number(line.quantity),

          unitPrice,

          discountPercent:
            requestedDiscount,

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
            Boolean(line.isUpsellAdd)
        })
      }
    }

    const updateData = {
      blendedRiskScore,

      lastActivityAt:
        new Date(),

      deliveryPromiseDate:
        deliveryPromiseDate
          ? new Date(deliveryPromiseDate)
          : existingQuote.deliveryPromiseDate
    }

    if (status) {
      updateData.status = status

      if (status === 'PENDING_APPROVAL') {
        updateData.submittedAt = new Date()
      }
    }

    if (processedLines.length > 0) {
      await prisma.quotationLine.deleteMany({
        where: {
          quotationId: id
        }
      })

      await prisma.quotation.update({
        where: {
          id
        },

        data: {
          ...updateData,

          lines: {
            create: processedLines
          }
        }
      })
    } else {
      await prisma.quotation.update({
        where: {
          id
        },

        data: updateData
      })
    }

    await prisma.auditLog.create({
      data: {
        quotationId: id,

        actorId: user.id,

        action: 'QUOTE_UPDATED',

        entityType: 'Quotation',

        entityId: id,

        details: {
          source: 'sales_rep',
          changes: Object.keys(data)
        }
      }
    })

    const updatedQuote =
      await prisma.quotation.findUnique({
        where: {
          id
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

    return NextResponse.json(updatedQuote)

  } catch (error) {
    console.error(
      'Update quotation error:',
      error
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


export async function DELETE(request, { params }) {
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
        id: session.userId
      },

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

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      )
    }

    const quotation =
      await prisma.quotation.findUnique({
        where: {
          id
        }
      })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    if (quotation.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (quotation.status !== 'DRAFT') {
      return NextResponse.json(
        {
          error:
            'Only draft quotations can be deleted'
        },
        { status: 400 }
      )
    }

    await prisma.quotation.delete({
      where: {
        id
      }
    })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error(
      'Delete quotation error:',
      error
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}