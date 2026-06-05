/**
 * Template prompt strings for AI document generation.
 * Each template uses {{variable}} placeholders that are interpolated
 * with user-supplied values before being sent to the AI model.
 *
 * System context: UK employment law, Employment Rights Act (ERA) 2025 awareness.
 */

export const SYSTEM_PROMPT = `You are an AI assistant specialised in UK business and legal document generation.
You have expert knowledge of:
- UK employment law: The Employment Rights Act 1996, ERA 2025 provisions, ACAS Codes of Practice
- UK contract law: common law contract principles, IR35, Consumer Rights Act 2015
- UK data protection: UK GDPR, Data Protection Act 2018, PECR, ICO guidance
- UK company law: Companies Act 2006, director duties, shareholder rights
- UK commercial property law: Landlord and Tenant Act 1954, FRI lease principles
- HMRC payroll and tax regulations, National Insurance thresholds
- Pension auto-enrolment requirements
- The Equality Act 2010 and anti-discrimination law

Generate documents that are legally compliant, accurate, and tailored to the provided inputs.
Output valid JSON matching the requested structure.

For every document type, use correct UK statutory language and cite relevant legislation where appropriate.

You know the differences between English/Welsh law and Scots law. When jurisdiction is 'scotland', use Scots law terminology (e.g. 'pursuer' not 'claimant', 'Session' not 'High Court', sheriff court jurisdiction, Scottish property law principles). When jurisdiction is 'england_wales', use English law as currently described.`;

export const TEMPLATES: Record<string, { system: string; prompt: string }> = {
  employment_contract: {
    system: SYSTEM_PROMPT,
    prompt: `Generate an employment contract with the following details:

Employer/Company name: {{employer_name}}
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

Write in the first person plural ('We' = the employer, 'you' = the employee) throughout. Include the employer's name in the opening clause.

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
- Entire agreement and governing law ({{jurisdiction}})

Output JSON with FLAT key-value pairs — each key maps directly to text. Use descriptive keys like "header", "duties_and_responsibilities", "remuneration", etc. Each value must be a plain string, not a nested object.`,
  },

  offer_letter: {
    system: SYSTEM_PROMPT,
    prompt: `Generate an offer letter with the following details:

Company name: {{company_name}}
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

Output JSON with FLAT key-value pairs — each key should map directly to a string of text, no nesting. Use descriptive keys like "offer_opening", "key_terms", "conditional_clauses", "start_date_info", "response_instructions", "closing". Each value must be a plain string.`,
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

Output JSON with FLAT key-value pairs — keys like "introduction", "employment_policies", "working_hours", etc. Each value must be a plain string of text.`,
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

Format the payslip as a clean UK-style payslip with side-by-side earnings and deductions columns. Include the employee's full name, NI, tax code, PAYE reference at top. Show gross pay, tax, NI, pension, other deductions, and net pay. Include year-to-date totals for gross pay, tax paid, and NI paid.

Output FLAT JSON with keys like "employee_details", "gross_pay", "income_tax", "employee_ni", "pension_deduction", "net_pay", "year_to_date", "message". No nested objects.`,
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

Output FLAT JSON with keys like "employee_info", "employer_info", "leaving_details", "year_to_date_earnings", "notes". Each value must be a plain string.`,
  },

  // ── Employment / HR Templates ──

  job_description: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a professional UK job description with the following details:

Job title: {{job_title}}
Department: {{department}}
Reports to: {{reports_to}}
Location: {{location}}
Employment type: {{employment_type}}
Salary range: £{{salary_min}} - £{{salary_max}} per {{salary_period}}
Closing date: {{closing_date}}

Include sections:
1. About the company
2. Role overview
3. Key responsibilities
4. Person specification (essential and desirable criteria)
5. Benefits and perks
6. How to apply

Ensure compliance with the Equality Act 2010 — avoid any discriminatory language.

Output FLAT JSON with keys like "company_intro", "role_overview", "key_responsibilities", "person_spec", "benefits", "how_to_apply". Each value must be a plain string.`,
  },

  nda: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a mutual non-disclosure agreement (NDA) with the following details:

Disclosing party name: {{disclosing_party}}
Receiving party name: {{receiving_party}}
Purpose of disclosure: {{purpose}}
Effective date: {{effective_date}}
Confidentiality period (years): {{confidentiality_period}}

Include standard clauses:
1. Definition of confidential information
2. Obligations of receiving party
3. Permitted disclosures
4. Exclusions from confidential information
5. Term and termination
6. Return of materials
7. Remedies
8. Governing law ({{jurisdiction}})

Output FLAT JSON. Keys: "parties", "definitions", "obligations", "permitted_disclosures", "exclusions", "term", "return_of_materials", "remedies", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  service_agreement: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK service agreement (independent contractor) with the following details:

Client name: {{client_name}}
Service provider name: {{provider_name}}
Service provider type: {{provider_type}} (limited company / sole trader)
Services description: {{services_description}}
Start date: {{start_date}}
Term: {{term}} months
Fee: £{{fee}} {{fee_period}}
Payment terms: {{payment_terms}}

Include standard clauses:
1. Definitions and interpretation
2. Appointment and scope of services
3. Service provider's obligations
4. Client's obligations
5. Fees and payment
6. Intellectual property
7. Confidentiality
8. Liability and indemnity
9. Term and termination
10. IR35 status clause (outside IR35 where appropriate)
11. Dispute resolution
12. Governing law ({{jurisdiction}})

Output FLAT JSON. Keys: "parties", "definitions", "appointment", "provider_obligations", "client_obligations", "fees_and_payment", "intellectual_property", "confidentiality", "liability", "term_and_termination", "ir35_status", "dispute_resolution", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  consultant_agreement: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK consultant agreement with the following details:

Company name: {{company_name}}
Consultant name: {{consultant_name}}
Consultant type: {{consultant_type}} (individual / limited company)
Scope of work: {{scope_of_work}}
Start date: {{start_date}}
End date: {{end_date}}
Fee: £{{fee}} {{fee_period}}
Expenses: {{expenses}}
Notice period: {{notice_period}}

Include standard clauses:
1. Services and deliverables
2. Payment terms and expenses
3. Consultant status and IR35
4. Confidentiality
5. Intellectual property
6. Warranties
7. Limitation of liability
8. Termination
9. Dispute resolution
10. Governing law ({{jurisdiction}})

Output FLAT JSON. Keys: "parties", "services", "payment", "consultant_status", "confidentiality", "intellectual_property", "warranties", "liability", "termination", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  freelancer_contract: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK freelancer contract (short-form) with the following details:

Client: {{client_name}}
Freelancer: {{freelancer_name}}
Project description: {{project_description}}
Start date: {{start_date}}
Delivery date: {{delivery_date}}
Fee: £{{fee}}
Payment schedule: {{payment_schedule}}
Expenses covered: {{expenses}}

Include:
1. Project scope and deliverables
2. Payment terms
3. Freelancer status (outside IR35)
4. Confidentiality
5. Intellectual property
6. Termination
7. Governing law ({{jurisdiction}})

Output FLAT JSON. Keys: "project_scope", "payment_terms", "freelancer_status", "confidentiality", "intellectual_property", "termination", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  settlement_agreement: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK settlement agreement (formerly compromise agreement) with the following details:

Employee name: {{employee_name}}
Employer name: {{employer_name}}
Employer registered address: {{employer_address}}
Termination reason: {{termination_reason}}
Termination date: {{termination_date}}
Employment length: {{employment_length}} years
Notice pay: £{{notice_pay}}
Compensation payment: £{{compensation_payment}}
Settlement date: {{settlement_date}}

Include:
1. Recitals (background to termination)
2. Termination of employment
3. Payments (notice pay, compensation, any outstanding sums)
4. Legal costs contribution
5. Agreed reference wording
6. Waiver of claims (specifying statutory claims)
7. Confidentiality clause
8. Non-disparagement
9. Independent legal advice acknowledgment
10. Governing law ({{jurisdiction}})
11. Counterparts

IMPORTANT: Include the mandatory statement that the employee has received independent legal advice.

Output FLAT JSON. Keys: "parties", "recitals", "termination", "payments", "legal_costs", "agreed_reference", "waiver_of_claims", "confidentiality", "non_disparagement", "legal_advice", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  disciplinary_grievance_letters: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a set of disciplinary and grievance letter templates following the ACAS Code of Practice. Provide templates for:

Template type: {{letter_type}} (disciplinary / grievance / appeal)
Employee name: {{employee_name}}
Employee role: {{employee_role}}
Meeting date: {{meeting_date}}
Issue details: {{issue_details}}
Outcome: {{outcome}} (for outcome letters)

For DISCIPLINARY letters include:
1. Invitation to disciplinary meeting (with right to be accompanied)
2. Disciplinary outcome letter (warning level, improvement required)
3. Invitation to appeal meeting
4. Appeal outcome letter

For GRIEVANCE letters include:
1. Grievance acknowledgement
2. Invitation to grievance meeting
3. Grievance outcome
4. Appeal rights notification

For APPEAL letters include:
1. Appeal acknowledgement
2. Appeal hearing invitation
3. Appeal outcome

Ensure ACAS compliance, right to be accompanied, and equality act awareness.

Output FLAT JSON. Keys: "invitation_to_meeting", "right_to_be_accompanied", "meeting_details", "outcome_decision", "appeal_rights", "next_steps". Each value must be a plain string.`,
  },

  flexible_working_request: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a Flexible Working Request form and response letter compliant with the Flexible Working Act 2023 (day-one right).

Employee name: {{employee_name}}
Role: {{employee_role}}
Requested change: {{requested_change}}
Current pattern: {{current_pattern}}
Proposed pattern: {{proposed_pattern}}
Effective date: {{effective_date}}
Reasons for request: {{reasons}}

Include:
Part A — Employee request form:
1. Employee details
2. Current working pattern
3. Proposed working pattern
4. Effective date
5. Explanation of how the change would affect the business and how it could be managed

Part B — Employer decision letter:
1. Statutory decision date (2 months from receipt)
2. Outcome (approved / refused with statutory ground)
3. If refused, the specific statutory ground from s.80G(1)(b) ERA 1996
4. Appeal rights

The eight statutory grounds for refusal:
(a) Burden of additional costs
(b) Detrimental effect on ability to meet customer demand
(c) Inability to reorganise work among existing staff
(d) Inability to recruit additional staff
(e) Detrimental impact on quality
(f) Detrimental impact on performance
(g) Insufficiency of work during periods the employee proposes to work
(h) Planned structural changes

Output FLAT JSON. Keys: "employee_details", "current_pattern", "proposed_pattern", "employee_statement", "employer_decision", "statutory_grounds", "appeal_rights". Each value must be a plain string.`,
  },

  // ── Data Protection / Privacy ──

  gdpr_privacy_notice: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK GDPR-compliant employee/worker privacy notice with the following details:

Organisation name: {{organisation_name}}
Organisation registered address: {{organisation_address}}
ICO registration number: {{ico_number}}
DPO name: {{dpo_name}}
DPO email: {{dpo_email}}
Effective date: {{effective_date}}

Include sections:
1. Introduction — who we are
2. Data controller identity and contact details
3. Categories of personal data we collect
4. Sources of personal data
5. Purposes and lawful bases for processing
6. Special category data processing
7. Criminal records data
8. Automated decision-making
9. Data retention periods
10. Data sharing and recipients
11. International transfers
12. Data subject rights (full list: access, rectification, erasure, restriction, portability, objection, automated decisions)
13. How to make a complaint (ICO)
14. Changes to this notice

Compliance: UK GDPR, Data Protection Act 2018.

Output FLAT JSON. Keys: "introduction", "controller_identity", "data_categories", "data_sources", "purposes_and_bases", "special_category_data", "criminal_records", "automated_decisions", "retention", "data_sharing", "international_transfers", "data_subject_rights", "complaints", "changes". Each value must be a plain string.`,
  },

  data_processing_agreement: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK GDPR-compliant Data Processing Agreement (DPA) with the following details:

Controller name: {{controller_name}}
Processor name: {{processor_name}}
Processing purposes: {{processing_purposes}}
Data categories: {{data_categories}}
Data subject types: {{data_subject_types}}
Duration of processing: {{processing_duration}}
Effective date: {{effective_date}}

Include standard clauses:
1. Definitions and interpretation
2. Term and termination
3. Controller obligations
4. Processor obligations
5. Data processing details (schedule)
6. Sub-processing
7. Data subject rights
8. Personal data breach
9. Data protection impact assessment
10. International transfers
11. Audit rights
12. Deletion and return of data
13. Liability
14. Governing law ({{jurisdiction}})

Schedule: description of processing (categories of data subjects, categories of personal data, nature and purpose of processing, retention periods).

Compliance: Article 28 UK GDPR, Data Protection Act 2018.

Output FLAT JSON. Keys: "parties", "definitions", "term", "controller_obligations", "processor_obligations", "processing_details", "sub_processing", "data_subject_rights", "breach_notification", "dpia", "international_transfers", "audit", "deletion", "liability", "governing_law", "schedule". Each value must be a plain string.`,
  },

  privacy_policy: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a comprehensive UK GDPR-compliant Privacy Policy for a business with the following details:

Business name: {{business_name}}
Business address: {{business_address}}
ICO registration number: {{ico_number}}
Website URL: {{website_url}}
Data Protection Officer: {{dpo_name}}
DPO email: {{dpo_email}}

Include sections:
1. Who we are
2. What data we collect (from customers, website visitors, prospects)
3. How we collect data (direct collection, cookies, third parties)
4. How we use your data — purposes and lawful bases
5. Lawful bases for processing (consent, contract, legitimate interests, legal obligation)
6. Cookies and similar technologies
7. Who we share your data with
8. International transfers
9. How long we keep your data
10. Your rights (full list: access, rectification, erasure, restriction, portability, objection, automated decision-making)
11. How to exercise your rights
12. Complaints to the ICO
13. Changes to this policy

Compliance: UK GDPR, Data Protection Act 2018, Privacy and Electronic Communications Regulations (PECR).

Output FLAT JSON. Keys: "who_we_are", "data_collected", "collection_methods", "use_of_data", "lawful_bases", "cookies", "data_sharing", "international_transfers", "retention", "your_rights", "exercising_rights", "complaints", "changes". Each value must be a plain string.`,
  },

  // ── Commercial / Business ──

  terms_and_conditions: {
    system: SYSTEM_PROMPT,
    prompt: `Generate comprehensive Terms & Conditions for a UK business with the following details:

Business name: {{business_name}}
Business address: {{business_address}}
Trading name (if different): {{trading_name}}
Company registration number: {{company_number}}
VAT number: {{vat_number}}
Website URL: {{website_url}}
Business type: {{business_type}} (products / services / both)
Contact email: {{contact_email}}

Include standard clauses:
1. Definitions and interpretation
2. About us and contact information
3. Our contract with you
4. Your status
5. The goods/services
6. Price and payment
7. Delivery
8. Cancellation and returns (including distance selling regulations)
9. Warranties
10. Liability and indemnity
11. Intellectual property
12. Confidentiality
13. Data protection
14. Complaints
15. Events outside our control
16. Governing law and jurisdiction ({{jurisdiction}})
17. Entire agreement

Compliance: Consumer Rights Act 2015, Consumer Contracts Regulations 2013, UK GDPR.

Output FLAT JSON. Keys: "definitions", "about_us", "contract", "status", "goods_and_services", "price_and_payment", "delivery", "cancellation", "warranties", "liability", "intellectual_property", "confidentiality", "data_protection", "complaints", "force_majeure", "governing_law", "entire_agreement". Each value must be a plain string.`,
  },

  commercial_lease: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a simplified UK commercial lease (FRI — Full Repairing and Insuring) with the following details:

Landlord name: {{landlord_name}}
Tenant name: {{tenant_name}}
Premises address: {{premises_address}}
Property description: {{property_description}}
Term: {{lease_term}} years
Rent: £{{annual_rent}} per annum
Rent review frequency: {{rent_review_frequency}} years
Rent review type: {{rent_review_type}} (open market / RPI-linked)
Deposit: £{{deposit}}
Break clause: {{break_clause}} (yes/no — {{break_date}})
Permitted use: {{permitted_use}}
Service charge: £{{service_charge}} per annum
Insurance rent: {{insurance_rent}}

Produce a simplified commercial lease in plain English rather than traditional conveyancing language. Avoid archaic legal phrasing like 'hereinafter' and 'aforesaid'. Use clear section headers with explanatory sub-headings. Include key commercial terms summary at the start.

Include simplified clauses:
1. Definitions
2. Demise of premises
3. Term
4. Rent and rent review
5. Service charge
6. Insurance
7. Repair and decoration (FRI basis)
8. Alterations
9. Alienation (assignment/subletting)
10. Permitted use
11. Break clause
12. Forfeiture
13. Service of notices
14. Governing law ({{jurisdiction}})

This is a simplified template for informational use — both parties should seek legal advice.

NOTE for Scotland: Scottish property law differs materially from English/Welsh law. Key differences include: heritable property (not freehold), Scottish rates and STL (not business rates), security/eviction via Sheriff Court, feudal abolition, and the Land Registration etc. (Scotland) Act 2012. If jurisdiction is 'scotland', adapt references accordingly.

Output FLAT JSON. Keys: "parties", "premises", "term", "rent", "rent_review", "service_charge", "insurance", "repair", "alterations", "alienation", "permitted_use", "break_clause", "forfeiture", "notices", "governing_law". Each value must be a plain string.`,
  },

  director_service_agreement: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK Director's Service Agreement with the following details:

Company name: {{company_name}}
Company number: {{company_number}}
Director name: {{director_name}}
Director title: {{director_title}}
Start date: {{start_date}}
Salary: £{{salary}} per {{salary_period}}
Benefits: {{benefits}}
Pension: {{pension_contribution}}%
Notice period: {{notice_period_months}} months
Holiday entitlement: {{holiday_entitlement}} days
Bonus: {{bonus_arrangement}}
Restrictive covenant period: {{restrictive_covenant_months}} months

Include clauses:
1. Appointment and duties
2. Directors' powers and authority (Companies Act 2006)
3. Remuneration and benefits
4. Pension
5. Bonus/incentive arrangements
6. Holiday
7. Sick pay
8. Expenses
9. Termination
10. (If applicable) Compensation for loss of office
11. Restrictive covenants
12. Confidentiality
13. Intellectual property
14. Outside interests and conflicts of interest
15. Governing law ({{jurisdiction}})

Output FLAT JSON. Keys: "parties", "appointment", "duties", "remuneration", "pension", "bonus", "holiday", "sick_pay", "expenses", "termination", "compensation", "restrictive_covenants", "confidentiality", "intellectual_property", "conflicts", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  shareholder_agreement: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK Shareholder Agreement suitable for a private limited company with the following details:

Company name: {{company_name}}
Company number: {{company_number}}
Shareholders: {{shareholders}}
Share structure: {{share_structure}}
Directors: {{directors}}
Effective date: {{effective_date}}

Include clauses:
1. Definitions and interpretation
2. Business and purpose
3. Board composition and meetings
4. Reserved matters (decisions requiring shareholder approval)
5. Share transfers (pre-emption rights, tag-along, drag-along)
6. Minority protection
7. Dividend policy
8. Funding
9. Non-compete and confidentiality
10. Good leaver / bad leaver provisions
11. Valuation mechanism for share transfers
12. Dispute resolution (including mediation, expert determination)
13. Deadlock
14. Termination
15. Governing law ({{jurisdiction}})

Compliance: Companies Act 2006.

Output FLAT JSON. Keys: "parties", "definitions", "business_purpose", "board", "reserved_matters", "share_transfers", "minority_protection", "dividends", "funding", "non_compete", "leaver_provisions", "valuation", "dispute_resolution", "deadlock", "termination", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  // ── New Document Types ──

  partnership_agreement: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK Partnership Agreement under the Partnership Act 1890 with the following details:

Partnership name: {{partnership_name}}
Partners: {{partners}} (names of all partners)
Business type: {{business_type}}
Business address: {{business_address}}
Start date: {{start_date}}
Capital contribution: {{capital_contribution}}
Profit sharing ratio: {{profit_sharing_ratio}}
Account reference date: {{account_reference_date}}

Include standard clauses:
1. Name and business
2. Duration of partnership
3. Capital and current accounts
4. Profit sharing and drawings
5. Management and decision-making
6. Banking and accounts
7. Holidays and leave
8. Sick leave and incapacity
9. Non-compete and confidentiality
10. Retirement and expulsion
11. Dissolution and winding up
12. Death of a partner
13. Dispute resolution (mediation)
14. Governing law ({{jurisdiction}})

Output FLAT JSON. Keys: "parties", "name_and_business", "duration", "capital", "profit_sharing", "management", "banking", "holidays", "incapacity", "restrictive_covenants", "retirement", "dissolution", "death", "dispute_resolution", "governing_law", "signature_block". Each value must be a plain string.`,
  },

  appraisal_form: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK employee appraisal/review form with the following details:

Employee name: {{employee_name}}
Job title: {{job_title}}
Department: {{department}}
Line manager: {{line_manager}}
Review period from: {{review_period_from}}
Review period to: {{review_period_to}}
Review date: {{review_date}}

Include sections:
1. Employee details
2. Key achievements during review period
3. Performance against objectives
4. Core competencies assessment (teamwork, communication, problem-solving, leadership)
5. Areas for development
6. Training and development plan
7. Objectives for next period
8. Overall performance rating (1-5 scale)
9. Employee comments
10. Manager comments
11. Signatures

Compliance: ACAS performance management guidance, Equality Act 2010.

Output FLAT JSON. Keys: "employee_details", "key_achievements", "performance_against_objectives", "competency_assessment", "development_areas", "training_plan", "future_objectives", "overall_rating", "employee_comments", "manager_comments", "signatures". Each value must be a plain string.`,
  },

  risk_assessment: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK Health and Safety risk assessment form compliant with the Management of Health and Safety at Work Regulations 1999 with the following details:

Company name: {{company_name}}
Assessment location: {{assessment_location}}
Assessor name: {{assessor_name}}
Assessment date: {{assessment_date}}
Review date: {{review_date}}
Activity/area being assessed: {{activity_description}}

Include sections:
1. Assessment details
2. Hazard identification table (hazard, who might be harmed, existing controls, risk rating L/M/H, further action required)
3. Risk rating matrix guidance (likelihood × severity)
4. Action plan (priority, action required, responsible person, target date, completed date)
5. Persons affected (employees, contractors, visitors, members of the public, vulnerable persons)
6. Significant findings summary
7. Review and monitoring schedule
8. Signatures

Compliance: Health and Safety at Work Act 1974, Management Regulations 1999, COSHH, RIDDOR.

Output FLAT JSON. Keys: "assessment_details", "hazard_identification", "risk_matrix", "action_plan", "persons_affected", "significant_findings", "review_schedule", "signatures". Each value must be a plain string.`,
  },

  health_safety_policy: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a comprehensive UK Health and Safety Policy document compliant with the Health and Safety at Work Act 1974 with the following details:

Company name: {{company_name}}
Company address: {{company_address}}
Industry/sector: {{industry_sector}}
Number of employees: {{employee_count}}
Effective date: {{effective_date}}
Senior manager responsible: {{responsible_manager}}
Health and safety advisor: {{health_safety_advisor}}

Include sections:
Part 1 — Statement of Intent:
- Senior management commitment
- Policy aims and objectives
- Consultation arrangements

Part 2 — Organisation of Health and Safety:
- Responsibilities (employer, managers, supervisors, employees)
- Health and safety roles and competent persons
- Training arrangements
- Consultation with employee representatives

Part 3 — Arrangements:
- Risk assessments
- Information and instruction
- Training and competence
- Accident reporting (RIDDOR)
- First aid
- Fire safety and emergency procedures
- Display screen equipment (DSE)
- Manual handling
- Workplace equipment (PUWER)
- Personal protective equipment (PPE)
- Control of substances hazardous to health (COSHH)
- Lone working
- Work at height
- Asbestos management
- Electrical safety
- Noise and vibration
- Stress management
- Violence at work
- Monitoring and review

Compliance: Health and Safety at Work Act 1974, Management Regulations 1999, all relevant ACoPs.

Output FLAT JSON. Keys: "statement_of_intent", "organisation_responsibilities", "training", "consultation", "risk_assessment", "accident_reporting", "first_aid", "fire_safety", "dse", "manual_handling", "ppe", "coshh", "lone_working", "electrical_safety", "monitoring", "review". Each value must be a plain string.`,
  },

  equal_opportunities_policy: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK Equal Opportunities Policy compliant with the Equality Act 2010 with the following details:

Company name: {{company_name}}
Policy owner/monitoring officer: {{policy_owner}}
Effective date: {{effective_date}}
Review date: {{review_date}}

Include sections:
1. Policy statement — commitment to equality and diversity
2. Scope — who the policy applies to (employees, contractors, job applicants, visitors)
3. Protected characteristics covered (age, disability, gender reassignment, marriage/civil partnership, pregnancy/maternity, race, religion/belief, sex, sexual orientation)
4. Types of discrimination prohibited (direct, indirect, harassment, victimisation, failure to make reasonable adjustments)
5. Recruitment and selection — fair recruitment practices
6. Employment policies — promotion, training, development, redundancy
7. Reasonable adjustments for disabled employees
8. Monitoring and review — diversity monitoring, reporting
9. Complaints and grievance procedure
10. Disciplinary consequences for breach
11. Responsibilities (employer, managers, all employees)
12. Related policies (dignity at work, anti-harassment, flexible working)

Compliance: Equality Act 2010, Public Sector Equality Duty (if applicable), ACAS guidance.

Output FLAT JSON. Keys: "policy_statement", "scope", "protected_characteristics", "discrimination_types", "recruitment", "employment_policies", "reasonable_adjustments", "monitoring", "complaints", "disciplinary", "responsibilities", "related_policies". Each value must be a plain string.`,
  },

  maternity_paternity_leave_form: {
    system: SYSTEM_PROMPT,
    prompt: `Generate a UK Maternity/Paternity Leave request form compliant with employment law with the following details:

Employee name: {{employee_name}}
Employee role: {{employee_role}}
Leave type: {{leave_type}} (maternity / paternity / shared parental / adoption)
Expected week of childbirth / placement date: {{ewc}}
Actual birth / placement date: {{actual_date}}
Partner name (if shared parental): {{partner_name}}
Partner employer: {{partner_employer}}

Include Form Sections:

Part A — Leave notification:
1. Employee details
2. Leave type and dates
3. Expected week of childbirth / placement
4. Intended start date of leave
5. Intended return to work date
6. Declaration

Part B — Statutory Pay entitlement information:
1. Continuous employment length
2. Average weekly earnings (AWE) calculation
3. Eligibility for Statutory Maternity Pay (SMP) / Statutory Paternity Pay (SPP) / Shared Parental Pay (ShPP)
4. Pay rates and periods
5. KIT / SPLIT days intention

Part C — Employer response:
1. Acknowledgement of notification
2. SMP/SPP/ShPP eligibility decision
3. Pay rate confirmation
4. Keep in touch (KIT) arrangements
5. Right to return to work confirmation
6. Pension arrangements during leave
7. Holiday accrual during leave

Compliance: Employment Rights Act 1996, Maternity and Parental Leave Regulations 1999, Shared Parental Leave Regulations 2014, The Children and Families Act 2014, ACAS guidance.

Output FLAT JSON. Keys: "employee_details", "leave_type", "leave_dates", "notification", "statutory_pay", "awe_calculation", "pay_eligibility", "employer_response", "kit_arrangements", "return_to_work", "declaration". Each value must be a plain string.`,
  },
};

import { db } from "@/lib/db";
import { documentTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Builds the full prompt for a given document type by interpolating user inputs.
 * Falls back to default TEMPLATES if no docType match or DB error.
 */
export function buildPrompt(
  docType: string,
  userInputs: Record<string, string>,
  jurisdiction?: string
): { system: string; prompt: string } | null {
  const template = TEMPLATES[docType];
  if (!template) return null;

  let system = template.system;
  let filled = template.prompt;

  // Inject jurisdiction into interpolation variables
  const inputs = { ...userInputs };
  if (jurisdiction) {
    inputs["jurisdiction"] = jurisdiction === "scotland" ? "Scotland" : "England and Wales";
  }

  for (const [key, value] of Object.entries(inputs)) {
    filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Also inject jurisdiction into the system prompt
  if (jurisdiction) {
    system = system.replace(
      new RegExp("\\{\\{jurisdiction\\}\\}", "g"),
      jurisdiction === "scotland" ? "Scotland" : "England and Wales"
    );
  }

  return { system, prompt: filled };
}

/**
 * Resolves a prompt for document generation, checking tenant-specific
 * custom templates in the database before falling back to hardcoded defaults.
 *
 * This is the preferred entry point for document generation — it respects
 * the Template Editor feature.
 */
export async function resolvePrompt(
  docType: string,
  userInputs: Record<string, string>,
  tenantId: string,
  jurisdiction?: string
): Promise<{ system: string; prompt: string } | null> {
  // Check for a tenant-specific custom template
  try {
    const [customTemplate] = await db
      .select()
      .from(documentTemplates)
      .where(
        and(
          eq(documentTemplates.tenantId, tenantId),
          eq(documentTemplates.type, docType as any),
          eq(documentTemplates.isActive, true)
        )
      )
      .limit(1);

    if (customTemplate) {
      let filled = customTemplate.promptTemplate;
      // Inject jurisdiction into interpolation variables for custom templates too
      const inputs = { ...userInputs };
      if (jurisdiction) {
        inputs["jurisdiction"] = jurisdiction === "scotland" ? "Scotland" : "England and Wales";
      }
      for (const [key, value] of Object.entries(inputs)) {
        filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }
      return { system: SYSTEM_PROMPT, prompt: filled };
    }
  } catch {
    // DB error — fall through to default templates
    console.warn("[resolvePrompt] Failed to query custom templates, using defaults");
  }

  // Fall back to hardcoded templates
  return buildPrompt(docType, userInputs, jurisdiction);
}
