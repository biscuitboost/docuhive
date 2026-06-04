import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, subscriptions, tenants } from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { PLANS, PlanConfig } from "@/lib/stripe/pricing";
import { DOCUMENT_TYPES } from "@/lib/utils/constants";

export type DashboardAnalytics = {
  typeBreakdown: Array<{
    type: string;
    label: string;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  totalDocuments: number;
  thisMonthDocuments: number;
};

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
  analytics: DashboardAnalytics;
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

    // ── Analytics queries ──────────────────────────────────

        // Type breakdown (most-used document types)
        const typeCounts = await db
          .select({
            type: documents.type,
            count: sql<number>`count(*)::int`,
          })
          .from(documents)
          .where(eq(documents.tenantId, tenantId))
          .groupBy(documents.type)
          .orderBy(desc(sql`count(*)`))
          .limit(10);

        const typeLabelMap: Record<string, string> = {};
        for (const t of DOCUMENT_TYPES) {
          typeLabelMap[t.value] = t.label;
        }

        const typeBreakdown = typeCounts.map((tc) => ({
          type: tc.type,
          label: typeLabelMap[tc.type] ?? tc.type,
          count: tc.count,
        }));

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyRaw = await db
          .select({
            month: sql<string>`to_char(${documents.createdAt}, 'YYYY-MM')`,
            count: sql<number>`count(*)::int`,
          })
          .from(documents)
          .where(
            and(
              eq(documents.tenantId, tenantId),
              gte(documents.createdAt, sixMonthsAgo)
            )
          )
          .groupBy(sql`to_char(${documents.createdAt}, 'YYYY-MM')`)
          .orderBy(sql`to_char(${documents.createdAt}, 'YYYY-MM')`);

        // Fill in missing months
        const monthlyMap = new Map<string, number>();
        for (const r of monthlyRaw) monthlyMap.set(r.month, r.count);
        const monthlyTrend: Array<{ month: string; count: number }> = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlyTrend.push({ month: key, count: monthlyMap.get(key) ?? 0 });
        }

        // Status breakdown
        const statusCounts = await db
          .select({
            status: documents.status,
            count: sql<number>`count(*)::int`,
          })
          .from(documents)
          .where(eq(documents.tenantId, tenantId))
          .groupBy(documents.status)
          .orderBy(desc(sql`count(*)`));

        // Total count + this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const totalResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(documents)
          .where(eq(documents.tenantId, tenantId));

        const thisMonthResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(documents)
          .where(
            and(
              eq(documents.tenantId, tenantId),
              gte(documents.createdAt, startOfMonth)
            )
          );

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
          analytics: {
            typeBreakdown,
            monthlyTrend,
            statusBreakdown: statusCounts.map((sc) => ({
              status: sc.status,
              count: sc.count,
            })),
            totalDocuments: totalResult[0]?.count ?? 0,
            thisMonthDocuments: thisMonthResult[0]?.count ?? 0,
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
