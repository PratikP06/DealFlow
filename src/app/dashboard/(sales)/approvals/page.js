'use client'

export default function ApprovalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Approvals</h1>
        <p className="text-gray-400 mt-1">View and manage approval requests</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <CheckBadgeIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Approvals Coming Soon</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          This section will show quotations awaiting your approval or approvals you've requested.
        </p>
        <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
          <li className="flex items-center gap-2">• Pending approvals assigned to you</li>
          <li className="flex items-center gap-2">• Approve, reject, or return with comments</li>
          <li className="flex items-center gap-2">• View risk calculation details</li>
          <li className="flex items-center gap-2">• Approval history and audit trail</li>
        </ul>
      </div>
    </div>
  )
}

function CheckBadgeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}