// Document templates browser page
import DashboardShell from "@/components/layout/DashboardShell"

export default function TemplatesPage() {
  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold">Templates</h1>
      <p className="mt-2 text-muted-foreground">
        Browse and select from available document templates.
      </p>
    </DashboardShell>
  )
}
