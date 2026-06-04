"use client"

import { useState, useCallback } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import Link from "next/link"
import {
  Plus, Trash2, Clock, TrendingUp, Briefcase, Code, PenTool,
  ChartBar, Users, Building2, Monitor, Phone, Ellipsis,
  Download, ChevronDown, ChevronUp,
} from "lucide-react"

interface TimeEntry {
  id: string
  date: string
  project: string
  description: string
  hours: number
  rate: number
}

const PROJECTS = [
  { value: "client-work", label: "Client Work", icon: Briefcase, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" },
  { value: "development", label: "Development", icon: Code, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { value: "design", label: "Design", icon: PenTool, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400" },
  { value: "consulting", label: "Consulting", icon: ChartBar, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" },
  { value: "admin", label: "Administration", icon: Users, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400" },
  { value: "operations", label: "Operations", icon: Building2, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 dark:text-cyan-400" },
  { value: "it-support", label: "IT & Support", icon: Monitor, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400" },
  { value: "meetings", label: "Meetings", icon: Phone, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400" },
  { value: "other", label: "Other", icon: Ellipsis, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/30 dark:text-slate-400" },
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [project, setProject] = useState("client-work")
  const [description, setDescription] = useState("")
  const [hours, setHours] = useState("")
  const [rate, setRate] = useState("")
  const [date, setDate] = useState(todayISO)
  const [sortBy, setSortBy] = useState<"date" | "hours" | "project" | "rate">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // ── Add entry ──
  const handleAdd = useCallback(() => {
    const numericHours = parseFloat(hours)
    const numericRate = parseFloat(rate)
    if (!description.trim() || isNaN(numericHours) || numericHours <= 0) return

    setEntries((prev) => [
      ...prev,
      {
        id: generateId(),
        date,
        project,
        description: description.trim(),
        hours: numericHours,
        rate: isNaN(numericRate) ? 0 : numericRate,
      },
    ])
    setDescription("")
    setHours("")
    setRate("")
  }, [description, hours, rate, project, date])

  // ── Remove entry ──
  const handleRemove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // ── Clear all ──
  const handleClearAll = useCallback(() => {
    setEntries([])
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

  const sortedEntries = [...entries].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "hours") return (a.hours - b.hours) * dir
    if (sortBy === "rate") return (a.rate - b.rate) * dir
    if (sortBy === "project") return a.project.localeCompare(b.project) * dir
    return a.date.localeCompare(b.date) * dir
  })

  // ── Totals by project ──
  const projectTotals = PROJECTS.map((proj) => {
    const projectEntries = entries.filter((e) => e.project === proj.value)
    const totalHours = projectEntries.reduce((sum, e) => sum + e.hours, 0)
    const totalEarnings = projectEntries.reduce((sum, e) => sum + e.hours * e.rate, 0)
    return { ...proj, totalHours, totalEarnings }
  }).filter((p) => p.totalHours > 0)

  const grandHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const grandEarnings = entries.reduce((sum, e) => sum + e.hours * e.rate, 0)
  const hourlyRate = grandHours > 0 ? grandEarnings / grandHours : 0

  // ── CSV export ──
  const handleExportCSV = () => {
    if (entries.length === 0) return
    const headers = "Date,Project,Description,Hours,Rate (£/hr),Earnings\n"
    const rows = entries
      .map((e) => {
        const projLabel = PROJECTS.find((p) => p.value === e.project)?.label || e.project
        const earnings = e.hours * e.rate
        return `${e.date},"${projLabel}","${e.description.replace(/"/g, '""')}",${e.hours},${e.rate.toFixed(2)},${earnings.toFixed(2)}`
      })
      .join("\n")
    const footer = `\nTotal Hours,,,${grandHours},,${grandEarnings.toFixed(2)}`
    const blob = new Blob([headers + rows + footer], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `time-tracking-${todayISO()}.csv`
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Time Tracker</h1>
        <p className="mt-1.5 text-muted-foreground">
          Track billable and non-billable hours — no sign-up needed, data stays in your browser
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* ── Add Time Entry Form ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            Log Time
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Website wireframes, Q1 tax review"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
              />
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PROJECTS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
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

            {/* Hours */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Hours</label>
              <input
                type="number"
                inputMode="decimal"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 2.5"
                step="0.25"
                min="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
              />
            </div>

            {/* Hourly rate */}
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Hourly Rate (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="0.00"
                  step="0.50"
                  min="0"
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!description.trim() || !hours || parseFloat(hours) <= 0}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Log Time
          </button>
        </div>

        {/* ── Summary Cards ── */}
        {entries.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Total Hours</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">
                  {grandHours.toFixed(1)}h
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">
                  £{grandEarnings.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Entries</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">{entries.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] text-muted-foreground mb-1">Avg. Rate</p>
                <p className="text-xl font-bold tabular-nums text-card-foreground">
                  £{hourlyRate.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs text-muted-foreground font-normal">/hr</span>
                </p>
              </div>
            </div>

            {/* Project breakdown */}
            {projectTotals.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm mb-4">
                <h3 className="text-xs font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" />
                  Breakdown by Project
                </h3>
                <div className="space-y-3">
                  {projectTotals.map((proj) => {
                    const Icon = proj.icon
                    const pct = (proj.totalHours / grandHours) * 100
                    return (
                      <div key={proj.value}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon size={12} className={proj.color.split(" ")[0]} />
                            {proj.label}
                          </span>
                          <span className="text-xs font-medium tabular-nums text-card-foreground">
                            {proj.totalHours.toFixed(1)}h
                            <span className="text-muted-foreground ml-1">({pct.toFixed(1)}%)</span>
                            {proj.totalEarnings > 0 && (
                              <span className="text-muted-foreground ml-2">
                                — £{proj.totalEarnings.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all"
                            style={{ width: `${pct}%` }}
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

        {/* ── Entries List ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Time Entries ({entries.length})
            </h2>
            <div className="flex items-center gap-2">
              {entries.length > 0 && (
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
            {(["date", "project", "hours", "rate"] as const).map((field) => (
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

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No time entries yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Log your first time entry using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedEntries.map((entry) => {
                const proj = PROJECTS.find((p) => p.value === entry.project) || PROJECTS[PROJECTS.length - 1]
                const Icon = proj.icon
                const earnings = entry.hours * entry.rate
                return (
                  <div
                    key={entry.id}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${proj.color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-card-foreground truncate">{entry.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(entry.date + "T00:00:00").toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                          {" · "}
                          {proj.label}
                          {entry.rate > 0 && (
                            <>
                              {" · £"}
                              {entry.rate.toFixed(2)}
                              /hr
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-card-foreground">
                          {entry.hours.toFixed(1)}h
                        </p>
                        {earnings > 0 && (
                          <p className="text-[11px] tabular-nums text-muted-foreground">
                            £{earnings.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Remove entry"
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
          Export your time entries as CSV for invoicing, payroll, or accounting.
        </p>
      </div>
    </DashboardShell>
  )
}
