import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createVersionSnapshot } from "@/lib/documents/versions";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * POST /api/documents/:id/edit
 *
 * Applies an AI edit to a generated document.
 * Body: { instruction: string }
 * Response: { documentId: string, version: number, content: Record<string, unknown> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, clerkUserId } = await requireAuth();

    const body = await request.json().catch(() => ({}));
    const instruction: string | undefined = body.instruction;

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return NextResponse.json(
        { error: "Missing required field: instruction (string)" },
        { status: 400 }
      );
    }

    // Load current document with tenant isolation
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = result[0];

    if (doc.tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only allow editing generated/complete documents (not drafts or archived)
    if (doc.status === "draft" || doc.status === "archived") {
      return NextResponse.json(
        { error: "Only generated documents can be edited" },
        { status: 400 }
      );
    }

    if (!doc.outputData) {
      return NextResponse.json(
        { error: "Document has no generated content to edit" },
        { status: 400 }
      );
    }

    const model = doc.aiModel ?? "deepseek/deepseek-chat";

    // Build the editor prompt instructing the AI to return the full document
    const editPrompt = [
      `Current document content:\n${JSON.stringify(doc.outputData, null, 2)}`,
      "",
      `The user wants the following changes applied to the document.`,
      `Return the COMPLETE updated JSON document with the changes applied.`,
      `Preserve ALL existing content unless the user asks to change it.`,
      `The JSON structure must remain the same (same keys) — only modify values per the instruction.`,
      "",
      `Edit instruction: ${instruction.trim()}`,
    ].join("\n");

    // Call OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "DocuHive",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: editPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    let rawContent: string = data.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences (same brace-recovery as client.ts)
    rawContent = rawContent.trim();
    rawContent = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let updatedContent: Record<string, unknown>;

    try {
      updatedContent = JSON.parse(rawContent);
    } catch {
      const braceMatch = rawContent.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          updatedContent = JSON.parse(braceMatch[0]);
        } catch {
          throw new Error("AI returned invalid JSON — please try again");
        }
      } else {
        throw new Error("AI returned invalid JSON — please try again");
      }
    }

    // Snapshot current version before overwriting
    await createVersionSnapshot({
      documentId: doc.id,
      version: doc.version,
      outputData: doc.outputData as Record<string, unknown>,
      inputData: doc.inputData as Record<string, unknown> | undefined,
      changeType: "ai_edit",
      changeDescription: instruction.trim(),
      changedBy: clerkUserId,
    });

    // Update the document in the DB
    const newVersion = doc.version + 1;
    await db
      .update(documents)
      .set({
        outputData: updatedContent,
        version: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id));

    return NextResponse.json({
      documentId: doc.id,
      version: newVersion,
      content: updatedContent,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to edit document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}