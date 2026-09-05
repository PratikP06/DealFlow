'use client'

import { useEffect, useMemo, useState } from 'react'

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [name, setName] = useState('')
  const [discountCeilingPercent, setDiscountCeilingPercent] =
    useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setLoading(true)

      const res = await fetch('/api/admin/categories')

      if (!res.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch categories error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return categories

    return categories.filter((category) =>
      String(category.name || '')
        .toLowerCase()
        .includes(query)
    )
  }, [categories, search])

  const averageCeiling = useMemo(() => {
    if (!categories.length) return 0

    const total = categories.reduce(
      (sum, category) =>
        sum +
        Number(category.discountCeilingPercent || 0),
      0
    )

    return total / categories.length
  }, [categories])

  const highestCeiling = useMemo(() => {
    if (!categories.length) return 0

    return Math.max(
      ...categories.map((category) =>
        Number(category.discountCeilingPercent || 0)
      )
    )
  }, [categories])

  function handleOpenModal(category = null) {
    setEditingCategory(category)
    setFormError('')

    if (category) {
      setName(category.name || '')
      setDiscountCeilingPercent(
        String(category.discountCeilingPercent ?? '')
      )
    } else {
      setName('')
      setDiscountCeilingPercent('')
    }

    setIsModalOpen(true)
  }

  function handleCloseModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingCategory(null)
    setName('')
    setDiscountCeilingPercent('')
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const trimmedName = name.trim()
    const discount = Number(discountCeilingPercent)

    if (!trimmedName) {
      setFormError('Category name is required.')
      return
    }

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      setFormError(
        'Discount ceiling must be between 0% and 100%.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        name: trimmedName,
        discountCeilingPercent: discount,
      }

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'

      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            (editingCategory
              ? 'Update failed'
              : 'Create failed')
        )
      }

      handleCloseModal()
      await fetchCategories()
    } catch (err) {
      console.error('Save category error:', err)
      setFormError(
        err.message || 'Unable to save category.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingId(category.id)

      const res = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error || 'Delete failed'
        )
      }

      await fetchCategories()
    } catch (err) {
      console.error('Delete category error:', err)
      window.alert(
        err.message || 'Unable to delete category.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <CategoriesSkeleton />
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
                  <CategoriesIcon className="h-4 w-4" />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  Configuration / Pricing
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Categories
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Define product categories and the maximum discount
                allowed during quotation creation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add category
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<LayersIcon className="h-5 w-5" />}
            label="Total categories"
            value={categories.length}
            description="Configured categories"
          />

          <StatCard
            icon={<ChartIcon className="h-5 w-5" />}
            label="Average ceiling"
            value={`${averageCeiling.toFixed(1)}%`}
            description="Across all categories"
          />

          <StatCard
            icon={<ShieldIcon className="h-5 w-5" />}
            label="Highest ceiling"
            value={`${highestCeiling}%`}
            description="Maximum configured limit"
          />
        </section>

        {/* Main card */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Category rules
              </h2>

              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                {filteredCategories.length} of{' '}
                {categories.length} categories shown
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search categories..."
                className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
              />
            </div>
          </div>

          {/* Table */}
          {filteredCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Category
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Discount ceiling
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Risk level
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map(
                    (category) => {
                      const ceiling = Number(
                        category.discountCeilingPercent || 0
                      )

                      return (
                        <tr
                          key={category.id}
                          className="group border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-secondary)]"
                        >
                          {/* Category */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-xs font-bold text-[var(--color-primary-700)]">
                                {getInitials(
                                  category.name
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                                  {category.name}
                                </p>

                                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                                  Product category
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Discount */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]">
                                <div
                                  className="h-full rounded-full bg-[var(--color-primary-500)] transition-all"
                                  style={{
                                    width: `${Math.min(
                                      ceiling,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                                {ceiling}%
                              </span>
                            </div>
                          </td>

                          {/* Risk */}
                          <td className="px-5 py-4">
                            <CeilingBadge
                              value={ceiling}
                            />
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenModal(
                                    category
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    category
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  category.id
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-danger-600)] transition hover:bg-[var(--color-danger-50)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                category.id
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              hasSearch={Boolean(search.trim())}
              onClear={() => setSearch('')}
              onAdd={() => handleOpenModal()}
            />
          )}
        </section>

        {/* Explanation */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
              <InfoIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                How discount ceilings work
              </p>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--color-text-secondary)]">
                The category ceiling is one of the limits used when
                evaluating quotation discounts. A requested discount
                above the configured ceiling can contribute to the
                quotation risk score and trigger approval.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal()
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                    <CategoriesIcon className="h-4 w-4" />
                  </div>

                  <h2
                    id="category-modal-title"
                    className="text-base font-semibold text-[var(--color-text-primary)]"
                  >
                    {editingCategory
                      ? 'Edit category'
                      : 'Add category'}
                  </h2>
                </div>

                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  Configure the category's discount limit.
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

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-3 py-2.5">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-600)]" />

                  <p className="text-xs leading-5 text-[var(--color-danger-700)]">
                    {formError}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="category-name"
                  className="mb-1.5 block text-xs font-semibold text-[var(--color-text-primary)]"
                >
                  Category name
                </label>

                <input
                  id="category-name"
                  required
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Enterprise Software"
                  autoFocus
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="discount-ceiling"
                    className="text-xs font-semibold text-[var(--color-text-primary)]"
                  >
                    Discount ceiling
                  </label>

                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                    0–100%
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="discount-ceiling"
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={discountCeilingPercent}
                    onChange={(event) =>
                      setDiscountCeilingPercent(
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 pr-10 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-tertiary)]">
                    %
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] leading-5 text-[var(--color-text-tertiary)]">
                  Discounts above this limit can increase quotation
                  risk and require approval.
                </p>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    Rule preview
                  </span>

                  <CeilingBadge
                    value={Number(
                      discountCeilingPercent || 0
                    )}
                  />
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary-500)] transition-all duration-200"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            discountCeilingPercent || 0
                          ),
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary inline-flex min-w-[100px] items-center justify-center gap-2"
                >
                  {saving && (
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                  )}

                  {saving
                    ? 'Saving...'
                    : editingCategory
                      ? 'Save changes'
                      : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

/* =========================================================
   Components
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

function CeilingBadge({ value }) {
  const ceiling = Number(value || 0)

  let className = 'badge-success'
  let label = 'Standard'

  if (ceiling > 30) {
    className = 'badge-warning'
    label = 'High'
  }

  if (ceiling > 50) {
    className = 'badge-danger'
    label = 'Very high'
  }

  return (
    <span className={`badge ${className}`}>
      {label}
    </span>
  )
}

function EmptyState({
  hasSearch,
  onClear,
  onAdd,
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]">
        {hasSearch ? (
          <SearchIcon className="h-5 w-5" />
        ) : (
          <CategoriesIcon className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
        {hasSearch
          ? 'No matching categories'
          : 'No categories yet'}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
        {hasSearch
          ? 'Try a different search term or clear the current filter.'
          : 'Create your first product category to start configuring discount ceilings.'}
      </p>

      {hasSearch ? (
        <button
          type="button"
          onClick={onClear}
          className="btn btn-secondary mt-5"
        >
          Clear search
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="btn btn-primary mt-5"
        >
          Add category
        </button>
      )}
    </div>
  )
}

function CategoriesSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-4 w-96 max-w-full rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Helpers
   ========================================================= */

function getInitials(name) {
  if (!name) return 'C'

  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

/* =========================================================
   Icons
   ========================================================= */

function CategoriesIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.2"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.2"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.2"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.2"
      />
    </svg>
  )
}

function LayersIcon({ className }) {
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
        d="M12 3l9 5-9 5-9-5 9-5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l9 5 9-5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16l9 5 9-5"
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

function ShieldIcon({ className }) {
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
        d="M12 3l7 3v5c0 4.5-2.8 7.9-7 10-4.2-2.1-7-5.5-7-10V6l7-3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 12l1.7 1.7L15 10"
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