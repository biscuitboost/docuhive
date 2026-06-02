// Team settings page
import TeamManagement from "@/components/team/TeamManagement"

export default function TeamPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Team</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your team members and roles.
      </p>
      <div className="mt-8 max-w-2xl">
        <TeamManagement />
      </div>
    </div>
  )
}
