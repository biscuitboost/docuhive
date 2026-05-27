// Paginated list of user documents with search and filters
export interface Document {
  id: string
  title: string
  status: "draft" | "complete"
  createdAt: string
}

export default function DocumentList() {
  return (
    <div>
      <p className="text-muted-foreground">Document list will render here.</p>
    </div>
  )
}
