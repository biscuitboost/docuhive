import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * GET /api/tenants
 * Returns the current tenant's name.
 */
export async function GET() {
  try {
    const { tenantId } = await requireAuth();

    const [tenant] = await db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ name: tenant.name });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to load tenant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/tenants
 * Updates the current tenant's name.
 * Body: { name: string }
 */
export async function PATCH(request: Request) {
  try {
    const { tenantId } = await requireAuth();

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    const [updated] = await db
      .update(tenants)
      .set({ name: trimmedName, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning({ name: tenants.name });

    if (!updated) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ name: updated.name });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to update tenant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
