import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SalesSidebar from '@/components/SalesSidebar'

export default async function SalesLayout({ children }) {
  const session = await getSession()

  if (!session || session.type !== 'internal') {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  if (user.role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      <SalesSidebar user={user} />

      <div className="min-h-screen lg:pl-[240px]">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-600)]">
              <span className="text-sm font-bold text-white">D</span>
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
                DealFlow360
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Sales Workspace
              </p>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:min-h-screen lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}