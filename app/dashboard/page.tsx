"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import UsageBar from "@/components/billing/UsageBar";
import { FileText, Plus, CreditCard, Clock, ChevronRight, Sparkles, Flag, ReceiptText, ScrollText, ArrowRightLeft } from "lucide-react";

interface RecentDoc {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  aiModel: string | null;
}

interface DashboardData {
  recentDocuments: RecentDoc[];
  usage: {
    documentsUsed: number;
    docsLimit: number | null;
    plan: string;
  };
  tenant: {
    name: string;
  };
}

const TYPE_LABELS: Record<string, string> = {
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45",
};

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border",
  generated: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  downloaded: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  archived: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json: DashboardData) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {data ? `Welcome, ${data.tenant.name}` : "Dashboard"}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Overview of your account and recent activity
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
          }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Main column — Recent Docs + Usage */}
          <div className="space-y-6 lg:col-span-2">
            {/* Usage Bar */}
            <UsageBar />

            {/* Recent Documents */}
            <div className="rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-card-foreground">
                    Recent Documents
                  </h2>
                </div>
                <Link
                  href="/documents"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>

              {!data || data.recentDocuments.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <motion.div
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5"
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles size={28} className="text-primary/60" />
                  </motion.div>
                  <p className="mt-3 text-sm font-semibold text-card-foreground">
                    Create your first document
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Generate UK employment documents in seconds
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Link
                      href="/onboarding"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
                    >
                      <Flag size={14} />
                      Start Onboarding
                    </Link>
                    <Link
                      href="/documents/new"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-card-foreground shadow-sm hover:bg-accent active:scale-[0.97] transition-all duration-150"
                    >
                      <Plus size={14} />
                      Quick create
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {data.recentDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/70"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">
                          {doc.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {TYPE_LABELS[doc.type] || doc.type} —{" "}
                          {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_BADGES[doc.status] || "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side column — Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/documents/new/payslip"
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    Generate a Payslip
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create an employee payslip with tax &amp; NI breakdown
                  </p>
                </div>
              </Link>

              <Link
                href="/documents/new/employment_contract"
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ScrollText size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    Create a Contract
                  </p>
                  <p className="text-xs text-muted-foreground">
                    UK employment contract with ERA 2025 compliance
                  </p>
                </div>
              </Link>

              <Link
                href="/tools/paye"
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    Check Payroll
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Calculate tax, NI &amp; net pay instantly
                  </p>
                </div>
              </Link>

              <Link
                href="/documents"
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    View Documents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Browse and manage all your documents
                  </p>
                </div>
              </Link>

              <Link
                href="/settings/billing"
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    Billing
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data
                        ? `View your ${data.usage.plan} plan`
                        : "Manage your subscription"}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </DashboardShell>
  );
}
