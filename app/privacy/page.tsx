import Link from "next/link"

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-gray-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              DocuHive (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our platform and services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Personal Data:</strong> Name, email address, company details, and billing information when you register or make a purchase.</li>
              <li><strong>Document Data:</strong> Information you provide when generating employment documents, including employee details and business information.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited and features used.</li>
              <li><strong>Device Data:</strong> Browser type, IP address, operating system, and device identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Provide, operate, and maintain our document generation services.</li>
              <li>Process transactions and send related communications.</li>
              <li>Improve and personalise your experience on our platform.</li>
              <li>Send technical notices, updates, security alerts, and support messages.</li>
              <li>Respond to your comments, questions, and requests.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share data with trusted
              third-party service providers who assist in operating our platform (e.g.,
              payment processors, cloud hosting providers), subject to contractual
              obligations to protect your data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as
              needed to provide services. Document data is retained in accordance with UK
              employment record-keeping requirements. You may request deletion of your data
              at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Your Rights</h2>
            <p>Under UK data protection law, you have the right to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Access your personal data held by us.</li>
              <li>Rectify inaccurate or incomplete data.</li>
              <li>Erase your data (right to be forgotten).</li>
              <li>Restrict or object to processing of your data.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@docuhive.com" className="text-blue-400 hover:text-blue-300 underline">
                privacy@docuhive.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
