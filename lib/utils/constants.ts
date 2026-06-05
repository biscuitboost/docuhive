/**
 * Application-wide constants for DocuHive.
 *
 * ⚠️ RATES ARE FOR 2026/27 TAX YEAR (effective 6 April 2026).
 * The legislative monitor cron keeps these current — see /app/api/legislative/route.ts
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

  // ── New Document Types ──
  { value: "partnership_agreement", label: "Partnership Agreement" },
  { value: "appraisal_form", label: "Appraisal Form" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "health_safety_policy", label: "Health & Safety Policy" },
  { value: "equal_opportunities_policy", label: "Equal Opportunities Policy" },
  { value: "maternity_paternity_leave_form", label: "Maternity/Paternity Leave Form" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

// ── Plan Limits ──────────────────────────────────────────────────

export const PLAN_LIMITS = {
  essentials: { documentsPerMonth: 10, multiUser: false, teamMembers: 1 },
  pro: { documentsPerMonth: null as number | null, multiUser: false, teamMembers: 1 },
  team: { documentsPerMonth: null as number | null, multiUser: true, teamMembers: 10 },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

// ── UK Tax Constants (2026/27 tax year) ──────────────────────────
// All thresholds frozen at 2023/24 levels through to April 2028
// per Autumn Statement 2022. Dividend rates increased +2% from April 2026.

export const UK_TAX_RATES = {
  // Income Tax bands (England, Wales, NI — Scotland uses different bands)
  personalAllowance: 12570,
  basicRate: { threshold: 50270, rate: 0.2 },
  higherRate: { threshold: 125140, rate: 0.4 },
  additionalRate: { threshold: Infinity, rate: 0.45 },

  // Scotland Income Tax bands (2026/27)
  scotland: {
    starterRate: { threshold: 3967, rate: 0.19 },
    basicRate: { threshold: 16956, rate: 0.20 },
    intermediateRate: { threshold: 31092, rate: 0.21 },
    higherRate: { threshold: 62430, rate: 0.42 },
    advancedRate: { threshold: 125140, rate: 0.45 },
    topRate: { threshold: Infinity, rate: 0.48 },
  },

  // National Insurance (Class 1, employed) — 2026/27
  ni: {
    lowerEarningsLimit: { weekly: 129, monthly: 559, annual: 6708 },
    primaryThreshold: { weekly: 242, monthly: 1048, annual: 12570 },
    secondaryThreshold: { weekly: 96, monthly: 417, annual: 5000 },
    upperEarningsLimit: { weekly: 967, monthly: 4189, annual: 50270 },
    mainRate: 0.08,
    higherRate: 0.02,
    employerRate: 0.15,  // Increased from 13.8% in April 2025
  },

  // Pension auto-enrolment — 2026/27
  pension: {
    // Lower level of qualifying earnings
    qualifyingEarningsLower: { weekly: 120, monthly: 520, annual: 6240 },
    // Earnings trigger for auto-enrolment
    earningsTrigger: { weekly: 192, monthly: 833, annual: 10000 },
    // Upper level of qualifying earnings
    qualifyingEarningsUpper: { weekly: 967, monthly: 4189, annual: 50270 },
    minimumEmployerContribution: 0.03,
    minimumEmployeeContribution: 0.05,
    totalMinimumContribution: 0.08,
  },

  // Corporation Tax (Financial year 2026/27)
  corporationTax: {
    smallProfitsRate: 0.19,
    mainRate: 0.25,
    marginalReliefLowerLimit: 50000,
    marginalReliefUpperLimit: 250000,
    marginalReliefFraction: 3 / 200,
  },

  // Dividend Tax (2026/27 — basic and higher rates increased +2%)
  dividendTax: {
    allowance: 500,
    basicRate: 0.1075,      // Up from 8.75%
    higherRate: 0.3575,     // Up from 33.75%
    additionalRate: 0.3935, // Unchanged
  },

  // Statutory Payments (2026/27)
  statutoryPayments: {
    ssp: { weekly: 123.25 },                    // Day 1 payment from April 2026
    smp: { firstSixWeeksPercent: 0.9, remainingWeekly: 194.32 },
    spp: { weekly: 194.32 },
    sap: { weekly: 194.32 },
    shpp: { weekly: 194.32 },
    spbp: { weekly: 194.32 },
    // Statutory flat rate for comparison
    statutoryFlatRate: 194.32,
  },
} as const;

// ── Jurisdiction options ─────────────────────────────────────────

export const JURISDICTIONS = [
  { value: "england_wales", label: "England and Wales" },
  { value: "scotland", label: "Scotland" },
] as const;

export type Jurisdiction = (typeof JURISDICTIONS)[number]["value"];