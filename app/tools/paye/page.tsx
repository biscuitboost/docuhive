"use client"

import { useState } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import { UK_TAX_RATES } from "@/lib/utils/constants"
import Link from "next/link"
import { ArrowLeftRight, HelpCircle } from "lucide-react"
import ToolConversionCTA from "@/components/tools/ToolConversionCTA"

type Period = "annual" | "monthly" | "weekly"

const PERIOD_LABELS: Record<Period, string> = {
  annual: "per year",
  monthly: "per month",
  weekly: "per week",
}

const PERIOD_MULTIPLIER: Record<Period, number> = {
  annual: 1,
  monthly: 12,
  weekly: 52,
}

interface BreakdownRow {
  label: string
  value: number
  highlight?: boolean
  accent?: boolean
  tooltip?: string
}

export default function PAYECalculatorPage() {
  const [salary, setSalary] = useState<string>("")
  const [period, setPeriod] = useState<Period>("annual")
  const [showBreakdown, setShowBreakdown] = useState(false)

  const numericSalary = parseFloat(salary) || 0
  const annualSalary = numericSalary * PERIOD_MULTIPLIER[period]

  // ── Income Tax Calculation (2024/25) ──
  const personalAllowance = Math.max(0, UK_TAX_RATES.personalAllowance -
    Math.max(0, (annualSalary - 100000) / 2))

  let tax = 0
  let basicTax = 0
  let higherTax = 0
  let additionalTax = 0
  let remaining = annualSalary - personalAllowance

  if (remaining > 0) {
    const basicBand = Math.min(remaining, UK_TAX_RATES.basicRate.threshold - UK_TAX_RATES.personalAllowance)
    basicTax = basicBand * UK_TAX_RATES.basicRate.rate
    remaining -= basicBand
  }
  if (remaining > 0) {
    const higherBand = Math.min(remaining, UK_TAX_RATES.higherRate.threshold - UK_TAX_RATES.basicRate.threshold)
    higherTax = higherBand * UK_TAX_RATES.higherRate.rate
    remaining -= higherBand
  }
  if (remaining > 0) {
    additionalTax = remaining * UK_TAX_RATES.additionalRate.rate
  }

  tax = basicTax + higherTax + additionalTax

  // ── National Insurance (Class 1, employee) ──
  const niThreshold = UK_TAX_RATES.ni.primaryThreshold.annual
  const niUpperLimit = UK_TAX_RATES.ni.upperEarningsLimit.annual

  let ni = 0
  if (annualSalary > niThreshold) {
    const niBand = Math.min(annualSalary - niThreshold, niUpperLimit - niThreshold)
    ni += niBand * UK_TAX_RATES.ni.mainRate
  }
  if (annualSalary > niUpperLimit) {
    ni += (annualSalary - niUpperLimit) * UK_TAX_RATES.ni.higherRate
  }

  // ── Net Pay ──
  const deductions = tax + ni
  const netAnnual = annualSalary - deductions

  // Scale back to period
  const divisor = PERIOD_MULTIPLIER[period]
  const periodTax = Math.round((tax / divisor) * 100) / 100
  const periodNi = Math.round((ni / divisor) * 100) / 100
  const periodDeductions = Math.round((deductions / divisor) * 100) / 100
  const periodNet = Math.round((netAnnual / divisor) * 100) / 100
  const periodSalary = Math.round((annualSalary / divisor) * 100) / 100

  // Employer NI
  const employerNi = annualSalary > niThreshold
    ? Math.min(
        (annualSalary - niThreshold) * 0.138,
        (annualSalary - niThreshold) * 0.138
      )
    : 0
  const employerNiRounded = Math.round((employerNi / divisor) * 100) / 100

  // Effective tax rates
  const effectiveTaxRate = annualSalary > 0 ? (tax / annualSalary) * 100 : 0

  const breakdown: BreakdownRow[] = [
    { label: "Gross Salary", value: periodSalary, highlight: false },
    { label: "Personal Allowance", value: Math.round((personalAllowance / divisor) * 100) / 100, accent: true },
    { label: "Income Tax", value: periodTax, accent: true },
    { label: "National Insurance (Employee)", value: periodNi, accent: true },
    { label: "Employer's NI Contribution", value: employerNiRounded, accent: true, tooltip: "This is paid by your employer on top of your salary" },
    { label: "Total Deductions", value: periodDeductions, accent: true },
    { label: "Take-Home Pay", value: periodNet, highlight: true },
  ]

  return (
    <DashboardShell>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Tools
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">PAYE Calculator</h1>
        <p className="mt-1.5 text-muted-foreground">
          Calculate income tax, National Insurance, and take-home pay for employees and directors (2024/25 tax year)
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Period selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">Pay Period</label>
            <div className="flex gap-2">
              {(["annual", "monthly", "weekly"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    period === p
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Salary input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Gross Salary ({PERIOD_LABELS[period]})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <input
                type="number"
                inputMode="decimal"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {breakdown.map((row) => (
              <ResultRow key={row.label} {...row} />
            ))}
          </div>

          {/* Summary stats */}
          {parseFloat(salary) > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Effective Tax Rate</p>
                <p className="text-sm font-bold tabular-nums text-card-foreground">
                  {effectiveTaxRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Net Pay Percentage</p>
                <p className="text-sm font-bold tabular-nums text-card-foreground">
                  {annualSalary > 0 ? ((netAnnual / annualSalary) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>
            </div>
          )}

          {/* Tax breakdown */}
          {parseFloat(salary) > 0 && (
            <>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ArrowLeftRight size={14} />
                {showBreakdown ? "Hide" : "Show"} Detailed Tax Breakdown
              </button>

              {showBreakdown && (
                <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="text-xs font-semibold text-card-foreground mb-2">Income Tax Breakdown ({PERIOD_LABELS[period]})</h4>
                  <MiniRow label="Personal Allowance" value={Math.max(0, Math.round((personalAllowance / divisor) * 100) / 100)} />
                  <MiniRow label="Basic Rate (20%)" value={Math.round((basicTax / divisor) * 100) / 100} />
                  <MiniRow label="Higher Rate (40%)" value={Math.round((higherTax / divisor) * 100) / 100} />
                  <MiniRow label="Additional Rate (45%)" value={Math.round((additionalTax / divisor) * 100) / 100} />
                </div>
              )}
            </>
          )}

          {/* Info note */}
          <p className="mt-6 text-[11px] text-muted-foreground/60 leading-relaxed">
            Calculations are for the 2024/25 tax year and are for guidance only. They assume standard tax code (1257L)
            and do not account for pension contributions, student loan repayments, or other deductions.
            Always consult HMRC or a qualified accountant for official calculations.
          </p>

          {/* Conversion CTA — turn this calculation into a payslip */}
          {numericSalary > 0 && (
            <ToolConversionCTA
              href="/documents/new/payslip"
              action="Generate a Payslip"
              subtitle="with the tax &amp; NI calculated here — get a professional PDF payslip in seconds"
              icon="payslip"
            />
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function ResultRow({ label, value, highlight, accent, tooltip }: BreakdownRow) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-3 ${
        highlight
          ? "bg-primary/5 border border-primary/20"
          : accent
            ? "bg-muted/50"
            : ""
      }`}
    >
      <span className={`flex items-center gap-1.5 text-sm ${
        highlight ? "font-semibold text-primary" : "text-muted-foreground"
      }`}>
        {label}
        {tooltip && (
          <span className="group relative inline-flex" title={tooltip}>
            <HelpCircle size={13} className="text-muted-foreground/40" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 bg-popover text-popover-foreground text-[10px] rounded-lg border border-border px-2 py-1 shadow-sm z-10 text-center">
              {tooltip}
            </span>
          </span>
        )}
      </span>
      <span
        className={`text-lg font-bold tabular-nums ${
          highlight ? "text-primary" : "text-card-foreground"
        }`}
      >
        £{value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}

function MiniRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums text-card-foreground">
        £{value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}