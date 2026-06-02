"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface DocumentEditorProps {
  documentId: string;
  status: string;
  onDocumentUpdated: () => void;
}

/**
 * AI-powered document editing widget.
 *
 * Renders below document content on the detail page, only for
 * generated/complete documents (not drafts or archived).
 *
 * Sends the user's edit instruction to POST /api/documents/:id/edit,
 * shows loading/success/error states inline, and triggers a parent
 * re-fetch on success so the page re-renders with the new version.
 */
export default function DocumentEditor({
  documentId,
  status,
  onDocumentUpdated,
}: DocumentEditorProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Only render for generated/complete documents
  if (status === "draft" || status === "archived") return null;

  const handleSubmit = async () => {
    const trimmed = instruction.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setSuccess(`Document updated — v${data.version}`);
      setInstruction("");

      // Show success momentarily, then re-fetch parent to show new content
      setTimeout(() => {
        onDocumentUpdated();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-gray-900">Edit with AI</h3>
      <p className="mb-3 mt-1 text-xs text-gray-500">
        Be specific &mdash; e.g. &ldquo;Change the notice period to 3 months&rdquo;
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell the AI what to change..."
            disabled={loading}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm",
              "text-gray-900 placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-60",
              error ? "border-red-300" : "border-gray-300"
            )}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !instruction.trim()}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            loading || !instruction.trim()
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.97]"
          )}
        >
          {loading ? "Updating\u2026" : "Update"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Success message */}
      {success && (
        <p className="mt-2 text-sm font-medium text-green-600">{success}</p>
      )}
    </div>
  );
}