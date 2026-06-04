"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  PlusCircle,
  Calculator,
  Settings,
  Scale,
  Keyboard,
  Command,
  ArrowRight,
  Search,
} from "lucide-react"

type ShortcutEntry = {
  keys: string
  label: string
  action: () => void
  category: string
}

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState("")
  const paletteInputRef = useRef<HTMLInputElement>(null)
  const lastKeyTime = useRef(0)
  const chordBuffer = useRef<string[]>([])

  const paletteItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Document", href: "/documents/new", icon: PlusCircle },
    { label: "Tools", href: "/tools", icon: Calculator },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Legislative Updates", href: "/legislative", icon: Scale },
  ]

  const handleChord = useCallback(
    (key: string) => {
      const now = Date.now()
      // Reset chord buffer if it's been more than 800ms since last key
      if (now - lastKeyTime.current > 800) {
        chordBuffer.current = []
      }
      lastKeyTime.current = now
      chordBuffer.current.push(key.toLowerCase())

      const chord = chordBuffer.current.join(" then ")

      // Define shortcuts inside callback to avoid deps issues
      const navShortcuts: ShortcutEntry[] = [
        { keys: "g then d", label: "Go to Dashboard", action: () => router.push("/dashboard"), category: "Navigation" },
        { keys: "g then n", label: "New Document", action: () => router.push("/documents/new"), category: "Navigation" },
        { keys: "g then t", label: "Tools", action: () => router.push("/tools"), category: "Navigation" },
        { keys: "g then s", label: "Settings", action: () => router.push("/settings"), category: "Navigation" },
        { keys: "g then l", label: "Legislative Updates", action: () => router.push("/legislative"), category: "Navigation" },
      ]

      // Match against two-key chords
      if (chordBuffer.current.length === 2) {
        const match = navShortcuts.find((s) => s.keys === chord)
        if (match) {
          match.action()
        }
        chordBuffer.current = []
      }
    },
    [router]
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable

      // Meta/Cmd key combos
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setShowPalette(true)
        setShowHelp(false)
        return
      }

      // ? key — show help (only when not in input)
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isInput) {
        e.preventDefault()
        setShowHelp((prev) => !prev)
        setShowPalette(false)
        return
      }

      // Escape — close dialogs
      if (e.key === "Escape") {
        if (showPalette) {
          setShowPalette(false)
          e.preventDefault()
          return
        }
        if (showHelp) {
          setShowHelp(false)
          e.preventDefault()
          return
        }
        return
      }

      // Chord-based navigation (g then x)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !isInput) {
        handleChord(e.key)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showHelp, showPalette, handleChord])

  // Focus palette input when opened
  useEffect(() => {
    if (showPalette && paletteInputRef.current) {
      paletteInputRef.current.focus()
    }
  }, [showPalette])

  const filteredPalette = paletteQuery
    ? paletteItems.filter((item) =>
        item.label.toLowerCase().includes(paletteQuery.toLowerCase())
      )
    : paletteItems

  return (
    <>
      {/* Keyboard shortcuts help dialog */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-lg bg-primary/10 p-2">
                <Keyboard size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Keyboard Shortcuts</h2>
                <p className="text-xs text-muted-foreground">Navigate DocuHive without lifting your fingers</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Navigation shortcuts */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Navigation</h3>
                <div className="space-y-1.5">
                  <ShortcutRow keys="g then d" label="Dashboard" />
                  <ShortcutRow keys="g then n" label="New Document" />
                  <ShortcutRow keys="g then t" label="Tools" />
                  <ShortcutRow keys="g then s" label="Settings" />
                  <ShortcutRow keys="g then l" label="Legislative Updates" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">General</h3>
                <div className="space-y-1.5">
                  <ShortcutRow keys="⌘K / Ctrl+K" label="Command palette" />
                  <ShortcutRow keys="?" label="Show this help" />
                  <ShortcutRow keys="Esc" label="Close dialog" />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border text-center">
              <p className="text-[11px] text-muted-foreground/60">
                Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">?</kbd> anytime to toggle this dialog
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Command palette */}
      {showPalette && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 animate-fade-in"
          onClick={() => setShowPalette(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                ref={paletteInputRef}
                type="text"
                placeholder="Go to page..."
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-card-foreground outline-none placeholder:text-muted-foreground/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredPalette.length > 0) {
                    router.push(filteredPalette[0].href)
                    setShowPalette(false)
                    setPaletteQuery("")
                  }
                  if (e.key === "Escape") {
                    setShowPalette(false)
                    setPaletteQuery("")
                  }
                }}
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                Esc
              </kbd>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredPalette.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No matching pages
                </div>
              ) : (
                filteredPalette.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href)
                        setShowPalette(false)
                        setPaletteQuery("")
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-card-foreground hover:bg-accent transition-colors text-left"
                    >
                      <Icon size={16} className="text-muted-foreground shrink-0" />
                      <span>{item.label}</span>
                      <ArrowRight size={14} className="ml-auto text-muted-foreground/40" />
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  const keyParts = keys.split(" ")
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-card-foreground">{label}</span>
      <span className="flex items-center gap-1 shrink-0">
        {keyParts.map((part, i) => {
          const isPlus = part === "/"
          const isThen = part === "then"
          if (isPlus) return <span key={i} className="text-xs text-muted-foreground/40">/</span>
          if (isThen) return <span key={i} className="text-xs text-muted-foreground/40 mx-0.5">then</span>
          const isMacCmd = part.startsWith("⌘")
          return (
            <kbd
              key={i}
              className={`inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono ${
                isMacCmd ? "text-primary" : "text-foreground"
              }`}
            >
              {isMacCmd ? <Command size={12} className="mr-0.5" /> : null}
              {part}
            </kbd>
          )
        })}
      </span>
    </div>
  )
}