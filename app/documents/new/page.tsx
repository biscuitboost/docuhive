// New document creation page with wizard
import DashboardShell from "@/components/layout/DashboardShell"
import DocumentWizard from "@/components/documents/DocumentWizard"

export default function NewDocumentPage() {
  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold">New Document</h1>
      <DocumentWizard />
    </DashboardShell>
  )
}
