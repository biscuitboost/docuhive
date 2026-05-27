// Document editor form with AI-assisted field inputs
export interface DocumentFormProps {
  documentId?: string
}

export default function DocumentForm({ documentId }: DocumentFormProps) {
  return (
    <div>
      <p className="text-muted-foreground">
        Document form for {documentId ?? "new document"}
      </p>
    </div>
  )
}
