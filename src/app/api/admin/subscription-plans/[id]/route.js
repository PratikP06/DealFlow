import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dealflow_token')?.value

  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  try {
    const payload = await verifyToken(token)

    if (payload.type !== 'internal' || payload.role !== 'ADMIN') {
      return {
        error: NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        ),
      }
    }

    return { payload }
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }
}

export async function PUT(request, { params }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await request.json()

    const name = String(body.name || '').trim()
    const productId = String(body.productId || '')
    const price = Number(body.price)
    const billingInterval = String(body.billingInterval || '')
    const durationMonths = Number(body.durationMonths)
    const prorationEnabled = Boolean(body.prorationEnabled)
    const cancellationCreditEnabled = Boolean(
      body.cancellationCreditEnabled
    )
    const isActive =
      body.isActive === undefined ? true : Boolean(body.isActive)

    if (!name) {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product is required' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a non-negative number' },
        { status: 400 }
      )
    }

    if (!['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(billingInterval)) {
      return NextResponse.json(
        { error: 'Invalid billing interval' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(durationMonths) ||
      durationMonths <= 0
    ) {
      return NextResponse.json(
        { error: 'Duration must be a positive whole number of months' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Selected product does not exist' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name,
        productId,
        price,
        billingInterval,
        durationMonths,
        prorationEnabled,
        cancellationCreditEnabled,
        isActive,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error(error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params

    await prisma.subscriptionPlan.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error:
          'Cannot delete this plan because it is being used by quotations.',
      },
      { status: 409 }
    )
  }
}