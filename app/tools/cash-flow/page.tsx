"use client"

import { useState, useCallback, useMemo } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, Download, Plus, Trash2,
  DollarSign, CalendarDays, PiggyBank, AlertCircle,
  ArrowUpCircle,
} from "lucide-react"

interface CashFlowItem {
  id: string
  name: string
  amount: number
}

interface MonthlyProjection {
  month: string
  label: string
  totalIncome: number
  totalExpenses: number
  netChange: number
  runningBalance: number
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

const FORECAST_MONTHS = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
]

const INCOME_PRESETS = [
  "Sales Revenue", "Service Income", "Consulting Fees", "Retainer",
  "Subscription Revenue", "Commission", "Interest Income", "Other Income",
]

const EXPENSE_PRESETS = [
  "Rent", "Utilities", "Salaries & Wages", "Contractors",
  "Software & Subscriptions", "Marketing", "Office Supplies",
  "Travel", "Insurance", "Accounting & Legal", "Loan Repayment",
  "Tax Payments", "Dividends", "Other Expense",
]

export default function CashFlowPage() {
  const [startingBalance, setStartingBalance] = useState("5000")
  const [forecastMonths, setForecastMonths] = useState(6)
  const [incomeItems, setIncomeItems] = useState<CashFlowItem[]>([
    { id: generateId(), name: "Sales Revenue", amount: 8000 },
    { id: generateId(), name: "Consulting Fees", amount: 2000 },
  ])
  const [expenseItems, setExpenseItems] = useState<CashFlowItem[]>([
    { id: generateId(), name: "Rent & Utilities", amount: 1500 },
    { id: generateId(), name: "Salaries", amount: 4000 },
    { id: generateId(), name: "Software", amount: 500 },
  ])

  const [showIncomePresets, setShowIncomePresets] = useState(false)
  const [showExpensePresets, setShowExpensePresets] = useState(false)
  const [newIncomeName, setNewIncomeName] = useState("")
  const [newIncomeAmount, setNewIncomeAmount] = useState("")
  const [newExpenseName, setNewExpenseName] = useState("")
  const [newExpenseAmount, setNewExpenseAmount] = useState("")

  const startingBalanceNum = parseFloat(startingBalance) || 0
  const totalMonthlyIncome = incomeItems.reduce((s, i) => s + i.amount, 0)
  const totalMonthlyExpenses = expenseItems.reduce((s, i) => s + i.amount, 0)
  const monthlyNet = totalMonthlyIncome - totalMonthlyExpenses

  // ── Build projections ──
  const projections: MonthlyProjection[] = useMemo(() => {
    const now = new Date()
    const results: MonthlyProjection[] = []
    let balance = startingBalanceNum

    for (let i = 0; i < forecastMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const month = d.toISOString().substring(0, 7)
      const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      const net = monthlyNet
      balance += net
      results.push({
        month,
        label,
        totalIncome: totalMonthlyIncome,
        totalExpenses: totalMonthlyExpenses,
        netChange: net,
        runningBalance: balance,
      })
    }
    return results
  }, [startingBalanceNum, totalMonthlyIncome, totalMonthlyExpenses, forecastMonths, monthlyNet])

  const maxBalance = projections.length > 0
    ? Math.max(...projections.map((p) => Math.abs(p.runningBalance)), 1)
    : 1

  // ── Summary stats ──
  const totalProjectedIncome = totalMonthlyIncome * forecastMonths
  const totalProjectedExpenses = totalMonthlyExpenses * forecastMonths
  const netProjected = totalProjectedIncome - totalProjectedExpenses
  const endingBalance = projections.length > 0 ? projections[projections.length - 1].runningBalance : startingBalanceNum
  const monthsInNegative = projections.filter((p) => p.runningBalance < 0).length
  const isViable = endingBalance >= 0 && monthsInNegative === 0

  // ── Add income ──
  const handleAddIncome = useCallback(() => {
    const amt = parseFloat(newIncomeAmount)
    if (!newIncomeName.trim() || isNaN(amt) || amt <= 0) return
    setIncomeItems((prev) => [...prev, { id: generateId(), name: newIncomeName.trim(), amount: amt }])
    setNewIncomeName("")
    setNewIncomeAmount("")
  }, [newIncomeName, newIncomeAmount])

  const handleAddExpense = useCallback(() => {
    const amt = parseFloat(newExpenseAmount)
    if (!newExpenseName.trim() || isNaN(amt) || amt <= 0) return
    setExpenseItems((prev) => [...prev, { id: generateId(), name: newExpenseName.trim(), amount: amt }])
    setNewExpenseName("")
    setNewExpenseAmount("")
  }, [newExpenseName, newExpenseAmount])

  // ── Remove ──
  const removeIncome = useCallback((id: string) => {
    setIncomeItems((prev) => prev.filter((i) => i.id !== id))
  }, [])
  const removeExpense = useCallback((id: string) => {
    setExpenseItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  // ── Update amount inline ──
  const updateIncomeAmount = useCallback((id: string, amount: number) => {
    setIncomeItems((prev) => prev.map((i) => (i.id === id ? { ...i, amount } : i)))
  }, [])
  const updateExpenseAmount = useCallback((id: string, amount: number) => {
    setExpenseItems((prev) => prev.map((i) => (i.id === id ? { ...i, amount } : i)))
  }, [])

  // ── CSV export ──
  const handleExportCSV = useCallback(() => {
    if (projections.length === 0) return
    const header = "Month,Total Income,Total Expenses,Net Change,Running Balance\n"
    const rows = projections
      .map((p) => `${p.label},${p.totalIncome.toFixed(2)},${p.totalExpenses.toFixed(2)},${p.netChange.toFixed(2)},${p.runningBalance.toFixed(2)}`)
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cash-flow-forecast-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [projections])

  // ── Heating colour for balance bar ──
  const barColor = (val: number) => {
    if (val >= 0) return "bg-emerald-500/70"
    return "bg-red-500/70"
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cash Flow Forecaster</h1>
        <p className="mt-1.5 text-muted-foreground">
          Project your monthly cash flow &mdash; see when you&rsquo;ll have surplus or shortfall
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        {/* ── Setup ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Starting balance */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <label className="block text-xs font-medium text-card-foreground mb-2 flex items-center gap-1.5">
              <DollarSign size={14} className="text-primary" />
              Starting Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
              />
            </div>
          </div>

          {/* Forecast period */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <label className="block text-xs font-medium text-card-foreground mb-2 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-primary" />
              Forecast Period
            </label>
            <div className="flex gap-1.5">
              {FORECAST_MONTHS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForecastMonths(opt.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    forecastMonths === opt.value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly summary */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-[11px] text-muted-foreground mb-1">Monthly Net</p>
            <p className={`text-xl font-bold tabular-nums ${monthlyNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {fmt(monthlyNet)}
            </p>
            <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
              <span>In: {fmt(totalMonthlyIncome)}</span>
              <span>Out: {fmt(totalMonthlyExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* ── Income Items ── */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              Monthly Income
              <span className="ml-auto text-xs font-normal text-muted-foreground">{fmt(totalMonthlyIncome)}</span>
            </h2>

            {incomeItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 mb-2 group">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    setIncomeItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i)))
                  }}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">£</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateIncomeAmount(item.id, parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background pl-5 pr-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums text-right"
                  />
                </div>
                <button
                  onClick={() => removeIncome(item.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add income */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newIncomeName}
                  onChange={(e) => setNewIncomeName(e.target.value)}
                  placeholder="Income source"
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  onFocus={() => setShowIncomePresets(true)}
                  onBlur={() => setTimeout(() => setShowIncomePresets(false), 200)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddIncome() }}
                />
                {showIncomePresets && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border border-border bg-card shadow-lg max-h-40 overflow-y-auto">
                    {INCOME_PRESETS.filter((p) => !incomeItems.some((i) => i.name === p)).map((preset) => (
                      <button
                        key={preset}
                        onMouseDown={() => {
                          setNewIncomeName(preset)
                          setShowIncomePresets(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative w-20">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">£</span>
                <input
                  type="number"
                  value={newIncomeAmount}
                  onChange={(e) => setNewIncomeAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background pl-5 pr-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums text-right"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddIncome() }}
                />
              </div>
              <button
                onClick={handleAddIncome}
                disabled={!newIncomeName.trim() || !newIncomeAmount}
                className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* ── Expense Items ── */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-500" />
              Monthly Expenses
              <span className="ml-auto text-xs font-normal text-muted-foreground">{fmt(totalMonthlyExpenses)}</span>
            </h2>

            {expenseItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 mb-2 group">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    setExpenseItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i)))
                  }}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">£</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateExpenseAmount(item.id, parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-background pl-5 pr-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums text-right"
                  />
                </div>
                <button
                  onClick={() => removeExpense(item.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add expense */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                  placeholder="Expense type"
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  onFocus={() => setShowExpensePresets(true)}
                  onBlur={() => setTimeout(() => setShowExpensePresets(false), 200)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddExpense() }}
                />
                {showExpensePresets && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border border-border bg-card shadow-lg max-h-40 overflow-y-auto">
                    {EXPENSE_PRESETS.filter((p) => !expenseItems.some((i) => i.name === p)).map((preset) => (
                      <button
                        key={preset}
                        onMouseDown={() => {
                          setNewExpenseName(preset)
                          setShowExpensePresets(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative w-20">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">£</span>
                <input
                  type="number"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background pl-5 pr-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums text-right"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddExpense() }}
                />
              </div>
              <button
                onClick={handleAddExpense}
                disabled={!newExpenseName.trim() || !newExpenseAmount}
                className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] text-muted-foreground mb-1">Projected Income</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600">
              {fmt(totalProjectedIncome)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] text-muted-foreground mb-1">Projected Expenses</p>
            <p className="text-lg font-bold tabular-nums text-red-600">
              {fmt(totalProjectedExpenses)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] text-muted-foreground mb-1">Net Projected</p>
            <p className={`text-lg font-bold tabular-nums ${netProjected >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {fmt(netProjected)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] text-muted-foreground mb-1">Ending Balance</p>
            <p className={`text-lg font-bold tabular-nums ${endingBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {fmt(endingBalance)}
            </p>
          </div>
        </div>

        {/* ── Health indicator ── */}
        <div className={`rounded-xl border p-4 shadow-sm mb-6 flex items-start gap-3 ${
          isViable
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
        }`}>
          {isViable ? (
            <ArrowUpCircle size={20} className="text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-semibold ${isViable ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
              {isViable ? "Healthy Cash Flow" : "Cash Flow Warning"}
            </p>
            <p className="text-xs mt-0.5 text-muted-foreground">
              {isViable
                ? `Your projected ending balance is positive and you stay in the black throughout.`
                : monthsInNegative > 0
                  ? `You&rsquo;ll be in negative territory for ${monthsInNegative} month${monthsInNegative > 1 ? "s" : ""} &mdash; review your expenses or increase income.`
                  : `Your ending balance is negative — consider cutting costs or boosting revenue.`
              }
            </p>
          </div>
        </div>

        {/* ── Forecast Table ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <PiggyBank size={16} className="text-primary" />
              Monthly Projections
              <span className="text-xs font-normal text-muted-foreground">({forecastMonths} months)</span>
            </h2>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <Download size={14} />
              CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Month</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Income</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Expenses</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Net Change</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Balance</th>
                  <th className="py-2 pl-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {projections.map((p) => (
                  <tr key={p.month} className="border-b border-border/50 last:border-b-0">
                    <td className="py-2.5 pr-4 font-medium text-card-foreground">{p.label}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600">{fmt(p.totalIncome)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-red-600">{fmt(p.totalExpenses)}</td>
                    <td className={`py-2.5 px-3 text-right tabular-nums font-medium ${p.netChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {p.netChange >= 0 ? "+" : ""}{fmt(p.netChange)}
                    </td>
                    <td className={`py-2.5 px-3 text-right tabular-nums font-bold ${p.runningBalance >= 0 ? "text-card-foreground" : "text-red-600"}`}>
                      {fmt(p.runningBalance)}
                    </td>
                    <td className="py-2.5 pl-3">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(p.runningBalance)}`}
                          style={{
                            width: `${Math.abs(p.runningBalance) / maxBalance * 100}%`,
                            marginLeft: p.runningBalance >= 0 ? "0" : "auto",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer disclaimer ── */}
        <p className="text-[11px] text-muted-foreground/60 text-center">
          For guidance only — consult your accountant for detailed cash flow planning.
          Data stays in your browser and is not saved on our servers.
        </p>
      </div>
    </DashboardShell>
  )
}