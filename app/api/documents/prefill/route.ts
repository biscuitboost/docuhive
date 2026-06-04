import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * Field alias groups — maps canonical field keys to the various names
 * they appear under across different document types.
 */
const FIELD_ALIASES: Record<string, string[]> = {
  employee_name: ["employee_name", "candidate_name"],
  employer_name: [
    "employer_name",
    "company_name",
    "business_name",
    "organisation_name",
    "controller_name",
    "client_name",
    "landlord_name",
    "provider_name",
    "disclosing_party",
  ],
  company_address: [
    "company_address",
    "business_address",
    "organisation_address",
    "employer_address",
    "employer_address",
  ],
  job_title: ["job_title", "employee_role", "director_title"],
  salary: [
    "salary",
    "annual_salary",
    "gross_pay",
    "fee",
    "annual_rent",
    "compensation_payment",
  ],
  start_date: [
    "start_date",
    "effective_date",
    "commencement_date",
    "settlement_date",
  ],
  employment_type: ["employment_type"],
  working_hours: ["working_hours"],
  notice_period: ["notice_period"],
  pension_scheme: ["pension_scheme"],
  ni_number: ["ni_number"],
  tax_code: ["tax_code"],
};

/**
 * Which doc types are "employee-specific" (keyed by employee name)
 * vs "company-global" (company-level data shared across employees).
 * Used to decide whether to match on employee_name.
 */
const EMPLOYEE_DOC_TYPES = new Set([
  "employment_contract",
  "offer_letter",
  "payslip",
  "p45",
  "settlement_agreement",
  "disciplinary_grievance_letters",
  "flexible_working_request",
  "job_description",
]);

/**
 * The canonical field keys we support pre-filling for.
 * These map to fields that actually exist in the DocumentWizard's DOC_TYPES.
 */
const SUPPORTED_FIELDS = new Set([
  "employee_name",
  "employer_name",
  "company_address",
  "job_title",
  "salary",
  "start_date",
  "employment_type",
  "working_hours",
  "notice_period",
  "pension_scheme",
  "ni_number",
  "tax_code",
]);

export interface PrefillSuggestion {
  /** The canonical field key (e.g. "employee_name") */
  fieldKey: string;
  /** The value to pre-fill */
  value: string;
  /** Which previous document this came from */
  sourceType: string;
  /** The source document's title */
  sourceTitle: string;
}

export interface PrefillResponse {
  suggestions: PrefillSuggestion[];
  /** How many documents were scanned */
  scanned: number;
}

/**
 * GET /api/documents/prefill?docType=employment_contract&employeeName=John
 *
 * Scans the tenant's recent documents for field values that can be
 * pre-filled into the current document. Handles field-name aliasing
 * across different document types (e.g. "employee_name" in contracts
 * vs "candidate_name" in offer letters).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("docType");
    const employeeName = searchParams.get("employeeName");

    if (!docType) {
      return NextResponse.json(
        { error: "docType query parameter is required" },
        { status: 400 }
      );
    }

    // Get the last 20 documents
    const recentDocs = await db
      .select({
        id: documents.id,
        type: documents.type,
        title: documents.title,
        inputData: documents.inputData,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.tenantId, tenantId))
      .orderBy(desc(documents.createdAt))
      .limit(20);

    const scanned = recentDocs.length;
    const suggestions: PrefillSuggestion[] = [];
    const seenFields = new Set<string>();

    const isEmployeeDoc = EMPLOYEE_DOC_TYPES.has(docType);

    // If we have an employee name filter, only consider documents
    // that relate to the same employee
    let employeeFilter: string | null = null;
    if (employeeName && employeeName.trim()) {
      employeeFilter = employeeName.trim().toLowerCase();
    }

    // If no employee name provided but this is an employee doc type,
    // try to extract it from the most recent document of the SAME type
    if (!employeeFilter && isEmployeeDoc) {
      const sameTypeDocs = recentDocs.filter((d) => d.type === docType);
      if (sameTypeDocs.length > 0 && sameTypeDocs[0].inputData) {
        const inputs = sameTypeDocs[0].inputData as Record<string, string>;
        const name =
          inputs.employee_name ||
          inputs.candidate_name ||
          inputs.employeeName ||
          "";
        if (name.trim()) {
          employeeFilter = name.trim().toLowerCase();
        }
      }
    }

    // Build a map of canonical field -> value from previous docs
    const fieldValueMap: Record<
      string,
      { value: string; sourceType: string; sourceTitle: string }
    > = {};

    for (const doc of recentDocs) {
      if (!doc.inputData) continue;
      const inputs = doc.inputData as Record<string, string>;

      // If filtering by employee, skip docs that don't mention this employee
      if (employeeFilter) {
        const docEmployeeName =
          inputs.employee_name ||
          inputs.candidate_name ||
          inputs.employeeName ||
          "";
        if (
          docEmployeeName &&
          docEmployeeName.trim().toLowerCase() !== employeeFilter
        ) {
          continue;
        }
      }

      // Walk through all the field aliases and try to find matches
      for (const [canonicalKey, aliases] of Object.entries(FIELD_ALIASES)) {
        if (seenFields.has(canonicalKey)) continue;
        if (!SUPPORTED_FIELDS.has(canonicalKey)) continue;

        for (const alias of aliases) {
          const val = inputs[alias];
          if (val && typeof val === "string" && val.trim()) {
            fieldValueMap[canonicalKey] = {
              value: val.trim(),
              sourceType: doc.type ?? "unknown",
              sourceTitle: doc.title ?? "Unknown",
            };
            seenFields.add(canonicalKey);
            break;
          }
        }
      }
    }

    for (const [key, info] of Object.entries(fieldValueMap)) {
      suggestions.push({
        fieldKey: key,
        value: info.value,
        sourceType: info.sourceType,
        sourceTitle: info.sourceTitle,
      });
    }

    return NextResponse.json({ suggestions, scanned });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to get prefills";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}