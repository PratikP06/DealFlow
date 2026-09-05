import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.type !== 'internal') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true }
  })

  if (!user || user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const approvalRules = await prisma.approvalRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' }
  })

  return NextResponse.json(approvalRules)
}