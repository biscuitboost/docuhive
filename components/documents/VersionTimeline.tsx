"use client";

import { useState, useEffect, useCallback } from "react";

interface VersionEntry {
  version: number;
  changeType: string;
  changeDescription: string | null;
  changedBy: string | null;
  createdAt: string;
  isIssued: boolean;
}

interface VersionTimelineProps {
  documentId: string;
  currentVersion: number;
  onRestore: (version: number) => void;
  onIssue: (version: number) => void;
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  initial: "Initial",
  ai_edit: "AI Edit",
  manual_edit: "Manual Edit",
  regenerate: "Regenerated",
  restore: "Restored",
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  initial: "bg-gray-100 text-gray-600",
  ai_edit: "bg-blue-100 text-blue-700",
  manual_edit: "bg-amber-100 text-amber-700",
  regenerate: "bg-purple-100 text-purple-700",
  restore: "bg-orange-100 text-orange-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VersionTimeline({
  documentId,
  currentVersion,
  onRestore,
  onIssue,
}: VersionTimelineProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [previewContent, setPreviewContent] = useState<Record<string, unknown> | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchVersions = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/documents/${documentId}/versions`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load versions");
        return res.json();
      })
      .then((data) => setVersions(data.versions ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  function handleSelectVersion(v: number) {
    if (selectedVersion === v) {
      setSelectedVersion(null);
      setPreviewContent(null);
      return;
    }
    setSelectedVersion(v);
    setPreviewLoading(true);
    setPreviewContent(null);

    fetch(`/api/documents/${documentId}/versions/${v}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load version");
        return res.json();
      })
      .then((data) => setPreviewContent(data.outputData ?? null))
      .catch(() => setPreviewContent(null))
      .finally(() => setPreviewLoading(false));
  }

  function handleRestore(v: number) {
    setActionLoading(v);
    setActionError(null);
    fetch(`/api/documents/${documentId}/versions/${v}/restore`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("Restore failed");
        return res.json();
      })
      .then(() => {
        onRestore(v);
        fetchVersions();
      })
      .catch((err) => setActionError(err.message))
      .finally(() => setActionLoading(null));
  }

  function handleIssue(v: number) {
    setActionLoading(v);
    setActionError(null);
    fetch(`/api/documents/${documentId}/versions/${v}/issue`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("Issue failed");
        return res.json();
      })
      .then(() => {
        onIssue(v);
        fetchVersions();
      })
      .catch((err) => setActionError(err.message))
      .finally(() => setActionLoading(null));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        {error}
        <button onClick={fetchVersions} className="ml-2 underline">
          Retry
        </button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500">
        No version history available yet.
      </div>
    );
  }

  return (
    <div>
      <div className="relative ml-4 border-l-2 border-gray-200">
        {versions.map((v) => {
          const isCurrent = v.version === currentVersion;
          const isPreviewing = selectedVersion === v.version;
          const isBusy = actionLoading === v.version;

          return (
            <div key={v.version} className="relative mb-6 pl-6 last:mb-0">
              {/* Timeline dot */}
              <div
                className={`absolute -left-[13px] top-1 h-5 w-5 rounded-full border-2 ${
                  isCurrent
                    ? "border-blue-500 bg-blue-500"
                    : v.isIssued
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300 bg-white"
                }`}
              />

              {/* Version header */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSelectVersion(v.version)}
                  className={`text-sm font-semibold hover:text-blue-600 ${
                    isCurrent ? "text-blue-600" : "text-gray-900"
                  }`}
                >
                  v{v.version}
                </button>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    CHANGE_TYPE_COLORS[v.changeType] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {CHANGE_TYPE_LABELS[v.changeType] || v.changeType}
                </span>
                {v.isIssued && (
                  <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Issued
                  </span>
                )}
                {isCurrent && !v.isIssued && (
                  <span className="text-xs font-medium text-blue-600">Current</span>
                )}
                <span className="text-xs text-gray-400">{formatDate(v.createdAt)}</span>
              </div>

              {/* Change description */}
              {v.changeDescription && (
                <p className="mt-1 text-sm text-gray-600">&ldquo;{v.changeDescription}&rdquo;</p>
              )}

              {/* Action buttons */}
              <div className="mt-2 flex flex-wrap gap-2">
                {!isCurrent && (
                  <button
                    onClick={() => handleRestore(v.version)}
                    disabled={isBusy}
                    className="text-xs font-medium text-orange-600 hover:text-orange-500 disabled:opacity-50"
                  >
                    {isBusy ? "Restoring..." : "Restore"}
                  </button>
                )}
                {!v.isIssued && (
                  <button
                    onClick={() => handleIssue(v.version)}
                    disabled={isBusy}
                    className="text-xs font-medium text-green-600 hover:text-green-500 disabled:opacity-50"
                  >
                    {isBusy ? "Issuing..." : "Mark as Issued"}
                  </button>
                )}
              </div>

              {/* Action error */}
              {actionError && actionLoading === v.version && (
                <p className="mt-1 text-xs text-red-500">{actionError}</p>
              )}

              {/* Preview content */}
              {isPreviewing && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : previewContent ? (
                    <div className="prose prose-xs max-w-none">
                      <p className="mb-2 text-xs font-medium text-gray-500">
                        Preview of v{v.version}
                      </p>
                      <pre className="max-h-60 overflow-y-auto rounded bg-white p-3 text-xs text-gray-700">
                        {JSON.stringify(previewContent, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Failed to load preview.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { CHANGE_TYPE_LABELS, CHANGE_TYPE_COLORS, formatDate };