/**
 * Word document generators using the docx library.
 * One generate function per document type.
 */

// TODO: Import docx types once node_modules are installed
// import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export interface WordRenderInput {
  title: string;
  sections: Record<string, string>;
}

async function createWordDoc(
  data: WordRenderInput
): Promise<Buffer> {
  // TODO: Implement Word document generation with docx library
  // const doc = new Document({
  //   title: data.title,
  //   sections: [{
  //     children: Object.entries(data.sections).flatMap(([key, text]) => [
  //       new Paragraph({
  //         text: key,
  //         heading: HeadingLevel.HEADING_1,
  //       }),
  //       new Paragraph({
  //         children: [new TextRun(text)],
  //       }),
  //     ]),
  //   }],
  // });
  // return Buffer.from(await Packer.toBuffer(doc));
  return Buffer.from(`Word doc placeholder: ${data.title}`);
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

/**
 * Map of doc type to Word generator function.
 */
export const generators: Record<
  string,
  (data: WordRenderInput) => Promise<Buffer>
> = {
  employment_contract: generateEmploymentContractWord,
  offer_letter: generateOfferLetterWord,
  staff_handbook: generateStaffHandbookWord,
  payslip: generatePayslipWord,
  p45: generateP45Word,
};
