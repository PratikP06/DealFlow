import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/*
 * Get the currently logged-in approver.
 *
 * Only Sales Manager and Finance are allowed
 * to use the approval workflow.
 */
async function getApprover() {
  const session = await getSession()

  if (
    !session ||
    session.type !== 'internal'
  ) {
    return {
      error: NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      ),
    }
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

  if (!user) {
    return {
      error: NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      ),
    }
  }

  if (
    user.role !== 'SALES_MANAGER' &&
    user.role !== 'FINANCE'
  ) {
    return {
      error: NextResponse.json(
        {
          error: 'You are not an approver',
        },
        {
          status: 403,
        }
      ),
    }
  }

  return {
    user,
  }
}


/*
 * Find the first pending step in the
 * quotation's current approval round.
 */
function getCurrentStep(
  quotation
) {
  const currentRoundSteps =
    quotation.approvalSteps
      .filter(
        (step) =>
          step.approvalRound ===
          quotation.approvalRound
      )
      .sort(
        (a, b) =>
          a.stepOrder -
          b.stepOrder
      )

  const currentStep =
    currentRoundSteps.find(
      (step) =>
        step.status === 'PENDING'
    ) || null

  return {
    currentRoundSteps,
    currentStep,
  }
}


/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Returns quotation + approval chain.
 *
 * Finance only gets canAct=true when Finance is
 * actually the current pending approval step.
 */
export async function GET(
  request,
  { params }
) {
  try {
    const auth =
      await getApprover()

    if (auth.error) {
      return auth.error
    }

    const { user } = auth
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Quotation ID is required',
        },
        {
          status: 400,
        }
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
              email: true,
            },
          },

          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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

            orderBy: {
              createdAt: 'asc',
            },
          },

          approvalSteps: {
            orderBy: [
              {
                approvalRound: 'desc',
              },
              {
                stepOrder: 'asc',
              },
            ],

            include: {
              actedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },

          auditLogs: {
            orderBy: {
              createdAt: 'desc',
            },

            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      })

    if (!quotation) {
      return NextResponse.json(
        {
          error: 'Quotation not found',
        },
        {
          status: 404,
        }
      )
    }

    const {
      currentStep,
    } = getCurrentStep(
      quotation
    )

    const canAct =
      quotation.status ===
        'PENDING_APPROVAL' &&
      currentStep !== null &&
      currentStep.approverRole ===
        user.role

    return NextResponse.json({
      ...quotation,

      blendedRiskScore:
        Number(
          quotation.blendedRiskScore
        ),

      lines:
        quotation.lines.map(
          (line) => ({
            ...line,

            quantity:
              Number(
                line.quantity
              ),

            unitPrice:
              Number(
                line.unitPrice
              ),

            discountPercent:
              Number(
                line.discountPercent
              ),

            allowedDiscountPercentSnapshot:
              Number(
                line.allowedDiscountPercentSnapshot
              ),

            discountOveragePercent:
              Number(
                line.discountOveragePercent
              ),

            taxPercentSnapshot:
              Number(
                line.taxPercentSnapshot
              ),

            marginPercentSnapshot:
              line.marginPercentSnapshot !==
              null
                ? Number(
                    line.marginPercentSnapshot
                  )
                : null,
          })
        ),

      currentStep,

      canAct: Boolean(
        canAct
      ),

      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(
      'Get approval detail error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Internal server error',
      },
      {
        status: 500,
      }
    )
  }
}


/*
 * ============================================================
 * POST
 * ============================================================
 *
 * Actions:
 *
 * approve
 * reject
 * return
 *
 * The server ALWAYS determines the current approval step.
 * The client cannot choose which step to approve.
 */
export async function POST(
  request,
  { params }
) {
  try {
    const auth =
      await getApprover()

    if (auth.error) {
      return auth.error
    }

    const { user } = auth
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Quotation ID is required',
        },
        {
          status: 400,
        }
      )
    }

    const body =
      await request.json()

    const action =
      String(
        body.action || ''
      ).toLowerCase()

    const reason =
      typeof body.reason ===
      'string'
        ? body.reason.trim()
        : ''

    if (
      ![
        'approve',
        'reject',
        'return',
      ].includes(action)
    ) {
      return NextResponse.json(
        {
          error:
            'Action must be approve, reject, or return',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Reject and Return require an explanation.
     */
    if (
      (
        action === 'reject' ||
        action === 'return'
      ) &&
      !reason
    ) {
      return NextResponse.json(
        {
          error:
            'A reason is required for reject or return',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Load quotation and approval chain.
     */
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

          approvalSteps: {
            orderBy: [
              {
                approvalRound: 'desc',
              },
              {
                stepOrder: 'asc',
              },
            ],
          },
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
     * Only PENDING_APPROVAL quotations can
     * receive approval actions.
     */
    if (
      quotation.status !==
      'PENDING_APPROVAL'
    ) {
      return NextResponse.json(
        {
          error:
            'This quotation is not awaiting approval',
        },
        {
          status: 400,
        }
      )
    }

    const {
      currentRoundSteps,
      currentStep,
    } = getCurrentStep(
      quotation
    )

    if (!currentStep) {
      return NextResponse.json(
        {
          error:
            'No pending approval step exists',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Critical security check:
     *
     * A Finance user cannot approve a Manager step.
     * A Manager cannot approve a Finance step.
     */
    if (
      currentStep.approverRole !==
      user.role
    ) {
      return NextResponse.json(
        {
          error:
            `This approval belongs to ${currentStep.approverRole}`,
        },
        {
          status: 403,
        }
      )
    }

    /*
     * Prevent self approval.
     */
    if (
      quotation.ownerId ===
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            'You cannot approve your own quotation',
        },
        {
          status: 403,
        }
      )
    }

    const now =
      new Date()

    /*
     * ========================================================
     * REJECT
     * ========================================================
     */
    if (
      action === 'reject'
    ) {
      const updated =
        await prisma.$transaction(
          async (tx) => {

            await tx.approvalStep.update({
              where: {
                id:
                  currentStep.id,
              },

              data: {
                status:
                  'REJECTED',

                actedById:
                  user.id,

                actedAt:
                  now,

                reason,
              },
            })

            await tx.quotation.update({
              where: {
                id:
                  quotation.id,
              },

              data: {
                status:
                  'REJECTED',

                lastActivityAt:
                  now,
              },
            })

            await tx.auditLog.create({
              data: {
                quotationId:
                  quotation.id,

                actorId:
                  user.id,

                action:
                  'QUOTE_REJECTED',

                entityType:
                  'ApprovalStep',

                entityId:
                  currentStep.id,

                details: {
                  approvalRound:
                    quotation.approvalRound,

                  stepOrder:
                    currentStep.stepOrder,

                  approverRole:
                    currentStep.approverRole,

                  reason,
                },
              },
            })

            return tx.quotation.findUnique({
              where: {
                id:
                  quotation.id,
              },

              include: {
                approvalSteps: {
                  orderBy: [
                    {
                      approvalRound:
                        'desc',
                    },
                    {
                      stepOrder:
                        'asc',
                    },
                  ],
                },
              },
            })
          }
        )

      return NextResponse.json(
        updated
      )
    }


    /*
     * ========================================================
     * RETURN
     * ========================================================
     *
     * Correct Prisma enum:
     *
     * RETURNED
     *
     * NOT RETURNED_FOR_REVISION.
     */
    if (
      action === 'return'
    ) {
      const updated =
        await prisma.$transaction(
          async (tx) => {

            await tx.approvalStep.update({
              where: {
                id:
                  currentStep.id,
              },

              data: {
                status:
                  'RETURNED',

                actedById:
                  user.id,

                actedAt:
                  now,

                reason,
              },
            })

            await tx.quotation.update({
              where: {
                id:
                  quotation.id,
              },

              data: {
                status:
                  'RETURNED',

                lastActivityAt:
                  now,
              },
            })

            await tx.auditLog.create({
              data: {
                quotationId:
                  quotation.id,

                actorId:
                  user.id,

                action:
                  'QUOTE_RETURNED_FOR_REVISION',

                entityType:
                  'ApprovalStep',

                entityId:
                  currentStep.id,

                details: {
                  approvalRound:
                    quotation.approvalRound,

                  stepOrder:
                    currentStep.stepOrder,

                  approverRole:
                    currentStep.approverRole,

                  reason,
                },
              },
            })

            return tx.quotation.findUnique({
              where: {
                id:
                  quotation.id,
              },

              include: {
                approvalSteps: {
                  orderBy: [
                    {
                      approvalRound:
                        'desc',
                    },
                    {
                      stepOrder:
                        'asc',
                    },
                  ],
                },
              },
            })
          }
        )

      return NextResponse.json(
        updated
      )
    }


    /*
     * ========================================================
     * APPROVE
     * ========================================================
     */

    /*
     * Find the next approval step.
     *
     * Example:
     *
     * Step 1 = SALES_MANAGER
     * Step 2 = FINANCE
     *
     * After Manager approves:
     *
     * nextStep = FINANCE
     */
    const nextStep =
      currentRoundSteps.find(
        (step) =>
          step.stepOrder >
          currentStep.stepOrder
      ) || null

    const updated =
      await prisma.$transaction(
        async (tx) => {

          /*
           * Mark current step approved.
           */
          await tx.approvalStep.update({
            where: {
              id:
                currentStep.id,
            },

            data: {
              status:
                'APPROVED',

              actedById:
                user.id,

              actedAt:
                now,

              reason:
                reason || null,
            },
          })

          /*
           * If another step exists,
           * keep quotation PENDING_APPROVAL.
           *
           * If there is no next step,
           * the entire quotation is approved.
           */
          const newQuotationStatus =
            nextStep
              ? 'PENDING_APPROVAL'
              : 'APPROVED'

          await tx.quotation.update({
            where: {
              id:
                quotation.id,
            },

            data: {
              status:
                newQuotationStatus,

              approvedAt:
                newQuotationStatus ===
                'APPROVED'
                  ? now
                  : null,

              lastActivityAt:
                now,
            },
          })

          /*
           * Record audit trail.
           */
          await tx.auditLog.create({
            data: {
              quotationId:
                quotation.id,

              actorId:
                user.id,

              action:
                newQuotationStatus ===
                'APPROVED'
                  ? 'QUOTE_APPROVED'
                  : 'APPROVAL_STEP_APPROVED',

              entityType:
                'ApprovalStep',

              entityId:
                currentStep.id,

              details: {
                approvalRound:
                  quotation.approvalRound,

                stepOrder:
                  currentStep.stepOrder,

                approverRole:
                  currentStep.approverRole,

                nextStepRole:
                  nextStep
                    ?.approverRole ||
                  null,
              },
            },
          })

          return tx.quotation.findUnique({
            where: {
              id:
                quotation.id,
            },

            include: {
              approvalSteps: {
                orderBy: [
                  {
                    approvalRound:
                      'desc',
                  },
                  {
                    stepOrder:
                      'asc',
                  },
                ],
              },
            },
          })
        }
      )

    return NextResponse.json(
      updated
    )
  } catch (error) {
    console.error(
      'Approval action error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Internal server error',
      },
      {
        status: 500,
      }
    )
  }
}