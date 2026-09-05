# AGENTS.md

## Project
DealFlow360 is a B2B sales operations platform for an Odoo hackathon.

## Mission
Build a working, demo-ready prototype that manages a B2B deal end-to-end:

Quotation → Risk Evaluation → Approval → Upsell → Fulfillment → Billing → Customer Negotiation → Re-approval → Invoice → Payment

The product's main differentiator is the **self-governing deal engine**: important deal changes trigger explainable business-rule evaluation and automatically determine the next action.

## Tech Stack
- Next.js
- JavaScript (no TypeScript unless absolutely unavoidable)
- Node.js / Next.js Route Handlers
- PostgreSQL
- Prisma 7
- JWT authentication
- bcryptjs for passwords
- HTTP-only cookie for JWT
- Next.js Proxy for route protection
- No BaaS

## Explicitly Avoid
Do not introduce these unless the user explicitly changes scope:
- Supabase
- Firebase
- Socket.IO
- Redis
- queues
- microservices
- Stripe/payment gateways
- ML-based recommendation systems
- OAuth/social login
- multi-tenant/company architecture
- unnecessary external services

Keep the prototype simple, deterministic, explainable, and reliable.

## Database
The Prisma schema is the source of truth.

Models:
User, Customer, DiscountTierRule, Category, Product, PriceList, PriceListItem,
Warehouse, WarehouseStock, SubscriptionPlan, UpsellRule, ApprovalRule,
Quotation, QuotationLine, ApprovalStep, AuditLog, FulfillmentAllocation,
BillingScheduleEntry, Invoice, InvoiceLine, Payment, NegotiationRequest.

Do not invent additional entities when an existing model can represent the requirement.

## Critical Business Distinctions
- Bronze/Silver/Gold = customer discount tiers, NOT subscription plans.
- Subscription plans are recurring offerings such as Care Plan 2yr and Analytics Annual.
- Duration and billing interval are separate. Care Plan 2yr can bill monthly for 24 months.
- Quotation = commercial proposal/deal.
- Invoice = bill.
- ApprovalRule = configuration.
- ApprovalStep = actual approval instance for a quotation/round.

## Authentication
Internal roles:
- ADMIN
- SALES_REP
- SALES_MANAGER
- FINANCE

Customer portal users are handled separately according to the current schema/application design.

Flow:
Login → find account → bcrypt verification → JWT → HTTP-only cookie → protected route/API.

Use Next.js Proxy for route-level protection.

Sensitive API operations must also verify authorization server-side. Never rely only on Proxy.

JWT payload should be minimal, such as userId and role. Never put passwords or sensitive business data in JWT.

`/api/auth/me` returns the authenticated user's basic identity/role. It does not replace authorization.

## Risk Engine
For each quotation line:

allowedDiscount = MIN(customerTierMaximum, categoryMaximum)

discountOverage = MAX(0, requestedDiscount - allowedDiscount)

Blended risk = SUM(all line overages).

Example:
Gold → 15% tier ceiling.
Hardware → 15% category ceiling.
Laptop at 12% → overage 0.

Services → 10% category ceiling.
Implementation at 18% → overage 8.

Blended risk = 8.

Store explainability snapshots on QuotationLine:
- discountPercent
- allowedDiscountPercentSnapshot
- discountOveragePercent

Approval routing is configuration-driven through ApprovalRule.

Seeded demo rules:
- Risk 0 → no approval
- Risk 0.01–8 → Sales Manager
- Risk >8 → Sales Manager → Finance

These are configuration values, not hard-coded truths.

## Multiple Approval Rounds
Quotes can re-enter approval after negotiation.

Never destroy previous approval or audit history.

## Upsell Engine
Deterministic database rules, no ML.

UpsellRule connects trigger product → suggested product.

Use active, promoted, priority and minimum-margin eligibility.

Accepting a suggestion creates a normal QuotationLine and it participates in totals, margin, risk, fulfillment and billing as applicable.

## Warehouse Allocation
Simple greedy allocation:
1. Find warehouses with stock.
2. Prefer lower shipping-cost weighting.
3. Allocate available stock.
4. Split if needed.
5. Record allocations.
6. Remaining quantity becomes backorder.
7. Allow manual override.

## Hybrid Billing
A quotation can contain one-time and recurring lines.

Recurring lines reference SubscriptionPlan.

BillingScheduleEntry represents recurring billing events.

No real payment gateway.

## Customer Negotiation
Customer can view quotes, request line changes, counter discounts and confirm/accept as supported.

Accepted discount changes recalculate risk and may trigger another approval round.

## Deal Health
Prefer Quotation.lastActivityAt.

Possible signals:
- stalled quotes
- discount anomalies
- delivery promise slippage

Do not create a separate alert table unless requirements demand it.

## Implementation Order
1. Database/schema/migration/seed
2. Authentication
3. Admin configuration
4. Quotation MVP
5. Risk engine
6. Approval engine
7. Upsell engine
8. Warehouse fulfillment
9. Hybrid billing
10. Proration/cancellation
11. Customer portal negotiation
12. Confirmation → invoice → payment
13. Deal Health
14. UI polish/demo

## Current Task
Database foundation and seed are complete.

Build Authentication next:
- login
- signup where appropriate
- JWT
- HTTP-only cookie
- Proxy protection
- logout
- `/api/auth/me`
- role-aware redirects
- protected placeholder dashboards

Forgot Password can remain a non-functional placeholder.

## Development Rules
- Build one vertical slice at a time: API + UI + protection + test.
- Keep business logic out of UI components.
- Validate inputs on the server.
- Never trust client-provided role, price, discount or risk.
- Recalculate important business values server-side.
- Use Prisma transactions where consistency requires multiple writes.
- Keep names aligned with Prisma schema.
- Avoid unnecessary abstractions.
- Do not rewrite working code just for style.
- Commit after each completed feature.

## Definition of Done
A feature is done only when:
1. Database interaction works.
2. API works.
3. UI exercises the API.
4. Authentication/authorization is correct.
5. Errors are handled.
6. Happy path is manually tested.
7. Existing features still work.
8. Code is committed.

## Main Demo
Gold customer
→ Hardware 12% + Services 18%
→ risk calculation
→ approval
→ upsell
→ warehouse split
→ one-time + recurring billing
→ customer counter-offer
→ risk recalculation
→ second approval round
→ confirmation
→ invoice
→ payment.
