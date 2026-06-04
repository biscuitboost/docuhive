"use client"

import { useState } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import { UK_TAX_RATES } from "@/lib/utils/constants"
import Link from "next/link"
import { ArrowLeftRight, Info, HelpCircle } from "lucide-react"
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

export default function DividendCalculatorPage() {
  const [dividends, setDividends] = useState<string>("")
  const [otherIncome, setOtherIncome] = useState<string>("")
  const [period, setPeriod] = useState<Period>("annual")
  const [showBreakdown, setShowBreakdown] = useState(false)

  const numericDividends = parseFloat(dividends) || 0
  const numericOtherIncome = parseFloat(otherIncome) || 0
  const annualDividends = numericDividends * PERIOD_MULTIPLIER[period]
  const annualOtherIncome = numericOtherIncome * PERIOD_MULTIPLIER[period]
  const totalIncome = annualDividends + annualOtherIncome
  const divisor = PERIOD_MULTIPLIER[period]

  const DIV = UK_TAX_RATES.dividendTax
  const PA = UK_TAX_RATES.personalAllowance
  const BASIC_MAX = UK_TAX_RATES.basicRate.threshold // £50,270
  const HIGHER_MAX = UK_TAX_RATES.higherRate.threshold // £125,140

  // ── Personal Allowance tapering ──
  const adjustedPA = Math.max(0, PA - Math.max(0, (totalIncome - 100000) / 2))

  // ── Dividend Tax Calculation ──
  // Dividend allowance: first £500 of dividends are tax-free
  // Remaining dividends taxed at rates based on which tax band they land in
  let dividendTax = 0
  let basicRateDividends = 0
  let higherRateDividends = 0
  let additionalRateDividends = 0
  let dividendAllowanceUsed = 0
  let taxableDividends = 0

  if (annualDividends > 0) {
    // Dividend allowance is the first £500 of dividends — always tax-free
    dividendAllowanceUsed = Math.min(DIV.allowance, annualDividends)
    taxableDividends = annualDividends - dividendAllowanceUsed

    if (taxableDividends > 0) {
      // Determine which rate band the dividends fall into
      // Dividends are the top slice of income (after other income)
      // Basic rate band: adjustedPA to BASIC_MAX
      const basicRateRemaining = Math.max(0, BASIC_MAX - Math.max(adjustedPA, annualOtherIncome))
      // Higher rate band: BASIC_MAX to HIGHER_MAX
      const higherRateRemaining = Math.max(0, HIGHER_MAX - BASIC_MAX)

      if (taxableDividends <= basicRateRemaining) {
        // All dividends in basic rate band
        basicRateDividends = taxableDividends
      } else {
        basicRateDividends = basicRateRemaining
        const afterBasic = taxableDividends - basicRateRemaining
        if (afterBasic <= higherRateRemaining) {
          higherRateDividends = afterBasic
        } else {
          higherRateDividends = higherRateRemaining
          additionalRateDividends = afterBasic - higherRateRemaining
        }
      }
    }
  }

  dividendTax =
    basicRateDividends * DIV.basicRate +
    higherRateDividends * DIV.higherRate +
    additionalRateDividends * DIV.additionalRate

  const netDividendsAnnual = annualDividends - dividendTax

  // Scale to period
  const periodDividends = Math.round((annualDividends / divisor) * 100) / 100
  const periodDividendTax = Math.round((dividendTax / divisor) * 100) / 100
  const periodNetDividends = Math.round((netDividendsAnnual / divisor) * 100) / 100
  const periodOtherIncome = Math.round((annualOtherIncome / divisor) * 100) / 100

  // Effective tax rate on dividends
  const effectiveRate =
    annualDividends > 0 ? (dividendTax / annualDividends) * 100 : 0

  // Rate band display
  const getRateBand = () => {
    if (totalIncome <= 0) return "—"
    if (totalIncome <= adjustedPA + DIV.allowance) return "No tax due"
    if (totalIncome <= BASIC_MAX) return "Basic Rate"
    if (totalIncome <= HIGHER_MAX) return "Higher Rate"
    return "Additional Rate"
  }

  const breakdown: BreakdownRow[] = [
    { label: "Dividend Income", value: periodDividends },
    { label: "Dividend Allowance", value: Math.round((dividendAllowanceUsed / divisor) * 100) / 100, accent: true, tooltip: "The first £500 of dividend income is tax-free (2024/25)" },
    { label: "Taxable Dividends", value: Math.round((taxableDividends / divisor) * 100) / 100, accent: true },
    { label: "Dividend Tax Due", value: periodDividendTax, highlight: true },
    { label: "Net Dividends", value: periodNetDividends, accent: true },
  ]

  if (parseFloat(otherIncome) > 0) {
    breakdown.splice(4, 0, { label: "Other Income", value: periodOtherIncome, accent: true })
  }

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dividend Calculator</h1>
        <p className="mt-1.5 text-muted-foreground">
          Calculate dividend tax and net income from dividend payments (2024/25 tax year)
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

          {/* Dividend input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Total Dividend Payment ({PERIOD_LABELS[period]})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <input
                type="number"
                inputMode="decimal"
                value={dividends}
                onChange={(e) => setDividends(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Other income input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Other Income (salary, pension, etc.) — optional
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <input
                type="number"
                inputMode="decimal"
                value={otherIncome}
                onChange={(e) => setOtherIncome(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              Include salary, self-employment profits, pension income — affects which tax band your dividends fall in
            </p>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {breakdown.map((row) => (
              <ResultRow key={row.label} {...row} />
            ))}
          </div>

          {/* Summary stats */}
          {parseFloat(dividends) > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Effective Dividend Tax Rate</p>
                <p className="text-sm font-bold tabular-nums text-card-foreground">
                  {effectiveRate.toFixed(2)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Rate Band</p>
                <p className="text-sm font-bold tabular-nums text-card-foreground">
                  {getRateBand()}
                </p>
              </div>
            </div>
          )}

          {/* Tax breakdown */}
          {(parseFloat(dividends) > 0 && taxableDividends > 0) && (
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
                  <h4 className="text-xs font-semibold text-card-foreground mb-2">Dividend Tax Breakdown ({PERIOD_LABELS[period]})</h4>
                  <MiniRow
                    label="Dividend Allowance (0%)"
                    value={Math.round((dividendAllowanceUsed / divisor) * 100) / 100}
                  />
                  {basicRateDividends > 0 && (
                    <MiniRow
                      label={`Basic Rate @ ${(DIV.basicRate * 100).toFixed(2)}%`}
                      value={Math.round((basicRateDividends / divisor) * 100) / 100}
                    />
                  )}
                  {higherRateDividends > 0 && (
                    <MiniRow
                      label={`Higher Rate @ ${(DIV.higherRate * 100).toFixed(2)}%`}
                      value={Math.round((higherRateDividends / divisor) * 100) / 100}
                    />
                  )}
                  {additionalRateDividends > 0 && (
                    <MiniRow
                      label={`Additional Rate @ ${(DIV.additionalRate * 100).toFixed(2)}%`}
                      value={Math.round((additionalRateDividends / divisor) * 100) / 100}
                    />
                  )}
                  <div className="border-t border-border pt-2 mt-2">
                    <MiniRow
                      label="Total Dividend Tax"
                      value={periodDividendTax}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Rate band explanation */}
          <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-3">
            <div className="flex gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <p className="font-semibold mb-1">2024/25 Dividend Tax Rates</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>First <strong>£{DIV.allowance.toLocaleString()}</strong>: <strong>0%</strong> (Dividend Allowance)</li>
                  <li>Basic rate band: <strong>{(DIV.basicRate * 100).toFixed(2)}%</strong></li>
                  <li>Higher rate band: <strong>{(DIV.higherRate * 100).toFixed(2)}%</strong></li>
                  <li>Additional rate band: <strong>{(DIV.additionalRate * 100).toFixed(2)}%</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Info note */}
          <p className="mt-6 text-[11px] text-muted-foreground/60 leading-relaxed">
            Calculations are for the 2024/25 tax year and are for guidance only. They assume the standard dividend allowance
            and do not account for pension contributions, marriage allowance, or other reliefs.
            Always consult HMRC or a qualified accountant for official calculations.
          </p>

          {/* Conversion CTA */}
          {numericDividends > 0 && (
            <ToolConversionCTA
              href="/documents/new/payslip"
              action="Generate a Payslip"
              subtitle="with your dividend income for director payroll — get a professional PDF payslip"
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
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-56 bg-popover text-popover-foreground text-[10px] rounded-lg border border-border px-2 py-1 shadow-sm z-10 text-center">
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