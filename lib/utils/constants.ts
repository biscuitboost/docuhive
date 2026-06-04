/**
 * Application-wide constants for DocuHive.
 */

// ── Document Types ────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  // ── Original ──
  { value: "employment_contract", label: "Employment Contract" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "staff_handbook", label: "Staff Handbook" },
  { value: "payslip", label: "Payslip" },
  { value: "p45", label: "P45" },

  // ── Employment / HR ──
  { value: "job_description", label: "Job Description" },
  { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { value: "service_agreement", label: "Service Agreement" },
  { value: "consultant_agreement", label: "Consultant Agreement" },
  { value: "freelancer_contract", label: "Freelancer Contract" },
  { value: "settlement_agreement", label: "Settlement Agreement" },
  { value: "disciplinary_grievance_letters", label: "Disciplinary & Grievance Letters" },
  { value: "flexible_working_request", label: "Flexible Working Request" },

  // ── Data Protection / Privacy ──
  { value: "gdpr_privacy_notice", label: "GDPR Privacy Notice" },
  { value: "data_processing_agreement", label: "Data Processing Agreement" },
  { value: "privacy_policy", label: "Privacy Policy (Business)" },

  // ── Commercial / Business ──
  { value: "terms_and_conditions", label: "Terms & Conditions" },
  { value: "commercial_lease", label: "Commercial Lease" },
  { value: "director_service_agreement", label: "Director Service Agreement" },
  { value: "shareholder_agreement", label: "Shareholder Agreement" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

// ── Plan Limits ──────────────────────────────────────────────────

export const PLAN_LIMITS = {
  essentials: { documentsPerMonth: 10, multiUser: false, teamMembers: 1 },
  pro: { documentsPerMonth: null as number | null, multiUser: false, teamMembers: 1 },
  team: { documentsPerMonth: null as number | null, multiUser: true, teamMembers: 10 },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

// ── UK Tax Constants (2024/25 tax year) ──────────────────────────

export const UK_TAX_RATES = {
  // Income Tax bands (England, Wales, NI)
  personalAllowance: 12570,
  basicRate: { threshold: 50270, rate: 0.2 },
  higherRate: { threshold: 125140, rate: 0.4 },
  additionalRate: { threshold: Infinity, rate: 0.45 },

  // National Insurance (Class 1, employed)
  ni: {
    primaryThreshold: { weekly: 242, monthly: 1048, annual: 12570 },
    secondaryThreshold: { weekly: 175, monthly: 758, annual: 9100 },
    upperEarningsLimit: { weekly: 967, monthly: 4189, annual: 50270 },
    mainRate: 0.08,
    higherRate: 0.02,
    employerRate: 0.138,
  },

  // Pension
  pension: {
    autoEnrolmentThreshold: { weekly: 123, monthly: 533, annual: 6400 },
    minimumEmployerContribution: 0.03,
    minimumEmployeeContribution: 0.05,
    totalMinimumContribution: 0.08,
  },

  // Corporation Tax (2024/25)
  corporationTax: {
    smallProfitsRate: 0.19,
    mainRate: 0.25,
    marginalReliefLowerLimit: 50000,
    marginalReliefUpperLimit: 250000,
    marginalReliefFraction: 1 / 40,
  },

  // Dividend Tax (2024/25)
  dividendTax: {
    allowance: 500,
    basicRate: 0.0875,
    higherRate: 0.3375,
    additionalRate: 0.3935,
  },
} as const;
