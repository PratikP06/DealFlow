'use client'

import Link from 'next/link'

const modules = [
  {
    title: 'Customers',
    description:
      'Manage customer accounts, tiers, contact details, and commercial limits.',
    href: '/dashboard/admin/customers',
    icon: CustomersIcon,
    tag: 'CRM',
  },
  {
    title: 'Categories',
    description:
      'Configure product categories and the maximum discount allowed for each.',
    href: '/dashboard/admin/categories',
    icon: CategoriesIcon,
    tag: 'Pricing',
  },
  {
    title: 'Products',
    description:
      'Manage your product catalog, pricing, SKUs, and core product details.',
    href: '/dashboard/admin/products',
    icon: ProductsIcon,
    tag: 'Catalog',
  },
  {
    title: 'Warehouses & Stock',
    description:
      'Manage warehouse locations, shipping weights, inventory, and stock levels.',
    href: '/dashboard/admin/warehouses',
    icon: WarehouseIcon,
    tag: 'Operations',
  },
  {
    title: 'Subscription Plans',
    description:
      'Configure recurring billing plans, intervals, pricing, and subscription options.',
    href: '/dashboard/admin/subscription-plans',
    icon: SubscriptionIcon,
    tag: 'Billing',
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success-500)]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                Admin Console
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Configuration
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Manage the core data and rules that power your DealFlow
              workspace.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="btn btn-secondary inline-flex shrink-0 items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Sales Portal
          </Link>
        </div>
      </section>

      {/* Quick overview */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OverviewCard
          icon={<SettingsIcon className="h-5 w-5" />}
          label="Configuration areas"
          value="05"
          description="Core modules"
        />

        <OverviewCard
          icon={<ShieldIcon className="h-5 w-5" />}
          label="Control center"
          value="Admin"
          description="Restricted access"
        />

        <OverviewCard
          icon={<LayersIcon className="h-5 w-5" />}
          label="Workspace"
          value="DealFlow"
          description="B2B sales platform"
        />
      </section>

      {/* Configuration modules */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Configuration modules
          </h2>

          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Select an area to manage its configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary-300)] hover:shadow-lg"
              >
                {/* Subtle background glow */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--color-primary-50)] opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-100" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-700)] transition-transform duration-200 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {module.tag}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                        {module.title}
                      </h3>

                      <ArrowUpRightIcon className="h-4 w-4 text-[var(--color-text-tertiary)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {module.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-600)]">
                    <span>Open configuration</span>

                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Admin note */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
            <InfoIcon className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Configuration changes affect the sales workflow
            </p>

            <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--color-text-secondary)]">
              Customer tiers, product discount ceilings, inventory,
              warehouses, and subscription plans are used throughout
              quotations, risk evaluation, fulfillment, and billing.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

/* =========================================================
   Overview Card
   ========================================================= */

function OverviewCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {label}
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {value}
            </p>

            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {description}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Icons
   ========================================================= */

function CustomersIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.2"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.2"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.2"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.2"
      />
    </svg>
  )
}

function ProductsIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
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
        d="M8 20v-6h8v6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 11h.01M12 11h.01M15 11h.01"
      />
    </svg>
  )
}

function SubscriptionIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
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

function SettingsIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.56V20h-2v-.48a1.7 1.7 0 00-1.04-1.56 1.7 1.7 0 00-1.87.34l-.07.06-1.41-1.42.06-.06A1.7 1.7 0 009.4 15a1.7 1.7 0 00-1.56-1.04H7v-2h.84A1.7 1.7 0 009.4 10.9a1.7 1.7 0 00-.34-1.88L9 8.96l1.41-1.42.07.06a1.7 1.7 0 001.87.34A1.7 1.7 0 0013.39 6V5h2v1a1.7 1.7 0 001.03 1.56 1.7 1.7 0 001.88-.34l.06-.06 1.42 1.42-.06.06a1.7 1.7 0 00-.34 1.88 1.7 1.7 0 001.56 1.03H22v2h-1.06A1.7 1.7 0 0019.4 15z"
      />
    </svg>
  )
}

function ShieldIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-2.8 7.9-7 10-4.2-2.1-7-5.5-7-10V6l7-3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 12l1.7 1.7L15 10"
      />
    </svg>
  )
}

function LayersIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l9 5-9 5-9-5 9-5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l9 5 9-5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16l9 5 9-5"
      />
    </svg>
  )
}

function ArrowLeftIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5m7-7l-7 7 7 7"
      />
    </svg>
  )
}

function ArrowRightIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14m-6-6l6 6-6 6"
      />
    </svg>
  )
}

function ArrowUpRightIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 17L17 7"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h10v10"
      />
    </svg>
  )
}

function InfoIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path
        strokeLinecap="round"
        d="M12 10.5v5"
      />
      <path
        strokeLinecap="round"
        d="M12 7.5h.01"
      />
    </svg>
  )
}