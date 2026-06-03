"use client";

import { useState } from "react";

interface InlineSectionEditorProps {
  sectionKey: string;
  content: string;
  documentId: string;
  status: string;
  onSaved: (sectionKey: string, newContent: string) => void;
}

export default function InlineSectionEditor({
  sectionKey,
  content,
  documentId,
  status,
  onSaved,
}: InlineSectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Only allow editing generated/issued documents
  const canEdit = status === "generated" || status === "issued";

  function handleSave() {
    if (draft.trim() === content.trim()) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    fetch(`/api/documents/${documentId}/sections/${sectionKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft.trim() }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Save failed" }));
          throw new Error(err.error || "Save failed");
        }
        return res.json();
      })
      .then((data) => {
        onSaved(sectionKey, draft.trim());
        setSaved(true);
        setIsEditing(false);
        setTimeout(() => setSaved(false), 2000);
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false));
  }

  function handleCancel() {
    setDraft(content);
    setError(null);
    setIsEditing(false);
  }

  if (!canEdit) {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {content}
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => {
          setDraft(content);
          setIsEditing(true);
        }}
        className="group relative cursor-pointer whitespace-pre-wrap text-sm leading-relaxed text-gray-700 transition-colors hover:bg-blue-50/50 hover:outline hover:outline-1 hover:outline-blue-200"
      >
        {content}
        <span className="invisible ml-2 text-xs text-blue-500 group-hover:visible">
          Click to edit
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={Math.max(3, draft.split("\n").length)}
        disabled={saving}
        autoFocus
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>
    </div>
  );
}