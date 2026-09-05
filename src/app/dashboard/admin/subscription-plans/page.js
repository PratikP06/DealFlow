'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const INTERVAL_LABELS = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
}

export default function SubscriptionPlansAdminPage() {
  const [plans, setPlans] = useState([])
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const [name, setName] = useState('')
  const [productId, setProductId] = useState('')
  const [price, setPrice] = useState('')
  const [billingInterval, setBillingInterval] = useState('MONTHLY')
  const [durationMonths, setDurationMonths] = useState('12')
  const [prorationEnabled, setProrationEnabled] = useState(true)
  const [cancellationCreditEnabled, setCancellationCreditEnabled] =
    useState(true)
  const [isActive, setIsActive] = useState(true)

  const [formError, setFormError] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [plansRes, productsRes] = await Promise.all([
        fetch('/api/admin/subscription-plans'),
        fetch('/api/admin/products'),
      ])

      if (!plansRes.ok) {
        throw new Error('Failed to load subscription plans')
      }

      if (!productsRes.ok) {
        throw new Error('Failed to load products')
      }

      const plansData = await plansRes.json()
      const productsData = await productsRes.json()

      setPlans(plansData)
      setProducts(productsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openModal = (plan = null) => {
    setEditingPlan(plan)
    setFormError('')

    if (plan) {
      setName(plan.name)
      setProductId(plan.productId)
      setPrice(String(plan.price))
      setBillingInterval(plan.billingInterval)
      setDurationMonths(String(plan.durationMonths))
      setProrationEnabled(plan.prorationEnabled)
      setCancellationCreditEnabled(
        plan.cancellationCreditEnabled
      )
      setIsActive(plan.isActive)
    } else {
      setName('')
      setProductId(products[0]?.id || '')
      setPrice('')
      setBillingInterval('MONTHLY')
      setDurationMonths('12')
      setProrationEnabled(true)
      setCancellationCreditEnabled(true)
      setIsActive(true)
    }

    setIsModalOpen(true)
  }

  const savePlan = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      const payload = {
        name,
        productId,
        price: Number(price),
        billingInterval,
        durationMonths: Number(durationMonths),
        prorationEnabled,
        cancellationCreditEnabled,
        isActive,
      }

      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : '/api/admin/subscription-plans'

      const res = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to save subscription plan'
        )
      }

      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const deletePlan = async (id) => {
    if (!confirm('Delete this subscription plan?')) return

    try {
      const res = await fetch(
        `/api/admin/subscription-plans/${id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to delete subscription plan'
        )
      }

      await loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/admin"
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </Link>

            <div>
              <h1 className="text-3xl font-bold text-purple-400">
                Subscription Plans
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                Configure recurring plans used by quotations and billing.
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold"
          >
            Add Plan
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4">Plan</th>
                <th className="p-4">Product</th>
                <th className="p-4">Price</th>
                <th className="p-4">Billing</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Options</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-t border-gray-700 hover:bg-gray-750"
                >
                  <td className="p-4 font-semibold">
                    {plan.name}
                  </td>

                  <td className="p-4">
                    <div>{plan.product.name}</div>
                    <div className="text-gray-500 text-xs">
                      {plan.product.sku}
                    </div>
                  </td>

                  <td className="p-4">
                    ₹{Number(plan.price).toLocaleString('en-IN')}
                  </td>

                  <td className="p-4">
                    {INTERVAL_LABELS[plan.billingInterval]}
                  </td>

                  <td className="p-4">
                    {plan.durationMonths} months
                  </td>

                  <td className="p-4 text-xs">
                    <div className="text-gray-300">
                      {plan.prorationEnabled
                        ? 'Proration'
                        : 'No proration'}
                    </div>

                    <div className="text-gray-400">
                      {plan.cancellationCreditEnabled
                        ? 'Cancellation credit'
                        : 'No cancellation credit'}
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        plan.isActive
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openModal(plan)}
                      className="text-blue-400 hover:text-blue-300 mr-4"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {plans.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="p-8 text-center text-gray-400"
                  >
                    No subscription plans configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-lg">

            <h2 className="text-2xl font-bold mb-6">
              {editingPlan
                ? 'Edit Subscription Plan'
                : 'Add Subscription Plan'}
            </h2>

            {formError && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 p-3 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={savePlan} className="space-y-4">

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Plan Name
                </label>

                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Care Plan 2yr"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Product
                </label>

                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                >
                  <option value="">Select product</option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Price
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="17500"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Billing Interval
                  </label>

                  <select
                    value={billingInterval}
                    onChange={(e) =>
                      setBillingInterval(e.target.value)
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Duration (months)
                </label>

                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={durationMonths}
                  onChange={(e) =>
                    setDurationMonths(e.target.value)
                  }
                  placeholder="24"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                />
              </div>

              <div className="border border-gray-700 rounded-lg p-4 space-y-3">

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prorationEnabled}
                    onChange={(e) =>
                      setProrationEnabled(e.target.checked)
                    }
                    className="w-4 h-4"
                  />

                  <div>
                    <div className="font-medium">
                      Enable Proration
                    </div>

                    <div className="text-xs text-gray-500">
                      Allow mid-cycle plan or quantity changes to be prorated.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cancellationCreditEnabled}
                    onChange={(e) =>
                      setCancellationCreditEnabled(
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />

                  <div>
                    <div className="font-medium">
                      Cancellation Credit
                    </div>

                    <div className="text-xs text-gray-500">
                      Allow unused periods to generate a credit.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) =>
                      setIsActive(e.target.checked)
                    }
                    className="w-4 h-4"
                  />

                  <div>
                    <div className="font-medium">
                      Active
                    </div>
                  </div>
                </label>

              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded font-bold"
                >
                  Save Plan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}