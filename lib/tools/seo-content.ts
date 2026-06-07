/**
 * SEO content data for tool landing pages.
 * Each entry targets a long-tail UK search query for a free business calculator/tool.
 */
import type { LandingSEOData } from "@/lib/landing/seo-content"

export const TOOL_LANDING_PAGES: LandingSEOData[] = [
  // ── VAT Calculator ──
  {
    type: "vat",
    label: "VAT Calculator",
    targetKeyword: "VAT calculator UK free",
    metaTitle: "Free UK VAT Calculator | Add & Remove VAT Online | DocuHive",
    metaDescription:
      "Free UK VAT calculator — add or remove VAT at 20%, 5%, and 0% rates. Calculate net to gross or gross to net instantly. No sign-up required.",
    heading: "Free UK VAT Calculator",
    intro:
      "Calculate VAT quickly and accurately with our free UK VAT calculator. Whether you need to add VAT to a net price or extract VAT from a gross amount, our tool handles standard (20%), reduced (5%), and zero (0%) rates. Used by small business owners, freelancers, and sole traders across the UK to prepare invoices, quotes, and VAT returns in seconds.",
    benefits: [
      "Supports all UK VAT rates — 20% standard, 5% reduced, and 0% zero-rated",
      "Two modes: calculate VAT-inclusive from net, or extract VAT from gross",
      "Instant results with automatic rounding to 2 decimal places",
      "Works seamlessly with our free invoice generator for professional VAT invoices",
    ],
    whoFor: "UK small business owners, sole traders, freelancers, and accountants who need a quick, accurate VAT calculation without firing up spreadsheet software or expensive accounting tools.",
    faqs: [
      {
        question: "How do I calculate VAT on a net price?",
        answer:
          "To add VAT to a net price, multiply the net amount by the VAT rate (e.g., £100 × 20% = £20 VAT). The gross amount is net + VAT (£120). Our calculator does this instantly — just enter the net amount and select your rate.",
      },
      {
        question: "How do I remove VAT from a gross price?",
        answer:
          "To extract VAT from a gross price, divide by 1 + the VAT rate (e.g., £120 ÷ 1.2 = £100 net). Our calculator handles this automatically when you switch to 'gross → net' mode.",
      },
      {
        question: "Do I need to register for VAT as a small business?",
        answer:
          "You must register for VAT if your UK taxable turnover exceeds £90,000 in any rolling 12-month period (2026/27 threshold). Below this, registration is voluntary. Even if not registered, our calculator helps you understand VAT impacts on pricing.",
      },
      {
        question: "Can I use this calculator for VAT returns?",
        answer:
          "Our VAT calculator is ideal for quick day-to-day calculations and invoice preparation. For official VAT returns submitted to HMRC, always use HMRC-recognised accounting software or your accountant, as rounding may differ across multiple transactions.",
      },
    ],
    ctaAction: "Calculate VAT Now",
    ctaSubtitle: "free, no sign-up required, works instantly",
    ctaIcon: "invoice",
  },
  // ── PAYE Calculator ──
  {
    type: "paye",
    label: "PAYE Calculator",
    targetKeyword: "PAYE calculator UK take home pay",
    metaTitle: "Free UK PAYE Calculator | Take-Home Pay Calculator | DocuHive",
    metaDescription:
      "Calculate your UK take-home pay after tax, National Insurance, and pension deductions. Free PAYE calculator for 2026/27 tax year. No sign-up needed.",
    heading: "Free UK PAYE Calculator",
    intro:
      "Work out your exact take-home pay with our free UK PAYE calculator. Enter your gross salary and we calculate Income Tax, National Insurance contributions, and pension deductions based on the latest 2026/27 tax rates and thresholds. Perfect for employees, employers, and contractors who need to understand their net pay.",
    benefits: [
      "Calculates Income Tax, National Insurance, and pension contributions automatically",
      "Uses current 2026/27 tax year rates, bands, and thresholds",
      "Shows a clear breakdown of gross pay, deductions, and net take-home pay",
      "Supports both monthly and annual salary views for easy budgeting",
    ],
    whoFor: "UK employees planning their personal finances, employers calculating payroll costs, and contractors estimating their take-home pay after tax and NI deductions.",
    faqs: [
      {
        question: "How is PAYE income tax calculated in the UK?",
        answer:
          "PAYE tax is calculated on your taxable earnings above your Personal Allowance (£12,570 for 2026/27). Basic rate (20%) applies to earnings from £12,571 to £50,270, higher rate (40%) from £50,271 to £125,140, and additional rate (45%) above £125,140. Our calculator applies these bands automatically.",
      },
      {
        question: "What National Insurance rates apply for 2026/27?",
        answer:
          "For employees, Class 1 NI is 8% on earnings between £12,570 and £50,270 per year, and 2% on earnings above £50,270. Employers also pay Class 1 NI at 15% on earnings above £5,000 (the secondary threshold, raised from 13.8% and £9,100 in April 2025). Our calculator shows both employee and employer NI where applicable.",
      },
      {
        question: "Does the calculator include pension contributions?",
        answer:
          "Yes. You can enter your pension contribution percentage (both employee and employer if relevant). We calculate the deduction based on qualifying earnings, including the auto-enrolment minimum (8% total, 3% employer, 5% employee).",
      },
      {
        question: "Is this calculator HMRC-accurate for tax planning?",
        answer:
          "Our PAYE calculator provides a close estimate based on standard tax codes and rates. For exact figures, your tax code, benefits-in-kind, and other adjustments may affect the result. Use this for planning and reference — always check your HMRC tax code for precise calculations.",
      },
    ],
    ctaAction: "Calculate Take-Home Pay",
    ctaSubtitle: "free PAYE calculator for the 2026/27 tax year",
    ctaIcon: "payslip",
  },
  // ── Corporation Tax Calculator ──
  {
    type: "corporation-tax",
    label: "Corporation Tax Calculator",
    targetKeyword: "UK corporation tax calculator 2026/27",
    metaTitle: "Free UK Corporation Tax Calculator | 2026/27 Rates | DocuHive",
    metaDescription:
      "Calculate UK corporation tax on your company profits. Free calculator using current 25% and 19% rates with marginal relief. No sign-up required.",
    heading: "Free UK Corporation Tax Calculator",
    intro:
      "Calculate how much corporation tax your UK limited company owes with our free calculator. Based on the current 2026/27 rates — 19% for profits up to £50,000, 25% for profits over £250,000, and marginal relief for profits between £50,001 and £250,000. Get a clear estimate in seconds.",
    benefits: [
      "Applies the correct corporation tax rate based on your profit band",
      "Includes marginal relief calculations for profits between £50k and £250k",
      "Shows a clear breakdown: taxable profits, tax rate, and final tax due",
      "Ideal for year-end tax planning and estimated payment calculations",
    ],
    whoFor: "UK limited company directors, small business owners, and accountants who need a quick corporation tax estimate for budgeting, forecasting, or year-end planning.",
    faqs: [
      {
        question: "What are the current UK corporation tax rates?",
        answer:
          "For the 2026/27 tax year, the main rate is 25% for companies with profits over £250,000. The small profits rate is 19% for profits up to £50,000. Marginal relief applies between £50,001 and £250,000, giving an effective rate between 19% and 25%.",
      },
      {
        question: "How does marginal relief work for corporation tax?",
        answer:
          "Marginal relief gradually increases the effective tax rate from 19% to 25% as profits rise from £50,000 to £250,000. The relief fraction is 3/200 for that band. Our calculator handles this automatically so you don't need to work through the formula.",
      },
      {
        question: "When do I pay corporation tax?",
        answer:
          "Corporation tax is due 9 months and 1 day after the end of your company's accounting period. You must file your Company Tax Return (CT600) within 12 months of the period end. Payments on account may be required for larger companies.",
      },
      {
        question: "Can I deduct expenses before calculating corporation tax?",
        answer:
          "Yes. Corporation tax is calculated on your taxable profits — revenue minus allowable expenses. Allowable expenses include staff costs, office rent, utilities, equipment, marketing, and professional fees. Capital allowances may also be available for asset purchases.",
      },
    ],
    ctaAction: "Calculate Corporation Tax",
    ctaSubtitle: "accurate rates for the 2026/27 tax year",
    ctaIcon: "invoice",
  },
  // ── Dividend Calculator ──
  {
    type: "dividend",
    label: "Dividend Calculator",
    targetKeyword: "UK dividend tax calculator 2026/27",
    metaTitle: "Free UK Dividend Tax Calculator | 2026/27 Rates | DocuHive",
    metaDescription:
      "Calculate dividend tax on UK dividends for 2026/27. Free calculator with £500 allowance, basic/higher/additional rates. No sign-up needed.",
    heading: "Free UK Dividend Tax Calculator",
    intro:
      "Calculate the tax you'll pay on dividends from your UK company or investments. Our free calculator uses the current 2026/27 tax year rates — including the £500 dividend allowance, basic rate (10.75%), higher rate (35.75%), and additional rate (39.35%). Essential for limited company directors who pay themselves through dividends.",
    benefits: [
      "Applies the correct dividend tax rate based on your total income band",
      "Includes the £500 dividend tax allowance for 2026/27",
      "Accounts for salary and other income for accurate marginal rate calculation",
      "Shows effective tax rate on dividend income after all allowances",
    ],
    whoFor: "UK limited company directors who take dividends as part of their remuneration, investors receiving dividend income, and contractors operating through their own limited company.",
    faqs: [
      {
        question: "What is the dividend allowance for 2026/27?",
        answer:
          "The dividend allowance for 2026/27 is £500 — meaning the first £500 of dividend income is tax-free. This was reduced from £1,000 in 2024/25 and from £2,000 in previous years. Dividends above £500 are taxed at your marginal rate.",
      },
      {
        question: "What are the dividend tax rates for 2026/27?",
        answer:
          "Dividend tax rates depend on your income tax band: basic rate taxpayers pay 10.75%, higher rate taxpayers pay 35.75%, and additional rate taxpayers pay 39.35% on dividends above the £500 allowance. Our calculator applies the correct rate based on your total income.",
      },
      {
        question: "Is it more tax-efficient to take salary or dividends?",
        answer:
          "Dividends are often more tax-efficient than salary because no National Insurance is payable on dividends. However, salary counts as an allowable expense for corporation tax and builds qualifying years for State Pension. Many directors take a small salary (up to the NI threshold) and the remainder as dividends.",
      },
      {
        question: "How do dividends interact with my personal allowance?",
        answer:
          "Dividends are taxed after your personal allowance (£12,570 for 2026/27) and after other income. The £500 dividend allowance is on top of your personal allowance. Dividends within your personal allowance or basic rate band are taxed at 10.75%, while those in the higher rate band are taxed at 35.75%.",
      },
    ],
    ctaAction: "Calculate Dividend Tax",
    ctaSubtitle: "accurate rates including the £500 allowance",
    ctaIcon: "payslip",
  },
  // ── Expenses Calculator ──
  {
    type: "expenses",
    label: "Expenses Calculator",
    targetKeyword: "UK business expenses calculator",
    metaTitle: "Free UK Business Expenses Calculator | DocuHive",
    metaDescription:
      "Calculate allowable business expenses and mileage deductions for UK self-assessment. Free calculator using HMRC approved rates. No sign-up needed.",
    heading: "Free UK Business Expenses Calculator",
    intro:
      "Track and calculate your allowable business expenses with our free expenses calculator. From mileage at HMRC-approved rates to home office costs and professional fees, see exactly how much you can claim against your self-assessment tax return. Essential for sole traders, freelancers, and limited company directors.",
    benefits: [
      "Calculate mileage expenses at HMRC-approved rates (45p per mile for business miles)",
      "Estimate home office expenses using the simplified or actual cost method",
      "Track common allowable expenses: equipment, software, marketing, travel, and training",
      "View total annual savings estimate based on your tax band",
    ],
    whoFor: "UK sole traders, freelancers, contractors, and small business owners who need to calculate allowable expenses for their self-assessment tax return.",
    faqs: [
      {
        question: "What business expenses can I claim in the UK?",
        answer:
          "Common allowable expenses include: office costs (rent, utilities, insurance), travel and mileage, staff costs, professional fees (accountant, solicitor), marketing and advertising, equipment and software, training courses, and business entertainment. All expenses must be 'wholly and exclusively' for business purposes.",
      },
      {
        question: "What is the HMRC mileage rate for 2026/27?",
        answer:
          "The HMRC approved mileage rate is 45p per mile for the first 10,000 business miles in a tax year, and 25p per mile thereafter for cars and vans. Motorcycle rate is 24p per mile, and bicycle rate is 20p per mile. Our calculator uses these rates automatically.",
      },
      {
        question: "Can I claim home office expenses?",
        answer:
          "Yes. You can claim either the simplified flat rate of £6 per week (£312 per year) for working from home, or the actual costs method (proportion of rent, utilities, broadband, etc.). The actual costs method requires calculating the business-use percentage of your home.",
      },
      {
        question: "How do expenses reduce my tax bill?",
        answer:
          "Allowable expenses are deducted from your gross income before tax is calculated. For example, if you earn £40,000 and have £5,000 of allowable expenses, you're only taxed on £35,000. At the basic rate (20%), that saves you £1,000 in tax.",
      },
    ],
    ctaAction: "Calculate Your Expenses",
    ctaSubtitle: "HMRC-approved rates for 2026/27",
    ctaIcon: "invoice",
  },
  // ── Statutory Payments Calculator ──
  {
    type: "statutory-payments",
    label: "Statutory Payments Calculator",
    targetKeyword: "UK statutory pay calculator SMP SSP SPP",
    metaTitle: "Free UK Statutory Payments Calculator | SMP SSP SPP | DocuHive",
    metaDescription:
      "Calculate UK statutory payments: maternity (SMP), paternity (SPP), sick pay (SSP), and more. Free calculator with current 2026/27 rates. No sign-up needed.",
    heading: "Free UK Statutory Payments Calculator",
    intro:
      "Work out how much statutory pay your employees are entitled to with our free calculator. Covers Statutory Maternity Pay (SMP), Statutory Paternity Pay (SPP), Statutory Sick Pay (SSP), Shared Parental Pay (ShPP), and Adoption Pay (SAP) — all using current 2026/27 rates and qualifying criteria.",
    benefits: [
      "Covers all UK statutory payments: SMP, SPP, SSP, ShPP, and SAP in one tool",
      "Uses current 2026/27 weekly rates (£194.32 standard weekly rate for SMP/SPP/SAP/ShPP; £123.25 SSP weekly rate)",
      "Shows qualifying criteria and eligibility periods for each payment type",
      "Includes employer recovery options (small employer NIC rebate)",
    ],
    whoFor: "UK employers, HR professionals, and small business owners who need to calculate statutory payments for their employees and understand employer recovery mechanisms.",
    faqs: [
      {
        question: "What is the current rate for statutory payments in 2026/27?",
        answer:
          "The standard weekly rate for SMP, SPP, ShPP, and SAP is £194.32 (or 90% of average weekly earnings if lower). SSP is paid at the lower of 80% of AWE or £123.25 per week flat rate (from April 2026, payable from day 1 — no waiting days). The earnings threshold for SSP eligibility is £129 per week (Lower Earnings Limit). Our calculator uses these exact figures.",
      },
      {
        question: "How long does Statutory Maternity Pay last?",
        answer:
          "SMP is paid for up to 39 weeks. The first 6 weeks are paid at 90% of average weekly earnings, followed by 33 weeks at the standard rate (£194.32) or 90% of earnings (whichever is lower). Employees are also entitled to 52 weeks of maternity leave.",
      },
      {
        question: "Can employers reclaim statutory payments?",
        answer:
          "Yes. Employers can reclaim 92% of SMP, SPP, ShPP, and SAP payments from HMRC (plus 3% compensation on the reclaimed amount). Small employers (total NI contributions under £45,000) can reclaim 103% (100% + 3% compensation). SSP is not generally reclaimable.",
      },
      {
        question: "When does an employee qualify for Statutory Sick Pay?",
        answer:
          "Employees qualify for SSP if they earn at least £129 per week (the Lower Earnings Limit, 2026/27 threshold), have been sick for at least 4 consecutive days (including non-working days), and follow the company's sickness reporting procedure. SSP is paid from day 1 of sickness (no waiting days from April 2026) for up to 28 weeks.",
      },
    ],
    ctaAction: "Calculate Statutory Payments",
    ctaSubtitle: "SMP, SSP, SPP — all current 2026/27 rates",
    ctaIcon: "payslip",
  },
  // ── Holiday Entitlement Calculator ──
  {
    type: "holiday-entitlement",
    label: "Holiday Entitlement Calculator",
    targetKeyword: "UK holiday entitlement calculator 2026/27",
    metaTitle: "Free UK Holiday Entitlement Calculator | Statutory Leave | DocuHive",
    metaDescription:
      "Calculate statutory holiday entitlement for UK employees. Supports full-time, part-time, irregular hours, and casual workers. Free tool, no sign-up needed.",
    heading: "Free UK Holiday Entitlement Calculator",
    intro:
      "Calculate exactly how much annual leave your employees are entitled to under UK law. Our free calculator supports all working patterns — full-time (28 days including bank holidays), part-time (pro-rata), irregular or zero-hours (accrual method), and casual workers. Compliant with the Working Time Regulations 1998 and the Employment Rights Act 1996.",
    benefits: [
      "Supports full-time, part-time, irregular hours, and casual worker patterns",
      "Calculates pro-rata entitlement for part-time employees automatically",
      "Uses the 12.07% accrual method for irregular and zero-hours workers",
      "Shows entitlement including and excluding bank holidays",
    ],
    whoFor: "UK employers, HR managers, and small business owners who need to calculate annual leave entitlement for employees with any working pattern.",
    faqs: [
      {
        question: "What is the minimum statutory holiday entitlement in the UK?",
        answer:
          "Full-time employees (5 days a week) are entitled to 28 days (5.6 weeks) of paid annual leave per year. This includes bank holidays. Part-time employees are entitled to pro-rata — e.g., a 3-day-a-week employee gets 28 × 3/5 = 16.8 days.",
      },
      {
        question: "How do I calculate holiday for an irregular hours worker?",
        answer:
          "For workers with irregular hours or zero-hours contracts, holiday entitlement accrues at 12.07% of hours worked. For every hour worked, the worker accrues 0.1207 hours of paid holiday. This method was confirmed by the Supreme Court in Harpur Trust v Brazel.",
      },
      {
        question: "Can bank holidays be included in the 28-day entitlement?",
        answer:
          "Yes. The 28-day statutory entitlement (5.6 weeks) can include bank holidays. Many employers give bank holidays plus additional leave to make up the total. Our calculator shows both options so you can decide how to structure your holiday year.",
      },
      {
        question: "What is the 'leave year' and how do I set it up?",
        answer:
          "The leave year is the 12-month period over which holiday entitlement is calculated. Common leave years include: calendar year (Jan-Dec), tax year (Apr-Mar), or the employee's start date anniversary. You can choose any 12-month period, but it must be clearly stated in the employment contract.",
      },
    ],
    ctaAction: "Calculate Holiday Entitlement",
    ctaSubtitle: "for full-time, part-time, and irregular hours",
    ctaIcon: "payslip",
  },
  // ── Invoice Generator ──
  {
    type: "invoice",
    label: "Invoice Generator",
    targetKeyword: "free UK invoice generator",
    metaTitle: "Free UK Invoice Generator | Create Invoices Online | DocuHive",
    metaDescription:
      "Create professional UK invoices with VAT breakdown. Free invoice generator for small businesses and freelancers. Download as PDF. No sign-up required.",
    heading: "Free UK Invoice Generator",
    intro:
      "Create professional, VAT-compliant invoices for your UK business in seconds. Our free invoice generator handles all the details — your business information, client details, line items with VAT rates, payment terms, and invoice numbering. Download as PDF ready to email or print. Perfect for freelancers, sole traders, and small businesses who need a quick invoice without subscription fees.",
    benefits: [
      "Automatic VAT calculation at UK rates — add items with 20%, 5%, or 0% VAT",
      "Professional layout with your business details and client information",
      "Automatic invoice numbering and date tracking for easy record-keeping",
      "Download as PDF — ready to email or print, with payment terms included",
    ],
    whoFor: "UK freelancers, sole traders, contractors, and small business owners who need to create professional invoices quickly without paying for subscription-based accounting software.",
    faqs: [
      {
        question: "What must a UK invoice include?",
        answer:
          "A VAT-eligible UK invoice must include: a unique invoice number, your business name and address, your VAT number (if registered), the client's name and address, invoice date, a description of goods/services, the date of supply, the net amount, VAT rate and amount, the total (gross), and payment terms. Our generator includes all of these.",
      },
      {
        question: "Do I need to be VAT-registered to use this invoice generator?",
        answer:
          "No. You can use our generator whether or not you're VAT-registered. If you're not registered, invoices simply show no VAT. If you are registered, select the appropriate VAT rate and the invoice will show the correct VAT breakdown.",
      },
      {
        question: "What payment terms should I include on my invoice?",
        answer:
          "Common UK payment terms include: '30 days from invoice date', '14 days from invoice date', or 'upon receipt'. You can also specify late payment interest under the Late Payment of Commercial Debts (Interest) Act 1998 — statutory interest is 8% plus the Bank of England base rate.",
      },
      {
        question: "Is this invoice generator free to use?",
        answer:
          "Yes. Our invoice generator is completely free — no sign-up required, no subscription fees, no hidden charges. Create as many invoices as you need and download them as PDFs. If you want to save and manage invoices, you can sign up for a free DocuHive account.",
      },
    ],
    ctaAction: "Create an Invoice",
    ctaSubtitle: "free, professional, VAT-compliant",
    ctaIcon: "invoice",
  },
  // ── Time Tracking Calculator ──
  {
    type: "time-tracking",
    label: "Time Tracking Calculator",
    targetKeyword: "free time tracking calculator UK",
    metaTitle: "Free Time Tracking Calculator | Billable Hours UK | DocuHive",
    metaDescription:
      "Track billable hours and calculate earnings with our free time tracking calculator. Perfect for UK freelancers and contractors. No sign-up required.",
    heading: "Free Time Tracking Calculator",
    intro:
      "Track your billable hours and calculate earnings instantly with our free time tracking calculator. Enter your hourly rate and the time spent on a task — we calculate the total charge, including overtime rates if applicable. Perfect for UK freelancers, contractors, and consultants who bill by the hour or day.",
    benefits: [
      "Calculate billable amounts from hours worked and your hourly/day rate",
      "Supports overtime rate multipliers (1.5x, 2x) for after-hours work",
      "Track multiple time entries and see total hours and total billable amount",
      "Seamlessly transfer time tracking data to create professional invoices",
    ],
    whoFor: "UK freelancers, hourly contractors, consultants, and agencies who need to track billable hours and calculate client charges accurately.",
    faqs: [
      {
        question: "How do I calculate billable hours?",
        answer:
          "Billable hours are the hours you work on a client project multiplied by your agreed hourly rate. For example, 7.5 hours at £50/hour = £375. Include any agreed overtime or premium rates. Our calculator handles all of this automatically.",
      },
      {
        question: "Should I charge in 15-minute or 6-minute increments?",
        answer:
          "Many UK freelancers and agencies bill in 6-minute (0.1 hour) or 15-minute (0.25 hour) increments. 6-minute increments are common in legal and consulting, while 15-minute increments are typical for general freelancing. Choose the increment that matches your industry standard.",
      },
      {
        question: "Can I use this for project estimates?",
        answer:
          "Absolutely. Enter your estimated hours and rate to generate a project quote. Then track actual hours against the estimate to see if you're on budget. This helps with accurate quoting for future projects.",
      },
      {
        question: "How do I convert tracked hours into an invoice?",
        answer:
          "Our invoice generator works alongside the time tracking calculator. Once you've tracked your hours, you can use the calculated amount to create a professional invoice with our free invoice generator — including your hourly rate breakdown as line items.",
      },
    ],
    ctaAction: "Track Your Hours",
    ctaSubtitle: "free billable hours calculator for freelancers",
    ctaIcon: "invoice",
  },
  // ── Cash Flow Calculator ──
  {
    type: "cash-flow",
    label: "Cash Flow Calculator",
    targetKeyword: "UK cash flow calculator small business",
    metaTitle: "Free UK Cash Flow Calculator | Business Cash Flow | DocuHive",
    metaDescription:
      "Forecast your small business cash flow with our free calculator. Track income, expenses, and net position. Free tool for UK businesses, no sign-up needed.",
    heading: "Free UK Cash Flow Calculator",
    intro:
      "Take control of your business finances with our free cash flow calculator. Track your monthly income and expenses to forecast your net cash position over the coming months. Essential for UK small business owners, sole traders, and startup founders who need to plan for growth, manage seasonal fluctuations, and avoid cash flow crunches.",
    benefits: [
      "Track multiple income streams and expense categories in one view",
      "Forecast net cash position across future months",
      "Identify potential cash shortfalls before they become problems",
      "Export data to create professional financial reports or invoices",
    ],
    whoFor: "UK small business owners, startup founders, sole traders, and freelancers who need to understand and plan their business cash flow for better financial decision-making.",
    faqs: [
      {
        question: "What's the difference between cash flow and profit?",
        answer:
          "Cash flow is the actual money moving in and out of your business bank account. Profit is revenue minus expenses on an accrual basis. A profitable business can fail due to poor cash flow if customers pay late or seasonal dips cause shortfalls. Managing both is essential.",
      },
      {
        question: "How far ahead should I forecast cash flow?",
        answer:
          "Most UK small businesses should forecast at least 3 months ahead, with 6-12 months being ideal for planning. A 12-week rolling forecast is a good practice — it's long enough to spot trends but short enough to be reasonably accurate. Update it weekly as new information comes in.",
      },
      {
        question: "What are common causes of cash flow problems?",
        answer:
          "Common causes include: late-paying customers, seasonal revenue dips, unexpected expenses (equipment failure, tax bills), over-investment in stock, rapid growth (needing to pay staff before invoices are paid), and failing to invoice promptly. Our calculator helps you spot these patterns.",
      },
      {
        question: "How can I improve my cash flow?",
        answer:
          "Strategies include: invoice promptly and follow up on late payments, offer early payment discounts, negotiate longer payment terms with suppliers, use invoice financing, maintain a cash reserve (3-6 months of expenses), and reduce unnecessary overheads. Our calculator helps you model the impact of these changes.",
      },
    ],
    ctaAction: "Forecast Cash Flow",
    ctaSubtitle: "free business cash flow planning tool",
    ctaIcon: "invoice",
  },
  // ── Redundancy Calculator ──
  {
    type: "redundancy",
    label: "Redundancy Calculator",
    targetKeyword: "UK redundancy pay calculator 2026/27",
    metaTitle: "Free UK Redundancy Pay Calculator | Statutory Entitlement | DocuHive",
    metaDescription:
      "Calculate UK statutory redundancy pay based on age, service, and weekly pay. Free calculator using current 2026/27 rates. No sign-up required.",
    heading: "Free UK Redundancy Pay Calculator",
    intro:
      "Calculate statutory redundancy pay for UK employees with our free calculator. Based on the employee's age, length of continuous service, and weekly pay (capped at £751 for 2026/27). Our calculator applies the correct formula — 0.5 week's pay per year of service for ages 18-21, 1 week per year for ages 22-40, and 1.5 weeks per year for ages 41 and over.",
    benefits: [
      "Uses the correct statutory formula based on age bands and service years",
      "Applies the current weekly pay cap (£751 for 2026/27) automatically",
      "Shows a clear breakdown of entitlement by age band",
      "Calculates both statutory and illustrative total redundancy package",
    ],
    whoFor: "UK employers planning redundancies, HR professionals, and employees who want to understand their statutory redundancy entitlement under the Employment Rights Act 1996.",
    faqs: [
      {
        question: "How is statutory redundancy pay calculated in the UK?",
        answer:
          "Statutory redundancy pay is calculated based on age, continuous service, and weekly pay (capped at £751 for 2026/27). You get: 0.5 week's pay for each full year of service aged 18-21, 1 week's pay for each full year aged 22-40, and 1.5 week's pay for each full year aged 41 and over. Total service is capped at 20 years, and weekly pay is capped at £751.",
      },
      {
        question: "Who is eligible for statutory redundancy pay?",
        answer:
          "Employees qualify if they have at least 2 years' continuous service, are being genuinely made redundant, and have worked under a contract of employment. Agency workers, self-employed contractors, and employees who unreasonably refuse a suitable alternative job offer may not qualify.",
      },
      {
        question: "What is the maximum statutory redundancy pay?",
        answer:
          "The maximum statutory redundancy pay in 2026/27 is £22,530 (20 years × 1.5 weeks × £751 cap). The maximum number of years counted is 20, and the maximum weekly pay is £751. This changes annually in line with the retail prices index.",
      },
      {
        question: "Is redundancy pay tax-free?",
        answer:
          "Statutory redundancy pay is tax-free up to £30,000. Any contractual redundancy payment above statutory entitlement, or any redundancy payment above £30,000, is subject to Income Tax (but not National Insurance). Our calculator shows the statutory amount only — consult your accountant for tax treatment of enhanced packages.",
      },
    ],
    ctaAction: "Calculate Redundancy Pay",
    ctaSubtitle: "statutory entitlement for 2026/27, free to use",
    ctaIcon: "payslip",
  },
]
