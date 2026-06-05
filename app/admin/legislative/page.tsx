"use client";

import { useState, useEffect, useCallback } from "react";

interface LegislativeUpdate {
  id: string;
  title: string;
  description: string | null;
  affectedTemplateTypes: string[] | null;
  effectiveDate: string | null;
  isActioned: boolean;
  createdAt: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45",
  job_description: "Job Description",
  nda: "NDA",
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminLegislativePage() {
  const [updates, setUpdates] = useState<LegislativeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch("/api/legislative");
      if (!res.ok) throw new Error("Failed to load updates");
      const data = await res.json();
      setUpdates(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const toggleActioned = async (id: string) => {
    setToggling((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/legislative/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to toggle");
      const updated = await res.json();
      setUpdates((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActioned: updated.isActioned } : u))
      );
    } catch (e) {
      console.error("Toggle failed", e);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const pendingCount = updates.filter((u) => !u.isActioned).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Legislative Updates
          </h1>
          <p className="mt-1 text-gray-500">
            Admin view — manage system-wide legislative changes and their
            actioned state.
          </p>
        </div>

        {/* Summary bar */}
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm">
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                pendingCount > 0 ? "bg-red-500" : "bg-green-500"
              }`}
            />
            <span className="font-medium text-gray-700">
              {pendingCount} pending
            </span>
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{updates.length} total</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && updates.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <h3 className="text-base font-semibold text-gray-900">
              No legislative updates
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              When new legislation is detected, it will appear here.
            </p>
          </div>
        )}

        {/* List */}
        {!loading && updates.length > 0 && (
          <div className="space-y-3">
            {updates.map((update) => (
              <div
                key={update.id}
                className={`rounded-xl border p-5 transition-all ${
                  update.isActioned
                    ? "border-green-200 bg-white"
                    : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        {update.title}
                      </h3>
                      {/* Status badge */}
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          update.isActioned
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {update.isActioned ? "Actioned" : "Pending"}
                      </span>
                    </div>

                    {update.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                        {update.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      <span>
                        Effective: {formatDate(update.effectiveDate)}
                      </span>
                      <span>
                        Created: {formatDate(update.createdAt)}
                      </span>
                    </div>

                    {/* Affected document types */}
                    {update.affectedTemplateTypes &&
                      update.affectedTemplateTypes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {update.affectedTemplateTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                            >
                              {TEMPLATE_LABELS[type] || type}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => toggleActioned(update.id)}
                    disabled={toggling.has(update.id)}
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      update.isActioned
                        ? "bg-white text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    } disabled:opacity-50`}
                  >
                    {toggling.has(update.id)
                      ? "Updating..."
                      : update.isActioned
                        ? "Mark pending"
                        : "Mark as actioned"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}