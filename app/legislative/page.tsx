// Legislative updates dashboard page
import DashboardShell from "@/components/layout/DashboardShell"
import LegislativeUpdatesList from "@/components/legislative/LegislativeUpdatesList"

export default function LegislativePage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Legislative Updates</h1>
        <p className="mt-2 text-muted-foreground">
          Stay informed about changes to UK employment legislation that may
          affect your documents.
        </p>
      </div>
      <LegislativeUpdatesList />
    </DashboardShell>
  )
}
