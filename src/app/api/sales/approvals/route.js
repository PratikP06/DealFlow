import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (
      user.role !== 'SALES_MANAGER' &&
      user.role !== 'FINANCE'
    ) {
      return NextResponse.json(
        { error: 'You are not an approver' },
        { status: 403 }
      )
    }

    const quotations = await prisma.quotation.findMany({
      where: {
        status: 'PENDING_APPROVAL',

        approvalSteps: {
          some: {
            approvalRound: {
              // We only want the current approval round.
              // This is additionally filtered below.
              not: undefined,
            },

            approverRole: user.role,

            status: 'PENDING',
          },
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

        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },

      orderBy: {
        updatedAt: 'desc',
      },
    })

    /*
     * Only expose quotations where the logged-in user's role
     * is the CURRENT actionable approval step.
     *
     * This keeps Finance from seeing a quote before the
     * Sales Manager has approved it.
     */
    const actionable = quotations.filter((quotation) => {
      const currentRoundSteps =
        quotation.approvalSteps.filter(
          (step) =>
            step.approvalRound === quotation.approvalRound
        )

      const currentStep =
        currentRoundSteps
          .filter((step) => step.status === 'PENDING')
          .sort((a, b) => a.stepOrder - b.stepOrder)[0]

      return (
        currentStep &&
        currentStep.approverRole === user.role
      )
    })

    return NextResponse.json(actionable)
  } catch (error) {
    console.error('Get approvals error:', error)

    return NextResponse.json(
      {
        error:
          error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}