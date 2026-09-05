import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import bcrypt from 'bcryptjs'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(request) {
  const admin = await requireAdmin()

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    const pageParam = Number(searchParams.get('page'))
    const limitParam = Number(searchParams.get('limit'))

    const page =
      Number.isInteger(pageParam) && pageParam > 0
        ? pageParam
        : 1

    const limit =
      Number.isInteger(limitParam) && limitParam > 0
        ? Math.min(limitParam, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE

    const skip = (page - 1) * limit

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),

      prisma.customer.count()
    ])

    const safeCustomers = customers.map((customer) => {
      const {
        passwordHash,
        ...rest
      } = customer

      return rest
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      customers: safeCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('Failed to fetch customers:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const admin = await requireAdmin()

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  try {
    const data = await request.json()

    const {
      name,
      email,
      tier,
      password
    } = data

    if (!name || !email || !tier || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const salt = await bcrypt.genSalt(10)

    const passwordHash = await bcrypt.hash(
      password,
      salt
    )

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        tier,
        passwordHash
      }
    })

    const {
      passwordHash: _,
      ...safeCustomer
    } = customer

    return NextResponse.json(safeCustomer)
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    console.error('Failed to create customer:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}