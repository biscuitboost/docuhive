"use client"

import { useState } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import Link from "next/link"
import { CalendarDays, Info, HelpCircle } from "lucide-react"
import ToolConversionCTA from "@/components/tools/ToolConversionCTA"

// ── Constants ──────────────────────────────────────────────────────

const STATUTORY_WEEKS = 5.6
const FULL_TIME_DAYS = 28
const ACCRUAL_RATE = 0.1207 // 12.07% for irregular hours accrual

const ENGLAND_BANK_HOLIDAYS = 8

type EmploymentType = "full-time" | "part-time" | "irregular"

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string; description: string }[] = [
  {
    value: "full-time",
    label: "Full-Time",
    description: "Standard 5-day working week",
  },
  {
    value: "part-time",
    label: "Part-Time",
    description: "Fewer than 5 days per week",
  },
  {
    value: "irregular",
    label: "Irregular / Casual",
    description: "Variable hours (accrual method)",
  },
]

interface BreakdownRow {
  label: string
  value: number
  unit?: string
  highlight?: boolean
  accent?: boolean
  tooltip?: string
}

export default function HolidayEntitlementPage() {
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full-time")
  const [daysPerWeek, setDaysPerWeek] = useState<string>("3")
  const [hoursPerDay, setHoursPerDay] = useState<string>("7.5")
  const [hoursWorked, setHoursWorked] = useState<string>("")
  const [accrualPeriod, setAccrualPeriod] = useState<"weekly" | "monthly" | "annual">("monthly")
  const [includeBankHolidays, setIncludeBankHolidays] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // ── Parsed inputs ──
  const numericDaysPerWeek = parseFloat(daysPerWeek) || 0
  const numericHoursWorked = parseFloat(hoursWorked) || 0

  // ── Calculations ──

  // Statutory entitlement in days
  let statutoryEntitlementDays = 0
  let statutoryEntitlementHours = 0
  let bankHolidayImpactDays = 0
  let workingDaysPerWeek = 5
  let accrualRatePerHour = 0

  switch (employmentType) {
    case "full-time": {
      workingDaysPerWeek = 5
      statutoryEntitlementDays = FULL_TIME_DAYS // 28 days
      bankHolidayImpactDays = includeBankHolidays ? ENGLAND_BANK_HOLIDAYS : 0
      break
    }
    case "part-time": {
      workingDaysPerWeek = Math.min(Math.max(numericDaysPerWeek || 0, 0.5), 4.5)
      statutoryEntitlementDays = workingDaysPerWeek * STATUTORY_WEEKS
      // Bank holidays pro-rata
      bankHolidayImpactDays = includeBankHolidays
        ? (workingDaysPerWeek / 5) * ENGLAND_BANK_HOLIDAYS
        : 0
      break
    }
    case "irregular": {
      workingDaysPerWeek = 5 // for display purposes
      accrualRatePerHour = ACCRUAL_RATE
      // Convert worked hours to annualised for display
      const multiplier =
        accrualPeriod === "weekly" ? 52 : accrualPeriod === "monthly" ? 12 : 1
      const annualHours = numericHoursWorked * multiplier
      const accruedHours = annualHours * accrualRatePerHour

      // In hours mode, show accrued hours directly
      statutoryEntitlementHours = accruedHours
      // In days mode, convert assuming average working day
      const avgHoursPerDay = 7.5
      statutoryEntitlementDays = accruedHours / avgHoursPerDay

      // No bank holiday concept for irregular — they accrue on hours worked
      bankHolidayImpactDays = 0
      break
    }
  }

  // ── Breakdown rows ──
  const breakdown: BreakdownRow[] = []

  if (employmentType === "full-time") {
    breakdown.push(
      { label: "Statutory Entitlement", value: 28, unit: "days", highlight: false },
      { label: "Working Days per Week", value: 5, unit: "days", accent: true },
    )
    if (includeBankHolidays) {
      breakdown.push({
        label: "Bank Holidays (included)",
        value: ENGLAND_BANK_HOLIDAYS,
        unit: "days",
        accent: true,
        tooltip: "Employers can include bank holidays as part of the 28-day statutory minimum",
      })
      breakdown.push({
        label: "Remaining Leave (excl. bank hols)",
        value: statutoryEntitlementDays - ENGLAND_BANK_HOLIDAYS,
        unit: "days",
        highlight: true,
      })
    } else {
      breakdown.push({
        label: "Total Leave (bank holidays extra)",
        value: 28,
        unit: "days",
        highlight: true,
        tooltip: "Bank holidays are provided in addition to the statutory 28 days",
      })
    }
  } else if (employmentType === "part-time") {
    breakdown.push(
      { label: "Working Days per Week", value: workingDaysPerWeek, unit: "days", accent: true },
      {
        label: "Statutory Entitlement",
        value: Math.round(statutoryEntitlementDays * 100) / 100,
        unit: "days",
        highlight: false,
        tooltip: `Based on ${workingDaysPerWeek} days × ${STATUTORY_WEEKS} weeks`,
      },
    )
    if (includeBankHolidays) {
      const proRataBanks = Math.round(bankHolidayImpactDays * 100) / 100
      breakdown.push({
        label: "Bank Holidays (pro-rata)",
        value: proRataBanks,
        unit: "days",
        accent: true,
        tooltip: `${(workingDaysPerWeek / 5) * 100}% of ${ENGLAND_BANK_HOLIDAYS} bank holidays`,
      })
      breakdown.push({
        label: "Remaining Leave (excl. bank hols)",
        value: Math.round((statutoryEntitlementDays - proRataBanks) * 100) / 100,
        unit: "days",
        highlight: true,
      })
    } else {
      breakdown.push({
        label: "Total Leave (bank holidays extra)",
        value: Math.round(statutoryEntitlementDays * 100) / 100,
        unit: "days",
        highlight: true,
      })
    }
  } else {
    // Irregular
    const periodLabel = accrualPeriod === "weekly" ? "week" : accrualPeriod === "monthly" ? "month" : "year"
    breakdown.push(
      {
        label: `Hours Worked (per ${periodLabel})`,
        value: numericHoursWorked,
        unit: "hours",
        accent: true,
      },
      {
        label: "Accrual Rate",
        value: ACCRUAL_RATE * 100,
        unit: "%",
        accent: true,
        tooltip: "12.07% of hours worked — the statutory accrual rate for irregular hours workers",
      },
      {
        label: "Accrued Holiday",
        value: Math.round(statutoryEntitlementHours * 100) / 100,
        unit: "hours",
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
          Holiday Entitlement Calculator
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Calculate statutory holiday entitlement for UK employees — full-time, part-time, and irregular hours
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Employment type selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Employment Type
            </label>
            <div className="flex gap-2">
              {EMPLOYMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setEmploymentType(t.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    employmentType === t.value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Part-time: days per week */}
          {employmentType === "part-time" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Working Days per Week
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0.5}
                max={4.5}
                step={0.5}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
                placeholder="3"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                Enter days worked per week (e.g., 3 for Mon-Wed, 2.5 for Mon-Tue + Wed morning)
              </p>
            </div>
          )}

          {/* Full-time: just a note */}
          {employmentType === "full-time" && (
            <div className="mb-4 rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Full-time employees working 5 days per week are entitled to <strong>28 days</strong> statutory
              paid holiday per year (5.6 weeks × 5 days).
            </div>
          )}

          {/* Irregular hours */}
          {employmentType === "irregular" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Total Hours Worked
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Period
                </label>
                <div className="flex gap-2">
                  {(["weekly", "monthly", "annual"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setAccrualPeriod(p)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        accrualPeriod === p
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 mb-4 text-[11px] text-muted-foreground/60">
                Irregular hours workers accrue holiday at <strong>12.07%</strong> of hours worked — this is the
                statutory rate set by the Working Time Regulations.
              </p>
            </>
          )}

          {/* Hours per day (for full-time, part-time — used for days→hours conversion) */}
          {(employmentType === "full-time" || employmentType === "part-time") && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Hours per Working Day
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0.5}
                max={24}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                placeholder="7.5"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Include bank holidays toggle */}
          {employmentType !== "irregular" && (
            <div className="mb-6 flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-card-foreground">Include Bank Holidays</span>
                <span className="group relative inline-flex" title="Employers can choose whether bank holidays are included in or additional to the statutory minimum">
                  <HelpCircle size={13} className="text-muted-foreground/40" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-64 bg-popover text-popover-foreground text-[10px] rounded-lg border border-border px-2 py-1 shadow-sm z-10 text-center">
                    Employers can choose whether bank holidays count toward the statutory minimum or are provided in addition
                  </span>
                </span>
              </div>
              <button
                onClick={() => setIncludeBankHolidays(!includeBankHolidays)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  includeBankHolidays ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    includeBankHolidays ? "translate-x-4.5" : "translate-x-1"
                  }`}
                  style={{
                    transform: includeBankHolidays ? "translateX(18px)" : "translateX(4px)",
                  }}
                />
              </button>
            </div>
          )}

          {/* Results */}
          {((employmentType !== "irregular" && (employmentType === "full-time" || parseFloat(daysPerWeek) > 0)) ||
            (employmentType === "irregular" && numericHoursWorked > 0)) && (
            <>
              <div className="space-y-3">
                {breakdown.map((row) => (
                  <ResultRow key={row.label} {...row} />
                ))}
              </div>

              {/* Summary cards */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {employmentType === "irregular" ? (
                  <>
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Accrual Rate</p>
                      <p className="text-sm font-bold tabular-nums text-card-foreground">
                        12.07%
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Annualised</p>
                      <p className="text-sm font-bold tabular-nums text-card-foreground">
                        £— hrs
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Working Days / Week</p>
                      <p className="text-sm font-bold tabular-nums text-card-foreground">
                        {employmentType === "full-time" ? 5 : workingDaysPerWeek}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Statutory Weeks</p>
                      <p className="text-sm font-bold tabular-nums text-card-foreground">
                        {STATUTORY_WEEKS}
                      </p>
                    </div>
                  </>
                )}
              </div>

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
                  {employmentType === "full-time" && (
                    <>
                      <h4 className="text-xs font-semibold text-card-foreground mb-2">Full-Time Calculation</h4>
                      <MiniRow label="5 days × 5.6 statutory weeks" value={28} />
                      {includeBankHolidays && (
                        <>
                          <MiniRow label="Bank holidays (included in 28 days)" value={ENGLAND_BANK_HOLIDAYS} />
                          <div className="border-t border-border pt-2 mt-2">
                            <MiniRow label="Leave you can schedule (excl. bank hols)" value={statutoryEntitlementDays - ENGLAND_BANK_HOLIDAYS} />
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {employmentType === "part-time" && (
                    <>
                      <h4 className="text-xs font-semibold text-card-foreground mb-2">Part-Time Calculation</h4>
                      <MiniRow label={`${workingDaysPerWeek} days × ${STATUTORY_WEEKS} weeks`} value={Math.round(workingDaysPerWeek * STATUTORY_WEEKS * 100) / 100} />
                      {includeBankHolidays && (
                        <MiniRow
                          label={`Bank holidays pro-rata (${workingDaysPerWeek}/5 × ${ENGLAND_BANK_HOLIDAYS})`}
                          value={Math.round((workingDaysPerWeek / 5) * ENGLAND_BANK_HOLIDAYS * 100) / 100}
                        />
                      )}
                    </>
                  )}
                  {employmentType === "irregular" && (
                    <>
                      <h4 className="text-xs font-semibold text-card-foreground mb-2">Irregular Hours Calculation</h4>
                      <MiniRow label={`${numericHoursWorked} hrs × ${accrualPeriod} × 12.07%`} value={Math.round(statutoryEntitlementHours * 100) / 100} />
                      <MiniRow label="Accrual method" value={0} />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        For irregular hours workers, holiday is calculated as 12.07% of total hours worked. This is
                        the statutory method set out in the Working Time Regulations.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {((employmentType === "part-time" && (!parseFloat(daysPerWeek) || parseFloat(daysPerWeek) <= 0)) ||
            (employmentType === "irregular" && !numericHoursWorked)) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays size={40} className="mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Enter details above</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {employmentType === "part-time"
                  ? "Enter your working days per week to see your entitlement"
                  : "Enter hours worked to calculate accrued holiday"}
              </p>
            </div>
          )}

          {/* Rate band explanation */}
          <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-3">
            <div className="flex gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <p className="font-semibold mb-1">2024/25 Statutory Holiday Rules</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>All workers are entitled to <strong>5.6 weeks</strong> paid holiday per year</li>
                  <li>Full-time (5 days): <strong>28 days</strong></li>
                  <li>Part-time: pro-rata calculation (days/week × 5.6)</li>
                  <li>Irregular hours: <strong>12.07%</strong> accrual on hours worked</li>
                  <li>Bank holidays can be included in or added to the statutory minimum</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Info note */}
          <p className="mt-6 text-[11px] text-muted-foreground/60 leading-relaxed">
            Calculations are based on the Working Time Regulations 1998 for the 2024/25 leave year and are for guidance only.
            They do not account for contractual leave above the statutory minimum, carry-over arrangements, or
            sector-specific rules. Always consult ACAS, HMRC, or a qualified HR professional for official advice.
          </p>

          {/* Conversion CTA — turn this into a staff handbook */}
          {statutoryEntitlementDays > 0 && (
            <ToolConversionCTA
              href="/documents/new/staff_handbook"
              action="Create a Staff Handbook"
              subtitle="with your holiday policy documented — get a compliant PDF handbook with your leave calculations"
              icon="contract"
            />
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

// ── Shared Components ────────────────────────────────────────────

function ResultRow({ label, value, unit, highlight, accent, tooltip }: BreakdownRow) {
  const displayUnit = unit ? ` ${unit}` : ""
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
        {value.toLocaleString("en-GB", { minimumFractionDigits: unit === "days" || unit === "hours" || !unit ? 2 : 0, maximumFractionDigits: unit === "days" || unit === "hours" || !unit ? 2 : 1 })}
        {displayUnit}
      </span>
    </div>
  )
}

function MiniRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums text-card-foreground">
        {value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}