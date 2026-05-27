import Hero from "@/components/marketing/Hero"
import Features from "@/components/marketing/Features"
import Pricing from "@/components/marketing/Pricing"
import Calculator from "@/components/marketing/Calculator"
import Footer from "@/components/layout/Footer"

const problemBullets = [
  {
    title: "Tribunal costs up to &#xA3;2,876",
    description:
      "Without proper employment contracts, a successful employment tribunal claim can cost you thousands in compensation and legal fees.",
  },
  {
    title: "ERA 2025 Day-One Rights",
    description:
      "From April 2025, unfair dismissal protection, sick pay, and parental leave are Day-One rights. Your documents must reflect this.",
  },
  {
    title: "DIY templates won't cut it",
    description:
      "ACAS templates are generic. Solicitors charge &#xA3;350&ndash;1,000 per document. HR suites are built for enterprises, not 1&ndash;5 person teams.",
  },
]

const steps = [
  {
    number: "01",
    title: "Fill a smart form",
    description: "Tell us about your employee, role, salary, and hours. It takes 5 minutes.",
  },
  {
    number: "02",
    title: "AI generates the document",
    description: "Our engine creates a fully compliant UK employment document in seconds.",
  },
  {
    number: "03",
    title: "Download PDF or Word",
    description: "Export as a beautifully formatted PDF or editable Word .docx file — instantly.",
  },
]

const faqs = [
  {
    q: "Are the templates legally compliant?",
    a: "Yes. All templates are drafted to comply with UK employment law, including the Employment Rights Act 1996, the Equality Act 2010, and the Employment Rights Act 2025 Day-One Rights provisions. We update templates automatically when legislation changes.",
  },
  {
    q: "Is DocuHive GDPR compliant?",
    a: "Absolutely. We are fully GDPR compliant. All data is encrypted at rest and in transit, hosted in the UK on AWS London. We never share your data with third parties.",
  },
  {
    q: "Can a solicitor review my documents?",
    a: "Yes. While our templates are legally compliant, we always recommend having a qualified UK employment solicitor review your specific documents if you have unusual requirements.",
  },
  {
    q: "What happens if I need to change a document later?",
    a: "You can regenerate any document at any time. All documents are saved in your account. Pro and Team plans allow unlimited revisions.",
  },
  {
    q: "Do you handle Scottish or Northern Irish employment law?",
    a: "Currently our templates are designed for England and Wales. Scottish employment law is broadly similar but has some differences. We recommend consulting a Scottish solicitor for Scottish employees.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel anytime. Your documents remain accessible in read-only mode. We don't lock you out of your data.",
  },
]

export default function LandingPage() {
  return (
    <main className="bg-[#0f172a] text-white">
      <Hero />

      {/* Problem section */}
      <section className="bg-[#1a2234] px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              The risk of hiring without proper docs
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              UK employment law is getting tougher. Are your documents up to standard?
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {problemBullets.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-700 bg-[#0f172a] p-6"
              >
                <h3
                  className="text-lg font-semibold text-white"
                  dangerouslySetInnerHTML={{ __html: item.title }}
                />
                <p className="mt-3 text-sm leading-6 text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Features />

      {/* How it works */}
      <section id="how-it-works" className="bg-[#0f172a] px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Three simple steps to generate compliant UK employment documents.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-2xl font-bold text-blue-400">
                  {step.number}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />
      <Calculator />

      {/* FAQ */}
      <section id="faq" className="bg-[#1a2234] px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-gray-700 bg-[#0f172a]"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium text-white">
                  {faq.q}
                  <span className="ml-4 flex-shrink-0 text-gray-500 group-open:rotate-180 transition-transform">
                    &#x25BC;
                  </span>
                </summary>
                <div className="border-t border-gray-700/50 px-5 pb-5 pt-3">
                  <p className="text-sm leading-6 text-gray-400">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
