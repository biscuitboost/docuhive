import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/** Map of doc type keys to human-readable labels */
const DOC_TYPE_LABELS: Record<string, string> = {
  employment_contract: "Employment Contract",
  offer_letter: "Offer Letter",
  staff_handbook: "Staff Handbook",
  payslip: "Payslip",
  p45: "P45",
  job_description: "Job Description",
  nda: "NDA",
  service_agreement: "Service Agreement",
  consultant_agreement: "Consultant Agreement",
  freelancer_contract: "Freelancer Contract",
  settlement_agreement: "Settlement Agreement",
  disciplinary_grievance_letters: "Disciplinary & Grievance Letters",
  flexible_working_request: "Flexible Working Request",
  gdpr_privacy_notice: "GDPR Privacy Notice",
  data_processing_agreement: "Data Processing Agreement",
  privacy_policy: "Privacy Policy",
  terms_and_conditions: "Terms & Conditions",
  commercial_lease: "Commercial Lease",
  director_service_agreement: "Director Service Agreement",
  shareholder_agreement: "Shareholder Agreement",
  custom: "Custom",
};

/**
 * GET /api/templates
 * List all prompt templates for the current tenant.
 * Query params: ?type=employment_contract (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    const conditions = [eq(documentTemplates.tenantId, tenantId)];
    if (typeFilter) {
      conditions.push(eq(documentTemplates.type, typeFilter as any));
    }

    const templates = await db
      .select()
      .from(documentTemplates)
      .where(and(...conditions))
      .orderBy(documentTemplates.createdAt);

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
 * POST /api/templates
 * Create a new custom prompt template for the current tenant.
 * Body: { type, name, promptTemplate, isActive? }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const body = await request.json();
    const { type, name, promptTemplate, isActive } = body;

    if (!type || !name || !promptTemplate) {
      return NextResponse.json(
        { error: "type, name, and promptTemplate are required" },
        { status: 400 }
      );
    }

    // Check that type is valid
    const validTypes = Object.keys(DOC_TYPE_LABELS);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const [template] = await db
      .insert(documentTemplates)
      .values({
        tenantId,
        type: type as any,
        name,
        promptTemplate,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}