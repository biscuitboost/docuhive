import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { renderers, PdfRenderInput } from "@/lib/documents/pdf";
import { loadBranding } from "@/lib/documents/branding";
import JSZip from "jszip";

/**
 * POST /api/documents/bulk/download
 *
 * Downloads multiple documents as a single ZIP file.
 * Body: { documentIds: string[] }
 * Returns: application/zip with all matching documents as PDFs.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();

    const body = await request.json().catch(() => ({}));
    const documentIds: string[] = body.documentIds as string[];

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "documentIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (documentIds.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 documents per bulk download" },
        { status: 400 }
      );
    }

    // Load all documents — tenant-isolated
    const docs = await db
      .select()
      .from(documents)
      .where(inArray(documents.id, documentIds));

    if (docs.length === 0) {
      return NextResponse.json({ error: "No documents found" }, { status: 404 });
    }

    // Tenant isolation — only include documents owned by this tenant
    const ownedDocs = docs.filter((d) => d.tenantId === tenantId);

    if (ownedDocs.length === 0) {
      return NextResponse.json({ error: "No documents found" }, { status: 404 });
    }

    // Load branding once for the tenant
    const branding = await loadBranding(tenantId);

    const zip = new JSZip();

    const errors: { id: string; title: string; error: string }[] = [];

    for (const doc of ownedDocs) {
      if (!doc.outputData || !doc.inputData) {
        errors.push({ id: doc.id, title: doc.title, error: "No generated content" });
        continue;
      }

      const renderFn = renderers[doc.type as keyof typeof renderers];
      if (!renderFn) {
        errors.push({ id: doc.id, title: doc.title, error: `No PDF renderer for type: ${doc.type}` });
        continue;
      }

      try {
        const inputData = doc.inputData as Record<string, string>;
        const pdfInput: PdfRenderInput = {
          title: doc.title,
          employeeName:
            inputData.employee_name || inputData.candidate_name || inputData.disclosing_party || inputData.tenant_name || inputData.client_name || "",
          jobTitle: inputData.job_title || inputData.employee_role || inputData.director_title || "",
          startDate: inputData.start_date || inputData.effective_date || inputData.settlement_date || "",
          partyOne:
            inputData.employee_name || inputData.disclosing_party ||
            inputData.client_name || inputData.company_name || inputData.landlord_name || inputData.controller_name ||
            inputData.business_name || inputData.organisation_name || "",
          partyTwo:
            inputData.receiving_party || inputData.provider_name || inputData.consultant_name ||
            inputData.freelancer_name || inputData.tenant_name || inputData.processor_name || inputData.director_name || "",
          effectiveDate: inputData.start_date || inputData.effective_date || inputData.settlement_date || inputData.lease_date || "",
          sections: doc.outputData as Record<string, string>,
          branding,
        };

        const pdfBuffer = await renderFn(pdfInput);
        const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        zip.file(filename, pdfBuffer as unknown as Buffer);
      } catch (e) {
        errors.push({
          id: doc.id,
          title: doc.title,
          error: e instanceof Error ? e.message : "PDF generation failed",
        });
      }
    }

    // Update all successfully zipped documents to 'downloaded' status
    const successIds = ownedDocs
      .filter((d) => !errors.some((e) => e.id === d.id))
      .map((d) => d.id);

    if (successIds.length > 0) {
      for (const id of successIds) {
        await db
          .update(documents)
          .set({ status: "downloaded", updatedAt: new Date() } as any)
          .where(eq(documents.id, id));
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="documents.zip"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Bulk download failed";
    console.error("Bulk download error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}