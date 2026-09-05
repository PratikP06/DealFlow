import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(categories)
}

export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const data = await request.json()
    const { name, discountCeilingPercent } = data

    if (!name || discountCeilingPercent == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (discountCeilingPercent < 0 || discountCeilingPercent > 100) {
      return NextResponse.json({ error: 'Discount ceiling must be between 0 and 100' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name, discountCeilingPercent }
    })

    return NextResponse.json(category)
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Name already exists' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
