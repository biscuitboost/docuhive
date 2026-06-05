/**
 * SEO content data for document-type landing pages.
 * Each entry targets a long-tail UK search query and provides
 * structured content for featured snippets and organic ranking.
 */

export interface LandingSEOData {
  /** Document type slug (matches /documents/new/[type]) */
  type: string
  /** Human-readable document name */
  label: string
  /** Primary long-tail keyword this page targets */
  targetKeyword: string
  /** Meta title (max ~60 chars) */
  metaTitle: string
  /** Meta description (max ~160 chars) */
  metaDescription: string
  /** H1 heading */
  heading: string
  /** Short intro paragraph */
  intro: string
  /** 3-4 key benefits as bullet points */
  benefits: string[]
  /** Who this document is for */
  whoFor: string
  /** FAQ items (Q&A pairs) for structured data */
  faqs: { question: string; answer: string }[]
  /** CTA action text */
  ctaAction: string
  /** CTA subtitle */
  ctaSubtitle: string
  /** Icon variant for CTA */
  ctaIcon: "payslip" | "contract" | "invoice" | "letter"
}

export const LANDING_PAGES: LandingSEOData[] = [
  // ── Employment ──
  {
    type: "employment_contract",
    label: "Employment Contract",
    targetKeyword: "UK employment contract template free",
    metaTitle: "Free UK Employment Contract Template | DocuHive",
    metaDescription:
      "Generate a free UK employment contract template with ERA 2025 compliance. AI-powered, solicitor-reviewed. Create your contract in minutes.",
    heading: "Free UK Employment Contract Template",
    intro:
      "Create a legally compliant UK employment contract in minutes. Our AI-powered generator produces contracts that meet the Employment Rights Act 2025 requirements — including written statement of particulars, working hours, holiday entitlement, and dismissal procedures. No solicitor fees, no HR software subscription.",
    benefits: [
      "ERA 2025 compliant — includes all mandatory written statement particulars",
      "Covers permanent, fixed-term, zero-hours, and part-time arrangements",
      "Automatically includes UK statutory entitlements (holiday, sick pay, notice periods)",
      "Download as PDF or Word — ready to sign immediately",
    ],
    whoFor: "Small business owners, startup founders, and UK employers who need a professional employment contract without paying £500+ for a solicitor.",
    faqs: [
      {
        question: "Is this employment contract legally binding in the UK?",
        answer:
          "Yes, when properly signed by both parties. Our templates are designed to meet the requirements of the Employment Rights Act 1996 and the 2025 amendments. However, we recommend having any employment contract reviewed by a qualified solicitor for your specific circumstances.",
      },
      {
        question: "What must a UK employment contract include?",
        answer:
          "A UK employment contract must include a written statement of particulars within two months of starting work. This covers: employer and employee names, start date, job title, working hours, salary, holiday entitlement, sick pay arrangements, notice periods, pension details, and disciplinary procedures. Our template includes all of these.",
      },
      {
        question: "Can I use this for a zero-hours contract?",
        answer:
          "Absolutely. Our employment contract generator supports permanent, fixed-term, zero-hours, and part-time employment types. Select 'zero hours' from the employment type dropdown and the template adjusts accordingly.",
      },
      {
        question: "How long does it take to generate an employment contract?",
        answer:
          "Less than 60 seconds. Fill in the key details (employer, employee, job title, salary, hours) and our AI generates a complete, formatted contract. Download as PDF or Word document immediately.",
      },
    ],
    ctaAction: "Generate an Employment Contract",
    ctaSubtitle: "with ERA 2025 compliance built in",
    ctaIcon: "contract",
  },
  {
    type: "offer_letter",
    label: "Offer Letter",
    targetKeyword: "UK job offer letter template",
    metaTitle: "Free UK Job Offer Letter Template | DocuHive",
    metaDescription:
      "Create a professional UK job offer letter template in seconds. AI-generated, compliant, and ready to send. Free to try.",
    heading: "Free UK Job Offer Letter Template",
    intro:
      "Send a professional job offer letter to your new hire in minutes. Our AI generates a clear, compliant offer letter that sets out the key terms of employment — job title, start date, salary, and conditions — before the full contract is issued.",
    benefits: [
      "Professional format that sets the right tone with new hires",
      "Includes all key offer terms: salary, start date, notice period, conditions",
      "Can be used alongside or before the full employment contract",
      "Download as PDF or Word — ready to email immediately",
    ],
    whoFor: "UK employers, HR managers, and small business owners making a job offer and needing a professional letter template.",
    faqs: [
      {
        question: "What should a UK job offer letter include?",
        answer:
          "A UK job offer letter should include: job title, start date, salary and benefits, working hours, location, notice period, any conditions (e.g. references, right to work checks), and a deadline for acceptance. Our template covers all of these.",
      },
      {
        question: "Is an offer letter legally binding?",
        answer:
          "An offer letter is generally not a legally binding contract on its own — it becomes binding when the employee accepts and starts work. The full employment contract supersedes it. However, it should be accurate as terms may be considered part of the employment agreement.",
      },
      {
        question: "Can I customise the offer letter?",
        answer:
          "Yes. Our AI generator lets you customise all fields. You can also save custom prompt templates for offer letters you send frequently, so you don't have to re-enter the same information.",
      },
    ],
    ctaAction: "Generate an Offer Letter",
    ctaSubtitle: "professional, ready to send in seconds",
    ctaIcon: "letter",
  },
  {
    type: "staff_handbook",
    label: "Staff Handbook",
    targetKeyword: "UK staff handbook template free",
    metaTitle: "Free UK Staff Handbook Template | DocuHive",
    metaDescription:
      "Create a comprehensive UK staff handbook with AI. Covers HR policies, code of conduct, holiday, sick pay, and more. Free to generate.",
    heading: "Free UK Staff Handbook Template",
    intro:
      "A staff handbook is essential for setting expectations and protecting your business. Our AI generates a comprehensive UK staff handbook covering company policies, code of conduct, holiday entitlement, sick pay, disciplinary procedures, and more — tailored to your business.",
    benefits: [
      "Covers all essential UK HR policies: holiday, sick pay, disciplinary, grievance",
      "Includes equality, diversity, and anti-harassment policies",
      "Automatically formatted with your company branding",
      "Download as PDF or Word — distribute to your team immediately",
    ],
    whoFor: "UK business owners and managers who need a professional staff handbook but don't have time to write one from scratch.",
    faqs: [
      {
        question: "Is a staff handbook a legal requirement in the UK?",
        answer:
          "No, a staff handbook is not a legal requirement, but it is strongly recommended. It helps you demonstrate that you have clear policies in place, which is important for employment tribunal claims. Many policies (disciplinary, grievance, health & safety) are effectively required by law.",
      },
      {
        question: "What policies should a UK staff handbook include?",
        answer:
          "A comprehensive UK staff handbook should include: company introduction, code of conduct, working hours, holiday entitlement, sick pay, maternity/paternity leave, disciplinary procedure, grievance procedure, equality and diversity policy, health and safety, data protection, IT usage policy, and whistleblowing policy.",
      },
      {
        question: "How often should I update my staff handbook?",
        answer:
          "You should review your staff handbook at least annually, or whenever UK employment law changes. Key updates to watch for include changes to statutory holiday entitlement, sick pay rates, national minimum wage, and employment rights.",
      },
    ],
    ctaAction: "Generate a Staff Handbook",
    ctaSubtitle: "comprehensive UK policies in minutes",
    ctaIcon: "contract",
  },
  {
    type: "payslip",
    label: "Payslip",
    targetKeyword: "UK payslip generator free",
    metaTitle: "Free UK Payslip Generator | DocuHive",
    metaDescription:
      "Generate professional UK payslips with PAYE, NI, and pension deductions. Free to try. Download as PDF.",
    heading: "Free UK Payslip Generator",
    intro:
      "Generate professional UK payslips for your employees in seconds. Our AI calculates PAYE income tax, National Insurance contributions, and pension deductions automatically. Each payslip includes all legally required information — gross pay, deductions, net pay, and year-to-date totals.",
    benefits: [
      "Automatic PAYE, NI, and pension calculations — no manual maths",
      "Includes all legally required UK payslip information",
      "Year-to-date totals for tax and NI automatically tracked",
      "Download as PDF — print or email to employees",
    ],
    whoFor: "UK small business owners, sole traders, and micro-employers who need to generate payslips without paying for expensive payroll software.",
    faqs: [
      {
        question: "Is it a legal requirement to provide payslips in the UK?",
        answer:
          "Yes. Under the Employment Rights Act 1996, all employees (not workers) are entitled to an itemised payslip. Since April 2019, payslips must also show hours for employees paid by the hour. Our payslips include all legally required information.",
      },
      {
        question: "What information must a UK payslip include?",
        answer:
          "A UK payslip must include: gross pay, deductions (tax, NI, pension, student loan), net pay, and variable deductions. If paid by the hour, it must also show hours worked. Our generator includes all of these plus year-to-date totals.",
      },
      {
        question: "Can I generate payslips for multiple employees?",
        answer:
          "Yes. Each payslip is generated individually, and you can save employee data to pre-fill future payslips. Our Smart Pre-fill feature extracts employee details from previous documents to speed up the process.",
      },
    ],
    ctaAction: "Generate a Payslip",
    ctaSubtitle: "with automatic PAYE & NI calculations",
    ctaIcon: "payslip",
  },
  {
    type: "p45",
    label: "P45",
    targetKeyword: "UK P45 form template",
    metaTitle: "Free UK P45 Form Generator | DocuHive",
    metaDescription:
      "Generate a UK P45 form for departing employees. Includes all HMRC-required sections. Free to try.",
    heading: "Free UK P45 Form Generator",
    intro:
      "When an employee leaves, you're legally required to provide a P45. Our AI generates a complete P45 form with all HMRC-required sections — including pay and tax details to date, leaving date, and student loan information.",
    benefits: [
      "Complete P45 with all HMRC-required sections",
      "Includes pay and tax details to date, leaving date, student loan info",
      "Professional format accepted by HMRC and new employers",
      "Download as PDF — print and give to departing employee",
    ],
    whoFor: "UK employers and small business owners who need to issue a P45 when an employee leaves.",
    faqs: [
      {
        question: "When must I issue a P45?",
        answer:
          "You must issue a P45 when an employee stops working for you. You should give it to them on or before their last day of employment. The employee then gives it to their new employer or uses it to claim benefits or a tax refund.",
      },
      {
        question: "What information goes on a P45?",
        answer:
          "A P45 has four sections: Part 1 (sent to HMRC), Part 1A (employee's copy), Part 2 (for new employer), Part 3 (for new employer to send to HMRC). It includes: employee details, leaving date, tax code, pay to date, tax to date, and student loan deductions.",
      },
      {
        question: "Can I generate a P45 for a past employee?",
        answer:
          "Yes. You can generate a P45 for any employee who has left, as long as you have their employment details. The form will show the correct pay and tax figures for the period they worked for you.",
      },
    ],
    ctaAction: "Generate a P45",
    ctaSubtitle: "HMRC-compliant, ready to print",
    ctaIcon: "payslip",
  },
  {
    type: "nda",
    label: "Non-Disclosure Agreement (NDA)",
    targetKeyword: "UK NDA template free",
    metaTitle: "Free UK NDA Template | Non-Disclosure Agreement | DocuHive",
    metaDescription:
      "Generate a free UK NDA (non-disclosure agreement) template. Mutual and unilateral options. AI-powered, solicitor-reviewed. Download as PDF or Word.",
    heading: "Free UK NDA Template",
    intro:
      "Protect your confidential information with a professionally drafted UK NDA. Our AI generates both mutual and unilateral non-disclosure agreements that are enforceable under English law. Perfect for sharing business plans, financial data, or trade secrets with potential partners, investors, or employees.",
    benefits: [
      "Mutual and unilateral NDA options available",
      "Enforceable under English and Welsh law",
      "Covers definition of confidential information, exclusions, and term",
      "Download as PDF or Word — ready to sign immediately",
    ],
    whoFor: "UK business owners, startup founders, and entrepreneurs who need to protect confidential information when dealing with partners, investors, contractors, or employees.",
    faqs: [
      {
        question: "Is an NDA enforceable in the UK?",
        answer:
          "Yes, NDAs are enforceable in the UK if they are properly drafted and reasonable in scope. Key factors for enforceability include: clear definition of confidential information, reasonable time limit, and legitimate business interest. Our templates are designed with these principles in mind.",
      },
      {
        question: "What's the difference between mutual and unilateral NDA?",
        answer:
          "A unilateral (one-way) NDA protects only one party's confidential information — used when you're sharing your secrets with someone. A mutual (two-way) NDA protects both parties — used when both sides will share confidential information, such as in a joint venture or partnership discussion.",
      },
      {
        question: "How long should an NDA last?",
        answer:
          "In the UK, NDA terms typically range from 2 to 5 years, though some information (like trade secrets) may need indefinite protection. The appropriate term depends on the nature of the information and your industry. Our template lets you set the term that works for your situation.",
      },
    ],
    ctaAction: "Generate an NDA",
    ctaSubtitle: "protect your confidential information",
    ctaIcon: "contract",
  },
  {
    type: "service_agreement",
    label: "Service Agreement",
    targetKeyword: "UK service agreement template",
    metaTitle: "Free UK Service Agreement Template | DocuHive",
    metaDescription:
      "Generate a professional UK service agreement template. Covers scope of work, payment terms, IP, and termination. Free to try.",
    heading: "Free UK Service Agreement Template",
    intro:
      "A service agreement sets out the terms between you and your clients. Our AI generates a comprehensive UK service agreement covering scope of work, payment terms, intellectual property, confidentiality, and termination — protecting both parties from the start.",
    benefits: [
      "Covers scope of work, payment terms, IP rights, and termination",
      "Professional format suitable for B2B and B2C services",
      "Includes limitation of liability and dispute resolution clauses",
      "Download as PDF or Word — ready to sign",
    ],
    whoFor: "UK freelancers, consultants, agencies, and service businesses who need a professional service agreement to formalise client relationships.",
    faqs: [
      {
        question: "What's the difference between a service agreement and a contract of employment?",
        answer:
          "A service agreement is for independent contractors, freelancers, and businesses providing services to clients. An employment contract is for employees. The key difference is that a service agreement does not create an employer-employee relationship — the contractor remains self-employed for tax purposes.",
      },
      {
        question: "Does a service agreement need to be in writing?",
        answer:
          "While verbal contracts can be legally binding, a written service agreement is strongly recommended. It provides clarity on scope, payment, and termination terms, and is essential evidence if disputes arise. Some terms (like IP assignment) must be in writing to be enforceable.",
      },
      {
        question: "What should a UK service agreement include?",
        answer:
          "A comprehensive UK service agreement should include: parties, scope of services, payment terms and invoicing schedule, intellectual property ownership, confidentiality obligations, limitation of liability, termination provisions, dispute resolution, and governing law (England & Wales).",
      },
    ],
    ctaAction: "Generate a Service Agreement",
    ctaSubtitle: "protect your client relationships",
    ctaIcon: "contract",
  },
  {
    type: "freelancer_contract",
    label: "Freelancer Contract",
    targetKeyword: "UK freelancer contract template",
    metaTitle: "Free UK Freelancer Contract Template | DocuHive",
    metaDescription:
      "Generate a professional UK freelancer contract template. IR35-aware, covers scope, payment, IP. Free to try.",
    heading: "Free UK Freelancer Contract Template",
    intro:
      "Whether you're hiring a freelancer or working as one, a clear contract protects everyone. Our AI generates IR35-aware UK freelancer contracts that clearly establish the contractor relationship, covering scope of work, payment terms, IP ownership, and termination.",
    benefits: [
      "IR35-aware — clearly establishes contractor relationship",
      "Covers scope, deliverables, payment schedule, and IP ownership",
      "Includes confidentiality and data protection clauses",
      "Download as PDF or Word — ready to sign",
    ],
    whoFor: "UK freelancers, contractors, and businesses hiring freelancers who need a professional contract that clearly defines the working relationship.",
    faqs: [
      {
        question: "What is IR35 and why does it matter for freelancer contracts?",
        answer:
          "IR35 is HMRC's off-payroll working rules. If a contractor is deemed 'inside IR35', they must pay similar tax and NI as an employee. A well-drafted freelancer contract with substitution rights, no mutuality of obligation, and no control clauses helps demonstrate the contractor is genuinely self-employed.",
      },
      {
        question: "Can a freelancer use this contract for their own clients?",
        answer:
          "Absolutely. The contract works both ways — freelancers can use it with their clients, and businesses can use it when hiring freelancers. Just fill in the details from the appropriate perspective.",
      },
      {
        question: "What payment terms should I include?",
        answer:
          "Common payment terms for UK freelancers include: fixed fee per project, hourly/daily rate, or retainer. Include the rate, invoicing schedule (e.g. monthly, on completion), payment due date (e.g. 30 days), and any late payment interest (statutory right under the Late Payment of Commercial Debts Act).",
      },
    ],
    ctaAction: "Generate a Freelancer Contract",
    ctaSubtitle: "IR35-aware, professional, ready to sign",
    ctaIcon: "contract",
  },
  {
    type: "gdpr_privacy_notice",
    label: "GDPR Privacy Notice",
    targetKeyword: "UK GDPR privacy notice template",
    metaTitle: "Free UK GDPR Privacy Notice Template | DocuHive",
    metaDescription:
      "Generate a compliant UK GDPR privacy notice for your business. Covers data collection, processing, rights, and cookies. Free to try.",
    heading: "Free UK GDPR Privacy Notice Template",
    intro:
      "Every UK business that processes personal data needs a privacy notice. Our AI generates a GDPR-compliant privacy notice tailored to your business — covering what data you collect, how you use it, your legal basis, data retention, and individuals' rights under UK data protection law.",
    benefits: [
      "Full UK GDPR compliance — covers Articles 13 and 14 requirements",
      "Tailored to your specific data processing activities",
      "Includes individuals' rights: access, rectification, erasure, portability",
      "Download as PDF or Word — publish on your website",
    ],
    whoFor: "UK business owners, website operators, and organisations that process personal data and need a compliant privacy notice.",
    faqs: [
      {
        question: "Is a privacy notice a legal requirement in the UK?",
        answer:
          "Yes. Under UK GDPR (Article 13 and 14), you must provide a privacy notice when you collect personal data. It must be concise, transparent, and easily accessible. Failure to provide one can result in ICO enforcement action and fines up to £17.5 million or 4% of annual turnover.",
      },
      {
        question: "What must a UK GDPR privacy notice include?",
        answer:
          "A UK GDPR privacy notice must include: identity of the data controller, purposes of processing, legal basis, legitimate interests (if applicable), recipients of data, international transfers, retention period, individuals' rights, right to complain to the ICO, and whether providing data is a contractual requirement.",
      },
      {
        question: "How often should I update my privacy notice?",
        answer:
          "You should review your privacy notice whenever your data processing activities change — for example, if you start using new analytics tools, add a newsletter, or share data with new third parties. At minimum, review annually to ensure it remains accurate.",
      },
    ],
    ctaAction: "Generate a Privacy Notice",
    ctaSubtitle: "UK GDPR compliant, ready to publish",
    ctaIcon: "contract",
  },
  {
    type: "terms_and_conditions",
    label: "Terms & Conditions",
    targetKeyword: "UK terms and conditions template",
    metaTitle: "Free UK Terms & Conditions Template | DocuHive",
    metaDescription:
      "Generate professional UK terms and conditions for your business website. Covers consumer rights, delivery, returns, and liability. Free to try.",
    heading: "Free UK Terms & Conditions Template",
    intro:
      "Protect your business with professionally drafted UK terms and conditions. Our AI generates comprehensive T&Cs covering consumer rights (Consumer Rights Act 2015), delivery terms, returns policy, payment terms, limitation of liability, and dispute resolution — tailored to your business type.",
    benefits: [
      "Consumer Rights Act 2015 compliant",
      "Covers delivery, returns, payment, and cancellation rights",
      "Includes limitation of liability and governing law clauses",
      "Download as PDF or Word — publish on your website",
    ],
    whoFor: "UK e-commerce businesses, service providers, and any business selling to consumers or other businesses online.",
    faqs: [
      {
        question: "Are terms and conditions legally required in the UK?",
        answer:
          "While not always legally required, terms and conditions are essential for any business selling products or services. They create a legally binding contract between you and your customers, set expectations, and limit your liability. For consumer sales, certain information is required by the Consumer Contracts Regulations.",
      },
      {
        question: "What should UK terms and conditions include?",
        answer:
          "UK T&Cs should include: business information, pricing and payment terms, delivery, returns and cancellation rights (14-day cooling-off for online sales), liability limitations, intellectual property, privacy, governing law, and dispute resolution. Consumer contracts must also include the right to cancel under the Consumer Contracts Regulations.",
      },
      {
        question: "Can I use the same T&Cs for B2B and B2C?",
        answer:
          "It's better to have separate T&Cs for B2B and B2C, as consumer protection laws (Consumer Rights Act 2015, Consumer Contracts Regulations) give consumers additional rights that don't apply to business customers. Our generator lets you choose your business type for appropriate terms.",
      },
    ],
    ctaAction: "Generate Terms & Conditions",
    ctaSubtitle: "protect your business, comply with UK law",
    ctaIcon: "contract",
  },
  {
    type: "commercial_lease",
    label: "Commercial Lease",
    targetKeyword: "UK commercial lease template",
    metaTitle: "Free UK Commercial Lease Template | DocuHive",
    metaDescription:
      "Generate a UK commercial lease agreement template. Covers rent, term, repairs, and break clauses. Free to try.",
    heading: "Free UK Commercial Lease Template",
    intro:
      "Whether you're a landlord or a tenant, a clear commercial lease protects your interests. Our AI generates a UK commercial lease agreement covering rent, term length, repair obligations, service charges, break clauses, and alienation provisions — compliant with the Landlord and Tenant Act 1954.",
    benefits: [
      "Landlord and Tenant Act 1954 compliant",
      "Covers rent, term, repairs, insurance, and service charges",
      "Includes break clauses, alienation, and forfeiture provisions",
      "Download as PDF or Word — ready to sign",
    ],
    whoFor: "UK commercial landlords, tenants, and business owners entering into a commercial property lease.",
    faqs: [
      {
        question: "What is the Landlord and Tenant Act 1954?",
        answer:
          "The Landlord and Tenant Act 1954 gives business tenants security of tenure — the right to renew their lease at the end of the term. Both parties can contract out of this protection, but specific procedures must be followed. Our lease template includes options for both scenarios.",
      },
      {
        question: "What should a UK commercial lease include?",
        answer:
          "A UK commercial lease should include: parties, property description, term (length), rent and rent review mechanism, service charges, repair and insurance obligations, permitted use, alienation (assignment/subletting), break clauses, forfeiture provisions, and governing law.",
      },
      {
        question: "Do I need a solicitor for a commercial lease?",
        answer:
          "While our template provides a solid starting point, commercial leases are complex legal documents with significant financial implications. We strongly recommend having a solicitor review any commercial lease before signing, especially for long-term commitments or high-value properties.",
      },
    ],
    ctaAction: "Generate a Commercial Lease",
    ctaSubtitle: "protect your property interests",
    ctaIcon: "contract",
  },
  {
    type: "settlement_agreement",
    label: "Settlement Agreement",
    targetKeyword: "UK settlement agreement template",
    metaTitle: "Free UK Settlement Agreement Template | DocuHive",
    metaDescription:
      "Generate a UK settlement agreement template for ending employment. Covers termination terms, payments, and confidentiality. Free to try.",
    heading: "Free UK Settlement Agreement Template",
    intro:
      "A settlement agreement (formerly known as a compromise agreement) is a legally binding contract that ends the employment relationship on agreed terms. Our AI generates a UK settlement agreement covering termination payments, waiver of claims, confidentiality, and agreed reference — compliant with Section 203 of the Employment Rights Act 1996.",
    benefits: [
      "Section 203 Employment Rights Act 1996 compliant",
      "Covers termination payment, waiver of claims, and agreed reference",
      "Includes confidentiality, non-derogatory statements, and return of property",
      "Download as PDF or Word — ready for legal review",
    ],
    whoFor: "UK employers and HR professionals who need to document a mutually agreed termination of employment.",
    faqs: [
      {
        question: "What is a settlement agreement?",
        answer:
          "A settlement agreement is a legally binding contract between employer and employee that settles any potential claims the employee may have in exchange for a termination payment. The employee must receive independent legal advice on the agreement for it to be valid.",
      },
      {
        question: "Does an employee need legal advice on a settlement agreement?",
        answer:
          "Yes. For a settlement agreement to be valid under Section 203 of the Employment Rights Act 1996, the employee must receive independent legal advice from a qualified adviser (solicitor, trade union official, or advice centre worker). The employer typically contributes toward the employee's legal fees.",
      },
      {
        question: "What should a UK settlement agreement include?",
        answer:
          "A UK settlement agreement should include: termination date, termination payment (notice pay, redundancy, ex-gratia), waiver of claims (statutory and contractual), agreed reference, confidentiality, return of company property, tax indemnity, and the adviser's certificate confirming independent legal advice was given.",
      },
    ],
    ctaAction: "Generate a Settlement Agreement",
    ctaSubtitle: "legally compliant, ready for review",
    ctaIcon: "contract",
  },
  {
    type: "director_service_agreement",
    label: "Director Service Agreement",
    targetKeyword: "UK director service agreement template",
    metaTitle: "Free UK Director Service Agreement Template | DocuHive",
    metaDescription:
      "Generate a UK director service agreement template. Covers duties, remuneration, termination, and restrictive covenants. Free to try.",
    heading: "Free UK Director Service Agreement Template",
    intro:
      "A director service agreement is essential for formalising the relationship between a company and its directors. Our AI generates a comprehensive UK director service agreement covering duties, remuneration, benefits, termination, restrictive covenants, and board participation — compliant with the Companies Act 2006.",
    benefits: [
      "Companies Act 2006 compliant",
      "Covers director duties, remuneration, benefits, and expenses",
      "Includes restrictive covenants, termination, and board participation",
      "Download as PDF or Word — ready to sign",
    ],
    whoFor: "UK company directors, shareholders, and businesses that need to formalise director arrangements with a legally compliant service agreement.",
    faqs: [
      {
        question: "What's the difference between a director service agreement and an employment contract?",
        answer:
          "A director service agreement covers additional director-specific duties under the Companies Act 2006, including fiduciary duties, board meeting attendance, and statutory obligations. Directors may also have an employment contract if they are employees of the company. Many companies combine both into a single service agreement.",
      },
      {
        question: "What restrictive covenants should a director agreement include?",
        answer:
          "Director service agreements typically include: non-competition (6-12 months), non-solicitation of clients, non-dealing with clients, non-solicitation of employees, and non-poaching of suppliers. These must be reasonable in scope and duration to be enforceable.",
      },
      {
        question: "Can a director be removed under this agreement?",
        answer:
          "Yes. The agreement should include termination provisions for both parties. Note that director removal is also governed by the Companies Act 2006 (ordinary resolution of shareholders), so the service agreement termination provisions work alongside statutory removal rights.",
      },
    ],
    ctaAction: "Generate a Director Service Agreement",
    ctaSubtitle: "Companies Act compliant, board-ready",
    ctaIcon: "contract",
  },
  {
    type: "shareholder_agreement",
    label: "Shareholder Agreement",
    targetKeyword: "UK shareholder agreement template",
    metaTitle: "Free UK Shareholder Agreement Template | DocuHive",
    metaDescription:
      "Generate a UK shareholder agreement template. Covers share transfers, decision-making, dividends, and dispute resolution. Free to try.",
    heading: "Free UK Shareholder Agreement Template",
    intro:
      "A shareholder agreement protects the interests of all shareholders and the company. Our AI generates a comprehensive UK shareholder agreement covering share transfers (including drag-along and tag-along rights), decision-making, dividend policy, board composition, and dispute resolution.",
    benefits: [
      "Covers share transfers, pre-emption rights, drag/tag-along provisions",
      "Decision-making matrix: reserved matters, board composition, voting",
      "Dividend policy, deadlock resolution, and exit strategy",
      "Download as PDF or Word — ready for legal review",
    ],
    whoFor: "UK company founders, co-owners, and investors who need to formalise shareholder arrangements and protect their investment.",
    faqs: [
      {
        question: "Do I need a shareholder agreement if I have articles of association?",
        answer:
          "Yes. While the articles of association set out basic company governance, a shareholder agreement provides additional protections that the articles cannot cover, such as drag-along/tag-along rights, pre-emption rights on share transfers, dividend policy, and deadlock resolution mechanisms.",
      },
      {
        question: "What are drag-along and tag-along rights?",
        answer:
          "Drag-along rights allow majority shareholders to force minority shareholders to sell their shares in a sale of the company. Tag-along rights allow minority shareholders to join a sale on the same terms as the majority. Both are important protections in any shareholder agreement.",
      },
      {
        question: "How does a shareholder agreement handle deadlock?",
        answer:
          "Common deadlock resolution mechanisms include: mediation, a 'Russian roulette' provision (one shareholder offers to buy the other at a stated price), or a 'Texas shoot-out' (both submit sealed bids, highest buyer wins). Our template includes these options.",
      },
    ],
    ctaAction: "Generate a Shareholder Agreement",
    ctaSubtitle: "protect co-founder and investor interests",
    ctaIcon: "contract",
  },
  {
    type: "partnership_agreement",
    label: "Partnership Agreement",
    targetKeyword: "UK partnership agreement template",
    metaTitle: "Free UK Partnership Agreement Template | DocuHive",
    metaDescription:
      "Generate a UK partnership agreement template. Covers profit sharing, decision-making, capital, and dissolution. Free to try.",
    heading: "Free UK Partnership Agreement Template",
    intro:
      "A partnership agreement is essential for any business partnership. Our AI generates a comprehensive UK partnership agreement covering profit sharing, capital contributions, decision-making authority, partner duties, admission of new partners, and dissolution procedures — compliant with the Partnership Act 1890.",
    benefits: [
      "Partnership Act 1890 compliant",
      "Covers profit/loss sharing, capital, drawings, and decision-making",
      "Includes partner duties, retirement, expulsion, and dissolution",
      "Download as PDF or Word — ready to sign",
    ],
    whoFor: "UK business partners, professional practices, and anyone starting or formalising a business partnership.",
    faqs: [
      {
        question: "What happens if we don't have a partnership agreement?",
        answer:
          "Without a partnership agreement, the Partnership Act 1890 applies by default. This means profits and losses are shared equally regardless of contribution, any partner can dissolve the partnership at any time, and no partner can be expelled. A written agreement lets you override these default rules.",
      },
      {
        question: "What should a UK partnership agreement include?",
        answer:
          "A UK partnership agreement should include: business name and purpose, capital contributions, profit/loss sharing ratio, drawings policy, decision-making authority, partner duties and restrictions, admission/retirement of partners, dispute resolution, and dissolution procedures.",
      },
      {
        question: "Can I add new partners later?",
        answer:
          "Yes. Your partnership agreement should include provisions for admitting new partners, including: unanimous or majority consent requirements, capital contribution expectations, profit share adjustment, and any probationary period. Our template includes these options.",
      },
    ],
    ctaAction: "Generate a Partnership Agreement",
    ctaSubtitle: "formalise your business partnership",
    ctaIcon: "contract",
  },
  {
    type: "appraisal_form",
    label: "Appraisal Form",
    targetKeyword: "UK employee appraisal form template",
    metaTitle: "Free UK Employee Appraisal Form Template | DocuHive",
    metaDescription:
      "Generate a professional UK employee appraisal form template. Covers performance review, goals, and development plan. Free to try.",
    heading: "Free UK Employee Appraisal Form Template",
    intro:
      "Conduct effective employee performance reviews with our professional appraisal form. Our AI generates a comprehensive UK appraisal form covering performance assessment, goal achievement, competencies, areas for development, and an action plan for the next review period.",
    benefits: [
      "Covers performance assessment, goals, competencies, and development",
      "Professional format suitable for all UK businesses",
      "Includes employee and manager sections for balanced review",
      "Download as PDF or Word — ready to use",
    ],
    whoFor: "UK managers, HR professionals, and small business owners conducting employee performance reviews.",
    faqs: [
      {
        question: "How often should appraisals be conducted?",
        answer:
          "Most UK businesses conduct appraisals annually, with quarterly or monthly check-ins in between. Annual appraisals are typically linked to pay reviews and bonus decisions, while more frequent reviews focus on performance and development.",
      },
      {
        question: "What should an appraisal form include?",
        answer:
          "A comprehensive appraisal form should include: employee details, review period, performance against objectives, core competencies assessment, achievements and challenges, areas for development, training needs, career aspirations, employee comments, and an action plan with SMART goals for the next period.",
      },
      {
        question: "Can appraisal forms be used in disciplinary proceedings?",
        answer:
          "Appraisal forms document performance discussions and can be used as evidence in performance management or disciplinary proceedings. However, they should not be a substitute for formal disciplinary procedures. Always follow your company's disciplinary policy for serious issues.",
      },
    ],
    ctaAction: "Generate an Appraisal Form",
    ctaSubtitle: "professional performance reviews in minutes",
    ctaIcon: "letter",
  },
  {
    type: "risk_assessment",
    label: "Risk Assessment",
    targetKeyword: "UK risk assessment template free",
    metaTitle: "Free UK Risk Assessment Template | DocuHive",
    metaDescription:
      "Generate a UK risk assessment template for your workplace. Covers hazards, controls, and action plans. Free to try.",
    heading: "Free UK Risk Assessment Template",
    intro:
      "Risk assessments are a legal requirement for UK employers under the Management of Health and Safety at Work Regulations 1999. Our AI generates a comprehensive risk assessment covering hazard identification, who might be harmed, existing controls, risk rating, and required actions.",
    benefits: [
      "Management of Health and Safety at Work Regulations 1999 compliant",
      "Covers hazard identification, risk rating, controls, and action plan",
      "Suitable for office, retail, warehouse, and construction environments",
      "Download as PDF or Word — ready to implement",
    ],
    whoFor: "UK employers, business owners, and health & safety officers who need to conduct legally required risk assessments.",
    faqs: [
      {
        question: "Is a risk assessment a legal requirement in the UK?",
        answer:
          "Yes. Under the Management of Health and Safety at Work Regulations 1999, every employer must conduct a suitable and sufficient risk assessment of risks to employees and others affected by their business. Businesses with 5+ employees must also record the findings in writing.",
      },
      {
        question: "What should a UK risk assessment include?",
        answer:
          "A UK risk assessment should include: hazards identified, who might be harmed and how, existing control measures, risk rating (likelihood × severity), additional actions required, responsible person, and review date. The HSE provides a simple 5-step framework for risk assessment.",
      },
      {
        question: "How often should risk assessments be reviewed?",
        answer:
          "Risk assessments should be reviewed regularly (at least annually) and whenever significant changes occur — new equipment, processes, premises, or after an accident or near-miss. The review date should be recorded on the assessment.",
      },
    ],
    ctaAction: "Generate a Risk Assessment",
    ctaSubtitle: "HSE-compliant, legally required",
    ctaIcon: "letter",
  },
  {
    type: "health_safety_policy",
    label: "Health & Safety Policy",
    targetKeyword: "UK health and safety policy template",
    metaTitle: "Free UK Health & Safety Policy Template | DocuHive",
    metaDescription:
      "Generate a UK health and safety policy template for your business. Covers employer duties, employee duties, and arrangements. Free to try.",
    heading: "Free UK Health & Safety Policy Template",
    intro:
      "Every UK employer with 5+ employees must have a written health and safety policy. Our AI generates a comprehensive policy covering your statement of intent, organisation (who does what), and arrangements (how you manage specific risks) — compliant with the Health and Safety at Work etc. Act 1974.",
    benefits: [
      "Health and Safety at Work etc. Act 1974 compliant",
      "Three-part structure: statement of intent, organisation, arrangements",
      "Covers fire safety, first aid, DSE, manual handling, and COSHH",
      "Download as PDF or Word — ready to display and distribute",
    ],
    whoFor: "UK employers, business owners, and managers who need a legally required written health and safety policy.",
    faqs: [
      {
        question: "Is a health and safety policy a legal requirement?",
        answer:
          "Yes. Under the Health and Safety at Work etc. Act 1974, all employers with 5 or more employees must have a written health and safety policy. It must be brought to the attention of all employees and reviewed regularly.",
      },
      {
        question: "What are the three parts of a health and safety policy?",
        answer:
          "A health and safety policy has three parts: (1) Statement of intent — your commitment to health and safety, signed by senior management; (2) Organisation — who is responsible for what; (3) Arrangements — the specific procedures and systems in place to manage risks (fire, first aid, DSE, manual handling, etc.).",
      },
      {
        question: "How often should I update my health and safety policy?",
        answer:
          "Review your health and safety policy at least annually, or whenever significant changes occur — new premises, equipment, processes, or after an incident. The policy should be a living document, not something filed away and forgotten.",
      },
    ],
    ctaAction: "Generate a Health & Safety Policy",
    ctaSubtitle: "legally required, HSE-compliant",
    ctaIcon: "letter",
  },
  {
    type: "equal_opportunities_policy",
    label: "Equal Opportunities Policy",
    targetKeyword: "UK equal opportunities policy template",
    metaTitle: "Free UK Equal Opportunities Policy Template | DocuHive",
    metaDescription:
      "Generate a UK equal opportunities policy template. Covers discrimination, harassment, and reasonable adjustments. Free to try.",
    heading: "Free UK Equal Opportunities Policy Template",
    intro:
      "An equal opportunities policy demonstrates your commitment to fairness and helps protect against discrimination claims. Our AI generates a comprehensive UK policy covering the Equality Act 2010 protected characteristics, types of discrimination, harassment, victimisation, and reasonable adjustments.",
    benefits: [
      "Equality Act 2010 compliant — covers all protected characteristics",
      "Covers direct/indirect discrimination, harassment, and victimisation",
      "Includes reasonable adjustments and complaints procedure",
      "Download as PDF or Word — ready to implement",
    ],
    whoFor: "UK employers, HR professionals, and business owners who need a comprehensive equal opportunities policy.",
    faqs: [
      {
        question: "Is an equal opportunities policy a legal requirement?",
        answer:
          "While not explicitly required by law, an equal opportunities policy is strongly recommended. It demonstrates your commitment to the Equality Act 2010, helps prevent discrimination, and is essential evidence if an employment tribunal claim is brought against your business.",
      },
      {
        question: "What protected characteristics does the Equality Act 2010 cover?",
        answer:
          "The Equality Act 2010 protects nine characteristics: age, disability, gender reassignment, marriage and civil partnership, pregnancy and maternity, race, religion or belief, sex, and sexual orientation. Our policy covers all of these.",
      },
      {
        question: "What is a reasonable adjustment?",
        answer:
          "A reasonable adjustment is a change to the workplace or working arrangements that removes or reduces a disadvantage for a disabled employee or job applicant. Examples include: providing assistive technology, adjusting working hours, modifying the workspace, or providing additional training.",
      },
    ],
    ctaAction: "Generate an Equal Opportunities Policy",
    ctaSubtitle: "Equality Act 2010 compliant",
    ctaIcon: "letter",
  },
  {
    type: "maternity_paternity_leave_form",
    label: "Maternity/Paternity Leave Form",
    targetKeyword: "UK maternity leave form template",
    metaTitle: "Free UK Maternity/Paternity Leave Form Template | DocuHive",
    metaDescription:
      "Generate a UK maternity or paternity leave form template. Covers leave dates, statutory pay, and return to work. Free to try.",
    heading: "Free UK Maternity/Paternity Leave Form Template",
    intro:
      "When an employee announces they're expecting, you need the right forms. Our AI generates UK maternity and paternity leave forms covering leave dates, statutory pay entitlement (SMP, SPP), keeping-in-touch days, and return-to-work arrangements — compliant with employment legislation.",
    benefits: [
      "Covers maternity leave, paternity leave, and shared parental leave",
      "Includes SMP/SPP entitlement calculations and notification requirements",
      "Covers KIT (keeping in touch) days and return-to-work process",
      "Download as PDF or Word — ready to give to employees",
    ],
    whoFor: "UK employers, HR professionals, and small business owners managing employee maternity or paternity leave.",
    faqs: [
      {
        question: "What is the statutory maternity leave entitlement in the UK?",
        answer:
          "Eligible employees are entitled to 52 weeks of maternity leave: 26 weeks Ordinary Maternity Leave (OML) and 26 weeks Additional Maternity Leave (AML). Employees must take at least 2 weeks (4 weeks for factory workers) after childbirth. Our form covers the full entitlement.",
      },
      {
        question: "What is statutory paternity leave?",
        answer:
          "Eligible employees are entitled to 1 or 2 consecutive weeks of paternity leave (not 2 separate weeks). They must take it within 56 days of the birth. Statutory Paternity Pay (SPP) is paid at the same rate as SMP. Our form covers both leave and pay.",
      },
      {
        question: "What are KIT days?",
        answer:
          "Keeping in Touch (KIT) days allow employees on maternity leave to work up to 10 days without ending their leave or affecting their statutory pay. KIT days are optional — both employer and employee must agree. They're useful for training, meetings, or phased return to work.",
      },
    ],
    ctaAction: "Generate a Leave Form",
    ctaSubtitle: "SMP/SPP compliant, ready to use",
    ctaIcon: "letter",
  },
  {
    type: "job_description",
    label: "Job Description",
    targetKeyword: "UK job description template",
    metaTitle: "Free UK Job Description Template | DocuHive",
    metaDescription:
      "Generate a professional UK job description template. Covers role, responsibilities, requirements, and benefits. Free to try.",
    heading: "Free UK Job Description Template",
    intro:
      "A well-written job description attracts the right candidates and sets clear expectations. Our AI generates professional UK job descriptions covering role purpose, key responsibilities, person specification, qualifications, and benefits — ready to post on job boards or share with recruiters.",
    benefits: [
      "Professional format covering all essential job description elements",
      "Person specification with essential and desirable criteria",
      "Includes salary, benefits, and working arrangements",
      "Download as PDF or Word — ready to publish",
    ],
    whoFor: "UK employers, hiring managers, and small business owners creating job descriptions for recruitment.",
    faqs: [
      {
        question: "What should a UK job description include?",
        answer:
          "A comprehensive job description should include: job title, reporting structure, role purpose, key responsibilities and duties, person specification (essential and desirable criteria), qualifications and experience, salary and benefits, working hours and location, and any special conditions (e.g. DBS check).",
      },
      {
        question: "Can a job description be used in employment tribunal claims?",
        answer:
          "Yes. A job description can be used as evidence in employment tribunal claims, particularly for discrimination, unfair dismissal, or breach of contract. Ensure your job descriptions are accurate, up to date, and do not contain discriminatory language.",
      },
      {
        question: "How often should job descriptions be updated?",
        answer:
          "Review job descriptions whenever the role changes significantly, or at least annually. Outdated job descriptions can lead to confusion about responsibilities and may not reflect the actual role, which can cause performance management issues.",
      },
    ],
    ctaAction: "Generate a Job Description",
    ctaSubtitle: "attract the right candidates",
    ctaIcon: "letter",
  },
  {
    type: "consultant_agreement",
    label: "Consultant Agreement",
    targetKeyword: "UK consultant agreement template",
    metaTitle: "Free UK Consultant Agreement Template | DocuHive",
    metaDescription:
      "Generate a UK consultant agreement template. Covers scope, deliverables, fees, IP, and termination. Free to try.",
    heading: "Free UK Consultant Agreement Template",
    intro:
      "A consultant agreement formalises the relationship between a business and an external consultant. Our AI generates a comprehensive UK consultant agreement covering scope of work, deliverables, fees and expenses, intellectual property, confidentiality, and termination — protecting both parties.",
    benefits: [
      "Covers scope, deliverables, fees, expenses, and payment schedule",
      "Includes IP ownership, confidentiality, and non-solicitation clauses",
      "Professional format suitable for management, IT, and strategy consultants",
      "Download as PDF or Word — ready to sign",
    ],
    whoFor: "UK consultants, agencies, and businesses hiring external consultants for project-based or ongoing advisory work.",
    faqs: [
      {
        question: "What's the difference between a consultant agreement and a service agreement?",
        answer:
          "A consultant agreement is typically used for advisory or strategic engagements where the consultant provides expertise and recommendations. A service agreement is broader and covers any type of service provision. Consultant agreements often include more detailed IP and confidentiality provisions.",
      },
      {
        question: "Should a consultant agreement include IR35 considerations?",
        answer:
          "Yes. If the consultant is an individual (not a limited company), IR35 may apply. The agreement should clearly establish the consultant's independence — no control over how work is done, right of substitution, no employee benefits, and no mutuality of obligation.",
      },
      {
        question: "What payment structures work for consultants?",
        answer:
          "Common payment structures include: daily or hourly rate (most common for management consultants), fixed fee per project (for defined deliverables), retainer (for ongoing advisory), and success fee (for results-based engagements, e.g. fundraising). Include expenses policy and invoicing schedule.",
      },
    ],
    ctaAction: "Generate a Consultant Agreement",
    ctaSubtitle: "protect your consulting engagement",
    ctaIcon: "contract",
  },
  {
    type: "flexible_working_request",
    label: "Flexible Working Request",
    targetKeyword: "UK flexible working request form template",
    metaTitle: "Free UK Flexible Working Request Form Template | DocuHive",
    metaDescription:
      "Generate a UK flexible working request form template. Covers request types, reasons, and employer response. Free to try.",
    heading: "Free UK Flexible Working Request Form Template",
    intro:
      "Since April 2024, all UK employees have the right to request flexible working from day one of employment. Our AI generates a compliant flexible working request form covering the type of flexible working requested (hours, times, location), reasons, and expected impact — ready for your HR process.",
    benefits: [
      "Day-one right to request flexible working compliant (2024 changes)",
      "Covers all flexible working types: part-time, compressed hours, flexitime, remote",
      "Includes employee statement and employer response sections",
      "Download as PDF or Word — ready to implement",
    ],
    whoFor: "UK employers and HR professionals managing flexible working requests under the new day-one right legislation.",
    faqs: [
      {
        question: "What are the new flexible working rules from April 2024?",
        answer:
          "From April 2024, all employees have the right to request flexible working from day one of employment (previously required 26 weeks' service). Employees can make two requests per year, and employers must respond within two months. Requests can only be refused on one of eight statutory grounds.",
      },
      {
        question: "What types of flexible working can be requested?",
        answer:
          "Employees can request changes to: hours (part-time, job share), times (flexitime, compressed hours, staggered hours), and location (hybrid working, fully remote). The request must be a permanent change to the employment contract, not a temporary arrangement.",
      },
      {
        question: "How should employers handle flexible working requests?",
        answer:
          "Employers must handle requests in a reasonable manner: acknowledge receipt, discuss with the employee if needed, consider alternatives if the request can't be accommodated, and notify the decision within two months. Refusals must be based on one of eight statutory grounds and clearly explained.",
      },
    ],
    ctaAction: "Generate a Flexible Working Request Form",
    ctaSubtitle: "day-one right compliant, ready to use",
    ctaIcon: "letter",
  },
  {
    type: "data_processing_agreement",
    label: "Data Processing Agreement",
    targetKeyword: "UK data processing agreement template",
    metaTitle: "Free UK Data Processing Agreement Template | DocuHive",
    metaDescription:
      "Generate a UK GDPR data processing agreement template. Covers data processing instructions, security, and sub-processors. Free to try.",
    heading: "Free UK Data Processing Agreement Template",
    intro:
      "Under UK GDPR, whenever you engage a third party to process personal data on your behalf, you need a data processing agreement (DPA). Our AI generates a compliant DPA covering processing instructions, data security measures, sub-processor authorisation, data breach notification, and data subject rights — compliant with Article 28 of UK GDPR.",
    benefits: [
      "Article 28 UK GDPR compliant",
      "Covers processing instructions, security measures, and sub-processors",
      "Includes data breach notification, data subject rights, and audit rights",
      "Download as PDF or Word — ready to sign with your processors",
    ],
    whoFor: "UK businesses that engage third-party data processors (cloud services, payroll providers, CRM platforms, etc.) and need a compliant DPA.",
    faqs: [
      {
        question: "Is a data processing agreement a legal requirement?",
        answer:
          "Yes. Under Article 28 of UK GDPR, a DPA is mandatory whenever a data controller engages a data processor. The agreement must set out the subject matter, duration, nature and purpose of processing, types of personal data, categories of data subjects, and the controller's obligations and rights.",
      },
      {
        question: "What should a UK DPA include?",
        answer:
          "A UK DPA must include: processing instructions and scope, confidentiality obligations, security measures (technical and organisational), sub-processor authorisation (general or specific), data breach notification procedures, data subject rights assistance, data deletion/return obligations, audit rights, and international transfer safeguards (if applicable).",
      },
      {
        question: "Do I need a DPA with every third-party service?",
        answer:
          "You need a DPA with any third party that processes personal data on your behalf (data processors). This includes: cloud hosting providers, email marketing platforms, CRM systems, payroll software, analytics tools, and customer support platforms. You do not need a DPA with independent data controllers (e.g. HMRC, your accountant).",
      },
    ],
    ctaAction: "Generate a Data Processing Agreement",
    ctaSubtitle: "Article 28 UK GDPR compliant",
    ctaIcon: "contract",
  },
  {
    type: "privacy_policy",
    label: "Privacy Policy (Business)",
    targetKeyword: "UK business privacy policy template",
    metaTitle: "Free UK Business Privacy Policy Template | DocuHive",
    metaDescription:
      "Generate a UK business privacy policy template. Covers data collection, cookies, third parties, and user rights. Free to try.",
    heading: "Free UK Business Privacy Policy Template",
    intro:
      "Every UK business website that collects personal data needs a privacy policy. Our AI generates a comprehensive business privacy policy covering what data you collect, how you use it, cookies and tracking, third-party sharing, data retention, and individuals' rights under UK GDPR and the Privacy and Electronic Communications Regulations (PECR).",
    benefits: [
      "UK GDPR and PECR compliant",
      "Covers data collection, cookies, third parties, and retention",
      "Includes all individual rights: access, erasure, portability, objection",
      "Download as PDF or Word — publish on your website",
    ],
    whoFor: "UK business website owners, e-commerce sites, and any organisation that collects personal data through their website.",
    faqs: [
      {
        question: "Is a privacy policy required on a UK business website?",
        answer:
          "Yes. Under UK GDPR, you must provide a privacy notice when you collect personal data. For websites, this is typically published as a privacy policy. It must be easily accessible, written in clear language, and cover all the required information under Articles 13 and 14.",
      },
      {
        question: "What's the difference between a privacy policy and a privacy notice?",
        answer:
          "The terms are often used interchangeably. Technically, a privacy notice is the information you provide to individuals at the point of data collection, while a privacy policy is the broader document describing your overall data processing practices. In practice, most UK businesses use a single document that serves both purposes.",
      },
      {
        question: "Do I need a separate cookie policy?",
        answer:
          "Under PECR, you must tell visitors what cookies you use and get consent for non-essential cookies. Many businesses include cookie information in their privacy policy, but a separate cookie policy or a cookie consent banner is also common. Our privacy policy includes a section on cookies and tracking.",
      },
    ],
    ctaAction: "Generate a Privacy Policy",
    ctaSubtitle: "UK GDPR and PECR compliant",
    ctaIcon: "contract",
  },
  {
    type: "disciplinary_grievance_letters",
    label: "Disciplinary & Grievance Letters",
    targetKeyword: "UK disciplinary letter template",
    metaTitle: "Free UK Disciplinary & Grievance Letter Templates | DocuHive",
    metaDescription:
      "Generate UK disciplinary and grievance letter templates. Covers investigation, hearing, outcome, and appeal. Free to try.",
    heading: "Free UK Disciplinary & Grievance Letter Templates",
    intro:
      "Handling disciplinary and grievance matters correctly is critical for avoiding employment tribunal claims. Our AI generates UK-compliant letters for the full ACAS code of practice process — investigation invitation, hearing invitation, outcome letter, and appeal — for both disciplinary and grievance procedures.",
    benefits: [
      "ACAS Code of Practice compliant",
      "Covers investigation, hearing, outcome, and appeal stages",
      "Separate templates for disciplinary and grievance procedures",
      "Download as PDF or Word — ready to send",
    ],
    whoFor: "UK employers, HR professionals, and managers handling disciplinary or grievance procedures who need compliant letters.",
    faqs: [
      {
        question: "What is the ACAS Code of Practice?",
        answer:
          "The ACAS Code of Practice on Disciplinary and Grievance Procedures sets out the minimum standards for handling disciplinary and grievance issues in the UK. Employment tribunals can increase or decrease awards by up to 25% if either party fails to follow the code. Our letters follow the code's recommended process.",
      },
      {
        question: "What letters are needed for a disciplinary process?",
        answer:
          "A fair disciplinary process typically requires: (1) investigation invitation letter, (2) disciplinary hearing invitation letter (with details of allegations and potential outcomes), (3) outcome letter (setting out the decision, reasons, and appeal rights), and (4) appeal hearing invitation and outcome letters if applicable.",
      },
      {
        question: "What should a disciplinary outcome letter include?",
        answer:
          "A disciplinary outcome letter should include: the decision (no action, written warning, final written warning, or dismissal), the reasons for the decision, the duration of any warning, the expected improvement, the consequences of further misconduct, and the right to appeal with details of the appeal process.",
      },
    ],
    ctaAction: "Generate Disciplinary Letters",
    ctaSubtitle: "ACAS compliant, tribunal-ready",
    ctaIcon: "letter",
  },
]
