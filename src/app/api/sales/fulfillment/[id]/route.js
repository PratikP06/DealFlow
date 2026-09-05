import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateFulfillmentAllocations } from '@/lib/fulfillment'

const APPROVED_QUOTE_STATUSES = [
  'APPROVED',
  'CONFIRMED',
]

const MUTATING_ROLES = [
  'FINANCE',
]

async function getInternalUser() {
  const session = await getSession()

  if (
    !session ||
    session.type !== 'internal'
  ) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },

      select: {
        id: true,
        role: true,
        name: true,
      },
    })

  if (
    !user ||
    user.role === 'ADMIN'
  ) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

function canAccessQuotation(
  user,
  quotation
) {
  if (
    user.role === 'SALES_MANAGER' ||
    user.role === 'FINANCE'
  ) {
    return true
  }

  return quotation.ownerId === user.id
}

function canMutateFulfillment(user) {
  return MUTATING_ROLES.includes(
    user.role
  )
}

function calculateTotals(
  lines,
  allocations
) {
  const physicalLines =
    lines.filter(
      (line) =>
        line.product?.type ===
        'PHYSICAL'
    )

  const totalOrdered =
    physicalLines.reduce(
      (sum, line) =>
        sum +
        Number(line.quantity || 0),
      0
    )

  const totalAllocated =
    allocations.reduce(
      (sum, allocation) =>
        sum +
        Number(
          allocation.allocatedQuantity ||
            0
        ),
      0
    )

  const totalBackorder =
    allocations.reduce(
      (sum, allocation) =>
        sum +
        Number(
          allocation.backorderQuantity ||
            0
        ),
      0
    )

  let status = 'PENDING'

  if (
    totalBackorder > 0 &&
    totalAllocated > 0
  ) {
    status =
      'PARTIALLY_ALLOCATED'
  } else if (
    totalBackorder > 0
  ) {
    status = 'BACKORDERED'
  } else if (
    totalOrdered > 0 &&
    totalAllocated >= totalOrdered
  ) {
    status = 'ALLOCATED'
  } else if (
    totalOrdered === 0
  ) {
    status = 'FULFILLED'
  }

  return {
    totalOrdered,
    totalAllocated,
    totalBackorder,
    status,
  }
}

function serializeSuggestion(
  suggestion
) {
  return {
    status: suggestion.status,

    totalOrdered:
      suggestion.totalOrdered,

    totalAllocated:
      suggestion.totalAllocated,

    totalBackorder:
      suggestion.totalBackorder,

    allocations:
      suggestion.allocations.map(
        (allocation) => ({
          quotationLineId:
            allocation.quotationLineId,

          productId:
            allocation.productId,

          warehouseId:
            allocation.warehouseId,

          warehouseName:
            allocation.warehouseName,

          availableQuantity:
            Number(
              allocation.availableQuantity ||
                0
            ),

          allocatedQuantity:
            Number(
              allocation.allocatedQuantity ||
                0
            ),

          backorderQuantity:
            Number(
              allocation.backorderQuantity ||
                0
            ),

          status:
            allocation.status,
        })
      ),
  }
}

async function loadQuotation(
  id,
  includeAudit = true
) {
  return prisma.quotation.findUnique({
    where: {
      id,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          tier: true,
        },
      },

      allocations: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },

        orderBy: {
          createdAt: 'asc',
        },
      },

      lines: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              type: true,
              unit: true,
            },
          },

          allocations: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },

            orderBy: {
              createdAt: 'asc',
            },
          },
        },

        orderBy: {
          createdAt: 'asc',
        },
      },

      ...(includeAudit
        ? {
            auditLogs: {
              where: {
                action: {
                  in: [
                    'FULFILLMENT_SPLIT_APPROVED',
                    'FULFILLMENT_MANUAL_OVERRIDE_APPROVED',
                    'BACKORDER_CONSOLIDATION_APPROVED',
                    'FULFILLMENT_COMPLETED',
                  ],
                },
              },

              include: {
                actor: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },

              orderBy: {
                createdAt: 'desc',
              },

              take: 20,
            },
          }
        : {}),
    },
  })
}

export async function GET(
  request,
  { params }
) {
  try {
    const auth =
      await getInternalUser()

    if (auth.error) {
      return auth.error
    }

    const { user } = auth
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Quotation ID is required',
        },
        { status: 400 }
      )
    }

    const quotation =
      await loadQuotation(id)

    if (!quotation) {
      return NextResponse.json(
        {
          error:
            'Quotation not found',
        },
        { status: 404 }
      )
    }

    if (
      !canAccessQuotation(
        user,
        quotation
      )
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (
      !APPROVED_QUOTE_STATUSES.includes(
        quotation.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Fulfillment is available only for approved or confirmed quotations',
        },
        { status: 400 }
      )
    }

    const warehouses =
      await prisma.warehouse.findMany({
        where: {
          isActive: true,
        },

        include: {
          stock: true,
        },

        orderBy: {
          shippingCostWeight: 'asc',
        },
      })

    const physicalLines =
      quotation.lines.filter(
        (line) =>
          line.product?.type ===
          'PHYSICAL'
      )

    const hasExistingAllocations =
      quotation.allocations?.length > 0

    const remainingLines =
      physicalLines
        .map((line) => {
          const allocated =
            (line.allocations || []).reduce(
              (sum, allocation) =>
                sum +
                Number(
                  allocation.allocatedQuantity ||
                    0
                ),
              0
            )

          return {
            ...line,

            quantity: Math.max(
              0,
              Number(
                line.quantity || 0
              ) - allocated
            ),
          }
        })

        .filter(
          (line) =>
            Number(line.quantity) > 0
        )

    const suggestion =
      remainingLines.length > 0
        ? calculateFulfillmentAllocations(
            remainingLines,
            warehouses
          )
        : {
            status:
              quotation.fulfillmentStatus,

            totalOrdered: 0,
            totalAllocated: 0,
            totalBackorder: 0,

            allocations: [],
          }

    const total =
      calculateTotals(
        quotation.lines,
        quotation.allocations || []
      )

    return NextResponse.json({
      ...quotation,

      workflow: {
        authorityRole:
          'FINANCE',

        authorityLabel:
          'Finance / Operations',

        currentUserRole:
          user.role,

        canApprove:
          canMutateFulfillment(
            user
          ),

        canManualOverride:
          canMutateFulfillment(
            user
          ),

        canConsolidateBackorder:
          canMutateFulfillment(
            user
          ),

        canMarkFulfilled:
          canMutateFulfillment(
            user
          ),

        salesRepMonitoringOnly:
          user.role ===
          'SALES_REP',

        allocationApprovalRequired:
          !hasExistingAllocations &&
          total.totalOrdered > 0,
      },

      suggestedSplit:
        serializeSuggestion(
          suggestion
        ),

      warehouseOptions:
        warehouses.map(
          (warehouse) => ({
            id: warehouse.id,
            name: warehouse.name,
            location:
              warehouse.location,

            shippingCostWeight:
              Number(
                warehouse.shippingCostWeight ||
                  0
              ),

            stock:
              warehouse.stock.map(
                (item) => ({
                  productId:
                    item.productId,

                  quantity:
                    Number(
                      item.quantity || 0
                    ),
                })
              ),
          })
        ),

      totals: total,
    })
  } catch (error) {
    console.error(
      'Fulfillment detail error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to fetch fulfillment detail',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request,
  { params }
) {
  try {
    const auth =
      await getInternalUser()

    if (auth.error) {
      return auth.error
    }

    const { user } = auth
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Quotation ID is required',
        },
        { status: 400 }
      )
    }

    const body =
      await request
        .json()
        .catch(() => ({}))

    const action = body?.action

    if (
      ![
        'ACCEPT_SUGGESTED_SPLIT',
        'MANUAL_OVERRIDE',
        'CONSOLIDATE_BACKORDER',
        'MARK_FULFILLED',
      ].includes(action)
    ) {
      return NextResponse.json(
        {
          error:
            'Unsupported fulfillment action',
        },
        { status: 400 }
      )
    }

    /*
     * IMPORTANT:
     *
     * Only FINANCE can mutate fulfillment.
     * Sales Rep and Sales Manager are monitoring-only
     * for warehouse allocation.
     */
    if (
      !canMutateFulfillment(user)
    ) {
      return NextResponse.json(
        {
          error:
            'Finance / Operations authority is required to approve or change fulfillment allocation',
        },
        { status: 403 }
      )
    }

    const quotation =
      await loadQuotation(
        id,
        false
      )

    if (!quotation) {
      return NextResponse.json(
        {
          error:
            'Quotation not found',
        },
        { status: 404 }
      )
    }

    if (
      !canAccessQuotation(
        user,
        quotation
      )
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (
      !APPROVED_QUOTE_STATUSES.includes(
        quotation.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Fulfillment is available only for approved or confirmed quotations',
        },
        { status: 400 }
      )
    }

    if (
      action === 'MARK_FULFILLED'
    ) {
      return await markFulfilled(
        id,
        user
      )
    }

    if (
      action ===
      'CONSOLIDATE_BACKORDER'
    ) {
      return await consolidateBackorder(
        id,
        user
      )
    }

    return await approveInitialAllocation({
      id,
      user,
      action,
      requestedAllocations:
        body.allocations,
    })
  } catch (error) {
    console.error(
      'Fulfillment action error:',
      error
    )

    const message =
      error?.message ||
      'Failed to execute fulfillment action'

    const status =
      /already|exists|insufficient|cannot|must|requires|invalid|exceeds|no remaining/i.test(
        message
      )
        ? 409
        : 500

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    )
  }
}

async function approveInitialAllocation({
  id,
  user,
  action,
  requestedAllocations,
}) {
  const updated =
    await prisma.$transaction(
      async (tx) => {
        const quotation =
          await tx.quotation.findUnique(
            {
              where: {
                id,
              },

              include: {
                lines: {
                  include: {
                    product: true,
                  },
                },

                allocations: true,
              },
            }
          )

        if (!quotation) {
          throw new Error(
            'Quotation not found'
          )
        }

        if (
          quotation.allocations.length >
          0
        ) {
          throw new Error(
            'Fulfillment allocation already exists. Use backorder consolidation for remaining quantities.'
          )
        }

        const warehouses =
          await tx.warehouse.findMany({
            where: {
              isActive: true,
            },

            include: {
              stock: true,
            },

            orderBy: {
              shippingCostWeight:
                'asc',
            },
          })

        if (
          warehouses.length === 0
        ) {
          throw new Error(
            'No active warehouse is available for fulfillment'
          )
        }

        /*
         * Server calculates the suggestion again.
         *
         * Never trust the browser's suggested
         * quantities.
         */
        const calculated =
          action ===
          'ACCEPT_SUGGESTED_SPLIT'
            ? calculateFulfillmentAllocations(
                quotation.lines,
                warehouses
              )
            : validateManualOverride(
                requestedAllocations,
                quotation.lines,
                warehouses
              )

        /*
         * Reserve stock atomically.
         */
        for (
          const allocation of
            calculated.allocations
        ) {
          const allocatedQuantity =
            Number(
              allocation.allocatedQuantity ||
                0
            )

          const backorderQuantity =
            Number(
              allocation.backorderQuantity ||
                0
            )

          if (
            allocatedQuantity <= 0 &&
            backorderQuantity <= 0
          ) {
            continue
          }

          /*
           * Backorders never consume stock.
           */
          if (
            allocatedQuantity > 0
          ) {
            const stockUpdate =
              await tx.warehouseStock.updateMany(
                {
                  where: {
                    warehouseId:
                      allocation.warehouseId,

                    productId:
                      allocation.productId,

                    quantity: {
                      gte: allocatedQuantity,
                    },
                  },

                  data: {
                    quantity: {
                      decrement:
                        allocatedQuantity,
                    },
                  },
                }
              )

            if (
              stockUpdate.count !== 1
            ) {
              throw new Error(
                `Insufficient stock for ${allocation.warehouseName}`
              )
            }
          }

          await tx.fulfillmentAllocation.create(
            {
              data: {
                quotationId:
                  id,

                quotationLineId:
                  allocation.quotationLineId,

                warehouseId:
                  allocation.warehouseId,

                allocatedQuantity,

                backorderQuantity,

                estimatedShippingCost:
                  0,

                manualOverride:
                  action ===
                  'MANUAL_OVERRIDE',

                status:
                  backorderQuantity > 0
                    ? allocatedQuantity >
                      0
                      ? 'PARTIALLY_ALLOCATED'
                      : 'BACKORDERED'
                    : 'ALLOCATED',
              },
            }
          )
        }

        const status =
          calculated.totalOrdered ===
          0
            ? 'FULFILLED'
            : calculated.status

        await tx.quotation.update({
          where: {
            id,
          },

          data: {
            fulfillmentStatus:
              status,

            lastActivityAt:
              new Date(),
          },
        })

        await tx.auditLog.create({
          data: {
            quotationId: id,
            actorId: user.id,

            action:
              action ===
              'MANUAL_OVERRIDE'
                ? 'FULFILLMENT_MANUAL_OVERRIDE_APPROVED'
                : 'FULFILLMENT_SPLIT_APPROVED',

            entityType:
              'Quotation',

            entityId: id,

            details: {
              authority:
                'FINANCE',

              fulfillmentStatus:
                status,

              totalOrdered:
                calculated.totalOrdered,

              totalAllocated:
                calculated.totalAllocated,

              totalBackorder:
                calculated.totalBackorder,

              allocationCount:
                calculated.allocations
                  .length,

              manualOverride:
                action ===
                'MANUAL_OVERRIDE',
            },
          },
        })

        return tx.quotation.findUnique(
          {
            where: {
              id,
            },

            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                },
              },

              lines: {
                include: {
                  product: {
                    select: {
                      id: true,
                      sku: true,
                      name: true,
                      type: true,
                      unit: true,
                    },
                  },

                  allocations: {
                    include: {
                      warehouse: {
                        select: {
                          id: true,
                          name: true,
                          location: true,
                        },
                      },
                    },

                    orderBy: {
                      createdAt: 'asc',
                    },
                  },
                },

                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          }
        )
      }
    )

  return NextResponse.json({
    success: true,
    action,
    quotation: updated,
  })
}

async function consolidateBackorder(
  id,
  user
) {
  const updated =
    await prisma.$transaction(
      async (tx) => {
        const quotation =
          await tx.quotation.findUnique(
            {
              where: {
                id,
              },

              include: {
                lines: {
                  include: {
                    product: true,
                  },
                },

                allocations: true,
              },
            }
          )

        if (!quotation) {
          throw new Error(
            'Quotation not found'
          )
        }

        if (
          ![
            'PARTIALLY_ALLOCATED',
            'BACKORDERED',
          ].includes(
            quotation.fulfillmentStatus
          )
        ) {
          throw new Error(
            'There is no remaining backorder to consolidate'
          )
        }

        const warehouses =
          await tx.warehouse.findMany({
            where: {
              isActive: true,
            },

            include: {
              stock: true,
            },

            orderBy: {
              shippingCostWeight:
                'asc',
            },
          })

        if (
          warehouses.length === 0
        ) {
          throw new Error(
            'No active warehouse is available for backorder consolidation'
          )
        }

        const remainingLines =
          quotation.lines
            .filter(
              (line) =>
                line.product?.type ===
                'PHYSICAL'
            )

            .map((line) => {
              const allocated =
                quotation.allocations
                  .filter(
                    (allocation) =>
                      allocation.quotationLineId ===
                      line.id
                  )

                  .reduce(
                    (sum, allocation) =>
                      sum +
                      Number(
                        allocation.allocatedQuantity ||
                          0
                      ),
                    0
                  )

              return {
                ...line,

                quantity:
                  Math.max(
                    0,
                    Number(
                      line.quantity || 0
                    ) - allocated
                  ),
              }
            })

            .filter(
              (line) =>
                Number(line.quantity) >
                0
            )

        if (
          remainingLines.length === 0
        ) {
          throw new Error(
            'No remaining backorder quantities'
          )
        }

        const suggestion =
          calculateFulfillmentAllocations(
            remainingLines,
            warehouses
          )

        /*
         * Reserve newly available stock.
         */
        for (
          const allocation of
            suggestion.allocations
        ) {
          const allocatedQuantity =
            Number(
              allocation.allocatedQuantity ||
                0
            )

          if (
            allocatedQuantity <= 0
          ) {
            continue
          }

          const stockUpdate =
            await tx.warehouseStock.updateMany(
              {
                where: {
                  warehouseId:
                    allocation.warehouseId,

                  productId:
                    allocation.productId,

                  quantity: {
                    gte: allocatedQuantity,
                  },
                },

                data: {
                  quantity: {
                    decrement:
                      allocatedQuantity,
                  },
                },
              }
            )

          if (
            stockUpdate.count !== 1
          ) {
            throw new Error(
              `Insufficient stock in ${allocation.warehouseName}`
            )
          }

          await tx.fulfillmentAllocation.create(
            {
              data: {
                quotationId: id,

                quotationLineId:
                  allocation.quotationLineId,

                warehouseId:
                  allocation.warehouseId,

                allocatedQuantity,

                backorderQuantity:
                  0,

                estimatedShippingCost:
                  0,

                manualOverride:
                  false,

                status:
                  'ALLOCATED',
              },
            }
          )
        }

        /*
         * Reduce existing backorder rows.
         */
        for (
          const line of remainingLines
        ) {
          let leftToRemove =
            suggestion.allocations
              .filter(
                (allocation) =>
                  allocation.quotationLineId ===
                  line.id
              )
              .reduce(
                (sum, allocation) =>
                  sum +
                  Number(
                    allocation.allocatedQuantity ||
                      0
                  ),
                0
              )

          if (
            leftToRemove <= 0
          ) {
            continue
          }

          const backorderRows =
            await tx.fulfillmentAllocation.findMany(
              {
                where: {
                  quotationId: id,

                  quotationLineId:
                    line.id,

                  backorderQuantity: {
                    gt: 0,
                  },
                },

                orderBy: {
                  createdAt: 'asc',
                },
              }
            )

          for (
            const row of
              backorderRows
          ) {
            if (
              leftToRemove <= 0
            ) {
              break
            }

            const currentBackorder =
              Number(
                row.backorderQuantity ||
                  0
              )

            const reduction =
              Math.min(
                currentBackorder,
                leftToRemove
              )

            const newBackorder =
              currentBackorder -
              reduction

            await tx.fulfillmentAllocation.update(
              {
                where: {
                  id: row.id,
                },

                data: {
                  backorderQuantity:
                    newBackorder,

                  status:
                    newBackorder > 0
                      ? row.allocatedQuantity >
                        0
                        ? 'PARTIALLY_ALLOCATED'
                        : 'BACKORDERED'
                      : row.allocatedQuantity >
                        0
                      ? 'PARTIALLY_ALLOCATED'
                      : 'ALLOCATED',
                },
              }
            )

            leftToRemove -=
              reduction
          }
        }

        const allAllocations =
          await tx.fulfillmentAllocation.findMany(
            {
              where: {
                quotationId: id,
              },
            }
          )

        const totals =
          calculateTotals(
            quotation.lines,
            allAllocations
          )

        await tx.quotation.update({
          where: {
            id,
          },

          data: {
            fulfillmentStatus:
              totals.status,

            lastActivityAt:
              new Date(),
          },
        })

        await tx.auditLog.create({
          data: {
            quotationId: id,
            actorId: user.id,

            action:
              'BACKORDER_CONSOLIDATION_APPROVED',

            entityType:
              'Quotation',

            entityId: id,

            details: {
              authority:
                'FINANCE',

              newlyAllocated:
                suggestion.totalAllocated,

              remainingBackorder:
                totals.totalBackorder,

              fulfillmentStatus:
                totals.status,
            },
          },
        })

        return tx.quotation.findUnique(
          {
            where: {
              id,
            },

            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                },
              },

              lines: {
                include: {
                  product: {
                    select: {
                      id: true,
                      sku: true,
                      name: true,
                      type: true,
                      unit: true,
                    },
                  },

                  allocations: {
                    include: {
                      warehouse: {
                        select: {
                          id: true,
                          name: true,
                          location: true,
                        },
                      },
                    },

                    orderBy: {
                      createdAt: 'asc',
                    },
                  },
                },

                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          }
        )
      }
    )

  return NextResponse.json({
    success: true,

    action:
      'CONSOLIDATE_BACKORDER',

    quotation: updated,
  })
}

async function markFulfilled(
  id,
  user
) {
  const updated =
    await prisma.$transaction(
      async (tx) => {
        const quotation =
          await tx.quotation.findUnique(
            {
              where: {
                id,
              },

              include: {
                lines: {
                  include: {
                    product: true,
                  },
                },

                allocations: true,
              },
            }
          )

        if (!quotation) {
          throw new Error(
            'Quotation not found'
          )
        }

        const totals =
          calculateTotals(
            quotation.lines,
            quotation.allocations
          )

        /*
         * Service-only quote.
         */
        if (
          totals.totalOrdered === 0
        ) {
          await tx.quotation.update(
            {
              where: {
                id,
              },

              data: {
                fulfillmentStatus:
                  'FULFILLED',

                lastActivityAt:
                  new Date(),
              },
            }
          )
        } else {
          if (
            totals.totalAllocated <
            totals.totalOrdered
          ) {
            throw new Error(
              'Quotation cannot be marked fulfilled while physical units remain unallocated'
            )
          }

          if (
            totals.totalBackorder >
            0
          ) {
            throw new Error(
              'Quotation cannot be marked fulfilled while backorders remain'
            )
          }

          if (
            quotation.fulfillmentStatus !==
            'ALLOCATED'
          ) {
            throw new Error(
              'Quotation must be fully allocated before it can be fulfilled'
            )
          }

          await tx.fulfillmentAllocation.updateMany(
            {
              where: {
                quotationId: id,

                status:
                  'ALLOCATED',

                allocatedQuantity: {
                  gt: 0,
                },
              },

              data: {
                status:
                  'FULFILLED',
              },
            }
          )

          await tx.quotation.update({
            where: {
              id,
            },

            data: {
              fulfillmentStatus:
                'FULFILLED',

              lastActivityAt:
                new Date(),
            },
          })
        }

        await tx.auditLog.create({
          data: {
            quotationId: id,
            actorId: user.id,

            action:
              'FULFILLMENT_COMPLETED',

            entityType:
              'Quotation',

            entityId: id,

            details: {
              authority:
                'FINANCE',

              totalOrdered:
                totals.totalOrdered,

              totalAllocated:
                totals.totalAllocated,
            },
          },
        })

        return tx.quotation.findUnique(
          {
            where: {
              id,
            },

            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                },
              },

              lines: {
                include: {
                  product: {
                    select: {
                      id: true,
                      sku: true,
                      name: true,
                      type: true,
                      unit: true,
                    },
                  },

                  allocations: {
                    include: {
                      warehouse: {
                        select: {
                          id: true,
                          name: true,
                          location: true,
                        },
                      },
                    },

                    orderBy: {
                      createdAt: 'asc',
                    },
                  },
                },

                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          }
        )
      }
    )

  return NextResponse.json({
    success: true,

    action:
      'MARK_FULFILLED',

    quotation: updated,
  })
}

function validateManualOverride(
  requestedAllocations,
  lines,
  warehouses
) {
  if (
    !Array.isArray(
      requestedAllocations
    ) ||
    requestedAllocations.length === 0
  ) {
    throw new Error(
      'Manual override requires allocations'
    )
  }

  const lineMap =
    new Map(
      lines.map((line) => [
        line.id,
        line,
      ])
    )

  const warehouseMap =
    new Map(
      warehouses.map(
        (warehouse) => [
          warehouse.id,
          warehouse,
        ]
      )
    )

  const usedByStockKey =
    new Map()

  const allocations = []

  for (
    const requested of
      requestedAllocations
  ) {
    const line =
      lineMap.get(
        requested?.quotationLineId
      )

    if (!line) {
      throw new Error(
        'Invalid quotation line in manual override'
      )
    }

    if (
      line.product?.type ===
      'SERVICE'
    ) {
      throw new Error(
        'Services cannot be allocated to warehouses'
      )
    }

    const warehouse =
      warehouseMap.get(
        requested?.warehouseId
      )

    if (!warehouse) {
      throw new Error(
        'Invalid or inactive warehouse'
      )
    }

    const allocatedQuantity =
      Number(
        requested?.allocatedQuantity ||
          0
      )

    const backorderQuantity =
      Number(
        requested?.backorderQuantity ||
          0
      )

    if (
      !Number.isFinite(
        allocatedQuantity
      ) ||
      !Number.isFinite(
        backorderQuantity
      ) ||
      allocatedQuantity < 0 ||
      backorderQuantity < 0
    ) {
      throw new Error(
        'Invalid allocation quantity'
      )
    }

    if (
      allocatedQuantity === 0 &&
      backorderQuantity === 0
    ) {
      continue
    }

    const stock =
      warehouse.stock.find(
        (item) =>
          item.productId ===
          line.productId
      )

    const available =
      Number(
        stock?.quantity || 0
      )

    const stockKey =
      `${warehouse.id}:${line.productId}`

    const alreadyUsed =
      Number(
        usedByStockKey.get(
          stockKey
        ) || 0
      )

    if (
      allocatedQuantity >
      available - alreadyUsed
    ) {
      throw new Error(
        `Manual allocation exceeds available stock in ${warehouse.name}`
      )
    }

    usedByStockKey.set(
      stockKey,
      alreadyUsed +
        allocatedQuantity
    )

    allocations.push({
      quotationLineId:
        line.id,

      productId:
        line.productId,

      warehouseId:
        warehouse.id,

      warehouseName:
        warehouse.name,

      allocatedQuantity,

      backorderQuantity,

      status:
        backorderQuantity > 0
          ? allocatedQuantity > 0
            ? 'PARTIALLY_ALLOCATED'
            : 'BACKORDERED'
          : 'ALLOCATED',
    })
  }

  /*
   * Every physical line must be
   * completely accounted for.
   */
  for (
    const line of lines
  ) {
    if (
      line.product?.type ===
      'SERVICE'
    ) {
      continue
    }

    const ordered =
      Number(line.quantity || 0)

    const allocated =
      allocations
        .filter(
          (item) =>
            item.quotationLineId ===
            line.id
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.allocatedQuantity ||
                0
            ),
          0
        )

    const backordered =
      allocations
        .filter(
          (item) =>
            item.quotationLineId ===
            line.id
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.backorderQuantity ||
                0
            ),
          0
        )

    if (
      Math.abs(
        allocated +
          backordered -
          ordered
      ) > 0.000001
    ) {
      throw new Error(
        `Manual allocation for ${line.product?.name || 'product'} must account for the full ordered quantity`
      )
    }
  }

  const totalOrdered =
    lines
      .filter(
        (line) =>
          line.product?.type ===
          'PHYSICAL'
      )
      .reduce(
        (sum, line) =>
          sum +
          Number(
            line.quantity || 0
          ),
        0
      )

  const totalAllocated =
    allocations.reduce(
      (sum, item) =>
        sum +
        Number(
          item.allocatedQuantity ||
            0
        ),
      0
    )

  const totalBackorder =
    allocations.reduce(
      (sum, item) =>
        sum +
        Number(
          item.backorderQuantity ||
            0
        ),
      0
    )

  let status = 'PENDING'

  if (
    totalBackorder > 0 &&
    totalAllocated > 0
  ) {
    status =
      'PARTIALLY_ALLOCATED'
  } else if (
    totalBackorder > 0
  ) {
    status = 'BACKORDERED'
  } else if (
    totalOrdered === 0
  ) {
    status = 'FULFILLED'
  } else if (
    totalAllocated >=
    totalOrdered
  ) {
    status = 'ALLOCATED'
  }

  return {
    status,
    totalOrdered,
    totalAllocated,
    totalBackorder,
    allocations,
  }
}