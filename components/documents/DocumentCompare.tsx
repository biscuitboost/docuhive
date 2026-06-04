"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowLeftRight, ChevronDown, ChevronRight } from "lucide-react";

interface VersionMeta {
  version: number;
  changeType: string;
  changeDescription: string | null;
  createdAt: string;
  outputData: Record<string, unknown>;
}

interface WordDiffSegment {
  text: string;
  type: "same" | "insert" | "delete";
}

interface SectionDiff {
  key: string;
  status: "unchanged" | "added" | "removed" | "modified";
  v1Value: string | null;
  v2Value: string | null;
  wordDiff: WordDiffSegment[] | null;
}

interface DiffResult {
  sections: SectionDiff[];
  totalChanges: number;
  sectionsChanged: number;
}

interface CompareData {
  documentId: string;
  versions: [VersionMeta, VersionMeta];
  diff: DiffResult;
}

interface DocumentCompareProps {
  documentId: string;
  versionNum: number;
  onClose: () => void;
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  initial: "Initial",
  ai_edit: "AI Edit",
  manual_edit: "Manual",
  regenerate: "Regenerated",
  restore: "Restored",
};

const STATUS_COLORS: Record<string, string> = {
  added: "bg-green-100 text-green-800 border-green-300",
  removed: "bg-red-100 text-red-800 border-red-300",
  modified: "bg-amber-100 text-amber-800 border-amber-300",
  unchanged: "bg-gray-50 text-gray-400 border-gray-200",
};

export default function DocumentCompare({
  documentId,
  versionNum,
  onClose,
}: DocumentCompareProps) {
  const [v1, setV1] = useState<number | null>(null);
  const [v2, setV2] = useState<number | null>(null);
  const [versionsList, setVersionsList] = useState<
    { version: number; createdAt: string; changeType: string }[]
  >([]);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [loadingList, setLoadingList] = useState(true);

  // Fetch available versions
  useEffect(() => {
    setLoadingList(true);
    fetch(`/api/documents/${documentId}/versions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const versions = (data?.versions ?? []) as {
          version: number;
          createdAt: string;
          changeType: string;
        }[];
        setVersionsList(versions.slice().reverse()); // ascending
        // Pre-select current version and its predecessor
        if (versions.length >= 2) {
          const sorted = [...versions].sort(
            (a, b) => b.version - a.version
          );
          setV1(sorted[1].version);
          setV2(sorted[0].version);
        } else if (versions.length === 1) {
          setV1(versionNum);
        }
      })
      .catch(() => setError("Failed to load versions"))
      .finally(() => setLoadingList(false));
  }, [documentId, versionNum]);

  const handleCompare = useCallback(async () => {
    if (!v1 || !v2 || v1 === v2) return;
    setLoading(true);
    setError(null);
    setCompareData(null);

    try {
      const res = await fetch(
        `/api/documents/${documentId}/compare?v1=${Math.min(v1, v2)}&v2=${Math.max(v1, v2)}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Comparison failed");
      }
      const data = await res.json();
      setCompareData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }, [documentId, v1, v2]);

  useEffect(() => {
    if (v1 && v2 && v1 !== v2) {
      handleCompare();
    }
  }, [v1, v2, handleCompare]);

  // Only show changed sections by default, allow toggling all
  const [showAll, setShowAll] = useState(false);

  const displayedSections = compareData
    ? compareData.diff.sections.filter(
        (s) => showAll || s.status !== "unchanged"
      )
    : [];

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Create a label like "v2 → v3"
  const compareLabel =
    v1 && v2
      ? `v${Math.min(v1, v2)} → v${Math.max(v1, v2)}`
      : "Select two versions";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Compare Versions
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      {/* Version selectors */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={v1 ?? ""}
            onChange={(e) => setV1(Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select version...
            </option>
            {versionsList.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version} —{" "}
                {CHANGE_TYPE_LABELS[v.changeType] || v.changeType}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400">vs</span>
          <select
            value={v2 ?? ""}
            onChange={(e) => setV2(Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select version...
            </option>
            {versionsList.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version} —{" "}
                {CHANGE_TYPE_LABELS[v.changeType] || v.changeType}
              </option>
            ))}
          </select>
        </div>
        {v1 && v2 && v1 !== v2 && (
          <button
            onClick={handleCompare}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Comparing..." : `Compare ${compareLabel}`}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loadingList && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Comparison results */}
      {compareData && (
        <div className="flex-1 overflow-y-auto">
          {/* Summary bar */}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              +{countByStatus(compareData.diff.sections, "added")} added
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
              -{countByStatus(compareData.diff.sections, "removed")} removed
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              ~{countByStatus(compareData.diff.sections, "modified")} modified
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {countByStatus(compareData.diff.sections, "unchanged")} unchanged
            </span>
            <button
              onClick={() => setShowAll(!showAll)}
              className="ml-auto text-[10px] font-medium text-blue-600 hover:text-blue-500"
            >
              {showAll ? "Hide unchanged" : "Show all"}
            </button>
          </div>

          {/* Version labels */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-center">
              <p className="text-[10px] font-medium text-gray-500">
                v{compareData.versions[0].version} — Older
              </p>
              <p className="text-[10px] text-gray-400">
                {CHANGE_TYPE_LABELS[compareData.versions[0].changeType]}
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-center">
              <p className="text-[10px] font-medium text-blue-600">
                v{compareData.versions[1].version} — Newer
              </p>
              <p className="text-[10px] text-blue-500">
                {CHANGE_TYPE_LABELS[compareData.versions[1].changeType]}
              </p>
            </div>
          </div>

          {/* Section diffs */}
          <div className="space-y-2">
            {displayedSections.map((section) => {
              const isExpanded = expandedSections.has(section.key);
              const hasWordDiff =
                section.wordDiff && section.wordDiff.length > 0;

              return (
                <div
                  key={section.key}
                  className={`rounded-lg border ${STATUS_COLORS[section.status]} overflow-hidden`}
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/5"
                  >
                    {section.status === "unchanged" ? (
                      <span className="text-gray-300">=</span>
                    ) : section.status === "added" ? (
                      <span className="font-bold text-green-600">+</span>
                    ) : section.status === "removed" ? (
                      <span className="font-bold text-red-600">-</span>
                    ) : (
                      <span className="font-bold text-amber-600">~</span>
                    )}
                    <span className="flex-1 font-medium">
                      {section.key.replace(/_/g, " ")}
                    </span>
                    {hasWordDiff ? (
                      isExpanded ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )
                    ) : null}
                  </button>

                  {/* Word-level diff (expanded) */}
                  {isExpanded && hasWordDiff && section.wordDiff && (
                    <div className="grid grid-cols-2 gap-0 border-t border-inherit">
                      {/* Old version */}
                      <div className="border-r border-inherit bg-white p-2">
                        <p className="mb-1 text-[10px] font-medium text-gray-400">
                          v{compareData.versions[0].version}
                        </p>
                        <div className="text-[11px] leading-relaxed text-gray-700">
                          {renderWordDiff(section.wordDiff, "delete")}
                        </div>
                      </div>
                      {/* New version */}
                      <div className="bg-white p-2">
                        <p className="mb-1 text-[10px] font-medium text-gray-400">
                          v{compareData.versions[1].version}
                        </p>
                        <div className="text-[11px] leading-relaxed text-gray-700">
                          {renderWordDiff(section.wordDiff, "insert")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simple value display for added/removed sections */}
                  {isExpanded && !hasWordDiff && (
                    <div className="grid grid-cols-2 gap-0 border-t border-inherit">
                      {section.status === "removed" && (
                        <div className="col-span-2 bg-white p-2">
                          <p className="text-[11px] text-red-600 line-through">
                            {section.v1Value}
                          </p>
                        </div>
                      )}
                      {section.status === "added" && (
                        <div className="col-span-2 bg-white p-2">
                          <p className="text-[11px] text-green-700">
                            {section.v2Value}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {displayedSections.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500">
              No changes between these versions.
            </div>
          )}
        </div>
      )}

      {/* Empty / initial state */}
      {!compareData && !loading && !loadingList && !error && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <ArrowLeftRight
              size={32}
              className="mx-auto text-gray-300 mb-2"
            />
            <p className="text-xs text-gray-500">
              Select two versions to compare
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function countByStatus(
  sections: SectionDiff[],
  status: SectionDiff["status"]
): number {
  return sections.filter((s) => s.status === status).length;
}

/**
 * Render word diff segments for a given side.
 * "delete" side: show "same" + "delete" segments (what was removed).
 * "insert" side: show "same" + "insert" segments (what was added).
 */
function renderWordDiff(
  segments: WordDiffSegment[],
  side: "delete" | "insert"
) {
  return segments.map((seg, idx) => {
    if (seg.type === "same") {
      return <span key={idx}>{seg.text}</span>;
    }
    if (seg.type === side) {
      return (
        <span
          key={idx}
          className={
            side === "delete"
              ? "rounded bg-red-100 text-red-700 line-through"
              : "rounded bg-green-100 text-green-700"
          }
        >
          {seg.text}
        </span>
      );
    }
    // Render opposite side as placeholder spacing to keep alignment
    if (side === "delete" && seg.type === "insert") {
      return (
        <span key={idx} className="text-gray-200">
          {seg.text}
        </span>
      );
    }
    if (side === "insert" && seg.type === "delete") {
      return (
        <span key={idx} className="text-gray-200">
          {seg.text}
        </span>
      );
    }
    return <span key={idx}>{seg.text}</span>;
  });
}

export { CHANGE_TYPE_LABELS as COMPARE_CHANGE_LABELS };