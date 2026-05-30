import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, subscriptions, tenants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { PLANS, PlanConfig } from "@/lib/stripe/pricing";

export type DashboardData = {
  recentDocuments: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
    aiModel: string | null;
  }>;
  usage: {
    documentsUsed: number;
    docsLimit: number | null; // null = unlimited
    plan: string;
  };
  tenant: {
    name: string;
  };
};

/**
 * GET /api/dashboard
 * Aggregated dashboard data: recent docs, usage stats, tenant info.
 */
export async function GET() {
  try {
    const { tenantId } = await requireAuth();

    // Recent 5 documents
    const docs = await db
      .select({
        id: documents.id,
        type: documents.type,
        title: documents.title,
        status: documents.status,
        createdAt: documents.createdAt,
        aiModel: documents.aiModel,
      })
      .from(documents)
      .where(eq(documents.tenantId, tenantId))
      .orderBy(desc(documents.createdAt))
      .limit(5);

    // Subscription / usage
    const [sub] = await db
      .select({
        plan: subscriptions.plan,
        documentsUsed: subscriptions.documentsUsed,
      })
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1);

    const planId = sub?.plan ?? "essentials";
    const planConfig: PlanConfig = PLANS[planId] ?? PLANS.essentials;

    // Tenant info
    const [tenant] = await db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const data: DashboardData = {
      recentDocuments: docs.map((d) => ({
        ...d,
        createdAt: d.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
      usage: {
        documentsUsed: sub?.documentsUsed ?? 0,
        docsLimit: planConfig.docsLimit,
        plan: planConfig.name,
      },
      tenant: {
        name: tenant?.name ?? "My Company",
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
