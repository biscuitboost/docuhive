// Documents list page
import DashboardShell from "@/components/layout/DashboardShell"
import DocumentList from "@/components/documents/DocumentList"

export default function DocumentsPage() {
  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold">Documents</h1>
      <DocumentList />
    </DashboardShell>
  )
}
