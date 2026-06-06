import Link from "next/link"

export default function GDPRPage() {
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
          GDPR Compliance
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-gray-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Our Commitment</h2>
            <p>
              DocuHive is committed to full compliance with the UK General Data Protection
              Regulation (UK GDPR) and the Data Protection Act 2018. We take the privacy
              and security of your personal data seriously.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Data Controller</h2>
            <p>
              DocuHive acts as the data controller for the personal data you provide when
              using our platform. We determine the purposes and means of processing your
              personal data in accordance with UK data protection law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Lawful Basis for Processing</h2>
            <p>We process your personal data under the following lawful bases:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Consent:</strong> Where you have given clear consent for us to process your data for a specific purpose.</li>
              <li><strong>Contract:</strong> Where processing is necessary for the performance of a contract with you.</li>
              <li><strong>Legal Obligation:</strong> Where we need to comply with a legal or regulatory obligation.</li>
              <li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate business interests, provided these do not override your rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Your GDPR Rights</h2>
            <p>Under UK GDPR, you have the following rights:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Right to be informed:</strong> We provide this privacy information in a concise, transparent, and easily accessible format.</li>
              <li><strong>Right of access:</strong> You can request a copy of the personal data we hold about you.</li>
              <li><strong>Right to rectification:</strong> You can ask us to correct inaccurate or incomplete data.</li>
              <li><strong>Right to erasure:</strong> You can request deletion of your personal data where there is no compelling reason for its continued processing.</li>
              <li><strong>Right to restrict processing:</strong> You can ask us to suspend the processing of your data in certain circumstances.</li>
              <li><strong>Right to data portability:</strong> You can request a machine-readable copy of your data to transfer to another service.</li>
              <li><strong>Right to object:</strong> You can object to processing based on legitimate interests or direct marketing.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your
              personal data, including encryption at rest and in transit, access controls,
              regular security audits, and staff training on data protection. All data is
              stored within secure UK and EU data centres.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. International Transfers</h2>
            <p>
              We do not transfer your personal data outside the UK or European Economic
              Area (EEA) unless adequate safeguards are in place, such as Standard
              Contractual Clauses or an adequacy decision by the UK or EU authorities.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Data Breach Notification</h2>
            <p>
              In the unlikely event of a data breach affecting your personal data, we will
              notify you and the relevant supervisory authority within 72 hours as required
              by UK GDPR.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Our DPO</h2>
            <p>
              Our Data Protection Officer can be reached at{" "}
              <a href="mailto:dpo@docuhive.com" className="text-blue-400 hover:text-blue-300 underline">
                dpo@docuhive.com
              </a>. You also have the right to lodge a complaint with the
              Information Commissioner&apos;s Office (ICO) at any time.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
