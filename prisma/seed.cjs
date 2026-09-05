const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding DealFlow360...");

  const passwordHash = await bcrypt.hash("demo123", 10);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@dealflow360.com" },
    update: {},
    create: {
      email: "admin@dealflow360.com",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const salesRep = await prisma.user.upsert({
    where: { email: "sales@dealflow360.com" },
    update: {},
    create: {
      email: "sales@dealflow360.com",
      passwordHash,
      name: "Aarav Sharma",
      role: "SALES_REP",
    },
  });

  const salesManager = await prisma.user.upsert({
    where: { email: "manager@dealflow360.com" },
    update: {},
    create: {
      email: "manager@dealflow360.com",
      passwordHash,
      name: "Neha Kapoor",
      role: "SALES_MANAGER",
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: "finance@dealflow360.com" },
    update: {},
    create: {
      email: "finance@dealflow360.com",
      passwordHash,
      name: "Rahul Mehta",
      role: "FINANCE",
    },
  });

  console.log("Users created");

  // Customer discount tiers
  await prisma.discountTierRule.upsert({
    where: { tier: "BRONZE" },
    update: { maxDiscountPercent: 5 },
    create: {
      tier: "BRONZE",
      maxDiscountPercent: 5,
    },
  });

  await prisma.discountTierRule.upsert({
    where: { tier: "SILVER" },
    update: { maxDiscountPercent: 10 },
    create: {
      tier: "SILVER",
      maxDiscountPercent: 10,
    },
  });

  await prisma.discountTierRule.upsert({
    where: { tier: "GOLD" },
    update: { maxDiscountPercent: 15 },
    create: {
      tier: "GOLD",
      maxDiscountPercent: 15,
    },
  });

  console.log("Discount tiers created");

  // Categories
  const hardware = await prisma.category.upsert({
    where: { name: "Hardware" },
    update: { discountCeilingPercent: 15 },
    create: {
      name: "Hardware",
      discountCeilingPercent: 15,
    },
  });

  const services = await prisma.category.upsert({
    where: { name: "Services" },
    update: { discountCeilingPercent: 10 },
    create: {
      name: "Services",
      discountCeilingPercent: 10,
    },
  });

  const software = await prisma.category.upsert({
    where: { name: "Software" },
    update: { discountCeilingPercent: 12 },
    create: {
      name: "Software",
      discountCeilingPercent: 12,
    },
  });

  console.log("Categories created");

  // Products
  const laptop = await prisma.product.upsert({
    where: { sku: "HW-LAPTOP-001" },
    update: {},
    create: {
      sku: "HW-LAPTOP-001",
      name: "Business Laptop Pro",
      description: "High-performance business laptop",
      type: "PHYSICAL",
      categoryId: hardware.id,
      price: 85000,
      costPrice: 65000,
      marginPercent: 23.53,
      taxPercent: 18,
      unit: "unit",
    },
  });

  const monitor = await prisma.product.upsert({
    where: { sku: "HW-MONITOR-001" },
    update: {},
    create: {
      sku: "HW-MONITOR-001",
      name: "4K Business Monitor",
      description: "27-inch professional 4K monitor",
      type: "PHYSICAL",
      categoryId: hardware.id,
      price: 32000,
      costPrice: 23000,
      marginPercent: 28.13,
      taxPercent: 18,
      unit: "unit",
    },
  });

  const dockingStation = await prisma.product.upsert({
    where: { sku: "HW-DOCK-001" },
    update: {},
    create: {
      sku: "HW-DOCK-001",
      name: "USB-C Docking Station",
      description: "Enterprise USB-C docking station",
      type: "PHYSICAL",
      categoryId: hardware.id,
      price: 12000,
      costPrice: 7500,
      marginPercent: 37.5,
      taxPercent: 18,
      unit: "unit",
    },
  });

  const implementation = await prisma.product.upsert({
    where: { sku: "SRV-IMPLEMENT-001" },
    update: {},
    create: {
      sku: "SRV-IMPLEMENT-001",
      name: "Implementation Service",
      description: "Enterprise implementation and setup",
      type: "SERVICE",
      categoryId: services.id,
      price: 50000,
      costPrice: 30000,
      marginPercent: 40,
      taxPercent: 18,
      unit: "project",
    },
  });

  const support = await prisma.product.upsert({
    where: { sku: "SRV-SUPPORT-001" },
    update: {},
    create: {
      sku: "SRV-SUPPORT-001",
      name: "Premium Support",
      description: "Priority enterprise support",
      type: "SERVICE",
      categoryId: services.id,
      price: 18000,
      costPrice: 8000,
      marginPercent: 55.56,
      taxPercent: 18,
      unit: "month",
    },
  });

  const analytics = await prisma.product.upsert({
    where: { sku: "SW-ANALYTICS-001" },
    update: {},
    create: {
      sku: "SW-ANALYTICS-001",
      name: "Analytics Suite",
      description: "Enterprise analytics and reporting",
      type: "SERVICE",
      categoryId: software.id,
      price: 25000,
      costPrice: 10000,
      marginPercent: 60,
      taxPercent: 18,
      unit: "license",
    },
  });

  console.log("Products created");

  // Price list
  const enterprisePriceList = await prisma.priceList.upsert({
    where: { name: "Enterprise Price List" },
    update: {},
    create: {
      name: "Enterprise Price List",
      description: "Standard enterprise pricing",
    },
  });

  const priceListItems = [
    { productId: laptop.id, price: 82000 },
    { productId: monitor.id, price: 30500 },
    { productId: dockingStation.id, price: 11500 },
    { productId: implementation.id, price: 48000 },
    { productId: support.id, price: 17500 },
    { productId: analytics.id, price: 24000 },
  ];

  for (const item of priceListItems) {
    await prisma.priceListItem.upsert({
      where: {
        priceListId_productId: {
          priceListId: enterprisePriceList.id,
          productId: item.productId,
        },
      },
      update: {
        price: item.price,
      },
      create: {
        priceListId: enterprisePriceList.id,
        productId: item.productId,
        price: item.price,
      },
    });
  }

  console.log("Price list created");

  // Customers
  const acme = await prisma.customer.upsert({
    where: { email: "procurement@acme.com" },
    update: {},
    create: {
      name: "Acme Corporation",
      email: "procurement@acme.com",
      passwordHash,
      phone: "+91 98765 43210",
      tier: "GOLD",
      priceListId: enterprisePriceList.id,
    },
  });

  await prisma.customer.upsert({
    where: { email: "buying@beta.com" },
    update: {},
    create: {
      name: "Beta Industries",
      email: "buying@beta.com",
      passwordHash,
      phone: "+91 98765 12345",
      tier: "SILVER",
      priceListId: enterprisePriceList.id,
    },
  });

  await prisma.customer.upsert({
    where: { email: "admin@novatech.com" },
    update: {},
    create: {
      name: "NovaTech Solutions",
      email: "admin@novatech.com",
      passwordHash,
      phone: "+91 91234 56789",
      tier: "BRONZE",
      priceListId: enterprisePriceList.id,
    },
  });

  console.log("Customers created");

  // Warehouses
  const puneWarehouse = await prisma.warehouse.upsert({
    where: { name: "Pune Warehouse" },
    update: {
      shippingCostWeight: 1,
    },
    create: {
      name: "Pune Warehouse",
      location: "Pune, Maharashtra",
      shippingCostWeight: 1,
    },
  });

  const mumbaiWarehouse = await prisma.warehouse.upsert({
    where: { name: "Mumbai Warehouse" },
    update: {
      shippingCostWeight: 1.4,
    },
    create: {
      name: "Mumbai Warehouse",
      location: "Mumbai, Maharashtra",
      shippingCostWeight: 1.4,
    },
  });

  const bangaloreWarehouse = await prisma.warehouse.upsert({
    where: { name: "Bangalore Warehouse" },
    update: {
      shippingCostWeight: 2,
    },
    create: {
      name: "Bangalore Warehouse",
      location: "Bangalore, Karnataka",
      shippingCostWeight: 2,
    },
  });

  console.log("Warehouses created");

  // Warehouse stock
  const stock = [
    {
      warehouseId: puneWarehouse.id,
      productId: laptop.id,
      quantity: 5,
    },
    {
      warehouseId: puneWarehouse.id,
      productId: monitor.id,
      quantity: 8,
    },
    {
      warehouseId: puneWarehouse.id,
      productId: dockingStation.id,
      quantity: 15,
    },
    {
      warehouseId: mumbaiWarehouse.id,
      productId: laptop.id,
      quantity: 10,
    },
    {
      warehouseId: mumbaiWarehouse.id,
      productId: monitor.id,
      quantity: 4,
    },
    {
      warehouseId: mumbaiWarehouse.id,
      productId: dockingStation.id,
      quantity: 20,
    },
    {
      warehouseId: bangaloreWarehouse.id,
      productId: laptop.id,
      quantity: 6,
    },
    {
      warehouseId: bangaloreWarehouse.id,
      productId: monitor.id,
      quantity: 12,
    },
  ];

  for (const item of stock) {
    await prisma.warehouseStock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId: item.warehouseId,
          productId: item.productId,
        },
      },
      update: {
        quantity: item.quantity,
      },
      create: item,
    });
  }

  console.log("Warehouse stock created");

  // Subscription plans
  let carePlan = await prisma.subscriptionPlan.findFirst({
    where: {
      name: "Care Plan 2yr",
      productId: support.id,
    },
  });

  if (!carePlan) {
    carePlan = await prisma.subscriptionPlan.create({
      data: {
        name: "Care Plan 2yr",
        productId: support.id,
        price: 17500,
        billingInterval: "MONTHLY",
        durationMonths: 24,
        prorationEnabled: true,
        cancellationCreditEnabled: true,
      },
    });
  }

  let analyticsPlan = await prisma.subscriptionPlan.findFirst({
    where: {
      name: "Analytics Annual",
      productId: analytics.id,
    },
  });

  if (!analyticsPlan) {
    analyticsPlan = await prisma.subscriptionPlan.create({
      data: {
        name: "Analytics Annual",
        productId: analytics.id,
        price: 24000,
        billingInterval: "YEARLY",
        durationMonths: 12,
        prorationEnabled: true,
        cancellationCreditEnabled: true,
      },
    });
  }

  console.log("Subscription plans created");

  // Upsell rules
  const upsells = [
    {
      triggerProductId: laptop.id,
      suggestedProductId: dockingStation.id,
      promoted: true,
      priority: 100,
      minMarginPercent: 20,
    },
    {
      triggerProductId: laptop.id,
      suggestedProductId: monitor.id,
      promoted: true,
      priority: 90,
      minMarginPercent: 20,
    },
    {
      triggerProductId: implementation.id,
      suggestedProductId: support.id,
      promoted: true,
      priority: 80,
      minMarginPercent: 30,
    },
    {
      triggerProductId: laptop.id,
      suggestedProductId: analytics.id,
      promoted: false,
      priority: 40,
      minMarginPercent: 30,
    },
  ];

  for (const rule of upsells) {
    await prisma.upsellRule.upsert({
      where: {
        triggerProductId_suggestedProductId: {
          triggerProductId: rule.triggerProductId,
          suggestedProductId: rule.suggestedProductId,
        },
      },
      update: {
        promoted: rule.promoted,
        priority: rule.priority,
        minMarginPercent: rule.minMarginPercent,
        isActive: true,
      },
      create: rule,
    });
  }

  console.log("Upsell rules created");

  // Approval rules
  const approvalRules = [
    {
      name: "No Approval Required",
      minRiskScore: 0,
      maxRiskScore: 0,
      requiredRoles: [],
      priority: 100,
    },
    {
      name: "Sales Manager Approval",
      minRiskScore: 0.01,
      maxRiskScore: 8,
      requiredRoles: ["SALES_MANAGER"],
      priority: 90,
    },
    {
      name: "Manager + Finance Approval",
      minRiskScore: 8.01,
      maxRiskScore: null,
      requiredRoles: ["SALES_MANAGER", "FINANCE"],
      priority: 80,
    },
  ];

  for (const rule of approvalRules) {
    const existing = await prisma.approvalRule.findFirst({
      where: {
        name: rule.name,
      },
    });

    if (existing) {
      await prisma.approvalRule.update({
        where: {
          id: existing.id,
        },
        data: {
          minRiskScore: rule.minRiskScore,
          maxRiskScore: rule.maxRiskScore,
          requiredRoles: rule.requiredRoles,
          priority: rule.priority,
          isActive: true,
        },
      });
    } else {
      await prisma.approvalRule.create({
        data: {
          name: rule.name,
          minRiskScore: rule.minRiskScore,
          maxRiskScore: rule.maxRiskScore,
          requiredRoles: rule.requiredRoles,
          priority: rule.priority,
        },
      });
    }
  }

  console.log("Approval rules created");

  // Demo quotation
  const existingQuote = await prisma.quotation.findUnique({
    where: {
      quoteNumber: "Q-2026-DEMO-001",
    },
  });

  if (!existingQuote) {
    const quote = await prisma.quotation.create({
      data: {
        quoteNumber: "Q-2026-DEMO-001",
        customerId: acme.id,
        ownerId: salesRep.id,
        status: "DRAFT",
        blendedRiskScore: 8,
        approvalRound: 0,
        fulfillmentStatus: "PENDING",
        deliveryPromiseDate: new Date("2026-09-15"),
        lastActivityAt: new Date(),

        lines: {
          create: [
            {
              productId: laptop.id,
              lineType: "ONE_TIME",
              quantity: 5,
              unitPrice: 82000,
              discountPercent: 12,
              allowedDiscountPercentSnapshot: 15,
              discountOveragePercent: 0,
              taxPercentSnapshot: 18,
              marginPercentSnapshot: 23.53,
              isUpsellAdd: false,
            },
            {
              productId: implementation.id,
              lineType: "ONE_TIME",
              quantity: 1,
              unitPrice: 48000,
              discountPercent: 18,
              allowedDiscountPercentSnapshot: 10,
              discountOveragePercent: 8,
              taxPercentSnapshot: 18,
              marginPercentSnapshot: 40,
              isUpsellAdd: false,
            },
          ],
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        quotationId: quote.id,
        actorId: salesRep.id,
        action: "QUOTE_CREATED",
        entityType: "Quotation",
        entityId: quote.id,
        details: {
          source: "seed",
          demo: true,
        },
      },
    });

    console.log("Demo quotation created");
  } else {
    console.log("Demo quotation already exists");
  }

  console.log("");
  console.log("DealFlow360 seed complete.");
  console.log("");
  console.log("Demo accounts:");
  console.log("Admin:          admin@dealflow360.com / demo123");
  console.log("Sales Rep:      sales@dealflow360.com / demo123");
  console.log("Sales Manager:  manager@dealflow360.com / demo123");
  console.log("Finance:        finance@dealflow360.com / demo123");
  console.log("Customer:       procurement@acme.com / demo123");
  console.log("");
  console.log("Demo quote: Q-2026-DEMO-001");
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });