'use client'

import { useEffect, useMemo, useState } from 'react'

const STATUS_STYLES = {
  SENT: 'badge-info',
  UNDER_NEGOTIATION: 'badge-warning',
  CONFIRMED: 'badge-success',
}

const STATUS_LABELS = {
  SENT: 'Sent',
  UNDER_NEGOTIATION: 'Under Negotiation',
  CONFIRMED: 'Confirmed',
}

const NEGOTIATION_LABELS = {
  DISCOUNT: 'Discount',
  QUANTITY: 'Quantity',
  LINE_CHANGE: 'Line Change',
  COMMENT: 'Comment',
}

function money(value) {
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

function calculateLineTotal(line) {
  const quantity = Number(line.quantity || 0)
  const unitPrice = Number(line.unitPrice || 0)
  const discount = Number(
    line.discountPercent || 0
  )

  const gross = quantity * unitPrice

  return gross * (1 - discount / 100)
}

export default function PortalPage() {
  const [customer, setCustomer] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [negotiationType, setNegotiationType] =
    useState('COMMENT')

  const [selectedLineId, setSelectedLineId] =
    useState('')

  const [proposedDiscount, setProposedDiscount] =
    useState('')

  const [proposedQuantity, setProposedQuantity] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [submitting, setSubmitting] =
    useState(false)

  const [confirming, setConfirming] =
    useState(false)

  const [notice, setNotice] =
    useState('')

  const [search, setSearch] =
    useState('')

  const loadPortal = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        '/api/customer/quotations',
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to load quotations'
        )
      }

      setCustomer(data.customer)
      setQuotations(data.quotations || [])

      if (
        data.quotations?.length > 0
      ) {
        setSelectedId((current) => {
          if (
            current &&
            data.quotations.some(
              (quote) => quote.id === current
            )
          ) {
            return current
          }

          return data.quotations[0].id
        })
      } else {
        setSelectedId(null)
      }
    } catch (err) {
      setError(
        err.message ||
          'Unable to load customer portal'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPortal()
  }, [])

  const filteredQuotations =
    useMemo(() => {
      const term =
        search.trim().toLowerCase()

      if (!term) return quotations

      return quotations.filter(
        (quote) =>
          quote.quoteNumber
            ?.toLowerCase()
            .includes(term) ||
          quote.status
            ?.toLowerCase()
            .includes(term)
      )
    }, [quotations, search])

  const selectedQuotation =
    quotations.find(
      (quote) =>
        quote.id === selectedId
    ) || null

  const totals = useMemo(() => {
    if (!selectedQuotation) {
      return {
        subtotal: 0,
        tax: 0,
        total: 0,
      }
    }

    let subtotal = 0
    let tax = 0

    selectedQuotation.lines.forEach(
      (line) => {
        const lineTotal =
          calculateLineTotal(line)

        subtotal += lineTotal

        const taxPercent = Number(
          line.taxPercentSnapshot || 0
        )

        tax +=
          lineTotal *
          (taxPercent / 100)
      }
    )

    return {
      subtotal,
      tax,
      total: subtotal + tax,
    }
  }, [selectedQuotation])

  const pendingNegotiations =
    selectedQuotation?.negotiations?.filter(
      (item) => item.status === 'PENDING'
    ) || []

  const canInteract =
    selectedQuotation &&
    selectedQuotation.status !== 'CONFIRMED'

  const submitNegotiation =
    async (event) => {
      event.preventDefault()

      if (!selectedQuotation) return

      setSubmitting(true)
      setError('')
      setNotice('')

      try {
        const response =
          await fetch(
            '/api/customer/negotiations',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                quotationId:
                  selectedQuotation.id,
                quotationLineId:
                  selectedLineId || null,
                type:
                  negotiationType,
                proposedDiscount:
                  negotiationType ===
                  'DISCOUNT'
                    ? proposedDiscount
                    : null,
                proposedQuantity:
                  negotiationType ===
                  'QUANTITY'
                    ? proposedQuantity
                    : null,
                message:
                  message.trim() || null,
              }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to submit request'
          )
        }

        setNotice(
          'Your negotiation request has been sent to the sales team.'
        )

        setSelectedLineId('')
        setProposedDiscount('')
        setProposedQuantity('')
        setMessage('')

        await loadPortal()
      } catch (err) {
        setError(
          err.message ||
            'Unable to submit request'
        )
      } finally {
        setSubmitting(false)
      }
    }

  const confirmQuotation =
    async () => {
      if (!selectedQuotation) return

      if (
        pendingNegotiations.length > 0
      ) {
        setError(
          'Please wait for all pending negotiation requests to be resolved before confirming.'
        )
        return
      }

      const confirmed =
        window.confirm(
          `Confirm quotation ${selectedQuotation.quoteNumber}?`
        )

      if (!confirmed) return

      /*
       * Confirmation endpoint is intentionally
       * kept on the quotation API side.
       *
       * We call the existing quotation endpoint
       * only after the customer has passed all
       * local checks.
       */
      setConfirming(true)
      setError('')
      setNotice('')

      try {
        const response =
          await fetch(
            `/api/customer/quotations/${selectedQuotation.id}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                action: 'CONFIRM',
              }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to confirm quotation'
          )
        }

        setNotice(
          'Quotation confirmed successfully.'
        )

        await loadPortal()
      } catch (err) {
        setError(
          err.message ||
            'Unable to confirm quotation'
        )
      } finally {
        setConfirming(false)
      }
    }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary-600)] rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Loading your quotations...
          </p>
        </div>
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card card-padding max-w-md w-full">
          <h2 className="text-lg font-semibold">
            Unable to load portal
          </h2>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {error}
          </p>

          <button
            type="button"
            onClick={loadPortal}
            className="btn btn-primary mt-5"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[var(--color-border)]">
        <div className="px-5 lg:px-8 py-4">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">

            <div className="pl-12 lg:pl-0">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Customer Portal
              </p>

              <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mt-0.5">
                My Quotations
              </h1>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {customer?.name}
                </p>

                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {customer?.email}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center text-white text-sm font-semibold">
                {customer?.name
                  ?.charAt(0)
                  ?.toUpperCase() || 'C'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 lg:px-8 py-6">
        <div className="max-w-[1400px] mx-auto">

          {/* Alerts */}
          {notice && (
            <div className="mb-5 rounded-md border border-[var(--color-success-100)] bg-[var(--color-success-50)] px-4 py-3 text-sm text-[var(--color-success-700)]">
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-md border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-4 py-3 text-sm text-[var(--color-danger-700)]">
              {error}
            </div>
          )}

          {quotations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">

              {/* Quotation list */}
              <section className="card overflow-hidden h-fit">

                <div className="p-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                      Quotations
                    </h2>

                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {quotations.length}
                    </span>
                  </div>

                  <div className="mt-3">
                    <input
                      type="search"
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      placeholder="Search quotations..."
                      className="input"
                    />
                  </div>
                </div>

                <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                  {filteredQuotations.map(
                    (quote) => {
                      const active =
                        quote.id === selectedId

                      return (
                        <button
                          key={quote.id}
                          type="button"
                          onClick={() =>
                            setSelectedId(
                              quote.id
                            )
                          }
                          className={`w-full text-left p-4 border-b border-[var(--color-border)] transition-colors ${
                            active
                              ? 'bg-[var(--color-primary-50)]'
                              : 'hover:bg-[var(--color-surface-secondary)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                                {quote.quoteNumber}
                              </p>

                              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                Updated{' '}
                                {formatDate(
                                  quote.updatedAt
                                )}
                              </p>
                            </div>

                            <span
                              className={`badge ${
                                STATUS_STYLES[
                                  quote.status
                                ] ||
                                'badge-neutral'
                              }`}
                            >
                              {STATUS_LABELS[
                                quote.status
                              ] ||
                                quote.status}
                            </span>
                          </div>
                        </button>
                      )
                    }
                  )}
                </div>
              </section>

              {/* Selected quotation */}
              {selectedQuotation ? (
                <section className="space-y-5">

                  {/* Quote heading */}
                  <div className="card card-padding">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-xl font-semibold">
                            {selectedQuotation.quoteNumber}
                          </h2>

                          <span
                            className={`badge ${
                              STATUS_STYLES[
                                selectedQuotation.status
                              ] ||
                              'badge-neutral'
                            }`}
                          >
                            {STATUS_LABELS[
                              selectedQuotation.status
                            ] ||
                              selectedQuotation.status}
                          </span>
                        </div>

                        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                          Review your quotation and negotiate the terms directly with the sales team.
                        </p>
                      </div>

                      {selectedQuotation.deliveryPromiseDate && (
                        <div className="text-left lg:text-right">
                          <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            Delivery Promise
                          </p>

                          <p className="text-sm font-semibold mt-1">
                            {formatDate(
                              selectedQuotation.deliveryPromiseDate
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lines */}
                  <div className="card overflow-hidden">

                    <div className="px-5 py-4 border-b border-[var(--color-border)]">
                      <h3 className="text-sm font-semibold">
                        Quotation Details
                      </h3>

                      <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        Products and services included in this quotation.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                          <tr>
                            <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Item
                            </th>

                            <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Type
                            </th>

                            <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Qty
                            </th>

                            <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Unit Price
                            </th>

                            <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Discount
                            </th>

                            <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedQuotation.lines.map(
                            (line) => (
                              <tr
                                key={line.id}
                                className="border-b border-[var(--color-border)]"
                              >
                                <td className="px-5 py-4">
                                  <p className="font-medium">
                                    {line.product?.name}
                                  </p>

                                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                                    {line.product?.sku}
                                  </p>

                                  {line.subscriptionPlan && (
                                    <p className="text-xs text-[var(--color-primary-600)] mt-1">
                                      {
                                        line.subscriptionPlan.name
                                      }
                                    </p>
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  <span className="badge badge-neutral">
                                    {line.lineType ===
                                    'RECURRING'
                                      ? 'Recurring'
                                      : 'One-time'}
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-right">
                                  {Number(
                                    line.quantity
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right">
                                  {money(
                                    line.unitPrice
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right">
                                  {Number(
                                    line.discountPercent ||
                                      0
                                  ).toFixed(2)}
                                  %
                                </td>

                                <td className="px-5 py-4 text-right font-medium">
                                  {money(
                                    calculateLineTotal(
                                      line
                                    )
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="p-5 bg-[var(--color-surface-secondary)]">
                      <div className="ml-auto max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)]">
                            Subtotal
                          </span>

                          <span>
                            {money(
                              totals.subtotal
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)]">
                            Tax
                          </span>

                          <span>
                            {money(totals.tax)}
                          </span>
                        </div>

                        <div className="pt-2 mt-2 border-t border-[var(--color-border)] flex justify-between">
                          <span className="font-semibold">
                            Total
                          </span>

                          <span className="text-lg font-bold">
                            {money(
                              totals.total
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing schedule */}
                  {selectedQuotation.billingSchedules?.length >
                    0 && (
                    <div className="card overflow-hidden">
                      <div className="px-5 py-4 border-b border-[var(--color-border)]">
                        <h3 className="text-sm font-semibold">
                          Recurring Billing Schedule
                        </h3>

                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          Upcoming billing for recurring quotation lines.
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                            <tr>
                              <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                                Period
                              </th>

                              <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                                Billing Date
                              </th>

                              <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                                Amount
                              </th>

                              <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {selectedQuotation.billingSchedules.map(
                              (entry) => (
                                <tr
                                  key={
                                    entry.id
                                  }
                                  className="border-b border-[var(--color-border)] last:border-b-0"
                                >
                                  <td className="px-5 py-4">
                                    {formatDate(
                                      entry.periodStart
                                    )}{' '}
                                    —{' '}
                                    {formatDate(
                                      entry.periodEnd
                                    )}
                                  </td>

                                  <td className="px-5 py-4">
                                    {formatDate(
                                      entry.billingDate
                                    )}
                                  </td>

                                  <td className="px-5 py-4 text-right font-medium">
                                    {money(
                                      entry.amount
                                    )}
                                  </td>

                                  <td className="px-5 py-4 text-right">
                                    <span className="badge badge-neutral">
                                      {
                                        entry.status
                                      }
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Negotiation */}
                  <div className="card overflow-hidden">

                    <div className="px-5 py-4 border-b border-[var(--color-border)]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold">
                            Negotiation
                          </h3>

                          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            Ask questions, request changes, or counter the quotation.
                          </p>
                        </div>

                        {pendingNegotiations.length >
                          0 && (
                          <span className="badge badge-warning">
                            {pendingNegotiations.length}{' '}
                            pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Existing requests */}
                    <div className="p-5">
                      {selectedQuotation.negotiations?.length >
                      0 ? (
                        <div className="space-y-3 mb-6">
                          {selectedQuotation.negotiations.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="border border-[var(--color-border)] rounded-md p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {NEGOTIATION_LABELS[
                                        item.type
                                      ] ||
                                        item.type}
                                    </p>

                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                      {formatDate(
                                        item.createdAt
                                      )}
                                    </p>
                                  </div>

                                  <span
                                    className={`badge ${
                                      item.status ===
                                      'PENDING'
                                        ? 'badge-warning'
                                        : item.status ===
                                          'ACCEPTED'
                                        ? 'badge-success'
                                        : item.status ===
                                          'REJECTED'
                                        ? 'badge-danger'
                                        : 'badge-neutral'
                                    }`}
                                  >
                                    {
                                      item.status
                                    }
                                  </span>
                                </div>

                                {item.proposedDiscount !==
                                  null &&
                                  item.proposedDiscount !==
                                    undefined && (
                                    <p className="text-sm mt-3">
                                      Proposed discount:{' '}
                                      <strong>
                                        {Number(
                                          item.proposedDiscount
                                        ).toFixed(
                                          2
                                        )}
                                        %
                                      </strong>
                                    </p>
                                  )}

                                {item.proposedQuantity !==
                                  null &&
                                  item.proposedQuantity !==
                                    undefined && (
                                    <p className="text-sm mt-3">
                                      Proposed quantity:{' '}
                                      <strong>
                                        {Number(
                                          item.proposedQuantity
                                        )}
                                      </strong>
                                    </p>
                                  )}

                                {item.message && (
                                  <div className="mt-3 rounded-md bg-[var(--color-surface-secondary)] p-3">
                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                      {item.message}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-4 mb-6">
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            No negotiation requests yet. You can request a change below.
                          </p>
                        </div>
                      )}

                      {/* New request */}
                      {canInteract ? (
                        <form
                          onSubmit={
                            submitNegotiation
                          }
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                                Request Type
                              </label>

                              <select
                                value={
                                  negotiationType
                                }
                                onChange={(e) =>
                                  setNegotiationType(
                                    e.target.value
                                  )
                                }
                                className="select"
                              >
                                <option value="COMMENT">
                                  Question / Comment
                                </option>

                                <option value="DISCOUNT">
                                  Counter Discount
                                </option>

                                <option value="QUANTITY">
                                  Quantity Change
                                </option>

                                <option value="LINE_CHANGE">
                                  Line Change
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                                Quotation Line
                              </label>

                              <select
                                value={
                                  selectedLineId
                                }
                                onChange={(e) =>
                                  setSelectedLineId(
                                    e.target.value
                                  )
                                }
                                className="select"
                              >
                                <option value="">
                                  Entire quotation
                                </option>

                                {selectedQuotation.lines.map(
                                  (line) => (
                                    <option
                                      key={
                                        line.id
                                      }
                                      value={
                                        line.id
                                      }
                                    >
                                      {
                                        line
                                          .product
                                          ?.name
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          </div>

                          {negotiationType ===
                            'DISCOUNT' && (
                            <div className="max-w-xs">
                              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                                Counter Discount %
                              </label>

                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  proposedDiscount
                                }
                                onChange={(e) =>
                                  setProposedDiscount(
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. 18"
                                className="input"
                                required
                              />
                            </div>
                          )}

                          {negotiationType ===
                            'QUANTITY' && (
                            <div className="max-w-xs">
                              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                                Proposed Quantity
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  proposedQuantity
                                }
                                onChange={(e) =>
                                  setProposedQuantity(
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. 25"
                                className="input"
                                required
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                              Message
                            </label>

                            <textarea
                              value={message}
                              onChange={(e) =>
                                setMessage(
                                  e.target.value
                                )
                              }
                              rows={4}
                              placeholder={
                                negotiationType ===
                                'DISCOUNT'
                                  ? 'Explain why you are requesting this discount...'
                                  : negotiationType ===
                                    'QUANTITY'
                                  ? 'Explain the quantity change you need...'
                                  : 'Ask your question or describe the requested change...'
                              }
                              className="input resize-none"
                              required={
                                negotiationType ===
                                  'COMMENT' ||
                                negotiationType ===
                                  'LINE_CHANGE'
                              }
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="submit"
                              disabled={
                                submitting
                              }
                              className="btn btn-primary"
                            >
                              {submitting
                                ? 'Submitting...'
                                : 'Submit Request'}
                            </button>

                            <button
                              type="button"
                              disabled={
                                confirming ||
                                pendingNegotiations.length >
                                  0
                              }
                              onClick={
                                confirmQuotation
                              }
                              className="btn btn-secondary"
                            >
                              {confirming
                                ? 'Confirming...'
                                : 'Confirm Quotation'}
                            </button>
                          </div>

                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            If your requested final terms exceed the configured approval thresholds, the quotation will return to the approval workflow.
                          </p>
                        </form>
                      ) : (
                        <div className="rounded-md border border-[var(--color-success-100)] bg-[var(--color-success-50)] p-4">
                          <p className="text-sm font-medium text-[var(--color-success-700)]">
                            This quotation has been confirmed.
                          </p>

                          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            No further negotiation is available for this quotation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="card card-padding flex items-center justify-center min-h-[400px]">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Select a quotation to view its details.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)] flex items-center justify-center mx-auto">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2.25-13.5H6.75A2.25 2.25 0 004.5 4.75v14.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.75a2.25 2.25 0 00-2.25-2.25z"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold mt-4">
        No quotations yet
      </h2>

      <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-md mx-auto">
        Your sales representative will send quotations here when they are ready for your review.
      </p>
    </div>
  )
}