import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dealflow_token')?.value

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  try {
    const payload = await verifyToken(token)

    if (payload.type !== 'internal' || payload.role !== 'ADMIN') {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }

    return { payload }
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}

export async function PUT(request, { params }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await request.json()

    const quantity = Number(body.quantity)

    if (!Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-negative whole number' },
        { status: 400 }
      )
    }

    const item = await prisma.warehouseStock.update({
      where: { id },
      data: {
        quantity,
      },
      include: {
        warehouse: true,
        product: true,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error(error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Stock record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    await prisma.warehouseStock.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Stock record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete stock record' },
      { status: 500 }
    )
  }
}