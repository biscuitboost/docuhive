/**
 * POST /api/v1/documents/generate
 * Public API endpoint for document generation.
 * Authenticated via Bearer token (API key).
 * No user session required — uses tenant-scoped API key.
 *
 * Rate limiting is tracked via usage endpoint on the subscription.
 * Plan limits (monthly document count) are enforced server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/documents/generate";
import { authenticatePublicRequest, PublicAuthError } from "@/lib/auth/public-api";
import { db } from "@/lib/db";
import { documents, subscriptions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getPlan } from "@/lib/stripe/pricing";
import { createNotification } from "@/lib/documents/notifications";

export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key
    const { tenantId } = await authenticatePublicRequest(request);
    const body = await request.json();

    // Override any client-sent tenantId with the one from the API key
    body.tenantId = tenantId;

    // Check plan limits
    const planLimit = await getPlanLimit(tenantId);
    if (planLimit !== null) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(
          sql`${documents.tenantId} = ${tenantId} AND ${documents.createdAt} >= ${monthStart.toISOString()}`
        )
        .limit(1);

      const docsUsed = Number(countResult[0]?.count || 0);
      if (docsUsed >= planLimit) {
        return NextResponse.json(
          { error: "Monthly document limit reached. Upgrade your plan." },
          { status: 403 }
        );
      }
    }

    const result = await generateDocument(body);

    // Atomically increment documents_used
    if (planLimit !== null) {
      const updated = await db
        .update(subscriptions)
        .set({ documentsUsed: sql`${subscriptions.documentsUsed} + 1` })
        .where(
          and(
            eq(subscriptions.tenantId, tenantId),
            sql`${subscriptions.documentsUsed} < ${planLimit}`
          )
        )
        .returning({ documentsUsed: subscriptions.documentsUsed });

      if (updated.length === 0) {
        // Roll back
        await db
          .update(documents)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(documents.id, result.documentId));

        return NextResponse.json(
          { error: "Monthly document limit reached. Upgrade your plan." },
          { status: 403 }
        );
      }
    } else {
      await db
        .update(subscriptions)
        .set({ documentsUsed: sql`${subscriptions.documentsUsed} + 1` })
        .where(eq(subscriptions.tenantId, tenantId));
    }

    // Create notification
    await createNotification(
      tenantId,
      "document_generated",
      "Document Generated via API",
      `"${body.title ?? result.documentId}" has been generated via the API.`,
      `/documents/${result.documentId}`,
    );

    return NextResponse.json(
      {
        documentId: result.documentId,
        content: result.content,
        model: result.model,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof PublicAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getPlanLimit(tenantId: string): Promise<number | null> {
  try {
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1)
      .then((r) => r[0]);

    if (!sub) return null;
    const plan = getPlan(sub.plan);
    return plan?.docsLimit ?? null;
  } catch {
    return null;
  }
}