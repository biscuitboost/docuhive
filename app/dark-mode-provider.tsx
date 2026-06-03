"use client"

import { ThemeProvider } from "@/lib/utils/theme-context"

/**
 * DarkModeProvider — wraps children with ThemeProvider.
 * On first render, reads localStorage and sets the dark class on <html>
 * before React hydrates to prevent flash.
 */
export default function DarkModeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <ThemeProvider>{children}</ThemeProvider>
}
