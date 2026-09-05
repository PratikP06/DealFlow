import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function PUT(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  try {
    const data = await request.json()
    const { name, discountCeilingPercent } = data

    if (discountCeilingPercent != null && (discountCeilingPercent < 0 || discountCeilingPercent > 100)) {
      return NextResponse.json({ error: 'Discount ceiling must be between 0 and 100' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, discountCeilingPercent }
    })

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  try {
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete category because it has related products.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
