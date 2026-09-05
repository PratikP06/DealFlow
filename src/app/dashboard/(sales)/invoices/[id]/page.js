'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : '—'

const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '—'

const label = (value) =>
  value
    ? value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : '—'

function statusClass(status) {
  if (status === 'PAID') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (status === 'PARTIALLY_PAID') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  if (status === 'VOID') {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  return 'bg-blue-50 text-blue-700 border-blue-200'
}

function Icon({
  type,
  className = 'h-5 w-5',
}) {
  const icons = {
    back: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 12H5m6 6-6-6 6-6"
        />
      </>
    ),

    download: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
        />
      </>
    ),

    card: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path
          strokeLinecap="round"
          d="M3 10h18"
        />
      </>
    ),
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      {icons[type]}
    </svg>
  )
}

export default function InvoiceDetailPage() {
  const { id } = useParams()

  const [invoice, setInvoice] =
    useState(null)

  const [outstanding, setOutstanding] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [paymentOpen, setPaymentOpen] =
    useState(false)

  const [amount, setAmount] =
    useState('')

  const [method, setMethod] =
    useState('BANK_TRANSFER')

  const [reference, setReference] =
    useState('')

  const [paidAt, setPaidAt] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    )

  const [saving, setSaving] =
    useState(false)

  async function loadInvoice() {
    if (!id) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/sales/invoices/${id}`,
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load invoice'
        )
      }

      setInvoice(data.invoice)
      setOutstanding(
        Number(
          data.outstandingAmount || 0
        )
      )
    } catch (err) {
      setError(
        err.message ||
          'Failed to load invoice'
      )
    } finally {
      setLoading(false)
    }
  }

  async function recordPayment(event) {
    event.preventDefault()

    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        `/api/sales/invoices/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            amount: Number(amount),
            method,
            reference,
            paidAt,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to record payment'
        )
      }

      setPaymentOpen(false)
      setAmount('')
      setReference('')

      await loadInvoice()
    } catch (err) {
      setError(
        err.message ||
          'Failed to record payment'
      )
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadInvoice()
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-5">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

        <div className="h-96 animate-pulse rounded-xl bg-white" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-[900px] py-10">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 text-sm text-indigo-600"
        >
          <Icon
            type="back"
            className="h-4 w-4"
          />
          Back to invoices
        </Link>

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ||
            'Invoice not found.'}
        </div>
      </div>
    )
  }

  const quotation = invoice.quotation
  const customer = quotation?.customer

  const fullyPaid =
    outstanding <= 0.0001

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 print:max-w-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-indigo-600"
          >
            <Icon
              type="back"
              className="h-4 w-4"
            />
            Back to invoices
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon type="card" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Invoice{' '}
                {invoice.invoiceNumber}
              </h1>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {customer?.name ||
                  '—'}
                {' · '}
                {quotation?.quoteNumber ||
                  '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!fullyPaid &&
            invoice.status !==
              'VOID' && (
              <button
                type="button"
                onClick={() => {
                  setAmount(
                    outstanding.toFixed(2)
                  )
                  setPaymentOpen(true)
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Record Payment
              </button>
            )}

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-slate-50"
          >
            <Icon
              type="download"
              className="h-4 w-4"
            />
            Download Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 print:border-0 print:shadow-none">
        <div className="flex flex-col gap-5 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              DealFlow360
            </p>

            <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
              Invoice
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {
                invoice.invoiceNumber
              }
            </p>
          </div>

          <div className="sm:text-right">
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass(
                invoice.status
              )}`}
            >
              {label(invoice.status)}
            </span>

            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              Issued{' '}
              {date(
                invoice.issueDate
              )}
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Due{' '}
              {date(
                invoice.dueDate
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Bill to
            </p>

            <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
              {customer?.name ||
                '—'}
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {customer?.email ||
                '—'}
            </p>

            {customer?.phone && (
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {customer.phone}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Quotation
            </p>

            <Link
              href={`/dashboard/quotations/${quotation?.id}`}
              className="mt-2 inline-block text-sm font-semibold text-indigo-600"
            >
              {quotation?.quoteNumber ||
                '—'}
            </Link>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {label(
                invoice.type
              )}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-y border-[var(--color-border)] bg-slate-50 text-left">
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Description
                </th>

                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Type
                </th>

                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Qty
                </th>

                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Unit price
                </th>

                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {invoice.lines.map(
                (line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-4 text-sm font-medium text-[var(--color-text-primary)]">
                      {line.description}

                      <div className="mt-0.5 text-xs text-slate-400">
                        {line.product
                          ?.sku || ''}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {label(
                        line.lineType
                      )}
                    </td>

                    <td className="px-3 py-4 text-right text-sm text-slate-600">
                      {Number(
                        line.quantity
                      )}
                    </td>

                    <td className="px-3 py-4 text-right text-sm text-slate-600">
                      {money(
                        line.unitPrice
                      )}
                    </td>

                    <td className="px-3 py-4 text-right text-sm font-semibold text-slate-900">
                      {money(
                        line.lineAmount
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">
              Subtotal
            </span>

            <span className="font-medium">
              {money(
                invoice.subtotal
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">
              Tax
            </span>

            <span className="font-medium">
              {money(
                invoice.taxAmount
              )}
            </span>
          </div>

          {Number(
            invoice.creditAmount
          ) > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Credit</span>
              <span>
                -
                {money(
                  invoice.creditAmount
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-bold">
            <span>Total</span>

            <span>
              {money(
                invoice.totalAmount
              )}
            </span>
          </div>

          <div className="flex justify-between text-emerald-600">
            <span>Paid</span>

            <span>
              {money(
                invoice.paidAmount
              )}
            </span>
          </div>

          <div className="flex justify-between text-base font-bold text-amber-700">
            <span>
              Outstanding
            </span>

            <span>
              {money(outstanding)}
            </span>
          </div>
        </div>
      </div>

      {invoice.billingEntries
        ?.length > 0 && (
        <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 print:hidden">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Billing schedule
          </h2>

          <div className="mt-4 divide-y divide-[var(--color-border)]">
            {invoice.billingEntries.map(
              (entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {entry
                        .quotationLine
                        ?.product
                        ?.name ||
                        'Recurring line'}
                    </p>

                    <p className="text-xs text-slate-500">
                      {date(
                        entry.periodStart
                      )}{' '}
                      –{' '}
                      {date(
                        entry.periodEnd
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">
                      {money(
                        entry.amount
                      )}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                      {label(
                        entry.status
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 print:hidden">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Payment history
        </h2>

        {invoice.payments.length ===
        0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No payments recorded
            yet.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-[var(--color-border)]">
            {invoice.payments.map(
              (payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {label(
                        payment.method
                      )}
                    </p>

                    <p className="text-xs text-slate-500">
                      {dateTime(
                        payment.paidAt
                      )}

                      {payment.reference
                        ? ` · ${payment.reference}`
                        : ''}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-emerald-600">
                    {money(
                      payment.amount
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={
              recordPayment
            }
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Record payment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Outstanding:{' '}
              {money(outstanding)}
            </p>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Amount

                <input
                  required
                  min="0.01"
                  max={outstanding}
                  step="0.01"
                  type="number"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Method

                <select
                  value={method}
                  onChange={(event) =>
                    setMethod(
                      event.target.value
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                >
                  <option value="CASH">
                    Cash
                  </option>

                  <option value="BANK_TRANSFER">
                    Bank transfer
                  </option>

                  <option value="CARD">
                    Card
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Reference

                <input
                  value={reference}
                  onChange={(event) =>
                    setReference(
                      event.target.value
                    )
                  }
                  placeholder="Optional transaction reference"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Payment date

                <input
                  required
                  type="date"
                  value={paidAt}
                  onChange={(event) =>
                    setPaidAt(
                      event.target.value
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setPaymentOpen(false)
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? 'Saving…'
                  : 'Record payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}