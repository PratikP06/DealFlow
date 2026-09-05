import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const payload = await getSession()
    
    if (!payload) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 })
    }

    // Fetch fresh user data
    let user
    if (payload.type === 'internal') {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, role: true }
      })
    } else {
      user = await prisma.customer.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, tier: true }
      })
    }

    if (!user) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        ...user,
        type: payload.type,
        role: payload.type === 'internal' ? user.role : 'CUSTOMER'
      }
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
