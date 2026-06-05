/**
 * Document-type-specific AI editing suggestions.
 * Each suggestion is a short prompt the user can click to populate
 * the AI editor, making it easy to get started with common edits.
 */

export interface Suggestion {
  /** Short label shown on the chip */
  label: string;
  /** The instruction that fills the editor input */
  instruction: string;
}

/**
 * Statically-defined suggestions per document type.
 * Covers the most useful / common edits a user might want to make.
 */
export const DOC_TYPE_SUGGESTIONS: Record<string, Suggestion[]> = {
  employment_contract: [
    { label: "Add restrictive covenants", instruction: "Add restrictive covenants clause covering non-solicitation and non-compete for 6 months after termination" },
    { label: "Change notice period", instruction: "Change the notice period to 3 months for both employer and employee" },
    { label: "Add probation clause", instruction: "Add a probation period clause of 6 months with 1 week notice during probation" },
    { label: "Add garden leave", instruction: "Add a garden leave clause allowing the employer to place the employee on garden leave during notice period" },
    { label: "Make remote-friendly", instruction: "Add a hybrid/remote working clause allowing 2 days per week work from home" },
  ],
  offer_letter: [
    { label: "Add probation details", instruction: "Add a probation period section: 3 months with option to extend" },
    { label: "Add benefits summary", instruction: "Add a benefits section including pension, private health insurance, and 25 days holiday" },
    { label: "Add relocation support", instruction: "Add relocation assistance: up to £5,000 reimbursed with receipts" },
  ],
  staff_handbook: [
    { label: "Add remote work policy", instruction: "Add a remote work policy section: hybrid model, 2 office days per week, equipment provided" },
    { label: "Add social media policy", instruction: "Add a social media policy section covering professional conduct on LinkedIn and personal accounts" },
    { label: "Add annual leave details", instruction: "Expand the holiday section: 25 days plus bank holidays, carry over max 5 days" },
    { label: "Add diversity statement", instruction: "Add an equality and diversity statement: zero-tolerance for discrimination, commitment to inclusive hiring" },
  ],
  nda: [
    { label: "Add non-compete clause", instruction: "Add a non-compete clause preventing disclosure of trade secrets for 12 months after termination" },
    { label: "Add jurisdiction clause", instruction: "Add governing law and exclusive jurisdiction clause appropriate to the document's jurisdiction (England and Wales or Scotland)" },
    { label: "Change term length", instruction: "Change the confidentiality period to 5 years from the effective date" },
  ],
  service_agreement: [
    { label: "Add IR35 clause", instruction: "Add an IR35 status clause confirming the engagement is outside IR35 with right of substitution" },
    { label: "Add notice period", instruction: "Add a 30-day notice period for termination by either party" },
    { label: "Add service levels", instruction: "Add a service level agreement section: response times, quality standards, KPIs" },
    { label: "Add limitation of liability", instruction: "Add a limitation of liability clause: capped at total fees paid in the preceding 12 months" },
  ],
  consultant_agreement: [
    { label: "Add IR35 status", instruction: "Add an IR35 clause confirming outside IR35 with substitution right" },
    { label: "Add expenses clause", instruction: "Add pre-approved expenses clause: travel, accommodation, and materials at cost" },
    { label: "Add IP assignment", instruction: "Add intellectual property assignment clause: all work product assigned to the company" },
  ],
  freelancer_contract: [
    { label: "Add IP ownership", instruction: "Add intellectual property clause: full assignment of deliverables upon payment" },
    { label: "Add milestones", instruction: "Add milestone-based payment schedule: 30% on start, 40% on mid-point delivery, 30% on completion" },
    { label: "Add late payment terms", instruction: "Add late payment interest: 8% over Bank of England base rate under the Late Payment of Commercial Debts Act" },
  ],
  settlement_agreement: [
    { label: "Add confidentiality clause", instruction: "Add a confidentiality clause covering terms of settlement and reason for termination" },
    { label: "Add agreed reference", instruction: "Add an agreed reference wording section: confirm dates of employment and job title only" },
    { label: "Add non-disparagement", instruction: "Add mutual non-disparagement clause with a carve-out for regulatory disclosures" },
    { label: "Add tax indemnity", instruction: "Add a tax indemnity clause confirming the employee is responsible for their own tax on the compensation payment" },
  ],
  director_service_agreement: [
    { label: "Add conflicts clause", instruction: "Add outside interests and conflicts of interest clause per Companies Act 2006" },
    { label: "Add bonus scheme", instruction: "Add performance-based bonus scheme: up to 30% of salary based on board-set KPIs" },
    { label: "Add compensation clause", instruction: "Add compensation for loss of office clause: 12 months' salary and benefits" },
    { label: "Add restrictive covenants", instruction: "Add restrictive covenants: 12 months non-compete, non-solicitation of clients and staff" },
  ],
  shareholder_agreement: [
    { label: "Add drag-along rights", instruction: "Add drag-along clause: majority shareholders can compel minority sale on same terms" },
    { label: "Add tag-along rights", instruction: "Add tag-along clause: minority can join a sale on same terms as majority" },
    { label: "Add deadlock resolution", instruction: "Add deadlock resolution: CEO's decision then mediation then expert determination" },
    { label: "Add pre-emption rights", instruction: "Add pre-emption rights: existing shareholders have first refusal on new share issues" },
  ],
  commercial_lease: [
    { label: "Add break clause terms", instruction: "Add break clause: tenant only, after 3 years, 6 months prior notice, no penalty" },
    { label: "Add rent review details", instruction: "Add rent review: 5 yearly, open market with cap and collar of 3% and 1%" },
    { label: "Add alienation clause", instruction: "Add alienation clause: tenant may assign or sublet with landlord's consent not unreasonably withheld" },
    { label: "Simplify the language", instruction: "Rewrite this lease in plain English — avoid 'hereinafter', 'aforesaid', and archaic legal phrasing" },
  ],
  disciplinary_grievance_letters: [
    { label: "Add right to accompany", instruction: "Add right to be accompanied clause: ACAS code — employee may bring a trade union rep or work colleague" },
    { label: "Add appeal rights", instruction: "Add detailed appeal rights: 5 working days to appeal in writing, hearing within 14 days" },
    { label: "Add GDPR notice", instruction: "Add a data protection notice: how meeting notes and outcomes will be stored" },
  ],
  flexible_working_request: [
    { label: "Add statutory grounds", instruction: "Add all eight statutory grounds for refusal from s.80G(1)(b) ERA 1996" },
    { label: "Add appeal process", instruction: "Add appeal process: employee can appeal within 14 days, decision within 1 month" },
    { label: "Add trial period", instruction: "Add a 3-month trial period clause before permanent change" },
  ],
  gdpr_privacy_notice: [
    { label: "Add lawful bases", instruction: "Add a table of processing purposes with corresponding lawful bases and retention periods" },
    { label: "Add international transfers", instruction: "Add international transfer clause: Standard Contractual Clauses for transfers outside UK" },
    { label: "Add cookie section", instruction: "Add cookies and similar technologies section if this is a website privacy notice" },
  ],
  data_processing_agreement: [
    { label: "Add sub-processing clause", instruction: "Add sub-processor clause: processor may engage sub-processors with controller's general authorisation" },
    { label: "Add breach notification", instruction: "Add personal data breach clause: notification within 48 hours with full investigation details" },
    { label: "Add audit rights", instruction: "Add audit rights: controller or its auditor may inspect annually on 30 days' notice" },
  ],
  privacy_policy: [
    { label: "Add data subject rights", instruction: "Add full list of data subject rights: access, rectification, erasure, restriction, portability, objection, automated decisions" },
    { label: "Add cookie policy", instruction: "Add detailed cookie section: analytics, marketing, functional cookies with consent mechanisms" },
    { label: "Add complaint section", instruction: "Add complaints section: contact DPO first, then right to complain to ICO within 3 months" },
  ],
  terms_and_conditions: [
    { label: "Add cancellation rights", instruction: "Add cancellation and returns clause: 14-day cooling-off period under Consumer Contracts Regulations 2013" },
    { label: "Add liability cap", instruction: "Add limitation of liability clause: capped at the total amount paid in the last 12 months, nothing excluded for death or fraud" },
    { label: "Add dispute resolution", instruction: "Add dispute resolution: negotiation, mediation, then exclusive jurisdiction of English courts" },
  ],
  payslip: [
    { label: "Add year-to-date totals", instruction: "Add year-to-date totals for gross pay, tax paid, and NI paid" },
    { label: "Add pension details", instruction: "Add pension contribution breakdown: employee contribution, employer contribution, total" },
    { label: "Add student loan", instruction: "Add student loan and postgraduate loan deduction rows" },
  ],
  p45: [
    { label: "Add part 3 details", instruction: "Expand Part 3 with full year-to-date earnings, tax, and loan deductions" },
    { label: "Add student loan info", instruction: "Add student loan plan type and whether deductions have stopped" },
  ],
  job_description: [
    { label: "Add essential criteria", instruction: "Add essential person specification criteria: qualifications, experience, skills required" },
    { label: "Add desirable criteria", instruction: "Add desirable criteria: nice-to-have qualifications, languages, certifications" },
    { label: "Remove bias", instruction: "Review for Equality Act 2010 compliance — remove any discriminatory language or unnecessary requirements" },
    { label: "Add salary band", instruction: "Add salary band display and benefits package summary" },
  ],
};

/**
 * Returns suggestions for a given document type.
 * Falls back to an empty array if no suggestions exist.
 */
export function getSuggestions(docType: string): Suggestion[] {
  return DOC_TYPE_SUGGESTIONS[docType] ?? [];
}