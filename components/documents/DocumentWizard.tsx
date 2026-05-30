"use client";

import { useState } from "react";

type DocType = "employment_contract" | "offer_letter" | "staff_handbook" | "payslip" | "p45";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
}

const DOC_TYPES: { value: DocType; label: string; description: string; fields: FieldDef[] }[] = [
  {
    value: "employment_contract",
    label: "Employment Contract",
    description: "Full UK employment contract with ERA 2025 compliance",
    fields: [
      { key: "employee_name", label: "Employee full name", type: "text", required: true },
      { key: "job_title", label: "Job title", type: "text", required: true },
      { key: "start_date", label: "Start date", type: "text", required: true },
      { key: "employment_type", label: "Employment type", type: "select", required: true, options: [
        { value: "permanent", label: "Permanent" },
        { value: "fixed_term", label: "Fixed term" },
        { value: "zero_hours", label: "Zero hours" },
        { value: "part_time", label: "Part time" },
      ]},
      { key: "working_hours", label: "Working hours per week", type: "text", required: true },
      { key: "salary", label: "Annual salary (£)", type: "text", required: true },
      { key: "salary_period", label: "Salary period", type: "select", required: true, options: [
        { value: "year", label: "Per year" },
        { value: "month", label: "Per month" },
        { value: "hour", label: "Per hour" },
      ]},
      { key: "holiday_entitlement", label: "Holiday entitlement (days)", type: "text", required: true },
      { key: "notice_period", label: "Notice period", type: "text", required: true },
      { key: "probation_period", label: "Probation period", type: "text", required: true },
      { key: "pension_scheme", label: "Pension scheme", type: "text", required: true },
      { key: "sick_pay", label: "Sick pay arrangement", type: "text", required: true },
    ],
  },
  {
    value: "offer_letter",
    label: "Offer Letter",
    description: "Formal job offer letter with key terms",
    fields: [
      { key: "candidate_name", label: "Candidate name", type: "text", required: true },
      { key: "job_title", label: "Job title", type: "text", required: true },
      { key: "department", label: "Department", type: "text" },
      { key: "start_date", label: "Start date", type: "text", required: true },
      { key: "salary", label: "Salary (£)", type: "text", required: true },
      { key: "salary_period", label: "Salary period", type: "select", required: true, options: [
        { value: "year", label: "Per year" },
        { value: "month", label: "Per month" },
      ]},
      { key: "reporting_to", label: "Reporting to", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "offer_expiry_date", label: "Offer expiry date", type: "text", required: true },
    ],
  },
  {
    value: "staff_handbook",
    label: "Staff Handbook",
    description: "Comprehensive employee handbook",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "company_address", label: "Company address", type: "text", required: true },
      { key: "industry", label: "Industry", type: "text" },
      { key: "employee_count", label: "Number of employees", type: "text" },
      { key: "effective_date", label: "Effective date", type: "text", required: true },
    ],
  },
  {
    value: "payslip",
    label: "Payslip",
    description: "Employee payslip with tax and NI breakdown",
    fields: [
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "paye_reference", label: "PAYE reference", type: "text", required: true },
      { key: "ni_number", label: "NI number", type: "text", required: true },
      { key: "pay_period", label: "Pay period (e.g. April 2026)", type: "text", required: true },
      { key: "tax_code", label: "Tax code", type: "text", required: true },
      { key: "gross_pay", label: "Gross pay (£)", type: "text", required: true },
      { key: "income_tax", label: "Income tax deducted (£)", type: "text", required: true },
      { key: "ni_category", label: "NI category (A, B, C, etc.)", type: "text", required: true },
      { key: "employee_ni", label: "Employee NI (£)", type: "text", required: true },
      { key: "pension_deduction", label: "Pension deduction (£)", type: "text" },
      { key: "net_pay", label: "Net pay (£)", type: "text", required: true },
    ],
  },
  {
    value: "p45",
    label: "P45",
    description: "Leaving details for HMRC",
    fields: [
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "ni_number", label: "NI number", type: "text", required: true },
      { key: "tax_code", label: "Tax code", type: "text", required: true },
      { key: "leaving_date", label: "Leaving date", type: "text", required: true },
      { key: "employer_name", label: "Employer name", type: "text", required: true },
      { key: "paye_reference", label: "PAYE reference", type: "text", required: true },
      { key: "pay_to_date", label: "Pay to date (£)", type: "text", required: true },
      { key: "tax_to_date", label: "Tax to date (£)", type: "text", required: true },
      { key: "student_loan", label: "Student loan deductions? (yes/no)", type: "text" },
      { key: "postgraduate_loan", label: "Postgraduate loan deductions? (yes/no)", type: "text" },
    ],
  },
];

export default function DocumentWizard() {
  const [step, setStep] = useState<"select" | "form" | "result">("select");
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: string; url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docType = selectedType ? DOC_TYPES.find((d) => d.value === selectedType) : null;

  const handleGenerate = async () => {
    if (!selectedType || !docType) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "00000000-0000-0000-0000-000000000000", // Overridden server-side via Clerk auth
          docType: selectedType,
          title: docType.label,
          userInputs: formValues,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        <span className={step === "select" ? "font-semibold text-blue-600" : "text-gray-400"}>
          1. Select type
        </span>
        <span className="text-gray-300">→</span>
        <span className={step === "form" ? "font-semibold text-blue-600" : "text-gray-400"}>
          2. Fill details
        </span>
        <span className="text-gray-300">→</span>
        <span className={step === "result" ? "font-semibold text-blue-600" : "text-gray-400"}>
          3. Download
        </span>
      </div>

      {/* Step 1: Select document type */}
      {step === "select" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {DOC_TYPES.map((dt) => (
            <button
              key={dt.value}
              onClick={() => {
                setSelectedType(dt.value);
                setFormValues({});
                setStep("form");
              }}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-300 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">{dt.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{dt.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Fill form */}
      {step === "form" && docType && (
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">{docType.label}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {docType.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.type === "select" && field.options ? (
                  <select
                    value={formValues[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={formValues[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.label}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep("select")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Document"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-green-800">Document Generated</h2>
          <p className="mt-2 text-sm text-green-600">
            Your document has been created successfully.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            {result.id && (
              <>
                <a
                  href={`/api/documents/${result.id}/download`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Download PDF
                </a>
                <a
                  href={`/api/documents/${result.id}/download/word`}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-500"
                >
                  Download Word
                </a>
              </>
            )}
            <button
              onClick={() => {
                setSelectedType(null);
                setResult(null);
                setStep("select");
              }}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Create another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
