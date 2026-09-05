import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateRiskFromLines } from '@/lib/risk'

export async function PATCH(request, { params }) {
  try {
    /*
     * -------------------------------------------------------
     * AUTHENTICATION
     * -------------------------------------------------------
     */

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
     * -------------------------------------------------------
     * PARAMS
     * -------------------------------------------------------
     */

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error: 'Negotiation ID is required',
        },
        { status: 400 }
      )
    }

    /*
     * -------------------------------------------------------
     * REQUEST
     * -------------------------------------------------------
     */

    const body = await request.json()

    const action = String(
      body.action || ''
    ).toUpperCase()

    if (
      action !== 'ACCEPT' &&
      action !== 'REJECT'
    ) {
      return NextResponse.json(
        {
          error: 'Action must be ACCEPT or REJECT',
        },
        { status: 400 }
      )
    }

    const reason = body.reason
      ? String(body.reason).trim()
      : null

    /*
     * A rejection should always explain why.
     * This becomes useful both for the customer-facing
     * experience and the audit trail.
     */

    if (
      action === 'REJECT' &&
      !reason
    ) {
      return NextResponse.json(
        {
          error:
            'A rejection reason is required',
        },
        { status: 400 }
      )
    }

    /*
     * -------------------------------------------------------
     * LOAD NEGOTIATION
     * -------------------------------------------------------
     */

    const negotiation =
      await prisma.negotiationRequest.findUnique({
        where: {
          id,
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

          quotation: {
            include: {
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
          },

          quotationLine: {
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

    if (!negotiation) {
      return NextResponse.json(
        {
          error: 'Negotiation request not found',
        },
        { status: 404 }
      )
    }

    /*
     * -------------------------------------------------------
     * ACCESS CONTROL
     * -------------------------------------------------------
     *
     * Sales Rep:
     *   Only their own quotations.
     *
     * Sales Manager / Finance:
     *   Can resolve negotiations across quotations.
     */

    if (
      user.role === 'SALES_REP' &&
      negotiation.quotation.ownerId !== user.id
    ) {
      return NextResponse.json(
        {
          error: 'Forbidden',
        },
        { status: 403 }
      )
    }

    /*
     * -------------------------------------------------------
     * STATUS VALIDATION
     * -------------------------------------------------------
     */

    if (negotiation.status !== 'PENDING') {
      return NextResponse.json(
        {
          error:
            'This negotiation request has already been resolved',
        },
        { status: 409 }
      )
    }

    /*
     * Confirmed / cancelled quotations cannot
     * be modified through negotiation.
     */

    if (
      negotiation.quotation.status ===
        'CONFIRMED' ||
      negotiation.quotation.status ===
        'CANCELLED'
    ) {
      return NextResponse.json(
        {
          error:
            'This quotation can no longer be negotiated',
        },
        { status: 409 }
      )
    }

    /*
     * -------------------------------------------------------
     * REJECT
     * -------------------------------------------------------
     *
     * Rejection does not modify pricing or quantity.
     */

    if (action === 'REJECT') {
      const result =
        await prisma.$transaction(
          async (tx) => {
            const now = new Date()

            /*
             * Resolve the negotiation.
             */

            const updated =
              await tx.negotiationRequest.update({
                where: {
                  id: negotiation.id,
                },

                data: {
                  status: 'REJECTED',
                  resolvedById: user.id,
                  resolvedAt: now,
                },

                select: {
                  id: true,
                  quotationId: true,
                  quotationLineId: true,
                  type: true,
                  proposedDiscount: true,
                  proposedQuantity: true,
                  message: true,
                  status: true,
                  resolvedById: true,
                  resolvedAt: true,
                },
              })

            /*
             * Check whether another customer request
             * is still waiting.
             */

            const remainingPending =
              await tx.negotiationRequest.count({
                where: {
                  quotationId:
                    negotiation.quotation.id,
                  status: 'PENDING',
                },
              })

            /*
             * If all negotiations are resolved,
             * leave the quotation in a customer-ready
             * state.
             *
             * UNDER_NEGOTIATION was entered when the
             * customer created the request, so APPROVED
             * is the safe state once negotiation is over.
             */

            if (remainingPending === 0) {
              const restoredStatus =
                negotiation.quotation.status ===
                  'UNDER_NEGOTIATION'
                  ? 'APPROVED'
                  : negotiation.quotation.status

              await tx.quotation.update({
                where: {
                  id: negotiation.quotation.id,
                },

                data: {
                  status: restoredStatus,
                  lastActivityAt: now,
                },
              })
            } else {
              await tx.quotation.update({
                where: {
                  id: negotiation.quotation.id,
                },

                data: {
                  lastActivityAt: now,
                },
              })
            }

            /*
             * Audit the rejection.
             */

            await tx.auditLog.create({
              data: {
                quotationId:
                  negotiation.quotation.id,

                actorId: user.id,

                action:
                  'CUSTOMER_NEGOTIATION_REJECTED',

                entityType:
                  'NegotiationRequest',

                entityId:
                  negotiation.id,

                details: {
                  customerId:
                    negotiation.customer.id,

                  type:
                    negotiation.type,

                  quotationLineId:
                    negotiation.quotationLineId,

                  proposedDiscount:
                    negotiation.proposedDiscount !==
                    null
                      ? Number(
                          negotiation.proposedDiscount
                        )
                      : null,

                  proposedQuantity:
                    negotiation.proposedQuantity !==
                    null
                      ? Number(
                          negotiation.proposedQuantity
                        )
                      : null,

                  reason,
                },
              },
            })

            return {
              negotiation: updated,
              remainingPending,
            }
          }
        )

      return NextResponse.json({
        success: true,
        action: 'REJECTED',
        negotiation: result.negotiation,
        remainingPending:
          result.remainingPending,
      })
    }

    /*
     * -------------------------------------------------------
     * COMMENT NEGOTIATION
     * -------------------------------------------------------
     *
     * COMMENT requests contain no structured quotation
     * change, so accepting one simply resolves the request.
     */

    if (negotiation.type === 'COMMENT') {
      const result =
        await prisma.$transaction(
          async (tx) => {
            const now = new Date()

            const updated =
              await tx.negotiationRequest.update({
                where: {
                  id: negotiation.id,
                },

                data: {
                  status: 'ACCEPTED',
                  resolvedById: user.id,
                  resolvedAt: now,
                },
              })

            const remainingPending =
              await tx.negotiationRequest.count({
                where: {
                  quotationId:
                    negotiation.quotation.id,

                  status: 'PENDING',
                },
              })

            const finalStatus =
              remainingPending === 0
                ? 'APPROVED'
                : 'UNDER_NEGOTIATION'

            await tx.quotation.update({
              where: {
                id: negotiation.quotation.id,
              },

              data: {
                status: finalStatus,
                lastActivityAt: now,
              },
            })

            await tx.auditLog.create({
              data: {
                quotationId:
                  negotiation.quotation.id,

                actorId: user.id,

                action:
                  'CUSTOMER_NEGOTIATION_ACCEPTED',

                entityType:
                  'NegotiationRequest',

                entityId:
                  negotiation.id,

                details: {
                  customerId:
                    negotiation.customer.id,

                  type:
                    negotiation.type,

                  message:
                    negotiation.message,

                  commentOnly: true,
                },
              },
            })

            return {
              negotiation: updated,
              finalStatus,
              remainingPending,
            }
          }
        )

      return NextResponse.json({
        success: true,
        action: 'ACCEPTED',
        negotiation: result.negotiation,
        quotation: {
          id: negotiation.quotation.id,
          quoteNumber:
            negotiation.quotation.quoteNumber,
          status: result.finalStatus,
        },
      })
    }

    /*
     * -------------------------------------------------------
     * LINE-LEVEL VALIDATION
     * -------------------------------------------------------
     */

    if (!negotiation.quotationLineId) {
      return NextResponse.json(
        {
          error:
            'This negotiation requires a quotation line',
        },
        { status: 400 }
      )
    }

    const targetLine =
      negotiation.quotation.lines.find(
        (line) =>
          line.id ===
          negotiation.quotationLineId
      )

    if (!targetLine) {
      return NextResponse.json(
        {
          error:
            'Quotation line no longer exists',
        },
        { status: 409 }
      )
    }

    /*
     * -------------------------------------------------------
     * BUILD UPDATED VALUES
     * -------------------------------------------------------
     */

    let newDiscount = Number(
      targetLine.discountPercent || 0
    )

    let newQuantity = Number(
      targetLine.quantity || 0
    )

    if (negotiation.type === 'DISCOUNT') {
      if (
        negotiation.proposedDiscount === null
      ) {
        return NextResponse.json(
          {
            error:
              'Negotiation does not contain a proposed discount',
          },
          { status: 400 }
        )
      }

      newDiscount = Number(
        negotiation.proposedDiscount
      )
    }

    if (negotiation.type === 'QUANTITY') {
      if (
        negotiation.proposedQuantity === null
      ) {
        return NextResponse.json(
          {
            error:
              'Negotiation does not contain a proposed quantity',
          },
          { status: 400 }
        )
      }

      newQuantity = Number(
        negotiation.proposedQuantity
      )
    }

    /*
     * LINE_CHANGE currently has no structured
     * replacement product / price fields in the
     * NegotiationRequest model.
     *
     * Therefore accepting it resolves the request
     * but does not silently mutate quotation data.
     */

    if (negotiation.type === 'LINE_CHANGE') {
      const result =
        await prisma.$transaction(
          async (tx) => {
            const now = new Date()

            const updated =
              await tx.negotiationRequest.update({
                where: {
                  id: negotiation.id,
                },

                data: {
                  status: 'ACCEPTED',
                  resolvedById: user.id,
                  resolvedAt: now,
                },
              })

            const remainingPending =
              await tx.negotiationRequest.count({
                where: {
                  quotationId:
                    negotiation.quotation.id,

                  status: 'PENDING',
                },
              })

            const finalStatus =
              remainingPending === 0
                ? 'APPROVED'
                : 'UNDER_NEGOTIATION'

            await tx.quotation.update({
              where: {
                id: negotiation.quotation.id,
              },

              data: {
                status: finalStatus,
                lastActivityAt: now,
              },
            })

            await tx.auditLog.create({
              data: {
                quotationId:
                  negotiation.quotation.id,

                actorId: user.id,

                action:
                  'CUSTOMER_NEGOTIATION_ACCEPTED',

                entityType:
                  'NegotiationRequest',

                entityId:
                  negotiation.id,

                details: {
                  customerId:
                    negotiation.customer.id,

                  type:
                    negotiation.type,

                  quotationLineId:
                    negotiation.quotationLineId,

                  message:
                    negotiation.message,

                  lineChangeRequiresManualUpdate:
                    true,
                },
              },
            })

            return {
              negotiation: updated,
              finalStatus,
              remainingPending,
            }
          }
        )

      return NextResponse.json({
        success: true,
        action: 'ACCEPTED',

        negotiation:
          result.negotiation,

        quotation: {
          id: negotiation.quotation.id,
          quoteNumber:
            negotiation.quotation.quoteNumber,
          status: result.finalStatus,
        },

        message:
          'Line-change request accepted as a discussion request. Update the quotation manually if required.',
      })
    }

    /*
     * -------------------------------------------------------
     * NUMERIC VALIDATION
     * -------------------------------------------------------
     */

    if (
      !Number.isFinite(newDiscount) ||
      newDiscount < 0 ||
      newDiscount > 100
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid resulting discount',
        },
        { status: 400 }
      )
    }

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity <= 0
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid resulting quantity',
        },
        { status: 400 }
      )
    }

    /*
     * -------------------------------------------------------
     * LOAD CUSTOMER DISCOUNT RULE
     * -------------------------------------------------------
     */

    const discountTierRule =
      await prisma.discountTierRule.findUnique({
        where: {
          tier: negotiation.customer.tier,
        },
      })

    const customerDiscountLimit =
      Number(
        discountTierRule
          ?.maxDiscountPercent ?? 0
      )

    /*
     * -------------------------------------------------------
     * RECALCULATE RISK
     * -------------------------------------------------------
     *
     * Never trust the risk value stored on the quotation.
     * Rebuild the calculation from the resulting line values.
     */

    const riskLines =
      negotiation.quotation.lines.map(
        (line) => ({
          productId:
            line.productId,

          discountPercent:
            line.id ===
            negotiation.quotationLineId
              ? newDiscount
              : Number(
                  line.discountPercent || 0
                ),

          product: {
            category: {
              discountCeilingPercent:
                Number(
                  line.product
                    ?.category
                    ?.discountCeilingPercent ??
                    0
                ),
            },
          },
        })
      )

    const riskResult =
      calculateRiskFromLines({
        customerDiscountLimit,
        lines: riskLines,
      })

    const blendedRiskScore =
      riskResult.blendedRiskScore

    const approvalRequired =
      riskResult.approvalRequired

    const requiredRoles =
      riskResult.requiredRoles || []

    /*
     * -------------------------------------------------------
     * ACCEPT NEGOTIATION TRANSACTION
     * -------------------------------------------------------
     */

    const result =
      await prisma.$transaction(
        async (tx) => {
          const now = new Date()

          /*
           * Update the actual quotation line.
           */

          const categoryLimit =
            Number(
              targetLine.product
                ?.category
                ?.discountCeilingPercent ??
                0
            )

          const allowedDiscount =
            Math.min(
              customerDiscountLimit,
              categoryLimit
            )

          const discountOverage =
            Math.max(
              0,
              newDiscount -
                allowedDiscount
            )

          await tx.quotationLine.update({
            where: {
              id:
                negotiation.quotationLineId,
            },

            data: {
              ...(negotiation.type ===
              'DISCOUNT'
                ? {
                    discountPercent:
                      newDiscount,
                  }
                : {}),

              ...(negotiation.type ===
              'QUANTITY'
                ? {
                    quantity:
                      newQuantity,
                  }
                : {}),

              /*
               * Keep stored risk snapshots consistent
               * with the newly accepted terms.
               */

              allowedDiscountPercentSnapshot:
                allowedDiscount,

              discountOveragePercent:
                discountOverage,
            },
          })

          /*
           * Resolve negotiation.
           */

          const updatedNegotiation =
            await tx.negotiationRequest.update({
              where: {
                id: negotiation.id,
              },

              data: {
                status: 'ACCEPTED',
                resolvedById: user.id,
                resolvedAt: now,
              },

              select: {
                id: true,
                quotationId: true,
                quotationLineId: true,
                type: true,
                proposedDiscount: true,
                proposedQuantity: true,
                message: true,
                status: true,
                resolvedById: true,
                resolvedAt: true,
              },
            })

          /*
           * Check for other unresolved customer requests.
           */

          const remainingPending =
            await tx.negotiationRequest.count({
              where: {
                quotationId:
                  negotiation.quotation.id,

                status: 'PENDING',

                id: {
                  not: negotiation.id,
                },
              },
            })

          let finalStatus
          let newApprovalRound =
            negotiation.quotation
              .approvalRound

          /*
           * ---------------------------------------------------
           * RE-APPROVAL
           * ---------------------------------------------------
           */

          if (approvalRequired) {
            newApprovalRound =
              negotiation.quotation
                .approvalRound + 1

            /*
             * Create the next approval round.
             */

            let stepOrder = 1

            for (const role of requiredRoles) {
              await tx.approvalStep.create({
                data: {
                  quotationId:
                    negotiation.quotation.id,

                  approvalRound:
                    newApprovalRound,

                  stepOrder,

                  approverRole:
                    role,

                  status: 'PENDING',
                },
              })

              stepOrder += 1
            }

            finalStatus =
              'PENDING_APPROVAL'

            await tx.quotation.update({
              where: {
                id:
                  negotiation.quotation.id,
              },

              data: {
                status:
                  finalStatus,

                blendedRiskScore,

                approvalRound:
                  newApprovalRound,

                submittedAt:
                  now,

                approvedAt:
                  null,

                lastActivityAt:
                  now,
              },
            })
          } else if (
            remainingPending > 0
          ) {
            /*
             * Another customer request still needs
             * to be resolved.
             */

            finalStatus =
              'UNDER_NEGOTIATION'

            await tx.quotation.update({
              where: {
                id:
                  negotiation.quotation.id,
              },

              data: {
                status:
                  finalStatus,

                blendedRiskScore,

                lastActivityAt:
                  now,
              },
            })
          } else {
            /*
             * Everything is resolved and the new
             * terms do not require approval.
             */

            finalStatus =
              'APPROVED'

            await tx.quotation.update({
              where: {
                id:
                  negotiation.quotation.id,
              },

              data: {
                status:
                  finalStatus,

                blendedRiskScore,

                approvedAt:
                  now,

                lastActivityAt:
                  now,
              },
            })
          }

          /*
           * Audit the accepted negotiation.
           */

          await tx.auditLog.create({
            data: {
              quotationId:
                negotiation.quotation.id,

              actorId: user.id,

              action:
                approvalRequired
                  ? 'CUSTOMER_NEGOTIATION_ACCEPTED_REQUIRES_REAPPROVAL'
                  : 'CUSTOMER_NEGOTIATION_ACCEPTED',

              entityType:
                'NegotiationRequest',

              entityId:
                negotiation.id,

              details: {
                customerId:
                  negotiation.customer.id,

                type:
                  negotiation.type,

                quotationLineId:
                  negotiation.quotationLineId,

                previousDiscount:
                  Number(
                    targetLine.discountPercent ||
                      0
                  ),

                newDiscount,

                previousQuantity:
                  Number(
                    targetLine.quantity ||
                      0
                  ),

                newQuantity,

                blendedRiskScore,

                approvalRequired,

                requiredRoles,

                approvalRound:
                  newApprovalRound,

                finalStatus,

                remainingPending,
              },
            },
          })

          return {
            negotiation:
              updatedNegotiation,

            finalStatus,

            blendedRiskScore,

            approvalRequired,

            requiredRoles,

            approvalRound:
              newApprovalRound,

            remainingPending,
          }
        }
      )

    return NextResponse.json({
      success: true,

      action: 'ACCEPTED',

      negotiation:
        result.negotiation,

      quotation: {
        id:
          negotiation.quotation.id,

        quoteNumber:
          negotiation.quotation
            .quoteNumber,

        status:
          result.finalStatus,

        blendedRiskScore:
          result.blendedRiskScore,

        approvalRequired:
          result.approvalRequired,

        requiredRoles:
          result.requiredRoles,

        approvalRound:
          result.approvalRound,

        remainingPending:
          result.remainingPending,
      },
    })
  } catch (error) {
    console.error(
      'Resolve sales negotiation error:',
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