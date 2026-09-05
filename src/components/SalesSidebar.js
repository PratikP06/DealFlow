'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['SALES_REP', 'SALES_MANAGER', 'FINANCE'],
  },
  {
    name: 'Quotations',
    href: '/dashboard/quotations',
    icon: DocumentIcon,
    roles: ['SALES_REP', 'SALES_MANAGER'],
  },
  {
    name: 'Approvals',
    href: '/dashboard/approvals',
    icon: CheckBadgeIcon,
    roles: ['SALES_MANAGER', 'FINANCE'],
  },
  {
    name: 'Fulfillment',
    href: '/dashboard/fulfillment',
    icon: TruckIcon,
    roles: ['SALES_REP', 'SALES_MANAGER', 'FINANCE'],
  },
  {
    name: 'Subscriptions',
    href: '/dashboard/subscriptions',
    icon: ArrowPathIcon,
    roles: ['SALES_REP', 'SALES_MANAGER', 'FINANCE'],
  },
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: DocumentTextIcon,
    roles: ['SALES_REP', 'SALES_MANAGER', 'FINANCE'],
  },
  {
    name: 'Deal Health',
    href: '/dashboard/deal-health',
    icon: ChartBarIcon,
    roles: ['SALES_MANAGER'],
  },
]

export default function SalesSidebar({ user, onClose }) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }

    return pathname.startsWith(href)
  }

  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-[var(--color-border)] shadow-sm text-[var(--color-text-secondary)]"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 lg:hidden transition-opacity ${
          isMobileOpen
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[240px] bg-[var(--color-bg-sidebar)] flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Sales navigation"
      >
        <div className="flex flex-col h-full">

          {/* Brand */}
          <div className="px-5 py-5 border-b border-white/10">
            <h1 className="text-base font-bold text-white tracking-tight">
              DealFlow360
            </h1>

            <p className="text-[11px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
              Sales Workspace
            </p>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto"
            aria-label="Main navigation"
          >
            {visibleNavigation.map((item) => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[var(--color-bg-sidebar-active)] text-[var(--color-primary-300)]'
                      : 'text-slate-400 hover:bg-[var(--color-bg-sidebar-hover)] hover:text-slate-200'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.icon
                    className="w-[18px] h-[18px] flex-shrink-0"
                    aria-hidden="true"
                  />

                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Admin Config */}
          {user?.role === 'ADMIN' && (
            <div className="px-3 pb-2">
              <Link
                href="/dashboard/admin"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  pathname.startsWith('/dashboard/admin')
                    ? 'bg-[var(--color-bg-sidebar-active)] text-[var(--color-primary-300)]'
                    : 'text-slate-400 hover:bg-[var(--color-bg-sidebar-hover)] hover:text-slate-200'
                }`}
              >
                <CogIcon
                  className="w-[18px] h-[18px] flex-shrink-0"
                  aria-hidden="true"
                />

                Admin Config
              </Link>
            </div>
          )}

          {/* User profile */}
          <div className="px-3 py-3 border-t border-white/10 mt-auto">

            <div className="flex items-center gap-2.5 px-2 py-1.5">

              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-200 truncate">
                  {user?.name}
                </p>

                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>

            </div>

            {/* Role badge */}
            <div className="mt-1.5 px-2 flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[var(--color-primary-900)] text-[var(--color-primary-300)] rounded">
                {user?.role}
              </span>
            </div>

            {/* Logout */}
            <form
              action="/api/auth/logout"
              method="POST"
              className="mt-2"
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-200 hover:bg-[var(--color-bg-sidebar-hover)] rounded-md transition-colors"
              >
                <LogoutIcon
                  className="w-4 h-4"
                  aria-hidden="true"
                />

                Logout
              </button>
            </form>

          </div>
        </div>
      </aside>
    </>
  )
}


/* =========================================================
   ICONS
========================================================= */

function HomeIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
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
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  )
}

function CheckBadgeIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function TruckIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.124-.504 1.124-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-3.5a1.125 1.125 0 01-1.062-.75l-1.14-3.417A1.125 1.125 0 0014.317 6H8.25m0 0v12"
      />
    </svg>
  )
}

function ArrowPathIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.357v4.992"
      />
    </svg>
  )
}

function DocumentTextIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  )
}

function ChartBarIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75C21 20.496 20.496 21 19.875 21h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  )
}

function CogIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  )
}