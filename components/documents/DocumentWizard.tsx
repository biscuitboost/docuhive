"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, ArrowLeft, ArrowRight, Download, FileDown, Sparkles, FileText } from "lucide-react";

type DocType = "employment_contract" | "offer_letter" | "staff_handbook" | "payslip" | "p45";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
}

const DOC_TYPES: { value: DocType; label: string; description: string; icon: string; fields: FieldDef[] }[] = [
  {
    value: "employment_contract",
    label: "Employment Contract",
    description: "Full UK employment contract with ERA 2025 compliance",
    icon: "📋",
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
    icon: "✉️",
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
    icon: "📘",
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
    icon: "💰",
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
    icon: "📄",
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

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeIn" as const } },
};

/** Skeleton-style loading component for AI generation */
function GeneratingSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <motion.div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-7 w-7 text-primary" />
      </motion.div>
      <h3 className="mt-5 text-lg font-semibold text-card-foreground">Generating your document</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Analysing inputs, applying UK legislation, and formatting...
      </p>
      <div className="mt-8 mx-auto max-w-sm space-y-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-3 rounded-full bg-muted/80"
            initial={{ width: "40%" }}
            animate={{ width: ["40%", "85%", "60%", "90%", "45%"] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function DocumentWizard() {
  const [step, setStep] = useState<"select" | "form" | "generating" | "result">("select");
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: string; url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docType = selectedType ? DOC_TYPES.find((d) => d.value === selectedType) : null;

  const handleGenerate = async () => {
    if (!selectedType || !docType) return;
    setStep("generating");
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      setStep("form");
    } finally {
      setGenerating(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const currentStepIndex = ["select", "form", "generating", "result"].indexOf(step);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-0">
          {[
            { num: 1, label: "Select type", key: "select" },
            { num: 2, label: "Fill details", key: "form" },
            { num: 3, label: "Download", key: "result" },
          ].map((s, i) => {
            const isActive = currentStepIndex >= i;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      step === s.key
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                        : isActive
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStepIndex > i ? (
                      <Check size={14} />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-sm font-medium transition-colors duration-200 ${
                      step === s.key ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`mx-3 h-px w-12 sm:w-16 transition-colors duration-300 ${
                      currentStepIndex > i
                        ? "bg-primary/60"
                        : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Animated step content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Select document type */}
        {step === "select" && (
          <motion.div
            key="select"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid gap-4 sm:grid-cols-2"
          >
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.value}
                onClick={() => {
                  setSelectedType(dt.value);
                  setFormValues({});
                  setStep("form");
                }}
                className="group rounded-xl border bg-card p-6 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <span className="text-2xl mb-2 block">{dt.icon}</span>
                <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200">{dt.label}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{dt.description}</p>
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Fill form */}
        {step === "form" && docType && (
          <motion.div
            key="form"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-xl border bg-card shadow-sm"
          >
            <div className="border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{docType.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">{docType.label}</h2>
                  <p className="text-sm text-muted-foreground">{docType.description}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {docType.fields.map((field) => (
                  <div key={field.key} className={field.key === "company_address" || field.key === "sick_pay" ? "sm:col-span-2" : ""}>
                    <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                      {field.label}
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </label>
                    {field.type === "select" && field.options ? (
                      <select
                        value={formValues[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
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
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none ring-0 focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20"
                >
                  {error}
                </motion.div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep("select")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent active:scale-[0.97] transition-all duration-150"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150"
                >
                  <Sparkles size={14} />
                  Generate Document
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Generating state — polished loading skeleton */}
        {step === "generating" && (
          <motion.div
            key="generating"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <GeneratingSkeleton />
          </motion.div>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <motion.div
            key="result"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-8 text-center"
          >
            <motion.div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-300">Document Generated</h2>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              Your document has been created successfully.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {result.id && (
                <>
                  <a
                    href={`/api/documents/${result.id}/download`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
                  >
                    <Download size={16} />
                    Download PDF
                  </a>
                  <a
                    href={`/api/documents/${result.id}/download/word`}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-[0.97] transition-all duration-150"
                  >
                    <FileDown size={16} />
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
                className="rounded-lg border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent active:scale-[0.97] transition-all duration-150"
              >
                Create another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}