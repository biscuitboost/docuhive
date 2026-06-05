"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, AlertTriangle } from "lucide-react";

type UsageData = {
  documentsUsed: number;
  docsLimit: number | null;
  plan: string;
};

/**
 * Compact sidebar usage badge — shows current plan + document usage.
 * Visible on every authenticated page, provides a persistent upgrade CTA
 * when the user is near or at their document limit.
 */
export default function UsageBadge() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.usage) setData(json.usage);
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { documentsUsed, docsLimit, plan } = data;
  const isUnlimited = docsLimit === null;
  const isEssentials = plan === "essentials";
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((documentsUsed / docsLimit) * 100));
  const isNearLimit = !isUnlimited && pct >= 75;
  const isOverLimit = !isUnlimited && documentsUsed >= docsLimit;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
      {/* Plan name + upgrade link */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {plan}
        </span>
        {isEssentials && (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Sparkles size={10} />
            Upgrade
          </Link>
        )}
      </div>

      {/* Usage bar */}
      {!isUnlimited && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isOverLimit
                ? "bg-destructive"
                : isNearLimit
                  ? "bg-amber-500"
                  : "bg-primary/60"
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}

      {/* Count */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-muted-foreground/70">
          {isUnlimited
            ? `${documentsUsed} used`
            : `${documentsUsed} / ${docsLimit}`}
        </span>
        {isOverLimit && (
          <AlertTriangle size={10} className="text-destructive" />
        )}
        {isNearLimit && !isOverLimit && (
          <AlertTriangle size={10} className="text-amber-500" />
        )}
      </div>
    </div>
  );
}