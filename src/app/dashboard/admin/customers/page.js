'use client'

import { useEffect, useMemo, useState } from 'react'

const TIERS = {
  BRONZE: {
    label: 'Bronze',
    description: 'Standard customer tier',
    className:
      'border-[var(--color-warning-100)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
    iconClass:
      'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
  },
  SILVER: {
    label: 'Silver',
    description: 'Enhanced customer tier',
    className:
      'border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
    iconClass:
      'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
  },
  GOLD: {
    label: 'Gold',
    description: 'Premium customer tier',
    className:
      'border-[var(--color-warning-100)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
    iconClass:
      'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
  },
}

const PAGE_SIZE = 20

export default function CustomersAdminPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('ALL')

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tier, setTier] = useState('BRONZE')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchCustomers(page)
  }, [page])

  async function fetchCustomers(requestedPage = page) {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: String(PAGE_SIZE),
      })

      const res = await fetch(
        `/api/admin/customers?${params.toString()}`
      )

      if (!res.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data = await res.json()

      setCustomers(
        Array.isArray(data.customers)
          ? data.customers
          : []
      )

      setPagination(
        data.pagination || {
          page: requestedPage,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      )
    } catch (err) {
      console.error(
        'Fetch customers error:',
        err
      )

      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  /*
   * Search/filter is intentionally done on the current page
   * because the API currently supports pagination only.
   *
   * This means the database returns 20 customers at a time
   * instead of loading all 200 customers into the browser.
   */
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        String(customer.name || '')
          .toLowerCase()
          .includes(query) ||
        String(customer.email || '')
          .toLowerCase()
          .includes(query)

      const matchesTier =
        tierFilter === 'ALL' ||
        customer.tier === tierFilter

      return matchesSearch && matchesTier
    })
  }, [customers, search, tierFilter])

  const tierCounts = useMemo(() => {
    return {
      BRONZE: customers.filter(
        (customer) =>
          customer.tier === 'BRONZE'
      ).length,

      SILVER: customers.filter(
        (customer) =>
          customer.tier === 'SILVER'
      ).length,

      GOLD: customers.filter(
        (customer) =>
          customer.tier === 'GOLD'
      ).length,
    }
  }, [customers])

  function handleOpenModal(customer = null) {
    setEditingCustomer(customer)
    setFormError('')

    if (customer) {
      setName(customer.name || '')
      setEmail(customer.email || '')
      setPassword('')
      setTier(customer.tier || 'BRONZE')
    } else {
      setName('')
      setEmail('')
      setPassword('')
      setTier('BRONZE')
    }

    setIsModalOpen(true)
  }

  function handleCloseModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingCustomer(null)

    setName('')
    setEmail('')
    setPassword('')
    setTier('BRONZE')
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setFormError(
        'Customer name is required.'
      )
      return
    }

    if (!editingCustomer && !trimmedEmail) {
      setFormError(
        'Email address is required.'
      )
      return
    }

    if (!editingCustomer && password.length < 6) {
      setFormError(
        'Password must be at least 6 characters.'
      )
      return
    }

    try {
      setSaving(true)

      let res

      if (editingCustomer) {
        res = await fetch(
          `/api/admin/customers/${editingCustomer.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: trimmedName,
              tier,
            }),
          }
        )
      } else {
        res = await fetch(
          '/api/admin/customers',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: trimmedName,
              email: trimmedEmail,
              password,
              tier,
            }),
          }
        )
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            (editingCustomer
              ? 'Update failed'
              : 'Create failed')
        )
      }

      handleCloseModal()

      /*
       * Refresh the current page after creating/editing.
       * If a new customer pushes pagination around,
       * the API will still return the correct page.
       */
      await fetchCustomers(page)
    } catch (err) {
      console.error(
        'Save customer error:',
        err
      )

      setFormError(
        err.message ||
          'Unable to save customer.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(customer) {
    const confirmed = window.confirm(
      `Delete "${customer.name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingId(customer.id)

      const res = await fetch(
        `/api/admin/customers/${customer.id}`,
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

      /*
       * If the last customer on the current page
       * was deleted, move back one page.
       */
      if (
        customers.length === 1 &&
        page > 1
      ) {
        setPage((current) => current - 1)
      } else {
        await fetchCustomers(page)
      }
    } catch (err) {
      console.error(
        'Delete customer error:',
        err
      )

      window.alert(
        err.message ||
          'Unable to delete customer.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  function handlePreviousPage() {
    if (!pagination.hasPreviousPage) return

    setPage((current) =>
      Math.max(1, current - 1)
    )
  }

  function handleNextPage() {
    if (!pagination.hasNextPage) return

    setPage((current) =>
      current + 1
    )
  }

  function handlePageChange(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === page
    ) {
      return
    }

    setPage(nextPage)
  }

  function getPageNumbers() {
    const totalPages = pagination.totalPages

    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      )
    }

    const pages = []

    pages.push(1)

    if (page > 4) {
      pages.push('ellipsis-left')
    }

    const start = Math.max(2, page - 1)
    const end = Math.min(
      totalPages - 1,
      page + 1
    )

    for (
      let current = start;
      current <= end;
      current++
    ) {
      pages.push(current)
    }

    if (page < totalPages - 3) {
      pages.push('ellipsis-right')
    }

    pages.push(totalPages)

    return pages
  }

  if (loading) {
    return <CustomersSkeleton />
  }

  const startItem =
    pagination.total === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1

  const endItem = Math.min(
    page * PAGE_SIZE,
    pagination.total
  )

  return (
    <>
      <div className="space-y-7">

        {/* Header */}
        <section>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                  <CustomersIcon className="h-4 w-4" />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  Configuration / CRM
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Customers
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Manage customer accounts, commercial tiers,
                and access details used throughout the sales
                workflow.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add customer
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <CustomersIcon className="h-5 w-5" />
            }
            label="Total customers"
            value={pagination.total}
            description="Customer accounts"
          />

          <StatCard
            icon={
              <BronzeIcon className="h-5 w-5" />
            }
            label="Bronze"
            value={tierCounts.BRONZE}
            description="On this page"
          />

          <StatCard
            icon={
              <SilverIcon className="h-5 w-5" />
            }
            label="Silver"
            value={tierCounts.SILVER}
            description="On this page"
          />

          <StatCard
            icon={
              <GoldIcon className="h-5 w-5" />
            }
            label="Gold"
            value={tierCounts.GOLD}
            description="On this page"
          />
        </section>

        {/* Customer table */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Customer accounts
              </h2>

              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                {pagination.total === 0
                  ? 'No customers'
                  : `Showing ${startItem}–${endItem} of ${pagination.total} customers`}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                  }}
                  placeholder="Search this page..."
                  className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                />
              </div>

              {/* Tier filter */}
              <select
                value={tierFilter}
                onChange={(event) => {
                  setTierFilter(event.target.value)
                }}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
              >
                <option value="ALL">
                  All tiers
                </option>

                <option value="BRONZE">
                  Bronze
                </option>

                <option value="SILVER">
                  Silver
                </option>

                <option value="GOLD">
                  Gold
                </option>
              </select>
            </div>
          </div>

          {filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Email
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Tier
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Created
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map(
                    (customer) => (
                      <CustomerRow
                        key={customer.id}
                        customer={customer}
                        deleting={
                          deletingId ===
                          customer.id
                        }
                        onEdit={() =>
                          handleOpenModal(
                            customer
                          )
                        }
                        onDelete={() =>
                          handleDelete(
                            customer
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
                tierFilter !== 'ALL'
              }
              onClear={() => {
                setSearch('')
                setTierFilter('ALL')
              }}
              onAdd={() =>
                handleOpenModal()
              }
            />
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs text-[var(--color-text-tertiary)]">
                Page {page} of {pagination.totalPages}
              </p>

              <div className="flex items-center justify-center gap-1">

                {/* Previous */}
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={
                    !pagination.hasPreviousPage ||
                    loading
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    Previous
                  </span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map(
                    (pageNumber, index) => {
                      if (
                        typeof pageNumber !==
                        'number'
                      ) {
                        return (
                          <span
                            key={`${pageNumber}-${index}`}
                            className="flex h-9 w-9 items-center justify-center text-xs text-[var(--color-text-tertiary)]"
                          >
                            •••
                          </span>
                        )
                      }

                      const active =
                        pageNumber === page

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() =>
                            handlePageChange(
                              pageNumber
                            )
                          }
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
                            active
                              ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    }
                  )}
                </div>

                {/* Next */}
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={
                    !pagination.hasNextPage ||
                    loading
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">
                    Next
                  </span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Tier explanation */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
              <ShieldIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Customer tiers influence commercial rules
              </p>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--color-text-secondary)]">
                Customer tiers are used by the quotation and
                risk workflow to determine the commercial limits
                that apply when sales representatives create or
                negotiate deals.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Customer modal */}
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
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                    <CustomersIcon className="h-4 w-4" />
                  </div>

                  <h2
                    id="customer-modal-title"
                    className="text-base font-semibold text-[var(--color-text-primary)]"
                  >
                    {editingCustomer
                      ? 'Edit customer'
                      : 'Add customer'}
                  </h2>
                </div>

                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  {editingCustomer
                    ? 'Update the customer profile and commercial tier.'
                    : 'Create a customer account for the DealFlow portal.'}
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

              {/* Name */}
              <div>
                <label
                  htmlFor="customer-name"
                  className="mb-1.5 block text-xs font-semibold text-[var(--color-text-primary)]"
                >
                  Customer name
                </label>

                <input
                  id="customer-name"
                  required
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Acme Corporation"
                  autoFocus
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="customer-email"
                  className="mb-1.5 block text-xs font-semibold text-[var(--color-text-primary)]"
                >
                  Email address
                </label>

                <input
                  id="customer-email"
                  required={!editingCustomer}
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  disabled={
                    Boolean(editingCustomer)
                  }
                  placeholder="customer@company.com"
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] disabled:cursor-not-allowed disabled:opacity-50"
                />

                {editingCustomer && (
                  <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                    Email addresses cannot be changed
                    from this form.
                  </p>
                )}
              </div>

              {/* Password */}
              {!editingCustomer && (
                <div>
                  <label
                    htmlFor="customer-password"
                    className="mb-1.5 block text-xs font-semibold text-[var(--color-text-primary)]"
                  >
                    Initial password
                  </label>

                  <input
                    id="customer-password"
                    required
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 6 characters"
                    className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                  />

                  <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                    The customer can use this to sign in
                    to the portal.
                  </p>
                </div>
              )}

              {/* Tier */}
              <div>
                <label
                  htmlFor="customer-tier"
                  className="mb-1.5 block text-xs font-semibold text-[var(--color-text-primary)]"
                >
                  Customer tier
                </label>

                <select
                  id="customer-tier"
                  value={tier}
                  onChange={(event) =>
                    setTier(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-sm font-medium text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                >
                  <option value="BRONZE">
                    Bronze
                  </option>

                  <option value="SILVER">
                    Silver
                  </option>

                  <option value="GOLD">
                    Gold
                  </option>
                </select>
              </div>

              {/* Tier preview */}
              <TierPreview tier={tier} />

              {/* Actions */}
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
                  className="btn btn-primary inline-flex min-w-[120px] items-center justify-center gap-2"
                >
                  {saving && (
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                  )}

                  {saving
                    ? 'Saving...'
                    : editingCustomer
                      ? 'Save changes'
                      : 'Create customer'}
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
   Customer Row
   ========================================================= */

function CustomerRow({
  customer,
  deleting,
  onEdit,
  onDelete,
}) {
  const tier =
    TIERS[customer.tier] ||
    TIERS.BRONZE

  return (
    <tr className="group border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-secondary)]">

      {/* Customer */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${tier.iconClass}`}
          >
            {getInitials(
              customer.name
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {customer.name ||
                'Unnamed customer'}
            </p>

            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              Customer account
            </p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-5 py-4">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {customer.email ||
            'No email'}
        </span>
      </td>

      {/* Tier */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tier.className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {tier.label}
        </span>
      </td>

      {/* Created */}
      <td className="px-5 py-4">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {formatDate(
            customer.createdAt
          )}
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
   Tier Preview
   ========================================================= */

function TierPreview({ tier }) {
  const config =
    TIERS[tier] || TIERS.BRONZE

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.iconClass}`}
        >
          <ShieldIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">
              {config.label} tier
            </p>

            <span
              className={`badge ${
                tier === 'GOLD'
                  ? 'badge-warning'
                  : tier === 'SILVER'
                    ? 'badge-neutral'
                    : 'badge-warning'
              }`}
            >
              Selected
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
            {config.description}
          </p>
        </div>
      </div>
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
          <CustomersIcon className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
        {hasFilters
          ? 'No matching customers'
          : 'No customers yet'}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
        {hasFilters
          ? 'Try a different search term or clear the current filters.'
          : 'Create your first customer account to start building deals.'}
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
          Add customer
        </button>
      )}
    </div>
  )
}

/* =========================================================
   Skeleton
   ========================================================= */

function CustomersSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-4 w-96 max-w-full rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

function getInitials(name) {
  if (!name) return 'CU'

  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(date)
}

/* =========================================================
   Icons
   ========================================================= */

function CustomersIcon({ className }) {
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
        d="M16 20v-1.5a4 4 0 00-4-4H7a4 4 0 00-4 4V20"
      />

      <circle
        cx="9.5"
        cy="7"
        r="3.5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 11a3.5 3.5 0 100-7"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 20v-1.5a4 4 0 00-3-3.87"
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

function BronzeIcon({ className }) {
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
        r="8"
      />

      <path
        strokeLinecap="round"
        d="M8.5 12h7M10 8.5h4M10 15.5h4"
      />
    </svg>
  )
}

function SilverIcon({ className }) {
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
        d="M12 3l2.1 5.1L19.5 9l-4.1 3.8 1.2 5.5L12 15.5l-4.6 2.8 1.2-5.5L4.5 9l5.4-.9L12 3z"
      />
    </svg>
  )
}

function GoldIcon({ className }) {
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
        d="M6 4h12l-1 6c-.6 3.2-2.6 5.2-5 5.2S7.6 13.2 7 10L6 4z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 20h8M12 15.2V20"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6H3v1c0 2.5 1.5 4 4 4M18 6h3v1c0 2.5-1.5 4-4 4"
      />
    </svg>
  )
}

function ChevronLeftIcon({ className }) {
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
        strokeLinejoin="round"
        d="M15 18l-6-6 6-6"
      />
    </svg>
  )
}

function ChevronRightIcon({ className }) {
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
        strokeLinejoin="round"
        d="M9 18l6-6-6-6"
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