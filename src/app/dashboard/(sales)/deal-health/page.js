'use client'

export default function DealHealthPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Deal Health</h1>
        <p className="text-gray-400 mt-1">Monitor deal health and identify at-risk opportunities</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Deal Health Coming Soon</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          This section will provide insights into deal health and risk indicators.
        </p>
        <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
          <li className="flex items-center gap-2">• Stalled deal detection</li>
          <li className="flex items-center gap-2">• Discount anomaly alerts</li>
          <li className="flex items-center gap-2">• Delivery promise slippage tracking</li>
          <li className="flex items-center gap-2">• Deal health scoring</li>
        </ul>
      </div>
    </div>
  )
}

function ChartBarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}