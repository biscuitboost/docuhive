// Branding settings page — custom logo, colors, document headers/footers
import dynamic from "next/dynamic"

const BrandingSettingsForm = dynamic(
  () => import("@/components/settings/BrandingSettingsForm"),
  { ssr: false }
)

export default function BrandingSettingsPage() {
  return <BrandingSettingsForm />
}