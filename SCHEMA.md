# DealFlow360 Schema Reference

## User
Internal users and their roles. Used for authentication, ownership and authorization.

## Customer
B2B companies buying from the system. Has Bronze/Silver/Gold tier.

## DiscountTierRule
Defines maximum discount for each customer tier.
Seed: Bronze 5%, Silver 10%, Gold 15%.

## Category
Groups products and defines category-level discount ceiling.
Seed: Hardware 15%, Services 10%, Software 12%.

## Product
Sellable products/services. Stores SKU, price, cost, margin, tax, category and type.

## PriceList
Named collection of special prices.

## PriceListItem
Bridge between PriceList and Product. Stores the product's price under that price list.

## Warehouse
Physical fulfillment location and shipping-cost weighting.

## WarehouseStock
Stock quantity for a Product at a Warehouse.

## SubscriptionPlan
Recurring offering with price, billing interval, duration and proration/cancellation settings.
Example: Care Plan 2yr = 24 months duration + Monthly billing.

## UpsellRule
Deterministic trigger-product → suggested-product rule with active/promoted/priority/min-margin configuration.

## ApprovalRule
Maps risk-score ranges to required approval roles.
Seed:
- 0 = no approval
- 0.01–8 = Sales Manager
- >8 = Sales Manager + Finance

## Quotation
Central deal/quotation record. Connects customer, owner and downstream processes.
Important concepts include status, blended risk, fulfillment status, delivery date and lastActivityAt.

## QuotationLine
Individual product/service line. Stores quantity, price, discount, line type, subscription reference where applicable, discount snapshots/overage and upsell flag.

Core risk data:
allowedDiscount = MIN(customer tier max, category max)
overage = MAX(0, requested discount - allowed discount)
blended risk = SUM(line overages)

## ApprovalStep
Actual approval instance for a quotation and approval round. Stores role, status, approver, timestamps and reason.

ApprovalRule says what should happen; ApprovalStep records what happened.

## AuditLog
Chronological record of important business actions for traceability.

## FulfillmentAllocation
Records how quotation quantities are allocated across warehouses, including suggested split, shipping cost and backorder information.

## BillingScheduleEntry
Individual recurring billing event. Used to show next bills and a finite recurring schedule in the prototype.

## Invoice
Final bill generated for the customer. Can represent one-time or recurring billing.

## InvoiceLine
Individual item on an invoice.

## Payment
Money received against an invoice. Payment is manually recorded for the prototype.

## NegotiationRequest
Customer-requested change to a quotation, such as a counter-discount. Accepted changes can update a quotation line, recalculate risk and trigger another approval round.

## Relationship Mental Model

Customer
→ Quotation
→ QuotationLine
→ Product
→ Category

Customer tier
→ DiscountTierRule

PriceList
→ PriceListItem
→ Product

Warehouse
→ WarehouseStock
→ Product

Product
→ UpsellRule
→ suggested Product

Product
→ SubscriptionPlan

Quotation
→ ApprovalStep
→ AuditLog

Quotation
→ FulfillmentAllocation
→ Warehouse

Quotation
→ BillingScheduleEntry
→ Invoice
→ InvoiceLine
→ Payment

Quotation
→ NegotiationRequest

## Most Important Chain

Customer tier + Product category
→ allowed discount
→ discount overage
→ blended risk
→ ApprovalRule
→ ApprovalStep
→ approval/rejection

Negotiation
→ quotation line change
→ risk recalculation
→ possible new approval round
