'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DealHealthPage() {
  const router = useRouter()

  const [data, setData] = useState({
    stats: {},
    deals: [],
  })

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        '/api/sales/deal-health'
      )

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        const result = await response.json()

        throw new Error(
          result.error ||
            'Failed to load deal health'
        )
      }

      const result =
        await response.json()

      setData(result)
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Unable to load deal health.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function healthClass(health) {
    if (health === 'CRITICAL') {
      return 'badge-danger'
    }

    if (health === 'AT_RISK') {
      return 'badge-warning'
    }

    return 'badge-success'
  }

  function riskClass(risk) {
    if (risk > 8) {
      return 'badge-danger'
    }

    if (risk > 0) {
      return 'badge-warning'
    }

    return 'badge-success'
  }

  function formatHealth(value) {
    return value
      ?.replaceAll('_', ' ')
      ?.replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">
            Deal Health
          </h1>

          <p className="page-description">
            Monitor stalled, risky, and slipping deals.
          </p>
        </div>

        <div className="card p-12 text-center">
          <div className="animate-pulse text-text-secondary">
            Loading deal health...
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
            Deal Health
          </h1>

          <p className="page-description">
            Monitor stalled deals, discount anomalies,
            and delivery risks.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="btn btn-secondary"
        >
          ↻ Reload
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="metric-card">
          <div className="metric-label">
            Total Deals
          </div>

          <div className="metric-value">
            {data.stats.total || 0}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Healthy
          </div>

          <div className="metric-value text-success-700">
            {data.stats.healthy || 0}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            At Risk
          </div>

          <div className="metric-value text-warning-700">
            {data.stats.atRisk || 0}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Critical
          </div>

          <div className="metric-value text-danger-700">
            {data.stats.critical || 0}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Stalled
          </div>

          <div className="metric-value">
            {data.stats.stalled || 0}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm font-medium text-text-secondary">
            Discount Anomalies
          </div>

          <div className="mt-2 text-2xl font-bold text-text-primary">
            {data.stats.discountAnomalies || 0}
          </div>

          <p className="text-xs text-text-secondary mt-1">
            Deals with unusually high discounts
          </p>
        </div>

        <div className="card p-5">
          <div className="text-sm font-medium text-text-secondary">
            Delivery Slippage
          </div>

          <div className="mt-2 text-2xl font-bold text-text-primary">
            {data.stats.deliverySlips || 0}
          </div>

          <p className="text-xs text-text-secondary mt-1">
            Past promised delivery dates
          </p>
        </div>

        <div className="card p-5">
          <div className="text-sm font-medium text-text-secondary">
            Stalled Deals
          </div>

          <div className="mt-2 text-2xl font-bold text-text-primary">
            {data.stats.stalled || 0}
          </div>

          <p className="text-xs text-text-secondary mt-1">
            No activity for 3+ days
          </p>
        </div>
      </div>

      {/* Deals */}
      <div className="table-container">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">
            Deal Risk Monitor
          </h2>

          <p className="text-sm text-text-secondary mt-1">
            Prioritize deals that need manager attention.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Quotation</th>
                <th>Customer</th>
                <th>Owner</th>
                <th>Risk</th>
                <th>Health</th>
                <th>Signals</th>
              </tr>
            </thead>

            <tbody>
              {data.deals.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-text-secondary"
                  >
                    No active deals found.
                  </td>
                </tr>
              ) : (
                data.deals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <Link
                        href={`/dashboard/approvals/${deal.id}`}
                        className="font-semibold text-primary-600 hover:text-primary-700"
                      >
                        {deal.quoteNumber}
                      </Link>

                      <div className="text-xs text-text-secondary mt-1">
                        {deal.status}
                      </div>
                    </td>

                    <td>
                      <div className="font-medium">
                        {deal.customer?.name}
                      </div>

                      <div className="text-xs text-text-secondary mt-1">
                        {deal.customer?.tier}
                      </div>
                    </td>

                    <td>
                      {deal.owner?.name || '—'}
                    </td>

                    <td>
                      <span
                        className={`badge ${riskClass(
                          deal.risk
                        )}`}
                      >
                        {deal.riskLevel}
                      </span>

                      <div className="text-xs text-text-secondary mt-1">
                        {deal.risk.toFixed(1)} points
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${healthClass(
                          deal.health
                        )}`}
                      >
                        {formatHealth(
                          deal.health
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {deal.stalled && (
                          <span className="badge badge-warning">
                            Stalled
                          </span>
                        )}

                        {deal.discountAnomaly && (
                          <span className="badge badge-danger">
                            Discount
                          </span>
                        )}

                        {deal.deliverySlipping && (
                          <span className="badge badge-danger">
                            Delivery
                          </span>
                        )}

                        {!deal.stalled &&
                          !deal.discountAnomaly &&
                          !deal.deliverySlipping && (
                            <span className="text-xs text-text-secondary">
                              No issues
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}