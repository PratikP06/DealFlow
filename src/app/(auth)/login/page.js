'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await res.json()

      if (res.ok) {
        if (data.type === 'internal') {
          router.push('/dashboard')
        } else {
          router.push('/portal')
        }
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT — BRAND PANEL */}
        <section className="relative hidden overflow-hidden bg-[#101828] lg:flex">
          {/* Decorative background */}
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg">
                <div className="relative h-6 w-6">
                  <div className="absolute left-0 top-0 h-3 w-3 rounded-md bg-indigo-600" />
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-md bg-violet-500" />
                  <div className="absolute bottom-0 left-0 h-3 w-3 rounded-md bg-slate-300" />
                </div>
              </div>

              <div>
                <div className="text-lg font-bold tracking-tight text-white">
                  DealFlow360
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  B2B Sales Platform
                </div>
              </div>
            </div>

            {/* Main message */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sales operations, connected
              </div>

              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-5xl">
                Turn every deal into a
                <span className="block text-indigo-300">
                  predictable workflow.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Manage quotations, approvals, fulfillment, billing and
                customer negotiations from one intelligent workspace.
              </p>

              {/* Feature cards */}
              <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
                <FeatureCard
                  icon="↗"
                  title="Deal visibility"
                  text="Track every stage"
                />
                <FeatureCard
                  icon="✓"
                  title="Smart approvals"
                  text="Risk-aware decisions"
                />
                <FeatureCard
                  icon="▦"
                  title="Fulfillment"
                  text="Warehouse control"
                />
                <FeatureCard
                  icon="◎"
                  title="Customer portal"
                  text="One shared workflow"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>© 2026 DealFlow360</span>
              <span>Secure workspace</span>
            </div>
          </div>
        </section>

        {/* RIGHT — LOGIN */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[430px]">

            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
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
                Welcome back
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Sign in to your workspace
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Access your sales workspace or customer portal.
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

            {/* Form card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-7">

              <form onSubmit={handleLogin} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
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
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>
                  </div>

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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <span className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Signup */}
              <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  New to DealFlow360?{' '}
                  <Link
                    href="/signup"
                    className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                  >
                    Create a customer account
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom trust */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Secure access to your DealFlow workspace
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-sm font-bold text-indigo-300">
        {icon}
      </div>

      <div className="text-sm font-semibold text-white">
        {title}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {text}
      </div>
    </div>
  )
}