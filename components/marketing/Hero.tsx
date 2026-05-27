import Link from "next/link"
import { cn } from "@/lib/utils/cn"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0f172a] px-4 pb-24 pt-20 sm:px-6 sm:pb-32 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div className="h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          ERA 2025 Compliant — Day-One Rights Ready
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Generate UK Employment Documents{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            in Seconds
          </span>
          .
          <br />
          No Solicitor. No HR Suite. No Headache.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300 sm:text-xl">
          Micro-businesses with 1&ndash;5 employees can create compliant employment contracts, staff
          handbooks, payslips, and P45s instantly. Stay compliant with the Employment Rights Act 2025
          &mdash; without paying &#xA3;350&ndash;1000 per solicitor visit.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className={cn(
              "rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm",
              "hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
              "transition-colors"
            )}
          >
            Start Free Trial
          </Link>
          <Link
            href="#pricing"
            className={cn(
              "rounded-lg border border-gray-600 px-8 py-3.5 text-base font-semibold text-gray-200",
              "hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              "transition-colors"
            )}
          >
            See Pricing
          </Link>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-gray-400">
          <span className="font-medium text-gray-300">Trusted by 500+ UK businesses</span>
          <span className="border border-gray-700 rounded-md px-3 py-1 text-gray-400">Acme Corp</span>
          <span className="border border-gray-700 rounded-md px-3 py-1 text-gray-400">Pinnacle HR</span>
          <span className="border border-gray-700 rounded-md px-3 py-1 text-gray-400">SwiftStaff</span>
          <span className="border border-gray-700 rounded-md px-3 py-1 text-gray-400">GreenLeaf</span>
          <span className="border border-gray-700 rounded-md px-3 py-1 text-gray-400">UrbanEdge</span>
        </div>
      </div>
    </section>
  )
}
