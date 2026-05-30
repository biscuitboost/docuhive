"use client"

import { useEffect, useState, FormEvent } from "react"
import { useUser } from "@clerk/nextjs"
import { Mail, User, Building2, Check, Loader2 } from "lucide-react"

export default function GeneralSettingsPage() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [orgName, setOrgName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((json) => {
        if (json.name) setOrgName(json.name)
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
        body: JSON.stringify({ name: orgName.trim() }),
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
        {[1, 2].map((i) => (
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
          <div className="mt-3 flex items-center gap-3">
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
