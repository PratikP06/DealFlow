'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomersAdminPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  
  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tier, setTier] = useState('BRONZE')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (customer = null) => {
    setEditingCustomer(customer)
    setFormError('')
    if (customer) {
      setName(customer.name)
      setEmail(customer.email)
      setPassword('')
      setTier(customer.tier)
    } else {
      setName('')
      setEmail('')
      setPassword('')
      setTier('BRONZE')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    try {
      if (editingCustomer) {
        const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, tier })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Update failed')
      } else {
        const res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, tier })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Create failed')
      }
      setIsModalOpen(false)
      fetchCustomers()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      fetchCustomers()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-gray-400 hover:text-white transition">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-purple-400">Customers</h1>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition">
            Add Customer
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold text-gray-300">Name</th>
                <th className="p-4 font-semibold text-gray-300">Email</th>
                <th className="p-4 font-semibold text-gray-300">Tier</th>
                <th className="p-4 font-semibold text-gray-300">Created At</th>
                <th className="p-4 font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-4">{c.name}</td>
                  <td className="p-4 text-gray-400">{c.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      c.tier === 'GOLD' ? 'bg-yellow-900 text-yellow-300' :
                      c.tier === 'SILVER' ? 'bg-gray-400 text-gray-900' :
                      'bg-orange-900 text-orange-300'
                    }`}>
                      {c.tier}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleOpenModal(c)} className="text-blue-400 hover:text-blue-300 mr-4">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan="5" className="p-4 text-center text-gray-400">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
            {formError && <p className="text-red-500 mb-4 text-sm">{formError}</p>}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!editingCustomer} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500 disabled:opacity-50" />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Password</label>
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tier</label>
                <select value={tier} onChange={e => setTier(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500">
                  <option value="BRONZE">BRONZE</option>
                  <option value="SILVER">SILVER</option>
                  <option value="GOLD">GOLD</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700">Cancel</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
