import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function PUT(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  try {
    const data = await request.json()
    let { sku, name, description, categoryId, type, price, costPrice, taxPercent } = data

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

    const product = await prisma.product.update({
      where: { id },
      data: {
        sku, name, description, categoryId, type,
        price, costPrice, taxPercent, marginPercent
      },
      include: { category: true }
    })

    return NextResponse.json(product)
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    return NextResponse.json({ error: 'Update failed' }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete product because it has related records.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
