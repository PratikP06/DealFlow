'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function FulfillmentDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params?.id) {
      loadQuotation()
    }
  }, [params?.id])

  async function loadQuotation() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `/api/sales/fulfillment/${params.id}`
      )

      if (response.status === 401) {
        router.push('/login')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load fulfillment'
        )
      }

      setQuotation(data)
    } catch (err) {
      setError(
        err.message ||
          'Failed to load fulfillment'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Loading fulfillment detail...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/fulfillment"
          className="text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          ← Back to Fulfillment
        </Link>

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!quotation) {
    return null
  }

  const summary =
    getFulfillmentSummary(quotation)

  const progress =
    summary.ordered > 0
      ? Math.min(
          100,
          Math.round(
            (summary.fulfilled /
              summary.ordered) *
              100
          )
        )
      : 0

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <Link
          href="/dashboard/fulfillment"
          className="text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          ← Back to Fulfillment
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-title">
                Fulfillment Detail: {quotation.quoteNumber}
              </h1>

              <StatusBadge
                status={
                  quotation.fulfillmentStatus
                }
              />
            </div>

            <p className="mt-1 text-[var(--color-text-secondary)]">
              {quotation.customer?.name ||
                'Unknown customer'}
            </p>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Delivery Promise
            </p>

            <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
              {quotation.deliveryPromiseDate
                ? formatDate(
                    quotation.deliveryPromiseDate
                  )
                : 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <section className="card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Overall fulfillment progress
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              {summary.fulfilled} of{' '}
              {summary.ordered} physical units fulfilled.
            </p>
          </div>

          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {progress}%
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary-600)] transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <SummaryCard
            label="Ordered"
            value={summary.ordered}
          />

          <SummaryCard
            label="Fulfilled"
            value={summary.fulfilled}
          />

          <SummaryCard
            label="Backorder"
            value={summary.backorder}
            warning={
              summary.backorder > 0
            }
          />
        </div>
      </section>

      {/* Product fulfillment */}
      <section className="card overflow-hidden p-0">

        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Fulfillment by Product
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Warehouse allocation and outstanding quantities for this quotation.
          </p>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {quotation.lines
            .filter(
              (line) =>
                line.product?.type ===
                'PHYSICAL'
            )
            .map((line) => (
              <ProductFulfillment
                key={line.id}
                line={line}
              />
            ))}
        </div>

        {quotation.lines.filter(
          (line) =>
            line.product?.type ===
            'PHYSICAL'
        ).length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              No physical products
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              This quotation does not require warehouse fulfillment.
            </p>
          </div>
        )}
      </section>

      {/* Services */}
      {quotation.lines.some(
        (line) =>
          line.product?.type ===
          'SERVICE'
      ) && (
        <section className="card">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Services
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Service items do not require warehouse allocation.
          </p>

          <div className="mt-4 space-y-2">
            {quotation.lines
              .filter(
                (line) =>
                  line.product?.type ===
                  'SERVICE'
              )
              .map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between rounded-lg bg-[var(--color-surface-muted)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {line.product?.name}
                    </p>

                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Quantity: {Number(line.quantity)}
                    </p>
                  </div>

                  <span className="badge badge-info">
                    Service
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Sales rep information */}
      {summary.backorder > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex gap-3">
            <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Backorder in progress
              </p>

              <p className="mt-1 text-sm text-amber-800">
                {summary.backorder} unit
                {summary.backorder === 1
                  ? ''
                  : 's'} remain outstanding.
                Fulfillment progress will update when inventory is allocated.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function ProductFulfillment({ line }) {
  const allocations =
    line.allocations || []

  const ordered =
    Number(line.quantity || 0)

  const fulfilled =
    allocations.reduce(
      (sum, allocation) =>
        sum +
        Number(
          allocation.allocatedQuantity ||
            0
        ),
      0
    )

  const backorder =
    allocations.reduce(
      (sum, allocation) =>
        sum +
        Number(
          allocation.backorderQuantity ||
            0
        ),
      0
    )

  return (
    <div className="p-5">

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">
            {line.product?.name ||
              'Product'}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {line.product?.sku || '—'}
          </p>
        </div>

        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Ordered
            </p>

            <p className="mt-1 font-semibold text-[var(--color-text-primary)]">
              {ordered}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Fulfilled
            </p>

            <p className="mt-1 font-semibold text-[var(--color-text-primary)]">
              {fulfilled}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Backorder
            </p>

            <p
              className={`mt-1 font-semibold ${
                backorder > 0
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-text-primary)]'
              }`}
            >
              {backorder}
            </p>
          </div>
        </div>
      </div>

      {allocations.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-[var(--color-border)]">

          <table className="w-full text-sm">

            <thead className="bg-[var(--color-surface-muted)]">
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">

                <th className="px-4 py-3">
                  Warehouse
                </th>

                <th className="px-4 py-3">
                  Location
                </th>

                <th className="px-4 py-3 text-right">
                  Fulfilled
                </th>

                <th className="px-4 py-3 text-right">
                  Backorder
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">

              {allocations.map(
                (allocation) => (
                  <tr key={allocation.id}>

                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                      {allocation.warehouse?.name ||
                        'Warehouse'}
                    </td>

                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {allocation.warehouse?.location ||
                        '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {Number(
                        allocation.allocatedQuantity ||
                          0
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {Number(
                        allocation.backorderQuantity ||
                          0
                      ) > 0 ? (
                        <span className="font-semibold text-[var(--color-warning)]">
                          {Number(
                            allocation.backorderQuantity
                          )}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]">
                          0
                        </span>
                      )}
                    </td>

                  </tr>
                )
              )}

            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
          Inventory has not been allocated yet.
        </div>
      )}
    </div>
  )
}

function getFulfillmentSummary(quotation) {
  const physicalLines =
    quotation.lines?.filter(
      (line) =>
        line.product?.type ===
        'PHYSICAL'
    ) || []

  const ordered =
    physicalLines.reduce(
      (sum, line) =>
        sum + Number(line.quantity || 0),
      0
    )

  const fulfilled =
    physicalLines.reduce(
      (sum, line) =>
        sum +
        (line.allocations || []).reduce(
          (
            allocationSum,
            allocation
          ) =>
            allocationSum +
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
          (
            allocationSum,
            allocation
          ) =>
            allocationSum +
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
    fulfilled,
    backorder,
  }
}

function SummaryCard({
  label,
  value,
  warning = false,
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <p className="text-xs text-[var(--color-text-tertiary)]">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-semibold ${
          warning
            ? 'text-[var(--color-warning)]'
            : 'text-[var(--color-text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    PENDING: [
      'Not Started',
      'badge-neutral',
    ],

    PARTIALLY_ALLOCATED: [
      'Partially Fulfilled',
      'badge-warning',
    ],

    ALLOCATED: [
      'Allocated',
      'badge-success',
    ],

    FULFILLED: [
      'Fulfilled',
      'badge-success',
    ],

    BACKORDERED: [
      'Backordered',
      'badge-danger',
    ],
  }

  const [label, className] =
    config[status] || [
      'Not Started',
      'badge-neutral',
    ]

  return (
    <span className={`badge ${className}`}>
      {label}
    </span>
  )
}

function formatDate(value) {
  try {
    return new Date(
      value
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  } catch {
    return '—'
  }
}

function WarningIcon({ className }) {
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
        d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.29 3.86l-8.82 15a1.5 1.5 0 001.29 2.25h18.48a1.5 1.5 0 001.29-2.25l-8.82-15a1.5 1.5 0 00-2.58 0z"
      />
    </svg>
  )
}