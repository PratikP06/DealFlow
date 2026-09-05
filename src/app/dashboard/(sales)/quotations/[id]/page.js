'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params?.id) return

    async function loadQuotation() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `/api/sales/quotations/${params.id}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load quotation'
          )
        }

        setQuotation(data)
      } catch (err) {
        console.error('Quotation detail error:', err)
        setError(
          err.message || 'Unable to load quotation.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadQuotation()
  }, [params?.id])

  if (loading) {
    return <QuotationSkeleton />
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-6">
          <Link
            href="/dashboard/quotations"
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary-600)]"
          >
            ← Back to quotations
          </Link>
        </div>

        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-50)]">
            <AlertIcon className="h-6 w-6 text-[var(--color-danger-600)]" />
          </div>

          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Unable to load quotation
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="btn btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return null
  }

  const subtotal = quotation.lines.reduce(
    (sum, line) =>
      sum +
      Number(line.unitPrice || 0) *
        Number(line.quantity || 0),
    0
  )

  const discountTotal = quotation.lines.reduce(
    (sum, line) => {
      const lineSubtotal =
        Number(line.unitPrice || 0) *
        Number(line.quantity || 0)

      return (
        sum +
        lineSubtotal *
          (Number(line.discountPercent || 0) / 100)
      )
    },
    0
  )

  const total = subtotal - discountTotal

  const statusInfo = getStatusInfo(
    quotation.status
  )

  const approvalSteps = quotation.approvalSteps || []

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/quotations"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary-600)]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to quotations
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {quotation.quoteNumber}
            </h1>

            <span
              className={`badge ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Quotation for {quotation.customer?.name || 'Customer'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quotation.status === 'DRAFT' && (
            <Link
              href={`/dashboard/quotations/${quotation.id}/edit`}
              className="btn btn-secondary"
            >
              Edit quotation
            </Link>
          )}

          <Link
            href="/dashboard/quotations"
            className="btn btn-primary"
          >
            All quotations
          </Link>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-xl border p-4 ${statusInfo.bannerClass}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${statusInfo.iconBg}`}
          >
            <StatusIcon
              status={quotation.status}
              className="h-4 w-4"
            />
          </div>

          <div>
            <p
              className={`text-sm font-semibold ${statusInfo.textClass}`}
            >
              {statusInfo.title}
            </p>

            <p
              className={`mt-0.5 text-sm ${statusInfo.textClass}`}
            >
              {statusInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Customer"
          value={quotation.customer?.name || '—'}
          subtext={
            quotation.customer?.tier
              ? `${quotation.customer.tier} tier`
              : undefined
          }
        />

        <MetricCard
          label="Quotation total"
          value={formatCurrency(total)}
          subtext={`${quotation.lines.length} line ${
            quotation.lines.length === 1
              ? 'item'
              : 'items'
          }`}
        />

        <MetricCard
          label="Risk score"
          value={Number(
            quotation.blendedRiskScore || 0
          ).toFixed(1)}
          subtext={
            Number(quotation.blendedRiskScore || 0) > 0
              ? 'Approval risk detected'
              : 'Within discount limits'
          }
          danger={
            Number(
              quotation.blendedRiskScore || 0
            ) > 0
          }
        />

        <MetricCard
          label="Delivery promise"
          value={
            quotation.deliveryPromiseDate
              ? formatDate(
                  quotation.deliveryPromiseDate
                )
              : 'Not set'
          }
          subtext="Promised delivery date"
        />
      </section>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* Lines */}
        <section className="card overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Quotation items
                </h2>

                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                  Products and pricing included in this quotation.
                </p>
              </div>

              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                {quotation.lines.length} items
              </span>
            </div>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {quotation.lines.map((line, index) => (
              <QuotationLine
                key={line.id || index}
                line={line}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6">

          {/* Summary */}
          <section className="card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Financial summary
              </h2>
            </div>

            <div className="space-y-3 p-5">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(subtotal)}
              />

              <SummaryRow
                label="Discount"
                value={`-${formatCurrency(
                  discountTotal
                )}`}
                muted
              />

              <div className="border-t border-[var(--color-border)] pt-4">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Total
                  </span>

                  <span className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Customer */}
          <section className="card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Customer
              </h2>
            </div>

            <div className="space-y-4 p-5">
              <InfoRow
                label="Company"
                value={
                  quotation.customer?.name || '—'
                }
              />

              <InfoRow
                label="Email"
                value={
                  quotation.customer?.email || '—'
                }
              />

              <InfoRow
                label="Tier"
                value={
                  quotation.customer?.tier || '—'
                }
              />
            </div>
          </section>

          {/* Approval */}
          <section className="card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Approval workflow
              </h2>

              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                Current approval status and history.
              </p>
            </div>

            <div className="p-5">
              {approvalSteps.length === 0 ? (
                <div className="rounded-lg bg-[var(--color-surface-secondary)] p-4 text-center">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    No approval steps
                  </p>

                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    This quotation does not currently require an approval step.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvalSteps
                    .sort(
                      (a, b) =>
                        a.stepOrder - b.stepOrder
                    )
                    .map((step) => (
                      <ApprovalStep
                        key={step.id}
                        step={step}
                      />
                    ))}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Audit / metadata */}
      <section className="card">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Quotation information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoRow
            label="Quotation number"
            value={quotation.quoteNumber}
          />

          <InfoRow
            label="Created"
            value={formatDateTime(
              quotation.createdAt
            )}
          />

          <InfoRow
            label="Last activity"
            value={formatDateTime(
              quotation.lastActivityAt
            )}
          />

          <InfoRow
            label="Approval round"
            value={String(
              quotation.approvalRound || 0
            )}
          />
        </div>
      </section>
    </div>
  )
}

/* =========================================================
   Components
   ========================================================= */

function MetricCard({
  label,
  value,
  subtext,
  danger = false
}) {
  return (
    <div className="metric-card">
      <p className="metric-label">
        {label}
      </p>

      <p
        className={`mt-2 truncate text-xl font-bold tracking-tight ${
          danger
            ? 'text-[var(--color-danger-600)]'
            : 'text-[var(--color-text-primary)]'
        }`}
      >
        {value}
      </p>

      {subtext && (
        <p className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">
          {subtext}
        </p>
      )}
    </div>
  )
}

function QuotationLine({ line, index }) {
  const quantity = Number(line.quantity || 0)
  const unitPrice = Number(line.unitPrice || 0)
  const discount = Number(
    line.discountPercent || 0
  )

  const subtotal = quantity * unitPrice
  const total =
    subtotal * (1 - discount / 100)

  const product = line.product

  return (
    <div className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-xs font-bold text-[var(--color-primary-700)]">
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {product?.name || 'Product'}
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {product?.sku || 'No SKU'}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge badge-neutral">
                {line.lineType === 'RECURRING'
                  ? 'Recurring'
                  : 'One-time'}
              </span>

              {line.isUpsellAdd && (
                <span className="badge badge-info">
                  Upsell
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-base font-bold text-[var(--color-text-primary)]">
            {formatCurrency(total)}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {quantity} × {formatCurrency(unitPrice)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat
          label="Quantity"
          value={quantity}
        />

        <MiniStat
          label="Unit price"
          value={formatCurrency(unitPrice)}
        />

        <MiniStat
          label="Discount"
          value={`${discount}%`}
        />

        <MiniStat
          label="Line total"
          value={formatCurrency(total)}
        />
      </div>

      {Number(line.discountOveragePercent || 0) > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-3 py-2.5">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-600)]" />

          <p className="text-xs leading-5 text-[var(--color-danger-700)]">
            Discount exceeds the allowed limit by{' '}
            {Number(
              line.discountOveragePercent
            ).toFixed(1)}
            %. This contributes to the quotation risk score.
          </p>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-[var(--color-surface-secondary)] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  muted = false
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span
        className={
          muted
            ? 'text-[var(--color-text-secondary)]'
            : 'text-[var(--color-text-primary)]'
        }
      >
        {label}
      </span>

      <span className="font-medium text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

function ApprovalStep({ step }) {
  const status = String(
    step.status || ''
  ).toUpperCase()

  const isApproved = status === 'APPROVED'
  const isRejected = status === 'REJECTED'

  return (
    <div className="flex gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isApproved
            ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
            : isRejected
              ? 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]'
              : 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]'
        }`}
      >
        {isApproved ? (
          <CheckIcon className="h-4 w-4" />
        ) : isRejected ? (
          <XIcon className="h-4 w-4" />
        ) : (
          <ClockIcon className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {formatRole(
              step.approverRole
            )}
          </p>

          <span
            className={`badge ${
              isApproved
                ? 'badge-success'
                : isRejected
                  ? 'badge-danger'
                  : 'badge-warning'
            }`}
          >
            {formatStatus(status)}
          </span>
        </div>

        {step.actedBy?.name && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Actioned by {step.actedBy.name}
          </p>
        )}

        {step.actedAt && (
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {formatDateTime(step.actedAt)}
          </p>
        )}
      </div>
    </div>
  )
}

function QuotationSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-36 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-8 w-56 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-4 w-72 rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card h-28" />
        <div className="metric-card h-28" />
        <div className="metric-card h-28" />
        <div className="metric-card h-28" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card col-span-2 h-96" />
        <div className="card h-96" />
      </div>
    </div>
  )
}

/* =========================================================
   Status helpers
   ========================================================= */

function getStatusInfo(status) {
  switch (status) {
    case 'PENDING_APPROVAL':
      return {
        label: 'Pending approval',
        title: 'Awaiting approval',
        description:
          'This quotation has been submitted and is waiting for the required approval workflow.',
        className: 'badge-warning',
        bannerClass:
          'border-[var(--color-warning-100)] bg-[var(--color-warning-50)]',
        iconBg:
          'bg-[var(--color-warning-100)]',
        textClass:
          'text-[var(--color-warning-700)]'
      }

    case 'APPROVED':
      return {
        label: 'Approved',
        title: 'Quotation approved',
        description:
          'All required approvals have been completed.',
        className: 'badge-success',
        bannerClass:
          'border-[var(--color-success-100)] bg-[var(--color-success-50)]',
        iconBg:
          'bg-[var(--color-success-100)]',
        textClass:
          'text-[var(--color-success-700)]'
      }

    case 'REJECTED':
      return {
        label: 'Rejected',
        title: 'Quotation rejected',
        description:
          'The quotation did not pass the approval workflow.',
        className: 'badge-danger',
        bannerClass:
          'border-[var(--color-danger-100)] bg-[var(--color-danger-50)]',
        iconBg:
          'bg-[var(--color-danger-100)]',
        textClass:
          'text-[var(--color-danger-700)]'
      }

    case 'SENT':
      return {
        label: 'Sent',
        title: 'Quotation sent',
        description:
          'This quotation has been sent to the customer.',
        className: 'badge-info',
        bannerClass:
          'border-[var(--color-info-100)] bg-[var(--color-info-50)]',
        iconBg:
          'bg-[var(--color-info-100)]',
        textClass:
          'text-[var(--color-info-600)]'
      }

    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        title: 'Deal confirmed',
        description:
          'The customer has confirmed this quotation.',
        className: 'badge-success',
        bannerClass:
          'border-[var(--color-success-100)] bg-[var(--color-success-50)]',
        iconBg:
          'bg-[var(--color-success-100)]',
        textClass:
          'text-[var(--color-success-700)]'
      }

    default:
      return {
        label: formatStatus(status),
        title: 'Quotation draft',
        description:
          'This quotation is still being prepared.',
        className: 'badge-neutral',
        bannerClass:
          'border-[var(--color-border)] bg-[var(--color-surface-secondary)]',
        iconBg:
          'bg-[var(--color-surface-tertiary)]',
        textClass:
          'text-[var(--color-text-secondary)]'
      }
  }
}

function StatusIcon({
  status,
  className
}) {
  if (status === 'APPROVED' || status === 'CONFIRMED') {
    return (
      <CheckIcon
        className={className}
      />
    )
  }

  if (status === 'REJECTED') {
    return (
      <XIcon className={className} />
    )
  }

  if (status === 'PENDING_APPROVAL') {
    return (
      <ClockIcon
        className={className}
      />
    )
  }

  return (
    <DocumentIcon
      className={className}
    />
  )
}

/* =========================================================
   Helpers
   ========================================================= */

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

function formatDateTime(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(new Date(value))
}

function formatStatus(status) {
  if (!status) return 'Unknown'

  return status
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function formatRole(role) {
  if (!role) return 'Approver'

  return role
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

/* =========================================================
   Icons
   ========================================================= */

function ArrowLeftIcon({ className }) {
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
        d="M19 12H5m7-7l-7 7 7 7"
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

function XIcon({ className }) {
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
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  )
}

function ClockIcon({ className }) {
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
        cx="12"
        cy="12"
        r="9"
      />
      <path
        strokeLinecap="round"
        d="M12 7v5l3 2"
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