'use client'

import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { AnimatedSection, AnimatedStagger, AnimatedChild } from "@/components/animation/AnimatedSection"
import {
  Calculator,
  Receipt,
  Building2,
  PiggyBank,
  Wallet,
  CalendarCheck,
  Umbrella,
  FileText,
  Clock,
  TrendingUp,
  UserX,
} from "lucide-react"

interface Tool {
  name: string
  description: string
  icon: React.ElementType
  href: string
}

const tools: Tool[] = [
  {
    name: "VAT Calculator",
    description: "Calculate VAT amounts, add or remove VAT from prices instantly.",
    icon: Calculator,
    href: "/tools/landing/vat",
  },
  {
    name: "PAYE Calculator",
    description: "Work out income tax and National Insurance contributions for employees.",
    icon: Receipt,
    href: "/tools/landing/paye",
  },
  {
    name: "Corporation Tax Calculator",
    description: "Estimate your corporation tax liability based on profits.",
    icon: Building2,
    href: "/tools/landing/corporation-tax",
  },
  {
    name: "Dividend Calculator",
    description: "Calculate dividend payments after tax allowances and bands.",
    icon: PiggyBank,
    href: "/tools/landing/dividend",
  },
  {
    name: "Expense Tracker",
    description: "Log and categorise business expenses for easier accounting.",
    icon: Wallet,
    href: "/tools/landing/expenses",
  },
  {
    name: "Statutory Payments Calculator",
    description: "Calculate SSP, SMP, SPP, and other statutory payments.",
    icon: CalendarCheck,
    href: "/tools/landing/statutory-payments",
  },
  {
    name: "Holiday Entitlement Calculator",
    description: "Work out statutory holiday entitlement for full and part-time staff.",
    icon: Umbrella,
    href: "/tools/landing/holiday-entitlement",
  },
  {
    name: "Invoice Generator",
    description: "Create professional invoices with your business details and branding.",
    icon: FileText,
    href: "/tools/landing/invoice",
  },
  {
    name: "Time Tracker",
    description: "Track employee hours, overtime, and shift patterns.",
    icon: Clock,
    href: "/tools/landing/time-tracking",
  },
  {
    name: "Cash Flow Forecaster",
    description: "Project future cash flow based on income, expenses, and payroll.",
    icon: TrendingUp,
    href: "/tools/landing/cash-flow",
  },
  {
    name: "Redundancy Calculator",
    description: "Calculate statutory redundancy pay based on age, service, and pay.",
    icon: UserX,
    href: "/tools/landing/redundancy",
  },
]

export default function ToolsGrid() {
  return (
    <section id="tools" className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection amount={0.2}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Business tools for every need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From tax calculators to invoice generation — everything your UK business needs in one place.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedStagger className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" staggerDelay={0.05}>
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <AnimatedChild key={tool.name}>
                <Link
                  href={tool.href}
                  className={cn(
                    "group relative flex items-start gap-4 rounded-xl border border-border bg-tool-card p-5 shadow-sm",
                    "hover:bg-tool-card-hover hover:border-primary/30 hover:shadow-md",
                    "transition-all duration-300"
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tool-icon-bg text-tool-icon-fg group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              </AnimatedChild>
            )
          })}
        </AnimatedStagger>
      </div>
    </section>
  )
}
