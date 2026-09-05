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
    const [stock, warehouses, products] = await Promise.all([
      prisma.warehouseStock.findMany({
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
        orderBy: [
          { product: { name: 'asc' } },
          { warehouse: { name: 'asc' } },
        ],
      }),

      prisma.warehouse.findMany({
        select: {
          id: true,
          name: true,
          shippingCostWeight: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),

      prisma.product.findMany({
        select: {
          id: true,
          sku: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ])

    return NextResponse.json({
      stock,
      warehouses,
      products,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await request.json()

    const warehouseId = String(body.warehouseId || '')
    const productId = String(body.productId || '')
    const quantity = Number(body.quantity)

    if (!warehouseId || !productId) {
      return NextResponse.json(
        { error: 'Warehouse and product are required' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-negative whole number' },
        { status: 400 }
      )
    }

    const item = await prisma.warehouseStock.create({
      data: {
        warehouseId,
        productId,
        quantity,
      },
      include: {
        warehouse: true,
        product: true,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error(error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Stock already exists for this product in this warehouse' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create stock record' },
      { status: 500 }
    )
  }
}