const toNumber = (value) => Number(value || 0)

export function calculateFulfillmentAllocations(
  lines,
  warehouses
) {
  const allocations = []
  const lineSummaries = []

  const activeWarehouses = warehouses
    .filter((warehouse) => warehouse.isActive)
    .sort((a, b) => {
      const weight =
        toNumber(a.shippingCostWeight) -
        toNumber(b.shippingCostWeight)

      if (weight !== 0) {
        return weight
      }

      return a.name.localeCompare(b.name)
    })

  for (const line of lines) {
    const orderedQuantity = toNumber(
      line.quantity
    )

    // Services do not require warehouse inventory.
    if (line.product?.type === 'SERVICE') {
      lineSummaries.push({
        quotationLineId: line.id,
        productId: line.productId,
        productName:
          line.product?.name ||
          'Unknown Product',
        orderedQuantity,
        allocatedQuantity:
          orderedQuantity,
        backorderQuantity: 0,
        status: 'FULFILLED',
        allocations: [],
      })

      continue
    }

    let remaining = orderedQuantity
    const lineAllocations = []

    // Allocate from warehouses in shipping-cost priority order.
    for (const warehouse of activeWarehouses) {
      if (remaining <= 0) {
        break
      }

      const stock =
        warehouse.stock?.find(
          (item) =>
            item.productId ===
            line.productId
        )

      const available = toNumber(
        stock?.quantity
      )

      if (available <= 0) {
        continue
      }

      const allocated = Math.min(
        remaining,
        available
      )

      lineAllocations.push({
        quotationLineId: line.id,
        productId: line.productId,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        availableQuantity: available,
        allocatedQuantity: allocated,
        backorderQuantity: 0,
        status: 'ALLOCATED',
      })

      remaining -= allocated
    }

    // Anything still remaining becomes backorder.
    if (remaining > 0) {
      const backorderWarehouse =
        activeWarehouses.find(
          (warehouse) =>
            warehouse.stock?.some(
              (item) =>
                item.productId ===
                line.productId
            )
        ) ||
        activeWarehouses[0]

      if (backorderWarehouse) {
        lineAllocations.push({
          quotationLineId: line.id,
          productId: line.productId,
          warehouseId:
            backorderWarehouse.id,
          warehouseName:
            backorderWarehouse.name,
          availableQuantity: 0,
          allocatedQuantity: 0,
          backorderQuantity: remaining,
          status: 'BACKORDERED',
        })
      }
    }

    const allocatedQuantity =
      orderedQuantity - remaining

    let status = 'PENDING'

    if (remaining === 0) {
      status = 'ALLOCATED'
    } else if (allocatedQuantity > 0) {
      status = 'PARTIALLY_ALLOCATED'
    } else {
      status = 'BACKORDERED'
    }

    lineSummaries.push({
      quotationLineId: line.id,
      productId: line.productId,
      productName:
        line.product?.name ||
        'Unknown Product',
      orderedQuantity,
      allocatedQuantity,
      backorderQuantity: remaining,
      status,
      allocations: lineAllocations,
    })

    allocations.push(
      ...lineAllocations
    )
  }

  const totalOrdered =
    lineSummaries.reduce(
      (sum, line) =>
        sum + line.orderedQuantity,
      0
    )

  const totalAllocated =
    lineSummaries.reduce(
      (sum, line) =>
        sum + line.allocatedQuantity,
      0
    )

  const totalBackorder =
    lineSummaries.reduce(
      (sum, line) =>
        sum + line.backorderQuantity,
      0
    )

  let status = 'PENDING'

  if (
    totalBackorder > 0 &&
    totalAllocated > 0
  ) {
    status = 'PARTIALLY_ALLOCATED'
  } else if (
    totalBackorder > 0
  ) {
    status = 'BACKORDERED'
  } else if (
    totalOrdered > 0 &&
    totalAllocated >= totalOrdered
  ) {
    status = 'ALLOCATED'
  }

  return {
    status,
    totalOrdered,
    totalAllocated,
    totalBackorder,
    lineSummaries,
    allocations,
  }
}