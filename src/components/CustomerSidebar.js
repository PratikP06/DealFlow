'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CustomerSidebar({ user }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-md bg-white border border-[var(--color-border)] shadow-sm text-[var(--color-text-secondary)]"
        aria-label="Open customer navigation"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 lg:hidden transition-opacity ${
          mobileOpen
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[240px] bg-[var(--color-bg-sidebar)] flex flex-col transition-transform duration-200 ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">

          {/* Brand */}
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[var(--color-primary-600)] flex items-center justify-center text-white font-bold text-sm">
                D
              </div>

              <div>
                <h1 className="text-base font-bold text-white tracking-tight">
                  DealFlow360
                </h1>

                <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
                  Customer Portal
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 px-3 py-4"
            aria-label="Customer navigation"
          >
            <Link
              href="/portal"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors ${
                pathname === '/portal'
                  ? 'bg-[var(--color-bg-sidebar-active)] text-[var(--color-primary-300)]'
                  : 'text-slate-400 hover:bg-[var(--color-bg-sidebar-hover)] hover:text-slate-200'
              }`}
            >
              <DocumentIcon className="w-[18px] h-[18px]" />
              My Quotations
            </Link>
          </nav>

          {/* Customer profile */}
          <div className="px-3 py-3 border-t border-white/10">

            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center text-white font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-200 truncate">
                  {user?.name || 'Customer'}
                </p>

                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.tier && (
              <div className="px-2 mt-1">
                <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--color-primary-900)] text-[var(--color-primary-300)]">
                  {user.tier}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-slate-200 hover:bg-[var(--color-bg-sidebar-hover)] rounded-md transition-colors"
            >
              <LogoutIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function MenuIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  )
}

function DocumentIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  )
}

function LogoutIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  )
}