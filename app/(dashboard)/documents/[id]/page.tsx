// Single document view/edit page
import DocumentForm from "@/components/documents/DocumentForm"
import DocumentPreview from "@/components/documents/DocumentPreview"

interface DocumentPageProps {
  params: { id: string }
}

export default function DocumentPage({ params }: DocumentPageProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <DocumentForm documentId={params.id} />
      <DocumentPreview documentId={params.id} />
    </div>
  )
}
