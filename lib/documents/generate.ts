import { z } from "zod";
import { generateDocument as aiGenerate } from "@/lib/ai/client";
import { getModelForDocType } from "@/lib/ai/models";
import { buildPrompt } from "@/lib/ai/prompts";
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
 * 4. Renders PDF via @react-pdf (placeholder)
 * 5. Uploads to blob storage (placeholder)
 * 6. Saves document record (placeholder)
 * 7. Returns download info
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
    userInputs: validated.userInputs,
    model,
  });

  // TODO: Render PDF via @react-pdf (see lib/documents/pdf.ts)
  // TODO: Upload PDF to blob storage
  // TODO: Save document record to database
  // TODO: Generate Word document (see lib/documents/word.ts)

  return {
    documentId: "", // placeholder
    content: aiResult.content,
    outputUrl: null, // placeholder
    model: aiResult.model,
  };
}
