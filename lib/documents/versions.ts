import { db } from "@/lib/db";
import { documentVersions } from "@/lib/db/schema";

export interface CreateVersionInput {
  documentId: string;
  version: number;
  outputData: Record<string, unknown>;
  inputData?: Record<string, unknown> | null;
  changeType: "initial" | "ai_edit" | "manual_edit" | "regenerate" | "restore";
  changeDescription?: string | null;
  changedBy?: string | null;
}

/**
 * Create a snapshot of a document's current state in the document_versions table.
 */
export async function createVersionSnapshot(input: CreateVersionInput) {
  const [version] = await db
    .insert(documentVersions)
    .values({
      documentId: input.documentId,
      version: input.version,
      outputData: input.outputData,
      inputData: input.inputData ?? null,
      changeType: input.changeType,
      changeDescription: input.changeDescription ?? null,
      changedBy: input.changedBy ?? null,
    })
    .returning({ id: documentVersions.id, version: documentVersions.version });
  return version;
}