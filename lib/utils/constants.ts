/**
 * Application-wide constants for DocuHive.
 */

// ── Document Types ────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  { value: "employment_contract", label: "Employment Contract" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "staff_handbook", label: "Staff Handbook" },
  { value: "payslip", label: "Payslip" },
  { value: "p45", label: "P45" },
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
    upperEarningsLimit: { weekly: 967, monthly: 4189, annual: 50270 },
    mainRate: 0.08,
    higherRate: 0.02,
  },

  // Pension
  pension: {
    autoEnrolmentThreshold: { weekly: 123, monthly: 533, annual: 6400 },
    minimumEmployerContribution: 0.03,
    minimumEmployeeContribution: 0.05,
    totalMinimumContribution: 0.08,
  },
} as const;
