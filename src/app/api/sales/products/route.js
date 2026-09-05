import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      priceListItems: {
        include: { priceList: true }
      },
      subscriptionPlans: {
        where: { isActive: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(products)
}