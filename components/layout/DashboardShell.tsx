"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useTheme } from "@/lib/utils/theme-context"
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
  Bell,
  CheckCheck,
  Sun,
  Moon,
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

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

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

function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setNotifications(data.items.slice(0, 10));
          setUnread(data.unread ?? 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleMarkRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-card-foreground">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors ${
                    n.read ? "opacity-70" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (!n.read) handleMarkRead(n.id);
                            setOpen(false);
                          }}
                          className="text-sm font-medium text-card-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-card-foreground line-clamp-1">{n.title}</p>
                      )}
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0 rounded p-1 text-muted-foreground/40 hover:text-foreground transition-colors"
                        aria-label="Mark as read"
                        title="Mark as read"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()

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

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications bell */}
          <SignedIn>
            <NotificationsBell />
          </SignedIn>

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