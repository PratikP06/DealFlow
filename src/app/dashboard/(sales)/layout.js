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
    select: { id: true, name: true, email: true, role: true }
  })

  if (!user) {
    redirect('/login')
  }

  if (user.role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <SalesSidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        <header className="lg:hidden bg-gray-800 border-b border-gray-700 px-4 py-3">
          <h1 className="text-lg font-semibold text-blue-400">DealFlow360</h1>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}