"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import UsageBar from "@/components/billing/UsageBar";
import { FileText, Plus, CreditCard, Clock, ChevronRight } from "lucide-react";

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
  draft: "bg-gray-100 text-gray-700",
  generated: "bg-green-100 text-green-700",
  downloaded: "bg-blue-100 text-blue-700",
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {data ? `Welcome, ${data.tenant.name}` : "Dashboard"}
        </h1>
        <p className="mt-1 text-gray-500">
          Overview of your account and recent activity
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column — Recent Docs + Usage */}
          <div className="space-y-6 lg:col-span-2">
            {/* Usage Bar */}
            <UsageBar />

            {/* Recent Documents */}
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Recent Documents
                  </h2>
                </div>
                <Link
                  href="/documents"
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>

              {!data || data.recentDocuments.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <FileText size={32} className="mx-auto text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No documents yet
                  </p>
                  <Link
                    href="/documents/new"
                    className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Create your first document
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.recentDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {doc.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
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
                          STATUS_BADGES[doc.status] || "bg-gray-100 text-gray-700"
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
            <h2 className="text-sm font-semibold text-gray-900">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/documents/new"
                className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    New Document
                  </p>
                  <p className="text-xs text-gray-500">
                    Generate a UK employment document
                  </p>
                </div>
              </Link>

              <Link
                href="/documents"
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    View Documents
                  </p>
                  <p className="text-xs text-gray-500">
                    Browse and manage all your documents
                  </p>
                </div>
              </Link>

              <Link
                href="/settings/billing"
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Billing
                  </p>
                  <p className="text-xs text-gray-500">
                    {data
                        ? `View your ${data.usage.plan} plan`
                        : "Manage your subscription"}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
