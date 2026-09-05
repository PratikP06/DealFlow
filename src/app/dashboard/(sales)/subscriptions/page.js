'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

function formatCurrency(value) {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatInterval(interval) {
  if (!interval) return '—'

  return interval.charAt(0) + interval.slice(1).toLowerCase()
}

function getStatusClasses(status) {
  switch (status) {
    case 'APPROVED':
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'

    case 'PENDING_APPROVAL':
      return 'bg-amber-50 text-amber-700 border-amber-200'

    case 'CANCELLED':
      return 'bg-red-50 text-red-700 border-red-200'

    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200'

    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function SubscriptionIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h13l-2.5-2.5M20 17H7l2.5 2.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 4.5A7 7 0 0 1 20 10M7 19.5A7 7 0 0 1 4 14"
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14M13 6l6 6-6 6"
      />
    </svg>
  )
}

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path
        strokeLinecap="round"
        d="m20 20-4-4"
      />
    </svg>
  )
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  async function loadSubscriptions() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        '/api/sales/subscriptions',
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load subscriptions'
        )
      }

      setSubscriptions(
        Array.isArray(data) ? data : []
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Unable to load subscriptions.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase()

    return subscriptions.filter(
      (subscription) => {
        const matchesSearch =
          !query ||
          subscription.product?.name
            ?.toLowerCase()
            .includes(query) ||
          subscription.plan?.name
            ?.toLowerCase()
            .includes(query) ||
          subscription.quotation?.quoteNumber
            ?.toLowerCase()
            .includes(query) ||
          subscription.quotation?.customer?.name
            ?.toLowerCase()
            .includes(query)

        const matchesStatus =
          statusFilter === 'ALL' ||
          subscription.quotationStatus ===
            statusFilter

        return (
          matchesSearch && matchesStatus
        )
      }
    )
  }, [
    subscriptions,
    search,
    statusFilter,
  ])

  const stats = useMemo(() => {
    const active = subscriptions.filter(
      (subscription) =>
        subscription.quotationStatus ===
          'APPROVED' ||
        subscription.quotationStatus ===
          'CONFIRMED'
    ).length

    const pending = subscriptions.filter(
      (subscription) =>
        subscription.quotationStatus ===
        'PENDING_APPROVAL'
    ).length

    const monthlyValue =
      subscriptions.reduce(
        (total, subscription) => {
          const interval =
            subscription.plan?.billingInterval

          const amount =
            Number(
              subscription.nextBillingAmount ||
                0
            )

          if (interval === 'MONTHLY') {
            return total + amount
          }

          if (interval === 'QUARTERLY') {
            return total + amount / 3
          }

          if (interval === 'YEARLY') {
            return total + amount / 12
          }

          return total
        },
        0
      )

    return {
      total: subscriptions.length,
      active,
      pending,
      monthlyValue,
    }
  }, [subscriptions])

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <SubscriptionIcon />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Subscriptions
              </h1>

              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                Track recurring customer
                commitments and upcoming
                billing.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSubscriptions}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshIcon
            className={
              loading
                ? 'h-4 w-4 animate-spin'
                : 'h-4 w-4'
            }
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Total subscriptions
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Active
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {stats.active}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Pending approval
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {stats.pending}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Est. monthly recurring
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
            {formatCurrency(
              stats.monthlyValue
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customer, product, plan or quotation..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">
              All statuses
            </option>
            <option value="APPROVED">
              Approved
            </option>
            <option value="CONFIRMED">
              Confirmed
            </option>
            <option value="PENDING_APPROVAL">
              Pending approval
            </option>
            <option value="DRAFT">
              Draft
            </option>
            <option value="REJECTED">
              Rejected
            </option>
            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Recurring commitments
              </h2>

              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                {filteredSubscriptions.length}{' '}
                subscription
                {filteredSubscriptions.length !==
                1
                  ? 's'
                  : ''}{' '}
                found
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse px-5 py-5"
                >
                  <div className="h-4 w-48 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-72 rounded bg-slate-100" />
                </div>
              )
            )}
          </div>
        ) : filteredSubscriptions.length ===
          0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <SubscriptionIcon />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
              No subscriptions found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">
              Recurring quotation lines will
              appear here once they are added
              to your deals.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-slate-50/70 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Product / Plan
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Billing
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Next billing
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Status
                  </th>

                  <th className="px-5 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredSubscriptions.map(
                  (subscription) => (
                    <tr
                      key={subscription.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {
                            subscription.quotation
                              ?.customer?.name
                          }
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          {
                            subscription.quotation
                              ?.quoteNumber
                          }
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {
                            subscription.product
                              ?.name
                          }
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                          {subscription.plan
                            ?.name ||
                            'No plan'}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--color-text-primary)]">
                        {Number(
                          subscription.quantity
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {formatCurrency(
                            subscription.plan
                              ?.price ||
                              subscription.unitPrice
                          )}
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          {formatInterval(
                            subscription.plan
                              ?.billingInterval
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {formatDate(
                            subscription.nextBillingDate
                          )}
                        </div>

                        {subscription.nextBillingAmount !=
                          null && (
                          <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            {formatCurrency(
                              subscription.nextBillingAmount
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            subscription.quotationStatus
                          )}`}
                        >
                          {subscription.quotationStatus
                            ?.replaceAll(
                              '_',
                              ' '
                            )
                            .replace(
                              /\b\w/g,
                              (char) =>
                                char.toUpperCase()
                            )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/subscriptions/${subscription.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                        >
                          View
                          <ArrowRightIcon />
                        </Link>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}