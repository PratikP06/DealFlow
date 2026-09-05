'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import Link from 'next/link'
import {
  useParams,
  useRouter,
} from 'next/navigation'

export default function FulfillmentDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [quotation, setQuotation] =
    useState(null)

  const [workflow, setWorkflow] =
    useState(null)

  const [suggestedSplit, setSuggestedSplit] =
    useState(null)

  const [warehouseOptions, setWarehouseOptions] =
    useState([])

  const [auditLogs, setAuditLogs] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [busy, setBusy] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [manualOpen, setManualOpen] =
    useState(false)

  const [manualRows, setManualRows] =
    useState([])

  useEffect(() => {
    if (params?.id) {
      loadQuotation()
    }
  }, [params?.id])

  async function loadQuotation() {
    try {
      setLoading(true)
      setError('')

      const response =
        await fetch(
          `/api/sales/fulfillment/${params.id}`,
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

      setQuotation(data)

      setWorkflow(
        data.workflow || null
      )

      setSuggestedSplit(
        data.suggestedSplit || null
      )

      setWarehouseOptions(
        data.warehouseOptions || []
      )

      setAuditLogs(
        data.auditLogs || []
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

  async function runAction(
    action,
    payload = {}
  ) {
    try {
      setBusy(true)
      setError('')
      setSuccess('')

      const response =
        await fetch(
          `/api/sales/fulfillment/${params.id}`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              action,
              ...payload,
            }),
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
            'Fulfillment action failed'
        )
      }

      setSuccess(
        actionMessage(action)
      )

      setManualOpen(false)

      await loadQuotation()
    } catch (err) {
      setError(
        err.message ||
          'Fulfillment action failed'
      )
    } finally {
      setBusy(false)
    }
  }

  function openManualOverride() {
    const physicalLines =
      (quotation?.lines || []).filter(
        (line) =>
          line.product?.type ===
          'PHYSICAL'
      )

    const rows = []

    for (
      const line of physicalLines
    ) {
      for (
        const warehouse of
          warehouseOptions
      ) {
        const stock =
          warehouse.stock?.find(
            (item) =>
              item.productId ===
              line.productId
          )

        const existing =
          (line.allocations || []).find(
            (allocation) =>
              allocation.warehouseId ===
              warehouse.id
          )

        rows.push({
          key: `${line.id}:${warehouse.id}`,

          quotationLineId:
            line.id,

          productId:
            line.productId,

          productName:
            line.product?.name ||
            'Product',

          warehouseId:
            warehouse.id,

          warehouseName:
            warehouse.name,

          availableQuantity:
            Number(
              stock?.quantity || 0
            ),

          allocatedQuantity:
            Number(
              existing?.allocatedQuantity ||
                0
            ),
        })
      }
    }

    setManualRows(rows)
    setManualOpen(true)
  }

  function updateManualRow(
    key,
    value
  ) {
    setManualRows(
      (rows) =>
        rows.map((row) =>
          row.key === key
            ? {
                ...row,
                allocatedQuantity:
                  value,
              }
            : row
        )
    )
  }

  function buildManualPayload() {
    const physicalLines =
      (quotation?.lines || []).filter(
        (line) =>
          line.product?.type ===
          'PHYSICAL'
      )

    const payload = []

    for (
      const line of physicalLines
    ) {
      const rows =
        manualRows.filter(
          (row) =>
            row.quotationLineId ===
            line.id
        )

      const ordered =
        Number(line.quantity || 0)

      const allocated =
        rows.reduce(
          (sum, row) =>
            sum +
            Math.max(
              0,
              Number(
                row.allocatedQuantity ||
                  0
              )
            ),
          0
        )

      const remaining =
        Math.max(
          0,
          ordered - allocated
        )

      for (
        const row of rows
      ) {
        const quantity =
          Math.max(
            0,
            Number(
              row.allocatedQuantity ||
                0
            )
          )

        if (quantity > 0) {
          payload.push({
            quotationLineId:
              row.quotationLineId,

            warehouseId:
              row.warehouseId,

            allocatedQuantity:
              quantity,

            backorderQuantity:
              0,
          })
        }
      }

      /*
       * Any unallocated quantity automatically
       * becomes backorder.
       */
      if (remaining > 0) {
        const backorderWarehouse =
          rows[0]

        if (!backorderWarehouse) {
          throw new Error(
            `No active warehouse available for ${line.product?.name || 'product'}`
          )
        }

        payload.push({
          quotationLineId:
            line.id,

          warehouseId:
            backorderWarehouse.warehouseId,

          allocatedQuantity:
            0,

          backorderQuantity:
            remaining,
        })
      }
    }

    return payload
  }

  async function submitManualOverride() {
    try {
      const allocations =
        buildManualPayload()

      if (
        !allocations.length
      ) {
        throw new Error(
          'Add at least one allocation'
        )
      }

      await runAction(
        'MANUAL_OVERRIDE',
        {
          allocations,
        }
      )
    } catch (err) {
      setError(
        err.message ||
          'Invalid manual allocation'
      )
    }
  }

  const summary = useMemo(
    () =>
      getFulfillmentSummary(
        quotation
      ),
    [quotation]
  )

  const progressBase =
    summary.ordered > 0
      ? Math.min(
          100,
          Math.round(
            (summary.allocated /
              summary.ordered) *
              100
          )
        )
      : 0

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-[var(--color-text-tertiary)]">
        Loading fulfillment detail...
      </div>
    )
  }

  if (error && !quotation) {
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

  const isFinance =
    workflow?.canApprove

  const hasBackorder =
    summary.backorder > 0

  const needsInitialApproval =
    quotation.fulfillmentStatus ===
      'PENDING' &&
    summary.ordered > 0

  const canConsolidate =
    [
      'PARTIALLY_ALLOCATED',
      'BACKORDERED',
    ].includes(
      quotation.fulfillmentStatus
    )

  const canMarkFulfilled =
    quotation.fulfillmentStatus ===
    'ALLOCATED'

  return (
    <div className="space-y-8">
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
                Fulfillment Detail:{' '}
                {quotation.quoteNumber}
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <section
        className={`rounded-xl border p-5 ${
          isFinance
            ? 'border-[var(--color-primary-200)] bg-[var(--color-primary-50)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldIcon className="h-5 w-5 text-[var(--color-primary-600)]" />

              <h2 className="font-semibold text-[var(--color-text-primary)]">
                Fulfillment approval authority
              </h2>
            </div>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Finance / Operations owns
              warehouse split, stock allocation
              and backorder decisions. Sales reps
              can monitor progress but cannot
              reserve stock.
            </p>
          </div>

          <span
            className={
              isFinance
                ? 'badge badge-success'
                : 'badge badge-info'
            }
          >
            {isFinance
              ? 'You can approve'
              : 'Monitoring only'}
          </span>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Warehouse fulfillment progress
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              {summary.allocated} of{' '}
              {summary.ordered} physical units
              allocated. {summary.fulfilled}{' '}
              physically fulfilled.
            </p>
          </div>

          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {progressBase}%
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary-600)] transition-all"
            style={{
              width: `${progressBase}%`,
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard
            label="Ordered"
            value={summary.ordered}
          />

          <SummaryCard
            label="Allocated"
            value={summary.allocated}
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

      {isFinance &&
        needsInitialApproval && (
          <section className="card border-[var(--color-primary-200)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <SparkIcon className="h-5 w-5 text-[var(--color-primary-600)]" />

                  <h2 className="font-semibold text-[var(--color-text-primary)]">
                    Automated warehouse
                    recommendation
                  </h2>
                </div>

                <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                  The server ranked active
                  warehouses by shipping cost
                  weight and current stock.
                  Review it, then approve it to
                  reserve inventory.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      'ACCEPT_SUGGESTED_SPLIT'
                    )
                  }
                  className="btn btn-primary btn-sm"
                >
                  {busy
                    ? 'Processing...'
                    : 'Approve Suggested Split'}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={
                    openManualOverride
                  }
                  className="btn btn-secondary btn-sm"
                >
                  Manual Allocation
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-muted)]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    <th className="px-4 py-3">
                      Product
                    </th>

                    <th className="px-4 py-3">
                      Warehouse
                    </th>

                    <th className="px-4 py-3 text-right">
                      Available
                    </th>

                    <th className="px-4 py-3 text-right">
                      Allocate
                    </th>

                    <th className="px-4 py-3 text-right">
                      Backorder
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--color-border)]">
                  {(
                    suggestedSplit?.allocations ||
                    []
                  ).map(
                    (
                      allocation,
                      index
                    ) => {
                      const line =
                        quotation.lines.find(
                          (item) =>
                            item.id ===
                            allocation.quotationLineId
                        )

                      return (
                        <tr
                          key={`${allocation.quotationLineId}:${allocation.warehouseId}:${index}`}
                        >
                          <td className="px-4 py-3 font-medium">
                            {line
                              ?.product
                              ?.name ||
                              'Product'}
                          </td>

                          <td className="px-4 py-3">
                            {
                              allocation.warehouseName
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              allocation.availableQuantity
                            }
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">
                            {
                              allocation.allocatedQuantity
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {allocation.backorderQuantity >
                            0 ? (
                              <span className="font-semibold text-[var(--color-warning)]">
                                {
                                  allocation.backorderQuantity
                                }
                              </span>
                            ) : (
                              0
                            )}
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      {hasBackorder && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="font-semibold text-amber-900">
                  Backorder in progress
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  {summary.backorder}{' '}
                  unit
                  {summary.backorder === 1
                    ? ''
                    : 's'} remain
                  outstanding. Finance can
                  re-run allocation when stock
                  becomes available.
                </p>
              </div>
            </div>

            {isFinance &&
              canConsolidate && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      'CONSOLIDATE_BACKORDER'
                    )
                  }
                  className="btn btn-secondary btn-sm"
                >
                  {busy
                    ? 'Checking stock...'
                    : 'Approve Backorder Reallocation'}
                </button>
              )}
          </div>
        </section>
      )}

      <section className="card overflow-hidden p-0">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Fulfillment by Product
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Reserved stock, fulfillment
            completion and outstanding
            quantities by warehouse.
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
          <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">
            No physical products require
            warehouse fulfillment.
          </div>
        )}
      </section>

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
            Service items do not require
            warehouse allocation.
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
                    <p className="text-sm font-medium">
                      {line.product?.name}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                      Quantity:{' '}
                      {Number(
                        line.quantity
                      )}
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

      <section className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              Completion
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              Allocation reserves inventory.
              Fulfillment is the separate final
              completion step.
            </p>
          </div>

          {isFinance &&
            canMarkFulfilled && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(
                    'MARK_FULFILLED'
                  )
                }
                className="btn btn-primary btn-sm"
              >
                {busy
                  ? 'Completing...'
                  : 'Mark Fulfilled'}
              </button>
            )}

          {!isFinance &&
            quotation.fulfillmentStatus ===
              'ALLOCATED' && (
              <span className="badge badge-info">
                Awaiting Finance completion
              </span>
            )}
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold text-[var(--color-text-primary)]">
          Fulfillment audit trail
        </h2>

        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          Finance approval actions are
          recorded against the quotation.
        </p>

        <div className="mt-4 space-y-3">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">
              No fulfillment approval
              activity yet.
            </p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 rounded-lg bg-[var(--color-surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatAuditAction(
                      log.action
                    )}
                  </p>

                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {log.actor?.name ||
                      'System'}{' '}
                    ·{' '}
                    {log.actor?.role ||
                      '—'}
                  </p>
                </div>

                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {formatDateTime(
                    log.createdAt
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {manualOpen && (
        <ManualOverrideModal
          rows={manualRows}
          quotation={quotation}
          busy={busy}
          onClose={() =>
            setManualOpen(false)
          }
          onChange={
            updateManualRow
          }
          onSubmit={
            submitManualOverride
          }
        />
      )}
    </div>
  )
}

function ProductFulfillment({
  line,
}) {
  const allocations =
    line.allocations || []

  const ordered =
    Number(line.quantity || 0)

  const allocated =
    allocations.reduce(
      (sum, allocation) =>
        sum +
        Number(
          allocation.allocatedQuantity ||
            0
        ),
      0
    )

  const fulfilled =
    allocations
      .filter(
        (allocation) =>
          allocation.status ===
          'FULFILLED'
      )
      .reduce(
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
          <p className="font-semibold">
            {line.product?.name ||
              'Product'}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {line.product?.sku ||
              '—'}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-5 text-sm">
          <MiniStat
            label="Ordered"
            value={ordered}
          />

          <MiniStat
            label="Allocated"
            value={allocated}
          />

          <MiniStat
            label="Fulfilled"
            value={fulfilled}
          />

          <MiniStat
            label="Backorder"
            value={backorder}
            warning={
              backorder > 0
            }
          />
        </div>
      </div>

      {allocations.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--color-border)]">
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
                  Allocated
                </th>

                <th className="px-4 py-3 text-right">
                  Backorder
                </th>

                <th className="px-4 py-3">
                  State
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {allocations.map(
                (allocation) => (
                  <tr
                    key={allocation.id}
                  >
                    <td className="px-4 py-3 font-medium">
                      {allocation
                        .warehouse
                        ?.name ||
                        'Warehouse'}
                    </td>

                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {allocation
                        .warehouse
                        ?.location ||
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
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <AllocationBadge
                        status={
                          allocation.status
                        }
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
          Inventory has not been allocated
          yet.
        </div>
      )}
    </div>
  )
}

function ManualOverrideModal({
  rows,
  quotation,
  busy,
  onClose,
  onChange,
  onSubmit,
}) {
  const physicalLines =
    quotation.lines.filter(
      (line) =>
        line.product?.type ===
        'PHYSICAL'
    )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="font-semibold">
              Manual warehouse allocation
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              Finance approval only.
              Allocate available stock; any
              remainder becomes backorder
              automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5 space-y-6">
          {physicalLines.map(
            (line) => (
              <div
                key={line.id}
                className="rounded-xl border border-[var(--color-border)]"
              >
                <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {
                          line.product
                            ?.name
                        }
                      </p>

                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Ordered:{' '}
                        {Number(
                          line.quantity
                        )}
                      </p>
                    </div>

                    <span className="badge badge-info">
                      {
                        line.product
                          ?.sku
                      }
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                        <th className="px-4 py-3">
                          Warehouse
                        </th>

                        <th className="px-4 py-3">
                          Available
                        </th>

                        <th className="px-4 py-3">
                          Approve allocation
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--color-border)]">
                      {rows
                        .filter(
                          (row) =>
                            row.quotationLineId ===
                            line.id
                        )
                        .map(
                          (row) => (
                            <tr
                              key={
                                row.key
                              }
                            >
                              <td className="px-4 py-3 font-medium">
                                {
                                  row.warehouseName
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  row.availableQuantity
                                }
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  max={
                                    row.availableQuantity
                                  }
                                  step="0.01"
                                  value={
                                    row.allocatedQuantity
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    onChange(
                                      row.key,
                                      e.target
                                        .value
                                    )
                                  }
                                  className="input w-32"
                                />
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onSubmit}
            className="btn btn-primary"
          >
            {busy
              ? 'Approving...'
              : 'Approve Allocation'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getFulfillmentSummary(
  quotation
) {
  const physicalLines =
    quotation?.lines?.filter(
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
          (
            inner,
            allocation
          ) =>
            inner +
            Number(
              allocation.allocatedQuantity ||
                0
            ),
          0
        ),
      0
    )

  const fulfilled =
    physicalLines.reduce(
      (sum, line) =>
        sum +
        (line.allocations || [])
          .filter(
            (allocation) =>
              allocation.status ===
              'FULFILLED'
          )
          .reduce(
            (
              inner,
              allocation
            ) =>
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
          (
            inner,
            allocation
          ) =>
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

function MiniStat({
  label,
  value,
  warning = false,
}) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-tertiary)]">
        {label}
      </p>

      <p
        className={`mt-1 font-semibold ${
          warning
            ? 'text-[var(--color-warning)]'
            : ''
        }`}
      >
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
      'Unknown',
      'badge-neutral',
    ]

  return (
    <span
      className={`badge ${className}`}
    >
      {label}
    </span>
  )
}

function AllocationBadge({
  status,
}) {
  const config = {
    ALLOCATED: [
      'Reserved',
      'badge-success',
    ],

    PARTIALLY_ALLOCATED: [
      'Partial',
      'badge-warning',
    ],

    BACKORDERED: [
      'Backorder',
      'badge-danger',
    ],

    FULFILLED: [
      'Fulfilled',
      'badge-success',
    ],
  }

  const [label, cls] =
    config[status] || [
      'Pending',
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

function actionMessage(
  action
) {
  return {
    ACCEPT_SUGGESTED_SPLIT:
      'Suggested warehouse split approved and inventory reserved.',

    MANUAL_OVERRIDE:
      'Manual warehouse allocation approved and inventory reserved.',

    CONSOLIDATE_BACKORDER:
      'Backorder reallocation approved using newly available stock.',

    MARK_FULFILLED:
      'Fulfillment marked complete.',
  }[action] || 'Fulfillment updated.'
}

function formatAuditAction(
  action
) {
  return {
    FULFILLMENT_SPLIT_APPROVED:
      'Suggested split approved',

    FULFILLMENT_MANUAL_OVERRIDE_APPROVED:
      'Manual allocation approved',

    BACKORDER_CONSOLIDATION_APPROVED:
      'Backorder reallocation approved',

    FULFILLMENT_COMPLETED:
      'Fulfillment completed',
  }[action] || action
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
      minute: '2-digit',
    }
  ).format(new Date(value))
}

function WarningIcon({
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
        d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.29 3.86l-8.82 15a1.5 1.5 0 001.29 2.25h18.48a1.5 1.5 0 001.29-2.25l-8.82-15a1.5 1.5 0 00-2.58 0z"
      />
    </svg>
  )
}

function ShieldIcon({
  className,
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-2.9 7.8-7 10-4.1-2.2-7-5.5-7-10V6l7-3z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 12l1.7 1.7 3.4-3.4"
      />
    </svg>
  )
}

function SparkIcon({
  className,
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l1.2 5.3L18 10l-4.8 1.7L12 17l-1.2-5.3L6 10l4.8-1.7L12 3zm7 11l.6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14z"
      />
    </svg>
  )
}