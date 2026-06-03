import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface BrandingSettings {
  logoUrl: string | null;
  primaryColor: string;
  documentFooter: string | null;
  documentHeader: string | null;
}

const defaultBranding: BrandingSettings = {
  logoUrl: null,
  primaryColor: "#2563eb",
  documentFooter: null,
  documentHeader: null,
};

/**
 * Load branding settings for a tenant.
 * Returns defaults for any field not set.
 */
export async function loadBranding(tenantId: string): Promise<BrandingSettings> {
  try {
    const [tenant] = await db
      .select({
        logoUrl: tenants.logoUrl,
        primaryColor: tenants.primaryColor,
        documentFooter: tenants.documentFooter,
        documentHeader: tenants.documentHeader,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) return defaultBranding;

    return {
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor ?? defaultBranding.primaryColor,
      documentFooter: tenant.documentFooter,
      documentHeader: tenant.documentHeader,
    };
  } catch {
    return defaultBranding;
  }
}