/**
 * Export utilities for DocuHive documents.
 *
 * Provides structured CSV export for payroll documents (payslip, p45)
 * and raw JSON export for any document type.
 */

/**
 * Known payroll-related field keys that we want to extract
 * for CSV export of payslip/P45 data.
 * These may appear in outputData section values as JSON-encoded objects
 * or as direct key-value pairs within a section.
 */
const PAYROLL_FIELDS = new Set([
  "employee_name",
  "employee_number",
  "employee_role",
  "pay_period",
  "period_ending",
  "gross_pay",
  "basic_pay",
  "overtime",
  "bonus",
  "commission",
  "tax_code",
  "taxable_pay",
  "paye_deduction",
  "national_insurance",
  "pension_deduction",
  "student_loan",
  "total_deductions",
  "net_pay",
  "employer_pension",
  "employer_ni",
  "employer_contributions",
  "leaving_date",
  "week_month_number",
  "total_pay_to_date",
  "total_tax_to_date",
  "previous_employer_ref",
]);

/**
 * Attempt to parse a value as JSON and return the parsed object.
 * Returns null if it's not valid JSON.
 */
function tryParseJson(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Flatten a nested Record into dot-notation key-value string pairs.
 * Recursively walks nested objects, parsing JSON strings along the way.
 */
function flattenRecord(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      // Try to parse as nested JSON
      const parsed = tryParseJson(value);
      if (parsed) {
        Object.assign(result, flattenRecord(parsed, prefixedKey));
      } else {
        result[prefixedKey] = value;
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      result[prefixedKey] = String(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenRecord(value as Record<string, unknown>, prefixedKey));
    } else if (Array.isArray(value)) {
      result[prefixedKey] = value.map((v) => String(v)).join("; ");
    }
  }

  return result;
}

/**
 * Extract a clean set of payroll-relevant key-value pairs from
 * document output data. Filters to known PAYROLL_FIELDS and
 * flattens any nested structures.
 */
function extractPayrollData(
  outputData: Record<string, unknown>
): Record<string, string> {
  const flat = flattenRecord(outputData);

  // Filter to known payroll fields plus any field matching common patterns
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(flat)) {
    // Strip prefixes like "employee_details.employee_name" -> "employee_name"
    const shortKey = key.includes(".") ? key.split(".").pop()! : key;
    if (PAYROLL_FIELDS.has(shortKey)) {
      result[shortKey] = value;
    }
  }

  return result;
}

/**
 * Get the union of all keys from a list of payroll records.
 */
function allPayrollKeys(records: Record<string, string>[]): string[] {
  const keySet = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      keySet.add(key);
    }
  }
  return Array.from(keySet).sort();
}

/**
 * Escape a CSV cell value, wrapping in quotes if it contains commas,
 * quotes, or newlines.
 */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert an array of records to CSV string.
 */
function recordsToCsv(records: Record<string, string>[]): string {
  if (records.length === 0) return "";
  const keys = allPayrollKeys(records);
  const header = keys.map(csvEscape).join(",");
  const rows = records.map((record) =>
    keys.map((key) => csvEscape(record[key] ?? "")).join(",")
  );
  return [header, ...rows].join("\n");
}

/**
 * Generate CSV export data for a payslip document.
 * Extracts payroll fields from outputData and returns CSV string + filename.
 */
export function generatePayslipCsv(
  title: string,
  outputData: Record<string, unknown>,
  inputData?: Record<string, unknown>
): { csv: string; filename: string } {
  const payrollData = extractPayrollData(outputData);

  // Also include key input fields not captured in output
  if (inputData) {
    for (const [key, value] of Object.entries(inputData)) {
      if (PAYROLL_FIELDS.has(key) && !payrollData[key]) {
        payrollData[key] = String(value);
      }
    }
  }

  const csv = recordsToCsv([payrollData]);
  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  return {
    csv,
    filename: `${safeTitle}-payslip-data.csv`,
  };
}

/**
 * Generate CSV export data for a P45 document.
 * Same approach as payslip — extracts payroll fields.
 */
export function generateP45Csv(
  title: string,
  outputData: Record<string, unknown>,
  inputData?: Record<string, unknown>
): { csv: string; filename: string } {
  const payrollData = extractPayrollData(outputData);

  if (inputData) {
    for (const [key, value] of Object.entries(inputData)) {
      if (PAYROLL_FIELDS.has(key) && !payrollData[key]) {
        payrollData[key] = String(value);
      }
    }
  }

  const csv = recordsToCsv([payrollData]);
  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  return {
    csv,
    filename: `${safeTitle}-p45-data.csv`,
  };
}

/**
 * Generate a generic CSV from document output data.
 * Flattens all content to key-value pairs.
 */
export function generateGenericCsv(
  title: string,
  docType: string,
  outputData: Record<string, unknown>
): { csv: string; filename: string } {
  const flat = flattenRecord(outputData);
  const entries = Object.entries(flat);
  if (entries.length === 0) {
    return { csv: "", filename: `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv` };
  }

  const header = "Section,Value\n";
  const rows = entries
    .map(([key, value]) => `${csvEscape(key)},${csvEscape(value)}`)
    .join("\n");

  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  return {
    csv: header + rows,
    filename: `${safeTitle}-${docType}.csv`,
  };
}

/**
 * Predefined field ordering for payslip CSV to ensure
 * the most important fields appear first.
 */
const PAYSLIP_FIELD_ORDER = [
  "employee_name",
  "employee_number",
  "pay_period",
  "period_ending",
  "gross_pay",
  "basic_pay",
  "overtime",
  "bonus",
  "commission",
  "tax_code",
  "taxable_pay",
  "paye_deduction",
  "national_insurance",
  "pension_deduction",
  "student_loan",
  "total_deductions",
  "net_pay",
  "employer_pension",
  "employer_ni",
  "employer_contributions",
];

/**
 * Predefined field ordering for P45 CSV.
 */
const P45_FIELD_ORDER = [
  "employee_name",
  "employee_number",
  "leaving_date",
  "tax_code",
  "week_month_number",
  "total_pay_to_date",
  "total_tax_to_date",
  "previous_employer_ref",
];

export function generateOrderedPayrollCsv(
  title: string,
  docType: string,
  outputData: Record<string, unknown>,
  inputData?: Record<string, unknown>
): { csv: string; filename: string } {
  const flat = extractPayrollData(outputData);

  if (inputData) {
    for (const [key, value] of Object.entries(inputData)) {
      if (PAYROLL_FIELDS.has(key) && !flat[key]) {
        flat[key] = String(value);
      }
    }
  }

  const fieldOrder = docType === "p45" ? P45_FIELD_ORDER : PAYSLIP_FIELD_ORDER;

  // Build CSV with field order, plus any extra fields alphabetically
  const orderedKeys = fieldOrder.filter((k) => k in flat);
  const extraKeys = Object.keys(flat)
    .filter((k) => !fieldOrder.includes(k))
    .sort();

  const allKeys = [...orderedKeys, ...extraKeys];
  if (allKeys.length === 0) {
    return {
      csv: "No payroll data available\n",
      filename: `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`,
    };
  }

  const header = allKeys.map(csvEscape).join(",");
  const row = allKeys.map((key) => csvEscape(flat[key] ?? "")).join(",");

  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  return {
    csv: `${header}\n${row}\n`,
    filename: `${safeTitle}-${docType}-data.csv`,
  };
}

/**
 * Generate a JSON export of the full document data.
 * Includes title, type, status, version, input data, output data, and metadata.
 */
export function generateJsonExport(
  title: string,
  docType: string,
  status: string,
  version: number,
  inputData: Record<string, unknown> | null,
  outputData: Record<string, unknown> | null,
  aiModel: string | null,
  createdAt: Date | string,
  updatedAt: Date | string
): { json: string; filename: string } {
  const exportObj = {
    title,
    type: docType,
    status,
    version,
    generatedAt: createdAt,
    updatedAt: updatedAt,
    model: aiModel,
    inputData,
    outputData,
  };

  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  return {
    json: JSON.stringify(exportObj, null, 2),
    filename: `${safeTitle}.json`,
  };
}