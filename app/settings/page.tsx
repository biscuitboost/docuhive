// Settings page — org name + personal details form
import dynamic from "next/dynamic"

// Deferred to browser — useUser() needs ClerkProvider which is client-only
const GeneralSettingsForm = dynamic(
  () => import("@/components/settings/GeneralSettingsForm"),
  { ssr: false }
)

export default function SettingsPage() {
  return <GeneralSettingsForm />
}
