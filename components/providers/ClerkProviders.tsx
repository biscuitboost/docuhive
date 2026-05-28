"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, type ReactNode } from "react"

// ClerkProvider deferred to browser — its atob() crashes during static generation
const ClerkProviderClient = dynamic(
  () => import("@clerk/nextjs").then((mod) => ({ default: mod.ClerkProvider })),
  { ssr: false }
)

/**
 * ClerkProvider wrapper that renders children directly during SSR/static generation,
 * then swaps in ClerkProvider after the first client-side render.
 * This avoids Clerk's atob() crash during Next.js static page generation.
 */
export default function ClerkProviders({
  children,
}: {
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and first client render: render children without Clerk
  if (!mounted) {
    return <>{children}</>
  }

  // After mount: Clerk is safe to load in the browser
  return <ClerkProviderClient>{children}</ClerkProviderClient>
}
