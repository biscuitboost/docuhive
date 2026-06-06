import { cn } from "@/lib/utils/cn"
import {
  FileText,
  BookOpen,
  ScrollText,
  Cog,
} from "lucide-react"
import { AnimatedSection, AnimatedStagger, AnimatedChild } from "@/components/animation/AnimatedSection"

const features = [
  {
    icon: FileText,
    title: "AI Contract Generator",
    description:
      "Generate HMRC-compliant employment contracts, zero-hour agreements, and fixed-term contracts tailored to UK legislation.",
  },
  {
    icon: BookOpen,
    title: "Staff Handbook Builder",
    description:
      "Build a comprehensive staff handbook covering grievance procedures, disciplinary policies, holiday entitlement, and more.",
  },
  {
    icon: ScrollText,
    title: "Payslip & P45 Generator",
    description:
      "Auto-calculate NI, pension contributions, and tax. Generate digital payslips and P45s with one click.",
  },
  {
    icon: Cog,
    title: "Legislative Auto-Pilot",
    description:
      "Stay up to date with UK employment law changes. We update templates automatically so you never fall out of compliance.",
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-muted/50 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection amount={0.2}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to employ in the UK
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From contract to P45, DocuHive covers your entire employee lifecycle.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedStagger className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <AnimatedChild key={feature.title}>
                <div
                  className={cn(
                    "group relative rounded-xl border border-border bg-card p-6 shadow-sm",
                    "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
                    "transition-all duration-300 hover:-translate-y-1"
                  )}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              </AnimatedChild>
            )
          })}
        </AnimatedStagger>
      </div>
    </section>
  )
}
