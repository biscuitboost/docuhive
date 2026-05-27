// New document creation page with wizard
import DocumentWizard from "@/components/documents/DocumentWizard"

export default function NewDocumentPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Document</h1>
      <DocumentWizard />
    </div>
  )
}
