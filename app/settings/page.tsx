// User settings page
import DashboardShell from "@/components/layout/DashboardShell"

export default function SettingsPage() {
  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account settings and preferences.
      </p>
    </DashboardShell>
  )
}
