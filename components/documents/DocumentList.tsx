"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, FileText, Download, Loader2, Search, Trash2, Archive, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Flag, CheckSquare, DownloadCloud, RefreshCw, FileSpreadsheet, Code2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Document {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  aiModel: string;
}

interface PaginatedResponse {
  data: Document[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  all: "All",
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45",
  job_description: "Job Description",
  nda: "Non-Disclosure Agreement",
  service_agreement: "Service Agreement",
  consultant_agreement: "Consultant Agreement",
  freelancer_contract: "Freelancer Contract",
  settlement_agreement: "Settlement Agreement",
  disciplinary_grievance_letters: "Disciplinary & Grievance",
  flexible_working_request: "Flexible Working Request",
  gdpr_privacy_notice: "GDPR Privacy Notice",
  data_processing_agreement: "Data Processing Agreement",
  privacy_policy: "Privacy Policy",
  terms_and_conditions: "Terms & Conditions",
  commercial_lease: "Commercial Lease",
  director_service_agreement: "Director Agreement",
  shareholder_agreement: "Shareholder Agreement",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border",
  generated: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  downloaded: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  archived: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
};

/** Trigger a client-side file download for a single document. */
async function downloadDocument(doc: Document) {
  const res = await fetch(`/api/documents/${doc.id}/download`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Download failed");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition
    ? disposition.replace(/^.*filename=\\"?(.+?)\\"?\s*$/i, "$1")
    : `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Trigger a client-side download for a blob with a given filename. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const FILTER_TYPES = ["all", "employment_contract", "offer_letter", "staff_handbook", "payslip", "p45",
  "job_description", "nda", "service_agreement", "consultant_agreement", "freelancer_contract",
  "settlement_agreement", "disciplinary_grievance_letters", "flexible_working_request",
  "gdpr_privacy_notice", "data_processing_agreement", "privacy_policy",
  "terms_and_conditions", "commercial_lease", "director_service_agreement", "shareholder_agreement"];

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: "easeOut" as const },
  }),
};

export default function DocumentList() {
  const [paginated, setPaginated] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const limit = 20;

  function fetchDocs(p: number) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    fetch(`/api/documents?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPaginated(data as PaginatedResponse);
      })
      .catch(() => setPaginated(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDocs(page);
  }, [page]);

  const docs = paginated?.data ?? [];
  const total = paginated?.total ?? 0;
  const totalPages = paginated?.totalPages ?? 0;

  const filtered = docs.filter((d) => {
    const typeMatch = filter === "all" || d.type === filter;
    const searchMatch = !searchQuery || 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (TYPE_LABELS[d.type] || d.type).toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && searchMatch;
  });

  const allVisibleSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id));

  function handleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  }

  function handleSelectOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteConfirmId(null);
      // Remove from selection if selected
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
      fetchDocs(page);
    } catch {
      alert("Failed to delete document");
    }
  }

  async function handleArchiveToggle(doc: Document) {
    const newStatus = doc.status === "archived" ? "generated" : "archived";
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchDocs(page);
    } catch {
      alert(`Failed to ${newStatus === "archived" ? "archive" : "restore"} document`);
    }
  }

  // ── Bulk Actions ────────────────────────────────────────────────

  /** Download selected documents as a ZIP. */
  const handleBulkDownload = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading("download");
    try {
      const res = await fetch("/api/documents/bulk/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(err.error);
      }

      const blob = await res.blob();
      triggerDownload(blob, "documents.zip");

      // Refresh list after download updates status
      fetchDocs(page);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bulk download failed");
    } finally {
      setBulkActionLoading(null);
    }
  }, [selectedIds, page]);

  /** Archive selected documents. */
  const handleBulkArchive = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading("archive");
    try {
      const res = await fetch("/api/documents/bulk/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedIds), action: "archive" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Archive failed" }));
        throw new Error(err.error);
      }

      setSelectedIds(new Set());
      fetchDocs(page);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bulk archive failed");
    } finally {
      setBulkActionLoading(null);
    }
  }, [selectedIds, page]);

  /** Regenerate selected documents. */
  const handleBulkRegenerate = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading("regenerate");
    try {
      const res = await fetch("/api/documents/bulk/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Regenerate failed" }));
        throw new Error(err.error);
      }

      const result = await res.json();
      setSelectedIds(new Set());
      fetchDocs(page);

      if (result.errors && result.errors.length > 0) {
        const errorCount = result.errors.length;
        alert(`${result.regenerated} document(s) regenerated. ${errorCount} error(s) — check documents for details.`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bulk regenerate failed");
    } finally {
      setBulkActionLoading(null);
    }
  }, [selectedIds, page]);

  /** Export selected documents as CSV (bulk). */
  const handleBulkCsvExport = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading("csv");
    try {
      const res = await fetch("/api/documents/bulk/export/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "CSV export failed" }));
        throw new Error(err.error);
      }

      const blob = await res.blob();
      triggerDownload(blob, `docu-hive-export-${new Date().toISOString().split("T")[0]}.csv`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "CSV export failed");
    } finally {
      setBulkActionLoading(null);
    }
  }, [selectedIds]);

  /** Export selected documents as JSON (bulk). */
  const handleBulkJsonExport = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading("json");
    try {
      const res = await fetch("/api/documents/bulk/export/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "JSON export failed" }));
        throw new Error(err.error);
      }

      const blob = await res.blob();
      triggerDownload(blob, `docu-hive-export-${new Date().toISOString().split("T")[0]}.json`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "JSON export failed");
    } finally {
      setBulkActionLoading(null);
    }
  }, [selectedIds]);

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground/60 outline-none ring-0 focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  filter === type
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {TYPE_LABELS[type] || type}
              </button>
            ))}
          </div>
          <Link
            href="/documents/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
          >
            <Plus size={14} />
            New Document
          </Link>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-card-foreground">
                {selectedIds.size} document{selectedIds.size > 1 ? "s" : ""} selected
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBulkDownload}
                  disabled={bulkActionLoading !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
                >
                  {bulkActionLoading === "download" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <DownloadCloud size={14} />
                  )}
                  Download ZIP
                </button>
                <button
                  onClick={handleBulkRegenerate}
                  disabled={bulkActionLoading !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground hover:bg-accent active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
                >
                  {bulkActionLoading === "regenerate" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Regenerate
                </button>
                <button
                  onClick={handleBulkArchive}
                  disabled={bulkActionLoading !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground hover:bg-accent active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
                >
                  {bulkActionLoading === "archive" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Archive size={14} />
                  )}
                  Archive
                </button>
                {/* Export buttons */}
                <button
                  onClick={handleBulkCsvExport}
                  disabled={bulkActionLoading !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-card px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
                >
                  {bulkActionLoading === "csv" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={14} />
                  )}
                  Export CSV
                </button>
                <button
                  onClick={handleBulkJsonExport}
                  disabled={bulkActionLoading !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-card px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
                >
                  {bulkActionLoading === "json" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Code2 size={14} />
                  )}
                  Export JSON
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkActionLoading !== null}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-card-foreground transition-colors duration-150"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border bg-card p-12 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-1 rounded-full bg-primary/5 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-xl border border-dashed border-muted-foreground/25 bg-card p-6 sm:p-16 text-center"
        >
          {docs.length === 0 ? (
            <>
              <motion.div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-8 w-8 text-primary/60" />
              </motion.div>
              <p className="mt-4 text-base font-semibold text-card-foreground">
                {`Welcome! Let's create your first document`}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
                Generate UK employment contracts, offer letters, staff handbooks, payslips and P45s in seconds.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
                >
                  <Flag size={16} />
                  Start Onboarding
                </Link>
                <Link
                  href="/documents/new"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-card-foreground shadow-sm hover:bg-accent active:scale-[0.97] transition-all duration-150"
                >
                  <Plus size={16} />
                  Create document
                </Link>
              </div>
            </>
          ) : (
            <>
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium text-card-foreground">
                No matching documents
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different search term or clear your filters.
              </p>
            </>
          )}
        </motion.div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-3.5 w-10">
                    <button
                      onClick={handleSelectAll}
                      className={`flex items-center justify-center w-5 h-5 rounded border transition-colors duration-150 ${
                        allVisibleSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 hover:border-muted-foreground/60"
                      }`}
                    >
                      {allVisibleSelected && <CheckSquare size={14} />}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3.5 font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3.5 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3.5 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3.5 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                  {filtered.map((doc, i) => (
                    <motion.tr
                      key={doc.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                      custom={i}
                      className={`hover:bg-accent/40 transition-colors duration-150 ${
                        selectedIds.has(doc.id) ? "bg-primary/[0.03]" : ""
                      }`}
                    >
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() => handleSelectOne(doc.id)}
                          className={`flex items-center justify-center w-5 h-5 rounded border transition-colors duration-150 ${
                            selectedIds.has(doc.id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 hover:border-muted-foreground/60"
                          }`}
                        >
                          {selectedIds.has(doc.id) && <CheckSquare size={14} />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-card-foreground">{doc.title}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {TYPE_LABELS[doc.type] || doc.type}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[doc.status] || "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors duration-150"
                          >
                            View
                          </Link>
                          {/* Download */}
                          <button
                            onClick={async () => {
                              setDownloadingId(doc.id);
                              try {
                                await downloadDocument(doc);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Download failed");
                              } finally {
                                setDownloadingId(null);
                              }
                            }}
                            disabled={downloadingId === doc.id || doc.status === "draft"}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150"
                          >
                            {downloadingId === doc.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                          </button>
                          {/* Archive / Restore */}
                          <button
                            onClick={() => handleArchiveToggle(doc)}
                            className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent active:scale-[0.95] transition-all duration-150"
                            title={doc.status === "archived" ? "Restore" : "Archive"}
                          >
                            {doc.status === "archived" ? <RotateCcw size={12} /> : <Archive size={12} />}
                          </button>
                          {/* Delete */}
                          {deleteConfirmId === doc.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(doc.id)}
                              className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 active:scale-[0.95] transition-all duration-150"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  custom={i}
                  className={`rounded-xl border bg-card p-4 shadow-sm ${
                    selectedIds.has(doc.id) ? "border-primary/40 ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleSelectOne(doc.id)}
                        className={`mt-0.5 flex items-center justify-center w-5 h-5 shrink-0 rounded border transition-colors duration-150 ${
                          selectedIds.has(doc.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 hover:border-muted-foreground/60"
                        }`}
                      >
                        {selectedIds.has(doc.id) && <CheckSquare size={14} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-sm font-semibold text-card-foreground hover:text-primary transition-colors truncate block"
                        >
                          {doc.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {TYPE_LABELS[doc.type] || doc.type} · {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[doc.status] || "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setDownloadingId(doc.id);
                        try {
                          await downloadDocument(doc);
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "Download failed");
                        } finally {
                          setDownloadingId(null);
                        }
                      }}
                      disabled={downloadingId === doc.id || doc.status === "draft"}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download size={12} />
                      )}
                      PDF
                    </button>
                    <button
                      onClick={() => handleArchiveToggle(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                    >
                      {doc.status === "archived" ? <RotateCcw size={12} /> : <Archive size={12} />}
                      {doc.status === "archived" ? "Restore" : "Archive"}
                    </button>
                    {deleteConfirmId === doc.id ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-md border px-2 py-1 text-xs text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(doc.id)}
                        className="ml-auto rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-40 transition-all duration-150"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                        p === page
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-40 transition-all duration-150"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}