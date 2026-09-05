import CustomerSidebar from '@/components/CustomerSidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function CustomerPortalLayout({ children }) {
  const session = await getSession()

  if (!session || session.type !== 'customer') {
    redirect('/login')
  }

  const customer = await prisma.customer.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
    },
  })

  if (!customer) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <CustomerSidebar user={customer} />

      <main className="lg:pl-[240px] min-h-screen">
        {children}
      </main>
    </div>
  )
}