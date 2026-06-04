"use client"

import { useState, useCallback } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import ToolConversionCTA from "@/components/tools/ToolConversionCTA"
import Link from "next/link"
import {
  Plus, Trash2, TrendingUp, Receipt, Briefcase, Utensils,
  Megaphone, Scale, Building2, Users, Car, Monitor,
  Ellipsis, Download, ChevronDown, ChevronUp,
} from "lucide-react"

interface Expense {
  id: string
  date: string
  description: string
  category: string
  amount: number
}

const EXPENSE_CATEGORIES = [
  { value: "office", label: "Office Supplies & Equipment", icon: Briefcase, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" },
  { value: "travel", label: "Travel & Subsistence", icon: Car, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { value: "meals", label: "Meals & Entertainment", icon: Utensils, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400" },
  { value: "marketing", label: "Advertising & Marketing", icon: Megaphone, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400" },
  { value: "professional", label: "Professional Fees", icon: Scale, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400" },
  { value: "rent", label: "Rent & Utilities", icon: Building2, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" },
  { value: "staff", label: "Staff Costs", icon: Users, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 dark:text-cyan-400" },
  { value: "it", label: "IT & Software", icon: Monitor, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400" },
  { value: "other", label: "Other", icon: Ellipsis, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/30 dark:text-slate-400" },
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

export default function ExpenseTrackerPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("office")
  const [date, setDate] = useState(todayISO)
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // ── Add expense ──
  const handleAdd = useCallback(() => {
    const numericAmount = parseFloat(amount)
    if (!description.trim() || isNaN(numericAmount) || numericAmount <= 0) return

    setExpenses((prev) => [
      ...prev,
      { id: generateId(), date, description: description.trim(), category, amount: numericAmount },
    ])
    setDescription("")
    setAmount("")
  }, [description, amount, category, date])

  // ── Remove expense ──
  const handleRemove = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // ── Clear all ──
  const handleClearAll = useCallback(() => {
    setExpenses([])
  }, [])

  // ── Sort ──
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortDir("desc")
    }
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "amount") return (a.amount - b.amount) * dir
    if (sortBy === "category") return a.category.localeCompare(b.category) * dir
    return a.date.localeCompare(b.date) * dir
  })

  // ── Totals by category ──
  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat.value)
      .reduce((sum, e) => sum + e.amount, 0)
    return { ...cat, total }
  }).filter((c) => c.total > 0)

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  // ── CSV export ──
  const handleExportCSV = () => {
    if (expenses.length === 0) return
    const headers = "Date,Description,Category,Amount\n"
    const rows = expenses
      .map((e) => `${e.date},"${e.description.replace(/"/g, '""')}",${e.category},${e.amount.toFixed(2)}`)
      .join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expenses-${todayISO()}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Expense Tracker</h1>
        <p className="mt-1.5 text-muted-foreground">
          Track and categorise your business expenses — no sign-up needed, data stays in your browser
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* ── Add Expense Form ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            Add Expense
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Stationery order, Client lunch"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Amount (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!description.trim() || !amount || parseFloat(amount) <= 0}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Add Expense
          </button>
        </div>

        {/* ── Summary Cards ── */}
        {expenses.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">
                  £{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Number of Entries</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">{expenses.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Categories Used</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">{categoryTotals.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Average per Entry</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">
                  £{(grandTotal / expenses.length).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Category breakdown */}
            {categoryTotals.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm mb-4">
                <h3 className="text-xs font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" />
                  Category Breakdown
                </h3>
                <div className="space-y-2">
                  {categoryTotals.map((cat) => {
                    const Icon = cat.icon
                    const percentage = (cat.total / grandTotal) * 100
                    return (
                      <div key={cat.value}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon size={12} className={cat.color.split(" ")[0]} />
                            {cat.label}
                          </span>
                          <span className="text-xs font-medium tabular-nums text-card-foreground">
                            £{cat.total.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-muted-foreground ml-1">({percentage.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Expense List ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Receipt size={16} className="text-primary" />
              Expenses ({expenses.length})
            </h2>
            <div className="flex items-center gap-2">
              {expenses.length > 0 && (
                <>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Download size={13} />
                    Export CSV
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 size={13} />
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] text-muted-foreground">Sort by:</span>
            {(["date", "category", "amount"] as const).map((field) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`flex items-center gap-0.5 rounded-md border px-2 py-1 text-[11px] transition-all ${
                  sortBy === field
                    ? "border-primary/30 bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sortBy === field && (
                  sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                )}
              </button>
            ))}
          </div>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No expenses added yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add your first expense using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedExpenses.map((expense) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.value === expense.category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
                const Icon = cat.icon
                return (
                  <div
                    key={expense.id}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${cat.color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-card-foreground truncate">{expense.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(expense.date + "T00:00:00").toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                          {" · "}
                          {cat.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold tabular-nums text-card-foreground">
                        £{expense.amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => handleRemove(expense.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Remove expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info note */}
        <p className="mt-6 text-[11px] text-muted-foreground/60 leading-relaxed text-center">
          All data is stored locally in your browser — nothing is sent to our servers.
          Export your expenses as CSV for your records or accounting software.
        </p>

        {/* Conversion CTA — turn tracked expenses into an employment contract */}
        {expenses.length > 0 && (
          <ToolConversionCTA
            href="/documents/new/employment_contract"
            action="Generate an Employment Contract"
            subtitle="tracking expenses for staff? Create a professional employment contract to formalise the arrangement"
            icon="contract"
          />
        )}
      </div>
    </DashboardShell>
  )
}