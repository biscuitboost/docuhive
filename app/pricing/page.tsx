// Standalone public pricing page
import Hero from "@/components/marketing/Hero"
import Features from "@/components/marketing/Features"
import Footer from "@/components/layout/Footer"

// Pricing uses useAuth() from Clerk which crashes during static generation.
// Defer to browser via dynamic import so it only renders client-side.
import dynamic from "next/dynamic"
const Pricing = dynamic(
  () => import("@/components/marketing/Pricing"),
  { ssr: false }
)

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0f172a]">
      <Hero />
      <Pricing />
      <Features />
      <Footer />
    </main>
  )
}
