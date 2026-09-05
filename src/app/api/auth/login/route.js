import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // 1. Check User table
    let user = await prisma.user.findUnique({ where: { email } })
    let type = 'internal'

    // 2. If not found, check Customer table
    if (!user) {
      user = await prisma.customer.findUnique({ where: { email } })
      type = 'customer'
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 4. Generate JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: type === 'internal' ? user.role : 'CUSTOMER',
      type
    }
    const token = await signToken(payload)

    // 5. Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('dealflow_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    })

    return NextResponse.json({ success: true, type, user: { id: user.id, email: user.email, name: user.name, role: payload.role } })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
