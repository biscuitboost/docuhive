"use client";

import { useEffect, useState } from "react";
import UsageBar from "@/components/billing/UsageBar";
import { Loader2 } from "lucide-react";

type SubscriptionInfo = {
  plan: string;
  planName: string;
  planPrice: number;
  docsLimit: number | null;
  multiUser: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscription: {
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    documentsUsed: number;
    stripePriceId: string | null;
  } | null;
};

/**
 * Billing overview — plan info, usage bar, manage subscription link.
 */
export default function BillingOverview() {
  const [data, setData] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  // Read success/cancel params from the URL (set by Stripe redirect)
  const [params] = useState(() =>
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  );
  const showSuccess = params.get('success') === 'true';
  const showCanceled = params.get('canceled') === 'true';

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load billing info");
        return r.json();
      })
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function statusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20";
      case "trialing":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20";
      case "past_due":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20";
      case "cancelled":
        return "bg-destructive/15 text-destructive ring-1 ring-destructive/20";
      default:
        return "bg-muted text-muted-foreground ring-1 ring-border";
    }
  }

  async function handleManageSubscription() {
    if (!data?.stripeCustomerId) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal");
      const json = await res.json();
      if (json.url) {
        window.open(json.url, "_blank");
      } else {
        throw new Error(json.error ?? "Failed to open portal");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Portal error");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        <UsageBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const sub = data?.subscription;
  const status = sub?.status ?? "active";

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {showSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <p className="font-medium">Payment successful!</p>
          <p className="mt-1">Your subscription is now active. You can start generating documents.</p>
        </div>
      )}

      {/* Canceled banner */}
      {showCanceled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          Checkout was cancelled. No charges were made. Choose a plan below when you&apos;re ready.
        </div>
      )}

      {/* Plan overview card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              {data?.planName ?? "Essentials"} Plan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              £{data?.planPrice ?? 49}/mo
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColor(status)}`}
          >
            {status}
          </span>
        </div>

        {(sub?.currentPeriodStart || sub?.currentPeriodEnd) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Billing period: {formatDate(sub?.currentPeriodStart ?? null)} –{" "}
            {formatDate(sub?.currentPeriodEnd ?? null)}
          </p>
        )}
      </div>

      {/* Usage */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <h3 className="mb-4 text-sm font-medium text-card-foreground">
          Document Usage
        </h3>
        <UsageBar />
      </div>

      {/* Manage subscription */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <h3 className="mb-2 text-sm font-medium text-card-foreground">
          Subscription
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Update your payment method, view invoices, or change your plan.
        </p>
        {data?.stripeCustomerId ? (
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {portalLoading ? "Opening..." : "Manage Subscription"}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active subscription found. Contact support to set up billing.
          </p>
        )}
      </div>
    </div>
  );
}
