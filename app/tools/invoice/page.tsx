"use client"

import { useState, useCallback } from "react"
import DashboardShell from "@/components/layout/DashboardShell"
import ToolConversionCTA from "@/components/tools/ToolConversionCTA"
import Link from "next/link"
import {
  FileText, Plus, Trash2, Download, RefreshCw, Calculator, Receipt,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

interface InvoiceData {
  // Company
  companyName: string
  companyAddress: string
  companyEmail: string
  // Client
  clientName: string
  clientAddress: string
  clientEmail: string
  // Invoice meta
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  // Items
  lineItems: LineItem[]
  // Options
  includeVat: boolean
  vatRate: number
}

// ── Helpers ───────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function defaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split("T")[0]
}

function formatCurrency(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function lineTotal(item: LineItem): number {
  return item.quantity * item.unitPrice
}

function subtotal(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}

function vatAmount(items: LineItem[], includeVat: boolean, vatRate: number): number {
  if (!includeVat) return 0
  return subtotal(items) * (vatRate / 100)
}

function grandTotal(items: LineItem[], includeVat: boolean, vatRate: number): number {
  return subtotal(items) + vatAmount(items, includeVat, vatRate)
}

// ── VAT Rates ──────────────────────────────────────────────────────────

const VAT_RATES = [
  { value: 20, label: "20%" },
  { value: 5, label: "5%" },
  { value: 0, label: "0%" },
]

// ── Default State Factory ─────────────────────────────────────────────

function createDefaultInvoice(): InvoiceData {
  return {
    companyName: "",
    companyAddress: "",
    companyEmail: "",
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    invoiceNumber: `INV-${new Date().getFullYear()}-001`,
    invoiceDate: todayISO(),
    dueDate: defaultDueDate(),
    lineItems: [],
    includeVat: true,
    vatRate: 20,
  }
}

// ── Page ──────────────────────────────────────────────────────────────

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<InvoiceData>(createDefaultInvoice)

  // ── Field updaters ──
  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setInvoice((prev) => ({ ...prev, [key]: value }))
  }

  // ── Line item management ──
  const [newDesc, setNewDesc] = useState("")
  const [newQty, setNewQty] = useState("1")
  const [newPrice, setNewPrice] = useState("")

  const handleAddItem = useCallback(() => {
    const qty = parseFloat(newQty)
    const price = parseFloat(newPrice)
    if (!newDesc.trim() || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) return
    setInvoice((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: generateId(), description: newDesc.trim(), quantity: qty, unitPrice: price },
      ],
    }))
    setNewDesc("")
    setNewQty("1")
    setNewPrice("")
  }, [newDesc, newQty, newPrice])

  const handleRemoveItem = useCallback((id: string) => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((i) => i.id !== id),
    }))
  }, [])

  const handleResetForm = useCallback(() => {
    setInvoice(createDefaultInvoice())
  }, [])

  // ── CSV / Invoice Export ──
  const handleExportCSV = () => {
    if (invoice.lineItems.length === 0) return
    const lines: string[] = []
    lines.push("Invoice Number,Date,Due Date,Client,Description,Quantity,Unit Price (GBP),Line Total (GBP)")
    invoice.lineItems.forEach((item) => {
      lines.push(
        `${invoice.invoiceNumber},${invoice.invoiceDate},${invoice.dueDate},"${invoice.clientName.replace(/"/g, '""')}","${item.description.replace(/"/g, '""')}",${item.quantity},${item.unitPrice.toFixed(2)},${lineTotal(item).toFixed(2)}`
      )
    })
    lines.push("")
    lines.push(`Subtotal,,,${formatCurrency(subtotal(invoice.lineItems))}`)
    if (invoice.includeVat) {
      lines.push(`VAT (${invoice.vatRate}%),,,${formatCurrency(vatAmount(invoice.lineItems, true, invoice.vatRate))}`)
    }
    lines.push(`Total,,,${formatCurrency(grandTotal(invoice.lineItems, invoice.includeVat, invoice.vatRate))}`)

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${invoice.invoiceNumber}-${todayISO()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sub = subtotal(invoice.lineItems)
  const vat = vatAmount(invoice.lineItems, invoice.includeVat, invoice.vatRate)
  const total = grandTotal(invoice.lineItems, invoice.includeVat, invoice.vatRate)

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoice Generator</h1>
        <p className="mt-1.5 text-muted-foreground">
          Create professional invoices — add line items, apply VAT, and export to CSV
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* ── Invoice Details ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            Invoice Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Invoice Number</label>
              <input
                type="text"
                value={invoice.invoiceNumber}
                onChange={(e) => updateField("invoiceNumber", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Invoice Date</label>
              <input
                type="date"
                value={invoice.invoiceDate}
                onChange={(e) => {
                  updateField("invoiceDate", e.target.value)
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Due Date</label>
              <input
                type="date"
                value={invoice.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* ── Your Company Details ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Your Company</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Company Name</label>
              <input
                type="text"
                value={invoice.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="e.g. Acme Ltd"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Address</label>
              <textarea
                value={invoice.companyAddress}
                onChange={(e) => updateField("companyAddress", e.target.value)}
                placeholder="e.g. 123 High Street, London"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={invoice.companyEmail}
                onChange={(e) => updateField("companyEmail", e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* ── Client Details ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Bill To</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Client Name</label>
              <input
                type="text"
                value={invoice.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Address</label>
              <textarea
                value={invoice.clientAddress}
                onChange={(e) => updateField("clientAddress", e.target.value)}
                placeholder="e.g. 456 Oak Avenue, Manchester"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={invoice.clientEmail}
                onChange={(e) => updateField("clientEmail", e.target.value)}
                placeholder="jane@client.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* ── Line Items ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-primary" />
            Line Items
          </h2>

          {/* Add Item Form */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Web design services"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddItem() }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Quantity</label>
              <input
                type="number"
                inputMode="decimal"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="1"
                min="0"
                step="0.5"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddItem() }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-card-foreground mb-1.5">Unit Price (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddItem() }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleAddItem}
            disabled={!newDesc.trim() || !newPrice || parseFloat(newPrice) < 0}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all mb-4"
          >
            <span className="flex items-center justify-center gap-1.5">
              <Plus size={15} />
              Add Item
            </span>
          </button>

          {/* Items list */}
          {invoice.lineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText size={28} className="text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No line items added</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add items above to build your invoice
              </p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 mb-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              <div className="space-y-1">
                {invoice.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 items-center rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="sm:col-span-5 text-sm text-card-foreground truncate font-medium">
                      {item.description}
                    </div>
                    <div className="sm:col-span-2 text-sm text-right tabular-nums text-muted-foreground">
                      {item.quantity}
                    </div>
                    <div className="sm:col-span-2 text-sm text-right tabular-nums text-muted-foreground">
                      {formatCurrency(item.unitPrice)}
                    </div>
                    <div className="sm:col-span-2 text-sm text-right tabular-nums font-semibold">
                      {formatCurrency(lineTotal(item))}
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Totals ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Calculator size={16} className="text-primary" />
              Invoice Totals
            </h2>
            <div className="flex items-center gap-3">
              {/* VAT rate selector */}
              {invoice.includeVat && (
                <div className="flex gap-1 rounded-lg border border-border p-0.5">
                  {VAT_RATES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => updateField("vatRate", r.value)}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                        invoice.vatRate === r.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              {/* VAT toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-muted-foreground">Include VAT</span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  invoice.includeVat ? "bg-primary" : "bg-muted"
                }`}
                onClick={() => updateField("includeVat", !invoice.includeVat)}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    invoice.includeVat ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-medium tabular-nums">{formatCurrency(sub)}</span>
            </div>
            {invoice.includeVat && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-muted-foreground">VAT ({invoice.vatRate}%)</span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(vat)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="text-base font-bold text-card-foreground">Total</span>
              <span className="text-lg font-bold tabular-nums text-card-foreground">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={invoice.lineItems.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={handleResetForm}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <RefreshCw size={15} />
            Reset Form
          </button>
        </div>

        {/* ── Invoice Preview (when populated) ── */}
        {invoice.lineItems.length > 0 && (
          <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-8 shadow-sm">
            <div className="border-b border-border pb-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {invoice.companyName || "Your Company"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                    {invoice.companyAddress || "Address"}
                  </p>
                  {invoice.companyEmail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{invoice.companyEmail}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">INVOICE</p>
                  <p className="text-xs text-muted-foreground mt-1">#{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">Date: {new Date(invoice.invoiceDate + "T00:00:00").toLocaleDateString("en-GB")}</p>
                  <p className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate + "T00:00:00").toLocaleDateString("en-GB")}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bill To</p>
              <p className="text-sm font-medium text-foreground">{invoice.clientName || "Client Name"}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{invoice.clientAddress || "Client Address"}</p>
              {invoice.clientEmail && (
                <p className="text-xs text-muted-foreground">{invoice.clientEmail}</p>
              )}
            </div>

            {/* Preview line items table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2.5 text-foreground">{item.description}</td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{item.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 text-right tabular-nums font-medium">{formatCurrency(lineTotal(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-64 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(sub)}</span>
              </div>
              {invoice.includeVat && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({invoice.vatRate}%)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(vat)}</span>
                </div>
              )}
              <div className="border-t border-border pt-1.5 flex justify-between text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed text-center">
          This is a guide tool only — for guidance only, check with your accountant.
          All data stays in your browser. Export as CSV for your records or accounting software.
        </p>

        {/* Conversion CTA — turn this invoice into a payslip */}
        {invoice.lineItems.length > 0 && (
          <ToolConversionCTA
            href={`/documents/new/payslip?gross_pay=${total.toFixed(2)}`}
            action="Generate a Payslip"
            subtitle="with the invoiced amount — get a professional PDF payslip for payroll records"
            icon="payslip"
          />
        )}
      </div>
    </DashboardShell>
  )
}