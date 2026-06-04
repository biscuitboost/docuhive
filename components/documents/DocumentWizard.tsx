"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowLeft, ArrowRight, Download, FileDown, Sparkles, BookmarkPlus, Save, Loader2, Trash2, History } from "lucide-react";
import { AVAILABLE_MODELS, getRecommendedModel } from "@/lib/ai/models";

type DocType = "employment_contract" | "offer_letter" | "staff_handbook" | "payslip" | "p45"
  | "job_description" | "nda" | "service_agreement" | "consultant_agreement"
  | "freelancer_contract" | "settlement_agreement" | "disciplinary_grievance_letters"
  | "flexible_working_request" | "gdpr_privacy_notice" | "data_processing_agreement"
  | "privacy_policy" | "terms_and_conditions" | "commercial_lease"
  | "director_service_agreement" | "shareholder_agreement"
  | "partnership_agreement" | "appraisal_form" | "risk_assessment"
  | "health_safety_policy" | "equal_opportunities_policy" | "maternity_paternity_leave_form";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date";
  options?: { value: string; label: string }[];
  required?: boolean;
}

const DOC_TYPES: { value: DocType; label: string; description: string; icon: string; category: string; fields: FieldDef[] }[] = [
  // ── PAYROLL ──
  {
    value: "employment_contract",
    label: "Employment Contract",
    description: "Full UK employment contract with ERA 2025 compliance",
    icon: "📋",
    category: "Employment",
    fields: [
      { key: "employer_name", label: "Employer/company name", type: "text", required: true },
      { key: "employee_name", label: "Employee full name", type: "text", required: true },
      { key: "job_title", label: "Job title", type: "text", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
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
    category: "Employment",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "candidate_name", label: "Candidate name", type: "text", required: true },
      { key: "job_title", label: "Job title", type: "text", required: true },
      { key: "department", label: "Department", type: "text" },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "salary", label: "Salary (£)", type: "text", required: true },
      { key: "salary_period", label: "Salary period", type: "select", required: true, options: [
        { value: "year", label: "Per year" },
        { value: "month", label: "Per month" },
      ]},
      { key: "reporting_to", label: "Reporting to", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "offer_expiry_date", label: "Offer expiry date", type: "date", required: true },
    ],
  },
  {
    value: "staff_handbook",
    label: "Staff Handbook",
    description: "Comprehensive employee handbook",
    icon: "📘",
    category: "Employment",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "company_address", label: "Company address", type: "text", required: true },
      { key: "industry", label: "Industry", type: "text" },
      { key: "employee_count", label: "Number of employees", type: "text" },
      { key: "effective_date", label: "Effective date", type: "date", required: true },
    ],
  },
  {
    value: "payslip",
    label: "Payslip",
    description: "Employee payslip with tax and NI breakdown",
    icon: "💰",
    category: "Payroll",
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
    category: "Payroll",
    fields: [
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "ni_number", label: "NI number", type: "text", required: true },
      { key: "tax_code", label: "Tax code", type: "text", required: true },
      { key: "leaving_date", label: "Leaving date", type: "date", required: true },
      { key: "employer_name", label: "Employer name", type: "text", required: true },
      { key: "paye_reference", label: "PAYE reference", type: "text", required: true },
      { key: "pay_to_date", label: "Pay to date (£)", type: "text", required: true },
      { key: "tax_to_date", label: "Tax to date (£)", type: "text", required: true },
      { key: "student_loan", label: "Student loan deductions? (yes/no)", type: "text" },
      { key: "postgraduate_loan", label: "Postgraduate loan deductions? (yes/no)", type: "text" },
    ],
  },

  // ── Employment / HR Templates ──
  {
    value: "job_description",
    label: "Job Description",
    description: "Professional job description with essential/desirable criteria",
    icon: "📋",
    category: "Employment",
    fields: [
      { key: "job_title", label: "Job title", type: "text", required: true },
      { key: "department", label: "Department", type: "text" },
      { key: "reports_to", label: "Reports to", type: "text" },
      { key: "location", label: "Location", type: "text", required: true },
      { key: "employment_type", label: "Employment type", type: "select", options: [
        { value: "permanent", label: "Permanent" },
        { value: "fixed_term", label: "Fixed term" },
        { value: "contract", label: "Contract" },
        { value: "part_time", label: "Part time" },
      ], required: true },
      { key: "salary_min", label: "Salary min (£)", type: "text", required: true },
      { key: "salary_max", label: "Salary max (£)", type: "text", required: true },
      { key: "salary_period", label: "Salary period", type: "select", options: [
        { value: "year", label: "Per year" },
        { value: "month", label: "Per month" },
      ]},
      { key: "closing_date", label: "Closing date", type: "date" },
    ],
  },
  {
    value: "nda",
    label: "Non-Disclosure Agreement",
    description: "Mutual NDA with UK compliant confidentiality clauses",
    icon: "🔒",
    category: "Contracts",
    fields: [
      { key: "disclosing_party", label: "Disclosing party name", type: "text", required: true },
      { key: "receiving_party", label: "Receiving party name", type: "text", required: true },
      { key: "purpose", label: "Purpose of disclosure", type: "textarea", required: true },
      { key: "effective_date", label: "Effective date", type: "date", required: true },
      { key: "confidentiality_period", label: "Confidentiality period (years)", type: "text", required: true },
    ],
  },
  {
    value: "service_agreement",
    label: "Service Agreement",
    description: "Independent contractor / service provider agreement",
    icon: "🤝",
    category: "Contracts",
    fields: [
      { key: "client_name", label: "Client name", type: "text", required: true },
      { key: "provider_name", label: "Service provider name", type: "text", required: true },
      { key: "provider_type", label: "Provider type", type: "select", options: [
        { value: "limited_company", label: "Limited company" },
        { value: "sole_trader", label: "Sole trader" },
      ], required: true },
      { key: "services_description", label: "Description of services", type: "textarea", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "term", label: "Term (months)", type: "text" },
      { key: "fee", label: "Fee (£)", type: "text", required: true },
      { key: "fee_period", label: "Fee period", type: "select", options: [
        { value: "hour", label: "Per hour" },
        { value: "day", label: "Per day" },
        { value: "month", label: "Per month" },
        { value: "project", label: "Per project" },
      ]},
      { key: "payment_terms", label: "Payment terms", type: "text" },
    ],
  },
  {
    value: "consultant_agreement",
    label: "Consultant Agreement",
    description: "Short-form consultancy agreement with IR35 clause",
    icon: "💼",
    category: "Contracts",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "consultant_name", label: "Consultant name", type: "text", required: true },
      { key: "consultant_type", label: "Consultant type", type: "select", options: [
        { value: "individual", label: "Individual" },
        { value: "limited_company", label: "Limited company" },
      ], required: true },
      { key: "scope_of_work", label: "Scope of work", type: "textarea", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "end_date", label: "End date", type: "date" },
      { key: "fee", label: "Fee (£)", type: "text", required: true },
      { key: "fee_period", label: "Fee period", type: "select", options: [
        { value: "day", label: "Per day" },
        { value: "hour", label: "Per hour" },
        { value: "project", label: "Per project" },
      ]},
      { key: "expenses", label: "Expenses arrangement", type: "text" },
      { key: "notice_period", label: "Notice period", type: "text" },
    ],
  },
  {
    value: "freelancer_contract",
    label: "Freelancer Contract",
    description: "Short-form contract for freelance engagements (outside IR35)",
    icon: "✏️",
    category: "Contracts",
    fields: [
      { key: "client_name", label: "Client name", type: "text", required: true },
      { key: "freelancer_name", label: "Freelancer name", type: "text", required: true },
      { key: "project_description", label: "Project description", type: "textarea", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "delivery_date", label: "Delivery date", type: "date" },
      { key: "fee", label: "Fee (£)", type: "text", required: true },
      { key: "payment_schedule", label: "Payment schedule", type: "text" },
      { key: "expenses", label: "Expenses covered", type: "text" },
    ],
  },
  {
    value: "settlement_agreement",
    label: "Settlement Agreement",
    description: "Formal exit agreement (formerly compromise agreement)",
    icon: "🤝",
    category: "Employment",
    fields: [
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "employer_name", label: "Employer name", type: "text", required: true },
      { key: "employer_address", label: "Employer registered address", type: "text", required: true },
      { key: "termination_reason", label: "Termination reason", type: "textarea", required: true },
      { key: "termination_date", label: "Termination date", type: "date", required: true },
      { key: "employment_length", label: "Employment length (years)", type: "text", required: true },
      { key: "notice_pay", label: "Notice pay (£)", type: "text", required: true },
      { key: "compensation_payment", label: "Compensation payment (£)", type: "text", required: true },
      { key: "settlement_date", label: "Settlement date", type: "date" },
    ],
  },
  {
    value: "disciplinary_grievance_letters",
    label: "Disciplinary & Grievance Letters",
    description: "ACAS-compliant letter templates for HR procedures",
    icon: "⚖️",
    category: "HR & Compliance",
    fields: [
      { key: "letter_type", label: "Letter type", type: "select", required: true, options: [
        { value: "disciplinary", label: "Disciplinary" },
        { value: "grievance", label: "Grievance" },
        { value: "appeal", label: "Appeal" },
      ]},
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "employee_role", label: "Employee role", type: "text", required: true },
      { key: "meeting_date", label: "Meeting date", type: "date" },
      { key: "issue_details", label: "Issue details", type: "textarea", required: true },
      { key: "outcome", label: "Outcome (if known)", type: "textarea" },
    ],
  },
  {
    value: "flexible_working_request",
    label: "Flexible Working Request",
    description: "Day-one right request form & employer decision (Flexible Working Act 2023)",
    icon: "🕐",
    category: "HR & Compliance",
    fields: [
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "employee_role", label: "Role", type: "text", required: true },
      { key: "requested_change", label: "Requested change (what do you want to change?)", type: "text", required: true },
      { key: "current_pattern", label: "Current working pattern", type: "text", required: true },
      { key: "proposed_pattern", label: "Proposed working pattern", type: "text", required: true },
      { key: "effective_date", label: "Proposed effective date", type: "date", required: true },
      { key: "reasons", label: "Reasons for request", type: "textarea" },
    ],
  },

  // ── Data Protection / Privacy ──
  {
    value: "gdpr_privacy_notice",
    label: "GDPR Privacy Notice",
    description: "Employee/worker privacy notice (UK GDPR compliant)",
    icon: "🛡️",
    category: "Data Protection",
    fields: [
      { key: "organisation_name", label: "Organisation name", type: "text", required: true },
      { key: "organisation_address", label: "Organisation registered address", type: "text", required: true },
      { key: "ico_number", label: "ICO registration number", type: "text", required: true },
      { key: "dpo_name", label: "Data Protection Officer name", type: "text" },
      { key: "dpo_email", label: "DPO email", type: "text" },
      { key: "effective_date", label: "Effective date", type: "date", required: true },
    ],
  },
  {
    value: "data_processing_agreement",
    label: "Data Processing Agreement",
    description: "Controller-processor DPA (Article 28 UK GDPR)",
    icon: "📝",
    category: "Data Protection",
    fields: [
      { key: "controller_name", label: "Controller name", type: "text", required: true },
      { key: "processor_name", label: "Processor name", type: "text", required: true },
      { key: "processing_purposes", label: "Processing purposes", type: "textarea", required: true },
      { key: "data_categories", label: "Data categories", type: "textarea", required: true },
      { key: "data_subject_types", label: "Data subject types", type: "textarea", required: true },
      { key: "processing_duration", label: "Duration of processing", type: "text", required: true },
      { key: "effective_date", label: "Effective date", type: "date" },
    ],
  },
  {
    value: "privacy_policy",
    label: "Privacy Policy (Business)",
    description: "Full business privacy policy (UK GDPR + PECR)",
    icon: "📜",
    category: "Data Protection",
    fields: [
      { key: "business_name", label: "Business name", type: "text", required: true },
      { key: "business_address", label: "Business address", type: "text", required: true },
      { key: "ico_number", label: "ICO registration number", type: "text" },
      { key: "website_url", label: "Website URL", type: "text", required: true },
      { key: "dpo_name", label: "Data Protection Officer name", type: "text" },
      { key: "dpo_email", label: "DPO email", type: "text" },
    ],
  },

  // ── Commercial / Business ──
  {
    value: "terms_and_conditions",
    label: "Terms & Conditions",
    description: "Business terms compliant with Consumer Rights Act 2015",
    icon: "📑",
    category: "Commercial",
    fields: [
      { key: "business_name", label: "Business name", type: "text", required: true },
      { key: "business_address", label: "Business address", type: "text", required: true },
      { key: "trading_name", label: "Trading name (if different)", type: "text" },
      { key: "company_number", label: "Company registration number", type: "text" },
      { key: "vat_number", label: "VAT number", type: "text" },
      { key: "website_url", label: "Website URL", type: "text", required: true },
      { key: "business_type", label: "Business type", type: "select", options: [
        { value: "products", label: "Products" },
        { value: "services", label: "Services" },
        { value: "both", label: "Both" },
      ]},
      { key: "contact_email", label: "Contact email", type: "text", required: true },
    ],
  },
  {
    value: "commercial_lease",
    label: "Commercial Lease",
    description: "Simplified FRI commercial lease template",
    icon: "🏢",
    category: "Commercial",
    fields: [
      { key: "landlord_name", label: "Landlord name", type: "text", required: true },
      { key: "tenant_name", label: "Tenant name", type: "text", required: true },
      { key: "premises_address", label: "Premises address", type: "text", required: true },
      { key: "property_description", label: "Property description", type: "text" },
      { key: "lease_term", label: "Lease term (years)", type: "text", required: true },
      { key: "annual_rent", label: "Annual rent (£)", type: "text", required: true },
      { key: "rent_review_frequency", label: "Rent review frequency (years)", type: "text" },
      { key: "rent_review_type", label: "Rent review type", type: "select", options: [
        { value: "open_market", label: "Open market" },
        { value: "rpi", label: "RPI-linked" },
      ]},
      { key: "deposit", label: "Deposit (£)", type: "text" },
      { key: "permitted_use", label: "Permitted use", type: "text", required: true },
      { key: "service_charge", label: "Service charge (£ per annum)", type: "text" },
    ],
  },
  {
    value: "director_service_agreement",
    label: "Director Service Agreement",
    description: "Service contract for company directors (Companies Act 2006)",
    icon: "👔",
    category: "Commercial",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "company_number", label: "Company number", type: "text" },
      { key: "director_name", label: "Director name", type: "text", required: true },
      { key: "director_title", label: "Director title", type: "text", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "salary", label: "Salary (£)", type: "text", required: true },
      { key: "salary_period", label: "Salary period", type: "select", options: [
        { value: "year", label: "Per year" },
        { value: "month", label: "Per month" },
      ]},
      { key: "benefits", label: "Benefits (e.g. car, health insurance)", type: "text" },
      { key: "pension_contribution", label: "Pension contribution (%)", type: "text" },
      { key: "notice_period_months", label: "Notice period (months)", type: "text", required: true },
      { key: "holiday_entitlement", label: "Holiday entitlement (days)", type: "text", required: true },
      { key: "bonus_arrangement", label: "Bonus arrangement", type: "text" },
      { key: "restrictive_covenant_months", label: "Restrictive covenant period (months)", type: "text" },
    ],
  },
  {
    value: "shareholder_agreement",
    label: "Shareholder Agreement",
    description: "Private limited company shareholder agreement",
    icon: "📊",
    category: "Commercial",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "company_number", label: "Company number", type: "text" },
      { key: "shareholders", label: "Shareholders (names, comma-separated)", type: "text", required: true },
      { key: "share_structure", label: "Share structure (e.g. 100 ordinary shares)", type: "text", required: true },
      { key: "directors", label: "Directors (names, comma-separated)", type: "text" },
      { key: "effective_date", label: "Effective date", type: "date", required: true },
    ],
  },

  // ── New Document Types ──
  {
    value: "partnership_agreement",
    label: "Partnership Agreement",
    description: "Partnership deed under the Partnership Act 1890",
    icon: "🤝",
    category: "Commercial",
    fields: [
      { key: "partnership_name", label: "Partnership name", type: "text", required: true },
      { key: "partners", label: "Partners (names, comma-separated)", type: "text", required: true },
      { key: "business_type", label: "Business type", type: "text", required: true },
      { key: "business_address", label: "Business address", type: "text", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "capital_contribution", label: "Capital contribution (each partner)", type: "text", required: true },
      { key: "profit_sharing_ratio", label: "Profit sharing ratio (e.g. 50:50)", type: "text", required: true },
      { key: "account_reference_date", label: "Account reference date", type: "text" },
    ],
  },
  {
    value: "appraisal_form",
    label: "Appraisal Form",
    description: "Employee performance review assessment form",
    icon: "📋",
    category: "HR & Compliance",
    fields: [
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "job_title", label: "Job title", type: "text", required: true },
      { key: "department", label: "Department", type: "text" },
      { key: "line_manager", label: "Line manager", type: "text", required: true },
      { key: "review_period_from", label: "Review period from", type: "date", required: true },
      { key: "review_period_to", label: "Review period to", type: "date", required: true },
      { key: "review_date", label: "Review date", type: "date", required: true },
    ],
  },
  {
    value: "risk_assessment",
    label: "Risk Assessment",
    description: "Workplace health and safety risk assessment form",
    icon: "⚠️",
    category: "HR & Compliance",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "assessment_location", label: "Assessment location", type: "text", required: true },
      { key: "assessor_name", label: "Assessor name", type: "text", required: true },
      { key: "assessment_date", label: "Assessment date", type: "date", required: true },
      { key: "review_date", label: "Review date", type: "date" },
      { key: "activity_description", label: "Activity/area being assessed", type: "textarea", required: true },
    ],
  },
  {
    value: "health_safety_policy",
    label: "Health & Safety Policy",
    description: "Comprehensive policy under Health and Safety at Work Act 1974",
    icon: "🛡️",
    category: "HR & Compliance",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "company_address", label: "Company address", type: "text", required: true },
      { key: "industry_sector", label: "Industry/sector", type: "text" },
      { key: "employee_count", label: "Number of employees", type: "text" },
      { key: "effective_date", label: "Effective date", type: "date", required: true },
      { key: "responsible_manager", label: "Senior manager responsible for H&S", type: "text", required: true },
      { key: "health_safety_advisor", label: "Health and safety advisor", type: "text" },
    ],
  },
  {
    value: "equal_opportunities_policy",
    label: "Equal Opportunities Policy",
    description: "Equality Act 2010 compliant equal opportunities policy",
    icon: "⚖️",
    category: "HR & Compliance",
    fields: [
      { key: "company_name", label: "Company name", type: "text", required: true },
      { key: "policy_owner", label: "Policy owner / monitoring officer", type: "text" },
      { key: "effective_date", label: "Effective date", type: "date", required: true },
      { key: "review_date", label: "Review date", type: "date" },
    ],
  },
  {
    value: "maternity_paternity_leave_form",
    label: "Maternity/Paternity Leave Form",
    description: "Leave notification form with statutory pay eligibility",
    icon: "👶",
    category: "HR & Compliance",
    fields: [
      { key: "employee_name", label: "Employee name", type: "text", required: true },
      { key: "employee_role", label: "Employee role", type: "text", required: true },
      { key: "leave_type", label: "Leave type", type: "select", required: true, options: [
        { value: "maternity", label: "Maternity" },
        { value: "paternity", label: "Paternity" },
        { value: "shared_parental", label: "Shared Parental" },
        { value: "adoption", label: "Adoption" },
      ]},
      { key: "ewc", label: "Expected week of childbirth / placement date", type: "date", required: true },
      { key: "actual_date", label: "Actual birth / placement date", type: "date" },
      { key: "partner_name", label: "Partner name (for shared parental)", type: "text" },
      { key: "partner_employer", label: "Partner employer", type: "text" },
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

export default function DocumentWizard({ initialType }: { initialType?: string }) {
  const [step, setStep] = useState<"select" | "form" | "generating" | "result">("select");
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: string; url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [savedTemplates, setSavedTemplates] = useState<{ id: string; name: string; formValues: Record<string, string> }[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [prefillSuggestions, setPrefillSuggestions] = useState<{ fieldKey: string; value: string; sourceType: string; sourceTitle: string }[]>([]);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillVisible, setPrefillVisible] = useState(true);

  // If initialType provided, skip straight to the form
  useEffect(() => {
    if (initialType && DOC_TYPES.some((d) => d.value === initialType)) {
      setSelectedType(initialType as DocType);
      setSelectedModel(getRecommendedModel(initialType as DocType));
      setStep("form");
    }
  }, [initialType]);

  // Pre-fill form values from org defaults
  useEffect(() => {
    if (step !== "form" || !selectedType) return;

    fetch("/api/tenants")
      .then((r) => r.json())
      .then((json) => {
        const d = json.defaults;
        if (!d) return;

        const prefill: Record<string, string> = {};
        const mapping: [string, string[]][] = [
          ["companyName", ["company_name", "employer_name", "business_name", "organisation_name", "controller_name"]],
          ["companyAddress", ["company_address", "business_address", "organisation_address", "employer_address"]],
          ["companyNumber", ["company_number"]],
          ["vatNumber", ["vat_number"]],
          ["defaultEmploymentType", ["employment_type"]],
          ["defaultSalaryPeriod", ["salary_period"]],
          ["defaultWorkingHours", ["working_hours"]],
          ["defaultNoticePeriod", ["notice_period"]],
          ["defaultProbationPeriod", ["probation_period"]],
          ["defaultPensionScheme", ["pension_scheme"]],
          ["defaultSickPay", ["sick_pay"]],
          ["defaultHolidayEntitlement", ["holiday_entitlement"]],
          ["defaultConfidentialityPeriod", ["confidentiality_period"]],
          ["icoRegistrationNumber", ["ico_number"]],
          ["dpoName", ["dpo_name"]],
          ["dpoEmail", ["dpo_email"]],
          ["defaultFeePeriod", ["fee_period"]],
          ["defaultPaymentTerms", ["payment_terms"]],
        ];

        for (const [defaultKey, fieldKeys] of mapping) {
          const val = d[defaultKey];
          if (val && typeof val === "string" && val.trim()) {
            for (const fk of fieldKeys) {
              // Only pre-fill if the field exists in the doc type's fields and isn't already set
              if (docType?.fields.some((f) => f.key === fk) && !formValues[fk]) {
                prefill[fk] = val.trim();
              }
            }
          }
        }

        if (Object.keys(prefill).length > 0) {
          setFormValues((prev) => ({ ...prev, ...prefill }));
        }
      })
      .catch(() => {
        // Silently fail — defaults are optional
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedType]);

  // Load saved templates for this doc type when entering form step
  useEffect(() => {
    if (step !== "form" || !selectedType) return;
    setTemplatesLoading(true);
    fetch(`/api/forms/templates?type=${selectedType}`)
      .then((r) => r.json())
      .then((json) => {
        setSavedTemplates(json.templates ?? []);
      })
      .catch(() => setSavedTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [step, selectedType]);

  // Smart Pre-fill: fetch suggestions from previous documents
  useEffect(() => {
    if (step !== "form" || !selectedType) return;
    setPrefillLoading(true);
    setPrefillVisible(true);

    fetch(`/api/documents/prefill?docType=${selectedType}`)
      .then((r) => r.json())
      .then((json) => {
        const suggestions = json.suggestions ?? [];
        setPrefillSuggestions(suggestions);

        // Auto-apply suggestions to empty fields
        if (suggestions.length > 0) {
          setFormValues((prev) => {
            const next = { ...prev };
            for (const s of suggestions) {
              if (!next[s.fieldKey] || !next[s.fieldKey].trim()) {
                next[s.fieldKey] = s.value;
              }
            }
            return next;
          });
        }
      })
      .catch(() => setPrefillSuggestions([]))
      .finally(() => setPrefillLoading(false));
  }, [step, selectedType]);

  const docType = selectedType ? DOC_TYPES.find((d) => d.value === selectedType) : null;

  const handleGenerate = async () => {
    if (!selectedType || !docType) return;
    setStep("generating");
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

  const handleLoadTemplate = (template: { id: string; name: string; formValues: Record<string, string> }) => {
    setFormValues((prev) => ({ ...prev, ...template.formValues }));
    setLoadSuccess(true);
    setTimeout(() => setLoadSuccess(false), 2500);
  };

  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim() || !selectedType) return;
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/forms/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveTemplateName.trim(), docType: selectedType, formValues }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      const json = await res.json();
      setSavedTemplates((prev) => [...prev, json.template]);
      setSaveDialogOpen(false);
      setSaveTemplateName("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
    try {
      const res = await fetch(`/api/forms/templates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete template");
    } finally {
      setDeletingTemplateId(null);
    }
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
            className="space-y-8"
          >
            {(() => {
              const categories = [...new Set(DOC_TYPES.map((d) => d.category))];
              return categories.map((cat) => (
                <div key={cat}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {DOC_TYPES.filter((d) => d.category === cat).map((dt) => (
                      <Link
                        key={dt.value}
                        href={`/documents/new/${dt.value}`}
                        className="group rounded-xl border bg-card p-5 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                      >
                        <span className="text-xl mb-1.5 block">{dt.icon}</span>
                        <h4 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200">{dt.label}</h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{dt.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ));
            })()}
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
              {/* Saved Templates Bar */}
              <AnimatePresence>
                {(savedTemplates.length > 0 || templatesLoading || loadSuccess) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 border-b border-border pb-5"
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <BookmarkPlus size={14} className="text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Saved Templates</span>
                    </div>
                    {loadSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 mb-2"
                      >
                        Template loaded &mdash; fields updated
                      </motion.p>
                    )}
                    {templatesLoading ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 size={12} className="animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Loading templates...</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {savedTemplates.map((tpl) => (
                          <div
                            key={tpl.id}
                            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                          >
                            <button
                              onClick={() => handleLoadTemplate(tpl)}
                              className="text-foreground hover:text-primary transition-colors truncate max-w-[140px]"
                              title={`Load "${tpl.name}"`}
                            >
                              {tpl.name}
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              disabled={deletingTemplateId === tpl.id}
                              className="text-muted-foreground/40 hover:text-red-500 transition-colors shrink-0"
                              title={`Delete "${tpl.name}"`}
                            >
                              {deletingTemplateId === tpl.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart Pre-fill Banner */}
              <AnimatePresence>
                {prefillSuggestions.length > 0 && prefillVisible && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                        <History size={13} />
                        Auto-filled {prefillSuggestions.length} field{prefillSuggestions.length > 1 ? "s" : ""} from previous documents
                      </div>
                      <button
                        onClick={() => setPrefillVisible(false)}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
                      >
                        <span className="text-xs">&times;</span>
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-blue-600/70 dark:text-blue-400/70 leading-relaxed">
                      Values extracted from your recent documents. Edit any field to override.
                    </p>
                  </motion.div>
                )}
                {prefillLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-5 flex items-center gap-2"
                  >
                    <Loader2 size={12} className="animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Checking previous documents for prefills...</span>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    ) : field.type === "textarea" ? (
                      <textarea
                        value={formValues[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.label}
                        rows={4}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none ring-0 focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                      />
                    ) : field.type === "date" ? (
                      <input
                        type="date"
                        value={formValues[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                      />
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
                  onClick={() => setStep("select")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent active:scale-[0.97] transition-all duration-150"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={Object.keys(formValues).length === 0}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                  title="Save current form values as a reusable template"
                >
                  <Save size={14} />
                  Save as Template
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

              {/* Save Template Modal */}
              <AnimatePresence>
                {saveDialogOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setSaveDialogOpen(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
                    >
                      <h3 className="text-sm font-semibold text-foreground">Save as Template</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Name this template to reuse these values the next time you create this document type.
                      </p>
                      <div className="mt-4">
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={saveTemplateName}
                          onChange={(e) => setSaveTemplateName(e.target.value)}
                          placeholder="e.g. My Company Ltd defaults"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveTemplate();
                            if (e.key === "Escape") setSaveDialogOpen(false);
                          }}
                        />
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <button
                          onClick={handleSaveTemplate}
                          disabled={savingTemplate || !saveTemplateName.trim()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingTemplate ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <BookmarkPlus size={14} />
                          )}
                          {savingTemplate ? "Saving..." : "Save Template"}
                        </button>
                        <button
                          onClick={() => setSaveDialogOpen(false)}
                          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
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