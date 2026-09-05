import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.type !== 'internal') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        role: true
      }
    })

    if (!user || user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Customer has a tier field and priceList relation.
    // DiscountTierRule is a separate model, so it is fetched separately.
    const [customers, tierRules] = await Promise.all([
      prisma.customer.findMany({
        where: {
          isActive: true
        },
        include: {
          priceList: true
        },
        orderBy: {
          name: 'asc'
        }
      }),

      prisma.discountTierRule.findMany({
        where: {
          isActive: true
        }
      })
    ])

    const tierRuleMap = Object.fromEntries(
      tierRules.map((rule) => [
        rule.tier,
        Number(rule.maxDiscountPercent)
      ])
    )

    const formattedCustomers = customers.map((customer) => ({
      ...customer,
      maxDiscountPercent: tierRuleMap[customer.tier] ?? 0
    }))

    return NextResponse.json(formattedCustomers)
  } catch (error) {
    console.error('Sales customers error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}