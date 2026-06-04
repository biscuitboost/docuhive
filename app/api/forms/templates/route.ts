import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedFormTemplates } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

const VALID_DOC_TYPES = [
  "employment_contract", "offer_letter", "staff_handbook", "payslip", "p45",
  "job_description", "nda", "service_agreement", "consultant_agreement",
  "freelancer_contract", "settlement_agreement", "disciplinary_grievance_letters",
  "flexible_working_request", "gdpr_privacy_notice", "data_processing_agreement",
  "privacy_policy", "terms_and_conditions", "commercial_lease",
  "director_service_agreement", "shareholder_agreement",
];

/**
 * GET /api/forms/templates
 * List all saved form templates for the current tenant.
 * Query params: ?type=employment_contract (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    const conditions = [eq(savedFormTemplates.tenantId, tenantId)];
    if (typeFilter) {
      conditions.push(eq(savedFormTemplates.docType, typeFilter));
    }

    const templates = await db
      .select()
      .from(savedFormTemplates)
      .where(and(...conditions))
      .orderBy(desc(savedFormTemplates.updatedAt));

    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to load templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/forms/templates
 * Save form values as a reusable template.
 * Body: { name, docType, formValues }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const body = await request.json();
    const { name, docType, formValues } = body;

    if (!name || !docType || !formValues) {
      return NextResponse.json(
        { error: "name, docType, and formValues are required" },
        { status: 400 }
      );
    }

    if (!VALID_DOC_TYPES.includes(docType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (typeof formValues !== "object" || Object.keys(formValues).length === 0) {
      return NextResponse.json(
        { error: "formValues must be a non-empty object" },
        { status: 400 }
      );
    }

    if (name.trim().length < 1 || name.trim().length > 100) {
      return NextResponse.json(
        { error: "name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    // Ensure tenant-scoped name uniqueness
    const existing = await db
      .select({ id: savedFormTemplates.id })
      .from(savedFormTemplates)
      .where(
        and(
          eq(savedFormTemplates.tenantId, tenantId),
          eq(savedFormTemplates.name, name.trim())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A template with this name already exists" },
        { status: 409 }
      );
    }

    const [template] = await db
      .insert(savedFormTemplates)
      .values({
        tenantId,
        name: name.trim(),
        docType,
        formValues,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to save template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/forms/templates?id=xxx
 * Delete a saved form template by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: savedFormTemplates.id, tenantId: savedFormTemplates.tenantId })
      .from(savedFormTemplates)
      .where(eq(savedFormTemplates.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (existing.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(savedFormTemplates).where(eq(savedFormTemplates.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}