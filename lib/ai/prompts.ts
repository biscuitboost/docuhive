/**
 * Template prompt strings for AI document generation.
 * Each template uses {{variable}} placeholders that are interpolated
 * with user-supplied values before being sent to the AI model.
 *
 * System context: UK employment law, Employment Rights Act (ERA) 2025 awareness.
 */

export const SYSTEM_PROMPT = `You are an AI assistant specialised in UK employment law document generation.
You have expert knowledge of:
- The Employment Rights Act 1996 and subsequent amendments
- The Employment Rights Act 2025 (ERA 2025) provisions
- UK statutory employment requirements
- HMRC payroll and tax regulations
- National Insurance contribution thresholds
- Pension auto-enrolment requirements
- GDPR and data protection requirements for employee records

Generate documents that are legally compliant, accurate, and tailored to the provided inputs.
Output valid JSON matching the requested structure.`;

export const TEMPLATES: Record<string, { system: string; prompt: string }> = {
  employment_contract: {
    system: SYSTEM_PROMPT,
    prompt: `Generate an employment contract with the following details:

Employee name: {{employee_name}}
Job title: {{job_title}}
Start date: {{start_date}}
Employment type: {{employment_type}}
Working hours: {{working_hours}} per week
Salary: £{{salary}} per {{salary_period}}
Holiday entitlement: {{holiday_entitlement}} days per year
Notice period: {{notice_period}}
Probation period: {{probation_period}}
Pension scheme: {{pension_scheme}}
Sick pay: {{sick_pay}}

Include standard clauses for:
- Duties and responsibilities
- Place of work
- Remuneration and benefits
- Hours of work
- Holiday entitlement
- Sick leave and pay
- Notice period
- Garden leave
- Confidentiality
- Intellectual property
- Restrictive covenants
- Disciplinary and grievance procedures
- Data protection
- Termination
- Entire agreement and governing law (England and Wales)

Output JSON with sections as keys and the clause text as values.`,
  },

  offer_letter: {
    system: SYSTEM_PROMPT,
    prompt: `Generate an offer letter with the following details:

Candidate name: {{candidate_name}}
Job title: {{job_title}}
Department: {{department}}
Start date: {{start_date}}
Salary: £{{salary}} per {{salary_period}}
Reporting to: {{reporting_to}}
Location: {{location}}
Offer expiry date: {{offer_expiry_date}}

Include:
- Offer of employment
- Key terms summary
- Conditional clauses (references, right to work checks)
- Start date and onboarding details
- Response instructions

Output JSON with sections as keys and text as values.`,
  },

  staff_handbook: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a comprehensive staff handbook for:

Company name: {{company_name}}
Company address: {{company_address}}
Industry: {{industry}}
Employee count: {{employee_count}}
Handbook effective date: {{effective_date}}

Include sections on:
1. Introduction and company values
2. Employment policies (equal opportunities, anti-harassment, data protection)
3. Working hours and remote work policy
4. Holiday and absence policy
5. Performance and conduct
6. Disciplinary and grievance procedures
7. Health and safety
8. IT and communications policy
9. Benefits and pension
10. Termination and resignation

Ensure compliance with UK employment law and ERA 2025.

Output JSON with section titles as keys and full section content as values.`,
  },

  payslip: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a payslip with the following details:

Employee name: {{employee_name}}
PAYE reference: {{paye_reference}}
NI number: {{ni_number}}
Pay period: {{pay_period}}
Tax code: {{tax_code}}

Gross pay: £{{gross_pay}}
Income Tax: £{{income_tax}}
National Insurance: {{ni_category}}
Employee NI: £{{employee_ni}}
Pension deduction: £{{pension_deduction}}
Net pay: £{{net_pay}}

Output JSON with fields: employee_details, pay_details (gross, deductions itemised, net), year_to_date_totals, and message.`,
  },

  p45: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a P45 form with the following details:

Employee name: {{employee_name}}
NI number: {{ni_number}}
Tax code: {{tax_code}}
Leaving date: {{leaving_date}}
Employer name: {{employer_name}}
PAYE reference: {{paye_reference}}

Pay to date: £{{pay_to_date}}
Tax to date: £{{tax_to_date}}
Student loan deductions: {{student_loan}}
Postgraduate loan deductions: {{postgraduate_loan}}

Part 1A - Employee leaving details
Part 1B - Employer details
Part 2 - Tax code and student loan info for new employer
Part 3 - Year-to-date earnings and tax details

Output JSON with section: p45_notes, employee: {name, ni_number, tax_code}, leaving: {date, pay_to_date, tax_to_date}, and messages for each part.`,
  },
};

/**
 * Builds the full prompt for a given document type by interpolating user inputs.
 */
export function buildPrompt(
  docType: string,
  userInputs: Record<string, string>
): { system: string; prompt: string } | null {
  const template = TEMPLATES[docType];
  if (!template) return null;

  let filled = template.prompt;
  for (const [key, value] of Object.entries(userInputs)) {
    filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return { system: template.system, prompt: filled };
}
