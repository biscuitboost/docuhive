// Billing settings page
import BillingOverview from "@/components/billing/BillingOverview"

export default function BillingPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        View your current plan and usage.
      </p>
      <div className="mt-6 max-w-2xl">
        <BillingOverview />
      </div>
    </div>
  )
}
