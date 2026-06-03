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
      .select({
        name: tenants.name,
        logoUrl: tenants.logoUrl,
        primaryColor: tenants.primaryColor,
        documentFooter: tenants.documentFooter,
        documentHeader: tenants.documentHeader,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: tenant.name,
      branding: {
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        documentFooter: tenant.documentFooter,
        documentHeader: tenant.documentHeader,
      },
    });
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
    const { name, branding } = body;

    const updateFields: Record<string, unknown> = {};
    if (name && typeof name === "string" && name.trim().length > 0) {
      updateFields.name = name.trim();
    }
    if (branding && typeof branding === "object") {
      if (typeof branding.logoUrl === "string") updateFields.logoUrl = branding.logoUrl;
      if (typeof branding.primaryColor === "string") updateFields.primaryColor = branding.primaryColor;
      if (typeof branding.documentFooter === "string") updateFields.documentFooter = branding.documentFooter;
      if (typeof branding.documentHeader === "string") updateFields.documentHeader = branding.documentHeader;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updateFields.updatedAt = new Date();

    const [updated] = await db
      .update(tenants)
      .set(updateFields as any)
      .where(eq(tenants.id, tenantId))
      .returning({
        name: tenants.name,
        logoUrl: tenants.logoUrl,
        primaryColor: tenants.primaryColor,
        documentFooter: tenants.documentFooter,
        documentHeader: tenants.documentHeader,
      });

    if (!updated) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: updated.name,
      branding: {
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
        documentFooter: updated.documentFooter,
        documentHeader: updated.documentHeader,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to update tenant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
