'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SalesDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    openQuotations: 0,
    atRiskDeals: 0
  })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/sales/dashboard/stats'),
          fetch('/api/sales/dashboard/activity')
        ])

        if (!statsRes.ok || !activityRes.ok) {
          router.push('/login')
          return
        }

        const statsData = await statsRes.json()
        const activityData = await activityRes.json()

        setStats(statsData)
        setActivities(activityData.activities || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getActionLabel = (action) => {
    const labels = {
      QUOTE_CREATED: 'Created quotation',
      QUOTE_UPDATED: 'Updated quotation',
      QUOTE_SUBMITTED: 'Submitted for approval',
      QUOTE_APPROVED: 'Approved quotation',
      QUOTE_REJECTED: 'Rejected quotation',
      QUOTE_RETURNED: 'Returned quotation',
      QUOTE_CONFIRMED: 'Confirmed quotation',
      APPROVAL_STEP_CREATED: 'Approval step created',
      APPROVAL_STEP_APPROVED: 'Approval approved',
      APPROVAL_STEP_REJECTED: 'Approval rejected',
      APPROVAL_STEP_RETURNED: 'Approval returned',
      NEGOTIATION_REQUESTED: 'Negotiation requested',
      NEGOTIATION_ACCEPTED: 'Negotiation accepted',
      NEGOTIATION_REJECTED: 'Negotiation rejected'
    }
    return labels[action] || action.replace(/_/g, ' ').toLowerCase()
  }

  const getActionColor = (action) => {
    if (action.includes('CREATED') || action.includes('APPROVED') || action.includes('ACCEPTED')) {
      return 'text-green-400 bg-green-900/30'
    }
    if (action.includes('REJECTED') || action.includes('RETURNED')) {
      return 'text-red-400 bg-red-900/30'
    }
    if (action.includes('SUBMITTED') || action.includes('REQUESTED')) {
      return 'text-yellow-400 bg-yellow-900/30'
    }
    return 'text-blue-400 bg-blue-900/30'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back. Here's your sales overview.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/quotations/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Quotation
          </Link>
          <Link
            href="/dashboard/approvals"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 border border-gray-600"
          >
            <CheckBadgeIcon className="w-5 h-5" />
            View Approvals
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={<CheckBadgeIcon className="w-6 h-6" />}
          color="bg-yellow-500"
          bgColor="bg-yellow-900/30"
          borderColor="border-yellow-800"
          href="/dashboard/approvals"
        />
        <StatCard
          title="Open Quotations"
          value={stats.openQuotations}
          icon={<DocumentIcon className="w-6 h-6" />}
          color="bg-blue-500"
          bgColor="bg-blue-900/30"
          borderColor="border-blue-800"
          href="/dashboard/quotations"
        />
        <StatCard
          title="At-Risk Deals"
          value={stats.atRiskDeals}
          icon={<AlertIcon className="w-6 h-6" />}
          color="bg-red-500"
          bgColor="bg-red-900/30"
          borderColor="border-red-800"
          href="/dashboard/deal-health"
        />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Link
            href="/dashboard/quotations"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-700">
          {activities.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-lg">No recent activity</p>
              <p className="text-sm mt-1">Your quotation activity will appear here</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}
                  >
                    <ActivityIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {getActionLabel(activity.action)}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {activity.quotation ? (
                        <>
                          <span className="font-medium text-blue-300">{activity.quotation.quoteNumber}</span>
                          {' '}•{' '}
                          <span>{activity.quotation.customer?.name}</span>
                        </>
                      ) : (
                        activity.entityType
                      )}
                    </p>
                    {activity.actor && (
                      <p className="text-xs text-gray-500 mt-1">
                        By {activity.actor.name}
                      </p>
                    )}
                  </div>
                  <time
                    className="text-xs text-gray-500 flex-shrink-0"
                    dateTime={activity.createdAt}
                  >
                    {formatDate(activity.createdAt)}
                  </time>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, bgColor, borderColor, href }) {
  return (
    <Link href={href} className={`bg-gray-800 rounded-xl border p-6 transition-colors hover:border-gray-600 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} ${bgColor}`}>
          {icon}
        </div>
      </div>
    </Link>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function CheckBadgeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function ActivityIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}