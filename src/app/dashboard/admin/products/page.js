'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProductsAdminPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  // Form state
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState('PHYSICAL')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [taxPercent, setTaxPercent] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ])
      if (!prodRes.ok || !catRes.ok) throw new Error('Failed to fetch data')
      
      const prodData = await prodRes.json()
      const catData = await catRes.json()
      setProducts(prodData)
      setCategories(catData)
      if (catData.length > 0) setCategoryId(catData[0].id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (product = null) => {
    setEditingProduct(product)
    setFormError('')
    if (product) {
      setSku(product.sku)
      setName(product.name)
      setDescription(product.description || '')
      setCategoryId(product.categoryId)
      setType(product.type)
      setPrice(product.price)
      setCostPrice(product.costPrice)
      setTaxPercent(product.taxPercent)
    } else {
      setSku('')
      setName('')
      setDescription('')
      if (categories.length > 0) setCategoryId(categories[0].id)
      setType('PHYSICAL')
      setPrice('')
      setCostPrice('')
      setTaxPercent('0')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    try {
      const payload = { sku, name, description, categoryId, type, price, costPrice, taxPercent }
      if (editingProduct) {
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Update failed')
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Create failed')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      fetchData()
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
            <h1 className="text-3xl font-bold text-purple-400">Products</h1>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition">
            Add Product
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold text-gray-300">SKU</th>
                <th className="p-4 font-semibold text-gray-300">Name</th>
                <th className="p-4 font-semibold text-gray-300">Category</th>
                <th className="p-4 font-semibold text-gray-300">Type</th>
                <th className="p-4 font-semibold text-gray-300">Price</th>
                <th className="p-4 font-semibold text-gray-300">Cost</th>
                <th className="p-4 font-semibold text-gray-300">Margin</th>
                <th className="p-4 font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-4 font-mono text-xs">{p.sku}</td>
                  <td className="p-4">{p.name}</td>
                  <td className="p-4 text-gray-400">{p.category?.name}</td>
                  <td className="p-4">
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs">{p.type}</span>
                  </td>
                  <td className="p-4">${Number(p.price).toFixed(2)}</td>
                  <td className="p-4">${Number(p.costPrice).toFixed(2)}</td>
                  <td className="p-4 text-green-400">{Number(p.marginPercent).toFixed(2)}%</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleOpenModal(p)} className="text-blue-400 hover:text-blue-300 mr-4">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="8" className="p-4 text-center text-gray-400">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl border border-gray-700 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            {formError && <p className="text-red-500 mb-4 text-sm">{formError}</p>}
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">SKU</label>
                <input required type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500 font-mono text-sm" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500">
                  <option value="PHYSICAL">PHYSICAL</option>
                  <option value="SERVICE">SERVICE</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Price</label>
                <input required type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Cost Price</label>
                <input required type="number" step="0.01" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Tax Rate (%)</label>
                <input required type="number" step="0.01" min="0" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
                <div className="bg-gray-900 p-2 rounded text-sm text-gray-400 border border-gray-700 text-center">
                  Margin: {price && costPrice ? (((parseFloat(price) - parseFloat(costPrice)) / parseFloat(price)) * 100).toFixed(2) : '0.00'}%
                </div>
              </div>

              <div className="col-span-2 flex justify-end gap-2 mt-4">
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
