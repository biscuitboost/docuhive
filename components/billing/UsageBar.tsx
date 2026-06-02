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
      <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
        <div className="h-4 w-48 rounded bg-muted" />
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-card-foreground">
          {plan} Plan — Document Usage
        </span>
        <span className="text-sm text-muted-foreground">
          {isUnlimited
            ? `${documentsUsed} used (unlimited)`
            : `${documentsUsed} / ${docsLimit} documents`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isOverLimit
                ? "bg-destructive"
                : isNearLimit
                  ? "bg-amber-500"
                  : "bg-primary"
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}

      {isOverLimit && (
        <p className="mt-2 text-xs text-destructive">
          You&apos;ve reached your document limit.{" "}
          <a
            href="/settings/billing"
            className="font-medium underline underline-offset-2 hover:text-destructive/80 transition-colors"
          >
            Upgrade your plan
          </a>{" "}
          to create more documents.
        </p>
      )}

      {isNearLimit && !isOverLimit && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          You&apos;re nearing your document limit.{" "}
          <a
            href="/settings/billing"
            className="font-medium underline underline-offset-2 hover:text-amber-500 transition-colors"
          >
            Upgrade your plan
          </a>{" "}
          to keep creating without interruption.
        </p>
      )}
    </div>
  );
}
