'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function QuotationsPage() {
  const router = useRouter()

  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    loadQuotations()
  }, [])

  async function loadQuotations() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/sales/quotations')

      if (response.status === 401) {
        router.push('/login')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to load quotations'
        )
      }

      setQuotations(
        Array.isArray(data) ? data : []
      )
    } catch (err) {
      console.error('Load quotations error:', err)
      setError(
        err.message || 'Unable to load quotations.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLowerCase()

    return quotations.filter((quotation) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        quotation.status === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!query) {
        return true
      }

      const quoteNumber =
        quotation.quoteNumber?.toLowerCase() || ''

      const customerName =
        quotation.customer?.name?.toLowerCase() || ''

      const customerEmail =
        quotation.customer?.email?.toLowerCase() || ''

      return (
        quoteNumber.includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query)
      )
    })
  }, [quotations, search, statusFilter])

  const counts = useMemo(() => {
    return {
      all: quotations.length,
      draft: quotations.filter(
        (q) => q.status === 'DRAFT'
      ).length,
      pending: quotations.filter(
        (q) => q.status === 'PENDING_APPROVAL'
      ).length,
      approved: quotations.filter(
        (q) => q.status === 'APPROVED'
      ).length,
      sent: quotations.filter(
        (q) => q.status === 'SENT'
      ).length,
    }
  }, [quotations])

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Quotations
          </h1>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Create, manage, and track quotations for your deals.
          </p>
        </div>

        <Link
          href="/dashboard/quotations/new"
          className="btn btn-primary"
        >
          <PlusIcon className="h-4 w-4" />
          New Quotation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="All quotations"
          value={counts.all}
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />

        <StatCard
          label="Draft"
          value={counts.draft}
          active={statusFilter === 'DRAFT'}
          onClick={() => setStatusFilter('DRAFT')}
        />

        <StatCard
          label="Pending approval"
          value={counts.pending}
          active={
            statusFilter === 'PENDING_APPROVAL'
          }
          onClick={() =>
            setStatusFilter('PENDING_APPROVAL')
          }
        />

        <StatCard
          label="Approved"
          value={counts.approved}
          active={statusFilter === 'APPROVED'}
          onClick={() =>
            setStatusFilter('APPROVED')
          }
        />

        <StatCard
          label="Sent"
          value={counts.sent}
          active={statusFilter === 'SENT'}
          onClick={() => setStatusFilter('SENT')}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-4 py-3">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-600)]" />

          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-danger-700)]">
              Unable to load quotations
            </p>

            <p className="mt-0.5 text-xs text-[var(--color-danger-700)]">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={loadQuotations}
            className="text-xs font-semibold text-[var(--color-danger-700)] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main list */}
      <section className="card overflow-hidden">

        {/* Toolbar */}
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search quotations or customers..."
                className="input pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="status-filter"
                className="text-xs font-medium text-[var(--color-text-secondary)]"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="select w-auto min-w-[170px]"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="DRAFT">
                  Draft
                </option>

                <option value="PENDING_APPROVAL">
                  Pending approval
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="SENT">
                  Sent
                </option>

                <option value="UNDER_NEGOTIATION">
                  Under negotiation
                </option>

                <option value="CONFIRMED">
                  Confirmed
                </option>

                <option value="REJECTED">
                  Rejected
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <QuotationTableSkeleton />
        ) : filteredQuotations.length === 0 ? (
          <EmptyState
            hasFilters={
              Boolean(search.trim()) ||
              statusFilter !== 'ALL'
            }
            onClear={() => {
              setSearch('')
              setStatusFilter('ALL')
            }}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Quotation
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Total
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Risk
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Updated
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredQuotations.map(
                    (quotation) => (
                      <QuotationRow
                        key={quotation.id}
                        quotation={quotation}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[var(--color-border)] md:hidden">
              {filteredQuotations.map(
                (quotation) => (
                  <MobileQuotationCard
                    key={quotation.id}
                    quotation={quotation}
                  />
                )
              )}
            </div>
          </>
        )}

        {/* Footer */}
        {!loading &&
          filteredQuotations.length > 0 && (
            <div className="border-t border-[var(--color-border)] px-5 py-3">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Showing{' '}
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  {filteredQuotations.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  {quotations.length}
                </span>{' '}
                quotations
              </p>
            </div>
          )}
      </section>
    </div>
  )
}

/* =========================================================
   Desktop quotation row
   ========================================================= */

function QuotationRow({ quotation }) {
  const total = calculateTotal(
    quotation.lines || []
  )

  const risk = Number(
    quotation.blendedRiskScore || 0
  )

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-[var(--color-surface-secondary)]"
      onClick={() =>
        window.location.assign(
          `/dashboard/quotations/${quotation.id}`
        )
      }
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
            <DocumentIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-600)]">
              {quotation.quoteNumber}
            </p>

            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              {quotation.lines?.length || 0}{' '}
              {(quotation.lines?.length || 0) === 1
                ? 'item'
                : 'items'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {quotation.customer?.name || '—'}
          </p>

          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            {quotation.customer?.tier || 'Standard'}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={quotation.status}
        />
      </td>

      <td className="px-5 py-4 text-right">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {formatCurrency(total)}
        </p>
      </td>

      <td className="px-5 py-4 text-right">
        <RiskBadge risk={risk} />
      </td>

      <td className="px-5 py-4 text-right">
        <p className="text-xs text-[var(--color-text-secondary)]">
          {formatDate(quotation.updatedAt)}
        </p>
      </td>
    </tr>
  )
}

/* =========================================================
   Mobile quotation card
   ========================================================= */

function MobileQuotationCard({ quotation }) {
  const total = calculateTotal(
    quotation.lines || []
  )

  const risk = Number(
    quotation.blendedRiskScore || 0
  )

  return (
    <Link
      href={`/dashboard/quotations/${quotation.id}`}
      className="block p-4 transition-colors hover:bg-[var(--color-surface-secondary)]"
    >
      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
            <DocumentIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {quotation.quoteNumber}
            </p>

            <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
              {quotation.customer?.name || '—'}
            </p>
          </div>
        </div>

        <StatusBadge
          status={quotation.status}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniValue
          label="Total"
          value={formatCurrency(total)}
        />

        <MiniValue
          label="Risk"
          value={risk.toFixed(1)}
        />

        <MiniValue
          label="Updated"
          value={formatDate(
            quotation.updatedAt
          )}
        />
      </div>
    </Link>
  )
}

/* =========================================================
   Stat card
   ========================================================= */

function StatCard({
  label,
  value,
  active,
  onClick
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`metric-card text-left transition-all ${
        active
          ? 'ring-2 ring-[var(--color-primary-500)] ring-offset-2 ring-offset-[var(--color-background)]'
          : 'hover:border-[var(--color-primary-200)]'
      }`}
    >
      <p className="metric-label">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {value}
      </p>
    </button>
  )
}

/* =========================================================
   Empty state
   ========================================================= */

function EmptyState({
  hasFilters,
  onClear
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-surface-secondary)]">
        <DocumentIcon className="h-7 w-7 text-[var(--color-text-tertiary)]" />
      </div>

      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
        {hasFilters
          ? 'No matching quotations'
          : 'No quotations yet'}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
        {hasFilters
          ? 'Try changing your search or status filter.'
          : 'Create your first quotation to start managing your sales opportunities.'}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="btn btn-secondary mt-6"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/dashboard/quotations/new"
          className="btn btn-primary mt-6"
        >
          <PlusIcon className="h-4 w-4" />
          Create quotation
        </Link>
      )}
    </div>
  )
}

/* =========================================================
   Skeleton
   ========================================================= */

function QuotationTableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-[var(--color-border)]">
      {Array.from({ length: 5 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 px-5 py-5"
          >
            <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--color-surface-tertiary)]" />

            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-[var(--color-surface-tertiary)]" />
              <div className="h-3 w-20 rounded bg-[var(--color-surface-tertiary)]" />
            </div>

            <div className="hidden h-6 w-24 rounded-full bg-[var(--color-surface-tertiary)] sm:block" />

            <div className="hidden h-4 w-24 rounded bg-[var(--color-surface-tertiary)] md:block" />

            <div className="hidden h-4 w-16 rounded bg-[var(--color-surface-tertiary)] lg:block" />
          </div>
        )
      )}
    </div>
  )
}

/* =========================================================
   Small components
   ========================================================= */

function StatusBadge({ status }) {
  const config = getStatusConfig(status)

  return (
    <span
      className={`badge ${config.className}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${config.dotClass}`}
      />

      {config.label}
    </span>
  )
}

function RiskBadge({ risk }) {
  if (risk <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-success-700)]">
        <CheckIcon className="h-3.5 w-3.5" />
        Low
      </span>
    )
  }

  if (risk <= 5) {
    return (
      <span className="text-xs font-semibold text-[var(--color-warning-700)]">
        {risk.toFixed(1)}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-danger-700)]">
      <AlertIcon className="h-3.5 w-3.5" />
      {risk.toFixed(1)}
    </span>
  )
}

function MiniValue({ label, value }) {
  return (
    <div className="rounded-lg bg-[var(--color-surface-secondary)] px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

/* =========================================================
   Helpers
   ========================================================= */

function calculateTotal(lines) {
  return lines.reduce(
    (sum, line) => {
      const quantity =
        Number(line.quantity) || 0

      const unitPrice =
        Number(line.unitPrice) || 0

      const discount =
        Number(line.discountPercent) || 0

      const subtotal =
        quantity * unitPrice

      const total =
        subtotal * (1 - discount / 100)

      return sum + total
    },
    0
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }
  ).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  ).format(new Date(value))
}

function getStatusConfig(status) {
  switch (status) {
    case 'PENDING_APPROVAL':
      return {
        label: 'Pending approval',
        className: 'badge-warning',
        dotClass:
          'bg-[var(--color-warning-600)]'
      }

    case 'APPROVED':
      return {
        label: 'Approved',
        className: 'badge-success',
        dotClass:
          'bg-[var(--color-success-600)]'
      }

    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'badge-danger',
        dotClass:
          'bg-[var(--color-danger-600)]'
      }

    case 'SENT':
      return {
        label: 'Sent',
        className: 'badge-info',
        dotClass:
          'bg-[var(--color-primary-600)]'
      }

    case 'UNDER_NEGOTIATION':
      return {
        label: 'Negotiation',
        className: 'badge-warning',
        dotClass:
          'bg-[var(--color-warning-600)]'
      }

    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        className: 'badge-success',
        dotClass:
          'bg-[var(--color-success-600)]'
      }

    case 'DRAFT':
    default:
      return {
        label: 'Draft',
        className: 'badge-neutral',
        dotClass:
          'bg-[var(--color-text-tertiary)]'
      }
  }
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

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path
        strokeLinecap="round"
        d="m20 20-4-4"
      />
    </svg>
  )
}

function CheckIcon({ className }) {
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
        d="M5 12l4 4L19 6"
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