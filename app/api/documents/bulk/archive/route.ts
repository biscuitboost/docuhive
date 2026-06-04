import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { createNotification } from "@/lib/documents/notifications";

/**
 * POST /api/documents/bulk/archive
 *
 * Archives or restores multiple documents at once.
 * Body: { documentIds: string[], action: "archive" | "restore" }
 * Response: { archived: number } | { restored: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();

    const body = await request.json().catch(() => ({}));
    const documentIds: string[] = body.documentIds as string[];
    const action: string = body.action as string || "archive";

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "documentIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (action !== "archive" && action !== "restore") {
      return NextResponse.json(
        { error: "action must be 'archive' or 'restore'" },
        { status: 400 }
      );
    }

    if (documentIds.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 documents per bulk operation" },
        { status: 400 }
      );
    }

    const newStatus = action === "archive" ? "archived" : "generated";

    // Load documents to verify tenant ownership
    const docs = await db
      .select({ id: documents.id, tenantId: documents.tenantId, title: documents.title })
      .from(documents)
      .where(inArray(documents.id, documentIds));

    const ownedIds = docs
      .filter((d) => d.tenantId === tenantId)
      .map((d) => d.id);

    if (ownedIds.length === 0) {
      return NextResponse.json({ error: "No documents found" }, { status: 404 });
    }

    // Update all matching documents
    await db
      .update(documents)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where(inArray(documents.id, ownedIds));

    // Create a single notification for the bulk action
    const actionLabel = action === "archive" ? "Archived" : "Restored";
    await createNotification(
      tenantId,
      action === "archive" ? "document_archived" : "document_restored",
      `Documents ${actionLabel}`,
      `${ownedIds.length} document${ownedIds.length > 1 ? "s" : ""} ${action === "archive" ? "archived" : "restored"}.`,
      "/documents"
    );

    return NextResponse.json({ success: true, [action === "archive" ? "archived" : "restored"]: ownedIds.length });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Bulk archive failed";
    console.error("Bulk archive error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}