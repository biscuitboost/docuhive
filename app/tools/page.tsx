"use client"

import DashboardShell from "@/components/layout/DashboardShell"
import Link from "next/link"
import { Calculator, Percent, PoundSterling, Building, CalendarDays, PiggyBank, Receipt } from "lucide-react"

const tools = [
  {
    href: "/tools/vat",
    label: "VAT Calculator",
    description: "Calculate VAT exclusive/inclusive amounts at standard (20%), reduced (5%), or zero rates",
    icon: Percent,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
    comingSoon: false,
  },
  {
    href: "/tools/paye",
    label: "PAYE Calculator",
    description: "Calculate income tax, NI, and net pay for employees and directors",
    icon: PoundSterling,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
    comingSoon: false,
  },
  {
    href: "/tools/corporation-tax",
    label: "Corporation Tax Calculator",
    description: "Estimate corporation tax liability — small profits rate (19%), main rate (25%), or marginal relief",
    icon: Building,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400",
    comingSoon: false,
  },
  {
    href: "/tools/dividend",
    label: "Dividend Calculator",
    description: "Calculate dividend tax and net income from dividend payments",
    icon: PiggyBank,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
    comingSoon: false,
  },
  {
    href: "/tools/expenses",
    label: "Expense Tracker",
    description: "Track and categorise business expenses — export CSV for your accounting software",
    icon: Receipt,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400",
    comingSoon: false,
  },
  {
    href: "#",
    label: "Statutory Payments Calculator",
    description: "Calculate SSP, SMP, SPP, and other statutory payments",
    icon: CalendarDays,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400",
    comingSoon: true,
  },
  {
    href: "/tools/holiday-entitlement",
    label: "Holiday Entitlement Calculator",
    description: "Calculate statutory holiday entitlement and accrued days for full-time, part-time, and irregular hours workers",
    icon: Calculator,
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 dark:text-cyan-400",
    comingSoon: false,
  },
]

export default function ToolsPage() {
  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Small Business Tools</h1>
        <p className="mt-1.5 text-muted-foreground">
          Free UK calculators and tools to help you run your business
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon
          if (tool.comingSoon) {
            return (
              <div
                key={tool.label}
                className="relative rounded-xl border border-border bg-card p-5 shadow-sm transition-all opacity-60"
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tool.color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground">{tool.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
                <span className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
            )
          }
          return (
            <Link
              key={tool.label}
              href={tool.href}
              className="group relative rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tool.color}`}>
                <Icon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {tool.label}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
            </Link>
          )
        })}
      </div>
    </DashboardShell>
  )
}