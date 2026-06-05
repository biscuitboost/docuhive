'use client'

import { cn } from "@/lib/utils/cn"
import { Star, Quote } from "lucide-react"
import { AnimatedSection, AnimatedStagger, AnimatedChild } from "@/components/animation/AnimatedSection"

interface Testimonial {
  quote: string
  name: string
  role: string
  business: string
  rating: number
  highlight?: string
}

const testimonials: Testimonial[] = [
  {
    quote:
      "I was paying a solicitor £350 every time I hired someone. DocuHive paid for itself in the first month. The contracts are compliant and the payslips are HMRC-ready.",
    name: "Sarah Mitchell",
    role: "Owner",
    business: "Mitchell's Bakery",
    rating: 5,
    highlight: "Saved £350 in month one",
  },
  {
    quote:
      "The employment contracts are spot-on for UK law. We hired three staff last quarter and had compliant contracts in under 5 minutes each. The staff handbook feature saved me days of work.",
    name: "James Okonkwo",
    role: "Director",
    business: "Urban Fix Ltd",
    rating: 5,
    highlight: "Contracts in under 5 minutes",
  },
  {
    quote:
      "I switched from BrightHR because I only needed documents, not the whole HR suite. DocuHive does payslips, P45s, and contracts better, and it's half the price.",
    name: "Priya Sharma",
    role: "Practice Manager",
    business: "Maple Dental Clinic",
    rating: 5,
    highlight: "Half the price of BrightHR",
  },
  {
    quote:
      "The ER Act 2025 changes had me worried, but DocuHive already had Day-One Rights built into the templates. No panic, no last-minute solicitor bill. Just updated my existing contracts and done.",
    name: "David Chen",
    role: "Founder",
    business: "SwiftStaff Recruitment",
    rating: 5,
    highlight: "ERA 2025 compliant out of the box",
  },
  {
    quote:
      "We run payroll for 4 employees and the payslip generator alone is worth the subscription. NI and pension auto-calculated, PDF downloads, emailed directly to staff. Takes 2 minutes.",
    name: "Emma Richardson",
    role: "Office Manager",
    business: "GreenLeaf Landscaping",
    rating: 5,
    highlight: "Payslips in 2 minutes flat",
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className="fill-amber-400 text-amber-400"
        />
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-[#0f172a] px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection amount={0.2}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Trusted by UK businesses like yours
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Join 500+ micro-businesses, recruiters, and practices already saving time and money.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedStagger className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <AnimatedChild key={t.name}>
              <div
                className={cn(
                  "group relative flex flex-col rounded-xl border border-gray-800 bg-[#1a2234] p-6",
                  "transition-all duration-300"
                )}
              >
                {/* Highlight badge */}
                {t.highlight && (
                  <div className="mb-4 inline-flex self-start items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
                    <Quote size={12} />
                    {t.highlight}
                  </div>
                )}

                {/* Quote */}
                <blockquote className="flex-1 text-sm leading-6 text-gray-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Bottom section */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-800/60 pt-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {t.role}, {t.business}
                    </p>
                  </div>
                  <Stars count={t.rating} />
                </div>
              </div>
            </AnimatedChild>
          ))}
        </AnimatedStagger>

        {/* Trust bar */}
        <AnimatedSection amount={0.3} className="mt-16">
          <div className="rounded-xl border border-gray-800 bg-[#1a2234]/50 px-6 py-8 sm:px-10">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-gray-400">Average rating across all reviews</p>
                <div className="mt-1 flex items-center gap-2">
                  <Stars count={5} />
                  <span className="text-sm text-gray-300">
                    4.9 / 5.0
                  </span>
                </div>
              </div>
              <div className="h-px w-full bg-gray-800 sm:hidden" />
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                  500+ businesses
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                  26 document types
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                  ERA 2025 compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                  14-day money-back
                </span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}