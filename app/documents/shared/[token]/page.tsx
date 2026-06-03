"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { FileText, Sparkles } from "lucide-react"

interface SharedDoc {
  id: string
  title: string
  type: string
  status: string
  content: Record<string, unknown> | null
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45",
}

function formatSectionKey(key: string): string {
  return key
    .replace(/^(\d+)_(.+)$/, "$1. $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function renderContent(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map(renderContent).join("\n")
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => {
        const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        return `${label}\n${renderContent(v)}`
      })
      .join("\n\n")
  }
  return ""
}

export default function SharedDocumentPage() {
  const params = useParams()
  const [doc, setDoc] = useState<SharedDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.token) return
    fetch(`/api/documents/shared/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("This shared document link is no longer valid.")
          throw new Error("Failed to load document")
        }
        return res.json()
      })
      .then((data) => setDoc(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [params.token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading shared document...</p>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <FileText size={48} className="mx-auto text-gray-300" />
          <h1 className="mt-4 text-lg font-semibold text-gray-900">Document Not Available</h1>
          <p className="mt-2 text-sm text-gray-500">{error || "This shared document link is no longer valid."}</p>
          <Link
            href="https://docuhive.vercel.app"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Sparkles size={16} />
            DocuHive
          </Link>
        </div>
      </div>
    )
  }

  const content = doc.content as Record<string, unknown> | null
  const sections = content ? Object.entries(content) : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
            <Sparkles size={18} />
            DocuHive
          </div>
          <p className="text-xs text-gray-400">Shared document</p>
        </div>
      </div>

      {/* Document content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Title */}
          <div className="border-b border-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {TYPE_LABELS[doc.type] || doc.type} &middot;{" "}
              {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Content */}
          {sections.length > 0 ? (
            <div className="p-6">
              <div className="space-y-6">
                {sections.map(([key, value]) => (
                  <div key={key}>
                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                      {formatSectionKey(key)}
                    </h2>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {renderContent(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">
              No content available for this document.
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Powered by DocuHive — AI-Generated UK Employment Documents
        </p>
      </div>
    </div>
  )
}