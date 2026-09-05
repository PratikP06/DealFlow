'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard/admin',
    icon: DashboardIcon,
  },
  {
    name: 'Customers',
    href: '/dashboard/admin/customers',
    icon: CustomersIcon,
  },
  {
    name: 'Categories',
    href: '/dashboard/admin/categories',
    icon: CategoriesIcon,
  },
  {
    name: 'Products',
    href: '/dashboard/admin/products',
    icon: ProductsIcon,
  },
  {
    name: 'Warehouses & Stock',
    href: '/dashboard/admin/warehouses',
    icon: WarehouseIcon,
  },
  {
    name: 'Subscription Plans',
    href: '/dashboard/admin/subscription-plans',
    icon: SubscriptionIcon,
  },
]

export default function AdminSidebar() {
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
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  const isActive = (href) => {
    if (href === '/dashboard/admin') {
      return pathname === href
    }

    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] shadow-sm lg:hidden"
        aria-label="Open admin navigation"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          mobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[250px] flex-col bg-[var(--color-bg-sidebar)] transition-transform duration-200 ease-in-out ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">

          {/* Brand */}
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              href="/dashboard/admin"
              className="block"
            >
              <h1 className="text-[20px] font-bold tracking-tight text-white">
                DealFlow360
              </h1>

              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-primary-300)]">
                Administration
              </p>
            </Link>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto px-4 py-5"
            aria-label="Admin navigation"
          >
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Configuration
            </p>

            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-[var(--color-bg-sidebar-active)] text-[var(--color-primary-300)]'
                        : 'text-slate-400 hover:bg-[var(--color-bg-sidebar-hover)] hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-[19px] w-[19px] shrink-0" />

                    <span className="truncate">
                      {item.name}
                    </span>

                    {active && (
                      <ChevronIcon className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-white/10" />

            {/* Sales workspace */}
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Workspace
            </p>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-[var(--color-bg-sidebar-hover)] hover:text-slate-200"
            >
              <BriefcaseIcon className="h-[19px] w-[19px] shrink-0" />

              <span>
                Sales Workspace
              </span>
            </Link>
          </nav>

          {/* Admin profile */}
          <div className="border-t border-white/10 px-4 py-5">

            <div className="flex items-center gap-3 px-2">

              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-sm font-semibold text-white">
                A
              </div>

              {/* User */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-200">
                  Administrator
                </p>

                <p className="truncate text-[11px] text-slate-500">
                  admin@dealflow360.com
                </p>
              </div>

            </div>

            {/* Role */}
            <div className="mt-2 px-2">
              <span className="inline-flex rounded bg-[var(--color-primary-900)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-300)]">
                ADMIN
              </span>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-[var(--color-bg-sidebar-hover)] hover:text-slate-200"
            >
              <LogoutIcon className="h-4 w-4" />

              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

/* =========================================================
   ICONS
   ========================================================= */

function DashboardIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect
        x="3.75"
        y="3.75"
        width="6.5"
        height="6.5"
        rx="1"
      />

      <rect
        x="13.75"
        y="3.75"
        width="6.5"
        height="6.5"
        rx="1"
      />

      <rect
        x="3.75"
        y="13.75"
        width="6.5"
        height="6.5"
        rx="1"
      />

      <rect
        x="13.75"
        y="13.75"
        width="6.5"
        height="6.5"
        rx="1"
      />
    </svg>
  )
}

function CustomersIcon({ className }) {
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
        d="M16 20v-1.5a4 4 0 00-4-4H7a4 4 0 00-4 4V20"
      />

      <circle
        cx="9.5"
        cy="7"
        r="3.5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 11a3.5 3.5 0 100-7"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 20v-1.5a4 4 0 00-3-3.87"
      />
    </svg>
  )
}

function CategoriesIcon({ className }) {
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
        d="M4 5.5A1.5 1.5 0 015.5 4h5A1.5 1.5 0 0112 5.5v5a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 014 10.5v-5z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 13.5a1.5 1.5 0 011.5-1.5h5a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5v-5z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16h5M6.5 13.5v5"
      />
    </svg>
  )
}

function ProductsIcon({ className }) {
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
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 7.5L12 12l7.5-4.5M12 12v9"
      />
    </svg>
  )
}

function WarehouseIcon({ className }) {
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
        d="M3 10l9-6 9 6"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 9.5V20h14V9.5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 20v-6h8v6M9 11h.01M12 11h.01M15 11h.01"
      />
    </svg>
  )
}

function SubscriptionIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path
        strokeLinecap="round"
        d="M3 9h18"
      />

      <path
        strokeLinecap="round"
        d="M7 14h4"
      />
    </svg>
  )
}

function BriefcaseIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect
        x="3"
        y="6.75"
        width="18"
        height="13.5"
        rx="1.5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 6.75V5.25A1.5 1.5 0 019.75 3.75h4.5a1.5 1.5 0 011.5 1.5v1.5M3 11.25h18"
      />

      <path
        strokeLinecap="round"
        d="M10 15h4"
      />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 18l6-6-6-6"
      />
    </svg>
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