'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function FulfillmentPage() {
  const router = useRouter()

  const [quotations, setQuotations] =
    useState([])

  const [currentUser, setCurrentUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    loadFulfillment()
  }, [])

  async function loadFulfillment() {
    try {
      setLoading(true)
      setError('')

      const response =
        await fetch(
          '/api/sales/fulfillment',
          {
            cache: 'no-store',
          }
        )

      if (response.status === 401) {
        router.push('/login')
        return
      }

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load fulfillment'
        )
      }

      setQuotations(
        data.quotations || []
      )

      setCurrentUser(
        data.currentUser || null
      )
    } catch (err) {
      setError(
        err.message ||
          'Failed to load fulfillment'
      )
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(
    () => ({
      pending:
        quotations.filter(
          (quote) =>
            quote.fulfillmentStatus ===
            'PENDING'
        ).length,

      partial:
        quotations.filter(
          (quote) =>
            quote.fulfillmentStatus ===
            'PARTIALLY_ALLOCATED'
        ).length,

      backordered:
        quotations.filter(
          (quote) =>
            quote.fulfillmentStatus ===
            'BACKORDERED'
        ).length,

      allocated:
        quotations.filter(
          (quote) =>
            quote.fulfillmentStatus ===
            'ALLOCATED'
        ).length,

      fulfilled:
        quotations.filter(
          (quote) =>
            quote.fulfillmentStatus ===
            'FULFILLED'
        ).length,
    }),
    [quotations]
  )

  const finance =
    currentUser?.role === 'FINANCE'

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Fulfillment
          </h1>

          <p className="page-description">
            Warehouse allocation is
            system-suggested and Finance /
            Operations approved.
          </p>
        </div>

        <button
          type="button"
          onClick={loadFulfillment}
          className="btn btn-secondary btn-sm"
        >
          Refresh
        </button>
      </div>

      <section
        className={`rounded-xl border p-5 ${
          finance
            ? 'border-[var(--color-primary-200)] bg-[var(--color-primary-50)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {finance
                ? 'Finance approval queue'
                : 'Fulfillment monitoring'}
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              {finance
                ? 'Review the automated warehouse split, approve stock reservation, handle backorders and complete fulfillment.'
                : 'Sales representatives can track allocation, backorders and completion. Stock reservation requires Finance / Operations authority.'}
            </p>
          </div>

          <span
            className={
              finance
                ? 'badge badge-success'
                : 'badge badge-info'
            }
          >
            {finance
              ? 'Approval authority: Finance'
              : 'Monitoring only'}
          </span>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Awaiting Approval"
          value={stats.pending}
        />

        <MetricCard
          label="Partially Allocated"
          value={stats.partial}
        />

        <MetricCard
          label="Backordered"
          value={stats.backordered}
        />

        <MetricCard
          label="Allocated"
          value={stats.allocated}
        />

        <MetricCard
          label="Fulfilled"
          value={stats.fulfilled}
        />
      </div>

      <section className="table-container">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Fulfillment Orders
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Approved quotations enter the
            warehouse workflow here.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--color-text-tertiary)]">
            Loading fulfillment...
          </div>
        ) : quotations.length === 0 ? (
          <div className="empty-state">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-muted)]">
              <TruckIcon className="h-6 w-6 text-[var(--color-text-tertiary)]" />
            </div>

            <h3 className="font-semibold">
              No fulfillment records
            </h3>

            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              Approved quotations will appear
              here once fulfillment begins.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  <th className="px-5 py-3">
                    Quote
                  </th>

                  <th className="px-5 py-3">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-right">
                    Ordered
                  </th>

                  <th className="px-5 py-3 text-right">
                    Allocated
                  </th>

                  <th className="px-5 py-3 text-right">
                    Backorder
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3">
                    Authority
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {quotations.map(
                  (quotation) => {
                    const summary =
                      getFulfillmentSummary(
                        quotation
                      )

                    const needsApproval =
                      quotation.fulfillmentStatus ===
                        'PENDING' &&
                      summary.ordered > 0

                    return (
                      <tr
                        key={quotation.id}
                        className="hover:bg-[var(--color-surface-muted)]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {
                              quotation.quoteNumber
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {
                              quotation
                                .customer
                                ?.name
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                            {
                              quotation
                                .customer
                                ?.tier
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {summary.ordered}
                        </td>

                        <td className="px-5 py-4 text-right font-medium">
                          {summary.allocated}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {summary.backorder >
                          0 ? (
                            <span className="font-semibold text-[var(--color-warning)]">
                              {
                                summary.backorder
                              }
                            </span>
                          ) : (
                            0
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              quotation.fulfillmentStatus
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          {needsApproval ? (
                            <span
                              className={
                                finance
                                  ? 'badge badge-warning'
                                  : 'badge badge-info'
                              }
                            >
                              {finance
                                ? 'Needs your approval'
                                : 'Awaiting Finance'}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--color-text-tertiary)]">
                              Finance controlled
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/fulfillment/${quotation.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function getFulfillmentSummary(
  quotation
) {
  const physicalLines =
    quotation.lines?.filter(
      (line) =>
        line.product?.type ===
        'PHYSICAL'
    ) || []

  const ordered =
    physicalLines.reduce(
      (sum, line) =>
        sum +
        Number(line.quantity || 0),
      0
    )

  const allocated =
    physicalLines.reduce(
      (sum, line) =>
        sum +
        (line.allocations || []).reduce(
          (inner, allocation) =>
            inner +
            Number(
              allocation.allocatedQuantity ||
                0
            ),
          0
        ),
      0
    )

  const backorder =
    physicalLines.reduce(
      (sum, line) =>
        sum +
        (line.allocations || []).reduce(
          (inner, allocation) =>
            inner +
            Number(
              allocation.backorderQuantity ||
                0
            ),
          0
        ),
      0
    )

  return {
    ordered,
    allocated,
    backorder,
  }
}

function MetricCard({
  label,
  value,
}) {
  return (
    <div className="metric-card">
      <p className="metric-label">
        {label}
      </p>

      <p className="metric-value">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({
  status,
}) {
  const config = {
    PENDING: [
      'Awaiting Finance',
      'badge-neutral',
    ],

    PARTIALLY_ALLOCATED: [
      'Partially Allocated',
      'badge-warning',
    ],

    BACKORDERED: [
      'Backordered',
      'badge-danger',
    ],

    ALLOCATED: [
      'Allocated',
      'badge-success',
    ],

    FULFILLED: [
      'Fulfilled',
      'badge-success',
    ],
  }

  const [label, cls] =
    config[status] || [
      'Unknown',
      'badge-neutral',
    ]

  return (
    <span
      className={`badge ${cls}`}
    >
      {label}
    </span>
  )
}

function TruckIcon({
  className,
}) {
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
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.124-.504 1.124-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-3.5a1.125 1.125 0 01-1.062-.75l-1.14-3.417A1.125 1.125 0 0014.317 6H8.25m0 0v12"
      />
    </svg>
  )
}