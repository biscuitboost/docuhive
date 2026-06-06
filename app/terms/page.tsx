import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0f172a]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          &larr; Back to Home
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-gray-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using DocuHive (&quot;the Platform&quot;), you agree to be bound by
              these Terms of Service. If you do not agree, you may not use the Platform.
              These terms apply to all visitors, users, and customers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Description of Service</h2>
            <p>
              DocuHive provides AI-assisted generation of UK employment documents including
              contracts, staff handbooks, payslips, and P45 forms. The Platform is a tool
              to assist with document creation and is not a substitute for professional
              legal advice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must be at least 18 years old to use the Platform.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate, current, and complete information during registration.</li>
              <li>You are solely responsible for reviewing and customising generated documents for your specific circumstances.</li>
              <li>You must not use the Platform for any unlawful purpose or in violation of applicable laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Intellectual Property</h2>
            <p>
              The Platform, including its code, design, and proprietary templates, is owned
              by DocuHive and protected by intellectual property laws. You are granted a
              limited, non-exclusive, non-transferable licence to use the Platform for your
              business purposes. Generated documents become your property.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Payment and Billing</h2>
            <p>
              Paid plans are billed in advance on a monthly or annual basis. Prices are
              clearly displayed at the point of purchase. You may cancel your subscription
              at any time; access continues until the end of the billing period.
              Refund requests are handled on a case-by-case basis in accordance with UK
              consumer protection law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Limitation of Liability</h2>
            <p>
              DocuHive provides the Platform on an &quot;as is&quot; and &quot;as available&quot; basis. To the
              fullest extent permitted by law, we disclaim all warranties, whether express
              or implied. DocuHive is not liable for any indirect, incidental, or
              consequential damages arising from your use of the Platform. Generated
              documents should be reviewed by a qualified legal professional.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Platform for
              violation of these Terms, fraudulent activity, or conduct that may harm other
              users or the Platform. You may terminate your account at any time by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of
              England and Wales. Any disputes arising under these Terms shall be subject to
              the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">9. Contact</h2>
            <p>
              For questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@docuhive.com" className="text-blue-400 hover:text-blue-300 underline">
                legal@docuhive.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
