'use client'

import { useEffect, useMemo, useState } from 'react'

export default function ProductsAdminPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] =
    useState('ALL')

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Form state
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] =
    useState('')
  const [categoryId, setCategoryId] =
    useState('')
  const [type, setType] =
    useState('PHYSICAL')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] =
    useState('')
  const [taxPercent, setTaxPercent] =
    useState('')
  const [formError, setFormError] =
    useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      const [prodRes, catRes] =
        await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/categories'),
        ])

      if (!prodRes.ok || !catRes.ok) {
        throw new Error(
          'Failed to fetch product data'
        )
      }

      const prodData = await prodRes.json()
      const catData = await catRes.json()

      setProducts(
        Array.isArray(prodData)
          ? prodData
          : []
      )

      setCategories(
        Array.isArray(catData)
          ? catData
          : []
      )

      if (
        Array.isArray(catData) &&
        catData.length > 0 &&
        !categoryId
      ) {
        setCategoryId(catData[0].id)
      }
    } catch (err) {
      console.error(
        'Fetch products error:',
        err
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.name || '')
          .toLowerCase()
          .includes(query) ||
        String(product.sku || '')
          .toLowerCase()
          .includes(query) ||
        String(
          product.category?.name || ''
        )
          .toLowerCase()
          .includes(query)

      const matchesType =
        typeFilter === 'ALL' ||
        product.type === typeFilter

      const matchesCategory =
        categoryFilter === 'ALL' ||
        product.categoryId ===
          categoryFilter

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory
      )
    })
  }, [
    products,
    search,
    typeFilter,
    categoryFilter,
  ])

  const physicalCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.type === 'PHYSICAL'
      ).length,
    [products]
  )

  const serviceCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.type === 'SERVICE'
      ).length,
    [products]
  )

  const averageMargin = useMemo(() => {
    if (!products.length) return 0

    const total = products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.marginPercent || 0
        ),
      0
    )

    return total / products.length
  }, [products])

  function handleOpenModal(product = null) {
    setEditingProduct(product)
    setFormError('')

    if (product) {
      setSku(product.sku || '')
      setName(product.name || '')
      setDescription(
        product.description || ''
      )
      setCategoryId(
        product.categoryId || ''
      )
      setType(
        product.type || 'PHYSICAL'
      )
      setPrice(
        String(product.price ?? '')
      )
      setCostPrice(
        String(product.costPrice ?? '')
      )
      setTaxPercent(
        String(product.taxPercent ?? '0')
      )
    } else {
      setSku('')
      setName('')
      setDescription('')
      setCategoryId(
        categories.length
          ? categories[0].id
          : ''
      )
      setType('PHYSICAL')
      setPrice('')
      setCostPrice('')
      setTaxPercent('0')
    }

    setIsModalOpen(true)
  }

  function handleCloseModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingProduct(null)

    setSku('')
    setName('')
    setDescription('')
    setCategoryId('')
    setType('PHYSICAL')
    setPrice('')
    setCostPrice('')
    setTaxPercent('0')
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const trimmedSku = sku.trim()
    const trimmedName = name.trim()
    const numericPrice = Number(price)
    const numericCost = Number(costPrice)
    const numericTax = Number(taxPercent)

    if (!trimmedSku) {
      setFormError(
        'SKU is required.'
      )
      return
    }

    if (!trimmedName) {
      setFormError(
        'Product name is required.'
      )
      return
    }

    if (!categoryId) {
      setFormError(
        'Please select a category.'
      )
      return
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setFormError(
        'Price must be a valid non-negative number.'
      )
      return
    }

    if (
      !Number.isFinite(numericCost) ||
      numericCost < 0
    ) {
      setFormError(
        'Cost price must be a valid non-negative number.'
      )
      return
    }

    if (
      !Number.isFinite(numericTax) ||
      numericTax < 0
    ) {
      setFormError(
        'Tax rate must be a valid non-negative number.'
      )
      return
    }

    if (
      numericPrice > 0 &&
      numericCost > numericPrice
    ) {
      const proceed = window.confirm(
        'The cost price is higher than the selling price. Continue?'
      )

      if (!proceed) return
    }

    try {
      setSaving(true)

      const payload = {
        sku: trimmedSku,
        name: trimmedName,
        description:
          description.trim(),
        categoryId,
        type,
        price,
        costPrice,
        taxPercent,
      }

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'

      const method = editingProduct
        ? 'PUT'
        : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            (editingProduct
              ? 'Update failed'
              : 'Create failed')
        )
      }

      handleCloseModal()
      await fetchData()
    } catch (err) {
      console.error(
        'Save product error:',
        err
      )

      setFormError(
        err.message ||
          'Unable to save product.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingId(product.id)

      const res = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Delete failed'
        )
      }

      await fetchData()
    } catch (err) {
      console.error(
        'Delete product error:',
        err
      )

      window.alert(
        err.message ||
          'Unable to delete product.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const currentMargin = calculateMargin(
    price,
    costPrice
  )

  if (loading) {
    return <ProductsSkeleton />
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
                  <ProductsIcon className="h-4 w-4" />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  Configuration / Catalog
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Products
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Manage your product catalog, pricing,
                categories, tax rates, and commercial
                margins.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleOpenModal()
              }
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add product
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={
              <ProductsIcon className="h-5 w-5" />
            }
            label="Total products"
            value={products.length}
            description="Catalog items"
          />

          <StatCard
            icon={
              <BoxIcon className="h-5 w-5" />
            }
            label="Physical"
            value={physicalCount}
            description="Stock-managed items"
          />

          <StatCard
            icon={
              <ServiceIcon className="h-5 w-5" />
            }
            label="Services"
            value={serviceCount}
            description="Non-stock offerings"
          />

          <StatCard
            icon={
              <ChartIcon className="h-5 w-5" />
            }
            label="Avg. margin"
            value={`${averageMargin.toFixed(1)}%`}
            description="Across catalog"
          />
        </section>

        {/* Product table */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Product catalog
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {filteredProducts.length} of{' '}
                  {products.length} products shown
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search products..."
                    className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                  />
                </div>

                {/* Type */}
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                >
                  <option value="ALL">
                    All types
                  </option>

                  <option value="PHYSICAL">
                    Physical
                  </option>

                  <option value="SERVICE">
                    Service
                  </option>
                </select>

                {/* Category */}
                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                  className="h-10 max-w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                >
                  <option value="ALL">
                    All categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Product
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Category
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Type
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Price
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Cost
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Margin
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Tax
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        deleting={
                          deletingId ===
                          product.id
                        }
                        onEdit={() =>
                          handleOpenModal(
                            product
                          )
                        }
                        onDelete={() =>
                          handleDelete(
                            product
                          )
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              hasFilters={
                Boolean(search.trim()) ||
                typeFilter !== 'ALL' ||
                categoryFilter !== 'ALL'
              }
              onClear={() => {
                setSearch('')
                setTypeFilter('ALL')
                setCategoryFilter(
                  'ALL'
                )
              }}
              onAdd={() =>
                handleOpenModal()
              }
            />
          )}
        </section>

        {/* Catalog note */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
              <InfoIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Product pricing feeds the sales workflow
              </p>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--color-text-secondary)]">
                Product prices and categories are used when
                sales representatives build quotations. Category
                rules can also influence discount and risk
                evaluation.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Product modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseModal()
            }
          }}
        >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                    <ProductsIcon className="h-4 w-4" />
                  </div>

                  <h2
                    id="product-modal-title"
                    className="text-base font-semibold text-[var(--color-text-primary)]"
                  >
                    {editingProduct
                      ? 'Edit product'
                      : 'Add product'}
                  </h2>
                </div>

                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  {editingProduct
                    ? 'Update the product catalog information and pricing.'
                    : 'Add a new product to your DealFlow catalog.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-tertiary)] transition hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="overflow-y-auto">
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
              >
                {formError && (
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-3 py-2.5">
                      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-600)]" />

                      <p className="text-xs leading-5 text-[var(--color-danger-700)]">
                        {formError}
                      </p>
                    </div>
                  </div>
                )}

                {/* SKU */}
                <FormField
                  label="SKU"
                  htmlFor="product-sku"
                  required
                >
                  <div className="relative">
                    <input
                      id="product-sku"
                      required
                      type="text"
                      value={sku}
                      onChange={(event) =>
                        setSku(
                          event.target.value
                        )
                      }
                      placeholder="e.g. PROD-001"
                      className="form-input font-mono text-sm uppercase"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <CodeIcon className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                    </span>
                  </div>
                </FormField>

                {/* Name */}
                <FormField
                  label="Product name"
                  htmlFor="product-name"
                  required
                >
                  <input
                    id="product-name"
                    required
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Enterprise CRM"
                    className="form-input"
                  />
                </FormField>

                {/* Description */}
                <div className="sm:col-span-2">
                  <FormField
                    label="Description"
                    htmlFor="product-description"
                    optional
                  >
                    <textarea
                      id="product-description"
                      rows={3}
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      placeholder="Describe the product or service..."
                      className="form-input min-h-[88px] resize-y py-3"
                    />
                  </FormField>
                </div>

                {/* Category */}
                <FormField
                  label="Category"
                  htmlFor="product-category"
                  required
                >
                  <select
                    id="product-category"
                    required
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(
                        event.target.value
                      )
                    }
                    className="form-input"
                  >
                    {categories.length ===
                    0 ? (
                      <option value="">
                        No categories available
                      </option>
                    ) : (
                      categories.map(
                        (category) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {category.name}
                          </option>
                        )
                      )
                    )}
                  </select>
                </FormField>

                {/* Type */}
                <FormField
                  label="Product type"
                  htmlFor="product-type"
                  required
                >
                  <select
                    id="product-type"
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target.value
                      )
                    }
                    className="form-input"
                  >
                    <option value="PHYSICAL">
                      Physical
                    </option>

                    <option value="SERVICE">
                      Service
                    </option>
                  </select>
                </FormField>

                {/* Price */}
                <FormField
                  label="Selling price"
                  htmlFor="product-price"
                  required
                >
                  <MoneyInput
                    id="product-price"
                    value={price}
                    onChange={setPrice}
                    placeholder="0.00"
                  />
                </FormField>

                {/* Cost */}
                <FormField
                  label="Cost price"
                  htmlFor="product-cost"
                  required
                >
                  <MoneyInput
                    id="product-cost"
                    value={costPrice}
                    onChange={setCostPrice}
                    placeholder="0.00"
                  />
                </FormField>

                {/* Tax */}
                <FormField
                  label="Tax rate"
                  htmlFor="product-tax"
                  required
                >
                  <div className="relative">
                    <input
                      id="product-tax"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxPercent}
                      onChange={(event) =>
                        setTaxPercent(
                          event.target.value
                        )
                      }
                      placeholder="0"
                      className="form-input pr-10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-tertiary)]">
                      %
                    </span>
                  </div>
                </FormField>

                {/* Margin */}
                <FormField
                  label="Calculated margin"
                  htmlFor="product-margin"
                  optional
                >
                  <div
                    id="product-margin"
                    className="flex h-11 items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3"
                  >
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      Gross margin
                    </span>

                    <span
                      className={`text-sm font-bold ${
                        currentMargin < 0
                          ? 'text-[var(--color-danger-600)]'
                          : currentMargin < 20
                            ? 'text-[var(--color-warning-600)]'
                            : 'text-[var(--color-success-600)]'
                      }`}
                    >
                      {currentMargin.toFixed(
                        2
                      )}
                      %
                    </span>
                  </div>
                </FormField>

                {/* Pricing preview */}
                <div className="sm:col-span-2">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                          Pricing preview
                        </p>

                        <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                          Current catalog economics
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">
                          $
                          {formatMoney(
                            price
                          )}
                        </span>

                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          / unit
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <MiniMetric
                        label="Cost"
                        value={`$${formatMoney(
                          costPrice
                        )}`}
                      />

                      <MiniMetric
                        label="Tax"
                        value={`${Number(
                          taxPercent || 0
                        ).toFixed(2)}%`}
                      />

                      <MiniMetric
                        label="Margin"
                        value={`${currentMargin.toFixed(
                          2
                        )}%`}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="sm:col-span-2 flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
                  <button
                    type="button"
                    onClick={
                      handleCloseModal
                    }
                    disabled={saving}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      categories.length === 0
                    }
                    className="btn btn-primary inline-flex min-w-[120px] items-center justify-center gap-2"
                  >
                    {saving && (
                      <SpinnerIcon className="h-4 w-4 animate-spin" />
                    )}

                    {saving
                      ? 'Saving...'
                      : editingProduct
                        ? 'Save changes'
                        : 'Create product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* =========================================================
   Product Row
   ========================================================= */

function ProductRow({
  product,
  deleting,
  onEdit,
  onDelete,
}) {
  const margin = Number(
    product.marginPercent || 0
  )

  const isPhysical =
    product.type === 'PHYSICAL'

  return (
    <tr className="group border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-secondary)]">
      {/* Product */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
            {isPhysical ? (
              <BoxIcon className="h-4 w-4" />
            ) : (
              <ServiceIcon className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {product.name ||
                'Unnamed product'}
            </p>

            <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-tertiary)]">
              {product.sku}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-5 py-4">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {product.category?.name ||
            'Uncategorized'}
        </span>
      </td>

      {/* Type */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            isPhysical
              ? 'border-[var(--color-primary-100)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isPhysical
            ? 'Physical'
            : 'Service'}
        </span>
      </td>

      {/* Price */}
      <td className="px-5 py-4 text-right">
        <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
          ${formatMoney(product.price)}
        </span>
      </td>

      {/* Cost */}
      <td className="px-5 py-4 text-right">
        <span className="text-sm tabular-nums text-[var(--color-text-secondary)]">
          $
          {formatMoney(
            product.costPrice
          )}
        </span>
      </td>

      {/* Margin */}
      <td className="px-5 py-4 text-right">
        <MarginBadge value={margin} />
      </td>

      {/* Tax */}
      <td className="px-5 py-4 text-right">
        <span className="text-sm tabular-nums text-[var(--color-text-secondary)]">
          {Number(
            product.taxPercent || 0
          ).toFixed(2)}
          %
        </span>
      </td>

      {/* Actions */}
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
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-danger-600)] transition hover:bg-[var(--color-danger-50)] disabled:cursor-not-allowed disabled:opacity-50"
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
   Margin Badge
   ========================================================= */

function MarginBadge({ value }) {
  let className =
    'border-[var(--color-success-100)] bg-[var(--color-success-50)] text-[var(--color-success-700)]'

  if (value < 20) {
    className =
      'border-[var(--color-warning-100)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]'
  }

  if (value < 0) {
    className =
      'border-[var(--color-danger-100)] bg-[var(--color-danger-50)] text-[var(--color-danger-700)]'
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tabular-nums ${className}`}
    >
      {value.toFixed(1)}%
    </span>
  )
}

/* =========================================================
   Form Components
   ========================================================= */

function FormField({
  label,
  htmlFor,
  required = false,
  optional = false,
  children,
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-[var(--color-text-primary)]"
        >
          {label}
          {required && (
            <span className="ml-1 text-[var(--color-danger-600)]">
              *
            </span>
          )}
        </label>

        {optional && (
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            Optional
          </span>
        )}
      </div>

      {children}
    </div>
  )
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-tertiary)]">
        $
      </span>

      <input
        id={id}
        required
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="form-input pl-8"
      />
    </div>
  )
}

function MiniMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
        {value}
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
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {label}
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <p className="truncate text-lg font-bold text-[var(--color-text-primary)]">
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
   Empty State
   ========================================================= */

function EmptyState({
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
          <ProductsIcon className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
        {hasFilters
          ? 'No matching products'
          : 'No products yet'}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
        {hasFilters
          ? 'Try a different search term or clear the current filters.'
          : 'Add your first product to start building the DealFlow catalog.'}
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
          Add product
        </button>
      )}
    </div>
  )
}

/* =========================================================
   Skeleton
   ========================================================= */

function ProductsSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-4 w-[32rem] max-w-full rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <div className="h-16 bg-[var(--color-surface-tertiary)]" />

        <div className="space-y-px">
          <div className="h-20 bg-[var(--color-surface-secondary)]" />
          <div className="h-20 bg-[var(--color-surface-secondary)]" />
          <div className="h-20 bg-[var(--color-surface-secondary)]" />
          <div className="h-20 bg-[var(--color-surface-secondary)]" />
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Helpers
   ========================================================= */

function calculateMargin(
  price,
  costPrice
) {
  const sellingPrice = Number(price)
  const cost = Number(costPrice)

  if (
    !Number.isFinite(sellingPrice) ||
    !Number.isFinite(cost) ||
    sellingPrice <= 0
  ) {
    return 0
  }

  return (
    ((sellingPrice - cost) /
      sellingPrice) *
    100
  )
}

function formatMoney(value) {
  const number = Number(value || 0)

  if (!Number.isFinite(number)) {
    return '0.00'
  }

  return number.toFixed(2)
}

/* =========================================================
   Icons
   ========================================================= */

function ProductsIcon({ className }) {
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

function BoxIcon({ className }) {
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

function ServiceIcon({ className }) {
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
        d="M4 19h16"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 16l3-4 3 2 6-7"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7h2v2"
      />
    </svg>
  )
}

function ChartIcon({ className }) {
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
        d="M4 19V5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 19h16"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 15l3-4 3 2 5-7"
      />
    </svg>
  )
}

function PlusIcon({ className }) {
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

function SearchIcon({ className }) {
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

function InfoIcon({ className }) {
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

function CloseIcon({ className }) {
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

function AlertIcon({ className }) {
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

function SpinnerIcon({ className }) {
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

function CodeIcon({ className }) {
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
        d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"
      />
    </svg>
  )
}