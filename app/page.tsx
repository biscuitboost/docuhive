import Hero from "@/components/marketing/Hero"
import Features from "@/components/marketing/Features"
import Pricing from "@/components/marketing/Pricing"
import Calculator from "@/components/marketing/Calculator"
import Footer from "@/components/layout/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f172a]">
      <Hero />
      <Features />
      <Pricing />
      <Calculator />
      <Footer />
    </main>
  )
}
