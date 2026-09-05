import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || session.type !== 'internal') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true }
    })

    if (!user || user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      pendingApprovalsCount,
      openQuotationsCount,
      atRiskDealsCount
    ] = await Promise.all([
      prisma.approvalStep.count({
        where: {
          status: 'PENDING',
          approverRole: { in: ['SALES_MANAGER', 'FINANCE'] },
          quotation: {
            ownerId: user.id,
            status: { in: ['PENDING_APPROVAL', 'UNDER_NEGOTIATION'] }
          }
        }
      }),
      prisma.quotation.count({
        where: {
          ownerId: user.id,
          status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'UNDER_NEGOTIATION'] }
        }
      }),
      prisma.quotation.count({
        where: {
          ownerId: user.id,
          status: { in: ['PENDING_APPROVAL', 'APPROVED', 'SENT', 'UNDER_NEGOTIATION'] },
          blendedRiskScore: { gt: 5 },
          lastActivityAt: { lt: thirtyDaysAgo }
        }
      })
    ])

    return NextResponse.json({
      pendingApprovals: pendingApprovalsCount,
      openQuotations: openQuotationsCount,
      atRiskDeals: atRiskDealsCount
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}