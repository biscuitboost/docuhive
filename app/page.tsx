// Diagnostic root page — minimal, no deps
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28 }}>DocuHive</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        AI-powered UK employment document generation.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Link href="/sign-in"
          style={{ background: "#2563eb", color: "white", padding: "8px 20px", borderRadius: 8, textDecoration: "none" }}>
          Sign In
        </Link>
        <Link href="/documents"
          style={{ border: "1px solid #d1d5db", padding: "8px 20px", borderRadius: 8, textDecoration: "none", color: "#111" }}>
          Documents
        </Link>
      </div>
    </div>
  );
}
