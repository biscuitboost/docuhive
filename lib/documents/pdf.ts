/**
 * PDF document templates using @react-pdf/renderer.
 * Each document type has a render function that produces a PDF buffer.
 */

// TODO: Import @react-pdf/renderer components once node_modules are installed
// import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export interface PdfRenderInput {
  title: string;
  sections: Record<string, string>;
}

/**
 * Renders an employment contract PDF from structured content.
 */
export async function renderEmploymentContractPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  // TODO: Implement PDF rendering with @react-pdf/renderer
  // const styles = StyleSheet.create({ ... });
  // const doc = (
  //   <Document>
  //     <Page size="A4" style={styles.page}>
  //       <Text style={styles.title}>{data.title}</Text>
  //       {Object.entries(data.sections).map(([key, text]) => (
  //         <View key={key}>
  //           <Text style={styles.heading}>{key}</Text>
  //           <Text style={styles.body}>{text}</Text>
  //         </View>
  //       ))}
  //     </Page>
  //   </Document>
  // );
  // return Buffer.from(await pdf(doc).toBlobAsBuffer());
  return Buffer.from(`PDF placeholder: ${data.title}`);
}

/**
 * Renders an offer letter PDF.
 */
export async function renderOfferLetterPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  // TODO: Implement offer letter PDF rendering
  return Buffer.from(`Offer Letter PDF placeholder: ${data.title}`);
}

/**
 * Renders a staff handbook PDF.
 */
export async function renderStaffHandbookPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  // TODO: Implement staff handbook PDF rendering
  return Buffer.from(`Staff Handbook PDF placeholder: ${data.title}`);
}

/**
 * Renders a payslip PDF.
 */
export async function renderPayslipPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  // TODO: Implement payslip PDF rendering
  return Buffer.from(`Payslip PDF placeholder: ${data.title}`);
}

/**
 * Renders a P45 PDF.
 */
export async function renderP45Pdf(
  data: PdfRenderInput
): Promise<Buffer> {
  // TODO: Implement P45 PDF rendering
  return Buffer.from(`P45 PDF placeholder: ${data.title}`);
}

/**
 * Map of doc type to render function.
 */
export const renderers: Record<
  string,
  (data: PdfRenderInput) => Promise<Buffer>
> = {
  employment_contract: renderEmploymentContractPdf,
  offer_letter: renderOfferLetterPdf,
  staff_handbook: renderStaffHandbookPdf,
  payslip: renderPayslipPdf,
  p45: renderP45Pdf,
};
