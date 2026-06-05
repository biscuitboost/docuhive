import { NextResponse } from "next/server";

/**
 * GET /api/health — quick health check that tests DB connectivity
 */
export async function GET() {
  const checks: Record<string, string | boolean> = {
    node: process.version,
    env: process.env.VERCEL_ENV || "unknown",
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  };

  // Check DB connectivity
  try {
    const { db } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT 1 as ok`);
    checks.db = true;
    checks.dbResult = JSON.stringify(result);
  } catch (e: any) {
    checks.db = false;
    checks.dbError = e?.message || String(e);
  }

  // Check Clerk env vars
  checks.hasClerkSecret = !!process.env.CLERK_SECRET_KEY;
  checks.hasClerkPublishable = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const isHealthy = checks.db === true;
  return NextResponse.json(
    { status: isHealthy ? "ok" : "degraded", checks },
    { status: isHealthy ? 200 : 503 }
  );
}