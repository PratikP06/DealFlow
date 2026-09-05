'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function ApprovalDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [quotation, setQuotation] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [actionLoading, setActionLoading] =
    useState(false)

  const [showReason, setShowReason] =
    useState(false)

  const [selectedAction, setSelectedAction] =
    useState('')

  const [reason, setReason] =
    useState('')

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
        `/api/sales/approvals/${params.id}`
      )

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        const data = await response.json()

        throw new Error(
          data.error ||
            'Failed to load approval'
        )
      }

      const data = await response.json()

      setQuotation(data)
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Unable to load approval.'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatRole(role) {
    if (role === 'SALES_MANAGER') {
      return 'Sales Manager'
    }

    if (role === 'FINANCE') {
      return 'Finance'
    }

    return role
      ? role
          .replaceAll('_', ' ')
          .replace(/\b\w/g, (c) =>
            c.toUpperCase()
          )
      : '—'
  }

  function formatStatus(status) {
    if (status === 'PENDING') {
      return 'Pending'
    }

    if (status === 'APPROVED') {
      return 'Approved'
    }

    if (status === 'REJECTED') {
      return 'Rejected'
    }

    if (status === 'RETURNED') {
      return 'Returned'
    }

    return status || '—'
  }

  function getStatusClass(status) {
    if (status === 'APPROVED') {
      return 'badge-success'
    }

    if (status === 'REJECTED') {
      return 'badge-danger'
    }

    if (status === 'RETURNED') {
      return 'badge-warning'
    }

    return 'badge-info'
  }

  function getRiskLabel(score) {
    const value = Number(score || 0)

    if (value > 8) return 'HIGH'
    if (value > 0) return 'MEDIUM'

    return 'LOW'
  }

  function getRiskClass(score) {
    const label =
      getRiskLabel(score)

    if (label === 'HIGH') {
      return 'badge-danger'
    }

    if (label === 'MEDIUM') {
      return 'badge-warning'
    }

    return 'badge-success'
  }

  function money(value) {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }
    ).format(Number(value || 0))
  }

  function formatDate(value) {
    if (!value) return '—'

    return new Date(value).toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    )
  }

  const currentStep = useMemo(() => {
    if (!quotation) return null

    const steps =
      quotation.approvalSteps || []

    return (
      steps
        .filter(
          (step) =>
            step.approvalRound ===
            quotation.approvalRound
        )
        .sort(
          (a, b) =>
            a.stepOrder - b.stepOrder
        )
        .find(
          (step) =>
            step.status === 'PENDING'
        ) || null
    )
  }, [quotation])

  const total = useMemo(() => {
    if (!quotation?.lines) return 0

    return quotation.lines.reduce(
      (sum, line) => {
        const subtotal =
          Number(line.unitPrice || 0) *
          Number(line.quantity || 0)

        const discount =
          subtotal *
          (Number(
            line.discountPercent || 0
          ) /
            100)

        return (
          sum +
          subtotal -
          discount
        )
      },
      0
    )
  }, [quotation])

  function openAction(action) {
    setSelectedAction(action)

    if (
      action === 'approve'
    ) {
      setShowReason(false)
      setReason('')
    } else {
      setShowReason(true)
    }
  }

  function closeAction() {
    if (actionLoading) return

    setSelectedAction('')
    setShowReason(false)
    setReason('')
  }

  async function performAction() {
    if (!selectedAction) return

    if (
      selectedAction !== 'approve' &&
      !reason.trim()
    ) {
      setError(
        'Please provide a reason.'
      )
      return
    }

    try {
      setActionLoading(true)
      setError('')

      const response = await fetch(
        `/api/sales/approvals/${params.id}`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            action:
              selectedAction,

            reason:
              reason.trim() || undefined,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Approval action failed'
        )
      }

      /*
       * Refresh detail so the audit trail
       * and approval step immediately update.
       */
      setQuotation(null)
      setSelectedAction('')
      setShowReason(false)
      setReason('')

      await loadQuotation()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Unable to perform action.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="animate-pulse text-text-secondary">
          Loading approval...
        </div>
      </div>
    )
  }

  if (error && !quotation) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/approvals"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back to Approvals
        </Link>

        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!quotation) return null

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/approvals"
        className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary"
      >
        ← Back to Approvals
      </Link>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Approval Detail:{' '}
            {quotation.quoteNumber}
          </h1>

          <p className="page-description">
            Review the quotation and approval
            history before making a decision.
          </p>
        </div>

        <div className="flex gap-2">
          <span
            className={`badge ${getRiskClass(
              quotation.blendedRiskScore
            )}`}
          >
            Blended Risk:{' '}
            {getRiskLabel(
              quotation.blendedRiskScore
            )}
          </span>

          <span className="badge badge-info">
            Customer Tier:{' '}
            {quotation.customer?.tier}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Quote overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">
            Blended Risk Score
          </div>

          <div className="metric-value">
            {Number(
              quotation.blendedRiskScore || 0
            ).toFixed(1)}
          </div>

          <div className="text-xs text-text-secondary mt-1">
            {getRiskLabel(
              quotation.blendedRiskScore
            )}{' '}
            risk
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Customer
          </div>

          <div className="metric-value text-xl">
            {quotation.customer?.name}
          </div>

          <div className="text-xs text-text-secondary mt-1">
            Tier:{' '}
            {quotation.customer?.tier}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Quotation Total
          </div>

          <div className="metric-value text-xl">
            {money(total)}
          </div>

          <div className="text-xs text-text-secondary mt-1">
            Round{' '}
            {quotation.approvalRound}
          </div>
        </div>
      </div>

      {/* Why flagged */}
      <section className="card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-text-primary">
            Why This Quote Was Flagged
          </h2>

          <p className="text-sm text-text-secondary mt-1">
            Discounts are checked against the
            customer tier and product category
            limits.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Discount</th>
                <th>Limit Allowed</th>
                <th>Over By</th>
              </tr>
            </thead>

            <tbody>
              {quotation.lines.map(
                (line) => {
                  const overage =
                    Number(
                      line.discountOveragePercent ||
                        0
                    )

                  return (
                    <tr
                      key={line.id}
                    >
                      <td>
                        <div className="font-medium">
                          {
                            line.product
                              ?.name
                          }
                        </div>

                        <div className="text-xs text-text-secondary mt-1">
                          {
                            line.product
                              ?.sku
                          }
                        </div>
                      </td>

                      <td>
                        {Number(
                          line.discountPercent ||
                            0
                        ).toFixed(1)}
                        %
                      </td>

                      <td>
                        {Number(
                          line.allowedDiscountPercentSnapshot ||
                            0
                        ).toFixed(1)}
                        %
                      </td>

                      <td>
                        {overage > 0 ? (
                          <span className="badge badge-danger">
                            +
                            {overage.toFixed(
                              1
                            )}
                            %
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>

        <div className="mx-5 my-4 rounded-md border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          The blended risk score is calculated
          from the discount overage across all
          quotation lines.
        </div>
      </section>

      {/* Approval chain */}
      <section className="card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-text-primary">
            Approval Chain
          </h2>

          <p className="text-sm text-text-secondary mt-1">
            Current approval round:{' '}
            {quotation.approvalRound}
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {(
              quotation.approvalSteps || []
            )
              .filter(
                (step) =>
                  step.approvalRound ===
                  quotation.approvalRound
              )
              .sort(
                (a, b) =>
                  a.stepOrder -
                  b.stepOrder
              )
              .map(
                (step, index, steps) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-4 flex-1"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border ${
                          step.status ===
                          'APPROVED'
                            ? 'bg-success-50 text-success-700 border-green-200'
                            : step.status ===
                              'REJECTED'
                            ? 'bg-danger-50 text-danger-700 border-red-200'
                            : step.status ===
                              'RETURNED'
                            ? 'bg-warning-50 text-warning-700 border-yellow-200'
                            : 'bg-info-50 text-info-600 border-blue-200'
                        }`}
                      >
                        {step.stepOrder}
                      </div>

                      <div>
                        <div className="font-medium text-sm">
                          {formatRole(
                            step.approverRole
                          )}
                        </div>

                        <div className="text-xs text-text-secondary">
                          {formatStatus(
                            step.status
                          )}
                        </div>
                      </div>
                    </div>

                    {index <
                      steps.length -
                        1 && (
                      <div className="hidden md:block flex-1 h-px bg-border" />
                    )}
                  </div>
                )
              )}
          </div>
        </div>
      </section>

      {/* Audit trail */}
      <section className="card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-text-primary">
            Audit Trail
          </h2>

          <p className="text-sm text-text-secondary mt-1">
            Every approval decision is recorded.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>

            <tbody>
              {quotation.auditLogs
                ?.length ? (
                quotation.auditLogs.map(
                  (log) => (
                    <tr
                      key={log.id}
                    >
                      <td>
                        <div className="font-medium">
                          {log.actor
                            ?.name ||
                            'System'}
                        </div>

                        {log.actor
                          ?.role && (
                          <div className="text-xs text-text-secondary">
                            {formatRole(
                              log.actor
                                .role
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="badge badge-neutral">
                          {log.action
                            .replaceAll(
                              '_',
                              ' '
                            )}
                        </span>
                      </td>

                      <td className="text-sm">
                        {formatDate(
                          log.createdAt
                        )}
                      </td>

                      <td className="text-sm text-text-secondary">
                        {log.details
                          ?.reason ||
                          log.details
                            ?.note ||
                          '—'}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-text-secondary"
                  >
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions */}
      {quotation.canAct &&
        currentStep && (
          <section className="card p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  openAction(
                    'approve'
                  )
                }
                className="btn btn-primary"
              >
                ✓ Approve
              </button>

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  openAction(
                    'return'
                  )
                }
                className="btn btn-secondary"
              >
                ↩ Return for Revision
              </button>

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  openAction(
                    'reject'
                  )
                }
                className="btn btn-danger"
              >
                ✕ Reject
              </button>
            </div>
          </section>
        )}

      {/* Action modal */}
      {selectedAction && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-lg">
            <h2 className="modal-title">
              {selectedAction ===
              'approve'
                ? 'Approve Quotation'
                : selectedAction ===
                  'return'
                ? 'Return for Revision'
                : 'Reject Quotation'}
            </h2>

            {selectedAction ===
            'approve' ? (
              <p className="text-sm text-text-secondary mb-6">
                Approving this step will move
                the quotation to the next
                approval level if one exists.
              </p>
            ) : (
              <div className="mb-5">
                <label className="label">
                  Reason
                </label>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  rows={4}
                  className="input resize-none"
                  placeholder={
                    selectedAction ===
                    'return'
                      ? 'Explain what needs to be revised...'
                      : 'Explain why this quotation is being rejected...'
                  }
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  closeAction
                }
                className="btn btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  actionLoading ||
                  (selectedAction !==
                    'approve' &&
                    !reason.trim())
                }
                onClick={
                  performAction
                }
                className={
                  selectedAction ===
                  'reject'
                    ? 'btn btn-danger'
                    : 'btn btn-primary'
                }
              >
                {actionLoading
                  ? 'Processing...'
                  : selectedAction ===
                    'approve'
                  ? 'Approve'
                  : selectedAction ===
                    'return'
                  ? 'Return for Revision'
                  : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}