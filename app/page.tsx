import Hero from "@/components/marketing/Hero"
import Features from "@/components/marketing/Features"
import ToolsGrid from "@/components/marketing/ToolsGrid"
import Calculator from "@/components/marketing/Calculator"
import Testimonials from "@/components/marketing/Testimonials"
import FAQSection from "@/components/marketing/FAQSection"
import Footer from "@/components/layout/Footer"

// Pricing uses useAuth() from Clerk which crashes during static generation
import dynamic from "next/dynamic"
const PricingSection = dynamic(
  () => import("@/components/marketing/Pricing"),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <Testimonials />
      <PricingSection />
      <ToolsGrid />
      <Calculator />
      <FAQSection />
      <Footer />
    </main>
  )
}
