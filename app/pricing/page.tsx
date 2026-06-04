// Standalone public pricing page — clean, just pricing + footer
import Link from "next/link"
import Footer from "@/components/layout/Footer"

import dynamic from "next/dynamic"
const Pricing = dynamic(
  () => import("@/components/marketing/Pricing"),
  { ssr: false }
)

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0f172a]">
      {/* Simple header */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-4 sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Choose the plan that fits your business. No hidden fees.
        </p>
      </div>
      <Pricing />
      <Footer />
    </main>
  )
}