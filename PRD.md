# DealFlow360 PRD

## Product Vision
DealFlow360 is an intelligent B2B sales system that takes a deal from quotation to payment while automatically applying business rules for discounts, approvals, upselling, inventory allocation, billing and customer negotiation.

## Core Idea
**Self-governing deal engine.**

A deal should be a connected workflow, not disconnected CRUD screens:

Quote → risk → approval → fulfillment/billing → negotiation → re-evaluation → re-approval → invoice/payment.

## Roles

### Sales Rep
Create quotes, add products, apply discounts, view risk, submit approvals, use upsell suggestions and track deals.

### Sales Manager
Review/approve/reject/return risky quotes and monitor sales activity.

### Finance
Handle high-risk approvals, billing/invoices and payment recording.

### Admin
Configure products, categories, customers, tiers, price lists, warehouses/stock, subscription plans, upsell rules and approval rules.

### Customer
Use a restricted portal to view quotes, request changes, counter discounts and accept/confirm when allowed.

## Authentication
The supplied mockup contains:
- Login / Signup tabs
- Email
- Password
- Login
- Forgot Password placeholder

Internal users land in the internal application. Customers land in the quotation/customer portal.

Prototype auth:
- JWT
- HTTP-only cookie
- bcryptjs
- Next.js Proxy
- server-side API authorization

No OAuth or email service is required.

## Functional Requirements

### FR1 Authentication
Login:
1. Find account by email.
2. Verify password with bcrypt.
3. Create JWT.
4. Set HTTP-only cookie.
5. Redirect based on role.

Logout clears the cookie.

`/api/auth/me` returns authenticated identity/role.

### FR2 Admin Configuration
Manage:
- customers
- customer tiers
- categories
- products
- price lists
- warehouses/stock
- subscription plans
- upsell rules
- approval rules

### FR3 Quotation Builder
Sales Rep can:
- select customer
- add/remove lines
- change quantity
- apply discounts
- use applicable price list
- see totals and margin
- save/reopen quote

### FR4 Discount Risk Engine
For each line:
allowed = MIN(customer tier ceiling, category ceiling)
overage = MAX(0, requested discount - allowed)

Blended risk = sum of all line overages.

The UI must explain risky lines.

### FR5 Approval Workflow
ApprovalRule determines the required roles from the risk score.

Seeded demo configuration:
- 0 → no approval
- 0.01–8 → Sales Manager
- >8 → Sales Manager + Finance

Create ApprovalStep records for the current round.

Support approve, reject and return.

### FR6 Multiple Approval Rounds
Negotiation can change discount risk. If approval is required again, create a new round while preserving prior history.

### FR7 Upsell
Use active UpsellRule records to recommend products deterministically.

Recommendations must satisfy minimum margin and ranking configuration.

Accepting an upsell adds a normal quotation line.

### FR8 Fulfillment
Check stock across warehouses.

Suggested allocation:
1. lower shipping-cost weighting first
2. use available stock
3. split across warehouses when needed
4. record backorder remainder

Allow manual override.

### FR9 Hybrid Billing
One quote can contain one-time and recurring lines.

Recurring lines reference SubscriptionPlan.

Generate finite BillingScheduleEntry records.

### FR10 Proration/Cancellation
When enabled by the plan:
- calculate explainable mid-cycle proration
- calculate cancellation credit where applicable
- update/cancel future billing entries

### FR11 Customer Negotiation
Customer can submit line-level requests/counter-discounts.

On accepted change:
1. update relevant quote data
2. recalculate risk
3. trigger approval if required
4. preserve prior approval history

### FR12 Invoice/Payment
After confirmation:
- generate invoice
- generate invoice lines
- record payment manually
- update invoice status

### FR13 Deal Health
Show stalled deals, discount anomalies and delivery promise slippage using existing quotation/activity data.

## Priority

### Must Be Rock Solid
Authentication, quotation builder, risk engine, approval workflow, warehouse allocation, hybrid billing, customer negotiation, invoice/payment.

### Strong Differentiators
Upsell engine, proration/cancellation.

### Only If Time
Deal Health, reports, extra admin polish.

## Main Demo

1. Login as Sales Rep.
2. Select Acme Corporation, Gold tier.
3. Create quotation.
4. Laptop at 12% discount.
5. Implementation Service at 18% discount.
6. Risk engine explains allowed discount and overage.
7. Automatic approval routing.
8. Approve.
9. Accept an upsell.
10. Allocate inventory across warehouses.
11. Show one-time + recurring billing.
12. Customer counters the service discount.
13. Risk recalculates.
14. Quote enters approval round 2 if required.
15. Confirm.
16. Generate invoice.
17. Record payment.

## X-Factor
**Every meaningful deal change triggers explainable business-rule evaluation, and the system automatically determines the next action.**

The strongest proof:
discount changes → risk changes → approval chain changes → approval round changes, while the rest of the deal remains connected.

## Demo Rule
Do not spend the presentation on CRUD screens.

Prioritize:
- visible risk calculation
- automatic approval
- negotiation
- re-evaluation
- re-approval
- connected fulfillment/billing.

## Engineering Constraints
- JavaScript preferred.
- Server-side validation.
- Never trust client-provided role, price, discount or risk.
- Recalculate critical values on the server.
- Use Prisma transactions for multi-record consistency.
- Keep business logic reusable and outside UI components.
- Avoid unnecessary dependencies/services.
