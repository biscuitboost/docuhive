import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * GET /api/tenants
 * Returns the current tenant's name, branding, and org defaults.
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
        jurisdiction: tenants.jurisdiction,
        // Defaults
        companyName: tenants.companyName,
        companyAddress: tenants.companyAddress,
        companyNumber: tenants.companyNumber,
        vatNumber: tenants.vatNumber,
        defaultEmploymentType: tenants.defaultEmploymentType,
        defaultSalaryPeriod: tenants.defaultSalaryPeriod,
        defaultFeePeriod: tenants.defaultFeePeriod,
        defaultPaymentTerms: tenants.defaultPaymentTerms,
        defaultNoticePeriod: tenants.defaultNoticePeriod,
        defaultProbationPeriod: tenants.defaultProbationPeriod,
        defaultPensionScheme: tenants.defaultPensionScheme,
        defaultSickPay: tenants.defaultSickPay,
        defaultHolidayEntitlement: tenants.defaultHolidayEntitlement,
        defaultWorkingHours: tenants.defaultWorkingHours,
        defaultConfidentialityPeriod: tenants.defaultConfidentialityPeriod,
        icoRegistrationNumber: tenants.icoRegistrationNumber,
        dpoName: tenants.dpoName,
        dpoEmail: tenants.dpoEmail,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: tenant.name,
      jurisdiction: tenant.jurisdiction,
      branding: {
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        documentFooter: tenant.documentFooter,
        documentHeader: tenant.documentHeader,
      },
      defaults: {
        companyName: tenant.companyName,
        companyAddress: tenant.companyAddress,
        companyNumber: tenant.companyNumber,
        vatNumber: tenant.vatNumber,
        defaultEmploymentType: tenant.defaultEmploymentType,
        defaultSalaryPeriod: tenant.defaultSalaryPeriod,
        defaultFeePeriod: tenant.defaultFeePeriod,
        defaultPaymentTerms: tenant.defaultPaymentTerms,
        defaultNoticePeriod: tenant.defaultNoticePeriod,
        defaultProbationPeriod: tenant.defaultProbationPeriod,
        defaultPensionScheme: tenant.defaultPensionScheme,
        defaultSickPay: tenant.defaultSickPay,
        defaultHolidayEntitlement: tenant.defaultHolidayEntitlement,
        defaultWorkingHours: tenant.defaultWorkingHours,
        defaultConfidentialityPeriod: tenant.defaultConfidentialityPeriod,
        icoRegistrationNumber: tenant.icoRegistrationNumber,
        dpoName: tenant.dpoName,
        dpoEmail: tenant.dpoEmail,
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
 * Updates the current tenant's name, branding, or org defaults.
 * Body: { name?: string, branding?: {...}, defaults?: {...} }
 */
export async function PATCH(request: Request) {
  try {
    const { tenantId } = await requireAuth();

    const body = await request.json();
    const { name, jurisdiction, branding, defaults } = body;

    const updateFields: Record<string, unknown> = {};
    if (name && typeof name === "string" && name.trim().length > 0) {
      updateFields.name = name.trim();
    }
    if (jurisdiction && typeof jurisdiction === "string") {
      updateFields.jurisdiction = jurisdiction;
    }
    if (branding && typeof branding === "object") {
      if (typeof branding.logoUrl === "string") updateFields.logoUrl = branding.logoUrl;
      if (typeof branding.primaryColor === "string") updateFields.primaryColor = branding.primaryColor;
      if (typeof branding.documentFooter === "string") updateFields.documentFooter = branding.documentFooter;
      if (typeof branding.documentHeader === "string") updateFields.documentHeader = branding.documentHeader;
    }
    if (defaults && typeof defaults === "object") {
      if (typeof defaults.companyName === "string") updateFields.companyName = defaults.companyName;
      if (typeof defaults.companyAddress === "string") updateFields.companyAddress = defaults.companyAddress;
      if (typeof defaults.companyNumber === "string") updateFields.companyNumber = defaults.companyNumber;
      if (typeof defaults.vatNumber === "string") updateFields.vatNumber = defaults.vatNumber;
      if (typeof defaults.defaultEmploymentType === "string") updateFields.defaultEmploymentType = defaults.defaultEmploymentType;
      if (typeof defaults.defaultSalaryPeriod === "string") updateFields.defaultSalaryPeriod = defaults.defaultSalaryPeriod;
      if (typeof defaults.defaultFeePeriod === "string") updateFields.defaultFeePeriod = defaults.defaultFeePeriod;
      if (typeof defaults.defaultPaymentTerms === "string") updateFields.defaultPaymentTerms = defaults.defaultPaymentTerms;
      if (typeof defaults.defaultNoticePeriod === "string") updateFields.defaultNoticePeriod = defaults.defaultNoticePeriod;
      if (typeof defaults.defaultProbationPeriod === "string") updateFields.defaultProbationPeriod = defaults.defaultProbationPeriod;
      if (typeof defaults.defaultPensionScheme === "string") updateFields.defaultPensionScheme = defaults.defaultPensionScheme;
      if (typeof defaults.defaultSickPay === "string") updateFields.defaultSickPay = defaults.defaultSickPay;
      if (typeof defaults.defaultHolidayEntitlement === "string") updateFields.defaultHolidayEntitlement = defaults.defaultHolidayEntitlement;
      if (typeof defaults.defaultWorkingHours === "string") updateFields.defaultWorkingHours = defaults.defaultWorkingHours;
      if (typeof defaults.defaultConfidentialityPeriod === "string") updateFields.defaultConfidentialityPeriod = defaults.defaultConfidentialityPeriod;
      if (typeof defaults.icoRegistrationNumber === "string") updateFields.icoRegistrationNumber = defaults.icoRegistrationNumber;
      if (typeof defaults.dpoName === "string") updateFields.dpoName = defaults.dpoName;
      if (typeof defaults.dpoEmail === "string") updateFields.dpoEmail = defaults.dpoEmail;
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
        jurisdiction: tenants.jurisdiction,
        companyName: tenants.companyName,
        companyAddress: tenants.companyAddress,
        companyNumber: tenants.companyNumber,
        vatNumber: tenants.vatNumber,
        defaultEmploymentType: tenants.defaultEmploymentType,
        defaultSalaryPeriod: tenants.defaultSalaryPeriod,
        defaultFeePeriod: tenants.defaultFeePeriod,
        defaultPaymentTerms: tenants.defaultPaymentTerms,
        defaultNoticePeriod: tenants.defaultNoticePeriod,
        defaultProbationPeriod: tenants.defaultProbationPeriod,
        defaultPensionScheme: tenants.defaultPensionScheme,
        defaultSickPay: tenants.defaultSickPay,
        defaultHolidayEntitlement: tenants.defaultHolidayEntitlement,
        defaultWorkingHours: tenants.defaultWorkingHours,
        defaultConfidentialityPeriod: tenants.defaultConfidentialityPeriod,
        icoRegistrationNumber: tenants.icoRegistrationNumber,
        dpoName: tenants.dpoName,
        dpoEmail: tenants.dpoEmail,
      });

    if (!updated) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: updated.name,
      jurisdiction: updated.jurisdiction,
      branding: {
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
        documentFooter: updated.documentFooter,
        documentHeader: updated.documentHeader,
      },
      defaults: {
        companyName: updated.companyName,
        companyAddress: updated.companyAddress,
        companyNumber: updated.companyNumber,
        vatNumber: updated.vatNumber,
        defaultEmploymentType: updated.defaultEmploymentType,
        defaultSalaryPeriod: updated.defaultSalaryPeriod,
        defaultFeePeriod: updated.defaultFeePeriod,
        defaultPaymentTerms: updated.defaultPaymentTerms,
        defaultNoticePeriod: updated.defaultNoticePeriod,
        defaultProbationPeriod: updated.defaultProbationPeriod,
        defaultPensionScheme: updated.defaultPensionScheme,
        defaultSickPay: updated.defaultSickPay,
        defaultHolidayEntitlement: updated.defaultHolidayEntitlement,
        defaultWorkingHours: updated.defaultWorkingHours,
        defaultConfidentialityPeriod: updated.defaultConfidentialityPeriod,
        icoRegistrationNumber: updated.icoRegistrationNumber,
        dpoName: updated.dpoName,
        dpoEmail: updated.dpoEmail,
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
