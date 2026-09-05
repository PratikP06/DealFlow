/**
 * DealFlow360 - Blended Risk Calculator
 *
 * Risk is calculated per quotation line:
 *
 * allowedDiscount = MIN(
 *   customer tier discount limit,
 *   product category discount ceiling
 * )
 *
 * overage = MAX(0, requested discount - allowed discount)
 *
 * blendedRiskScore = SUM(all line overages)
 *
 * Routing:
 *   0       -> no approval
 *   0-8     -> Sales Manager
 *   >8      -> Sales Manager + Finance
 */

import { prisma } from '@/lib/prisma'

/**
 * Get the maximum discount allowed for a customer's tier.
 */
export async function getCustomerDiscountLimit(tier) {
  if (!tier) return 0

  const rule = await prisma.discountTierRule.findUnique({
    where: {
      tier,
    },
  })

  return Number(rule?.maxDiscountPercent || 0)
}

/**
 * Calculate risk for a quotation.
 *
 * `lines` should contain:
 * {
 *   productId,
 *   discountPercent
 * }
 *
 * The product/category data is loaded from Prisma so the
 * calculation always uses the current backend rules.
 */
export async function calculateQuotationRisk(customerId, lines = []) {
  if (!customerId) {
    throw new Error('customerId is required')
  }

  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      tier: true,
    },
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  const customerLimit = await getCustomerDiscountLimit(
    customer.tier
  )

  const productIds = [
    ...new Set(
      lines
        .map((line) => line.productId)
        .filter(Boolean)
    ),
  ]

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      category: {
        select: {
          id: true,
          name: true,
          discountCeilingPercent: true,
        },
      },
    },
  })

  const productMap = new Map(
    products.map((product) => [
      product.id,
      product,
    ])
  )

  let blendedRiskScore = 0

  const calculatedLines = lines.map((line) => {
    const product = productMap.get(line.productId)

    const requestedDiscount = Number(
      line.discountPercent || 0
    )

    if (!product) {
      throw new Error(
        `Product not found: ${line.productId}`
      )
    }

    const categoryLimit = Number(
      product.category?.discountCeilingPercent || 0
    )

    const allowedDiscount = Math.min(
      customerLimit,
      categoryLimit
    )

    const discountOverage = Math.max(
      0,
      requestedDiscount - allowedDiscount
    )

    blendedRiskScore += discountOverage

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,

      requestedDiscount,

      customerDiscountLimit: customerLimit,

      categoryDiscountLimit: categoryLimit,

      allowedDiscount,

      discountOverage,

      isOverLimit: discountOverage > 0,
    }
  })

  /*
   * Approval routing.
   *
   * 0       = no approval
   * <= 8    = Sales Manager
   * > 8     = Sales Manager + Finance
   */
  let approvalRequired = false
  let requiredRoles = []

  if (blendedRiskScore > 0) {
    approvalRequired = true
    requiredRoles = ['SALES_MANAGER']

    if (blendedRiskScore > 8) {
      requiredRoles.push('FINANCE')
    }
  }

  return {
    customerId: customer.id,
    customerTier: customer.tier,

    customerDiscountLimit: customerLimit,

    blendedRiskScore: Number(
      blendedRiskScore.toFixed(2)
    ),

    approvalRequired,

    requiredRoles,

    lines: calculatedLines,
  }
}

/**
 * Calculate risk using already-loaded customer/product data.
 *
 * Useful on the client or server when the quotation page
 * already has all the required data.
 */
export function calculateRiskFromLines({
  customerDiscountLimit = 0,
  lines = [],
}) {
  let blendedRiskScore = 0

  const calculatedLines = lines.map((line) => {
    const requestedDiscount = Number(
      line.discountPercent || 0
    )

    const categoryLimit = Number(
      line.product?.category?.discountCeilingPercent || 0
    )

    const allowedDiscount = Math.min(
      Number(customerDiscountLimit),
      categoryLimit
    )

    const discountOverage = Math.max(
      0,
      requestedDiscount - allowedDiscount
    )

    blendedRiskScore += discountOverage

    return {
      ...line,

      requestedDiscount,

      customerDiscountLimit:
        Number(customerDiscountLimit),

      categoryDiscountLimit:
        categoryLimit,

      allowedDiscount,

      discountOverage,

      isOverLimit: discountOverage > 0,
    }
  })

  let approvalRequired = false
  let requiredRoles = []

  if (blendedRiskScore > 0) {
    approvalRequired = true
    requiredRoles = ['SALES_MANAGER']

    if (blendedRiskScore > 8) {
      requiredRoles.push('FINANCE')
    }
  }

  return {
    blendedRiskScore: Number(
      blendedRiskScore.toFixed(2)
    ),

    approvalRequired,

    requiredRoles,

    lines: calculatedLines,
  }
}

/**
 * Convert a risk score into a simple UI label.
 */
export function getRiskLevel(score) {
  const value = Number(score || 0)

  if (value === 0) {
    return 'LOW'
  }

  if (value <= 8) {
    return 'MEDIUM'
  }

  return 'HIGH'
}