'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function titleCase(value) {
  if (!value) return '—'

  return value
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    )
}

function getStatusClasses(status) {
  switch (status) {
    case 'APPROVED':
    case 'CONFIRMED':
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'

    case 'SCHEDULED':
    case 'PENDING_APPROVAL':
      return 'bg-amber-50 text-amber-700 border-amber-200'

    case 'CANCELLED':
    case 'REJECTED':
    case 'VOID':
      return 'bg-red-50 text-red-700 border-red-200'

    case 'INVOICED':
      return 'bg-blue-50 text-blue-700 border-blue-200'

    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function ArrowLeftIcon() {
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
        d="M19 12H5m6 6-6-6 6-6"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
      />
      <path
        strokeLinecap="round"
        d="M16 2v4M8 2v4M3 10h18"
      />
    </svg>
  )
}

function SubscriptionIcon() {
  return (
    <svg
      className="h-5 w-5"
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

export default function SubscriptionDetailPage() {
  const params = useParams()
  const id = params?.id

  const [subscription, setSubscription] =
    useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadSubscription() {
    if (!id) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/sales/subscriptions/${id}`,
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load subscription'
        )
      }

      setSubscription(data)
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Unable to load subscription.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscription()
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-5 h-8 w-72 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-96 rounded bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            )
          )}
        </div>

        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    )
  }

  if (error || !subscription) {
    return (
      <div className="mx-auto w-full max-w-[900px] py-12">
        <Link
          href="/dashboard/subscriptions"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeftIcon />
          Back to subscriptions
        </Link>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-800">
            Unable to load subscription
          </h1>

          <p className="mt-1 text-sm text-red-700">
            {error ||
              'The requested subscription could not be found.'}
          </p>
        </div>
      </div>
    )
  }

  const line = subscription.line
  const plan = subscription.plan
  const quotation = subscription.quotation
  const customer = quotation?.customer

  const upcoming =
    subscription.billing?.upcoming || []

  const invoices =
    subscription.invoices || []

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/subscriptions"
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-tertiary)] transition hover:text-indigo-600"
        >
          <ArrowLeftIcon />
          Back to subscriptions
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <SubscriptionIcon />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {plan?.name ||
                  'Subscription'}
              </h1>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {customer?.name ||
                  'Unknown customer'}
                {' · '}
                {quotation?.quoteNumber ||
                  'Quotation'}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
              quotation?.status
            )}`}
          >
            {titleCase(
              quotation?.status
            )}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Next billing
          </p>

          <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
            {formatDate(
              subscription.billing
                ?.nextBillingDate
            )}
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {formatCurrency(
              subscription.billing
                ?.nextBillingAmount
            )}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Billing interval
          </p>

          <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
            {titleCase(
              plan?.billingInterval
            )}
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {plan?.durationMonths || 0}{' '}
            month plan
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Quantity
          </p>

          <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
            {Number(line?.quantity || 0)}
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {formatCurrency(
              line?.unitPrice
            )}{' '}
            per unit
          </p>
        </div>
      </div>

      {/* Customer + subscription */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-[var(--color-border)] bg-white lg:col-span-2">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Subscription details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Product
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {subscription.product
                  ?.name || '—'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {subscription.product
                  ?.sku || 'No SKU'}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Plan
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {plan?.name || '—'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {formatCurrency(
                  plan?.price
                )}{' '}
                /{' '}
                {titleCase(
                  plan?.billingInterval
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Discount
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {Number(
                  line?.discountPercent ||
                    0
                )}
                %
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Tax
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {Number(
                  line?.taxPercent || 0
                )}
                %
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Proration
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {plan?.prorationEnabled
                  ? 'Enabled'
                  : 'Disabled'}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Cancellation credit
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {plan?.cancellationCreditEnabled
                  ? 'Enabled'
                  : 'Disabled'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-white">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Customer
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {customer?.name ||
                  'Unknown customer'}
              </p>

              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {customer?.email || '—'}
              </p>
            </div>

            {customer?.phone && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Phone
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                  {customer.phone}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Customer tier
              </p>

              <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                {titleCase(
                  customer?.tier
                )}
              </p>
            </div>

            <Link
              href={`/dashboard/quotations/${quotation?.id}`}
              className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-slate-50"
            >
              View quotation
            </Link>
          </div>
        </section>
      </div>

      {/* Billing schedule */}
      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarIcon />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Billing schedule
            </h2>

            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              Upcoming recurring billing
              periods for this subscription.
            </p>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-text-secondary)]">
            No upcoming billing entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-slate-50/70 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Period
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Billing date
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {upcoming.map(
                  (entry) => (
                    <tr key={entry.id}>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {formatDate(
                            entry.periodStart
                          )}
                        </div>

                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          to{' '}
                          {formatDate(
                            entry.periodEnd
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--color-text-primary)]">
                        {formatDate(
                          entry.billingDate
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--color-text-primary)]">
                        {Number(
                          entry.quantity
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[var(--color-text-primary)]">
                        {formatCurrency(
                          entry.amount
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            entry.status
                          )}`}
                        >
                          {titleCase(
                            entry.status
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invoices */}
      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Related invoices
          </h2>

          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            Billing documents associated with
            this quotation.
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-text-secondary)]">
            No invoices have been generated
            yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-slate-50/70 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Invoice
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Type
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Total
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Paid
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Credit
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {invoices.map(
                  (invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {
                            invoice.invoiceNumber
                          }
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          {formatDateTime(
                            invoice.createdAt
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                        {titleCase(
                          invoice.type
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[var(--color-text-primary)]">
                        {formatCurrency(
                          invoice.totalAmount
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-emerald-600">
                        {formatCurrency(
                          invoice.paidAmount
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                        {formatCurrency(
                          invoice.creditAmount
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            invoice.status
                          )}`}
                        >
                          {titleCase(
                            invoice.status
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Read-only notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800">
          Subscription controls are
          read-only
        </p>

        <p className="mt-1 text-xs leading-5 text-blue-700">
          Plan configuration, proration rules,
          cancellation rules and recurring
          billing configuration are managed
          through the backend configuration.
          This workspace is for tracking the
          Sales Rep&apos;s recurring deals and
          billing schedule.
        </p>
      </div>
    </div>
  )
}