'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-700 pb-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-purple-400">Admin Configuration</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/admin/customers" className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition block">
            <h2 className="text-xl font-bold mb-2">Customers</h2>
            <p className="text-gray-400 text-sm">Manage customers, details, and discount tiers.</p>
          </Link>
          
          <Link href="/dashboard/admin/categories" className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition block">
            <h2 className="text-xl font-bold mb-2">Categories</h2>
            <p className="text-gray-400 text-sm">Manage product categories and discount ceilings.</p>
          </Link>

          <Link href="/dashboard/admin/products" className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition block">
            <h2 className="text-xl font-bold mb-2">Products</h2>
            <p className="text-gray-400 text-sm">Manage products, pricing, and basic catalog details.</p>
          </Link>

          <Link
  href="/dashboard/admin/warehouses"
  className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition block"
>
  <h2 className="text-xl font-bold mb-2">
    Warehouses & Stock
  </h2>

  <p className="text-gray-400 text-sm">
    Manage warehouses, shipping weights, and inventory stock.
  </p>
</Link>
<Link
  href="/dashboard/admin/subscription-plans"
  className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition block"
>
  <h2 className="text-xl font-bold mb-2">
    Subscription Plans
  </h2>

  <p className="text-gray-400 text-sm">
    Configure recurring billing plans and subscription options.
  </p>
</Link>
        </div>
      </div>
    </div>
  )
}
