// Root layout — provides HTML shell + fonts + global CSS
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClerkProviders from "@/components/providers/ClerkProviders"
import DarkModeProvider from "./dark-mode-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DocuHive — AI-Powered UK Employment Documents & Business Tools",
  description:
    "Generate UK employment contracts, staff handbooks, payslips, P45s, and calculate VAT, PAYE, corporation tax, and more. All-in-one business toolkit for UK micro-businesses.",
  keywords: [
    "UK employment documents",
    "contract generator",
    "payslip generator",
    "P45",
    "staff handbook",
    "VAT calculator",
    "PAYE calculator",
    "corporation tax calculator",
    "UK business tools",
    "HR documents",
    "employment contracts UK",
  ],
  openGraph: {
    title: "DocuHive — AI-Powered UK Employment Documents & Business Tools",
    description:
      "Generate UK employment contracts, staff handbooks, payslips, P45s, and calculate VAT, PAYE, corporation tax, and more.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProviders>
          <DarkModeProvider>{children}</DarkModeProvider>
        </ClerkProviders>
      </body>
    </html>
  )
}
