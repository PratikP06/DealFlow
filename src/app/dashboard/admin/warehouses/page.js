'use client'

import { useEffect, useMemo, useState } from 'react'

export default function WarehousesAdminPage() {
  const [warehouses, setWarehouses] = useState([])
  const [stock, setStock] = useState([])
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [warehouseModal, setWarehouseModal] =
    useState(false)
  const [stockModal, setStockModal] =
    useState(false)

  const [editingWarehouse, setEditingWarehouse] =
    useState(null)
  const [editingStock, setEditingStock] =
    useState(null)

  const [warehouseName, setWarehouseName] =
    useState('')
  const [shippingWeight, setShippingWeight] =
    useState('')

  const [stockWarehouse, setStockWarehouse] =
    useState('')
  const [stockProduct, setStockProduct] =
    useState('')
  const [stockQuantity, setStockQuantity] =
    useState('0')

  const [formError, setFormError] =
    useState('')
  const [saving, setSaving] =
    useState(false)
  const [deletingId, setDeletingId] =
    useState(null)

  const [stockSearch, setStockSearch] =
    useState('')
  const [warehouseFilter, setWarehouseFilter] =
    useState('ALL')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [
        warehouseRes,
        stockRes,
      ] = await Promise.all([
        fetch('/api/admin/warehouses'),
        fetch('/api/admin/stock'),
      ])

      if (!warehouseRes.ok) {
        throw new Error(
          'Failed to load warehouses'
        )
      }

      if (!stockRes.ok) {
        throw new Error(
          'Failed to load stock'
        )
      }

      const warehouseData =
        await warehouseRes.json()

      const stockData =
        await stockRes.json()

      setWarehouses(
        Array.isArray(warehouseData)
          ? warehouseData
          : []
      )

      setStock(
        Array.isArray(stockData.stock)
          ? stockData.stock
          : []
      )

      setProducts(
        Array.isArray(stockData.products)
          ? stockData.products
          : []
      )
    } catch (err) {
      console.error(
        'Warehouse data error:',
        err
      )

      setError(
        err.message ||
          'Failed to load warehouse data.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredStock = useMemo(() => {
    const query =
      stockSearch
        .trim()
        .toLowerCase()

    return stock.filter((item) => {
      const matchesSearch =
        !query ||
        String(
          item.product?.name || ''
        )
          .toLowerCase()
          .includes(query) ||
        String(
          item.product?.sku || ''
        )
          .toLowerCase()
          .includes(query) ||
        String(
          item.warehouse?.name || ''
        )
          .toLowerCase()
          .includes(query)

      const matchesWarehouse =
        warehouseFilter === 'ALL' ||
        item.warehouseId ===
          warehouseFilter

      return (
        matchesSearch &&
        matchesWarehouse
      )
    })
  }, [
    stock,
    stockSearch,
    warehouseFilter,
  ])

  const totalUnits = useMemo(() => {
    return stock.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    )
  }, [stock])

  const lowStockCount = useMemo(() => {
    return stock.filter(
      (item) =>
        Number(item.quantity || 0) > 0 &&
        Number(item.quantity || 0) <= 10
    ).length
  }, [stock])

  const outOfStockCount = useMemo(() => {
    return stock.filter(
      (item) =>
        Number(item.quantity || 0) <= 0
    ).length
  }, [stock])

  const stockedProducts = useMemo(() => {
    return new Set(
      stock.map(
        (item) => item.productId
      )
    ).size
  }, [stock])

  function openWarehouseModal(
    warehouse = null
  ) {
    setEditingWarehouse(warehouse)
    setFormError('')

    if (warehouse) {
      setWarehouseName(
        warehouse.name || ''
      )

      setShippingWeight(
        String(
          warehouse.shippingCostWeight ??
            '1'
        )
      )
    } else {
      setWarehouseName('')
      setShippingWeight('1')
    }

    setWarehouseModal(true)
  }

  function closeWarehouseModal() {
    if (saving) return

    setWarehouseModal(false)
    setEditingWarehouse(null)
    setWarehouseName('')
    setShippingWeight('')
    setFormError('')
  }

  function openStockModal(item = null) {
    setEditingStock(item)
    setFormError('')

    if (item) {
      setStockWarehouse(
        item.warehouseId
      )

      setStockProduct(
        item.productId
      )

      setStockQuantity(
        String(item.quantity ?? 0)
      )
    } else {
      setStockWarehouse(
        warehouses[0]?.id || ''
      )

      setStockProduct(
        products[0]?.id || ''
      )

      setStockQuantity('0')
    }

    setStockModal(true)
  }

  function closeStockModal() {
    if (saving) return

    setStockModal(false)
    setEditingStock(null)
    setStockWarehouse('')
    setStockProduct('')
    setStockQuantity('0')
    setFormError('')
  }

  async function saveWarehouse(event) {
    event.preventDefault()
    setFormError('')

    const trimmedName =
      warehouseName.trim()

    const numericWeight =
      Number(shippingWeight)

    if (!trimmedName) {
      setFormError(
        'Warehouse name is required.'
      )
      return
    }

    if (
      !Number.isFinite(
        numericWeight
      ) ||
      numericWeight <= 0
    ) {
      setFormError(
        'Shipping cost weight must be greater than 0.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        name: trimmedName,
        shippingCostWeight:
          numericWeight,
      }

      const url =
        editingWarehouse
          ? `/api/admin/warehouses/${editingWarehouse.id}`
          : '/api/admin/warehouses'

      const res = await fetch(url, {
        method: editingWarehouse
          ? 'PUT'
          : 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data =
        await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to save warehouse'
        )
      }

      closeWarehouseModal()
      await loadData()
    } catch (err) {
      setFormError(
        err.message ||
          'Failed to save warehouse.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveStock(event) {
    event.preventDefault()
    setFormError('')

    const quantity =
      Number(stockQuantity)

    if (!stockWarehouse) {
      setFormError(
        'Please select a warehouse.'
      )
      return
    }

    if (!stockProduct) {
      setFormError(
        'Please select a product.'
      )
      return
    }

    if (
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      setFormError(
        'Quantity must be a valid non-negative number.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        warehouseId:
          stockWarehouse,
        productId:
          stockProduct,
        quantity,
      }

      const url =
        editingStock
          ? `/api/admin/stock/${editingStock.id}`
          : '/api/admin/stock'

      const res = await fetch(url, {
        method: editingStock
          ? 'PUT'
          : 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data =
        await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to save stock'
        )
      }

      closeStockModal()
      await loadData()
    } catch (err) {
      setFormError(
        err.message ||
          'Failed to save stock.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteWarehouse(id) {
    if (
      !window.confirm(
        'Delete this warehouse?'
      )
    ) {
      return
    }

    try {
      setDeletingId(id)

      const res = await fetch(
        `/api/admin/warehouses/${id}`,
        {
          method: 'DELETE',
        }
      )

      const data =
        await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to delete warehouse'
        )
      }

      await loadData()
    } catch (err) {
      window.alert(
        err.message ||
          'Failed to delete warehouse.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  async function deleteStock(id) {
    if (
      !window.confirm(
        'Delete this stock record?'
      )
    ) {
      return
    }

    try {
      setDeletingId(id)

      const res = await fetch(
        `/api/admin/stock/${id}`,
        {
          method: 'DELETE',
        }
      )

      const data =
        await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to delete stock'
        )
      }

      await loadData()
    } catch (err) {
      window.alert(
        err.message ||
          'Failed to delete stock.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <WarehouseSkeleton />
  }

  return (
    <>
      <div className="space-y-7">
        {/* Header */}
        <section>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                  <WarehouseIcon className="h-4 w-4" />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  Configuration / Operations
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Warehouses & Stock
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Manage warehouse locations,
                shipping weights, and inventory
                available for deal fulfillment.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  openStockModal()
                }
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add stock
              </button>

              <button
                type="button"
                onClick={() =>
                  openWarehouseModal()
                }
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add warehouse
              </button>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-4 py-3">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-600)]" />

            <div>
              <p className="text-xs font-semibold text-[var(--color-danger-700)]">
                Unable to load operations data
              </p>

              <p className="mt-0.5 text-xs text-[var(--color-danger-600)]">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={
              <WarehouseIcon className="h-5 w-5" />
            }
            label="Warehouses"
            value={warehouses.length}
            description="Active locations"
          />

          <StatCard
            icon={
              <BoxIcon className="h-5 w-5" />
            }
            label="Stock records"
            value={stock.length}
            description="Tracked positions"
          />

          <StatCard
            icon={
              <CubeIcon className="h-5 w-5" />
            }
            label="Total units"
            value={totalUnits.toLocaleString()}
            description="Across locations"
          />

          <StatCard
            icon={
              <WarningIcon className="h-5 w-5" />
            }
            label="Low stock"
            value={lowStockCount}
            description="10 units or less"
            warning={lowStockCount > 0}
          />

          <StatCard
            icon={
              <ProductsIcon className="h-5 w-5" />
            }
            label="Products stocked"
            value={stockedProducts}
            description="Unique products"
          />
        </section>

        {/* Warehouses */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Warehouse locations
              </h2>

              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                Configure fulfillment locations
                and shipping priority weights.
              </p>
            </div>

            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
              {warehouses.length}{' '}
              {warehouses.length === 1
                ? 'location'
                : 'locations'}
            </span>
          </div>

          {warehouses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {warehouses.map(
                (warehouse) => (
                  <WarehouseCard
                    key={warehouse.id}
                    warehouse={warehouse}
                    deleting={
                      deletingId ===
                      warehouse.id
                    }
                    stockCount={
                      stock.filter(
                        (item) =>
                          item.warehouseId ===
                          warehouse.id
                      ).length
                    }
                    onEdit={() =>
                      openWarehouseModal(
                        warehouse
                      )
                    }
                    onDelete={() =>
                      deleteWarehouse(
                        warehouse.id
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <EmptyWarehouse
              onAdd={() =>
                openWarehouseModal()
              }
            />
          )}
        </section>

        {/* Inventory */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Inventory stock
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {filteredStock.length} of{' '}
                  {stock.length} stock records shown
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />

                  <input
                    type="text"
                    value={stockSearch}
                    onChange={(event) =>
                      setStockSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search inventory..."
                    className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                  />
                </div>

                <select
                  value={warehouseFilter}
                  onChange={(event) =>
                    setWarehouseFilter(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                >
                  <option value="ALL">
                    All warehouses
                  </option>

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={warehouse.id}
                        value={
                          warehouse.id
                        }
                      >
                        {warehouse.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {filteredStock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Product
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      SKU
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Warehouse
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStock.map(
                    (item) => (
                      <StockRow
                        key={item.id}
                        item={item}
                        deleting={
                          deletingId ===
                          item.id
                        }
                        onEdit={() =>
                          openStockModal(
                            item
                          )
                        }
                        onDelete={() =>
                          deleteStock(
                            item.id
                          )
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStock
              hasFilters={
                Boolean(
                  stockSearch.trim()
                ) ||
                warehouseFilter !==
                  'ALL'
              }
              onClear={() => {
                setStockSearch('')
                setWarehouseFilter(
                  'ALL'
                )
              }}
              onAdd={() =>
                openStockModal()
              }
            />
          )}
        </section>

        {/* Operations note */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
              <InfoIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Inventory powers fulfillment
              </p>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--color-text-secondary)]">
                Warehouse stock is used when approved
                quotations move through fulfillment.
                Shipping cost weight helps the system
                prioritize warehouse allocation.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Warehouse Modal */}
      {warehouseModal && (
        <Modal
          title={
            editingWarehouse
              ? 'Edit warehouse'
              : 'Add warehouse'
          }
          description={
            editingWarehouse
              ? 'Update the warehouse configuration and shipping weight.'
              : 'Create a new fulfillment location.'
          }
          icon={
            <WarehouseIcon className="h-4 w-4" />
          }
          onClose={
            closeWarehouseModal
          }
        >
          <form
            onSubmit={saveWarehouse}
            className="space-y-5"
          >
            {formError && (
              <FormError
                message={formError}
              />
            )}

            <FormField
              label="Warehouse name"
              htmlFor="warehouse-name"
              required
            >
              <input
                id="warehouse-name"
                required
                autoFocus
                value={warehouseName}
                onChange={(event) =>
                  setWarehouseName(
                    event.target.value
                  )
                }
                placeholder="e.g. Pune Warehouse"
                className="form-input"
              />
            </FormField>

            <FormField
              label="Shipping cost weight"
              htmlFor="shipping-weight"
              required
            >
              <div className="relative">
                <input
                  id="shipping-weight"
                  required
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={shippingWeight}
                  onChange={(event) =>
                    setShippingWeight(
                      event.target.value
                    )
                  }
                  className="form-input pr-16"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  weight
                </span>
              </div>

              <p className="mt-1.5 text-[11px] leading-5 text-[var(--color-text-tertiary)]">
                Lower weights can be preferred
                when calculating efficient
                warehouse allocation.
              </p>
            </FormField>

            <ModalActions
              onCancel={
                closeWarehouseModal
              }
              saving={saving}
              submitLabel={
                editingWarehouse
                  ? 'Save changes'
                  : 'Create warehouse'
              }
            />
          </form>
        </Modal>
      )}

      {/* Stock Modal */}
      {stockModal && (
        <Modal
          title={
            editingStock
              ? 'Edit stock'
              : 'Add stock'
          }
          description={
            editingStock
              ? 'Update the inventory quantity for this warehouse position.'
              : 'Add inventory for a product at a warehouse.'
          }
          icon={
            <BoxIcon className="h-4 w-4" />
          }
          onClose={closeStockModal}
        >
          <form
            onSubmit={saveStock}
            className="space-y-5"
          >
            {formError && (
              <FormError
                message={formError}
              />
            )}

            <FormField
              label="Warehouse"
              htmlFor="stock-warehouse"
              required
            >
              <select
                id="stock-warehouse"
                value={stockWarehouse}
                onChange={(event) =>
                  setStockWarehouse(
                    event.target.value
                  )
                }
                disabled={
                  Boolean(editingStock)
                }
                required
                className="form-input disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Select warehouse
                </option>

                {warehouses.map(
                  (warehouse) => (
                    <option
                      key={warehouse.id}
                      value={
                        warehouse.id
                      }
                    >
                      {warehouse.name}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField
              label="Product"
              htmlFor="stock-product"
              required
            >
              <select
                id="stock-product"
                value={stockProduct}
                onChange={(event) =>
                  setStockProduct(
                    event.target.value
                  )
                }
                disabled={
                  Boolean(editingStock)
                }
                required
                className="form-input disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Select product
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={
                        product.id
                      }
                    >
                      {product.name} (
                      {product.sku})
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField
              label="Quantity"
              htmlFor="stock-quantity"
              required
            >
              <div className="relative">
                <input
                  id="stock-quantity"
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={stockQuantity}
                  onChange={(event) =>
                    setStockQuantity(
                      event.target.value
                    )
                  }
                  className="form-input pr-14"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  units
                </span>
              </div>
            </FormField>

            {stockProduct && (
              <StockPreview
                productId={
                  stockProduct
                }
                products={products}
                quantity={
                  stockQuantity
                }
              />
            )}

            <ModalActions
              onCancel={closeStockModal}
              saving={saving}
              submitLabel={
                editingStock
                  ? 'Save changes'
                  : 'Add stock'
              }
            />
          </form>
        </Modal>
      )}
    </>
  )
}

/* =========================================================
   Warehouse Card
   ========================================================= */

function WarehouseCard({
  warehouse,
  stockCount,
  deleting,
  onEdit,
  onDelete,
}) {
  return (
    <div className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary-200)] hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
            <WarehouseIcon className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {warehouse.name}
            </h3>

            <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
              Fulfillment location
            </p>
          </div>
        </div>

        <span className="badge badge-neutral">
          {stockCount} stock{' '}
          {stockCount === 1
            ? 'record'
            : 'records'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Shipping weight
          </p>

          <p className="mt-1 text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
            {Number(
              warehouse.shippingCostWeight
            ).toFixed(1)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Inventory
          </p>

          <p className="mt-1 text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
            {stockCount}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1 border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-danger-600)] transition hover:bg-[var(--color-danger-50)] disabled:opacity-50"
        >
          {deleting
            ? 'Deleting...'
            : 'Delete'}
        </button>
      </div>
    </div>
  )
}

/* =========================================================
   Stock Row
   ========================================================= */

function StockRow({
  item,
  deleting,
  onEdit,
  onDelete,
}) {
  const quantity = Number(
    item.quantity || 0
  )

  return (
    <tr className="group border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-secondary)]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
            <BoxIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {item.product?.name ||
                'Unknown product'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">
          {item.product?.sku ||
            '—'}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <WarehouseIcon className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />

          <span className="text-sm text-[var(--color-text-secondary)]">
            {item.warehouse?.name ||
              'Unknown warehouse'}
          </span>
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
          {quantity.toLocaleString()}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <StockStatus quantity={quantity} />
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-danger-600)] transition hover:bg-[var(--color-danger-50)] disabled:opacity-50"
          >
            {deleting
              ? 'Deleting...'
              : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  )
}

/* =========================================================
   Stock Status
   ========================================================= */

function StockStatus({
  quantity,
}) {
  if (quantity <= 0) {
    return (
      <span className="badge badge-danger">
        Out of stock
      </span>
    )
  }

  if (quantity <= 10) {
    return (
      <span className="badge badge-warning">
        Low stock
      </span>
    )
  }

  return (
    <span className="badge badge-success">
      In stock
    </span>
  )
}

/* =========================================================
   Stock Preview
   ========================================================= */

function StockPreview({
  productId,
  products,
  quantity,
}) {
  const product = products.find(
    (item) =>
      item.id === productId
  )

  if (!product) return null

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
          <BoxIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
            {product.name}
          </p>

          <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-tertiary)]">
            {product.sku}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Quantity
          </p>

          <p className="mt-0.5 text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
            {Number(
              quantity || 0
            ).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Empty States
   ========================================================= */

function EmptyWarehouse({
  onAdd,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-text-tertiary)]">
        <WarehouseIcon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
        No warehouses yet
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
        Create a warehouse to start managing
        inventory and fulfillment locations.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="btn btn-primary mt-5"
      >
        Add warehouse
      </button>
    </div>
  )
}

function EmptyStock({
  hasFilters,
  onClear,
  onAdd,
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]">
        {hasFilters ? (
          <SearchIcon className="h-5 w-5" />
        ) : (
          <BoxIcon className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
        {hasFilters
          ? 'No matching stock records'
          : 'No stock records yet'}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
        {hasFilters
          ? 'Try changing the search or warehouse filter.'
          : 'Add inventory to a warehouse to make it available for fulfillment.'}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="btn btn-secondary mt-5"
        >
          Clear filters
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="btn btn-primary mt-5"
        >
          Add stock
        </button>
      )}
    </div>
  )
}

/* =========================================================
   Modal
   ========================================================= */

function Modal({
  title,
  description,
  icon,
  onClose,
  children,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                {icon}
              </div>

              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {title}
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-tertiary)] transition hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

function ModalActions({
  onCancel,
  saving,
  submitLabel,
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="btn btn-secondary"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="btn btn-primary inline-flex min-w-[130px] items-center justify-center gap-2"
      >
        {saving && (
          <SpinnerIcon className="h-4 w-4 animate-spin" />
        )}

        {saving
          ? 'Saving...'
          : submitLabel}
      </button>
    </div>
  )
}

function FormField({
  label,
  htmlFor,
  required,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-[var(--color-text-primary)]"
      >
        {label}

        {required && (
          <span className="ml-1 text-[var(--color-danger-600)]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  )
}

function FormError({
  message,
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-3 py-2.5">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-600)]" />

      <p className="text-xs leading-5 text-[var(--color-danger-700)]">
        {message}
      </p>
    </div>
  )
}

/* =========================================================
   Stat Card
   ========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
  warning,
}) {
  return (
    <div
      className={`rounded-2xl border bg-[var(--color-surface)] p-4 ${
        warning
          ? 'border-[var(--color-warning-200)]'
          : 'border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            warning
              ? 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]'
              : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {label}
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <p className="truncate text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
              {value}
            </p>

            <span className="truncate text-[10px] text-[var(--color-text-tertiary)]">
              {description}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Skeleton
   ========================================================= */

function WarehouseSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-4 w-[34rem] max-w-full rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-44 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-44 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-44 rounded-2xl bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="h-80 rounded-2xl bg-[var(--color-surface-tertiary)]" />
    </div>
  )
}

/* =========================================================
   Icons
   ========================================================= */

function WarehouseIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21V8l9-5 9 5v13"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 21v-7h10v7"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 10h.01M12 10h.01M17 10h.01"
      />
    </svg>
  )
}

function BoxIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7l8-4 8 4-8 4-8-4z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7v10l8 4 8-4V7"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11v10"
      />
    </svg>
  )
}

function CubeIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 7.5L12 12l7.5-4.5M12 12v9"
      />
    </svg>
  )
}

function ProductsIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 7.5L12 12l7.5-4.5M12 12v9"
      />
    </svg>
  )
}

function WarningIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4l9 16H3L12 4z"
      />

      <path
        strokeLinecap="round"
        d="M12 9v4"
      />

      <path
        strokeLinecap="round"
        d="M12 16.5h.01"
      />
    </svg>
  )
}

function PlusIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        d="M12 5v14M5 12h14"
      />
    </svg>
  )
}

function SearchIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path
        strokeLinecap="round"
        d="M16 16l4.5 4.5"
      />
    </svg>
  )
}

function InfoIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path
        strokeLinecap="round"
        d="M12 10.5v5"
      />

      <path
        strokeLinecap="round"
        d="M12 7.5h.01"
      />
    </svg>
  )
}

function AlertIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3m0 3h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function CloseIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  )
}

function SpinnerIcon({
  className,
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />

      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}