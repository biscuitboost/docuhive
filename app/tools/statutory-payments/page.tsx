"use client"

import { useState } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import Link from "next/link"
import { CalendarDays, Info, HelpCircle, Banknote } from "lucide-react"
import ToolConversionCTA from "@/components/tools/ToolConversionCTA"
import { UK_TAX_RATES } from "@/lib/utils/constants"

// ── Constants ──────────────────────────────────────────────────────

const SspConfig = UK_TAX_RATES.statutoryPayments.ssp
const SSP_WEEKLY = SspConfig.weekly // £123.25
const SSP_MAX_WEEKS = 28
const PARENTAL_WEEKLY = UK_TAX_RATES.statutoryPayments.statutoryFlatRate // £194.32
const SSP_ELIGIBILITY_THRESHOLD = UK_TAX_RATES.ni.lowerEarningsLimit.weekly // £129

type PaymentType = "ssp" | "smp" | "spp" | "sap" | "shpp" | "spbp"

interface PaymentTypeConfig {
  value: PaymentType
  label: string
  shortLabel: string
  description: string
  weeklyRate: number // flat rate (used when > 90% AWE)
  durationWeeks: number
  firstSixWeeks?: boolean // SMP/SAP have first 6 weeks at full 90%
}

const PAYMENT_TYPES: PaymentTypeConfig[] = [
  {
    value: "ssp",
    label: "Statutory Sick Pay",
    shortLabel: "SSP",
    description: "For employees unable to work due to illness",
    weeklyRate: SSP_WEEKLY,
    durationWeeks: 28,
  },
  {
    value: "smp",
    label: "Statutory Maternity Pay",
    shortLabel: "SMP",
    description: "For employees on maternity leave",
    weeklyRate: PARENTAL_WEEKLY,
    durationWeeks: 39,
    firstSixWeeks: true,
  },
  {
    value: "spp",
    label: "Statutory Paternity Pay",
    shortLabel: "SPP",
    description: "For partners on paternity leave",
    weeklyRate: PARENTAL_WEEKLY,
    durationWeeks: 2,
  },
  {
    value: "sap",
    label: "Statutory Adoption Pay",
    shortLabel: "SAP",
    description: "For employees on adoption leave",
    weeklyRate: PARENTAL_WEEKLY,
    durationWeeks: 39,
    firstSixWeeks: true,
  },
  {
    value: "shpp",
    label: "Shared Parental Pay",
    shortLabel: "ShPP",
    description: "For parents sharing childcare leave",
    weeklyRate: PARENTAL_WEEKLY,
    durationWeeks: 37,
  },
  {
    value: "spbp",
    label: "Statutory Parental Bereavement Pay",
    shortLabel: "SPBP",
    description: "For employees after the death of a child",
    weeklyRate: PARENTAL_WEEKLY,
    durationWeeks: 2,
  },
]

const WEEKLY_QUALIFYING_DAYS = [1, 2, 3, 4, 5, 6, 7] as const

interface BreakdownRow {
  label: string
  value: string
  highlight?: boolean
  accent?: boolean
  tooltip?: string
}

export default function StatutoryPaymentsPage() {
  const [paymentType, setPaymentType] = useState<PaymentType>("ssp")
  const [awe, setAwe] = useState<string>("") // average weekly earnings
  const [qualifyingDays, setQualifyingDays] = useState<number>(5)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const config = PAYMENT_TYPES.find((t) => t.value === paymentType)!
  const numericAwe = parseFloat(awe) || 0

  // ── Calculations ──
  const isParentalType = config.value !== "ssp"

  // For SSP: determine daily rate and weekly rate
  const sspDailyRate = SSP_WEEKLY / qualifyingDays
  const isSspEligible = numericAwe >= SSP_ELIGIBILITY_THRESHOLD // Lower Earnings Limit

  // For parental payments: 90% AWE vs flat rate, choose lower
  const ninetyPercentAwe = numericAwe * 0.9
  let weeklyPayment = 0
  let firstSixWeeksPayment = 0
  let remainingWeeksPayment = 0

  if (paymentType === "ssp") {
    weeklyPayment = numericAwe > 0 ? Math.min(numericAwe * 0.8, SSP_WEEKLY) : SSP_WEEKLY
  } else if (config.firstSixWeeks) {
    // SMP/SAP: first 6 weeks at 90% AWE, remaining at lower of flat rate or 90% AWE
    firstSixWeeksPayment = ninetyPercentAwe
    remainingWeeksPayment = Math.min(PARENTAL_WEEKLY, ninetyPercentAwe)
    weeklyPayment = firstSixWeeksPayment // just for display in the result card
  } else {
    // SPP/ShPP/SPBP: lower of flat rate or 90% AWE
    weeklyPayment = Math.min(PARENTAL_WEEKLY, ninetyPercentAwe)
  }

  // Duration
  let totalEntitlement = 0
  let firstSixWeeksTotal = 0
  let remainingTotal = 0
  if (config.firstSixWeeks && numericAwe > 0) {
    firstSixWeeksTotal = firstSixWeeksPayment * 6
    const remainingWeeks = config.durationWeeks - 6 // 33 for SMP/SAP
    remainingTotal = remainingWeeksPayment * remainingWeeks
    totalEntitlement = firstSixWeeksTotal + remainingTotal
  } else if (numericAwe > 0 || paymentType === "ssp") {
    totalEntitlement = weeklyPayment * config.durationWeeks
  }

  // ── Breakdown rows ──
  const breakdown: BreakdownRow[] = []

  if (paymentType === "ssp") {
    breakdown.push(
      { label: "Weekly SSP Flat Rate", value: `£${SSP_WEEKLY.toFixed(2)}`, accent: true },
      { label: "80% of AWE", value: numericAwe > 0 ? `£${(numericAwe * 0.8).toFixed(2)}` : "N/A", accent: true },
      { label: "Effective Weekly Rate", value: `£${weeklyPayment.toFixed(2)}`, accent: true, tooltip: "Lower of £123.25/week flat rate and 80% of AWE (day 1 SSP rules)" },
      { label: "Qualifying Days per Week", value: `${qualifyingDays} day(s)`, accent: true },
      { label: "Daily Rate", value: `£${(weeklyPayment / qualifyingDays).toFixed(2)}`, accent: true },
      { label: "Maximum Duration", value: `${SSP_MAX_WEEKS} weeks`, accent: true },
    )
    if (numericAwe > 0) {
      breakdown.push({
        label: `AWE Check (min. £${SSP_ELIGIBILITY_THRESHOLD}/week)`,
        value: isSspEligible ? "✓ Eligible" : "✗ Below threshold",
        highlight: true,
        tooltip: `Employees must earn at least £${SSP_ELIGIBILITY_THRESHOLD}/week (Lower Earnings Limit) to qualify for SSP`,
      })
      if (isSspEligible) {
        breakdown.push({
          label: "Total SSP (28 weeks max)",
          value: `£${(weeklyPayment * SSP_MAX_WEEKS).toFixed(2)}`,
          highlight: true,
        })
      }
    }
  } else if (config.firstSixWeeks && numericAwe > 0) {
    // SMP / SAP
    breakdown.push(
      { label: "Average Weekly Earnings (AWE)", value: `£${numericAwe.toFixed(2)}`, accent: true },
      {
        label: "First 6 Weeks (90% AWE)",
        value: `£${firstSixWeeksPayment.toFixed(2)}/wk`,
        accent: true,
        tooltip: "First 6 weeks paid at 90% of your average weekly earnings",
      },
      {
        label: `Remaining ${config.durationWeeks - 6} Weeks`,
        value: `£${remainingWeeksPayment.toFixed(2)}/wk`,
        accent: true,
        tooltip:
          ninetyPercentAwe < PARENTAL_WEEKLY
            ? `Lower of 90% AWE (£${ninetyPercentAwe.toFixed(2)}) and flat rate (£${PARENTAL_WEEKLY.toFixed(2)})`
            : `Flat rate £${PARENTAL_WEEKLY.toFixed(2)} (90% AWE is higher)`,
      },
      { label: "Duration", value: `${config.durationWeeks} weeks`, accent: true },
      {
        label: "Total Entitlement",
        value: `£${totalEntitlement.toFixed(2)}`,
        highlight: true,
      },
    )
  } else if (numericAwe > 0) {
    // SPP / ShPP / SPBP
    breakdown.push(
      { label: "Average Weekly Earnings (AWE)", value: `£${numericAwe.toFixed(2)}`, accent: true },
      {
        label: "Weekly Rate",
        value: `£${weeklyPayment.toFixed(2)}`,
        accent: true,
        tooltip:
          ninetyPercentAwe < PARENTAL_WEEKLY
            ? `Lower of 90% AWE (£${ninetyPercentAwe.toFixed(2)}) and flat rate (£${PARENTAL_WEEKLY.toFixed(2)})`
            : `Flat rate £${PARENTAL_WEEKLY.toFixed(2)} (90% AWE is higher)`,
      },
      { label: "Duration", value: `${config.durationWeeks} weeks`, accent: true },
      {
        label: "Total Entitlement",
        value: `£${totalEntitlement.toFixed(2)}`,
        highlight: true,
      },
    )
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Statutory Payments Calculator
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Calculate SSP, SMP, SPP, and other statutory payments for UK employees
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Payment type selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Payment Type
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setPaymentType(t.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    paymentType === t.value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className="block font-semibold">{t.shortLabel}</span>
                  <span className="block text-[10px] font-normal mt-0.5 opacity-70">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4 rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            {config.description}. {isParentalType ? `Maximum ${config.durationWeeks} weeks at £${PARENTAL_WEEKLY.toFixed(2)}/wk or 90% of AWE.` : `Up to ${SSP_MAX_WEEKS} weeks at lower of 80% AWE and £${SSP_WEEKLY.toFixed(2)}/wk.`}
          </div>

          {/* Average Weekly Earnings input (all types except SSP) */}
          {isParentalType && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Average Weekly Earnings (AWE)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  £
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  value={awe}
                  onChange={(e) => setAwe(e.target.value)}
                  placeholder="500.00"
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                Enter the employee&apos;s average weekly earnings over the qualifying period (usually the last 8–26 weeks)
              </p>
            </div>
          )}

          {/* SSP-specific inputs */}
          {!isParentalType && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Average Weekly Earnings (AWE)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    £
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={awe}
                    onChange={(e) => setAwe(e.target.value)}
                    placeholder="500.00"
                    className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground/60">
                  Enter earnings to check eligibility (£{SSP_ELIGIBILITY_THRESHOLD}/week minimum for SSP)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Qualifying Days per Week
                </label>
                <div className="flex gap-2">
                  {WEEKLY_QUALIFYING_DAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setQualifyingDays(d)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        qualifyingDays === d
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground/60">
                  Number of days the employee normally works per week
                </p>
              </div>
            </>
          )}

          {/* Results */}
          {((isParentalType && numericAwe > 0) || (!isParentalType && numericAwe >= 0)) && (
            <>
              {paymentType === "ssp" && (
                <>
                  {numericAwe > 0 && (
                    <>
                      {isSspEligible ? (
                        <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                            <Info size={14} />
                            <span>Earnings above £{SSP_ELIGIBILITY_THRESHOLD}/week — employee qualifies for SSP</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                            <Info size={14} />
                            <span>Earnings below £{SSP_ELIGIBILITY_THRESHOLD}/week — employee does not qualify for SSP</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-3">
                    {breakdown.map((row) => (
                      <ResultRow key={row.label} {...row} />
                    ))}
                  </div>

                  {/* Summary cards for SSP */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Daily Rate</p>
                      <p className="text-sm font-bold tabular-nums text-card-foreground">
                        £{(weeklyPayment / qualifyingDays).toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Max Period</p>
                      <p className="text-sm font-bold tabular-nums text-card-foreground">
                        {SSP_MAX_WEEKS} weeks
                      </p>
                    </div>
                  </div>
                </>
              )}

              {isParentalType && numericAwe > 0 && (
                <>
                  {/* Eligibility badge */}
                  <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                      <Info size={14} />
                      <span>
                        Based on £{numericAwe.toFixed(2)}/week AWE &mdash; paying{" "}
                        {ninetyPercentAwe < PARENTAL_WEEKLY
                          ? `£${ninetyPercentAwe.toFixed(2)}/wk (90% AWE is lower than flat rate)`
                          : `£${PARENTAL_WEEKLY.toFixed(2)}/wk (flat rate)`}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3">
                {breakdown.map((row) => (
                  <ResultRow key={row.label} {...row} />
                ))}
              </div>

              {/* Summary cards */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground">Weekly Rate</p>
                  <p className="text-sm font-bold tabular-nums text-card-foreground">
                    £{weeklyPayment.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground">Duration</p>
                  <p className="text-sm font-bold tabular-nums text-card-foreground">
                    {config.durationWeeks} weeks
                  </p>
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground">Total</p>
                  <p className="text-sm font-bold tabular-nums text-primary">
                    £{totalEntitlement.toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {isParentalType && !numericAwe && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Banknote size={40} className="mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Enter average weekly earnings</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Enter AWE to calculate your statutory payment entitlement
              </p>
            </div>
          )}

          {!isParentalType && numericAwe <= 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays size={40} className="mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Enter employee earnings</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Enter weekly earnings and qualifying days to check SSP eligibility
              </p>
            </div>
          )}

          {/* Breakdown toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Info size={14} />
            {showBreakdown ? "Hide" : "Show"} How This Is Calculated
          </button>

          {showBreakdown && (
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
              {paymentType === "ssp" && (
                <>
                  <h4 className="text-xs font-semibold text-card-foreground mb-2">SSP Calculation (Day 1 Rules)</h4>
                  <MiniRow label="80% of AWE" value={numericAwe > 0 ? `£${(numericAwe * 0.8).toFixed(2)}` : "N/A"} />
                  <MiniRow label={"Flat rate"} value={`£${SSP_WEEKLY.toFixed(2)}`} />
                  <MiniRow label={"Effective weekly rate (lower)"} value={`£${weeklyPayment.toFixed(2)}`} />
                  <MiniRow label={`Daily rate (£${weeklyPayment.toFixed(2)} ÷ ${qualifyingDays})`} value={`£${(weeklyPayment / qualifyingDays).toFixed(2)}`} />
                  <MiniRow label="Maximum duration" value={`${SSP_MAX_WEEKS} weeks`} />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    SSP is the lower of 80% of AWE and £{SSP_WEEKLY.toFixed(2)}/week flat rate, for up to 28 weeks. From April 2026 SSP is payable from day 1 (no waiting days).
                  </p>
                </>
              )}
              {paymentType === "smp" && (
                <>
                  <h4 className="text-xs font-semibold text-card-foreground mb-2">SMP Calculation</h4>
                  <MiniRow label="AWE" value={`£${numericAwe.toFixed(2)}`} />
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-[10px] font-semibold text-card-foreground mb-1">First 6 Weeks</p>
                    <MiniRow label="Rate (90% AWE)" value={`£${ninetyPercentAwe.toFixed(2)}`} />
                    <MiniRow label="Subtotal" value={`£${firstSixWeeksTotal.toFixed(2)}`} />
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-[10px] font-semibold text-card-foreground mb-1">Remaining 33 Weeks</p>
                    <MiniRow
                      label={`Rate (lower of 90% AWE and £${PARENTAL_WEEKLY.toFixed(2)})`}
                      value={`£${remainingWeeksPayment.toFixed(2)}`}
                    />
                    <MiniRow label="Subtotal" value={`£${remainingTotal.toFixed(2)}`} />
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <MiniRow label="Total (39 weeks)" value={`£${totalEntitlement.toFixed(2)}`} />
                  </div>
                </>
              )}
              {paymentType === "sap" && (
                <>
                  <h4 className="text-xs font-semibold text-card-foreground mb-2">SAP Calculation</h4>
                  <MiniRow label="AWE" value={`£${numericAwe.toFixed(2)}`} />
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-[10px] font-semibold text-card-foreground mb-1">First 6 Weeks</p>
                    <MiniRow label="Rate (90% AWE)" value={`£${ninetyPercentAwe.toFixed(2)}`} />
                    <MiniRow label="Subtotal" value={`£${firstSixWeeksTotal.toFixed(2)}`} />
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-[10px] font-semibold text-card-foreground mb-1">Remaining 33 Weeks</p>
                    <MiniRow
                      label={`Rate (lower of 90% AWE and £${PARENTAL_WEEKLY.toFixed(2)})`}
                      value={`£${remainingWeeksPayment.toFixed(2)}`}
                    />
                    <MiniRow label="Subtotal" value={`£${remainingTotal.toFixed(2)}`} />
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <MiniRow label="Total (39 weeks)" value={`£${totalEntitlement.toFixed(2)}`} />
                  </div>
                </>
              )}
              {(paymentType === "spp" || paymentType === "shpp" || paymentType === "spbp") && (
                <>
                  <h4 className="text-xs font-semibold text-card-foreground mb-2">
                    {config.label} Calculation
                  </h4>
                  <MiniRow label="AWE" value={`£${numericAwe.toFixed(2)}`} />
                  <MiniRow label="90% of AWE" value={`£${ninetyPercentAwe.toFixed(2)}`} />
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-[10px] font-semibold text-card-foreground mb-1">Weekly Rate</p>
                    <MiniRow
                      label={`Lower of 90% AWE (£${ninetyPercentAwe.toFixed(2)}) and flat rate (£${PARENTAL_WEEKLY.toFixed(2)})`}
                      value={`£${weeklyPayment.toFixed(2)}`}
                    />
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <MiniRow label="Duration" value={`${config.durationWeeks} weeks`} />
                    <MiniRow label="Total" value={`£${totalEntitlement.toFixed(2)}`} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Rate reference info */}
          <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-3">
            <div className="flex gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <p className="font-semibold mb-1">2026/27 Statutory Payment Rates</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>SSP: <strong>£{SSP_WEEKLY.toFixed(2)}</strong>/wk for up to 28 weeks</li>
                  <li>SSP eligibility: AWE must be at least <strong>£{SSP_ELIGIBILITY_THRESHOLD}/week</strong></li>
                  <li>SSP: Payable from <strong>day 1</strong> (no waiting days from April 2026)</li>
                  <li>SMP: First 6 weeks at <strong>90% AWE</strong>, then £{PARENTAL_WEEKLY.toFixed(2)}/wk or 90% AWE</li>
                  <li>SPP, SAP, ShPP, SPBP: £{PARENTAL_WEEKLY.toFixed(2)}/wk or <strong>90% AWE</strong> (whichever lower)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Info note */}
          <p className="mt-6 text-[11px] text-muted-foreground/60 leading-relaxed">
            Calculations are based on 2026/27 statutory payment rates and are for guidance only.
            They do not account for contractual enhancements, collective agreements, or company-specific policies.
            Always consult HMRC, ACAS, or a qualified payroll professional for official advice.
            From April 2026, SSP is payable from day 1 of sickness — the previous 3 waiting-day rule no longer applies.
            Parental payments are subject to qualifying conditions including continuous employment and earnings thresholds.
          </p>

          {/* Conversion CTA — turn this into a payslip */}
          {weeklyPayment > 0 && (
            <ToolConversionCTA
              href={`/documents/new/payslip?gross_pay=${totalEntitlement.toFixed(2)}`}
              action="Generate a Payslip"
              subtitle="with the statutory payment calculated — get a professional PDF payslip with all deductions"
              icon="payslip"
            />
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

// ── Shared Components ────────────────────────────────────────────

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
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-64 bg-popover text-popover-foreground text-[10px] rounded-lg border border-border px-2 py-1 shadow-sm z-10 text-center">
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
        {value}
      </span>
    </div>
  )
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums text-card-foreground">{value}</span>
    </div>
  )
}