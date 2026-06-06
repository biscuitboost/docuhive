"use client"

import { useState } from "react"
import { UK_TAX_RATES } from "@/lib/utils/constants"
import { cn } from "@/lib/utils/cn"

// Employer Secondary NI threshold (£9,100 annual = £175/week)
// This is different from the employee Primary Threshold (£12,570)
const NI_THRESHOLD_ANNUAL = UK_TAX_RATES.ni.secondaryThreshold.annual
const NI_RATE = UK_TAX_RATES.ni.employerRate
const PENSION_EMPLOYER_RATE = 0.03
const PENSION_THRESHOLD_ANNUAL = 6240

const SOLICITOR_ANNUAL = 1500
const DOCUHIVE_ANNUAL = 79 * 12

function calculateCosts(salary: number) {
  const niGross = Math.max(0, salary - NI_THRESHOLD_ANNUAL)
  const employerNi = niGross * NI_RATE

  const pensionGross = Math.max(0, salary - PENSION_THRESHOLD_ANNUAL)
  const employerPension = pensionGross * PENSION_EMPLOYER_RATE

  const totalCost = salary + employerNi + employerPension

  return {
    employerNi: Math.round(employerNi),
    employerPension: Math.round(employerPension),
    totalCost: Math.round(totalCost),
    solicitorCost: SOLICITOR_ANNUAL,
    docuHiveAnnual: DOCUHIVE_ANNUAL,
    annualSaving: Math.round(SOLICITOR_ANNUAL - DOCUHIVE_ANNUAL),
  }
}

export default function Calculator() {
  const [salary, setSalary] = useState<number>(25000)

  const costs = calculateCosts(salary)

  return (
    <section id="calculator" className="bg-muted/50 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cost of Hiring Calculator
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See the true cost of an employee &mdash; and how much DocuHive saves you vs. solicitors.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-8">
            <label
              htmlFor="salary"
              className="block text-sm font-medium text-foreground mb-3"
            >
              Annual salary: &#xA3;{salary.toLocaleString()}
            </label>
            <input
              id="salary"
              type="range"
              min={12000}
              max={120000}
              step={1000}
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>&#xA3;12,000</span>
              <span>&#xA3;120,000</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/50 p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Employer NI</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                &#xA3;{costs.employerNi.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">per year</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Employer Pension</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                &#xA3;{costs.employerPension.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">per year (3% min)</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-xs text-primary uppercase tracking-wide">Total Employer Cost</p>
              <p className="mt-2 text-2xl font-bold text-primary">
                &#xA3;{costs.totalCost.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">per year</p>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-wide">
              DocuHive Savings
            </h4>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Solicitor fees for initial contracts and annual updates cost around&nbsp;
              <span className="font-semibold text-foreground">
                &#xA3;{costs.solicitorCost.toLocaleString()}
              </span>
              &nbsp;per year. DocuHive Pro costs just &#xA3;{costs.docuHiveAnnual}&nbsp;/ year.
            </p>
            <p className="mt-4 text-3xl font-bold text-emerald-500">
              Save up to &#xA3;{costs.annualSaving.toLocaleString()}&nbsp;
              <span className="text-base font-normal text-emerald-500/70">/ year</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
