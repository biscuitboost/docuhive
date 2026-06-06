"use client"

import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { motion } from "framer-motion"
import { AnimatedSection } from "@/components/animation/AnimatedSection"

const itemFadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

const trustedCompanies = ["Acme Corp", "Pinnacle HR", "SwiftStaff", "GreenLeaf", "UrbanEdge"]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background px-4 pb-24 pt-20 sm:px-6 sm:pb-32 lg:px-8">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.4)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      {/* Glow */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div className="h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <AnimatedSection className="relative mx-auto max-w-7xl text-center" amount={0.3}>
        {/* Pill badge */}
        <motion.div
          variants={itemFadeUp}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
        >
          <motion.span
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ opacity: [1, 0.4, 1], scale: [1, 0.85, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          ERA 2025 Compliant — Day-One Rights Ready
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemFadeUp}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground"
        >
          Generate UK Employment Documents{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600">
            in Seconds
          </span>
          .
          <br />
          No Solicitor. No HR Suite. No Headache.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemFadeUp}
          className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl"
        >
          Micro-businesses with 1&ndash;5 employees can create compliant employment contracts, staff
          handbooks, payslips, and P45s instantly. Stay compliant with the Employment Rights Act 2025
          &mdash; without paying £350&ndash;1000 per solicitor visit.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={itemFadeUp}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link
            href="/sign-up"
            className={cn(
              "rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm",
              "hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              "transition-all duration-150 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            Start Free Trial
          </Link>
          <Link
            href="#pricing"
            className={cn(
              "rounded-lg border border-border px-8 py-3.5 text-base font-semibold text-foreground",
              "hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            See Pricing
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          variants={itemFadeUp}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-10 gap-y-3 text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground/80 text-xs sm:text-sm">Trusted by 500+ UK businesses</span>
          {trustedCompanies.map((name) => (
            <span
              key={name}
              className="border border-border rounded-md px-3 py-1 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </AnimatedSection>
    </section>
  )
}
