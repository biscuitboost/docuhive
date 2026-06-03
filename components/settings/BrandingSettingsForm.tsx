"use client"

import { useEffect, useState, FormEvent } from "react"
import { useUser } from "@clerk/nextjs"
import { Palette, FileImage, FileText, Check, Loader2, ShieldAlert, SprayCan } from "lucide-react"

interface BrandingData {
  logoUrl: string | null
  primaryColor: string
  documentFooter: string | null
  documentHeader: string | null
}

interface PlanInfo {
  plan: string
  allowBranding: boolean
}

export default function BrandingSettingsForm() {
  const { isLoaded: clerkLoaded } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanInfo | null>(null)

  const [branding, setBranding] = useState<BrandingData>({
    logoUrl: null,
    primaryColor: "#2563eb",
    documentFooter: null,
    documentHeader: null,
  })

  useEffect(() => {
    if (!clerkLoaded) return
    Promise.all([
      fetch("/api/tenants").then((r) => r.json()),
      fetch("/api/billing/subscription").then((r) => r.json()),
    ])
      .then(([tenantData, subData]) => {
        if (tenantData.branding) {
          setBranding({
            logoUrl: tenantData.branding.logoUrl || null,
            primaryColor: tenantData.branding.primaryColor || "#2563eb",
            documentFooter: tenantData.branding.documentFooter || null,
            documentHeader: tenantData.branding.documentHeader || null,
          })
        }
        if (subData.plan) {
          setPlan({ plan: subData.plan, allowBranding: subData.allowBranding ?? false })
        }
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [clerkLoaded])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        branding: {
          logoUrl: branding.logoUrl || null,
          primaryColor: branding.primaryColor,
          documentFooter: branding.documentFooter || null,
          documentHeader: branding.documentHeader || null,
        },
      }

      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to save")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-50" />
          </div>
        ))}
      </div>
    )
  }

  if (plan && !plan.allowBranding) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldAlert size={40} className="mx-auto text-amber-400" />
        <h3 className="mt-4 text-lg font-semibold text-amber-900">Upgrade to access branding</h3>
        <p className="mt-2 text-sm text-amber-700">
          Custom branding (logo, colours, document headers &amp; footers) is available on{" "}
          <strong>Pro</strong> and <strong>Team</strong> plans.
        </p>
        <a
          href="/settings/billing"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
        >
          View Plans
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo URL */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <FileImage size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Company Logo</h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          A publicly accessible image URL. Displayed on generated documents.
        </p>
        <div className="mt-3">
          <input
            type="text"
            value={branding.logoUrl ?? ""}
            onChange={(e) => setBranding((b) => ({ ...b, logoUrl: e.target.value }))}
            className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://example.com/logo.png"
          />
          {branding.logoUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={branding.logoUrl}
                alt="Logo preview"
                className="h-10 w-auto rounded border border-gray-200 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
              <span className="text-xs text-gray-400">Preview</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Colour */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Primary Colour</h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Used for headings, accents, and highlights in generated documents.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="color"
            value={branding.primaryColor}
            onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))}
            className="h-9 w-9 cursor-pointer rounded border border-gray-300"
          />
          <input
            type="text"
            value={branding.primaryColor}
            onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))}
            className="block w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="#2563eb"
          />
          <div
            className="h-8 w-16 rounded border"
            style={{ backgroundColor: branding.primaryColor }}
          />
        </div>
      </div>

      {/* Document Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Document Header</h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Text displayed at the top of every generated document (e.g. company name, address).
        </p>
        <div className="mt-3">
          <textarea
            value={branding.documentHeader ?? ""}
            onChange={(e) => setBranding((b) => ({ ...b, documentHeader: e.target.value }))}
            rows={2}
            className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Acme Corp | 123 High Street, London"
          />
        </div>
      </div>

      {/* Document Footer */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <SprayCan size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Document Footer</h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Text displayed at the bottom of every generated document (e.g. confidentiality notice).
        </p>
        <div className="mt-3">
          <textarea
            value={branding.documentFooter ?? ""}
            onChange={(e) => setBranding((b) => ({ ...b, documentFooter: e.target.value }))}
            rows={2}
            className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Confidential — for authorised recipients only"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : saved ? (
          <Check size={14} />
        ) : null}
        {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
      </button>
    </form>
  )
}