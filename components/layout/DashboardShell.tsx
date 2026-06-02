"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  Scale,
  Menu,
  X,
  Sparkles,
  LogOut,
} from "lucide-react"

// Clerk UserButton deferred to browser — safe from SSR crash
const UserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => ({ default: mod.UserButton })),
  { ssr: false }
)

const SignedIn = dynamic(
  () => import("@clerk/nextjs").then((mod) => ({ default: mod.SignedIn })),
  { ssr: false }
)

const SignedOut = dynamic(
  () => import("@clerk/nextjs").then((mod) => ({ default: mod.SignedOut })),
  { ssr: false }
)

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/documents/new", label: "New Document", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/legislative", label: "Legislative Updates", icon: Scale },
]

function SidebarContent({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary" onClick={onNav}>
          <Sparkles size={20} className="text-primary" />
          Docu<span className="text-foreground">Hive</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60 group-hover:text-accent-foreground"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border px-3 py-3">
        <SignedIn>
          <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent">
            <UserButton afterSignOutUrl="/" />
            <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <LogOut size={12} />
              Account
            </span>
          </div>
        </SignedIn>
      </div>
    </>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-[100dvh] bg-muted/30">
      {/* Desktop sidebar — visible on lg screens */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar panel */}
          <aside className="relative flex w-72 max-w-[85vw] flex-col border-r border-border bg-card h-full animate-slide-up shadow-2xl">
            <div className="flex items-center justify-end border-b border-border px-4 h-16">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNav={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 border-b border-border bg-card px-4 sm:px-6 py-3 sticky top-0 z-30">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors -ml-1"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md active:scale-[0.97]"
            >
              Sign In
            </Link>
          </SignedOut>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">{children}</main>
      </div>
    </div>
  )
}
