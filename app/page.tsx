"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UsageBar from "@/components/billing/UsageBar";
import DashboardShell from "@/components/layout/DashboardShell";

interface DashboardStats {
  totalDocuments: number;
  documentsThisMonth: number;
  recentDocs: { id: string; title: string; type: string; createdAt: string }[];
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    documentsThisMonth: 0,
    recentDocs: [],
  });

  useEffect(() => {
    // Fetch recent documents for dashboard overview
    fetch("/api/documents?tenantId=placeholder")
      .then((res) => res.json())
      .then((data) => {
        const docs = Array.isArray(data) ? data : [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setStats({
          totalDocuments: docs.length,
          documentsThisMonth: docs.filter(
            (d: { createdAt: string }) => new Date(d.createdAt) >= startOfMonth
          ).length,
          recentDocs: docs.slice(0, 5),
        });
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardShell>
      {/* Stats cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Total Documents</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.documentsThisMonth}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">Essentials</p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="mt-6">
        <UsageBar />
      </div>

      {/* Recent documents */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
          <Link
            href="/documents"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>

        {stats.recentDocs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
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
                  <th className="px-4 py-3 font-medium text-gray-600">Created</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{doc.title}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-blue-600 hover:text-blue-500 text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
