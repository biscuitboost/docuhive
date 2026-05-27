// Billing settings page
import DashboardShell from "@/components/layout/DashboardShell"
import UsageBar from "@/components/billing/UsageBar"

export default function BillingPage() {
  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="mt-2 text-muted-foreground">
        View your current plan and usage.
      </p>
      <div className="mt-6">
        <UsageBar />
      </div>
    </DashboardShell>
  )
}
