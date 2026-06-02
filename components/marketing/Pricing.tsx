'use client'

import { cn } from "@/lib/utils/cn"
import { Check, Loader2 } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const plans = [
  {
    id: "essentials" as const,
    name: "Essentials",
    price: 49,
    description: "For sole traders and micro-businesses just getting started.",
    popular: false,
    features: [
      "10 documents per month",
      "Employment contracts",
      "Offer letters",
      "Staff handbooks",
      "Payslips & P45s",
      "Email support",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 79,
    description: "For growing businesses that need unlimited document generation.",
    popular: true,
    features: [
      "Unlimited documents",
      "Everything in Essentials",
      "Custom branding",
      "PDF & Word export",
      "Priority email support",
      "Legislative auto-updates",
    ],
  },
  {
    id: "team" as const,
    name: "Team",
    price: 99,
    description: "For businesses with multiple users and advanced needs.",
    popular: false,
    features: [
      "Unlimited documents",
      "Everything in Pro",
      "Up to 10 team members",
      "Multi-user workspace",
      "Audit log & version history",
      "Dedicated account manager",
    ],
  },
]

export default function Pricing() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Check for canceled param from Stripe redirect
  const [params] = useState(() =>
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  )
  const showCanceled = params.get('canceled') === 'true'

  async function handleSubscribe(planId: string) {
    if (!isSignedIn) {
      router.push("/sign-up?redirect=pricing")
      return
    }

    setLoadingPlan(planId)
    setError(null)

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start checkout")
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" aria-label="Pricing plans" className="bg-[#0f172a] px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            No hidden fees. Cancel anytime. All plans billed monthly.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-md rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-400 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        {showCanceled && (
          <div className="mx-auto mt-6 max-w-md rounded-lg bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-400 ring-1 ring-amber-500/20">
            Checkout cancelled. No charges were made. Ready to pick a plan?
          </div>
        )}

        <div className="mt-16 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isLoading = loadingPlan === plan.id

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 sm:p-8",
                  plan.popular
                    ? "border-blue-500 bg-blue-500/5 shadow-xl shadow-blue-500/10"
                    : "border-gray-800 bg-[#1a2234]"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-blue-600 px-4 py-1 text-sm font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      £{plan.price}
                    </span>
                    <span className="text-sm text-gray-400">/mo</span>
                  </div>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={cn(
                    "rounded-lg px-6 py-3 text-center text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-150 active:scale-[0.97]",
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-sm hover:shadow-md"
                      : "border border-gray-700 text-gray-200 hover:bg-gray-800 hover:border-gray-600"
                  )}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Redirecting..." : isSignedIn ? "Subscribe Now" : "Start Free Trial"}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
