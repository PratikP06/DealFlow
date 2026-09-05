import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Check if email already exists in User or Customer
    const existingUser = await prisma.user.findUnique({ where: { email } })
    const existingCustomer = await prisma.customer.findUnique({ where: { email } })

    if (existingUser || existingCustomer) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create Customer (default BRONZE tier)
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        passwordHash,
        tier: 'BRONZE'
      }
    })

    // Generate JWT
    const payload = {
      userId: customer.id,
      email: customer.email,
      role: 'CUSTOMER',
      type: 'customer'
    }
    const token = await signToken(payload)

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('dealflow_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    })

    return NextResponse.json({ success: true, type: 'customer', user: { id: customer.id, email: customer.email, name: customer.name, role: 'CUSTOMER' } })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
