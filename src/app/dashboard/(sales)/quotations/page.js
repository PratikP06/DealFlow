'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function QuotationsPage() {
  const router = useRouter()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quotations</h1>
          <p className="text-gray-400 mt-1">Manage and create quotations for your deals</p>
        </div>
        <Link
          href="/dashboard/quotations/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Quotation
        </Link>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <DocumentIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Quotations Coming Soon</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          This section will allow you to view, create, and manage quotations. Features will include:
        </p>
        <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
          <li className="flex items-center gap-2">• List all quotations with filters</li>
          <li className="flex items-center gap-2">• Create new quotations with line items</li>
          <li className="flex items-center gap-2">• Apply discounts and see risk calculation</li>
          <li className="flex items-center gap-2">• Submit for approval workflow</li>
          <li className="flex items-center gap-2">• Track quotation status and history</li>
        </ul>
        <div className="mt-8">
          <Link
            href="/dashboard/quotations/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create Your First Quotation
          </Link>
        </div>
      </div>
    </div>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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