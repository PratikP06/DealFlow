'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const emptyLine = {
  productId: '',
  quantity: 1,
  discountPercent: 0,
  subscriptionPlanId: '',
  lineType: 'ONE_TIME',
  isUpsellAdd: false,
}

export default function NewQuotationPage() {
  const router = useRouter()

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const [customerId, setCustomerId] = useState('')
  const [lines, setLines] = useState([{ ...emptyLine }])

  const [deliveryPromiseDate, setDeliveryPromiseDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [upsellSuggestions, setUpsellSuggestions] = useState([])
  const [loadingUpsells, setLoadingUpsells] = useState(false)

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customers, customerId]
  )

  useEffect(() => {
    async function loadData() {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch('/api/sales/customers'),
          fetch('/api/sales/products'),
        ])

        if (!customersRes.ok || !productsRes.ok) {
          if (customersRes.status === 401 || productsRes.status === 401) {
            router.push('/login')
            return
          }

          throw new Error('Failed to load quotation data')
        }

        const [customersData, productsData] = await Promise.all([
          customersRes.json(),
          productsRes.json(),
        ])

        setCustomers(Array.isArray(customersData) ? customersData : [])
        setProducts(Array.isArray(productsData) ? productsData : [])
      } catch (err) {
        console.error(err)
        setError('Unable to load customers and products.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  /*
   * Fetch upsell suggestions whenever the selected quotation
   * products change.
   */
  useEffect(() => {
    const triggerIds = [
      ...new Set(
        lines
          .map((line) => line.productId)
          .filter(Boolean)
      ),
    ]

    if (triggerIds.length === 0) {
      setUpsellSuggestions([])
      return
    }

    let cancelled = false

    async function loadUpsells() {
      setLoadingUpsells(true)

      try {
        const responses = await Promise.all(
          triggerIds.map((productId) =>
            fetch(
              `/api/sales/upsell-rules?triggerProductId=${encodeURIComponent(
                productId
              )}`
            )
          )
        )

        const results = []

        for (const response of responses) {
          if (!response.ok) continue

          const data = await response.json()

          if (Array.isArray(data)) {
            results.push(...data)
          }
        }

        if (cancelled) return

        /*
         * Remove duplicate suggestions while preserving
         * promoted/priority ordering from the API.
         */
        const unique = []
        const seen = new Set()

        for (const rule of results) {
          const product = rule.suggestedProduct

          if (!product || seen.has(product.id)) continue

          seen.add(product.id)

          unique.push(rule)
        }

        setUpsellSuggestions(unique.slice(0, 6))
      } catch (err) {
        console.error('Failed to load upsell suggestions:', err)

        if (!cancelled) {
          setUpsellSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setLoadingUpsells(false)
        }
      }
    }

    loadUpsells()

    return () => {
      cancelled = true
    }
  }, [lines])

  const getProductPrice = (product) => {
    if (!product) return 0

    if (
      selectedCustomer?.priceList &&
      Array.isArray(product.priceListItems)
    ) {
      const item = product.priceListItems.find(
        (priceListItem) =>
          priceListItem.priceListId === selectedCustomer.priceList.id
      )

      if (item) {
        return Number(item.price)
      }
    }

    return Number(product.price || 0)
  }

  const getAllowedDiscount = (product) => {
    if (!product) return 0

    const customerLimit = Number(
      selectedCustomer?.discountTierRule?.maxDiscountPercent || 0
    )

    const categoryLimit = Number(
      product.category?.discountCeilingPercent || 0
    )

    return Math.min(customerLimit, categoryLimit)
  }

  const calculatedLines = useMemo(() => {
    return lines.map((line) => {
      const product = products.find(
        (product) => product.id === line.productId
      )

      if (!product) {
        return {
          ...line,
          product: null,
          unitPrice: 0,
          subtotal: 0,
          discountAmount: 0,
          total: 0,
          allowedDiscount: 0,
          discountOverage: 0,
        }
      }

      const unitPrice = getProductPrice(product)
      const quantity = Math.max(Number(line.quantity) || 0, 0)
      const discount = Math.max(
        Number(line.discountPercent) || 0,
        0
      )

      const subtotal = unitPrice * quantity
      const discountAmount = subtotal * (discount / 100)
      const total = subtotal - discountAmount

      const allowedDiscount = getAllowedDiscount(product)
      const discountOverage = Math.max(
        discount - allowedDiscount,
        0
      )

      return {
        ...line,
        product,
        unitPrice,
        subtotal,
        discountAmount,
        total,
        allowedDiscount,
        discountOverage,
      }
    })
  }, [lines, products, selectedCustomer])

  const subtotal = calculatedLines.reduce(
    (sum, line) => sum + line.subtotal,
    0
  )

  const discountTotal = calculatedLines.reduce(
    (sum, line) => sum + line.discountAmount,
    0
  )

  const total = calculatedLines.reduce(
    (sum, line) => sum + line.total,
    0
  )

  const riskScore = calculatedLines.reduce(
    (sum, line) => sum + line.discountOverage,
    0
  )

  const hasDiscountRisk = riskScore > 0

  const hasInvalidLines = calculatedLines.some(
    (line) =>
      !line.product ||
      Number(line.quantity) <= 0
  )

  function updateLine(index, field, value) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, [field]: value }
          : line
      )
    )
  }

  function addLine(productId = '') {
    setLines((current) => [
      ...current,
      {
        ...emptyLine,
        productId,
      },
    ])
  }

  function removeLine(index) {
    setLines((current) => {
      if (current.length === 1) {
        return [{ ...emptyLine }]
      }

      return current.filter(
        (_, lineIndex) => lineIndex !== index
      )
    })
  }

  function addSuggestedProduct(product) {
    if (!product) return

    const alreadyAdded = lines.some(
      (line) => line.productId === product.id
    )

    if (alreadyAdded) {
      return
    }

    addLine(product.id)
  }

  async function saveQuotation(status) {
    setError('')

    if (!customerId) {
      setError('Please select a customer.')
      return
    }

    if (hasInvalidLines) {
      setError(
        'Please make sure every quotation line has a product and a quantity greater than zero.'
      )
      return
    }

    setSaving(true)

    try {
      const payload = {
        customerId,
        deliveryPromiseDate: deliveryPromiseDate || null,
        status,
        lines: calculatedLines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitPrice: line.unitPrice,
          discountPercent: Number(line.discountPercent) || 0,
          subscriptionPlanId:
            line.subscriptionPlanId || null,
          lineType: line.lineType || 'ONE_TIME',
          isUpsellAdd: Boolean(line.isUpsellAdd),
        })),
      }

      const response = await fetch('/api/sales/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to create quotation'
        )
      }

      router.push(
        `/dashboard/quotations/${data.id}`
      )
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Unable to create quotation.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2">
            <Link
              href="/dashboard/quotations"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-600)]"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Back to quotations
            </Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            New Quotation
          </h1>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Build a quotation, apply pricing, and submit it for approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/quotations"
            className="btn btn-secondary"
          >
            Cancel
          </Link>

          <button
            type="button"
            disabled={saving}
            onClick={() => saveQuotation('DRAFT')}
            className="btn btn-secondary"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => saveQuotation('PENDING_APPROVAL')}
            className="btn btn-primary"
          >
            <SendIcon className="h-4 w-4" />
            {saving ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-4 py-3 text-sm text-[var(--color-danger-700)]">
          <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer */}
      <section className="card">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Customer
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            Select the customer this quotation is for.
          </p>
        </div>

        <div className="p-5">
          <div className="max-w-xl">
            <label className="label" htmlFor="customer">
              Customer
            </label>

            <select
              id="customer"
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value)
              }}
              className="select"
            >
              <option value="">
                Select a customer...
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name} · {customer.tier}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InfoBox
                label="Customer tier"
                value={selectedCustomer.tier}
                tone="primary"
              />

              <InfoBox
                label="Maximum discount"
                value={`${Number(
                  selectedCustomer.discountTierRule?.maxDiscountPercent || 0
                )}%`}
                tone="neutral"
              />

              <InfoBox
                label="Price list"
                value={
                  selectedCustomer.priceList?.name ||
                  'Standard pricing'
                }
                tone="neutral"
              />
            </div>
          )}
        </div>
      </section>

      {/* Quotation lines */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Quotation Items
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              Add products and configure quantity and discounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => addLine()}
            className="btn btn-secondary btn-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </button>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {calculatedLines.map((line, index) => (
            <QuotationLine
              key={`${index}-${line.productId}`}
              line={line}
              index={index}
              products={products}
              onChange={updateLine}
              onRemove={removeLine}
            />
          ))}
        </div>
      </section>

      {/* Upsell */}
      {(upsellSuggestions.length > 0 || loadingUpsells) && (
        <section className="card">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-[var(--color-primary-600)]" />

              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Upsell & Cross-sell Suggestions
                </h2>

                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                  Recommended products based on the items in this quotation.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {loadingUpsells ? (
              <>
                <SuggestionSkeleton />
                <SuggestionSkeleton />
                <SuggestionSkeleton />
              </>
            ) : (
              upsellSuggestions.map((rule) => {
                const product = rule.suggestedProduct

                const alreadyAdded = lines.some(
                  (line) => line.productId === product?.id
                )

                return (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {product?.name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                          {product?.sku}
                        </p>
                      </div>

                      {rule.promoted && (
                        <span className="badge badge-info">
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {formatCurrency(
                          Number(product?.price || 0)
                        )}
                      </span>

                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() =>
                          addSuggestedProduct(product)
                        }
                        className="btn btn-secondary btn-sm"
                      >
                        {alreadyAdded ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5" />
                            Added
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Delivery
            </h2>
          </div>

          <div className="p-5">
            <label
              className="label"
              htmlFor="deliveryPromiseDate"
            >
              Promised delivery date
            </label>

            <input
              id="deliveryPromiseDate"
              type="date"
              value={deliveryPromiseDate}
              onChange={(event) =>
                setDeliveryPromiseDate(event.target.value)
              }
              className="input max-w-xs"
            />

            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              Optional. This can be updated later if needed.
            </p>
          </div>
        </section>

        <QuotationSummary
          subtotal={subtotal}
          discountTotal={discountTotal}
          total={total}
          riskScore={riskScore}
          hasDiscountRisk={hasDiscountRisk}
        />
      </div>
    </div>
  )
}

/* =========================================================
   Quotation Line
   ========================================================= */

function QuotationLine({
  line,
  index,
  products,
  onChange,
  onRemove,
}) {
  const selectedProduct = line.product

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-surface-tertiary)] text-xs font-semibold text-[var(--color-text-secondary)]">
            {index + 1}
          </span>

          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Product line
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="btn btn-ghost btn-sm text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)]"
        >
          <TrashIcon className="h-4 w-4" />
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_110px_140px_150px]">
        <div>
          <label
            className="label"
            htmlFor={`product-${index}`}
          >
            Product
          </label>

          <select
            id={`product-${index}`}
            value={line.productId}
            onChange={(event) =>
              onChange(
                index,
                'productId',
                event.target.value
              )
            }
            className="select"
          >
            <option value="">
              Select a product...
            </option>

            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
              >
                {product.name} · {product.sku}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {selectedProduct.category?.name}
              </span>

              <span className="text-[var(--color-border-strong)]">
                •
              </span>

              <span className="text-xs text-[var(--color-text-secondary)]">
                {formatCurrency(line.unitPrice)} /{' '}
                {selectedProduct.unit || 'unit'}
              </span>
            </div>
          )}
        </div>

        <div>
          <label
            className="label"
            htmlFor={`quantity-${index}`}
          >
            Quantity
          </label>

          <input
            id={`quantity-${index}`}
            type="number"
            min="0.01"
            step="0.01"
            value={line.quantity}
            onChange={(event) =>
              onChange(
                index,
                'quantity',
                event.target.value
              )
            }
            className="input"
          />
        </div>

        <div>
          <label
            className="label"
            htmlFor={`discount-${index}`}
          >
            Discount %
          </label>

          <input
            id={`discount-${index}`}
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={line.discountPercent}
            onChange={(event) =>
              onChange(
                index,
                'discountPercent',
                event.target.value
              )
            }
            className={`input ${
              line.discountOverage > 0
                ? 'border-[var(--color-danger-500)]'
                : ''
            }`}
          />
        </div>

        <div>
          <label
            className="label"
            htmlFor={`line-type-${index}`}
          >
            Billing
          </label>

          <select
            id={`line-type-${index}`}
            value={line.lineType}
            onChange={(event) =>
              onChange(
                index,
                'lineType',
                event.target.value
              )
            }
            className="select"
          >
            <option value="ONE_TIME">
              One-time
            </option>
            <option value="RECURRING">
              Recurring
            </option>
          </select>
        </div>
      </div>

      {line.lineType === 'RECURRING' &&
        selectedProduct?.subscriptionPlans?.length > 0 && (
          <div className="mt-4 max-w-md">
            <label
              className="label"
              htmlFor={`plan-${index}`}
            >
              Subscription plan
            </label>

            <select
              id={`plan-${index}`}
              value={line.subscriptionPlanId}
              onChange={(event) =>
                onChange(
                  index,
                  'subscriptionPlanId',
                  event.target.value
                )
              }
              className="select"
            >
              <option value="">
                Select a subscription plan...
              </option>

              {selectedProduct.subscriptionPlans.map(
                (plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name} ·{' '}
                    {formatCurrency(Number(plan.price))} /{' '}
                    {formatInterval(
                      plan.billingInterval
                    )}
                  </option>
                )
              )}
            </select>
          </div>
        )}

      {selectedProduct && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-[var(--color-surface-secondary)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)]">
              Allowed discount:
            </span>

            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              {line.allowedDiscount}%
            </span>

            {line.discountOverage > 0 ? (
              <span className="badge badge-danger">
                {line.discountOverage.toFixed(1)}% over limit
              </span>
            ) : (
              <span className="badge badge-success">
                Within limit
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-[var(--color-text-tertiary)]">
              Line total
            </span>

            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              {formatCurrency(line.total)}
            </p>
          </div>
        </div>
      )}

      {line.discountOverage > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--color-warning-100)] bg-[var(--color-warning-50)] px-3 py-2.5">
          <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-warning-600)]" />

          <p className="text-xs leading-5 text-[var(--color-warning-700)]">
            This discount exceeds the allowed limit for this customer/product combination.
            The quotation will carry approval risk.
          </p>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   Summary
   ========================================================= */

function QuotationSummary({
  subtotal,
  discountTotal,
  total,
  riskScore,
  hasDiscountRisk,
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Quotation Summary
        </h2>
      </div>

      <div className="space-y-3 p-5">
        <SummaryRow
          label="Subtotal"
          value={formatCurrency(subtotal)}
        />

        <SummaryRow
          label="Discount"
          value={`-${formatCurrency(discountTotal)}`}
          muted
        />

        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Estimated total
            </span>

            <span className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div
          className={`mt-4 rounded-lg border p-3 ${
            hasDiscountRisk
              ? 'border-[var(--color-danger-100)] bg-[var(--color-danger-50)]'
              : 'border-[var(--color-success-100)] bg-[var(--color-success-50)]'
          }`}
        >
          <div className="flex items-center gap-2">
            {hasDiscountRisk ? (
              <AlertIcon className="h-4 w-4 text-[var(--color-danger-600)]" />
            ) : (
              <CheckIcon className="h-4 w-4 text-[var(--color-success-600)]" />
            )}

            <span
              className={`text-xs font-semibold ${
                hasDiscountRisk
                  ? 'text-[var(--color-danger-700)]'
                  : 'text-[var(--color-success-700)]'
              }`}
            >
              {hasDiscountRisk
                ? 'Approval risk detected'
                : 'No discount risk detected'}
            </span>
          </div>

          <p
            className={`mt-1.5 text-xs leading-5 ${
              hasDiscountRisk
                ? 'text-[var(--color-danger-700)]'
                : 'text-[var(--color-success-700)]'
            }`}
          >
            {hasDiscountRisk
              ? `Current discount overage contributes ${riskScore.toFixed(
                  1
                )} risk points.`
              : 'All line discounts are within the applicable limits.'}
          </p>
        </div>
      </div>
    </section>
  )
}

function SummaryRow({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span
        className={
          muted
            ? 'text-[var(--color-text-secondary)]'
            : 'text-[var(--color-text-primary)]'
        }
      >
        {label}
      </span>

      <span className="font-medium text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  )
}

function InfoBox({ label, value, tone }) {
  const toneClasses = {
    primary:
      'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]',
    neutral:
      'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]',
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>

      <p
        className={`mt-1 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
          toneClasses[tone] || toneClasses.neutral
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function SuggestionSkeleton() {
  return (
    <div className="h-[118px] animate-pulse rounded-lg bg-[var(--color-surface-tertiary)]" />
  )
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-8 w-48 rounded bg-[var(--color-surface-tertiary)]" />
        <div className="h-4 w-80 rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      <div className="card h-40" />

      <div className="card h-72" />

      <div className="grid grid-cols-2 gap-6">
        <div className="card h-44" />
        <div className="card h-44" />
      </div>
    </div>
  )
}

/* =========================================================
   Helpers
   ========================================================= */

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatInterval(interval) {
  const labels = {
    MONTHLY: 'month',
    QUARTERLY: 'quarter',
    YEARLY: 'year',
  }

  return labels[interval] || interval?.toLowerCase() || 'period'
}

/* =========================================================
   Icons
   ========================================================= */

function PlusIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v14m7-7H5"
      />
    </svg>
  )
}

function ArrowLeftIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5m7-7l-7 7 7 7"
      />
    </svg>
  )
}

function SendIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4l16 8-16 8 3-8-3-8zm3 8h13"
      />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
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

function TrashIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 7h12m-9 0V5h6v2m-7 4v6m4-6v6m3-9l-.7 11.2a2 2 0 01-2 1.8H9.7a2 2 0 01-2-1.8L7 7"
      />
    </svg>
  )
}

function AlertIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
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

function SparklesIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3zm6 12l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15z"
      />
    </svg>
  )
}