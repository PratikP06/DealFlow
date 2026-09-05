'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SalesDashboardPage() {
  const router = useRouter()

  const [stats, setStats] = useState({
    pendingApprovals: 0,
    openQuotations: 0,
    atRiskDeals: 0,
  })

  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/sales/dashboard/stats'),
          fetch('/api/sales/dashboard/activity'),
        ])

        if (!statsRes.ok || !activityRes.ok) {
          router.push('/login')
          return
        }

        const statsData = await statsRes.json()
        const activityData = await activityRes.json()

        setStats({
          pendingApprovals: statsData.pendingApprovals ?? 0,
          openQuotations: statsData.openQuotations ?? 0,
          atRiskDeals: statsData.atRiskDeals ?? 0,
        })

        setActivities(activityData.activities || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()

    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getActionLabel = (action) => {
    const labels = {
      QUOTE_CREATED: 'Created quotation',
      QUOTE_UPDATED: 'Updated quotation',
      QUOTE_SUBMITTED: 'Submitted for approval',
      QUOTE_APPROVED: 'Approved quotation',
      QUOTE_REJECTED: 'Rejected quotation',
      QUOTE_RETURNED: 'Returned quotation',
      QUOTE_CONFIRMED: 'Confirmed quotation',
      APPROVAL_STEP_CREATED: 'Approval step created',
      APPROVAL_STEP_APPROVED: 'Approval approved',
      APPROVAL_STEP_REJECTED: 'Approval rejected',
      APPROVAL_STEP_RETURNED: 'Approval returned',
      NEGOTIATION_REQUESTED: 'Negotiation requested',
      NEGOTIATION_ACCEPTED: 'Negotiation accepted',
      NEGOTIATION_REJECTED: 'Negotiation rejected',
    }

    return (
      labels[action] ||
      action?.replace(/_/g, ' ').toLowerCase() ||
      'Activity recorded'
    )
  }

  const getActivityTone = (action) => {
    if (
      action?.includes('APPROVED') ||
      action?.includes('ACCEPTED') ||
      action === 'QUOTE_CREATED'
    ) {
      return {
        dot: 'bg-[var(--color-success-500)]',
        icon: 'bg-[var(--color-success-50)] text-[var(--color-success-600)]',
      }
    }

    if (
      action?.includes('REJECTED') ||
      action?.includes('RETURNED')
    ) {
      return {
        dot: 'bg-[var(--color-danger-500)]',
        icon: 'bg-[var(--color-danger-50)] text-[var(--color-danger-600)]',
      }
    }

    if (
      action?.includes('SUBMITTED') ||
      action?.includes('REQUESTED')
    ) {
      return {
        dot: 'bg-[var(--color-warning-500)]',
        icon: 'bg-[var(--color-warning-50)] text-[var(--color-warning-600)]',
      }
    }

    return {
      dot: 'bg-[var(--color-info-500)]',
      icon: 'bg-[var(--color-info-50)] text-[var(--color-info-600)]',
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success-500)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Sales Workspace
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-[28px]">
            Sales Dashboard
          </h1>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Your central view of quotations, approvals, and deal health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/approvals"
            className="btn btn-secondary btn-lg"
          >
            <CheckBadgeIcon className="h-4 w-4" />
            View Approvals
          </Link>

          <Link
            href="/dashboard/quotations/new"
            className="btn btn-primary btn-lg shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            New Quotation
          </Link>
        </div>
      </header>

      {/* KPI cards */}
      <section
        aria-label="Sales overview"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <MetricCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          description="Quotes waiting for action"
          href="/dashboard/approvals"
          icon={<CheckBadgeIcon className="h-5 w-5" />}
          tone="warning"
        />

        <MetricCard
          title="Open Quotations"
          value={stats.openQuotations}
          description="Active sales opportunities"
          href="/dashboard/quotations"
          icon={<DocumentIcon className="h-5 w-5" />}
          tone="primary"
        />

        <MetricCard
          title="At-Risk Deals"
          value={stats.atRiskDeals}
          description="High-risk deals with no recent activity"
          href="/dashboard/deal-health"
          icon={<AlertIcon className="h-5 w-5" />}
          tone="danger"
        />
      </section>

      {/* Activity */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Recent Activity
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              Latest activity across your quotations
            </p>
          </div>

          <Link
            href="/dashboard/quotations"
            className="group inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-600)] transition-colors hover:text-[var(--color-primary-700)]"
          >
            View quotations
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {activities.length === 0 ? (
          <EmptyActivityState />
        ) : (
          <div>
            {activities.map((activity, index) => {
              const tone = getActivityTone(activity.action)

              return (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  tone={tone}
                  isLast={index === activities.length - 1}
                  formatDate={formatDate}
                  getActionLabel={getActionLabel}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

/* =========================================================
   Metric Card
   ========================================================= */

function MetricCard({
  title,
  value,
  description,
  href,
  icon,
  tone,
}) {
  const tones = {
    primary: {
      icon: 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]',
      value: 'text-[var(--color-text-primary)]',
      hover: 'hover:border-[var(--color-primary-200)]',
    },
    warning: {
      icon: 'bg-[var(--color-warning-50)] text-[var(--color-warning-600)]',
      value: 'text-[var(--color-text-primary)]',
      hover: 'hover:border-[var(--color-warning-100)]',
    },
    danger: {
      icon: 'bg-[var(--color-danger-50)] text-[var(--color-danger-600)]',
      value: 'text-[var(--color-text-primary)]',
      hover: 'hover:border-[var(--color-danger-100)]',
    },
  }

  const selectedTone = tones[tone] || tones.primary

  return (
    <Link
      href={href}
      className={`group card block p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm ${selectedTone.hover}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            {title}
          </p>

          <p
            className={`mt-3 text-3xl font-bold tracking-tight ${selectedTone.value}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${selectedTone.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-text-tertiary)] transition-colors group-hover:text-[var(--color-primary-600)]">
        Open
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

/* =========================================================
   Activity Row
   ========================================================= */

function ActivityRow({
  activity,
  tone,
  isLast,
  formatDate,
  getActionLabel,
}) {
  const quotation = activity.quotation
  const quotationHref = quotation?.id
    ? `/dashboard/quotations/${quotation.id}`
    : null

  return (
    <div
      className={`group px-5 py-4 transition-colors hover:bg-[var(--color-surface-secondary)] sm:px-6 ${
        !isLast ? 'border-b border-[var(--color-border)]' : ''
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Activity icon */}
        <div className="relative flex-shrink-0">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${tone.icon}`}
          >
            <ActivityIcon className="h-4 w-4" />
          </div>

          {!isLast && (
            <div className="absolute left-1/2 top-9 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-[var(--color-border)]" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {getActionLabel(activity.action)}
            </p>

            <time
              className="flex-shrink-0 text-xs text-[var(--color-text-tertiary)]"
              dateTime={activity.createdAt}
            >
              {formatDate(activity.createdAt)}
            </time>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]">
            {quotationHref ? (
              <Link
                href={quotationHref}
                className="font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
              >
                {quotation.quoteNumber}
              </Link>
            ) : (
              <span className="font-medium">
                {activity.entityType || 'System activity'}
              </span>
            )}

            {quotation?.customer?.name && (
              <>
                <span className="text-[var(--color-text-tertiary)]">•</span>
                <span>{quotation.customer.name}</span>
              </>
            )}
          </div>

          {activity.actor?.name && (
            <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)]">
              By {activity.actor.name}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Empty Activity
   ========================================================= */

function EmptyActivityState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon flex items-center justify-center rounded-full bg-[var(--color-surface-tertiary)]">
        <ActivityIcon className="h-6 w-6" />
      </div>

      <h3 className="empty-state-title">
        No recent activity
      </h3>

      <p className="empty-state-text">
        Quotation and approval activity will appear here as your sales workflow progresses.
      </p>

      <Link
        href="/dashboard/quotations/new"
        className="btn btn-primary btn-sm mt-5"
      >
        <PlusIcon className="h-4 w-4" />
        Create quotation
      </Link>
    </div>
  )
}

/* =========================================================
   Loading Skeleton
   ========================================================= */

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] animate-pulse space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-[var(--color-surface-tertiary)]" />
          <div className="h-8 w-52 rounded bg-[var(--color-surface-tertiary)]" />
          <div className="h-4 w-80 max-w-full rounded bg-[var(--color-surface-tertiary)]" />
        </div>

        <div className="hidden gap-2 sm:flex">
          <div className="h-10 w-32 rounded-md bg-[var(--color-surface-tertiary)]" />
          <div className="h-10 w-36 rounded-md bg-[var(--color-surface-tertiary)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="card h-[164px] p-5"
          >
            <div className="flex justify-between">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-[var(--color-surface-tertiary)]" />
                <div className="h-9 w-16 rounded bg-[var(--color-surface-tertiary)]" />
              </div>

              <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-tertiary)]" />
            </div>

            <div className="mt-5 h-3 w-36 rounded bg-[var(--color-surface-tertiary)]" />
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <div className="h-4 w-32 rounded bg-[var(--color-surface-tertiary)]" />
          <div className="mt-2 h-3 w-52 rounded bg-[var(--color-surface-tertiary)]" />
        </div>

        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex gap-3.5 border-b border-[var(--color-border)] px-6 py-4"
          >
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-[var(--color-surface-tertiary)]" />

            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-[var(--color-surface-tertiary)]" />
              <div className="h-3 w-56 rounded bg-[var(--color-surface-tertiary)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   Icons
   ========================================================= */

function PlusIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v14m7-7H5"
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
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75l2 2 4-4m6 1.25a9 9 0 11-18 0 9 9 0 0118 0z"
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
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function AlertIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3m0 3h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function ActivityIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function ArrowRightIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
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