// Root layout — provides HTML shell + fonts + global CSS
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClerkProviders from "@/components/providers/ClerkProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DocuHive — AI-Powered UK Employment Documents",
  description:
    "Generate UK employment contracts, staff handbooks, payslips and P45s in seconds. No solicitor. No HR suite. No headache.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProviders>{children}</ClerkProviders>
      </body>
    </html>
  )
}
