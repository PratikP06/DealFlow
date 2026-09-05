import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    /*
     * -------------------------------------------------------
     * AUTHENTICATION
     * -------------------------------------------------------
     */

    const session = await getSession()

    if (
      !session ||
      session.type !== 'internal'
    ) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    /*
     * -------------------------------------------------------
     * LOAD USER
     * -------------------------------------------------------
     */

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },

        select: {
          id: true,
          name: true,
          role: true,
        },
      })

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * -------------------------------------------------------
     * ONLY SALES MANAGER + FINANCE CAN APPROVE
     * -------------------------------------------------------
     */

    if (
      user.role !== 'SALES_MANAGER' &&
      user.role !== 'FINANCE'
    ) {
      return NextResponse.json(
        {
          error:
            'You are not an approver',
        },
        {
          status: 403,
        }
      )
    }

    /*
     * -------------------------------------------------------
     * GET QUOTATIONS THAT ARE CURRENTLY
     * WAITING FOR AN APPROVAL
     * -------------------------------------------------------
     *
     * We initially fetch quotations that:
     *
     * 1. Are PENDING_APPROVAL
     * 2. Have a PENDING approval step
     *    for the current user's role.
     *
     * We determine the CURRENT actionable step
     * below because Prisma cannot directly compare
     * approvalSteps.approvalRound with
     * quotation.approvalRound inside this relation filter.
     */

    const quotations =
      await prisma.quotation.findMany({
        where: {
          status: 'PENDING_APPROVAL',

          approvalSteps: {
            some: {
              approverRole:
                user.role,

              status: 'PENDING',
            },
          },
        },

        include: {
          /*
           * -------------------------------------------------
           * CUSTOMER
           * -------------------------------------------------
           */

          customer: {
            select: {
              id: true,
              name: true,
              tier: true,
              email: true,
            },
          },

          /*
           * -------------------------------------------------
           * SALES REP / OWNER
           * -------------------------------------------------
           */

          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          /*
           * -------------------------------------------------
           * APPROVAL CHAIN
           * -------------------------------------------------
           */

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

          /*
           * -------------------------------------------------
           * QUOTATION LINES
           * -------------------------------------------------
           *
           * Useful for the approval screen so the manager
           * / finance user can inspect discounts and products.
           */

          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  price: true,
                  taxPercent: true,
                },
              },

              subscriptionPlan: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  billingInterval: true,
                  durationMonths: true,
                },
              },
            },
          },
        },

        orderBy: {
          updatedAt: 'desc',
        },
      })

    /*
     * -------------------------------------------------------
     * DETERMINE ACTIONABLE APPROVALS
     * -------------------------------------------------------
     *
     * Example:
     *
     * Round 0:
     *
     *   Step 1 -> SALES_MANAGER -> APPROVED
     *   Step 2 -> FINANCE      -> PENDING
     *
     * Finance should see it.
     *
     * But before manager approval:
     *
     *   Step 1 -> SALES_MANAGER -> PENDING
     *   Step 2 -> FINANCE      -> PENDING
     *
     * Finance must NOT see it yet.
     */

    const actionable =
      quotations.filter(
        (quotation) => {
          /*
           * Get only steps from the quotation's
           * current approval round.
           */

          const currentRoundSteps =
            quotation.approvalSteps.filter(
              (step) =>
                step.approvalRound ===
                quotation.approvalRound
            )

          /*
           * Find the FIRST pending step.
           *
           * stepOrder determines the approval chain.
           */

          const currentStep =
            currentRoundSteps
              .filter(
                (step) =>
                  step.status ===
                  'PENDING'
              )
              .sort(
                (a, b) =>
                  a.stepOrder -
                  b.stepOrder
              )[0]

          /*
           * The quotation belongs in this user's
           * queue only when THIS USER'S ROLE is
           * the current pending approval step.
           */

          if (!currentStep) {
            return false
          }

          return (
            currentStep.approverRole ===
            user.role
          )
        }
      )

    /*
     * -------------------------------------------------------
     * RETURN RESULT
     * -------------------------------------------------------
     */

    return NextResponse.json(
      actionable
    )
  } catch (error) {
    console.error(
      'Get approvals error:',
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