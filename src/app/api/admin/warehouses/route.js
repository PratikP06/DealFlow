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

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        stock: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await request.json()

    const name = String(body.name || '').trim()
    const shippingCostWeight = Number(body.shippingCostWeight)

    if (!name) {
      return NextResponse.json(
        { error: 'Warehouse name is required' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(shippingCostWeight) || shippingCostWeight <= 0) {
      return NextResponse.json(
        { error: 'Shipping cost weight must be greater than 0' },
        { status: 400 }
      )
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        shippingCostWeight,
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error(error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A warehouse with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    )
  }
}