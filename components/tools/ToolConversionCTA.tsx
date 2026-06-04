"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

interface ToolConversionCTAProps {
  /** Link to the document generation page (e.g. "/documents/new/payslip") */
  href: string
  /** Action label — short, punchy (e.g. "Generate a Payslip") */
  action: string
  /** Subtitle explaining why (e.g. "with the tax & NI calculated here") */
  subtitle: string
  /** Icon variant */
  icon?: "payslip" | "contract" | "invoice" | "letter"
}

const ICON_MAP = {
  payslip: "💷",
  contract: "📋",
  invoice: "🧾",
  letter: "✉️",
}

export default function ToolConversionCTA({
  href,
  action,
  subtitle,
  icon = "payslip",
}: ToolConversionCTAProps) {
  return (
    <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
          {ICON_MAP[icon]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-card-foreground">
            Ready to {action.slice(0, 1).toLowerCase() + action.slice(1)}?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          <Link
            href={href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
          >
            <Sparkles size={14} />
            {action}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}