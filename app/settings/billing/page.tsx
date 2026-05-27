// Billing settings page with usage bar and pricing table
import PricingTable from "@/components/billing/PricingTable"
import UsageBar from "@/components/billing/UsageBar"

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Billing</h1>
      <UsageBar />
      <PricingTable />
    </div>
  )
}
