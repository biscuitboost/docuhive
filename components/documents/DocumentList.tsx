"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Download, Loader2, Search, Trash2, Archive, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Flag } from "lucide-react";
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
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border",
  generated: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  downloaded: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  archived: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
};

/** Trigger a client-side file download for the given document. */
async function downloadDocument(doc: Document) {
  const res = await fetch(`/api/documents/${doc.id}/download`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Download failed");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition
    ? disposition.replace(/^.*filename=\\"?(.+?)\\"?\\s*$/i, "$1")
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

const FILTER_TYPES = ["all", "employment_contract", "offer_letter", "staff_handbook", "payslip", "p45"];

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

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteConfirmId(null);
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
                Welcome! Let's create your first document
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
                      className="hover:bg-accent/40 transition-colors duration-150"
                    >
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
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
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