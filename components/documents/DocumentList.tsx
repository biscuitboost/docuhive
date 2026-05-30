"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Document {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  aiModel: string;
}

const TYPE_LABELS: Record<string, string> = {
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45",
};

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  generated: "bg-green-100 text-green-700",
  downloaded: "bg-blue-100 text-blue-700",
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
    ? disposition.replace(/^.*filename="?(.+?)"?\s*$/i, "$1")
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

export default function DocumentList() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocs(Array.isArray(data) ? data : []);
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? docs : docs.filter((d) => d.type === filter);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {["all", "employment_contract", "offer_letter", "staff_handbook", "payslip", "p45"].map(
          (type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type === "all" ? "All" : TYPE_LABELS[type] || type}
            </button>
          )
        )}
        <Link
          href="/documents/new"
          className="ml-auto rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
        >
          + New Document
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading documents...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">No documents yet.</p>
          <Link
            href="/documents/new"
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create your first document
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 font-medium text-gray-600">Model</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{doc.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {TYPE_LABELS[doc.type] || doc.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGES[doc.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{doc.aiModel}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-blue-600 hover:text-blue-500 text-xs font-medium"
                      >
                        View
                      </Link>
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
                        disabled={downloadingId === doc.id}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {downloadingId === doc.id ? "..." : "Download PDF"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
