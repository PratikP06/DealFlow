'use client'

export default function ProductsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <p className="text-gray-400 mt-1">Browse and select products for quotations</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <CubeIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Product Catalog Coming Soon</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          This section will provide a browsable product catalog for building quotations.
        </p>
        <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
          <li className="flex items-center gap-2">• Search and filter products</li>
          <li className="flex items-center gap-2">• View pricing and availability</li>
          <li className="flex items-center gap-2">• Add products to quotations</li>
          <li className="flex items-center gap-2">• View upsell suggestions</li>
        </ul>
      </div>
    </div>
  )
}

function CubeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}