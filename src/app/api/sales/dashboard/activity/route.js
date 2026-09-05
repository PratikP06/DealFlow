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

    const activities = await prisma.auditLog.findMany({
      where: {
        quotation: {
          ownerId: user.id
        }
      },
      include: {
        quotation: {
          select: {
            id: true,
            quoteNumber: true,
            customer: {
              select: { name: true }
            }
          }
        },
        actor: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const formattedActivities = activities.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt,
      quotation: log.quotation,
      actor: log.actor
    }))

    return NextResponse.json({ activities: formattedActivities })
  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}