// SEO landing page for a specific document type
// Targets long-tail UK search queries to funnel organic traffic → paid document generation
import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { LANDING_PAGES } from "@/lib/landing/seo-content"
import Footer from "@/components/layout/Footer"
import { Sparkles, ArrowRight, CheckCircle, FileText, Shield, Clock } from "lucide-react"

interface Props {
  params: Promise<{ type: string }>
}

export async function generateStaticParams() {
  return LANDING_PAGES.map((page) => ({ type: page.type }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const page = LANDING_PAGES.find((p) => p.type === type)
  if (!page) return {}

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
    },
    alternates: {
      canonical: `https://docuhive.com/landing/${type}`,
    },
  }
}

const ICON_MAP: Record<string, React.ReactNode> = {
  payslip: <FileText className="h-5 w-5" />,
  contract: <Shield className="h-5 w-5" />,
  invoice: <FileText className="h-5 w-5" />,
  letter: <FileText className="h-5 w-5" />,
}

export default async function LandingPage({ params }: Props) {
  const { type } = await params
  const page = LANDING_PAGES.find((p) => p.type === type)
  if (!page) notFound()

  return (
    <main className="min-h-screen bg-[#0f172a]">
      {/* Simple nav */}
      <div className="border-b border-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold text-white">
            <span className="text-blue-400">Docu</span>Hive
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href={`/documents/new/${type}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Sparkles size={14} />
              Generate Now
            </Link>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {page.heading}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-400">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/documents/new/${type}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 transition-all sm:w-auto"
            >
              <Sparkles size={18} />
              {page.ctaAction}
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 px-8 py-3 text-base font-semibold text-gray-300 hover:bg-gray-800 transition-all sm:w-auto"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="border-t border-gray-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-white text-center">
            Why use DocuHive for your {page.label.toLowerCase()}?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {page.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                  <CheckCircle size={16} />
                </div>
                <p className="text-sm leading-6 text-gray-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-gray-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white">Who is this for?</h2>
          <p className="mt-4 text-base leading-7 text-gray-400">{page.whoFor}</p>
          <div className="mt-8 flex justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/50 px-4 py-2 text-sm text-gray-400">
              <Clock size={14} />
              Takes less than 60 seconds
            </div>
            <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/50 px-4 py-2 text-sm text-gray-400">
              <FileText size={14} />
              PDF & Word download
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="border-t border-gray-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-6">
            {page.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-800 bg-gray-900/30 p-5 open:border-blue-600/30"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-white">
                  {faq.question}
                  <span className="ml-2 text-gray-500 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-blue-600/20 bg-blue-600/5 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-white">
              Ready to create your {page.label.toLowerCase()}?
            </h2>
            <p className="mt-3 text-base text-gray-400">
              {page.ctaSubtitle}
            </p>
            <Link
              href={`/documents/new/${type}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
            >
              <Sparkles size={18} />
              {page.ctaAction}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
