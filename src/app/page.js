'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <Link href="/" className="flex items-center gap-3">
            <Logo />

            <div>
              <div className="text-[17px] font-bold tracking-tight">
                DealFlow360
              </div>
              <div className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">
                B2B Sales Platform
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 lg:flex">
            <a href="#product" className="nav-link">Product</a>
            <a href="#workflow" className="nav-link">Workflow</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#roles" className="nav-link">Solutions</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-indigo-600"
            >
              Get started
            </Link>
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? '×' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-1">
              {[
                ['Product', '#product'],
                ['Workflow', '#workflow'],
                ['Features', '#features'],
                ['Solutions', '#roles'],
                ['How it works', '#how-it-works'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {label}
                </a>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold"
                >
                  Sign in
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-950 py-3 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden pt-32 sm:pt-36 lg:pt-44">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="absolute right-0 top-80 h-96 w-96 rounded-full bg-violet-100/50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="mx-auto max-w-4xl text-center">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              The complete B2B deal workflow
            </div>

            <h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              From quote to close.
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                Every deal. One flow.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              DealFlow360 connects quotations, risk evaluation, approvals,
              customer negotiation, fulfillment, billing and payment into
              one intelligent B2B workflow.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-950/15 transition hover:bg-indigo-600 sm:w-auto"
              >
                Get started
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <a
                href="#workflow"
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Explore workflow
              </a>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                ✓
              </span>
              Built for modern B2B sales teams
            </div>
          </div>

          {/* Dashboard visual */}
          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-indigo-200/30 via-violet-200/30 to-indigo-200/30 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.14)]">

              {/* Browser bar */}
              <div className="flex h-11 items-center border-b border-slate-200 bg-slate-50 px-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </div>

                <div className="mx-auto rounded-lg border border-slate-200 bg-white px-20 py-1.5 text-[9px] text-slate-400">
                  app.dealflow360.com/dashboard
                </div>
              </div>

              <div className="grid min-h-[430px] grid-cols-[180px_1fr] bg-[#f8fafc]">

                {/* Sidebar */}
                <div className="hidden border-r border-slate-200 bg-white p-4 sm:block">
                  <div className="mb-7 flex items-center gap-2">
                    <Logo small />
                    <span className="text-xs font-bold">DealFlow360</span>
                  </div>

                  <div className="space-y-1">
                    {[
                      ['⌂', 'Overview', true],
                      ['◫', 'Quotations'],
                      ['✓', 'Approvals'],
                      ['▦', 'Fulfillment'],
                      ['▤', 'Invoices'],
                      ['◉', 'Deal Health'],
                    ].map(([icon, label, active]) => (
                      <div
                        key={label}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[10px] font-semibold ${
                          active
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-400'
                        }`}
                      >
                        <span>{icon}</span>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dashboard */}
                <div className="p-5 sm:p-7">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Sales workspace
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        Deal overview
                      </h3>
                    </div>

                    <div className="rounded-lg bg-indigo-600 px-3 py-2 text-[9px] font-bold text-white">
                      + New quotation
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <DashboardStat
                      label="Pipeline"
                      value="₹48.2L"
                      change="+18.4%"
                    />
                    <DashboardStat
                      label="Active deals"
                      value="24"
                      change="+6"
                    />
                    <DashboardStat
                      label="Pending approval"
                      value="07"
                      change="3 high risk"
                    />
                    <DashboardStat
                      label="Win rate"
                      value="72%"
                      change="+4.8%"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">

                    {/* Pipeline */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">
                          Deal pipeline
                        </span>
                        <span className="text-[9px] text-slate-400">
                          This month
                        </span>
                      </div>

                      <div className="mt-5 space-y-4">
                        <PipelineRow
                          label="Quotation"
                          count="12"
                          width="92%"
                        />
                        <PipelineRow
                          label="Approval"
                          count="7"
                          width="66%"
                        />
                        <PipelineRow
                          label="Fulfillment"
                          count="5"
                          width="48%"
                        />
                        <PipelineRow
                          label="Confirmed"
                          count="8"
                          width="73%"
                        />
                      </div>
                    </div>

                    {/* Health */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <span className="text-xs font-bold">
                        Deal health
                      </span>

                      <div className="mt-5 flex items-center justify-center">
                        <div className="flex h-32 w-32 items-center justify-center rounded-full border-[13px] border-indigo-100">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">
                              86
                            </div>
                            <div className="text-[8px] font-bold uppercase tracking-wider text-emerald-500">
                              Healthy
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <MiniMetric label="Risk" value="Low" />
                        <MiniMetric label="Activity" value="High" />
                      </div>
                    </div>
                  </div>

                  {/* Floating notification */}
                  <div className="absolute -right-3 top-36 hidden w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:block lg:-right-8">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        ✓
                      </div>
                      <div>
                        <div className="text-[9px] font-bold">
                          Quote approved
                        </div>
                        <div className="text-[8px] text-slate-400">
                          Q-2026-1048
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -left-3 bottom-16 hidden w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:block lg:-left-8">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        ↗
                      </div>
                      <div>
                        <div className="text-[9px] font-bold">
                          Fulfillment
                        </div>
                        <div className="text-[8px] text-slate-400">
                          72% allocated
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROBLEM
      ========================================================= */}
      <section className="border-y border-slate-100 bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <SectionHeading
            eyebrow="THE PROBLEM"
            title="B2B deals don't break at one stage."
            highlight="They break between stages."
            description="Quotations live in one place. Approvals happen somewhere else. Fulfillment needs another system. Customers are left chasing updates."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProblemCard
              number="01"
              title="Scattered quotations"
              text="Pricing, discounts and customer requests become difficult to track across disconnected workflows."
            />
            <ProblemCard
              number="02"
              title="Slow approvals"
              text="High-risk discounts can sit waiting while teams figure out who needs to approve them."
            />
            <ProblemCard
              number="03"
              title="Manual fulfillment"
              text="Warehouse availability and backorders can create friction after a deal is already approved."
            />
            <ProblemCard
              number="04"
              title="Poor visibility"
              text="Sales, finance and customers often see different pieces of the same deal."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          WORKFLOW
      ========================================================= */}
      <section id="workflow" className="scroll-mt-20 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <SectionHeading
            eyebrow="THE DEALFLOW"
            title="One connected workflow."
            highlight="From quotation to payment."
            description="Every stage of the deal lifecycle is connected, so teams can move forward without losing context."
          />

          <div className="mt-16 overflow-x-auto pb-5">
            <div className="mx-auto flex min-w-[1050px] items-start justify-between">
              {[
                ['01', 'Quotation', 'Create the deal'],
                ['02', 'Risk', 'Evaluate pricing'],
                ['03', 'Approval', 'Route decisions'],
                ['04', 'Negotiation', 'Collaborate'],
                ['05', 'Fulfillment', 'Allocate stock'],
                ['06', 'Billing', 'Generate invoices'],
                ['07', 'Payment', 'Close the deal'],
              ].map(([number, title, text], index, array) => (
                <div key={number} className="relative flex w-32 flex-col items-center text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-600 shadow-sm">
                    {number}
                  </div>

                  <div className="mt-4 text-sm font-bold text-slate-900">
                    {title}
                  </div>

                  <div className="mt-1 text-[10px] leading-4 text-slate-400">
                    {text}
                  </div>

                  {index < array.length - 1 && (
                    <div className="absolute left-[calc(50%+32px)] top-7 h-px w-24 bg-gradient-to-r from-indigo-200 to-slate-200" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Workflow card */}
          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white sm:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">
                  Connected intelligence
                </div>

                <h3 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  The next step is always visible.
                </h3>

                <p className="mt-5 text-sm leading-6 text-slate-400">
                  DealFlow360 carries deal context from one stage to the next,
                  reducing manual coordination and making ownership clear.
                </p>
              </div>

              <div className="space-y-3">
                <WorkflowEvent
                  label="Quotation created"
                  status="Completed"
                  icon="✓"
                />
                <WorkflowEvent
                  label="Risk evaluation"
                  status="Low risk"
                  icon="◎"
                />
                <WorkflowEvent
                  label="Approval routing"
                  status="Sales Manager"
                  icon="→"
                />
                <WorkflowEvent
                  label="Customer confirmation"
                  status="Waiting"
                  icon="○"
                />
                <WorkflowEvent
                  label="Fulfillment"
                  status="Ready"
                  icon="▦"
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCT
      ========================================================= */}
      <section id="product" className="scroll-mt-20 bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <SectionHeading
            eyebrow="THE PLATFORM"
            title="Everything your deal needs."
            highlight="One workspace."
            description="A unified workspace for the people who create, approve, fulfill and buy."
          />

          <div className="mt-14 grid gap-4 lg:grid-cols-3">

            <ProductCard
              className="lg:col-span-2"
              eyebrow="SALES WORKSPACE"
              title="Build and manage every quotation."
              description="Create quotes with controlled pricing, discounts, customer-specific price lists and real-time risk visibility."
              type="quotation"
            />

            <ProductCard
              eyebrow="APPROVALS"
              title="Route decisions intelligently."
              description="Risk-based approval chains make sure the right authority sees the right deal."
              type="approval"
            />

            <ProductCard
              eyebrow="CUSTOMER PORTAL"
              title="Bring customers into the workflow."
              description="Customers can review quotes, negotiate changes and confirm deals without leaving the platform."
              type="customer"
            />

            <ProductCard
              className="lg:col-span-2"
              eyebrow="DEAL HEALTH"
              title="See what needs attention."
              description="Track risk, approval aging, negotiation activity, fulfillment progress and deal momentum from one view."
              type="health"
            />

          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <section id="features" className="scroll-mt-20 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <SectionHeading
            eyebrow="FEATURES"
            title="Built around the moments"
            highlight="that matter."
            description="Every feature exists to remove friction from the B2B deal lifecycle."
          />

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            <FeatureCard
              icon="↗"
              title="Smart quotations"
              text="Create and manage quotations with controlled pricing, discounts and customer-specific rules."
            />

            <FeatureCard
              icon="✓"
              title="Risk-aware approvals"
              text="Automatically identify discount risk and route the deal to the appropriate approval authority."
            />

            <FeatureCard
              icon="◌"
              title="Customer negotiation"
              text="Customers can request discount, quantity or line changes directly against a quotation."
            />

            <FeatureCard
              icon="▦"
              title="Intelligent fulfillment"
              text="Recommend warehouse allocations based on available stock and handle backorders cleanly."
            />

            <FeatureCard
              icon="₹"
              title="Recurring billing"
              text="Manage one-time and recurring billing schedules as the deal progresses."
            />

            <FeatureCard
              icon="◎"
              title="Deal health"
              text="Understand risk, activity, delays and deal momentum before they become problems."
            />

          </div>
        </div>
      </section>

      {/* =========================================================
          ROLES
      ========================================================= */}
      <section id="roles" className="scroll-mt-20 bg-[#0f172a] py-24 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <SectionHeading
            dark
            eyebrow="ROLE-BASED EXPERIENCE"
            title="Everyone sees the deal"
            highlight="from the right perspective."
            description="One deal. Different responsibilities. One shared source of truth."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <RoleCard
              role="SALES REP"
              title="Create & monitor"
              text="Build quotations, track approvals, respond to customer negotiations and monitor fulfillment."
              number="01"
            />

            <RoleCard
              role="SALES MANAGER"
              title="Review & approve"
              text="Review discount risk, approve deals and monitor the health of the sales pipeline."
              number="02"
            />

            <RoleCard
              role="FINANCE / OPS"
              title="Control & execute"
              text="Approve high-risk decisions, manage fulfillment allocation and reconcile billing."
              number="03"
            />

            <RoleCard
              role="CUSTOMER"
              title="Review & confirm"
              text="Review quotations, negotiate changes and confirm deals from a dedicated portal."
              number="04"
            />

          </div>
        </div>
      </section>

      {/* =========================================================
          SMART AUTOMATION
      ========================================================= */}
      <section id="how-it-works" className="scroll-mt-20 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white sm:p-10 lg:p-14">

            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
                  SMART AUTOMATION
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Automation where decisions actually matter.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-6 text-indigo-100">
                  DealFlow360 applies business rules behind the scenes so
                  teams can spend less time coordinating and more time closing.
                </p>

                <div className="mt-7 space-y-3">
                  <CheckItem text="Risk-based approval routing" />
                  <CheckItem text="Server-side pricing validation" />
                  <CheckItem text="Warehouse stock protection" />
                  <CheckItem text="Backorder handling" />
                  <CheckItem text="Complete audit trail" />
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">

                <AutomationStep
                  number="01"
                  title="Deal input"
                  text="Sales or customer submits a change"
                />

                <ArrowDown />

                <AutomationStep
                  number="02"
                  title="Rules evaluated"
                  text="Pricing, discount and risk are checked"
                />

                <ArrowDown />

                <AutomationStep
                  number="03"
                  title="Decision routed"
                  text="The correct authority receives the action"
                />

                <ArrowDown />

                <AutomationStep
                  number="04"
                  title="Workflow continues"
                  text="Approved action updates the deal"
                  active
                />

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FULFILLMENT
      ========================================================= */}
      <section className="bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">

            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                FULFILLMENT
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Turn approved deals into
                <span className="block text-indigo-600">
                  fulfilled orders.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
                Once a deal is confirmed, DealFlow360 helps determine where
                stock should come from, what can be allocated and what needs
                to be backordered.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-[9px] font-bold uppercase text-slate-400">
                    Sales Rep
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    Monitor
                  </div>
                </div>

                <div className="text-slate-300">→</div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 shadow-sm">
                  <div className="text-[9px] font-bold uppercase text-indigo-500">
                    Finance
                  </div>
                  <div className="mt-1 text-sm font-bold text-indigo-700">
                    Approve
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation UI */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold">Fulfillment allocation</div>
                  <div className="mt-1 text-[9px] text-slate-400">
                    Q-2026-1048
                  </div>
                </div>

                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-600">
                  Awaiting approval
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <WarehouseRow
                  name="Pune Warehouse"
                  location="Pune, MH"
                  stock="40"
                  allocated="30"
                  status="Recommended"
                />

                <WarehouseRow
                  name="Mumbai Warehouse"
                  location="Mumbai, MH"
                  stock="25"
                  allocated="20"
                  status="Recommended"
                />

                <WarehouseRow
                  name="Backorder"
                  location="10 units"
                  stock="—"
                  allocated="10"
                  status="Pending"
                  warning
                />
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <div className="text-[9px] text-slate-400">
                    Recommended allocation
                  </div>
                  <div className="mt-1 text-sm font-bold">
                    50 / 60 units
                  </div>
                </div>

                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-[9px] font-bold text-white">
                  Approve split
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          CUSTOMER PORTAL
      ========================================================= */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">

            {/* Portal UI */}
            <div className="order-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.1)] lg:order-1">

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold">Customer portal</div>
                  <div className="mt-1 text-[9px] text-slate-400">
                    Acme Technologies
                  </div>
                </div>

                <div className="h-8 w-8 rounded-full bg-indigo-100" />
              </div>

              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold uppercase text-indigo-500">
                      Active quotation
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      Q-2026-1048
                    </div>
                  </div>

                  <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-indigo-600">
                    Review
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <PortalStat label="Items" value="12" />
                  <PortalStat label="Value" value="₹4.8L" />
                  <PortalStat label="Valid" value="14 days" />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold">
                    Customer negotiation
                  </span>
                  <span className="text-[9px] font-semibold text-amber-500">
                    Pending
                  </span>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <div className="text-[9px] text-slate-400">
                    Requested discount
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold">8%</span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-sm font-bold text-indigo-600">
                      12%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-lg border border-slate-200 py-2 text-[9px] font-bold">
                    Reject
                  </button>
                  <button className="flex-1 rounded-lg bg-slate-950 py-2 text-[9px] font-bold text-white">
                    Review
                  </button>
                </div>
              </div>

            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                CUSTOMER EXPERIENCE
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Give customers
                <span className="block text-indigo-600">
                  a seat at the table.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
                Customers shouldn't have to send five emails to negotiate one
                quote. Give them a dedicated portal to review, request
                changes and confirm deals.
              </p>

              <div className="mt-8 space-y-4">
                <CheckItem dark text="Review quotations and pricing" />
                <CheckItem dark text="Request discount or quantity changes" />
                <CheckItem dark text="Track negotiation status" />
                <CheckItem dark text="Confirm approved quotations" />
              </div>

              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-600"
              >
                Explore customer portal
                <span>→</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          DEAL HEALTH
      ========================================================= */}
      <section className="bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <SectionHeading
            eyebrow="DEAL HEALTH"
            title="Know which deals need attention"
            highlight="before they become problems."
            description="Turn scattered deal activity into a clear operational picture."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <HealthCard
              label="Overall health"
              value="86"
              suffix="/100"
              detail="Healthy pipeline"
              icon="◎"
            />

            <HealthCard
              label="Approval aging"
              value="2.4"
              suffix=" days"
              detail="↓ 18% this month"
              icon="◷"
            />

            <HealthCard
              label="Fulfillment"
              value="72"
              suffix="%"
              detail="Allocated"
              icon="▦"
            />

            <HealthCard
              label="At-risk deals"
              value="04"
              suffix=""
              detail="Needs attention"
              icon="!"
              warning
            />

          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white sm:py-32">
        <div className="absolute left-1/2 top-1/2 -z-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center sm:px-8">

          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Logo small />
          </div>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop managing deals
            <span className="block text-indigo-300">
              across disconnected systems.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Bring quotations, approvals, fulfillment, billing and customers
            into one connected workflow with DealFlow360.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-indigo-50"
            >
              Get started →
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-slate-800 bg-slate-950 text-white">

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

            <div>
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <div className="font-bold">DealFlow360</div>
                  <div className="text-[9px] uppercase tracking-widest text-slate-500">
                    B2B Sales Platform
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-xs text-sm leading-6 text-slate-500">
                The connected workflow for modern B2B sales teams.
              </p>
            </div>

            <FooterColumn
              title="Product"
              links={[
                ['Features', '#features'],
                ['Workflow', '#workflow'],
                ['Customer Portal', '#product'],
                ['Deal Health', '#how-it-works'],
              ]}
            />

            <FooterColumn
              title="Solutions"
              links={[
                ['Sales Teams', '#roles'],
                ['Sales Managers', '#roles'],
                ['Finance & Operations', '#roles'],
                ['Customers', '#roles'],
              ]}
            />

            <FooterColumn
              title="Company"
              links={[
                ['About', '#'],
                ['Contact', '#'],
                ['Sign in', '/login'],
                ['Get started', '/signup'],
              ]}
            />

          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 DealFlow360. All rights reserved.</span>

            <div className="flex gap-5">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
          </div>

        </div>
      </footer>

    </main>
  )
}


/* ===============================================================
   COMPONENTS
   =============================================================== */

function Logo({ small = false }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-slate-950 ${
        small ? 'h-8 w-8' : 'h-10 w-10'
      }`}
    >
      <div
        className={`relative ${
          small ? 'h-4 w-4' : 'h-5 w-5'
        }`}
      >
        <span className="absolute left-0 top-0 h-1/2 w-1/2 rounded-[4px] bg-indigo-500" />
        <span className="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-[4px] bg-violet-400" />
        <span className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-[4px] bg-slate-500" />
      </div>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  dark = false
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div
        className={`text-xs font-bold uppercase tracking-[0.18em] ${
          dark ? 'text-indigo-300' : 'text-indigo-600'
        }`}
      >
        {eyebrow}
      </div>

      <h2
        className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${
          dark ? 'text-white' : 'text-slate-950'
        }`}
      >
        {title}
        <span
          className={`block ${
            dark ? 'text-indigo-300' : 'text-indigo-600'
          }`}
        >
          {highlight}
        </span>
      </h2>

      <p
        className={`mx-auto mt-5 max-w-2xl text-sm leading-6 ${
          dark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {description}
      </p>
    </div>
  )
}

function ProblemCard({ number, title, text }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-600">
          {number}
        </span>

        <span className="text-slate-300 transition group-hover:text-indigo-400">
          ↗
        </span>
      </div>

      <h3 className="mt-10 text-base font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  )
}

function WorkflowEvent({ label, status, icon }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-indigo-200">
        {icon}
      </div>

      <div className="flex-1">
        <div className="text-xs font-semibold">{label}</div>
      </div>

      <span className="text-[9px] font-semibold text-slate-400">
        {status}
      </span>
    </div>
  )
}

function ProductCard({
  eyebrow,
  title,
  description,
  type,
  className = ''
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 sm:p-7 ${className}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
        {eyebrow}
      </div>

      <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
        {title}
      </h3>

      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-7">
        {type === 'quotation' && <QuotationPreview />}
        {type === 'approval' && <ApprovalPreview />}
        {type === 'customer' && <CustomerPreview />}
        {type === 'health' && <HealthPreview />}
      </div>
    </div>
  )
}

function QuotationPreview() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex justify-between">
        <div>
          <div className="text-[9px] text-slate-400">Quotation</div>
          <div className="mt-1 text-sm font-bold">Q-2026-1048</div>
        </div>

        <span className="h-fit rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-600">
          APPROVED
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <PreviewLine label="Enterprise Software" value="₹2,40,000" />
        <PreviewLine label="Implementation" value="₹85,000" />
        <PreviewLine label="Support — Yearly" value="₹1,20,000" />
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3 text-right">
        <span className="text-[9px] text-slate-400">Total</span>
        <div className="text-base font-bold">₹4,45,000</div>
      </div>
    </div>
  )
}

function ApprovalPreview() {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <ApprovalRow
        role="Sales Manager"
        status="Approved"
        done
      />
      <ApprovalRow
        role="Finance"
        status="Pending"
      />
    </div>
  )
}

function CustomerPreview() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold">
          Customer request
        </span>

        <span className="text-[8px] font-bold text-amber-500">
          PENDING
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-white p-3">
        <div className="text-[8px] text-slate-400">
          Discount request
        </div>
        <div className="mt-1 text-sm font-bold">
          8% <span className="mx-2 text-slate-300">→</span>
          <span className="text-indigo-600">12%</span>
        </div>
      </div>
    </div>
  )
}

function HealthPreview() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl bg-slate-50 p-3">
        <div className="text-[8px] text-slate-400">Health</div>
        <div className="mt-2 text-lg font-bold text-emerald-600">86</div>
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <div className="text-[8px] text-slate-400">Risk</div>
        <div className="mt-2 text-sm font-bold">Low</div>
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <div className="text-[8px] text-slate-400">Activity</div>
        <div className="mt-2 text-sm font-bold">High</div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  )
}

function RoleCard({ role, title, text, number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.07]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-indigo-300">
          {number}
        </span>

        <span className="text-[9px] font-bold tracking-widest text-slate-500">
          {role}
        </span>
      </div>

      <h3 className="mt-10 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {text}
      </p>
    </div>
  )
}

function AutomationStep({ number, title, text, active }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 ${
        active
          ? 'border-indigo-300/30 bg-indigo-500/20'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold">
        {number}
      </div>

      <div>
        <div className="text-xs font-bold">{title}</div>
        <div className="mt-1 text-[9px] text-indigo-100/60">
          {text}
        </div>
      </div>
    </div>
  )
}

function ArrowDown() {
  return (
    <div className="flex h-5 items-center justify-center text-xs text-indigo-200">
      ↓
    </div>
  )
}

function CheckItem({ text, dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          dark
            ? 'bg-indigo-50 text-indigo-600'
            : 'bg-white/10 text-indigo-200'
        }`}
      >
        ✓
      </div>

      <span
        className={`text-sm ${
          dark ? 'text-slate-600' : 'text-indigo-100'
        }`}
      >
        {text}
      </span>
    </div>
  )
}

function WarehouseRow({
  name,
  location,
  stock,
  allocated,
  status,
  warning
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold">{name}</div>
          <div className="mt-0.5 text-[8px] text-slate-400">
            {location}
          </div>
        </div>

        <span
          className={`rounded-full px-2 py-1 text-[8px] font-bold ${
            warning
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
        <div className="rounded-lg bg-slate-50 p-2">
          <span className="text-slate-400">Stock</span>
          <div className="mt-1 font-bold">{stock}</div>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <span className="text-slate-400">Allocated</span>
          <div className="mt-1 font-bold">{allocated}</div>
        </div>
      </div>
    </div>
  )
}

function HealthCard({
  label,
  value,
  suffix,
  detail,
  icon,
  warning
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            warning
              ? 'bg-amber-50 text-amber-600'
              : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-6">
        <span className="text-3xl font-bold tracking-tight">
          {value}
        </span>

        <span className="ml-1 text-sm text-slate-400">
          {suffix}
        </span>
      </div>

      <div
        className={`mt-2 text-xs font-semibold ${
          warning ? 'text-amber-600' : 'text-emerald-600'
        }`}
      >
        {detail}
      </div>
    </div>
  )
}

function DashboardStat({ label, value, change }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-base font-bold text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-[8px] font-semibold text-emerald-500">
        {change}
      </div>
    </div>
  )
}

function PipelineRow({ label, count, width }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[9px]">
        <span className="font-semibold text-slate-600">
          {label}
        </span>

        <span className="text-slate-400">
          {count}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width }}
        />
      </div>
    </div>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="text-[7px] uppercase text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-[10px] font-bold">
        {value}
      </div>
    </div>
  )
}

function PreviewLine({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
      <span className="text-[8px] text-slate-500">{label}</span>
      <span className="text-[9px] font-bold">{value}</span>
    </div>
  )
}

function ApprovalRow({ role, status, done }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-bold ${
            done
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {done ? '✓' : '…'}
        </div>

        <span className="text-[9px] font-bold">
          {role}
        </span>
      </div>

      <span
        className={`text-[8px] font-bold ${
          done ? 'text-emerald-500' : 'text-amber-500'
        }`}
      >
        {status}
      </span>
    </div>
  )
}

function PortalStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-2">
      <div className="text-[7px] text-slate-400">{label}</div>
      <div className="mt-1 text-[9px] font-bold">{value}</div>
    </div>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-white">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="block text-xs text-slate-500 transition hover:text-white"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

const navLinkClass = `
  text-sm font-medium text-slate-500
  transition hover:text-slate-950
`

// Tailwind class used through a constant to keep the JSX cleaner.
function NavLink({ href, children }) {
  return (
    <a href={href} className={navLinkClass}>
      {children}
    </a>
  )
}