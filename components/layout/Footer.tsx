import Link from "next/link"

const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Calculator", href: "/#calculator" },
    { label: "FAQ", href: "/#faq" },
    { label: "All Tools", href: "/tools" },
  ],
  freeTools: [
    { label: "VAT Calculator", href: "/tools/landing/vat" },
    { label: "PAYE Calculator", href: "/tools/landing/paye" },
    { label: "Corporation Tax", href: "/tools/landing/corporation-tax" },
    { label: "Dividend Calculator", href: "/tools/landing/dividend" },
    { label: "Holiday Entitlement", href: "/tools/landing/holiday-entitlement" },
    { label: "Redundancy Calculator", href: "/tools/landing/redundancy" },
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
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              <span className="text-primary">Docu</span>Hive
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              AI-powered UK employment document generation and free business tools for micro-businesses.
            </p>
          </div>
          {[
            { title: "Product", links: footerLinks.product },
            { title: "Free Tools", links: footerLinks.freeTools },
            { title: "Legal", links: footerLinks.legal },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DocuHive. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            DocuHive is not a law firm and does not provide legal advice. Templates and calculator
            results should be reviewed by a qualified professional for your specific circumstances.
          </p>
        </div>
      </div>
    </footer>
  )
}
