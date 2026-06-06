// SEO landing page for a specific business tool (VAT calculator, PAYE, etc.)
// Targets long-tail UK search queries for free business calculators.
// Public, unauthenticated route — drives organic search traffic to the actual tool.
import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { TOOL_LANDING_PAGES } from "@/lib/tools/seo-content"
import Footer from "@/components/layout/Footer"
import { Sparkles, ArrowRight, CheckCircle, Clock, Calculator, Shield } from "lucide-react"

interface Props {
  params: Promise<{ type: string }>
}

export async function generateStaticParams() {
  return TOOL_LANDING_PAGES.map((page) => ({ type: page.type }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const page = TOOL_LANDING_PAGES.find((p) => p.type === type)
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
      canonical: `https://docuhive.com/tools/landing/${type}`,
    },
  }
}

const ICON_MAP: Record<string, React.ReactNode> = {
  payslip: <Calculator className="h-5 w-5" />,
  contract: <Shield className="h-5 w-5" />,
  invoice: <Calculator className="h-5 w-5" />,
  letter: <Calculator className="h-5 w-5" />,
}

export default async function ToolLandingPage({ params }: Props) {
  const { type } = await params
  const page = TOOL_LANDING_PAGES.find((p) => p.type === type)
  if (!page) notFound()

  return (
    <main className="min-h-screen bg-background">
      {/* Simple nav */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold text-foreground">
            <span className="text-primary">Docu</span>Hive
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/tools"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              All Tools
            </Link>
            <Link
              href={`/tools/${type}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Sparkles size={14} />
              Use Tool
            </Link>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {page.heading}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/tools/${type}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/20 sm:w-auto"
            >
              <Sparkles size={18} />
              {page.ctaAction}
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 py-3 text-base font-semibold text-foreground hover:bg-muted transition-all sm:w-auto"
            >
              See Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Why use DocuHive&rsquo;s {page.label.toLowerCase()}?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {page.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle size={16} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground">Who is this for?</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{page.whoFor}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
              <Clock size={14} />
              Free to use
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
              <Calculator size={14} />
              2026/27 rates
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
              <Shield size={14} />
              No sign-up required
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-4">
            {page.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card p-5 open:border-primary/30 open:shadow-sm transition-all"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground">
                  {faq.question}
                  <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to use the {page.label.toLowerCase()}?
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {page.ctaSubtitle}
            </p>
            <Link
              href={`/tools/${type}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md"
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
