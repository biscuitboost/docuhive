"use client"

import { useState } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import { ArrowLeftRight } from "lucide-react"
import Link from "next/link"
import ToolConversionCTA from "@/components/tools/ToolConversionCTA"

const VAT_RATES = [
  { value: 20, label: "Standard (20%)" },
  { value: 5, label: "Reduced (5%)" },
  { value: 0, label: "Zero (0%)" },
]

type Mode = "exclusive" | "inclusive"

export default function VATCalculatorPage() {
  const [amount, setAmount] = useState<string>("")
  const [rate, setRate] = useState<number>(20)
  const [mode, setMode] = useState<Mode>("exclusive")

  const numericAmount = parseFloat(amount) || 0

  const vatAmount = mode === "exclusive"
    ? numericAmount * (rate / 100)
    : numericAmount - numericAmount / (1 + rate / 100)

  const netAmount = mode === "exclusive" ? numericAmount : numericAmount - vatAmount
  const grossAmount = mode === "exclusive" ? numericAmount + vatAmount : numericAmount

  const roundedVat = Math.round(vatAmount * 100) / 100
  const roundedNet = Math.round(netAmount * 100) / 100
  const roundedGross = Math.round(grossAmount * 100) / 100

  function toggleMode() {
    setMode((m) => (m === "exclusive" ? "inclusive" : "exclusive"))
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">VAT Calculator</h1>
        <p className="mt-1.5 text-muted-foreground">
          Calculate VAT amounts at UK rates — add VAT to a net price or extract VAT from a gross price
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Rate selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">VAT Rate</label>
            <div className="flex gap-2">
              {VAT_RATES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRate(r.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    rate === r.value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              {mode === "exclusive" ? "Net Amount (excl. VAT)" : "Gross Amount (incl. VAT)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Toggle mode */}
          <button
            onClick={toggleMode}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeftRight size={14} />
            Switch to {mode === "exclusive" ? "gross → net" : "net → gross"}
          </button>

          {/* Results */}
          <div className="space-y-3">
            {mode === "exclusive" ? (
              <>
                <ResultRow label="Net Amount" value={roundedNet} highlight={false} />
                <ResultRow label={`VAT at ${rate}%`} value={roundedVat} highlight={false} accent />
                <div className="border-t border-border pt-3">
                  <ResultRow label="Gross Amount (incl. VAT)" value={roundedGross} highlight={true} />
                </div>
              </>
            ) : (
              <>
                <ResultRow label="Gross Amount" value={roundedGross} highlight={false} />
                <ResultRow label={`VAT at ${rate}%`} value={roundedVat} highlight={false} accent />
                <div className="border-t border-border pt-3">
                  <ResultRow label="Net Amount (excl. VAT)" value={roundedNet} highlight={true} />
                </div>
              </>
            )}
          </div>

          {/* Info note */}
          <p className="mt-6 text-[11px] text-muted-foreground/60 leading-relaxed">
            Results are rounded to 2 decimal places. This calculator is for guidance only — always consult HMRC or
            a qualified accountant for official VAT calculations.
          </p>

          {/* Conversion CTA */}
          {numericAmount > 0 && (
            <ToolConversionCTA
              href="/tools/invoice"
              action="Generate an Invoice"
              subtitle="with the VAT calculated here — create a professional invoice with VAT breakdown"
              icon="invoice"
            />
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function ResultRow({
  label,
  value,
  highlight,
  accent,
}: {
  label: string
  value: number
  highlight?: boolean
  accent?: boolean
}) {
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
      <span
        className={`text-sm ${
          highlight ? "font-semibold text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
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