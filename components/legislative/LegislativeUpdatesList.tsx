"use client";

import { useState, useEffect } from "react";
import { Calendar, Scale, CheckCircle2, Clock } from "lucide-react";

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
  custom: "Custom",
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

function isPast(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
}

export default function LegislativeUpdatesList() {
  const [updates, setUpdates] = useState<LegislativeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/legislative-updates")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load updates");
        return res.json();
      })
      .then((data) => {
        setUpdates(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setUpdates([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <Scale className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
        <p className="mt-1 text-xs text-red-500">
          Try refreshing the page, or check back later.
        </p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center">
        <Scale className="mx-auto h-10 w-10 text-gray-300" />
        <h3 className="mt-4 text-base font-semibold text-gray-900">
          No legislative updates
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          There are no pending updates to display right now. When new legislation
          is announced that affects your documents, it will appear here.
        </p>
      </div>
    );
  }

  // Sort: pending first (by effective date ascending), then actioned
  const sorted = [...updates].sort((a, b) => {
    if (a.isActioned !== b.isActioned) return a.isActioned ? 1 : -1;
    if (a.effectiveDate && b.effectiveDate)
      return new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime();
    return 0;
  });

  const pendingCount = updates.filter((u) => !u.isActioned).length;

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Clock className="h-4 w-4" />
        <span>
          {pendingCount} pending update{pendingCount !== 1 ? "s" : ""}
          {" · "}
          {updates.length} total
        </span>
      </div>

      {/* Card grid */}
      <div className="space-y-4">
        {sorted.map((update) => {
          const pastEffective = isPast(update.effectiveDate);

          return (
            <div
              key={update.id}
              className={`rounded-xl border p-5 transition-shadow hover:shadow-sm ${
                update.isActioned
                  ? "border-gray-200 bg-white"
                  : pastEffective
                    ? "border-amber-200 bg-amber-50/50"
                    : "border-blue-200 bg-blue-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
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
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {update.isActioned ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Actioned
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Pending
                        </>
                      )}
                    </span>
                  </div>

                  {update.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {update.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {update.effectiveDate
                          ? `Effective ${formatDate(update.effectiveDate)}`
                          : "No effective date set"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: template type badges */}
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {update.affectedTemplateTypes && update.affectedTemplateTypes.length > 0 ? (
                    update.affectedTemplateTypes.map((type) => (
                      <span
                        key={type}
                        className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                      >
                        {TEMPLATE_LABELS[type] || type}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">All templates</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
