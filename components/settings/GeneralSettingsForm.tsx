"use client"

import { useEffect, useState, FormEvent } from "react"
import { useUser } from "@clerk/nextjs"
import { Mail, User, Building2, Check, Loader2, Settings2 } from "lucide-react"

import { JURISDICTIONS, type Jurisdiction } from "@/lib/utils/constants"

interface TenantDefaults {
  companyName: string
  companyAddress: string
  companyNumber: string
  vatNumber: string
  defaultEmploymentType: string
  defaultSalaryPeriod: string
  defaultFeePeriod: string
  defaultPaymentTerms: string
  defaultNoticePeriod: string
  defaultProbationPeriod: string
  defaultPensionScheme: string
  defaultSickPay: string
  defaultHolidayEntitlement: string
  defaultWorkingHours: string
  defaultConfidentialityPeriod: string
  icoRegistrationNumber: string
  dpoName: string
  dpoEmail: string
}

const EMPTY_DEFAULTS: TenantDefaults = {
  companyName: "",
  companyAddress: "",
  companyNumber: "",
  vatNumber: "",
  defaultEmploymentType: "",
  defaultSalaryPeriod: "",
  defaultFeePeriod: "",
  defaultPaymentTerms: "",
  defaultNoticePeriod: "",
  defaultProbationPeriod: "",
  defaultPensionScheme: "",
  defaultSickPay: "",
  defaultHolidayEntitlement: "",
  defaultWorkingHours: "",
  defaultConfidentialityPeriod: "",
  icoRegistrationNumber: "",
  dpoName: "",
  dpoEmail: "",
}

export default function GeneralSettingsPage() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [orgName, setOrgName] = useState("")
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("england_wales")
  const [defaults, setDefaults] = useState<TenantDefaults>(EMPTY_DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedDefaults, setSavedDefaults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [defaultsError, setDefaultsError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((json) => {
        if (json.name) setOrgName(json.name)
        if (json.jurisdiction) setJurisdiction(json.jurisdiction)
        if (json.defaults) {
          setDefaults({ ...EMPTY_DEFAULTS, ...json.defaults })
        }
      })
      .catch(() => setError("Failed to load organisation details"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim(), jurisdiction }),
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

  async function handleDefaultsSave(e: FormEvent) {
    e.preventDefault()
    setSavingDefaults(true)
    setSavedDefaults(false)
    setDefaultsError(null)

    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to save defaults")
      }
      setSavedDefaults(true)
      setTimeout(() => setSavedDefaults(false), 3000)
    } catch (err) {
      setDefaultsError(err instanceof Error ? err.message : "Failed to save defaults")
    } finally {
      setSavingDefaults(false)
    }
  }

  function updateDefault(key: keyof TenantDefaults, value: string) {
    setDefaults((prev) => ({ ...prev, [key]: value }))
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

  return (
    <div className="space-y-6">
      {/* Organisation Name */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Organisation Name
            </h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            This is displayed on documents and invoices.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your organisation name"
              required
            />
            <button
              type="submit"
              disabled={saving || !orgName.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <Check size={14} />
              ) : null}
              {saving ? "Saving..." : saved ? "Saved" : "Save"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>
      </form>

      {/* Jurisdiction */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Jurisdiction
          </h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select the legal jurisdiction for this organisation. This affects statutory thresholds and document generation.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value as Jurisdiction)}
            className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {JURISDICTIONS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Organisation Defaults */}
      <form onSubmit={handleDefaultsSave}>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Organisation Defaults
            </h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            These values pre-fill document wizard forms. Leave blank to skip.
          </p>
          <div className="mt-4 space-y-4">
            {/* Company Address */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Company Address</label>
              <textarea
                value={defaults.companyAddress}
                onChange={(e) => updateDefault("companyAddress", e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="123 High Street, London, EC1A 1BB"
              />
            </div>

            {/* Row: Company Number + VAT Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Company Number</label>
                <input
                  type="text"
                  value={defaults.companyNumber}
                  onChange={(e) => updateDefault("companyNumber", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">VAT Number</label>
                <input
                  type="text"
                  value={defaults.vatNumber}
                  onChange={(e) => updateDefault("vatNumber", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="GB123456789"
                />
              </div>
            </div>

            {/* Row: Employment Type + Salary Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Employment Type</label>
                <select
                  value={defaults.defaultEmploymentType}
                  onChange={(e) => updateDefault("defaultEmploymentType", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="permanent">Permanent</option>
                  <option value="fixed_term">Fixed term</option>
                  <option value="zero_hours">Zero hours</option>
                  <option value="part_time">Part time</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Salary Period</label>
                <select
                  value={defaults.defaultSalaryPeriod}
                  onChange={(e) => updateDefault("defaultSalaryPeriod", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="year">Per year</option>
                  <option value="month">Per month</option>
                  <option value="hour">Per hour</option>
                </select>
              </div>
            </div>

            {/* Row: Fee Period + Payment Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Fee Period</label>
                <select
                  value={defaults.defaultFeePeriod}
                  onChange={(e) => updateDefault("defaultFeePeriod", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="day">Per day</option>
                  <option value="hour">Per hour</option>
                  <option value="month">Per month</option>
                  <option value="project">Per project</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Payment Terms</label>
                <input
                  type="text"
                  value={defaults.defaultPaymentTerms}
                  onChange={(e) => updateDefault("defaultPaymentTerms", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="30 days"
                />
              </div>
            </div>

            {/* Row: Working Hours + Notice Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Working Hours</label>
                <input
                  type="text"
                  value={defaults.defaultWorkingHours}
                  onChange={(e) => updateDefault("defaultWorkingHours", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="37.5 hours per week"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Notice Period</label>
                <input
                  type="text"
                  value={defaults.defaultNoticePeriod}
                  onChange={(e) => updateDefault("defaultNoticePeriod", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="1 month"
                />
              </div>
            </div>

            {/* Row: Probation Period + Holiday Entitlement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Probation Period</label>
                <input
                  type="text"
                  value={defaults.defaultProbationPeriod}
                  onChange={(e) => updateDefault("defaultProbationPeriod", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="6 months"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Holiday Entitlement</label>
                <input
                  type="text"
                  value={defaults.defaultHolidayEntitlement}
                  onChange={(e) => updateDefault("defaultHolidayEntitlement", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="28 days"
                />
              </div>
            </div>

            {/* Row: Pension Scheme + Sick Pay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Pension Scheme</label>
                <input
                  type="text"
                  value={defaults.defaultPensionScheme}
                  onChange={(e) => updateDefault("defaultPensionScheme", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Auto-enrolment (NEST)"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Default Sick Pay</label>
                <input
                  type="text"
                  value={defaults.defaultSickPay}
                  onChange={(e) => updateDefault("defaultSickPay", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="SSP as statutory"
                />
              </div>
            </div>

            {/* Row: Confidentiality Period (full width hint) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Default Confidentiality Period (for NDAs)</label>
              <input
                type="text"
                value={defaults.defaultConfidentialityPeriod}
                onChange={(e) => updateDefault("defaultConfidentialityPeriod", e.target.value)}
                className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="2 years"
              />
            </div>

            {/* ICO Registration Number */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">ICO Registration Number</label>
              <input
                type="text"
                value={defaults.icoRegistrationNumber}
                onChange={(e) => updateDefault("icoRegistrationNumber", e.target.value)}
                className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="ZB123456"
              />
            </div>

            {/* Row: DPO Name + DPO Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">DPO Name</label>
                <input
                  type="text"
                  value={defaults.dpoName}
                  onChange={(e) => updateDefault("dpoName", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">DPO Email</label>
                <input
                  type="text"
                  value={defaults.dpoEmail}
                  onChange={(e) => updateDefault("dpoEmail", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="dpo@example.com"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={savingDefaults}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingDefaults ? (
                <Loader2 size={14} className="animate-spin" />
              ) : savedDefaults ? (
                <Check size={14} />
              ) : null}
              {savingDefaults ? "Saving..." : savedDefaults ? "Saved" : "Save Defaults"}
            </button>
          </div>
          {defaultsError && (
            <p className="mt-2 text-xs text-red-600">{defaultsError}</p>
          )}
        </div>
      </form>

      {/* Personal Details */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Personal Details
          </h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Your account information from Clerk.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <span className="text-xs font-bold">
                {clerkLoaded && user?.firstName
                  ? user.firstName[0].toUpperCase()
                  : "?"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {clerkLoaded && user?.fullName
                  ? user.fullName
                  : "Loading..."}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail size={12} />
                <span>
                  {clerkLoaded && user?.primaryEmailAddress
                    ? user.primaryEmailAddress.emailAddress
                    : "Loading..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}