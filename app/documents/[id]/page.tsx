"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import DocumentEditor from "@/components/documents/DocumentEditor";
import VersionTimeline from "@/components/documents/VersionTimeline";
import InlineSectionEditor from "@/components/documents/InlineSectionEditor";

interface DocumentDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  content: Record<string, unknown> | null;
  downloadUrl: string;
  wordDownloadUrl: string;
  inputData: Record<string, unknown>;
  aiModel: string;
  version: number;
  currentIssuedVersion: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  generated: "bg-green-100 text-green-700",
  downloaded: "bg-blue-100 text-blue-700",
  archived: "bg-red-100 text-red-700",
  issued: "bg-emerald-100 text-emerald-700",
};

/**
 * Clean up a section key into a readable heading.
 * E.g. "1_interpretation" -> "1. Interpretation"
 */
function formatSectionKey(key: string): string {
  return key
    .replace(/^(\d+)_(.+)$/, "$1. $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Attempt to parse a string as JSON. If successful, render the parsed value recursively.
 */
function tryParseJsonAndRender(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null) {
      return renderContent(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Recursively render content that may be a string, nested object, or array.
 */
function renderContent(value: unknown): string {
  if (typeof value === "string") {
    const parsed = tryParseJsonAndRender(value);
    if (parsed !== null) return parsed;
    return value.replace(/\{\{[^}]+\}\}/g, "[To be completed]");
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(renderContent).join("\n");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => {
        const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const rendered = renderContent(v);
        return `${label}\n${rendered}`;
      })
      .join("\n\n");
  }
  return "";
}

/**
 * Recursively find string values in document content for inline editing.
 * Returns a flat map of "section.subsection" paths to string values.
 */
function extractSections(
  data: Record<string, unknown>,
  prefix = ""
): { key: string; value: string }[] {
  const sections: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      sections.push({ key: path, value: v });
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      sections.push(...extractSections(v as Record<string, unknown>, path));
    }
  }
  return sections;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVersionPanel, setShowVersionPanel] = useState(false);

  const refreshDocument = useCallback(() => {
    if (!params.id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/documents/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Document not found");
          if (res.status === 401) throw new Error("Please sign in to view this document");
          throw new Error("Failed to load document");
        }
        return res.json();
      })
      .then((data) => setDoc(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const silentRefresh = useCallback(() => {
    if (!params.id) return;
    fetch(`/api/documents/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setDoc(data); })
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    refreshDocument();
  }, [refreshDocument]);

  // Handle section save from inline editor (used by InlineSectionEditor callback)
  function handleSectionSaved(_sectionKey: string, _newContent: string) {
    silentRefresh();
  }

  // Handle version restore/issue from version timeline
  function handleVersionChange() {
    silentRefresh();
  }

  // -- Loading state --
  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading document...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // -- Error state --
  if (error || !doc) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-red-500">{error ?? "Document not found."}</p>
          <Link
            href="/documents"
            className="mt-4 text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to documents
          </Link>
        </div>
      </DashboardShell>
    );
  }

  // -- Document content sections --
  let contentToRender: Record<string, unknown> | null = (doc.content ?? null) as Record<string, unknown> | null;
  if (contentToRender && typeof contentToRender === "object" && "rawDocument" in contentToRender && typeof (contentToRender as any).rawDocument === "string") {
    let raw = (contentToRender as any).rawDocument.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    try {
      contentToRender = JSON.parse(raw);
    } catch {
      const braceMatch = raw.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try { contentToRender = JSON.parse(braceMatch[0]); } catch { /* keep original */ }
      }
    }
  }

  const sections = contentToRender ? Object.entries(contentToRender) : [];
  const inputEntries = Object.entries(doc.inputData || {});
  const hasContent = sections.length > 0 && doc.status !== "draft";

  // Extract flat sections for inline editing
  // Unused in current render — kept for future split-view feature

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to documents
        </Link>

        {/* Header card */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white">
          {/* Title row */}
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold text-gray-900">
                  {doc.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {TYPE_LABELS[doc.type] || doc.type} &middot; v{doc.version}
                  {" — "}
                  {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Issued badge */}
                {doc.currentIssuedVersion && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    v{doc.currentIssuedVersion} Issued
                  </span>
                )}
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_STYLES[doc.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Main content area */}
            <div className="flex-1">
              {/* Document content with inline editing */}
              {hasContent ? (
                <div className="p-6">
                  <div className="space-y-6">
                    {sections.map(([key, value]) => {
                      const rendered = renderContent(value);

                      return (
                        <div key={key} className="last:mb-0">
                          <h2 className="mb-3 text-base font-semibold text-gray-900">
                            {formatSectionKey(key)}
                          </h2>
                          <InlineSectionEditor
                            sectionKey={key}
                            content={rendered}
                            documentId={doc.id}
                            status={doc.status}
                            onSaved={handleSectionSaved}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                    <p className="text-sm text-gray-500">
                      {doc.status === "draft"
                        ? "This document has not been generated yet."
                        : "No content available for this document."}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Document Editor */}
              <div className="border-t border-gray-100 p-4 sm:p-6">
                <DocumentEditor
                  documentId={doc.id}
                  status={doc.status}
                  onDocumentUpdated={silentRefresh}
                />
              </div>

              {/* Download buttons */}
              <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-6 py-4">
                {hasContent ? (
                  <>
                    <a
                      href={doc.downloadUrl}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download PDF
                    </a>
                    <a
                      href={doc.wordDownloadUrl}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download Word
                    </a>
                    {/* Version history toggle */}
                    <button
                      onClick={() => setShowVersionPanel(!showVersionPanel)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm ${
                        showVersionPanel
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Version History
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    Downloads will be available once the document is generated.
                  </p>
                )}
              </div>
            </div>

            {/* Version history sidebar panel */}
            {showVersionPanel && (
              <div className="w-80 shrink-0 border-l border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
                  <button
                    onClick={() => setShowVersionPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <VersionTimeline
                  documentId={doc.id}
                  currentVersion={doc.version}
                  onRestore={handleVersionChange}
                  onIssue={handleVersionChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Input data summary */}
        {inputEntries.length > 0 && (
          <details className="mt-6 rounded-xl border border-gray-200 bg-white">
            <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Input Data Used
            </summary>
            <div className="border-t border-gray-100 p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                {inputEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium uppercase text-gray-500">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-0.5 text-sm text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        )}

        {/* AI model attribution */}
        {doc.aiModel && (
          <p className="mt-4 text-right text-xs text-gray-400">
            Generated by {doc.aiModel}
          </p>
        )}
      </div>
    </DashboardShell>
  );
}