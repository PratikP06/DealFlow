import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function PUT(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  try {
    const data = await request.json()
    const { name, tier } = data

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, tier }
    })

    const { passwordHash, ...safeCustomer } = customer
    return NextResponse.json(safeCustomer)
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  try {
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete customer because they have related records (e.g. quotes).' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
