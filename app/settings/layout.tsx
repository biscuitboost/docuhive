"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import DashboardShell from "@/components/layout/DashboardShell"

const settingsTabs = [
  { href: "/settings", label: "General", exact: true },
  { href: "/settings/billing", label: "Billing", exact: false },
  { href: "/settings/branding", label: "Branding", exact: false },
  { href: "/settings/team", label: "Team", exact: false },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <DashboardShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account settings and preferences.
        </p>

        {/* Sub-navigation tabs */}
        <div className="mt-6 border-b border-border">
          <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2">
            {settingsTabs.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`pb-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border-b-2 border-primary text-primary"
                      : "border-b-2 border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </DashboardShell>
  )
}
