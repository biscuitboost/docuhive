import Link from "next/link"

const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Calculator", href: "/#calculator" },
    { label: "FAQ", href: "/#faq" },
    { label: "All Tools", href: "/tools" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "GDPR", href: "/gdpr" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              <span className="text-blue-400">Docu</span>Hive
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              AI-powered UK employment document generation for micro-businesses.
            </p>
          </div>
          {[
            { title: "Product", links: footerLinks.product },
            { title: "Legal", links: footerLinks.legal },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-gray-300">{group.title}</h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} DocuHive. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-gray-600">
            DocuHive is not a law firm and does not provide legal advice. Templates should be reviewed
            by a qualified professional for your specific circumstances.
          </p>
        </div>
      </div>
    </footer>
  )
}