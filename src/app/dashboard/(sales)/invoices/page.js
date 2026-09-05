'use client'

export default function InvoicesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="text-gray-400 mt-1">View and manage invoices and payments</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Invoices Coming Soon</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          This section will handle invoice generation and payment tracking.
        </p>
        <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
          <li className="flex items-center gap-2">• Generate invoices from confirmed quotes</li>
          <li className="flex items-center gap-2">• Track payment status</li>
          <li className="flex items-center gap-2">• Record manual payments</li>
          <li className="flex items-center gap-2">• View invoice history</li>
        </ul>
      </div>
    </div>
  )
}

function DocumentTextIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}