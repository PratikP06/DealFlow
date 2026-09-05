'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/portal')
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">

        {/* LEFT — SIGNUP FORM */}
        <section className="order-2 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:order-1 lg:px-12">
          <div className="w-full max-w-[450px]">

            {/* Logo */}
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101828] shadow-sm">
                <div className="relative h-5 w-5">
                  <div className="absolute left-0 top-0 h-2.5 w-2.5 rounded bg-indigo-500" />
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded bg-violet-400" />
                  <div className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded bg-slate-400" />
                </div>
              </div>

              <div>
                <div className="font-bold tracking-tight">
                  DealFlow360
                </div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  B2B Sales Platform
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-indigo-600">
                Customer portal
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Join DealFlow360 and manage your quotes, negotiations and
                orders in one place.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                  !
                </div>

                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-7">

              <form onSubmit={handleSignup} className="space-y-5">

                {/* Company */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Company name
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                        <path d="M16 9h3a1 1 0 0 1 1 1v11" />
                        <path d="M8 7h4M8 11h4M8 15h4" />
                        <path d="M2 21h20" />
                      </svg>
                    </div>

                    <input
                      id="name"
                      type="text"
                      placeholder="Acme Technologies"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="organization"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Work email
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </div>

                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect x="4" y="10" width="16" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </div>

                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 4.3A10.7 10.7 0 0 1 12 4c5 0 8.7 4.2 10 8a15.5 15.5 0 0 1-3 4.8" />
                          <path d="M6.2 6.2C4.5 7.3 3.3 9 2 12c1.3 3.8 5 8 10 8 1.5 0 2.8-.4 4-1" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Use a password you don't reuse elsewhere.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-indigo-600 hover:shadow-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create customer account
                      <span className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Login */}
              <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              By creating an account, you'll get access to your customer
              workspace and DealFlow360's quote workflow.
            </p>
          </div>
        </section>

        {/* RIGHT — BRAND PANEL */}
        <section className="order-1 relative hidden overflow-hidden bg-[#101828] lg:order-2 lg:flex">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Top */}
            <div className="flex justify-end">
              <Link
                href="/login"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Already a customer? Sign in
              </Link>
            </div>

            {/* Content */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Built for modern B2B teams
              </div>

              <h2 className="text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-5xl">
                Your deals.
                <span className="block text-indigo-300">
                  One shared workspace.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Stay connected with your sales team from quotation to
                confirmation, fulfillment and beyond.
              </p>

              {/* Workflow */}
              <div className="mt-10 max-w-lg space-y-3">

                <WorkflowStep
                  number="01"
                  title="Review quotations"
                  text="See pricing, products and deal details."
                />

                <WorkflowStep
                  number="02"
                  title="Negotiate with confidence"
                  text="Request quantity or discount changes directly."
                />

                <WorkflowStep
                  number="03"
                  title="Confirm your deal"
                  text="Move approved quotations into fulfillment."
                />

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>DealFlow360</span>
              <span>Customer workspace</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function WorkflowStep({ number, title, text }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">
        {number}
      </div>

      <div>
        <div className="text-sm font-semibold text-white">
          {title}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {text}
        </div>
      </div>

      <div className="ml-auto text-slate-600">
        →
      </div>
    </div>
  )
}