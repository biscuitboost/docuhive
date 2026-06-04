// Individual document type page — direct link to a specific doc form
import { redirect } from "next/navigation"
import DashboardShell from "@/components/layout/DashboardShell"
import DocumentWizard from "@/components/documents/DocumentWizard"

// The valid doc type slugs — mirrors the union in DocumentWizard
const VALID_TYPES = [
  "employment_contract", "offer_letter", "staff_handbook", "payslip", "p45",
  "job_description", "nda", "service_agreement", "consultant_agreement",
  "freelancer_contract", "settlement_agreement", "disciplinary_grievance_letters",
  "flexible_working_request", "gdpr_privacy_notice", "data_processing_agreement",
  "privacy_policy", "terms_and_conditions", "commercial_lease",
  "director_service_agreement", "shareholder_agreement",
]

interface Props {
  params: Promise<{ type: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DocumentTypePage({ params, searchParams }: Props) {
  const { type } = await params

  if (!VALID_TYPES.includes(type)) {
    redirect("/documents/new")
  }

  // Parse query params into flat form values (for CTA pre-fill URLs)
  let initialFormValues: Record<string, string> | undefined
  if (searchParams) {
    const sp = await searchParams
    const filtered: Record<string, string> = {}
    for (const [key, val] of Object.entries(sp)) {
      if (typeof val === "string" && val.trim()) {
        filtered[key] = val.trim()
      }
    }
    if (Object.keys(filtered).length > 0) {
      initialFormValues = filtered
    }
  }

  return (
    <DashboardShell>
      <DocumentWizard initialType={type} initialFormValues={initialFormValues} />
    </DashboardShell>
  )
}