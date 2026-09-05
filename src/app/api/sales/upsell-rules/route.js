import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session || session.type !== 'internal') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true }
  })

  if (!user || user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const triggerProductId = searchParams.get('triggerProductId')

  if (!triggerProductId) {
    return NextResponse.json({ error: 'triggerProductId required' }, { status: 400 })
  }

  const upsellRules = await prisma.upsellRule.findMany({
    where: {
      triggerProductId,
      isActive: true
    },
    include: {
      suggestedProduct: {
        include: {
          category: true,
          priceListItems: {
            include: { priceList: true }
          }
        }
      }
    },
    orderBy: [
      { promoted: 'desc' },
      { priority: 'desc' }
    ]
  })

  return NextResponse.json(upsellRules)
}