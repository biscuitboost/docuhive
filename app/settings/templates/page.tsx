"use client"

import { useEffect, useState, useCallback } from "react"
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react"

interface Template {
  id: string
  type: string
  name: string
  version: number
  promptTemplate: string
  isActive: boolean
  createdAt: string
}

interface TemplatesResponse {
  templates: Template[]
}

// Human-readable labels for document types
const DOC_TYPE_LABELS: Record<string, string> = {
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45 Form",
  job_description: "Job Description",
  nda: "NDA",
  service_agreement: "Service Agreement",
  consultant_agreement: "Consultant Agreement",
  freelancer_contract: "Freelancer Contract",
  settlement_agreement: "Settlement Agreement",
  disciplinary_grievance_letters: "Disciplinary &amp; Grievance Letters",
  flexible_working_request: "Flexible Working Request",
  gdpr_privacy_notice: "GDPR Privacy Notice",
  data_processing_agreement: "Data Processing Agreement",
  privacy_policy: "Privacy Policy",
  terms_and_conditions: "Terms &amp; Conditions",
  commercial_lease: "Commercial Lease",
  director_service_agreement: "Director Service Agreement",
  shareholder_agreement: "Shareholder Agreement",
  custom: "Custom Document",
}

// Group document types by category
const DOC_CATEGORIES: Record<string, string[]> = {
  "Employment / HR": [
    "employment_contract",
    "offer_letter",
    "staff_handbook",
    "payslip",
    "p45",
    "job_description",
    "settlement_agreement",
    "disciplinary_grievance_letters",
    "flexible_working_request",
  ],
  Contracts: ["nda", "service_agreement", "consultant_agreement", "freelancer_contract"],
  "Data Protection": ["gdpr_privacy_notice", "data_processing_agreement", "privacy_policy"],
  Commercial: ["terms_and_conditions", "commercial_lease", "director_service_agreement", "shareholder_agreement"],
}

export default function TemplatesSettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editor state
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingPrompt, setEditingPrompt] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // New template state
  const [creating, setCreating] = useState(false)
  const [newType, setNewType] = useState("")
  const [newName, setNewName] = useState("")
  const [newPrompt, setNewPrompt] = useState("")

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Employment / HR": true,
  })

  // Confirm delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates")
      if (!res.ok) throw new Error("Failed to load templates")
      const json: TemplatesResponse = await res.json()
      setTemplates(json.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const getTemplateForType = (type: string): Template | undefined =>
    templates.find((t) => t.type === type && t.isActive)

  function startEdit(template: Template) {
    setEditingTemplate(template)
    setEditingName(template.name)
    setEditingPrompt(template.promptTemplate)
    setSaveSuccess(false)
    setSaveError(null)
  }

  function cancelEdit() {
    setEditingTemplate(null)
    setEditingName("")
    setEditingPrompt("")
    setSaveSuccess(false)
    setSaveError(null)
  }

  async function handleSaveEdit() {
    if (!editingTemplate || !editingName.trim() || !editingPrompt.trim()) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingName.trim(),
          promptTemplate: editingPrompt.trim(),
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to save")
      }
      setSaveSuccess(true)
      await fetchTemplates()
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(template: Template) {
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      })
      if (!res.ok) throw new Error("Failed to toggle")
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle template")
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await fetchTemplates()
      if (editingTemplate?.id === id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCreate() {
    if (!newType || !newName.trim() || !newPrompt.trim()) return
    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          name: newName.trim(),
          promptTemplate: newPrompt.trim(),
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to create")
      }
      setCreating(false)
      setNewType("")
      setNewName("")
      setNewPrompt("")
      await fetchTemplates()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Prompt Templates</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Customise the AI prompt templates used to generate your documents. Each document type has
          a default template &mdash; create a custom one to tailor the output to your needs.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Create New Template Button */}
      {!creating && (
        <button
          onClick={() => {
            setCreating(true)
            setSaveError(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus size={14} />
          Create Custom Template
        </button>
      )}

      {/* Create Form */}
      {creating && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-foreground mb-4">New Custom Template</h4>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Document Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a type...</option>
                {Object.entries(DOC_CATEGORIES).map(([category, types]) => (
                  <optgroup key={category} label={category}>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {DOC_TYPE_LABELS[type] || type}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="Other">
                  <option value="custom">Custom Document</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Template Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Standard Employment Contract"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Prompt Template
              </label>
              <p className="mb-2 text-[11px] text-muted-foreground/60">
                Use {"{{variable_name}}"} placeholders for user-supplied values. The system prompt
                with UK legal context is automatically prepended.
              </p>
              <textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                placeholder={`Generate a document with the following details:\n\nEmployee name: {{employee_name}}\nJob title: {{job_title}}\nStart date: {{start_date}}\n...`}
              />
            </div>
            {saveError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={11} />
                {saveError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                disabled={saving || !newType || !newName.trim() || !newPrompt.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Creating..." : "Create Template"}
              </button>
              <button
                onClick={() => {
                  setCreating(false)
                  setSaveError(null)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Type Templates Grid */}
      {Object.entries(DOC_CATEGORIES).map(([category, types]) => {
        const hasTemplates = types.some((t) => !!getTemplateForType(t))
        const isExpanded = expandedCategories[category] ?? hasTemplates

        return (
          <div key={category} className="rounded-xl border border-border bg-card shadow-sm">
            <button
              onClick={() =>
                setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }))
              }
              className="flex w-full items-center gap-2 px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent/50 rounded-t-xl"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {category}
              <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                {types.filter((t) => !!getTemplateForType(t)).length}/{types.length} customised
              </span>
            </button>

            {isExpanded && (
              <div className="px-5 pb-4 space-y-2">
                {types.map((type) => {
                  const template = getTemplateForType(type)
                  const isEditing = editingTemplate?.type === type

                  return (
                    <div
                      key={type}
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {DOC_TYPE_LABELS[type] || type}
                            </span>
                            {template ? (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                Custom v{template.version}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Default
                              </span>
                            )}
                          </div>
                          {template && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                              {template.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-3 shrink-0">
                          {template ? (
                            <>
                              <button
                                onClick={() => startEdit(template)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                title="Edit template"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleToggleActive(template)}
                                className={`rounded-lg p-1.5 ${
                                  template.isActive
                                    ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                    : "text-muted-foreground hover:bg-accent"
                                }`}
                                title={template.isActive ? "Active (click to disable)" : "Inactive (click to enable)"}
                              >
                                {template.isActive ? <Check size={14} /> : <X size={14} />}
                              </button>
                              <button
                                onClick={() => handleDelete(template.id)}
                                disabled={deletingId === template.id}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                title="Delete template"
                              >
                                {deletingId === template.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setCreating(true)
                                setNewType(type)
                                setSaveError(null)
                              }}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                              title="Create template for this type"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline editor for this template */}
                      {isEditing && editingTemplate && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                              Template Name
                            </label>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                              Prompt Template
                            </label>
                            <textarea
                              value={editingPrompt}
                              onChange={(e) => setEditingPrompt(e.target.value)}
                              rows={10}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                            />
                          </div>
                          {saveError && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle size={11} />
                              {saveError}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleSaveEdit}
                              disabled={saving || !editingName.trim() || !editingPrompt.trim()}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {saving ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : saveSuccess ? (
                                <Check size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                              {saving ? "Saving..." : saveSuccess ? "Saved" : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(editingPrompt)
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Copy size={14} />
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground/60">
        Custom templates override the built-in default prompts. When generating a document, your
        custom prompt is used instead of the standard one. System context (UK employment law, ERA
        2025, etc.) is automatically included regardless of template.
      </p>
    </div>
  )
}