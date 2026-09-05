'use client'

import { useEffect, useMemo, useState } from 'react'

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
  const [billingInterval, setBillingInterval] =
    useState('MONTHLY')
  const [durationMonths, setDurationMonths] =
    useState('12')
  const [prorationEnabled, setProrationEnabled] =
    useState(true)
  const [
    cancellationCreditEnabled,
    setCancellationCreditEnabled,
  ] = useState(true)
  const [isActive, setIsActive] =
    useState(true)

  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('ALL')
  const [intervalFilter, setIntervalFilter] =
    useState('ALL')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [plansRes, productsRes] =
        await Promise.all([
          fetch('/api/admin/subscription-plans'),
          fetch('/api/admin/products'),
        ])

      if (!plansRes.ok) {
        throw new Error(
          'Failed to load subscription plans'
        )
      }

      if (!productsRes.ok) {
        throw new Error(
          'Failed to load products'
        )
      }

      const plansData =
        await plansRes.json()

      const productsData =
        await productsRes.json()

      setPlans(
        Array.isArray(plansData)
          ? plansData
          : []
      )

      setProducts(
        Array.isArray(productsData)
          ? productsData
          : []
      )
    } catch (err) {
      console.error(
        'Subscription plan error:',
        err
      )

      setError(
        err.message ||
          'Failed to load subscription plans.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredPlans = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    return plans.filter((plan) => {
      const matchesSearch =
        !query ||
        String(plan.name || '')
          .toLowerCase()
          .includes(query) ||
        String(
          plan.product?.name || ''
        )
          .toLowerCase()
          .includes(query) ||
        String(
          plan.product?.sku || ''
        )
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' &&
          plan.isActive) ||
        (statusFilter === 'INACTIVE' &&
          !plan.isActive)

      const matchesInterval =
        intervalFilter === 'ALL' ||
        plan.billingInterval ===
          intervalFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesInterval
      )
    })
  }, [
    plans,
    search,
    statusFilter,
    intervalFilter,
  ])

  const activeCount = useMemo(
    () =>
      plans.filter(
        (plan) => plan.isActive
      ).length,
    [plans]
  )

  const inactiveCount = useMemo(
    () =>
      plans.filter(
        (plan) => !plan.isActive
      ).length,
    [plans]
  )

  const recurringCount = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.billingInterval
      ).length,
    [plans]
  )

  function openModal(plan = null) {
    setEditingPlan(plan)
    setFormError('')

    if (plan) {
      setName(plan.name || '')
      setProductId(plan.productId || '')
      setPrice(String(plan.price ?? ''))
      setBillingInterval(
        plan.billingInterval ||
          'MONTHLY'
      )
      setDurationMonths(
        String(
          plan.durationMonths ?? 12
        )
      )
      setProrationEnabled(
        Boolean(plan.prorationEnabled)
      )
      setCancellationCreditEnabled(
        Boolean(
          plan.cancellationCreditEnabled
        )
      )
      setIsActive(
        Boolean(plan.isActive)
      )
    } else {
      setName('')
      setProductId(
        products[0]?.id || ''
      )
      setPrice('')
      setBillingInterval('MONTHLY')
      setDurationMonths('12')
      setProrationEnabled(true)
      setCancellationCreditEnabled(
        true
      )
      setIsActive(true)
    }

    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingPlan(null)
    setFormError('')
  }

  async function savePlan(event) {
    event.preventDefault()
    setFormError('')

    const trimmedName = name.trim()
    const numericPrice = Number(price)
    const numericDuration =
      Number(durationMonths)

    if (!trimmedName) {
      setFormError(
        'Plan name is required.'
      )
      return
    }

    if (!productId) {
      setFormError(
        'Please select a product.'
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
      !Number.isFinite(numericDuration) ||
      numericDuration < 1
    ) {
      setFormError(
        'Duration must be at least 1 month.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        name: trimmedName,
        productId,
        price: numericPrice,
        billingInterval,
        durationMonths:
          numericDuration,
        prorationEnabled,
        cancellationCreditEnabled,
        isActive,
      }

      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : '/api/admin/subscription-plans'

      const res = await fetch(url, {
        method: editingPlan
          ? 'PUT'
          : 'POST',
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
            'Failed to save subscription plan'
        )
      }

      closeModal()
      await loadData()
    } catch (err) {
      setFormError(
        err.message ||
          'Failed to save subscription plan.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deletePlan(id) {
    if (
      !window.confirm(
        'Delete this subscription plan?'
      )
    ) {
      return
    }

    try {
      setDeletingId(id)

      const res = await fetch(
        `/api/admin/subscription-plans/${id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to delete subscription plan'
        )
      }

      await loadData()
    } catch (err) {
      window.alert(
        err.message ||
          'Failed to delete subscription plan.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <PlansSkeleton />
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
                  <RefreshIcon className="h-4 w-4" />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  Configuration / Billing
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Subscription Plans
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Configure recurring plans used by
                quotations, subscriptions, and
                billing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openModal()}
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add plan
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-4 py-3">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-600)]" />

            <div>
              <p className="text-xs font-semibold text-[var(--color-danger-700)]">
                Unable to load subscription plans
              </p>

              <p className="mt-0.5 text-xs text-[var(--color-danger-600)]">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={
              <PlansIcon className="h-5 w-5" />
            }
            label="Total plans"
            value={plans.length}
            description="Configured plans"
          />

          <StatCard
            icon={
              <CheckIcon className="h-5 w-5" />
            }
            label="Active"
            value={activeCount}
            description="Currently available"
          />

          <StatCard
            icon={
              <PauseIcon className="h-5 w-5" />
            }
            label="Inactive"
            value={inactiveCount}
            description="Not available"
          />

          <StatCard
            icon={
              <RefreshIcon className="h-5 w-5" />
            }
            label="Recurring"
            value={recurringCount}
            description="Billing schedules"
          />
        </section>

        {/* Main table */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Plan catalog
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {filteredPlans.length} of{' '}
                  {plans.length} plans shown
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
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
                    placeholder="Search plans..."
                    className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                >
                  <option value="ALL">
                    All statuses
                  </option>
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

                <select
                  value={intervalFilter}
                  onChange={(event) =>
                    setIntervalFilter(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                >
                  <option value="ALL">
                    All billing
                  </option>
                  <option value="MONTHLY">
                    Monthly
                  </option>
                  <option value="QUARTERLY">
                    Quarterly
                  </option>
                  <option value="YEARLY">
                    Yearly
                  </option>
                </select>
              </div>
            </div>
          </div>

          {filteredPlans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Plan
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Product
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Price
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Billing
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Duration
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Features
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlans.map(
                    (plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        deleting={
                          deletingId ===
                          plan.id
                        }
                        onEdit={() =>
                          openModal(plan)
                        }
                        onDelete={() =>
                          deletePlan(
                            plan.id
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
                statusFilter !== 'ALL' ||
                intervalFilter !== 'ALL'
              }
              onClear={() => {
                setSearch('')
                setStatusFilter('ALL')
                setIntervalFilter('ALL')
              }}
              onAdd={() => openModal()}
            />
          )}
        </section>

        {/* Billing explanation */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
              <InfoIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Subscription billing controls
              </p>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--color-text-secondary)]">
                Proration controls how mid-cycle
                changes are handled, while
                cancellation credit determines
                whether unused periods can generate
                credit.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          title={
            editingPlan
              ? 'Edit subscription plan'
              : 'Add subscription plan'
          }
          description={
            editingPlan
              ? 'Update the recurring billing configuration for this plan.'
              : 'Create a recurring plan that can be attached to products and quotations.'
          }
          onClose={closeModal}
        >
          <form
            onSubmit={savePlan}
            className="space-y-5"
          >
            {formError && (
              <FormError
                message={formError}
              />
            )}

            <FormField
              label="Plan name"
              htmlFor="plan-name"
              required
            >
              <input
                id="plan-name"
                required
                autoFocus
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="e.g. Care Plan 2yr"
                className="form-input"
              />
            </FormField>

            <FormField
              label="Product"
              htmlFor="plan-product"
              required
            >
              <select
                id="plan-product"
                required
                value={productId}
                onChange={(event) =>
                  setProductId(
                    event.target.value
                  )
                }
                className="form-input"
              >
                <option value="">
                  Select product
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} (
                      {product.sku})
                    </option>
                  )
                )}
              </select>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Price"
                htmlFor="plan-price"
                required
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-tertiary)]">
                    ₹
                  </span>

                  <input
                    id="plan-price"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(
                        event.target.value
                      )
                    }
                    placeholder="17500"
                    className="form-input pl-8"
                  />
                </div>
              </FormField>

              <FormField
                label="Billing interval"
                htmlFor="billing-interval"
                required
              >
                <select
                  id="billing-interval"
                  required
                  value={billingInterval}
                  onChange={(event) =>
                    setBillingInterval(
                      event.target.value
                    )
                  }
                  className="form-input"
                >
                  <option value="MONTHLY">
                    Monthly
                  </option>

                  <option value="QUARTERLY">
                    Quarterly
                  </option>

                  <option value="YEARLY">
                    Yearly
                  </option>
                </select>
              </FormField>
            </div>

            <FormField
              label="Duration"
              htmlFor="duration-months"
              required
            >
              <div className="relative">
                <input
                  id="duration-months"
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={durationMonths}
                  onChange={(event) =>
                    setDurationMonths(
                      event.target.value
                    )
                  }
                  placeholder="24"
                  className="form-input pr-20"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  months
                </span>
              </div>
            </FormField>

            {/* Options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                Billing options
              </p>

              <ToggleRow
                checked={
                  prorationEnabled
                }
                onChange={
                  setProrationEnabled
                }
                title="Enable proration"
                description="Allow mid-cycle plan or quantity changes to be prorated."
              />

              <ToggleRow
                checked={
                  cancellationCreditEnabled
                }
                onChange={
                  setCancellationCreditEnabled
                }
                title="Cancellation credit"
                description="Allow unused periods to generate a credit."
              />

              <ToggleRow
                checked={isActive}
                onChange={setIsActive}
                title="Active"
                description="Make this plan available for new subscriptions."
              />
            </div>

            {/* Preview */}
            <PlanPreview
              name={name}
              price={price}
              interval={
                billingInterval
              }
              duration={
                durationMonths
              }
              isActive={isActive}
            />

            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
              <button
                type="button"
                onClick={closeModal}
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
                  : editingPlan
                    ? 'Save changes'
                    : 'Create plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

/* =========================================================
   Plan Row
   ========================================================= */

function PlanRow({
  plan,
  deleting,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="group border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-secondary)]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
            <RefreshIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {plan.name}
            </p>

            <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
              Recurring plan
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {plan.product?.name ||
              'Unknown product'}
          </p>

          <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-tertiary)]">
            {plan.product?.sku ||
              '—'}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
          ₹
          {Number(
            plan.price || 0
          ).toLocaleString('en-IN')}
        </span>
      </td>

      <td className="px-5 py-4">
        <div>
          <span className="badge badge-neutral">
            {INTERVAL_LABELS[
              plan.billingInterval
            ] ||
              plan.billingInterval}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {plan.durationMonths}{' '}
          months
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {plan.prorationEnabled && (
            <span className="badge badge-neutral">
              Proration
            </span>
          )}

          {plan.cancellationCreditEnabled && (
            <span className="badge badge-neutral">
              Credit
            </span>
          )}

          {!plan.prorationEnabled &&
            !plan.cancellationCreditEnabled && (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                None
              </span>
            )}
        </div>
      </td>

      <td className="px-5 py-4">
        {plan.isActive ? (
          <span className="badge badge-success">
            Active
          </span>
        ) : (
          <span className="badge badge-neutral">
            Inactive
          </span>
        )}
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
   Toggle
   ========================================================= */

function ToggleRow({
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4 transition hover:border-[var(--color-primary-200)]">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--color-text-primary)]">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-tertiary)]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? 'bg-[var(--color-primary-600)]'
            : 'bg-[var(--color-surface-tertiary)]'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked
              ? 'left-6'
              : 'left-1'
          }`}
        />
      </button>
    </label>
  )
}

/* =========================================================
   Preview
   ========================================================= */

function PlanPreview({
  name,
  price,
  interval,
  duration,
  isActive,
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Preview
        </p>

        {isActive ? (
          <span className="badge badge-success">
            Active
          </span>
        ) : (
          <span className="badge badge-neutral">
            Inactive
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {name || 'Untitled plan'}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {INTERVAL_LABELS[
              interval
            ] || interval}{' '}
            · {duration || 0} months
          </p>
        </div>

        <p className="shrink-0 text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
          ₹
          {Number(
            price || 0
          ).toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   Modal
   ========================================================= */

function Modal({
  title,
  description,
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                <RefreshIcon className="h-4 w-4" />
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

/* =========================================================
   Helpers
   ========================================================= */

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
            <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
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
          <RefreshIcon className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
        {hasFilters
          ? 'No matching plans'
          : 'No subscription plans yet'}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
        {hasFilters
          ? 'Try changing the search or filters.'
          : 'Create a subscription plan to make recurring billing available.'}
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
          Add plan
        </button>
      )}
    </div>
  )
}

function PlansSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-4 w-[34rem] max-w-full rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-20 rounded-2xl bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="h-[500px] rounded-2xl bg-[var(--color-surface-tertiary)]" />
    </div>
  )
}

/* =========================================================
   Icons
   ========================================================= */

function RefreshIcon({
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
        d="M20 11a8.1 8.1 0 00-14.9-4M4 5v4h4"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 13a8.1 8.1 0 0014.9 4M20 19v-4h-4"
      />
    </svg>
  )
}

function PlansIcon({
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
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
      />

      <path
        strokeLinecap="round"
        d="M8 9h8M8 13h8M8 17h4"
      />
    </svg>
  )
}

function CheckIcon({
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
        strokeLinejoin="round"
        d="M5 12l4 4L19 6"
      />
    </svg>
  )
}

function PauseIcon({
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
      <rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="2"
      />

      <path
        strokeLinecap="round"
        d="M10 9v6M14 9v6"
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