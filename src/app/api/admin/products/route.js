import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(products)
}

export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const data = await request.json()
    let { sku, name, description, categoryId, type, price, costPrice, taxPercent } = data

    if (!sku || !name || !categoryId || price == null || costPrice == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    price = parseFloat(price)
    costPrice = parseFloat(costPrice)
    taxPercent = parseFloat(taxPercent || 0)

    if (price < 0 || costPrice < 0) {
      return NextResponse.json({ error: 'Price and cost cannot be negative' }, { status: 400 })
    }

    let marginPercent = 0
    if (price > 0) {
      marginPercent = ((price - costPrice) / price) * 100
    }

    const product = await prisma.product.create({
      data: {
        sku, name, description, categoryId, type,
        price, costPrice, taxPercent, marginPercent
      },
      include: { category: true }
    })

    return NextResponse.json(product)
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
