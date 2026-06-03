import { z } from "zod";
import { generateDocument as aiGenerate } from "@/lib/ai/client";
import { getModelForDocType } from "@/lib/ai/models";
import { buildPrompt } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { renderers, PdfRenderInput } from "@/lib/documents/pdf";
import { generators as wordGenerators, WordRenderInput } from "@/lib/documents/word";
import { createVersionSnapshot } from "@/lib/documents/versions";
import type { DocType } from "@/lib/ai/models";

/**
 * Zod schema for the document generation API input.
 */
export const GenerateDocumentInputSchema = z.object({
  tenantId: z.string().uuid(),
  docType: z.enum([
    "employment_contract",
    "offer_letter",
    "staff_handbook",
    "payslip",
    "p45",
    "custom",
  ]),
  title: z.string().min(1).max(255),
  userInputs: z.record(z.string(), z.string()),
  model: z.string().optional(),
  createdBy: z.string().optional(),
});

export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;

export interface GenerateDocumentResult {
  documentId: string;
  content: Record<string, unknown>;
  outputUrl: string | null;
  model: string;
}

/**
 * Orchestrates document generation:
 * 1. Validates input with Zod
 * 2. Builds AI prompt from template
 * 3. Calls OpenRouter AI client
 * 4. Renders PDF via @react-pdf
 * 5. Saves document record to DB
 * 6. Returns document info
 */
export async function generateDocument(
  input: GenerateDocumentInput
): Promise<GenerateDocumentResult> {
  const validated = GenerateDocumentInputSchema.parse(input);
  const docType = validated.docType as DocType;
  const model = validated.model ?? getModelForDocType(docType);

  // Build the prompt from templates
  const promptResult = buildPrompt(docType, validated.userInputs);
  if (!promptResult) {
    throw new Error(`No template found for document type: ${docType}`);
  }

  // Call the AI
  const aiResult = await aiGenerate({
    templatePrompt: promptResult.prompt,
    systemPrompt: promptResult.system,
    userInputs: validated.userInputs,
    model,
  });

  // Render PDF if we have a renderer for this doc type
  const renderFn = renderers[docType];
  if (renderFn && aiResult.content) {
    const pdfInput: PdfRenderInput = {
      title: validated.title,
      employeeName: validated.userInputs.employee_name || validated.userInputs.candidate_name || "",
      jobTitle: validated.userInputs.job_title || "",
      startDate: validated.userInputs.start_date || "",
      sections: aiResult.content as Record<string, string>,
    };
    try {
      await renderFn(pdfInput);
    } catch {
      // PDF render failed — non-fatal, we still have the AI content
      console.warn("PDF render failed, returning AI content only");
    }
  }

  // Render Word .docx if we have a generator for this doc type
  const wordFn = wordGenerators[docType];
  if (wordFn && aiResult.content) {
    const wordInput: WordRenderInput = {
      title: validated.title,
      sections: aiResult.content as Record<string, string>,
    };
    try {
      await wordFn(wordInput);
    } catch {
      console.warn("Word docx render failed, non-fatal");
    }
  }

  // Save document record to database with AI content persisted
  const content = aiResult.content;
  const [doc] = await db
    .insert(documents)
    .values({
      tenantId: validated.tenantId,
      type: docType as any,
      title: validated.title,
      status: "generated",
      inputData: validated.userInputs,
      outputData: content,
      aiModel: model,
      createdBy: validated.createdBy ?? null,
    })
    .returning({ id: documents.id });

  // Create initial version snapshot
  await createVersionSnapshot({
    documentId: doc.id,
    version: 1,
    outputData: content,
    inputData: validated.userInputs,
    changeType: "initial",
    changeDescription: "Document generated",
    changedBy: validated.createdBy ?? null,
  });

  return {
    documentId: doc.id,
    content: aiResult.content,
    outputUrl: null,
    model: aiResult.model,
  };
}
