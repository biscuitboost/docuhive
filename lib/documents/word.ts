/**
 * Word document generators using the docx library.
 * One generate function per document type.
 * Supports custom branding (header, footer, colour).
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

export interface WordRenderInput {
  title: string;
  sections: Record<string, string>;
  branding?: {
    logoUrl?: string | null;
    primaryColor?: string;
    documentFooter?: string | null;
    documentHeader?: string | null;
  };
}

function formatSectionKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

async function createWordDoc(
  data: WordRenderInput
): Promise<Buffer> {
  const sectionEntries = Object.entries(data.sections);
  const children: Paragraph[] = [];
  const b = data.branding;
  const primary = b?.primaryColor ? b.primaryColor.replace("#", "") : "1e3a5f";

  // Document header from branding
  if (b?.documentHeader) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: b.documentHeader,
            size: 16,
            color: "64748b",
            italics: true,
          }),
        ],
        spacing: { after: 300 },
        alignment: AlignmentType.CENTER,
      })
    );
  }

  // Title paragraph
  children.push(
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Separator
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "————————————————————",
          size: 20,
          color: "999999",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Body sections
  for (const [key, text] of sectionEntries) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: formatSectionKey(key),
            bold: true,
            size: 26,
            color: primary,
          }),
        ],
        spacing: { before: 300, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 22,
            font: "Calibri",
          }),
        ],
        spacing: { after: 200 },
        alignment: AlignmentType.BOTH,
      })
    );
  }

  // Signature block
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "\nSignatures",
          bold: true,
          size: 28,
          color: primary,
        }),
      ],
      spacing: { before: 600, after: 200 },
    })
  );
  children.push(
    new Paragraph({
      text: "This document shall take effect as a legally binding contract upon signature by both parties.",
      spacing: { after: 400 },
    })
  );

  // Signature lines
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      border: {
        bottom: {
          color: "000000",
          size: 1,
          space: 1,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Employee signature / Date: _______________",
          size: 20,
          color: "666666",
        }),
      ],
      spacing: { after: 300 },
    })
  );
  children.push(
    new Paragraph({
      border: {
        bottom: {
          color: "000000",
          size: 1,
          space: 1,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Employer signature / Date: _______________",
          size: 20,
          color: "666666",
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Document footer from branding
  if (b?.documentFooter) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: b.documentFooter,
            size: 16,
            color: "64748b",
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        border: {
          top: {
            color: "cbd5e1",
            size: 1,
            space: 8,
            style: BorderStyle.SINGLE,
          },
        },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateEmploymentContractWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateOfferLetterWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateStaffHandbookWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generatePayslipWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateP45Word(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateJobDescriptionWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateNdaWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateServiceAgreementWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateConsultantAgreementWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateFreelancerContractWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateSettlementAgreementWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateDisciplinaryGrievanceLettersWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateFlexibleWorkingRequestWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateGdprPrivacyNoticeWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateDataProcessingAgreementWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generatePrivacyPolicyWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateTermsAndConditionsWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateCommercialLeaseWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateDirectorServiceAgreementWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

export async function generateShareholderAgreementWord(
  data: WordRenderInput
): Promise<Buffer> {
  return createWordDoc(data);
}

/**
 * Map of doc type to Word generator function.
 */
export const generators: Record<
  string,
  (_input: WordRenderInput) => Promise<Buffer>
> = {
  employment_contract: generateEmploymentContractWord,
  offer_letter: generateOfferLetterWord,
  staff_handbook: generateStaffHandbookWord,
  payslip: generatePayslipWord,
  p45: generateP45Word,
  job_description: generateJobDescriptionWord,
  nda: generateNdaWord,
  service_agreement: generateServiceAgreementWord,
  consultant_agreement: generateConsultantAgreementWord,
  freelancer_contract: generateFreelancerContractWord,
  settlement_agreement: generateSettlementAgreementWord,
  disciplinary_grievance_letters: generateDisciplinaryGrievanceLettersWord,
  flexible_working_request: generateFlexibleWorkingRequestWord,
  gdpr_privacy_notice: generateGdprPrivacyNoticeWord,
  data_processing_agreement: generateDataProcessingAgreementWord,
  privacy_policy: generatePrivacyPolicyWord,
  terms_and_conditions: generateTermsAndConditionsWord,
  commercial_lease: generateCommercialLeaseWord,
  director_service_agreement: generateDirectorServiceAgreementWord,
  shareholder_agreement: generateShareholderAgreementWord,
};