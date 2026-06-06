import Link from "next/link"

export default function CookiesPage() {
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
          Cookie Policy
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-gray-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device (computer, tablet,
              or mobile) when you visit a website. They are widely used to make websites
              work more efficiently and provide information to the site owners.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. How We Use Cookies</h2>
            <p>DocuHive uses cookies for the following purposes:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Essential Cookies:</strong> Required for the platform to function properly, including authentication and session management.</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings to enhance your experience.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our platform so we can improve features and performance.</li>
              <li><strong>Authentication Cookies:</strong> Remember your login state so you don&apos;t need to sign in repeatedly.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Third-Party Cookies</h2>
            <p>
              We may use third-party services (such as analytics providers) that set their
              own cookies. These third parties have their own cookie policies. We do not
              control these cookies, and you should check the relevant third-party
              policies for more information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Cookie Duration</h2>
            <p>
              Session cookies are temporary and are deleted when you close your browser.
              Persistent cookies remain on your device for a set period or until you
              manually delete them. Our essential cookies typically expire after 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Managing Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through your browser settings.
              You can choose to block all cookies, delete existing cookies, or receive a
              warning before a cookie is stored. Please note that blocking essential
              cookies may affect the functionality of the platform.
            </p>
            <p className="mt-2">
              To manage cookies in your browser, visit the help section of your browser
              or refer to:
            </p>
            <ul className="mt-1 list-disc pl-6 space-y-1">
              <li>Chrome: Settings &rarr; Privacy and Security &rarr; Cookies</li>
              <li>Firefox: Options &rarr; Privacy & Security &rarr; Cookies</li>
              <li>Safari: Preferences &rarr; Privacy</li>
              <li>Edge: Settings &rarr; Cookies and Site Permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be
              posted on this page with an updated revision date. We encourage you to
              review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Contact</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at{" "}
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
