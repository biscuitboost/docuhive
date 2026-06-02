"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";

interface DocumentDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  content: Record<string, string> | null;
  downloadUrl: string;
  wordDownloadUrl: string;
  inputData: Record<string, string>;
  aiModel: string;
  version: number;
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
 * Recursively render content that may be a string, nested object, or array.
 * AI output often has nested sections (e.g. header → company_letterhead, subject)
 * that need to be flattened into readable text.
 */
function renderContent(value: unknown): string {
  if (typeof value === "string") {
    // Clean up any leftover {{placeholder}} tags the AI didn't fill
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

export default function DocumentDetailPage() {
  const params = useParams();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  // Handle case where content is wrapped in { rawDocument: "<string>" }
  let contentToRender = doc.content;
  if (contentToRender && typeof contentToRender === "object" && "rawDocument" in contentToRender && typeof contentToRender.rawDocument === "string") {
    try {
      contentToRender = JSON.parse(contentToRender.rawDocument);
    } catch {
      // Nested parse failed — use original content as-is
    }
  }
  const sections = contentToRender ? Object.entries(contentToRender) : [];
  const inputEntries = Object.entries(doc.inputData || {});

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl">
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
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_STYLES[doc.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {doc.status}
              </span>
            </div>
          </div>

          {/* Document content */}
          {sections.length > 0 ? (
            <div className="p-6">
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed">
                {sections.map(([key, value]) => (
                  <div key={key} className="mb-6 last:mb-0">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                      {formatSectionKey(key)}
                    </h2>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {renderContent(value)}
                    </div>
                  </div>
                ))}
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

          {/* Download buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-6 py-4">
            {sections.length > 0 || doc.status !== "draft" ? (
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
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Downloads will be available once the document is generated.
              </p>
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
