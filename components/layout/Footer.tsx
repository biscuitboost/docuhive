// Marketing site footer with links and legal info
export default function Footer() {
  return (
    <footer className="border-t bg-background py-8">
      <p className="text-center text-muted-foreground">
        &copy; {new Date().getFullYear()} DocuHive. All rights reserved.
      </p>
    </footer>
  )
}
