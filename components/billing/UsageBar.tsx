"use client";

import { useEffect, useState } from "react";

type UsageData = {
  documentsUsed: number;
  docsLimit: number | null;
  plan: string;
};

/**
 * Visual usage bar showing current plan document consumption.
 * Fetches usage data from /api/dashboard and renders a progress bar.
 */
export default function UsageBar() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.usage) setData(json.usage);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Loading usage...</p>
      </div>
    );
  }

  if (!data) return null;

  const { documentsUsed, docsLimit, plan } = data;
  const isUnlimited = docsLimit === null;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((documentsUsed / docsLimit) * 100));
  const isNearLimit = !isUnlimited && pct >= 80;
  const isOverLimit = !isUnlimited && documentsUsed >= docsLimit;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          {plan} Plan — Document Usage
        </span>
        <span className="text-sm text-gray-500">
          {isUnlimited
            ? `${documentsUsed} used (unlimited)`
            : `${documentsUsed} / ${docsLimit} documents`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverLimit
                ? "bg-red-500"
                : isNearLimit
                  ? "bg-amber-500"
                  : "bg-blue-600"
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}

      {isOverLimit && (
        <p className="mt-2 text-xs text-red-600">
          You&apos;ve reached your document limit.{" "}
          <a
            href="/settings/billing"
            className="font-medium underline hover:text-red-500"
          >
            Upgrade your plan
          </a>{" "}
          to create more documents.
        </p>
      )}

      {isNearLimit && !isOverLimit && (
        <p className="mt-2 text-xs text-amber-600">
          You&apos;re nearing your document limit.{" "}
          <a
            href="/settings/billing"
            className="font-medium underline hover:text-amber-500"
          >
            Upgrade your plan
          </a>{" "}
          to keep creating without interruption.
        </p>
      )}
    </div>
  );
}
