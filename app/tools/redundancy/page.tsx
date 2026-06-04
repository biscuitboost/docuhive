"use client"

import { useState, useMemo } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import Link from "next/link"
import { Calculator, Info, AlertCircle, Download } from "lucide-react"

interface YearBand {
  label: string
  years: number
  rate: number
  amount: number
}

const CAP = 719 // weekly pay cap (2025/26)
const MAX_YEARS = 20
const TAX_FREE_LIMIT = 30000

const AGE_BRACKETS = [
  { min: 0, max: 21, label: "Under 22", rate: 0.5 },
  { min: 22, max: 40, label: "22–40", rate: 1 },
  { min: 41, max: 200, label: "41+", rate: 1.5 },
]

export default function RedundancyCalculatorPage() {
  const [weeklyPay, setWeeklyPay] = useState("")
  const [ageBracket, setAgeBracket] = useState<number>(1) // index into AGE_BRACKETS
  const [serviceYears, setServiceYears] = useState("")

  const weeklyPayNum = parseFloat(weeklyPay) || 0
  const effectiveWeeklyPay = Math.min(weeklyPayNum, CAP)
  const serviceYearsNum = Math.min(parseInt(serviceYears) || 0, MAX_YEARS)
  const rate = AGE_BRACKETS[ageBracket]?.rate ?? 1

  // Build year-by-year breakdown
  const breakdown: YearBand[] = useMemo(() => {
    if (!serviceYearsNum || !effectiveWeeklyPay) return []
    const bands: YearBand[] = []
    const years = Math.min(serviceYearsNum, MAX_YEARS)

    // First, determine the per-year rate based on age
    // For simplicity: the user selects current age bracket, which applies
    // to all years of service (the standard approach for quick calculators)
    for (let y = 1; y <= years; y++) {
      bands.push({
        label: `Year ${y}`,
        years: 1,
        rate,
        amount: effectiveWeeklyPay * rate,
      })
    }
    return bands
  }, [serviceYearsNum, effectiveWeeklyPay, rate])

  const totalRedundancyPay = breakdown.reduce((s, b) => s + b.amount, 0)
  const taxablePortion = Math.max(0, totalRedundancyPay - TAX_FREE_LIMIT)
  const taxFreePortion = Math.min(totalRedundancyPay, TAX_FREE_LIMIT)

  // ── CSV export ──
  const handleExportCSV = () => {
    if (breakdown.length === 0) return
    const header = "Year of Service,Multiplier,Amount\n"
    const rows = breakdown.map((b) => `${b.label},${b.rate}x weekly pay,£${b.amount.toFixed(2)}`).join("\n")
    const totals = `\n,,£${totalRedundancyPay.toFixed(2)}`
    const blob = new Blob([header + rows + totals], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `redundancy-calc-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Redundancy Calculator</h1>
        <p className="mt-1.5 text-muted-foreground">
          Calculate statutory redundancy pay based on age, weekly pay, and years of service
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* ── Input form ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Calculator size={16} className="text-primary" />
            Employee Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Weekly pay */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">
                Weekly Pay
                <span className="text-muted-foreground ml-1 font-normal">
                  (capped at {fmt(CAP)})
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weeklyPay}
                  onChange={(e) => setWeeklyPay(e.target.value)}
                  placeholder="e.g. 600"
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
              </div>
              {weeklyPayNum > CAP && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Info size={11} />
                  Capped at statutory limit of {fmt(CAP)}/week
                </p>
              )}
            </div>

            {/* Full years of service */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">
                Full Years of Service
                <span className="text-muted-foreground ml-1 font-normal">(max 20)</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={serviceYears}
                onChange={(e) => setServiceYears(e.target.value)}
                placeholder="e.g. 5"
                min={0}
                max={MAX_YEARS}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
              />
            </div>
          </div>

          {/* Age bracket */}
          <label className="block text-xs font-medium text-card-foreground mb-2">
            Age Bracket — determines the weekly multiplier
          </label>
          <div className="flex gap-2">
            {AGE_BRACKETS.map((bracket, idx) => (
              <button
                key={bracket.label}
                onClick={() => setAgeBracket(idx)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  ageBracket === idx
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {bracket.label}
                <span className="block text-[11px] font-normal mt-0.5 opacity-70">
                  {bracket.rate}x weekly pay
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Results ── */}
        {totalRedundancyPay > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Total Redundancy Pay</p>
                <p className="text-2xl font-bold tabular-nums text-card-foreground">{fmt(totalRedundancyPay)}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Tax-Free Amount</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600">{fmt(taxFreePortion)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Potentially Taxable</p>
                <p className={`text-2xl font-bold tabular-nums ${taxablePortion > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {fmt(taxablePortion)}
                </p>
              </div>
            </div>

            {/* ── Year-by-year breakdown ── */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Info size={16} className="text-primary" />
                  Year-by-Year Breakdown
                </h2>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  <Download size={14} />
                  CSV
                </button>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Year</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Multiplier</th>
                    <th className="text-right py-2 pl-3 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((b) => (
                    <tr key={b.label} className="border-b border-border/50 last:border-b-0">
                      <td className="py-2 pr-4 text-card-foreground">{b.label}</td>
                      <td className="py-2 px-3 text-muted-foreground">{b.rate}x week&rsquo;s pay</td>
                      <td className="py-2 pl-3 text-right tabular-nums font-medium text-card-foreground">{fmt(b.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border">
                    <td className="pt-3 pr-4 font-semibold text-card-foreground">Total</td>
                    <td className="pt-3 px-3"></td>
                    <td className="pt-3 pl-3 text-right tabular-nums font-bold text-card-foreground">{fmt(totalRedundancyPay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Summary of inputs ── */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm mb-6">
              <h3 className="text-xs font-semibold text-card-foreground mb-2">Calculation Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Age bracket:</span>
                  <p className="font-medium text-card-foreground">{AGE_BRACKETS[ageBracket].label}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Weekly pay:</span>
                  <p className="font-medium text-card-foreground">{fmt(effectiveWeeklyPay)}/wk{weeklyPayNum > CAP && " (capped)"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Service:</span>
                  <p className="font-medium text-card-foreground">{serviceYearsNum} year{serviceYearsNum !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Multiplier:</span>
                  <p className="font-medium text-card-foreground">{rate}x weekly pay per year</p>
                </div>
              </div>
            </div>

            {/* ── Info box ── */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-4 flex items-start gap-3 mb-6">
              <AlertCircle size={18} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">How Statutory Redundancy Pay Works</p>
                <ul className="mt-1.5 text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Under 22: 0.5 weeks&rsquo; pay per full year of service</li>
                  <li>22&ndash;40: 1 week&rsquo;s pay per full year of service</li>
                  <li>41+: 1.5 weeks&rsquo; pay per full year of service</li>
                  <li>Maximum 20 years of service counted</li>
                  <li>Weekly pay capped at {fmt(CAP)} (2025/26 rate)</li>
                  <li>First {fmt(TAX_FREE_LIMIT)} is tax-free</li>
                  <li>Only full continuous years of service are counted &mdash; part years don&rsquo;t qualify</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {totalRedundancyPay === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center">
            <Calculator size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-card-foreground">Enter employee details</p>
            <p className="text-xs text-muted-foreground mt-1">Add their weekly pay, years of service, and age bracket to calculate statutory redundancy pay.</p>
          </div>
        )}

        {/* ── Footer disclaimer ── */}
        <p className="text-[11px] text-muted-foreground/60 text-center mt-6">
          For guidance only — your employees may be entitled to more under their employment contract
          (contractual redundancy). Check with HR or an employment solicitor. Data stays in your browser.
        </p>
      </div>
    </DashboardShell>
  )
}