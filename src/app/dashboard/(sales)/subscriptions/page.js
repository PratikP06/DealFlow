'use client'

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-gray-400 mt-1">Manage recurring billing and subscription plans</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Subscriptions Coming Soon</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          This section will manage recurring billing for subscription-based products.
        </p>
        <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
          <li className="flex items-center gap-2">• View active subscriptions</li>
          <li className="flex items-center gap-2">• Manage billing schedules</li>
          <li className="flex items-center gap-2">• Handle proration and cancellations</li>
          <li className="flex items-center gap-2">• Track recurring revenue</li>
        </ul>
      </div>
    </div>
  )
}

function ArrowPathIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}