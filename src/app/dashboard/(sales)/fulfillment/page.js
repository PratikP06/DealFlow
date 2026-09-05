'use client'

export default function FulfillmentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Fulfillment</h1>
        <p className="text-gray-400 mt-1">Manage inventory allocation and fulfillment</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <TruckIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Fulfillment Coming Soon</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          This section will handle warehouse allocation and fulfillment tracking.
        </p>
        <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
          <li className="flex items-center gap-2">• View stock across warehouses</li>
          <li className="flex items-center gap-2">• Allocate inventory to quotations</li>
          <li className="flex items-center gap-2">• Split shipments across warehouses</li>
          <li className="flex items-center gap-2">• Track backorders and delivery dates</li>
        </ul>
      </div>
    </div>
  )
}

function TruckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )
}