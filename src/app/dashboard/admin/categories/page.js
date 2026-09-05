'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CategoriesAdminPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  
  // Form state
  const [name, setName] = useState('')
  const [discountCeilingPercent, setDiscountCeilingPercent] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category = null) => {
    setEditingCategory(category)
    setFormError('')
    if (category) {
      setName(category.name)
      setDiscountCeilingPercent(category.discountCeilingPercent)
    } else {
      setName('')
      setDiscountCeilingPercent('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    try {
      const payload = {
        name,
        discountCeilingPercent: parseFloat(discountCeilingPercent)
      }
      if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Update failed')
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Create failed')
      }
      setIsModalOpen(false)
      fetchCategories()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      fetchCategories()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-gray-400 hover:text-white transition">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-purple-400">Categories</h1>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition">
            Add Category
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold text-gray-300">Name</th>
                <th className="p-4 font-semibold text-gray-300">Discount Ceiling (%)</th>
                <th className="p-4 font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-4">{c.name}</td>
                  <td className="p-4 text-gray-400">{c.discountCeilingPercent}%</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleOpenModal(c)} className="text-blue-400 hover:text-blue-300 mr-4">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan="3" className="p-4 text-center text-gray-400">No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            {formError && <p className="text-red-500 mb-4 text-sm">{formError}</p>}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Discount Ceiling (%)</label>
                <input required type="number" step="0.01" min="0" max="100" value={discountCeilingPercent} onChange={e => setDiscountCeilingPercent(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
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
