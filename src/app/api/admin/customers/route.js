import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' }
  })
  
  const safeCustomers = customers.map(c => {
    const { passwordHash, ...rest } = c
    return rest
  })

  return NextResponse.json(safeCustomers)
}

export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const data = await request.json()
    const { name, email, tier, password } = data

    if (!name || !email || !tier || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const customer = await prisma.customer.create({
      data: { name, email, tier, passwordHash }
    })

    const { passwordHash: _, ...safeCustomer } = customer
    return NextResponse.json(safeCustomer)
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
