"use client"

import DashboardShell from "@/components/layout/DashboardShell"
import Link from "next/link"
import { Building2, FileText, CreditCard, ChevronRight, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: Building2,
    title: "Set up your company",
    description: "Add your company name, address, and tax details so documents are pre-filled automatically.",
    actionLabel: "Company Settings",
    href: "/settings",
  },
  {
    icon: FileText,
    title: "Create your first document",
    description: "Choose a document type — employment contract, payslip, offer letter, or any of 26 UK templates.",
    actionLabel: "Create Document",
    href: "/documents/new",
  },
  {
    icon: CreditCard,
    title: "Choose your plan",
    description: "Start with Essentials (free trial, 10 docs/month) or upgrade to Pro for unlimited generation.",
    actionLabel: "View Plans",
    href: "/settings/billing",
  },
]

export default function OnboardingPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Get started with DocuHive
          </h1>
          <p className="mt-2 text-muted-foreground">
            Three quick steps to start generating UK-compliant documents
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="group relative flex items-start gap-5 rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Step number */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-card-foreground">
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 shrink-0"
                >
                  {step.actionLabel}
                  <ChevronRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Skip link */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip setup — go to dashboard
          </Link>
        </div>
      </div>
    </DashboardShell>
  )
}