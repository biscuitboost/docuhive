"use client"

import { useEffect, useState } from "react"
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, KeyRound, AlertCircle, Loader2, ToggleLeft, ToggleRight } from "lucide-react"

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  lastFour: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

interface NewKeyResult {
  id: string
  name: string
  key: string
  keyPrefix: string
  lastFour: string
}

function formatDate(iso: string | null) {
  if (!iso) return "Never"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ApiSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create key modal
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Newly created key (shown once)
  const [justCreated, setJustCreated] = useState<NewKeyResult | null>(null)
  const [copied, setCopied] = useState(false)

  function loadKeys() {
    setLoading(true)
    setError(null)
    fetch("/api/keys")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load API keys")
        return r.json()
      })
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setKeys(json.keys || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadKeys()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)

    const trimmed = newKeyName.trim()
    if (!trimmed) {
      setCreateError("Enter a name for your API key")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })

      const json = await res.json()

      if (!res.ok) {
        setCreateError(json.error || "Failed to create key")
        return
      }

      setJustCreated(json)
      setNewKeyName("")
      setShowCreate(false)
      loadKeys()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Network error")
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(keyItem: ApiKey) {
    try {
      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !keyItem.isActive }),
      })

      if (!res.ok) {
        const json = await res.json()
        console.error("Failed to toggle key:", json.error)
        return
      }

      loadKeys()
    } catch (e) {
      console.error("Failed to toggle key:", e)
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm("Are you sure you want to delete this API key? Any integrations using it will stop working.")) {
      return
    }

    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        console.error("Failed to delete key:", json.error)
        return
      }
      loadKeys()
    } catch (e) {
      console.error("Failed to delete key:", e)
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage API keys for programmatic document generation.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true)
            setJustCreated(null)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      {/* New key notification banner */}
      {justCreated && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <Key className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-emerald-900">API Key Created</h3>
              <p className="mt-1 text-sm text-emerald-700">
                This is the only time you&apos;ll see the full key. Copy it now — you won&apos;t be able to see it again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-emerald-100 px-3 py-2 text-sm font-mono text-emerald-900">
                  {justCreated.key}
                </code>
                <button
                  onClick={() => copyKey(justCreated.key)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <button
              onClick={() => setJustCreated(null)}
              className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-100 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Create key modal */}
      {showCreate && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">Create New API Key</h3>
          <form onSubmit={handleCreate} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label htmlFor="key-name" className="block text-sm font-medium text-gray-700">
                Key Name
              </label>
              <input
                id="key-name"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production, CI, Staging"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              {createError && (
                <p className="mt-1 text-xs text-red-600">{createError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Keys list */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Key className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">No API keys</p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first API key to start using the DocuHive API.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((keyItem) => (
              <div
                key={keyItem.id}
                className={`rounded-xl border p-4 ${
                  keyItem.isActive
                    ? "border-gray-200 bg-white"
                    : "border-gray-100 bg-gray-50 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      keyItem.isActive ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"
                    }`}>
                      <Key className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {keyItem.name}
                      </p>
                      <p className="text-xs font-mono text-gray-500">
                        {keyItem.keyPrefix}...{keyItem.lastFour}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-xs text-gray-500">
                      Last used: {formatDate(keyItem.lastUsedAt)}
                    </span>
                    <span className="sm:hidden text-[10px] text-gray-400">
                      {formatDate(keyItem.lastUsedAt)}
                    </span>
                    <button
                      onClick={() => handleToggle(keyItem)}
                      className={`rounded-lg p-1.5 transition-colors ${
                        keyItem.isActive
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                      title={keyItem.isActive ? "Disable key" : "Enable key"}
                    >
                      {keyItem.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(keyItem.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API docs section */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900">API Usage</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your API key to generate documents programmatically. Include it in the Authorization header.
        </p>
        <div className="mt-4 rounded-lg bg-gray-900 p-4">
          <pre className="text-xs text-gray-100 overflow-x-auto leading-relaxed">
{`curl -X POST https://docuhive.co.uk/api/v1/documents/generate \\
  -H "Authorization: Bearer dhv1_xxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "docType": "employment_contract",
    "title": "Employee Contract",
    "userInputs": {
      "employee_name": "Jane Smith",
      "job_title": "Software Engineer",
      "start_date": "2026-01-01",
      "salary": "55000"
    }
  }'`}
          </pre>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          API keys inherit your plan&apos;s document limits. Generate documents programmatically and track usage from your dashboard.
        </p>
      </div>
    </div>
  )
}