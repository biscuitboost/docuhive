"use client"

import { useState } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import { UK_TAX_RATES } from "@/lib/utils/constants"
import Link from "next/link"
import { ArrowLeftRight, Info } from "lucide-react"

type Period = "annual" | "monthly"

const PERIOD_LABELS: Record<Period, string> = {
  annual: "per year",
  monthly: "per month",
}

const PERIOD_MULTIPLIER: Record<Period, number> = {
  annual: 1,
  monthly: 12,
}

const CT = UK_TAX_RATES.corporationTax

interface BreakdownRow {
  label: string
  value: number | string
  highlight?: boolean
  accent?: boolean
  info?: string
}

export default function CorporationTaxCalculatorPage() {
  const [profit, setProfit] = useState<string>("")
  const [period, setPeriod] = useState<Period>("annual")
  const [showBreakdown, setShowBreakdown] = useState(false)

  const numericProfit = parseFloat(profit) || 0
  const annualProfit = numericProfit * PERIOD_MULTIPLIER[period]
  const divisor = PERIOD_MULTIPLIER[period]

  // ── Corporation Tax Calculation (2024/25) ──
  let rateLabel = ""
  let tax = 0
  let marginalRelief = 0
  let effectiveRate = 0
  let taxAtMainRate = 0

  if (annualProfit <= 0) {
    rateLabel = "No profit — no tax due"
  } else if (annualProfit <= CT.marginalReliefLowerLimit) {
    // Small profits rate
    tax = annualProfit * CT.smallProfitsRate
    rateLabel = `Small Profits Rate (${(CT.smallProfitsRate * 100).toFixed(0)}%)`
  } else if (annualProfit >= CT.marginalReliefUpperLimit) {
    // Main rate
    tax = annualProfit * CT.mainRate
    rateLabel = `Main Rate (${(CT.mainRate * 100).toFixed(0)}%)`
  } else {
    // Marginal relief band
    taxAtMainRate = annualProfit * CT.mainRate
    marginalRelief = (CT.marginalReliefUpperLimit - annualProfit) * CT.marginalReliefFraction
    tax = taxAtMainRate - marginalRelief
    rateLabel = `Marginal Relief (${(CT.mainRate * 100).toFixed(0)}% less relief)`
  }

  effectiveRate = annualProfit > 0 ? (tax / annualProfit) * 100 : 0

  const periodTax = Math.round((tax / divisor) * 100) / 100
  const periodProfit = Math.round((annualProfit / divisor) * 100) / 100

  const breakdown: BreakdownRow[] = [
    { label: "Taxable Profit", value: periodProfit, highlight: false },
    { label: "Applicable Rate", value: rateLabel, accent: true },
    { label: "Corporation Tax Due", value: periodTax, highlight: true },
    { label: "Profit After Tax", value: Math.round(((annualProfit - tax) / divisor) * 100) / 100, accent: true },
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Corporation Tax Calculator</h1>
        <p className="mt-1.5 text-muted-foreground">
          Estimate your corporation tax liability for the 2024/25 tax year — small profits rate (19%), main rate (25%), or marginal relief
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Period selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">Reporting Period</label>
            <div className="flex gap-2">
              {(["annual", "monthly"] as Period[]).map((p) => (
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

          {/* Profit input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Estimated Taxable Profit ({PERIOD_LABELS[period]})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <input
                type="number"
                inputMode="decimal"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
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
          {parseFloat(profit) > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Effective Tax Rate</p>
                <p className="text-sm font-bold tabular-nums text-card-foreground">
                  {effectiveRate.toFixed(2)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">Rate Band</p>
                <p className="text-sm font-bold tabular-nums text-card-foreground">
                  {annualProfit <= 0
                    ? "—"
                    : annualProfit <= CT.marginalReliefLowerLimit
                      ? "Small Profits"
                      : annualProfit >= CT.marginalReliefUpperLimit
                        ? "Main Rate"
                        : "Marginal Relief"}
                </p>
              </div>
            </div>
          )}

          {/* Detailed breakdown */}
          {parseFloat(profit) > 0 && annualProfit > CT.marginalReliefLowerLimit && annualProfit < CT.marginalReliefUpperLimit && (
            <>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ArrowLeftRight size={14} />
                {showBreakdown ? "Hide" : "Show"} Marginal Relief Calculation
              </button>

              {showBreakdown && (
                <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="text-xs font-semibold text-card-foreground mb-2">Marginal Relief Breakdown (per year)</h4>
                  <MiniRow
                    label="Tax at Main Rate (25%)"
                    value={Math.round(taxAtMainRate * 100) / 100}
                  />
                  <MiniRow
                    label="Marginal Relief"
                    value={Math.round(marginalRelief * 100) / 100}
                  />
                  <MiniRow
                    label="Upper Limit — Profit"
                    value={CT.marginalReliefUpperLimit - annualProfit}
                  />
                  <MiniRow
                    label="Relief Fraction"
                    value={`1/40 (${(CT.marginalReliefFraction * 100).toFixed(1)}%)`}
                    isString
                  />
                </div>
              )}
            </>
          )}

          {/* Rate band explanation */}
          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20 p-3">
            <div className="flex gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                <p className="font-semibold mb-1">2024/25 Corporation Tax Rates</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Profits ≤ £50k: <strong>{(CT.smallProfitsRate * 100).toFixed(0)}%</strong> (Small Profits Rate)</li>
                  <li>£50k – £250k: <strong>{(CT.mainRate * 100).toFixed(0)}%</strong> less Marginal Relief</li>
                  <li>Profits ≥ £250k: <strong>{(CT.mainRate * 100).toFixed(0)}%</strong> (Main Rate)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Info note */}
          <p className="mt-6 text-[11px] text-muted-foreground/60 leading-relaxed">
            Calculations are for the 2024/25 tax year and are for guidance only. They assume standard corporation tax rules
            and do not account for capital allowances, R&amp;D relief, losses carried forward, or other adjustments.
            Always consult HMRC or a qualified accountant for official calculations.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}

function ResultRow({ label, value, highlight, accent, info }: BreakdownRow) {
  const displayValue = typeof value === "number"
    ? `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value

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
        {info && (
          <span className="group relative inline-flex" title={info}>
            <Info size={13} className="text-muted-foreground/40" />
          </span>
        )}
      </span>
      <span
        className={`text-lg font-bold tabular-nums ${
          highlight ? "text-primary" : "text-card-foreground"
        }`}
      >
        {displayValue}
      </span>
    </div>
  )
}

function MiniRow({ label, value, isString }: { label: string; value: number | string; isString?: boolean }) {
  const displayValue = isString
    ? value
    : `£${(value as number).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums text-card-foreground">
        {displayValue}
      </span>
    </div>
  )
}