/**
 * Tests for document export utilities.
 *
 * Covers payslip CSV, P45 CSV, generic CSV, JSON export,
 * and the payroll field extraction logic.
 */

import {
  generatePayslipCsv,
  generateP45Csv,
  generateGenericCsv,
  generateJsonExport,
  generateOrderedPayrollCsv,
} from "@/lib/documents/export";

describe("generatePayslipCsv", () => {
  const sampleOutput = {
    employee_details: JSON.stringify({
      employee_name: "Jane Smith",
      employee_number: "EMP-001",
    }),
    pay_summary: JSON.stringify({
      gross_pay: "3500.00",
      net_pay: "2755.00",
      paye_deduction: "520.00",
      national_insurance: "225.00",
    }),
    period: "Monthly",
    tax_code: "1257L",
  };

  it("extracts payroll fields from payslip output data", () => {
    const { csv, filename } = generatePayslipCsv("April Payslip", sampleOutput);

    expect(csv).toContain("employee_name");
    expect(csv).toContain("gross_pay");
    expect(csv).toContain("net_pay");
    expect(csv).toContain("Jane Smith");
    expect(csv).toContain("3500.00");
    expect(csv).toContain("2755.00");
    expect(filename).toContain("April_Payslip");
    expect(filename).toContain("payslip-data");
    expect(filename).toMatch(/\.csv$/);
  });

  it("includes input data fields that are not in output", () => {
    const { csv } = generatePayslipCsv("Test Payslip", {}, {
      employee_name: "John Doe",
      gross_pay: "4000",
    });

    expect(csv).toContain("John Doe");
    expect(csv).toContain("4000");
  });

  it("returns CSV header and at least one data row", () => {
    const { csv } = generatePayslipCsv("Test", sampleOutput);
    const lines = csv.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2); // header + row
    expect(lines[0]).toContain("employee_name");
  });
});

describe("generateP45Csv", () => {
  const sampleOutput = {
    employee_info: JSON.stringify({
      employee_name: "John Doe",
    }),
    leaving_details: JSON.stringify({
      leaving_date: "2026-05-15",
      tax_code: "1257L",
      week_month_number: "16",
      total_pay_to_date: "14000.00",
      total_tax_to_date: "2080.00",
    }),
  };

  it("extracts P45 fields from output data", () => {
    const { csv } = generateP45Csv("P45 - John Doe", sampleOutput);

    expect(csv).toContain("employee_name");
    expect(csv).toContain("leaving_date");
    expect(csv).toContain("tax_code");
    expect(csv).toContain("total_pay_to_date");
    expect(csv).toContain("John Doe");
    expect(csv).toContain("2026-05-15");
    expect(csv).toContain("14000.00");
  });
});

describe("generateOrderedPayrollCsv", () => {
  const payslipData = {
    employee_details: JSON.stringify({ employee_name: "Alice" }),
    pay_details: JSON.stringify({
      gross_pay: "3000",
      net_pay: "2400",
      paye_deduction: "400",
      national_insurance: "200",
    }),
  };

  it("uses payslip field ordering for payslips", () => {
    const { csv } = generateOrderedPayrollCsv("Test", "payslip", payslipData);
    const lines = csv.trim().split("\n");
    const header = lines[0];
    const grossIdx = header.split(",").indexOf("gross_pay");
    const netIdx = header.split(",").indexOf("net_pay");
    expect(grossIdx).toBeLessThan(netIdx); // gross before net
  });

  it("uses P45 field ordering for P45s", () => {
    const p45Data = {
      leaving_details: JSON.stringify({
        leaving_date: "2026-05-15",
        total_pay_to_date: "14000",
        total_tax_to_date: "2080",
      }),
    };
    const { csv } = generateOrderedPayrollCsv("Test", "p45", p45Data);
    expect(csv).toContain("leaving_date");
    expect(csv).toContain("total_pay_to_date");
    expect(csv).toContain("total_tax_to_date");
  });

  it("returns fallback message when no payroll data found", () => {
    const { csv } = generateOrderedPayrollCsv("Test", "payslip", { unrelated_field: "value" });
    expect(csv).toContain("No payroll data");
  });
});

describe("generateGenericCsv", () => {
  it("generates key-value CSV from flat output data", () => {
    const data = {
      section_1: "Content for section 1",
      section_2: JSON.stringify({ nested_key: "nested value" }),
    };
    const { csv, filename } = generateGenericCsv("My Contract", "employment_contract", data);
    expect(csv).toContain("section_1");
    expect(csv).toContain("Content for section 1");
    expect(csv).toContain("nested_key");
    expect(filename).toContain("My_Contract");
  });

  it("returns empty CSV with filename when no data", () => {
    const { csv, filename } = generateGenericCsv("Empty Doc", "nda", {});
    expect(csv).toBe("");
    expect(filename).toContain("Empty_Doc");
  });
});

describe("generateJsonExport", () => {
  const now = new Date("2026-06-04");

  it("produces a complete JSON export with all fields", () => {
    const { json, filename } = generateJsonExport(
      "Employment Contract - Alice",
      "employment_contract",
      "generated",
      2,
      { employee_name: "Alice" },
      { clause_1: "Content" },
      "openai/gpt-4",
      now,
      now
    );

    const parsed = JSON.parse(json);
    expect(parsed.title).toBe("Employment Contract - Alice");
    expect(parsed.type).toBe("employment_contract");
    expect(parsed.status).toBe("generated");
    expect(parsed.version).toBe(2);
    expect(parsed.model).toBe("openai/gpt-4");
    expect(parsed.inputData).toEqual({ employee_name: "Alice" });
    expect(parsed.outputData).toEqual({ clause_1: "Content" });
    expect(filename).toMatch(/\.json$/);
  });

  it("handles null input/output data gracefully", () => {
    const { json } = generateJsonExport(
      "Test",
      "nda",
      "draft",
      1,
      null,
      null,
      null,
      now,
      now
    );
    const parsed = JSON.parse(json);
    expect(parsed.inputData).toBeNull();
    expect(parsed.outputData).toBeNull();
    expect(parsed.model).toBeNull();
  });
});

describe("CSV escaping", () => {
  it("handles commas and quotes in field values", () => {
    const data = {
      notes: 'Contains, commas, and "quotes"',
    };
    const { csv } = generateGenericCsv("Test", "custom", data);
    expect(csv).toContain('"Contains, commas, and ""quotes"""');
  });
});