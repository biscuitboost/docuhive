# DocuHive — Product Requirements Document (PRD)

## Market Overview

**Product:** AI-powered UK Employment Document Generator for micro-businesses
**Target:** UK micro-businesses (0-9 employees) hiring their first employee
**Price:** £49-99/month
**Competition:** BreatheHR, BrightHR, CharlieHR, Rocket Lawyer, Zegal, Legislate, Employment Hero, Harper James
**Gap:** No lightweight, document-focused tool exists for the "first hire" moment

## Market Size

| Segment | Count |
|---------|-------|
| UK micro-businesses (0-9 employees) | 5.4 million |
| Non-employing sole traders (pipeline) | 4.3 million |
| Businesses hiring first employee/year | 65,000 - 80,000 |
| Self-employed + small trades | ~350K-400K in GB |

## Competitor Analysis

| Product | Entry Price | Strengths | Gaps |
|---------|------------|-----------|------|
| BreatheHR | £24/mo (1-10 staff) | Reliable, consultant-backed | Dated UI, paid add-ons for core features |
| BrightHR | £17+/mo | 24/7 legal advice, H&S support | Long contracts (up to 5yr), aggressive auto-renewals |
| CharlieHR | £20/mo | Great UX, modern feel | Bugs/data loss reports, no native rota |
| Rocket Lawyer UK | £39.99/mo | Broad legal library + lawyer access | Generic templates, auto-billing complaints |
| Legislate | £200/mo | Data-driven documents | Prohibitive for micro-businesses |
| Employment Hero | £4/emp/mo (min $200) | Global hiring + payroll | Too complex, too expensive for 1-5 staff |
| Harper James | £239/mo | Solicitor-led | Over-service for standard contracts |
| Zegal | £70-130/mo | Legal template library | HK-focused, expensive for UK micro |
| **DocuHive** | **£49-99/mo** | **AI document gen, lightweight, no lock-in** | **New entrant, no brand** |

## Problem Validation

**The risk is real and growing:**
- Failure to provide a Section 1 Statement (employment contract) by Day 1 now triggers mandatory 2-4 weeks' additional pay in any successful tribunal claim
- Maximum penalty: £2,876 (based on £719/week cap, April 2025)
- Employment Rights Act 2025 introduces Day-One Rights for unfair dismissal — micro-businesses can no longer "wait and see" for 2 years
- ERA 2025 enforcement began April 2026 via the Fair Work Agency

**What people currently do:**
- DIY/ACAS templates (£0-50) — risky, not auto-updating, miss restrictive covenants
- HR consultancy pack (£300-500 one-off) — static, dates quickly
- Solicitor-drafted (£350-1,000+) — expensive, 1-2 week turnaround

## Search Demand (Estimated UK Monthly)

| Keyword | Volume | Intent |
|---------|--------|--------|
| Payslip Generator | 18,000-22,000 | High — tactical need |
| Employment Contract Template | 8,000-12,000 | High — compliance driver |
| P45 Template | 4,000-6,000 | High — offboarding friction |
| Staff Handbook UK | 1,500-2,500 | Medium — planning/onboarding |
| HR for Small Business | 1,000-1,500 | Medium — solution seeking |

## Key Differentiators (Where DocuHive Wins)

1. **"First Hire" Micro-Toolkit** — flat-fee "First Employee Pack" vs full HR suite
2. **No lock-in guarantee** — cancel anytime (BrightHR's 5yr contracts are a pain point)
3. **AI-generated logic, not templates** — clauses adapt to job type (waiter vs remote dev)
4. **Legislative auto-pilot** — flag + suggest updates as laws change (£5/mo maintenance tier)
5. **"Hiring Calculator" hook** — free tool showing total cost of hiring (salary + NI + pension)

## Recommended Pricing

| Plan | Price | Features |
|------|-------|----------|
| Essentials (Solo) | £49/mo | 10 documents/mo, contracts + offer letters, PDF download |
| Pro (Solo+) | £79/mo | Unlimited docs, handbooks + payslips + P45s, Word export, legislative updates |
| Team (2-5 users) | £99/mo | All Pro + multi-user, HR audit trail, priority support |

## Build Notes

- **MVP scope (6-8 weeks):** Contracts, offer letters, basic handbooks, payslip generation
- **Stage 2 (Architecture) is next** — tech stack, data model, API design
- **Stage 3 (Build)** — per-feature via OpenCode + qwen3.5:cloud
- **UI** — via Gemini CLI