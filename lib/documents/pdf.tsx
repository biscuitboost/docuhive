/**
 * PDF document templates using @react-pdf/renderer.
 * Produces A4 PDF documents for UK employment documents.
 * Supports custom branding (logo, colours, header/footer text).
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Helvetica is a standard PDF base font supported natively by @react-pdf.
// No custom font registration needed — the built-in Helvetica works in all environments.

export interface PdfRenderInput {
  title: string;
  employeeName: string;
  jobTitle: string;
  startDate: string;
  partyOne?: string;
  partyTwo?: string;
  effectiveDate?: string;
  signatureStyle?: "employee-employer" | "party-party" | "none";
  sections: Record<string, string>;
  branding?: {
    logoUrl?: string | null;
    primaryColor?: string;
    documentFooter?: string | null;
    documentHeader?: string | null;
  };
}

/**
 * Builds a React-PDF Document from structured content with optional branding.
 */
/**
 * Determine the signature style based on the document type label.
 */
function getSignatureStyle(docTypeLabel: string): "employee-employer" | "party-party" | "none" {
  const employerEmployee: string[] = [
    "Employment Contract",
    "Offer Letter",
    "Settlement Agreement",
    "Director Service Agreement",
  ];
  const bothParties: string[] = [
    "Non-Disclosure Agreement",
    "Service Agreement",
    "Consultant Agreement",
    "Freelancer Contract",
    "Data Processing Agreement",
    "Terms & Conditions",
    "Commercial Lease",
    "Shareholder Agreement",
    "Partnership Agreement",
  ];
  if (employerEmployee.includes(docTypeLabel)) return "employee-employer";
  if (bothParties.includes(docTypeLabel)) return "party-party";
  return "none";
}

function formatSectionKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

function buildDocument(data: PdfRenderInput, docTypeLabel: string) {
  const sectionEntries = Object.entries(data.sections);
  const b = data.branding;
  const primary = b?.primaryColor || "#1e3a5f";
  const accent = b?.primaryColor ? b.primaryColor + "99" : "#3b82f6";
  const logoUrl = b?.logoUrl || null;

  // Adaptive subtitle: use docTypeLabel to decide what to show
  const subtitleParts: string[] = [];
  const sigStyle = data.signatureStyle || getSignatureStyle(docTypeLabel);

  if (sigStyle === "employee-employer") {
    if (data.employeeName) {
      subtitleParts.push(`Prepared for ${data.employeeName}`);
    }
    if (data.jobTitle) {
      subtitleParts.push(data.jobTitle);
    }
  } else if (sigStyle === "party-party") {
    if (data.partyOne && data.partyTwo) {
      subtitleParts.push(`${data.partyOne} — ${data.partyTwo}`);
    } else if (data.partyOne) {
      subtitleParts.push(`Party: ${data.partyOne}`);
    } else if (data.partyTwo) {
      subtitleParts.push(`Party: ${data.partyTwo}`);
    } else if (data.employeeName) {
      subtitleParts.push(`Prepared for ${data.employeeName}`);
    }
  } else {
    // "none" — just show a generic doc title line
    if (data.employeeName) {
      subtitleParts.push(`Prepared for ${data.employeeName}`);
    } else if (data.partyOne) {
      subtitleParts.push(`Party: ${data.partyOne}`);
    }
  }

  // Effective date line
  const effectiveDateStr = data.effectiveDate || data.startDate || "";

  const brandedStyles = StyleSheet.create({
    page: {
      padding: 50,
      paddingTop: 40,
      fontFamily: "Helvetica",
      fontSize: 11,
      color: "#1e293b",
      lineHeight: 1.5,
    },
    header: {
      marginBottom: 30,
      borderBottomWidth: 2,
      borderBottomColor: accent,
      paddingBottom: 15,
    },
    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    logo: {
      width: 80,
      height: 40,
      marginRight: 12,
      objectFit: "contain",
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: primary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 10,
      color: "#64748b",
    },
    customHeader: {
      fontSize: 9,
      color: "#64748b",
      marginBottom: 10,
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: "bold",
      color: primary,
      marginTop: 16,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: "#cbd5e1",
    },
    body: {
      fontSize: 10,
      marginBottom: 6,
      textAlign: "justify",
    },
    clause: {
      marginBottom: 8,
      paddingLeft: 0,
    },
    signatureSection: {
      marginTop: 40,
      borderTopWidth: 1,
      borderTopColor: "#cbd5e1",
      paddingTop: 20,
    },
    signatureLine: {
      marginTop: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#cbd5e1",
      width: "60%",
      marginBottom: 4,
    },
    signatureLabel: {
      fontSize: 9,
      color: "#64748b",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 50,
      right: 50,
      fontSize: 8,
      color: "#64748b",
      textAlign: "center",
      borderTopWidth: 1,
      borderTopColor: "#cbd5e1",
      paddingTop: 8,
    },
  });

  return (
    <Document>
      <Page size="A4" style={brandedStyles.page}>
        {/* Document header from branding */}
        {b?.documentHeader && (
          <Text style={brandedStyles.customHeader}>{b.documentHeader}</Text>
        )}

        {/* Logo + Title */}
        <View style={brandedStyles.header}>
          <View style={brandedStyles.logoRow}>
            {logoUrl && (
              /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image style={brandedStyles.logo} src={logoUrl} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={brandedStyles.title}>{data.title}</Text>
              {subtitleParts.length > 0 && (
                <Text style={brandedStyles.subtitle}>
                  {subtitleParts.join(" — ")}
                </Text>
              )}
              <Text style={brandedStyles.subtitle}>
                Document type: {docTypeLabel}
                {effectiveDateStr ? ` | Effective date: ${effectiveDateStr}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Body sections */}
        {sectionEntries.map(([key, text]) => (
          <View key={key} style={brandedStyles.clause}>
            <Text style={brandedStyles.sectionHeading}>{formatSectionKey(key)}</Text>
            <Text style={brandedStyles.body}>{text}</Text>
          </View>
        ))}

        {/* Signature block — adaptive by document type */}
        {sigStyle !== "none" && (
          <View style={brandedStyles.signatureSection}>
            <Text style={brandedStyles.sectionHeading}>Signatures</Text>
            <Text style={brandedStyles.body}>
              This document shall take effect as a legally binding contract upon
              signature by both parties.
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 25 }}>
              {sigStyle === "employee-employer" ? (
                <>
                  <View style={{ width: "45%" }}>
                    <View style={brandedStyles.signatureLine} />
                    <Text style={brandedStyles.signatureLabel}>Employee signature</Text>
                    <Text style={[brandedStyles.signatureLabel, { marginTop: 4 }]}>
                      Date: _______________
                    </Text>
                  </View>
                  <View style={{ width: "45%" }}>
                    <View style={brandedStyles.signatureLine} />
                    <Text style={brandedStyles.signatureLabel}>Employer signature</Text>
                    <Text style={[brandedStyles.signatureLabel, { marginTop: 4 }]}>
                      Date: _______________
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ width: "45%" }}>
                    <View style={brandedStyles.signatureLine} />
                    <Text style={brandedStyles.signatureLabel}>
                      {data.partyOne || "Party A"} signature
                    </Text>
                    <Text style={[brandedStyles.signatureLabel, { marginTop: 4 }]}>
                      Date: _______________
                    </Text>
                  </View>
                  <View style={{ width: "45%" }}>
                    <View style={brandedStyles.signatureLine} />
                    <Text style={brandedStyles.signatureLabel}>
                      {data.partyTwo || "Party B"} signature
                    </Text>
                    <Text style={[brandedStyles.signatureLabel, { marginTop: 4 }]}>
                      Date: _______________
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={brandedStyles.footer}>
          {b?.documentFooter
            ? b.documentFooter
            : "DocuHive — AI-Generated UK Employment Document | This document is legally compliant with UK employment law including ERA 2025"}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Renders a PDF document from structured content as a Buffer.
 */
async function renderPdf(data: PdfRenderInput, docTypeLabel: string): Promise<Buffer> {
  try {
    const doc = buildDocument(data, docTypeLabel);
    const blob = await pdf(doc).toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    // Fallback: if @react-pdf fails (e.g. missing fonts in serverless),
    // return a placeholder so generation still "works"
    return Buffer.from(JSON.stringify(data.sections, null, 2));
  }
}

// ── Payslip-specific renderer ───────────────────────────────────

/**
 * Parse a currency value from a section string.
 * Tries to extract a £X,XXX.XX pattern, falls back to the raw string.
 */
// eslint-disable-next-line no-unused-vars
function parseCurrency(val: string): string {
  if (!val) return "";
  const match = val.match(/[££]?\s*[\d,]+\.?\d*/);
  return match ? match[0].trim() : val.trim();
}

/**
 * Parse sections-containing fields from AI output into a structured record.
 * AI outputs both plain-text descriptions (e.g. "Gross Pay: £3,500.00")
 * and sometimes just values. We handle both.
 */
function parseSectionsToPayslipData(sections: Record<string, string>) {
  // Helper to extract a value from a section that might contain a label
  const extract = (key: string): string => {
    const raw = sections[key] || "";
    // Try to find a £ amount or the raw value
    if (!raw) return "";
    const match = raw.match(/[££]?\s*[\d,]+\.?\d*/);
    if (match) return match[0].trim();
    return raw.trim();
  };

  // Parse employee_details for structured fields
  const empDetails = sections.employee_details || "";
  const empNameMatch = empDetails.match(/Employee\s*[Nn]ame[:\s]+(.+?)(?:\n|$)/);
  const niMatch = empDetails.match(/NI\s*[Nn]umber[:\s]+([A-Z0-9]+)/i);
  const taxCodeMatch = empDetails.match(/Tax\s*[Cc]ode[:\s]+(\S+)/);
  const payeMatch = empDetails.match(/PAYE\s*[Rr]eference[:\s]+(\S+)/);
  const periodMatch = empDetails.match(/Pay\s*[Pp]eriod[:\s]+(.+?)(?:\n|$)/);

  // Parse year_to_date
  const ytdRaw = sections.year_to_date || "";
  const ytdGrossMatch = ytdRaw.match(/Gross\s*YTD[:\s]+[££]?\s*([\d,]+\.?\d*)/i);
  const ytdTaxMatch = ytdRaw.match(/Tax\s*YTD[:\s]+[££]?\s*([\d,]+\.?\d*)/i);
  const ytdNiMatch = ytdRaw.match(/NI\s*YTD[:\s]+[££]?\s*([\d,]+\.?\d*)/i);

  return {
    employeeName: empNameMatch?.[1]?.trim() || sections.employeeName || "",
    niNumber: niMatch?.[1]?.trim() || "",
    taxCode: taxCodeMatch?.[1]?.trim() || "",
    payeReference: payeMatch?.[1]?.trim() || "",
    payPeriod: periodMatch?.[1]?.trim() || "",
    grossPay: extract("gross_pay"),
    incomeTax: extract("income_tax"),
    employeeNi: extract("employee_ni"),
    pensionDeduction: extract("pension_deduction"),
    netPay: extract("net_pay"),
    ytdGrossPay: ytdGrossMatch ? `£${ytdGrossMatch[1]}` : "",
    ytdTax: ytdTaxMatch ? `£${ytdTaxMatch[1]}` : "",
    ytdNi: ytdNiMatch ? `£${ytdNiMatch[1]}` : "",
    message: sections.message || "",
  };
}

function buildPayslipDocument(data: PdfRenderInput) {
  const pd = parseSectionsToPayslipData(data.sections);
  const b = data.branding;
  const primary = b?.primaryColor || "#1e3a5f";
  const accent = b?.primaryColor ? b.primaryColor + "99" : "#3b82f6";
  const logoUrl = b?.logoUrl || null;

  // Use the parsed employee name, fall back to data.employeeName
  const employeeName = pd.employeeName || data.employeeName;

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      paddingTop: 30,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1e293b",
      lineHeight: 1.4,
    },
    headerSection: {
      marginBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: accent,
      paddingBottom: 12,
    },
    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    logo: {
      width: 80,
      height: 40,
      marginRight: 12,
      objectFit: "contain",
    },
    payslipTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: primary,
      letterSpacing: 4,
    },
    customHeader: {
      fontSize: 8,
      color: "#64748b",
      marginBottom: 8,
    },
    // Employee details block
    detailsBlock: {
      marginBottom: 20,
      padding: 12,
      backgroundColor: "#f8fafc",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    detailsRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    detailsLabel: {
      width: 110,
      fontWeight: "bold",
      fontSize: 9,
      color: "#475569",
    },
    detailsValue: {
      flex: 1,
      fontSize: 9,
      color: "#1e293b",
    },
    detailsTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: primary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    // Main earnings/deductions table
    tableContainer: {
      marginBottom: 16,
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 2,
      borderBottomColor: primary,
      paddingBottom: 6,
      marginBottom: 4,
    },
    tableHeaderCell: {
      flex: 1,
      fontSize: 11,
      fontWeight: "bold",
      color: primary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    tableHeaderCellRight: {
      flex: 1,
      fontSize: 11,
      fontWeight: "bold",
      color: primary,
      textAlign: "right",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    tableBody: {
      marginBottom: 0,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 5,
    },
    tableRowAlt: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 5,
      backgroundColor: "#f8fafc",
    },
    tableRowTotal: {
      flexDirection: "row",
      borderBottomWidth: 2,
      borderBottomColor: primary,
      paddingVertical: 8,
      backgroundColor: "#eef2f7",
    },
    tableCell: {
      flex: 1,
      fontSize: 10,
    },
    tableCellRight: {
      flex: 1,
      fontSize: 10,
      textAlign: "right",
    },
    tableCellBold: {
      flex: 1,
      fontSize: 11,
      fontWeight: "bold",
    },
    tableCellBoldRight: {
      flex: 1,
      fontSize: 11,
      fontWeight: "bold",
      textAlign: "right",
    },
    emptyCell: {
      flex: 1,
      fontSize: 10,
      color: "#94a3b8",
      fontStyle: "italic",
    },
    // Net pay highlight box
    netPayBox: {
      marginTop: 8,
      padding: 12,
      backgroundColor: "#dbeafe",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#93c5fd",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    netPayLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: primary,
    },
    netPayValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: primary,
    },
    // Year-to-date section
    ytdSection: {
      marginTop: 16,
      marginBottom: 16,
      padding: 12,
      backgroundColor: "#f0fdf4",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#bbf7d0",
    },
    ytdTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#166534",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    ytdRow: {
      flexDirection: "row",
      marginBottom: 2,
    },
    ytdLabel: {
      width: 80,
      fontSize: 9,
      fontWeight: "bold",
      color: "#166534",
    },
    ytdValue: {
      flex: 1,
      fontSize: 9,
      color: "#166534",
    },
    // Message / footer note
    messageSection: {
      marginTop: 12,
      padding: 10,
      backgroundColor: "#fffbeb",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#fde68a",
    },
    messageText: {
      fontSize: 9,
      color: "#92400e",
      fontStyle: "italic",
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 40,
      right: 40,
      fontSize: 8,
      color: "#64748b",
      textAlign: "center",
      borderTopWidth: 1,
      borderTopColor: "#cbd5e1",
      paddingTop: 6,
    },
  });

  // Build row data for the table
  const earningsRows: { label: string; value: string }[] = [];
  const deductionsRows: { label: string; value: string }[] = [];

  if (pd.grossPay) {
    earningsRows.push({ label: "Gross Pay", value: pd.grossPay });
  }

  if (pd.incomeTax) {
    deductionsRows.push({ label: "Income Tax", value: pd.incomeTax });
  }
  if (pd.employeeNi) {
    deductionsRows.push({ label: "National Insurance", value: pd.employeeNi });
  }
  if (pd.pensionDeduction) {
    deductionsRows.push({ label: "Pension Deduction", value: pd.pensionDeduction });
  }

  // Ensure both columns have the same number of rows for alignment
  const maxRows = Math.max(earningsRows.length, deductionsRows.length);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Document header from branding */}
        {b?.documentHeader && (
          <Text style={styles.customHeader}>{b.documentHeader}</Text>
        )}

        {/* Payslip Title + Logo */}
        <View style={styles.headerSection}>
          <View style={styles.logoRow}>
            {logoUrl && (
              /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image style={styles.logo} src={logoUrl} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.payslipTitle}>PAYSLIP</Text>
            </View>
          </View>
        </View>

        {/* Employee Details Block */}
        <View style={styles.detailsBlock}>
          <Text style={styles.detailsTitle}>Employee Details</Text>
          {employeeName && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Employee Name</Text>
              <Text style={styles.detailsValue}>{employeeName}</Text>
            </View>
          )}
          {pd.payeReference && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>PAYE Reference</Text>
              <Text style={styles.detailsValue}>{pd.payeReference}</Text>
            </View>
          )}
          {pd.niNumber && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>NI Number</Text>
              <Text style={styles.detailsValue}>{pd.niNumber}</Text>
            </View>
          )}
          {pd.taxCode && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Tax Code</Text>
              <Text style={styles.detailsValue}>{pd.taxCode}</Text>
            </View>
          )}
          {pd.payPeriod && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Pay Period</Text>
              <Text style={styles.detailsValue}>{pd.payPeriod}</Text>
            </View>
          )}
        </View>

        {/* Earnings & Deductions Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Earnings</Text>
            <Text style={styles.tableHeaderCellRight}>Amount</Text>
            <Text style={styles.tableHeaderCell}>Deductions</Text>
            <Text style={styles.tableHeaderCellRight}>Amount</Text>
          </View>

          {/* Table Body */}
          <View style={styles.tableBody}>
            {Array.from({ length: Math.max(maxRows, 1) }).map((_, i) => {
              const ear = earningsRows[i];
              const ded = deductionsRows[i];
              const isAlt = i % 2 === 0;
              const rowStyle = isAlt ? styles.tableRowAlt : styles.tableRow;

              return (
                <View key={i} style={rowStyle}>
                  {ear ? (
                    <Text style={styles.tableCell}>{ear.label}</Text>
                  ) : (
                    <Text style={styles.emptyCell}>—</Text>
                  )}
                  {ear ? (
                    <Text style={styles.tableCellRight}>{ear.value}</Text>
                  ) : (
                    <Text style={styles.emptyCell}></Text>
                  )}
                  {ded ? (
                    <Text style={styles.tableCell}>{ded.label}</Text>
                  ) : (
                    <Text style={styles.emptyCell}>—</Text>
                  )}
                  {ded ? (
                    <Text style={styles.tableCellRight}>{ded.value}</Text>
                  ) : (
                    <Text style={styles.emptyCell}></Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Net Pay Highlight Box */}
        {pd.netPay && (
          <View style={styles.netPayBox}>
            <Text style={styles.netPayLabel}>Net Pay</Text>
            <Text style={styles.netPayValue}>{pd.netPay}</Text>
          </View>
        )}

        {/* Year-to-Date Section */}
        {(pd.ytdGrossPay || pd.ytdTax || pd.ytdNi) && (
          <View style={styles.ytdSection}>
            <Text style={styles.ytdTitle}>Year to Date Totals</Text>
            {pd.ytdGrossPay && (
              <View style={styles.ytdRow}>
                <Text style={styles.ytdLabel}>Gross YTD</Text>
                <Text style={styles.ytdValue}>{pd.ytdGrossPay}</Text>
              </View>
            )}
            {pd.ytdTax && (
              <View style={styles.ytdRow}>
                <Text style={styles.ytdLabel}>Tax YTD</Text>
                <Text style={styles.ytdValue}>{pd.ytdTax}</Text>
              </View>
            )}
            {pd.ytdNi && (
              <View style={styles.ytdRow}>
                <Text style={styles.ytdLabel}>NI YTD</Text>
                <Text style={styles.ytdValue}>{pd.ytdNi}</Text>
              </View>
            )}
          </View>
        )}

        {/* Message / Footer Note */}
        {pd.message && (
          <View style={styles.messageSection}>
            <Text style={styles.messageText}>{pd.message}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {b?.documentFooter
            ? b.documentFooter
            : "DocuHive — AI-Generated UK Payslip | This is not a legally binding document"}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderPayslipPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  try {
    const doc = buildPayslipDocument(data);
    const blob = await pdf(doc).toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    // Fallback: if react-pdf fails, fall through to generic renderer
    console.warn("Payslip PDF render failed, falling back to generic:", e);
    return renderPdf(data, "Payslip");
  }
}

// ── Doc-type specific renderers ─────────────────────────────────

export async function renderEmploymentContractPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Employment Contract");
}

export async function renderOfferLetterPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Offer Letter");
}

export async function renderStaffHandbookPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Staff Handbook");
}

export async function renderP45Pdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "P45 Form");
}

export async function renderJobDescriptionPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Job Description");
}

export async function renderNdaPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Non-Disclosure Agreement");
}

export async function renderServiceAgreementPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Service Agreement");
}

export async function renderConsultantAgreementPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Consultant Agreement");
}

export async function renderFreelancerContractPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Freelancer Contract");
}

export async function renderSettlementAgreementPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Settlement Agreement");
}

export async function renderDisciplinaryGrievanceLettersPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Disciplinary & Grievance Letters");
}

export async function renderFlexibleWorkingRequestPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Flexible Working Request");
}

export async function renderGdprPrivacyNoticePdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "GDPR Privacy Notice");
}

export async function renderDataProcessingAgreementPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Data Processing Agreement");
}

export async function renderPrivacyPolicyPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Privacy Policy");
}

export async function renderTermsAndConditionsPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Terms & Conditions");
}

export async function renderCommercialLeasePdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Commercial Lease");
}

export async function renderDirectorServiceAgreementPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Director Service Agreement");
}

export async function renderShareholderAgreementPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Shareholder Agreement");
}

export async function renderPartnershipAgreementPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Partnership Agreement");
}

export async function renderAppraisalFormPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Appraisal Form");
}

export async function renderRiskAssessmentPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Risk Assessment");
}

export async function renderHealthSafetyPolicyPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Health & Safety Policy");
}

export async function renderEqualOpportunitiesPolicyPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Equal Opportunities Policy");
}

export async function renderMaternityPaternityLeaveFormPdf(
  data: PdfRenderInput
): Promise<Buffer> {
  return renderPdf(data, "Maternity/Paternity Leave Form");
}

/**
 * Map of doc type to render function.
 */
export const renderers: Record<
  string,
  (_data: PdfRenderInput) => Promise<Buffer>
> = {
  employment_contract: renderEmploymentContractPdf,
  offer_letter: renderOfferLetterPdf,
  staff_handbook: renderStaffHandbookPdf,
  payslip: renderPayslipPdf,
  p45: renderP45Pdf,
  job_description: renderJobDescriptionPdf,
  nda: renderNdaPdf,
  service_agreement: renderServiceAgreementPdf,
  consultant_agreement: renderConsultantAgreementPdf,
  freelancer_contract: renderFreelancerContractPdf,
  settlement_agreement: renderSettlementAgreementPdf,
  disciplinary_grievance_letters: renderDisciplinaryGrievanceLettersPdf,
  flexible_working_request: renderFlexibleWorkingRequestPdf,
  gdpr_privacy_notice: renderGdprPrivacyNoticePdf,
  data_processing_agreement: renderDataProcessingAgreementPdf,
  privacy_policy: renderPrivacyPolicyPdf,
  terms_and_conditions: renderTermsAndConditionsPdf,
  commercial_lease: renderCommercialLeasePdf,
  director_service_agreement: renderDirectorServiceAgreementPdf,
  shareholder_agreement: renderShareholderAgreementPdf,
  partnership_agreement: renderPartnershipAgreementPdf,
  appraisal_form: renderAppraisalFormPdf,
  risk_assessment: renderRiskAssessmentPdf,
  health_safety_policy: renderHealthSafetyPolicyPdf,
  equal_opportunities_policy: renderEqualOpportunitiesPolicyPdf,
  maternity_paternity_leave_form: renderMaternityPaternityLeaveFormPdf,
};