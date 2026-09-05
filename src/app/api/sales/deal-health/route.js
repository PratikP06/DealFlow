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
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (
      user.role !== 'SALES_MANAGER' &&
      user.role !== 'FINANCE'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const quotations = await prisma.quotation.findMany({
      where: {
        status: {
          notIn: ['CANCELLED', 'REJECTED'],
        },
      },

      select: {
        id: true,
        quoteNumber: true,
        status: true,
        blendedRiskScore: true,
        lastActivityAt: true,
        deliveryPromiseDate: true,

        customer: {
          select: {
            name: true,
            tier: true,
          },
        },

        owner: {
          select: {
            name: true,
          },
        },

        lines: {
          select: {
            discountPercent: true,
            allowedDiscountPercentSnapshot: true,
            discountOveragePercent: true,
          },
        },
      },

      orderBy: {
        lastActivityAt: 'asc',
      },
    })

    const now = Date.now()

    const deals = quotations.map((quote) => {
      const lastActivity =
        new Date(quote.lastActivityAt).getTime()

      const inactiveDays = Math.floor(
        (now - lastActivity) /
          (1000 * 60 * 60 * 24)
      )

      const stalled = inactiveDays >= 3

      const risk = Number(
        quote.blendedRiskScore || 0
      )

      const discountAnomaly =
        quote.lines.some((line) => {
          const discount = Number(
            line.discountPercent || 0
          )

          const allowed = Number(
            line.allowedDiscountPercentSnapshot || 0
          )

          return discount > allowed + 5
        })

      const deliverySlipping =
        quote.deliveryPromiseDate &&
        new Date(
          quote.deliveryPromiseDate
        ).getTime() < now &&
        quote.status !== 'CONFIRMED'

      let health = 'HEALTHY'

      if (
        risk > 8 ||
        stalled ||
        discountAnomaly ||
        deliverySlipping
      ) {
        health = 'AT_RISK'
      }

      if (
        (risk > 8 && stalled) ||
        (discountAnomaly && deliverySlipping)
      ) {
        health = 'CRITICAL'
      }

      return {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        status: quote.status,

        customer: quote.customer,
        owner: quote.owner,

        risk,

        riskLevel:
          risk > 8
            ? 'HIGH'
            : risk > 0
              ? 'MEDIUM'
              : 'LOW',

        inactiveDays,
        stalled,
        discountAnomaly,
        deliverySlipping,
        health,
      }
    })

    const stats = {
      total: deals.length,

      healthy: deals.filter(
        (deal) => deal.health === 'HEALTHY'
      ).length,

      atRisk: deals.filter(
        (deal) => deal.health === 'AT_RISK'
      ).length,

      critical: deals.filter(
        (deal) => deal.health === 'CRITICAL'
      ).length,

      stalled: deals.filter(
        (deal) => deal.stalled
      ).length,

      discountAnomalies: deals.filter(
        (deal) => deal.discountAnomaly
      ).length,

      deliverySlips: deals.filter(
        (deal) => deal.deliverySlipping
      ).length,
    }

    return NextResponse.json({
      stats,
      deals,
    })
  } catch (error) {
    console.error(
      'Deal health API error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to load deal health',
      },
      { status: 500 }
    )
  }
}