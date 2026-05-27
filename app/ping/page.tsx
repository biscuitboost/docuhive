// Minimal test page — no Clerk deps, no DB calls
export default function PingPage() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "24px" }}>DocuHive — ping OK</h1>
      <p>If you can see this, the server is running fine.</p>
    </div>
  );
}
