import { cn } from "@/lib/utils/cn"
import { Check } from "lucide-react"

const plans = [
  {
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
    cta: "Start Free Trial",
    href: "/sign-up",
  },
  {
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
    cta: "Start Free Trial",
    href: "/sign-up",
  },
  {
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
    cta: "Start Free Trial",
    href: "/sign-up",
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[#0f172a] px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            No hidden fees. Cancel anytime. All plans billed monthly.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
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
                    &#xA3;{plan.price}
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
              <a
                href={plan.href}
                className={cn(
                  "rounded-lg px-6 py-3 text-center text-sm font-semibold transition-colors",
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "border border-gray-700 text-gray-200 hover:bg-gray-800"
                )}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
