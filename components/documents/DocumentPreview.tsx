// Real-time PDF preview of the generated document
export interface DocumentPreviewProps {
  documentId?: string
}

export default function DocumentPreview({ documentId }: DocumentPreviewProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-muted-foreground">
        Preview for document {documentId ?? "new document"}
      </p>
    </div>
  )
}
