'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function WarehousesAdminPage() {
  const [warehouses, setWarehouses] = useState([])
  const [stock, setStock] = useState([])
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [warehouseModal, setWarehouseModal] = useState(false)
  const [stockModal, setStockModal] = useState(false)

  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [editingStock, setEditingStock] = useState(null)

  const [warehouseName, setWarehouseName] = useState('')
  const [shippingWeight, setShippingWeight] = useState('')

  const [stockWarehouse, setStockWarehouse] = useState('')
  const [stockProduct, setStockProduct] = useState('')
  const [stockQuantity, setStockQuantity] = useState('0')

  const [formError, setFormError] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [warehouseRes, stockRes] = await Promise.all([
        fetch('/api/admin/warehouses'),
        fetch('/api/admin/stock'),
      ])

      if (!warehouseRes.ok) {
        throw new Error('Failed to load warehouses')
      }

      if (!stockRes.ok) {
        throw new Error('Failed to load stock')
      }

      const warehouseData = await warehouseRes.json()
      const stockData = await stockRes.json()

      setWarehouses(warehouseData)
      setStock(stockData.stock)
      setProducts(stockData.products)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openWarehouseModal = (warehouse = null) => {
    setEditingWarehouse(warehouse)
    setFormError('')

    if (warehouse) {
      setWarehouseName(warehouse.name)
      setShippingWeight(String(warehouse.shippingCostWeight))
    } else {
      setWarehouseName('')
      setShippingWeight('1')
    }

    setWarehouseModal(true)
  }

  const openStockModal = (item = null) => {
    setEditingStock(item)
    setFormError('')

    if (item) {
      setStockWarehouse(item.warehouseId)
      setStockProduct(item.productId)
      setStockQuantity(String(item.quantity))
    } else {
      setStockWarehouse(warehouses[0]?.id || '')
      setStockProduct(products[0]?.id || '')
      setStockQuantity('0')
    }

    setStockModal(true)
  }

  const saveWarehouse = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      const payload = {
        name: warehouseName,
        shippingCostWeight: Number(shippingWeight),
      }

      const url = editingWarehouse
        ? `/api/admin/warehouses/${editingWarehouse.id}`
        : '/api/admin/warehouses'

      const res = await fetch(url, {
        method: editingWarehouse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save warehouse')
      }

      setWarehouseModal(false)
      await loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const saveStock = async (e) => {
    e.preventDefault()
    setFormError('')

    try {
      const payload = {
        warehouseId: stockWarehouse,
        productId: stockProduct,
        quantity: Number(stockQuantity),
      }

      const url = editingStock
        ? `/api/admin/stock/${editingStock.id}`
        : '/api/admin/stock'

      const res = await fetch(url, {
        method: editingStock ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save stock')
      }

      setStockModal(false)
      await loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const deleteWarehouse = async (id) => {
    if (!confirm('Delete this warehouse?')) return

    const res = await fetch(`/api/admin/warehouses/${id}`, {
      method: 'DELETE',
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Failed to delete warehouse')
      return
    }

    await loadData()
  }

  const deleteStock = async (id) => {
    if (!confirm('Delete this stock record?')) return

    const res = await fetch(`/api/admin/stock/${id}`, {
      method: 'DELETE',
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Failed to delete stock')
      return
    }

    await loadData()
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

            <h1 className="text-3xl font-bold text-purple-400">
              Warehouses & Stock
            </h1>
          </div>

          <button
            onClick={() => openWarehouseModal()}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold"
          >
            Add Warehouse
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Warehouses */}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Warehouses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">
                      {warehouse.name}
                    </h3>

                    <p className="text-gray-400 text-sm mt-1">
                      Shipping weight:{' '}
                      <span className="text-white">
                        {Number(warehouse.shippingCostWeight).toFixed(1)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-4">
                  <button
                    onClick={() => openWarehouseModal(warehouse)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteWarehouse(warehouse.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stock */}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Inventory Stock</h2>

            <button
              onClick={() => openStockModal()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold"
            >
              Add Stock
            </button>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Warehouse</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {stock.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-700"
                  >
                    <td className="p-4">
                      {item.product.name}
                    </td>

                    <td className="p-4 text-gray-400">
                      {item.product.sku}
                    </td>

                    <td className="p-4">
                      {item.warehouse.name}
                    </td>

                    <td className="p-4 font-bold">
                      {item.quantity}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => openStockModal(item)}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteStock(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {stock.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-6 text-center text-gray-400"
                    >
                      No stock records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Warehouse Modal */}

      {warehouseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5">
              {editingWarehouse
                ? 'Edit Warehouse'
                : 'Add Warehouse'}
            </h2>

            {formError && (
              <p className="text-red-400 text-sm mb-4">
                {formError}
              </p>
            )}

            <form onSubmit={saveWarehouse} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Warehouse Name
                </label>

                <input
                  required
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                  placeholder="Pune Warehouse"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Shipping Cost Weight
                </label>

                <input
                  required
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={shippingWeight}
                  onChange={(e) => setShippingWeight(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setWarehouseModal(false)}
                  className="px-4 py-2 text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}

      {stockModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5">
              {editingStock ? 'Edit Stock' : 'Add Stock'}
            </h2>

            {formError && (
              <p className="text-red-400 text-sm mb-4">
                {formError}
              </p>
            )}

            <form onSubmit={saveStock} className="space-y-4">

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Warehouse
                </label>

                <select
                  value={stockWarehouse}
                  onChange={(e) => setStockWarehouse(e.target.value)}
                  disabled={!!editingStock}
                  required
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded disabled:opacity-50"
                >
                  <option value="">Select warehouse</option>

                  {warehouses.map((warehouse) => (
                    <option
                      key={warehouse.id}
                      value={warehouse.id}
                    >
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Product
                </label>

                <select
                  value={stockProduct}
                  onChange={(e) => setStockProduct(e.target.value)}
                  disabled={!!editingStock}
                  required
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded disabled:opacity-50"
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

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Quantity
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStockModal(false)}
                  className="px-4 py-2 text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}