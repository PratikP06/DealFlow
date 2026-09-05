'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ApprovalsPage() {
  const router = useRouter()

  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingOnly, setPendingOnly] = useState(true)

  useEffect(() => {
    loadApprovals()
  }, [])

  async function loadApprovals() {
    try {
      setLoading(true)
      setError('')

      const response =
        await fetch('/api/sales/approvals')

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          data.error || 'Failed to load approvals'
        )
      }

      const data = await response.json()

      setApprovals(
        Array.isArray(data) ? data : []
      )
    } catch (err) {
      console.error(err)
      setError(
        err.message ||
          'Unable to load approvals.'
      )
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const pending = approvals.filter(
      (quote) =>
        quote.status === 'PENDING_APPROVAL'
    ).length

    const returned = approvals.filter(
      (quote) =>
        quote.status ===
        'RETURNED'
    ).length

    const approved = approvals.filter(
      (quote) =>
        quote.status === 'APPROVED'
    ).length

    return {
      pending,
      returned,
      approved,
    }
  }, [approvals])

  const displayedApprovals =
    pendingOnly
      ? approvals.filter(
          (quote) =>
            quote.status ===
            'PENDING_APPROVAL'
        )
      : approvals

  function formatRisk(score) {
    const value = Number(score || 0)

    if (value > 8) return 'HIGH'
    if (value > 0) return 'MEDIUM'
    return 'LOW'
  }

  function riskClass(score) {
    const risk = formatRisk(score)

    if (risk === 'HIGH') {
      return 'badge-danger'
    }

    if (risk === 'MEDIUM') {
      return 'badge-warning'
    }

    return 'badge-success'
  }

  function getCurrentStep(quotation) {
    const steps =
      quotation.approvalSteps || []

    const currentRoundSteps =
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

    return (
      currentRoundSteps.find(
        (step) =>
          step.status === 'PENDING'
      ) ||
      currentRoundSteps[
        currentRoundSteps.length - 1
      ]
    )
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">
            Approvals
          </h1>

          <p className="page-description">
            Review quotations requiring approval.
          </p>
        </div>

        <div className="card p-12 text-center">
          <div className="animate-pulse text-text-secondary">
            Loading approvals...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Approvals
          </h1>

          <p className="page-description">
            Review quotations requiring your approval.
          </p>
        </div>

        <button
          type="button"
          onClick={loadApprovals}
          className="btn btn-secondary"
        >
          ↻ Reload
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">
            Pending
          </div>

          <div className="metric-value">
            {stats.pending}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Returned
          </div>

          <div className="metric-value">
            {stats.returned}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Approved
          </div>

          <div className="metric-value">
            {stats.approved}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setPendingOnly(
              (value) => !value
            )
          }
          className="btn btn-secondary"
        >
          {pendingOnly
            ? '✓ Pending Only'
            : 'Show All'}
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Quotation</th>
                <th>Customer</th>
                <th>Blended Risk</th>
                <th>Stage</th>
                <th>Assigned To</th>
              </tr>
            </thead>

            <tbody>
              {displayedApprovals.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12"
                  >
                    <div className="text-text-primary font-medium">
                      No approvals found
                    </div>

                    <div className="text-text-secondary mt-1">
                      There are no quotations
                      currently waiting for you.
                    </div>
                  </td>
                </tr>
              ) : (
                displayedApprovals.map(
                  (quotation) => {
                    const step =
                      getCurrentStep(
                        quotation
                      )

                    return (
                      <tr
                        key={quotation.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/dashboard/approvals/${quotation.id}`
                          )
                        }
                      >
                        <td>
                          <div className="font-semibold">
                            {
                              quotation.quoteNumber
                            }
                          </div>

                          <div className="text-xs text-text-tertiary mt-1">
                            Round{' '}
                            {
                              quotation.approvalRound
                            }
                          </div>
                        </td>

                        <td>
                          <div className="font-medium">
                            {
                              quotation.customer
                                ?.name
                            }
                          </div>

                          <div className="text-xs text-text-secondary mt-1">
                            Tier:{' '}
                            {
                              quotation.customer
                                ?.tier
                            }
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge ${riskClass(
                              quotation.blendedRiskScore
                            )}`}
                          >
                            {formatRisk(
                              quotation.blendedRiskScore
                            )}
                          </span>

                          <div className="text-xs text-text-secondary mt-1">
                            {Number(
                              quotation.blendedRiskScore ||
                                0
                            ).toFixed(1)}{' '}
                            points
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-warning">
                            {step
                              ? formatRole(
                                  step.approverRole
                                )
                              : 'Pending'}
                          </span>
                        </td>

                        <td>
                          <div className="font-medium">
                            {step
                              ? formatRole(
                                  step.approverRole
                                )
                              : '—'}
                          </div>

                          <div className="text-xs text-text-secondary mt-1">
                            Owner:{' '}
                            {
                              quotation.owner
                                ?.name
                            }
                          </div>
                        </td>
                      </tr>
                    )
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}