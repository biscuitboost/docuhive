"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

// ClerkProvider must be client-only — its atob() call crashes during SSR/static generation
const ClerkProviderClient = dynamic(
  () => import("@clerk/nextjs").then((mod) => {
    const Inner = ({ children }: { children: ReactNode }) => (
      <mod.ClerkProvider>{children}</mod.ClerkProvider>
    )
    Inner.displayName = "ClerkProviderInner"
    return Inner
  }),
  { ssr: false }
)

export default function ClerkProviders({
  children,
}: {
  children: ReactNode
}) {
  return <ClerkProviderClient>{children}</ClerkProviderClient>
}
