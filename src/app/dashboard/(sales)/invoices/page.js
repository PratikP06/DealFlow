'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

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

const label = (value) =>
  value
    ? value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (c) =>
          c.toUpperCase()
        )
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

function DocumentIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H7.5A2.25 2.25 0 0 0 5.25 4.5v15A2.25 2.25 0 0 0 7.5 21.75h9a3 3 0 0 0 3-3v-4.5Z"
      />

      <path
        strokeLinecap="round"
        d="M9 13.5h6m-6 3h4.5"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
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

export default function InvoicesPage() {
  const [invoices, setInvoices] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [filter, setFilter] =
    useState('ALL')

  async function loadInvoices() {
    setLoading(true)
    setError('')

    try {
      /*
       * GET automatically creates invoices for approved
       * quotations before returning the list.
       */

      const response =
        await fetch(
          '/api/sales/invoices',
          {
            cache: 'no-store',
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load invoices'
        )
      }

      setInvoices(
        data.invoices || []
      )
    } catch (err) {
      setError(
        err.message ||
          'Failed to load invoices'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const filtered =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase()

      return invoices.filter(
        (invoice) => {
          const matchesSearch =
            !q ||
            [
              invoice.invoiceNumber,

              invoice.quotation
                ?.quoteNumber,

              invoice.quotation
                ?.customer
                ?.name,

              invoice.quotation
                ?.customer
                ?.email,
            ].some((value) =>
              String(value || '')
                .toLowerCase()
                .includes(q)
            )

          const matchesFilter =
            filter === 'ALL' ||
            invoice.status ===
              filter

          return (
            matchesSearch &&
            matchesFilter
          )
        }
      )
    }, [
      invoices,
      search,
      filter,
    ])

  const stats =
    useMemo(
      () => ({
        total:
          invoices.length,

        unpaid:
          invoices.filter(
            (invoice) =>
              invoice.status ===
              'ISSUED'
          ).length,

        partial:
          invoices.filter(
            (invoice) =>
              invoice.status ===
              'PARTIALLY_PAID'
          ).length,

        paid:
          invoices.filter(
            (invoice) =>
              invoice.status ===
              'PAID'
          ).length,
      }),
      [invoices]
    )

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <DocumentIcon />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Invoices
            </h1>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Automatically generated from approved quotations.
            </p>
          </div>

        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700">
          ✓ Automatic billing enabled
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {[
          [
            'Total invoices',
            stats.total,
            'text-slate-900',
          ],

          [
            'Unpaid',
            stats.unpaid,
            'text-amber-600',
          ],

          [
            'Partially paid',
            stats.partial,
            'text-blue-600',
          ],

          [
            'Paid',
            stats.paid,
            'text-emerald-600',
          ],
        ].map(
          ([name, value, color]) => (
            <div
              key={name}
              className="rounded-xl border border-[var(--color-border)] bg-white p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                {name}
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${color}`}
              >
                {value}
              </p>
            </div>
          )
        )}

      </div>

      {/* SEARCH */}

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">

        <div className="flex flex-col gap-3 sm:flex-row">

          <div className="relative flex-1">

            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search invoice, customer or quotation…"
              className="w-full rounded-lg border border-[var(--color-border)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="ISSUED">
              Issued
            </option>

            <option value="PARTIALLY_PAID">
              Partially paid
            </option>

            <option value="PAID">
              Paid
            </option>

            <option value="VOID">
              Void
            </option>
          </select>

        </div>

      </div>

      {/* INVOICE TABLE */}

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">

        <div className="border-b border-[var(--color-border)] px-5 py-4">

          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Invoice history
          </h2>

          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {filtered.length} invoice
            {filtered.length === 1
              ? ''
              : 's'}
          </p>

        </div>

        {loading ? (
          <div className="space-y-3 p-5">

            {[1, 2, 3, 4].map(
              (number) => (
                <div
                  key={number}
                  className="h-12 animate-pulse rounded bg-slate-100"
                />
              )
            )}

          </div>
        ) : filtered.length ===
          0 ? (
          <div className="px-5 py-16 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <DocumentIcon />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-700">
              No invoices found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Approved quotations automatically appear here with their generated invoice.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead className="bg-slate-50/70">

                <tr className="border-b border-[var(--color-border)] text-left">

                  {[
                    'Invoice',
                    'Customer',
                    'Amount',
                    'Status',
                    'Due date',
                    '',
                  ].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]"
                      >
                        {heading}
                      </th>
                    )
                  )}

                </tr>

              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">

                {filtered.map(
                  (invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50/70"
                    >

                      <td className="px-5 py-4">

                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {
                            invoice.invoiceNumber
                          }
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          {label(
                            invoice.type
                          )}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {invoice.quotation
                            ?.customer
                            ?.name ||
                            '—'}
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          {invoice.quotation
                            ?.quoteNumber ||
                            '—'}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {money(
                            invoice.totalAmount
                          )}
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          Paid{' '}
                          {money(
                            invoice.paidAmount
                          )}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                            invoice.status
                          )}`}
                        >
                          {label(
                            invoice.status
                          )}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                        {date(
                          invoice.dueDate
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">

                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                          View Invoice →
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