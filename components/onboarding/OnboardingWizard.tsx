"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowRight, Download, FileDown, Sparkles, ArrowLeft, FileText, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { AVAILABLE_MODELS, getRecommendedModel } from "@/lib/ai/models";

type DocType = "employment_contract" | "offer_letter" | "staff_handbook" | "payslip" | "p45"
  | "job_description" | "nda" | "service_agreement" | "consultant_agreement"
  | "freelancer_contract" | "settlement_agreement" | "disciplinary_grievance_letters"
  | "flexible_working_request" | "gdpr_privacy_notice" | "data_processing_agreement"
  | "privacy_policy" | "terms_and_conditions" | "commercial_lease"
  | "director_service_agreement" | "shareholder_agreement";

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
      { key: "salary", label: "Annual salary (£)", type: "text", required: true },
      { key: "employment_type", label: "Employment type", type: "select", required: true, options: [
        { value: "permanent", label: "Permanent" },
        { value: "fixed_term", label: "Fixed term" },
        { value: "zero_hours", label: "Zero hours" },
        { value: "part_time", label: "Part time" },
      ]},
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
      { key: "salary", label: "Salary (£)", type: "text", required: true },
      { key: "start_date", label: "Start date", type: "text", required: true },
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
      { key: "pay_period", label: "Pay period", type: "text", required: true },
      { key: "gross_pay", label: "Gross pay (£)", type: "text", required: true },
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
      { key: "leaving_date", label: "Leaving date", type: "text", required: true },
      { key: "pay_to_date", label: "Pay to date (£)", type: "text", required: true },
    ],
  },
];

const stepVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.25, ease: "easeIn" as const } },
};

const STEPS = [
  { num: 1, label: "Welcome" },
  { num: 2, label: "Template" },
  { num: 3, label: "Generate" },
  { num: 4, label: "Done" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: string; url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const docType = selectedType ? DOC_TYPES.find((d) => d.value === selectedType) : null;

  const handleGenerate = async () => {
    if (!selectedType || !docType) return;
    setGenerating(true);
    setError(null);

    const model = selectedModel || getRecommendedModel(selectedType);

    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: selectedType,
          title: docType.label,
          userInputs: formValues,
          model,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const data = await res.json();
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const goToNextStep = () => {
    setStep((s) => Math.min(s + 1, 3));
  };

  const goToPrevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center">
      {/* Steps indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    step === i
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                      : step > i
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > i ? <Check size={14} /> : s.num}
                </div>
                <span
                  className={`hidden sm:inline text-sm font-medium transition-colors duration-200 ${
                    step === i ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-px w-12 sm:w-16 transition-colors duration-300 ${
                    step > i ? "bg-primary/60" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 0 && (
          <motion.div
            key="welcome"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-xl border bg-card p-8 sm:p-12 text-center shadow-sm"
          >
            <motion.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome to DocuHive! 🐝
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed max-w-md mx-auto">
              Generate UK employment documents in seconds — contracts, offer letters,
              staff handbooks, payslips and P45s. No solicitor. No HR suite. No headache.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={goToNextStep}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
              >
                Get Started
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select template type */}
        {step === 1 && (
          <motion.div
            key="select"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-foreground">Choose a document type</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Pick the template you want to generate
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  onClick={() => {
                    setSelectedType(dt.value);
                    setSelectedModel(getRecommendedModel(dt.value));
                    setFormValues({});
                    setStep(2);
                  }}
                  className="group rounded-xl border bg-card p-6 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                >
                  <span className="text-2xl mb-2 block">{dt.icon}</span>
                  <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200">
                    {dt.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {dt.description}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={goToPrevStep}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent active:scale-[0.97] transition-all duration-150"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Quick generate */}
        {step === 2 && docType && (
          <motion.div
            key="form"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-xl border bg-card shadow-sm"
          >
            {generating ? (
              <div className="p-8 text-center">
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
            ) : (
              <>
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
                      <div key={field.key}>
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

                  {/* AI Model Selector */}
                  <div className="mt-6 border-t border-border pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-card-foreground">AI Model</label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Choose the AI model to generate your document
                        </p>
                      </div>
                      <select
                        value={selectedModel || getRecommendedModel(selectedType!)}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-56 rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                      >
                        {AVAILABLE_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.provider})
                          </option>
                        ))}
                      </select>
                    </div>
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
                      onClick={() => setStep(1)}
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
              </>
            )}
          </motion.div>
        )}

        {/* Step 4: Done */}
        {step === 3 && result && (
          <motion.div
            key="done"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-8 sm:p-12 text-center shadow-sm"
          >
            <motion.div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-300">
              Document Generated! 🎉
            </h2>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              Your {docType?.label} has been created successfully. Download it below or view it in your dashboard.
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
                  setFormValues({});
                  setStep(1);
                }}
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent active:scale-[0.97] transition-all duration-150"
              >
                <FileText size={16} />
                Create another
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
