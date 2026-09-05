import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getApprover() {
  const session = await getSession()

  if (!session || session.type !== 'internal') {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  const user = await prisma.user.findUnique({
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
        { error: 'User not found' },
        { status: 404 }
      ),
    }
  }

  if (
    user.role !== 'SALES_MANAGER' &&
    user.role !== 'FINANCE'
  ) {
    return {
      error: NextResponse.json(
        { error: 'You are not an approver' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

export async function GET(request, { params }) {
  try {
    const auth = await getApprover()

    if (auth.error) {
      return auth.error
    }

    const { user } = auth
    const { id } = await params

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
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    /*
     * Find the current actionable step.
     */
    const currentRoundSteps =
      quotation.approvalSteps
        .filter(
          (step) =>
            step.approvalRound ===
            quotation.approvalRound
        )
        .sort(
          (a, b) =>
            a.stepOrder - b.stepOrder
        )

    const currentStep =
      currentRoundSteps.find(
        (step) => step.status === 'PENDING'
      ) || null

    const canAct =
      quotation.status === 'PENDING_APPROVAL' &&
      currentStep &&
      currentStep.approverRole === user.role

    return NextResponse.json({
      ...quotation,

      blendedRiskScore:
        Number(quotation.blendedRiskScore),

      lines: quotation.lines.map((line) => ({
        ...line,

        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        discountPercent:
          Number(line.discountPercent),

        allowedDiscountPercentSnapshot:
          Number(
            line.allowedDiscountPercentSnapshot
          ),

        discountOveragePercent:
          Number(
            line.discountOveragePercent
          ),

        taxPercentSnapshot:
          Number(line.taxPercentSnapshot),

        marginPercentSnapshot:
          line.marginPercentSnapshot !== null
            ? Number(line.marginPercentSnapshot)
            : null,
      })),

      currentStep,

      canAct: Boolean(canAct),

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
          error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await getApprover()

    if (auth.error) {
      return auth.error
    }

    const { user } = auth
    const { id } = await params

    const body = await request.json()

    const action = String(
      body.action || ''
    ).toLowerCase()

    const reason =
      typeof body.reason === 'string'
        ? body.reason.trim()
        : ''

    if (
      !['approve', 'reject', 'return'].includes(
        action
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Action must be approve, reject, or return',
        },
        { status: 400 }
      )
    }

    if (
      (action === 'reject' ||
        action === 'return') &&
      !reason
    ) {
      return NextResponse.json(
        {
          error:
            'A reason is required for reject or return',
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
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    if (
      quotation.status !==
      'PENDING_APPROVAL'
    ) {
      return NextResponse.json(
        {
          error:
            'This quotation is not awaiting approval',
        },
        { status: 400 }
      )
    }

    /*
     * Get steps for the current approval round.
     */
    const currentRoundSteps =
      quotation.approvalSteps
        .filter(
          (step) =>
            step.approvalRound ===
            quotation.approvalRound
        )
        .sort(
          (a, b) =>
            a.stepOrder - b.stepOrder
        )

    /*
     * The first pending step is the only step
     * allowed to act.
     */
    const currentStep =
      currentRoundSteps.find(
        (step) => step.status === 'PENDING'
      )

    if (!currentStep) {
      return NextResponse.json(
        {
          error:
            'No pending approval step exists',
        },
        { status: 400 }
      )
    }

    if (
      currentStep.approverRole !== user.role
    ) {
      return NextResponse.json(
        {
          error:
            `This approval belongs to ${currentStep.approverRole}`,
        },
        { status: 403 }
      )
    }

    /*
     * Prevent the quotation owner from approving
     * their own quotation.
     */
    const quotationOwner =
      await prisma.quotation.findUnique({
        where: {
          id: quotation.id,
        },
        select: {
          ownerId: true,
        },
      })

    if (
      quotationOwner?.ownerId === user.id
    ) {
      return NextResponse.json(
        {
          error:
            'You cannot approve your own quotation',
        },
        { status: 403 }
      )
    }

    const now = new Date()

    /*
     * ---------------------------------------------------------
     * REJECT
     * ---------------------------------------------------------
     */
    if (action === 'reject') {
      const updated =
        await prisma.$transaction(
          async (tx) => {
            await tx.approvalStep.update({
              where: {
                id: currentStep.id,
              },

              data: {
                status: 'REJECTED',
                actedById: user.id,
                actedAt: now,
                reason,
              },
            })

            await tx.quotation.update({
              where: {
                id: quotation.id,
              },

              data: {
                status: 'REJECTED',
                lastActivityAt: now,
              },
            })

            await tx.auditLog.create({
              data: {
                quotationId:
                  quotation.id,

                actorId: user.id,

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
                id: quotation.id,
              },
              include: {
                approvalSteps: {
                  orderBy: {
                    stepOrder: 'asc',
                  },
                },
              },
            })
          }
        )

      return NextResponse.json(updated)
    }

    /*
     * ---------------------------------------------------------
     * RETURN FOR REVISION
     * ---------------------------------------------------------
     */
    if (action === 'return') {
      const updated =
        await prisma.$transaction(
          async (tx) => {
            await tx.approvalStep.update({
              where: {
                id: currentStep.id,
              },

              data: {
                status: 'RETURNED',
                actedById: user.id,
                actedAt: now,
                reason,
              },
            })

            await tx.quotation.update({
              where: {
                id: quotation.id,
              },

              data: {
                status:
                  'RETURNED_FOR_REVISION',

                lastActivityAt: now,
              },
            })

            await tx.auditLog.create({
              data: {
                quotationId:
                  quotation.id,

                actorId: user.id,

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
                id: quotation.id,
              },

              include: {
                approvalSteps: {
                  orderBy: {
                    stepOrder: 'asc',
                  },
                },
              },
            })
          }
        )

      return NextResponse.json(updated)
    }

    /*
     * ---------------------------------------------------------
     * APPROVE
     * ---------------------------------------------------------
     */
    const nextStep =
      currentRoundSteps.find(
        (step) =>
          step.stepOrder >
          currentStep.stepOrder
      )

    const updated =
      await prisma.$transaction(
        async (tx) => {
          await tx.approvalStep.update({
            where: {
              id: currentStep.id,
            },

            data: {
              status: 'APPROVED',
              actedById: user.id,
              actedAt: now,
              reason:
                reason || null,
            },
          })

          let newQuotationStatus =
            'PENDING_APPROVAL'

          /*
           * If there is another step,
           * quotation remains pending.
           *
           * Example:
           * Sales Manager → Finance
           */
          if (!nextStep) {
            newQuotationStatus =
              'APPROVED'
          }

          await tx.quotation.update({
            where: {
              id: quotation.id,
            },

            data: {
              status:
                newQuotationStatus,

              approvedAt:
                newQuotationStatus ===
                'APPROVED'
                  ? now
                  : null,

              lastActivityAt: now,
            },
          })

          await tx.auditLog.create({
            data: {
              quotationId:
                quotation.id,

              actorId: user.id,

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
                  nextStep?.approverRole ||
                  null,
              },
            },
          })

          return tx.quotation.findUnique({
            where: {
              id: quotation.id,
            },

            include: {
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
        }
      )

    return NextResponse.json(updated)
  } catch (error) {
    console.error(
      'Approval action error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}