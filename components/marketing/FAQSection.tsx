"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { AnimatedSection, AnimatedStagger, AnimatedChild } from "@/components/animation/AnimatedSection"

const faqs = [
  {
    q: "What documents can I generate with DocuHive?",
    a: "DocuHive covers 20 UK document types including employment contracts, offer letters, staff handbooks, payslips, P45s, NDAs, service agreements, GDPR privacy notices, terms & conditions, and more. We're adding new types regularly.",
  },
  {
    q: "Are the documents legally compliant?",
    a: "Our templates are designed to meet UK statutory requirements, including the Employment Rights Act 2025 (Day-One Rights) and current HMRC guidelines. However, we recommend having critical documents reviewed by a qualified solicitor for your specific circumstances.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "Yes — all plans start with a paid subscription. We don't currently offer a free trial, but you can cancel anytime. Your documents remain accessible even after cancellation.",
  },
  {
    q: "Can I customise the documents with my branding?",
    a: "Yes! Pro and Team plans include custom branding — upload your logo and choose your colours, and they'll be applied to all PDF and Word exports.",
  },
  {
    q: "What export formats are available?",
    a: "All documents can be downloaded as PDF and Word (.docx) files. PDFs preserve formatting perfectly, while Word files allow further editing in Microsoft Word or Google Docs.",
  },
  {
    q: "Can I collaborate with my team?",
    a: "Team plans support up to 10 members with role-based access, pending invites, and a shared workspace. Each team member can create and manage documents under your organisation.",
  },
  {
    q: "How is DocuHive different from BreatheHR or BrightHR?",
    a: "DocuHive focuses specifically on document generation — we're not a full HR suite. You get AI-powered document creation without the complexity and cost of enterprise HR systems. No long-term contracts, cancel anytime.",
  },
  {
    q: "What happens if legislation changes?",
    a: "We track UK legislative updates and flag changes that affect your documents. Pro and Team plans get priority notifications when templates need updating.",
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-background px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <AnimatedSection amount={0.2}>
          <h2 className="text-3xl font-bold tracking-tight text-foreground text-center sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-center text-lg text-muted-foreground">
            Everything you need to know about DocuHive
          </p>
        </AnimatedSection>

        <AnimatedStagger className="mt-12 space-y-4" staggerDelay={0.06}>
          {faqs.map((faq, idx) => (
            <AnimatedChild key={idx}>
              <div
                className={cn(
                  "rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all",
                  openIndex === idx && "shadow-md"
                )}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-foreground hover:text-foreground/90 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "shrink-0 text-muted-foreground transition-transform duration-200",
                      openIndex === idx && "rotate-180"
                    )}
                  />
                </button>
                {openIndex === idx && (
                  <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            </AnimatedChild>
          ))}
        </AnimatedStagger>
      </div>
    </section>
  )
}
