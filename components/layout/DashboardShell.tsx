"use client";

import Link from "next/link";

/**
 * Dashboard shell — sidebar + header wrapper for all dashboard pages.
 * Wrap your page content with this component to get the app layout.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white p-4">
        <Link href="/" className="text-lg font-bold text-blue-600">
          Docu<span className="text-gray-900">Hive</span>
        </Link>
        <nav className="mt-8 space-y-2">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/documents"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Documents
          </Link>
          <Link
            href="/documents/new"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            New Document
          </Link>
          <Link
            href="/templates"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Templates
          </Link>
          <Link
            href="/settings"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Settings
          </Link>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-end border-b border-gray-200 px-6 py-3">
          <Link
            href="/sign-in"
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Sign In
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
