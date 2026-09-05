import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />

      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}