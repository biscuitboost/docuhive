# DocuHive — Architecture Document

## Overview

DocuHive is an AI-powered UK Employment Document Generator for micro-businesses (0-9 employees) hiring their first employee. It generates legally-compliant employment documents — contracts, offer letters, staff handbooks, payslips, P45s — tailored to the specific job, industry, and employee circumstances.

**Target Price:** £49-99/mo
**MVP Scope:** Contracts, offer letters, basic handbooks, payslip generation
**Build Target:** 6-8 weeks

---

## 1. Tech Stack Decisions

### Frontend
| Choice | Decision | Rationale |
|--------|----------|-----------|
| Framework | **Next.js 15 (App Router)** | Robert's established stack; SSG for landing pages, SSR for app |
| UI Library | **Tailwind CSS + shadcn/ui** | Fastest path to professional UI, accessible components |
| State Management | **React Server Components + URL state** | Minimal client state needed; doc form state lives in DB drafts |
| Forms | **react-hook-form + zod** | Type-safe form validation, required for complex doc forms |
| PDF Viewing | **@react-pdf/renderer** | Server-side PDF generation, embedded viewer in app |

### Backend
| Choice | Decision | Rationale |
|--------|----------|-----------|
| API Layer | **Next.js Route Handlers (App Router)** | Same project as frontend, co-located API routes |
| Heavy Workers | **Hono on Cloudflare Workers** | PDF generation, AI calls, bulk exports — offloaded from main server |
| Background Jobs | **Cloudflare Queues** | Doc generation, batch payslip runs, legislative update checks |
| File Storage | **Cloudflare R2** | Document storage (PDFs, Word exports, uploaded logos) |
| Database | **Cloudflare D1 (SQLite)** | Single-region for UK businesses, simple relational model, no ops |
| Cache | **Cloudflare KV** | Session cache, template cache, rate limiting |

### Auth & Payments
| Choice | Decision | Rationale |
|--------|----------|-----------|
| Auth | **Clerk** | Already in Robert's stack, integrates with Next.js + Stripe |
| Payments | **Stripe Billing** | Standard, Clerk integration, webhook-driven subscription mgmt |
| Pricing Model | **Subscription tiers** | £49/79/99 per month — no per-document pricing |

### AI Pipeline
| Choice | Decision | Rationale |
|--------|----------|-----------|
| LLM Gateway | **OpenRouter** | Already in stack, multi-model routing |
| Document Gen Model | **gemini-2.0-flash** | Fast, cheap, good at structured output — for generating doc content |
| Clause Logic Model | **GPT-4o-mini** | Better legal reasoning, clause selection based on job type |
| Structured Output | **Instructor (Python CLI)** | Guarantees consistent JSON schema per document type |
| Document Analysis | **Google Gemini API** | For "check my contract" feature — existing docs analysis |

### Deployment
| Choice | Decision | Rationale |
|--------|----------|-----------|
| Hosting | **Cloudflare Pages + Workers** | Robert's preferred stack, pages for frontend, workers for API |
| Domain | **docuhive.co.uk** | UK-focused product, .co.uk for local trust |
| CI/CD | **Cloudflare Pages deploy via bash** | Same pattern as ReceiptCamp's deploy.sh |
| Monitoring | **PostHog** | Already in stack for analytics and error tracking |

### Email
| Choice | Decision | Rationale |
|--------|----------|-----------|
| Transactional | **Resend** | Simple API, React Email templates, good deliverability |
| Templates | **React Email** | Type-safe email templates, shared components with app |

---

## 2. Architecture Component Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLOUDFLARE PAGES                            │
│                        (Next.js Static + SSR)                        │
│                                                                      │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐    │
│  │   Public Pages       │    │         App Pages (Auth'd)       │    │
│  │  ┌─────────────────┐│    │  ┌────────────────────────────┐  │    │
│  │  │ Landing         ││    │  │ Dashboard                  │  │    │
│  │  │ Pricing         ││    │  │ ┌── Active Documents      │  │    │
│  │  │ Blog/SEO        ││    │  │ └── Recent Activity       │  │    │
│  │  │ Docs Generator  ││    │  ├────────────────────────────┤  │    │
│  │  │ (free tools)    ││    │  │ Document Builder (Main)   │  │    │
│  │  │  ┌ Hiring Calc ││    │  │ ┌── Step 1: Employee Info │  │    │
│  │  │  └ Compliance  ││    │  │ ├── Step 2: Job Details   │  │    │
│  │  └─────────────────┘│    │  │ ├── Step 3: Terms        │  │    │
│  └─────────────────────┘    │  │ ├── Step 4: AI Gen       │  │    │
│                              │  │ └── Step 5: Review+Export│  │    │
│                              │  ├────────────────────────────┤  │    │
│                              │  │ Document Library           │  │    │
│                              │  │ ┌── Contracts             │  │    │
│                              │  │ ├── Handbooks             │  │    │
│                              │  │ ├── Payslips              │  │    │
│                              │  │ └── P45s                  │  │    │
│                              │  ├────────────────────────────┤  │    │
│                              │  │ Settings & Billing         │  │    │
│                              │  └────────────────────────────┘  │    │
│                              └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE WORKERS (Hono)                      │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │
│  │ PDF Gen      │  │ DOCX Export  │  │ AI Document  │  │ Batch  │ │
│  │ Worker       │  │ Worker       │  │ Gen Worker   │  │ Worker │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └───┬────┘ │
│         │                 │                  │              │       │
└─────────┼─────────────────┼──────────────────┼──────────────┼───────┘
          │                 │                  │              │
          ▼                 ▼                  ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE QUEUES (Background Jobs)                │
│                                                                      │
│  Queue: document-generation    Queue: batch-payslip                  │
│  Queue: legislative-check      Queue: email-notification             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (Cloudflare)                       │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │  D1 (SQLite)    │  │  R2 (Objects)   │  │  KV (Cache)      │    │
│  │                 │  │                 │  │                  │    │
│  │  users          │  │  /documents/    │  │  session:xxx     │    │
│  │  organizations  │  │  /exports/      │  │  template:xxx    │    │
│  │  documents      │  │  /logos/        │  │  rate-limit:xxx  │    │
│  │  templates      │  │  /avatars/      │  │                  │    │
│  │  employees      │  │                 │  │                  │    │
│  │  subscriptions  │  │                 │  │                  │    │
│  │  audit_log      │  │                 │  │                  │    │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐  │
│  │ Clerk    │  │ Stripe   │  │OpenRouter│  │ Resend   │  │PH   │  │
│  │ Auth     │  │ Payments │  │ LLM API  │  │ Email    │  │Anal │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### Core Tables (D1 SQLite)

```sql
-- =============================================
-- ORGANIZATIONS & USERS
-- =============================================

CREATE TABLE organizations (
  id            TEXT PRIMARY KEY, -- org_xxx
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  clerk_org_id  TEXT UNIQUE,         -- Clerk org ID (for team plan)
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id            TEXT PRIMARY KEY, -- user_xxx
  clerk_id      TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL,
  company_name  TEXT,
  company_size  INTEGER DEFAULT 1,
  role          TEXT DEFAULT 'owner', -- owner, admin, member
  organization_id TEXT REFERENCES organizations(id),
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================

CREATE TABLE subscriptions (
  id              TEXT PRIMARY KEY, -- sub_xxx
  user_id         TEXT NOT NULL REFERENCES users(id),
  stripe_id       TEXT UNIQUE,         -- Stripe subscription ID
  plan            TEXT NOT NULL,       -- essentials, pro, team
  status          TEXT NOT NULL,       -- active, past_due, canceled, trialing
  current_period_start TEXT,
  current_period_end   TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  document_count_month INTEGER DEFAULT 0, -- docs generated this month
  document_limit       INTEGER DEFAULT 10, -- monthly doc limit
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- EMPLOYEES
-- =============================================

CREATE TABLE employees (
  id              TEXT PRIMARY KEY, -- emp_xxx
  user_id         TEXT NOT NULL REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  address         TEXT,                   -- JSON: {line1, line2, city, postcode}
  national_insurance TEXT,
  start_date      TEXT,
  job_title       TEXT,
  department      TEXT,
  employment_type TEXT,                   -- full_time, part_time, fixed_term, zero_hour
  weekly_hours    REAL,
  salary_amount   REAL,
  salary_type     TEXT,                   -- annual, hourly, monthly
  bank_name       TEXT,
  bank_sort_code  TEXT,
  bank_account    TEXT,
  status          TEXT DEFAULT 'active',  -- active, terminated, on_leave
  termination_date TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- DOCUMENTS
-- =============================================

CREATE TABLE documents (
  id              TEXT PRIMARY KEY, -- doc_xxx
  user_id         TEXT NOT NULL REFERENCES users(id),
  employee_id     TEXT REFERENCES employees(id),
  organization_id TEXT REFERENCES organizations(id),
  doc_type        TEXT NOT NULL,          -- contract, offer_letter, handbook, payslip, p45, amendment
  title           TEXT NOT NULL,
  status          TEXT DEFAULT 'draft',   -- draft, completed, archived
  version         INTEGER DEFAULT 1,
  
  -- Document content (stored as JSON for structured docs)
  content         TEXT,                   -- JSON: full document data/answers
  generated_text  TEXT,                   -- AI-generated final text
  
  -- Metadata
  template_id     TEXT,
  signed_at       TEXT,
  sent_at         TEXT,
  expiry_date     TEXT,
  
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_documents_user ON documents(user_id, doc_type);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_status ON documents(status);

-- =============================================
-- TEMPLATES
-- =============================================

CREATE TABLE templates (
  id              TEXT PRIMARY KEY, -- tmpl_xxx
  doc_type        TEXT NOT NULL,          -- contract, handbook, etc.
  name            TEXT NOT NULL,
  description     TEXT,
  industry        TEXT,                   -- industry-specific variants
  employment_type TEXT,                   -- full_time/part_time/etc
  fields_schema   TEXT NOT NULL,          -- JSON Schema for the input fields
  prompt_template TEXT NOT NULL,          -- LLM prompt template with {{variables}}
  is_public       INTEGER DEFAULT 1,
  version         INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- LEGISLATION & COMPLIANCE
-- =============================================

CREATE TABLE legislation_updates (
  id              TEXT PRIMARY KEY, -- leg_xxx
  title           TEXT NOT NULL,          -- "Employment Rights Act 2025 Amendment"
  effective_date  TEXT NOT NULL,
  summary         TEXT NOT NULL,
  affected_doc_types TEXT NOT NULL,       -- JSON array: ["contract", "handbook"]
  changes_made    TEXT,                   -- JSON: what changed
  source_url      TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE audit_log (
  id              TEXT PRIMARY KEY, -- audit_xxx
  user_id         TEXT REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  action          TEXT NOT NULL,          -- doc_created, doc_exported, doc_signed, etc
  resource_type   TEXT,                   -- document, employee, subscription
  resource_id     TEXT,
  details         TEXT,                   -- JSON metadata about the action
  ip_address      TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_org ON audit_log(organization_id, created_at);

-- =============================================
-- USAGE TRACKING
-- =============================================

CREATE TABLE usage_events (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  event_type      TEXT NOT NULL,          -- doc_generated, doc_exported, api_call
  metadata        TEXT,                   -- JSON
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_usage_user_month ON usage_events(user_id, created_at);
```

---

## 4. API Routes

### Next.js App Router Routes

```
# Public Routes (no auth)
GET /                              → Landing page (SSG)
GET /pricing                       → Pricing page (SSG)
GET /blog                          → Blog listing
GET /blog/[slug]                   → Blog post
GET /tools/hiring-calculator       → Free hiring cost calculator
GET /tools/compliance-check        → Free compliance checklist

# Auth Routes (via Clerk middleware)
/app                              → Dashboard (SSR)
/app/dashboard                    → Main dashboard with stats + quick actions

# Document Builder (multi-step wizard)
/app/documents/new                → New document (select type + employee)
/app/documents/[id]/edit          → Edit document form (SSR)
/app/documents/[id]/preview       → Preview generated document
/app/documents/[id]/export        → Export options (PDF, DOCX, email)
/app/documents                    → Document library (list all docs)
/app/documents?type=contract      → Filtered by type
/app/documents?status=draft       → Filtered by status

# Employees
/app/employees                    → Employee list
/app/employees/new                → Add employee
/app/employees/[id]               → Employee details + docs
/app/employees/[id]/edit          → Edit employee

# Templates
/app/templates                    → Template library
/app/templates/[id]               → Template details + preview

# Settings
/app/settings/profile             → Profile settings
/app/settings/billing             → Subscription + billing
/app/settings/team                → Team management (Team plan)
/app/settings/notifications       → Notification preferences
/app/settings/documents           → Document defaults (logo, signature, etc)

# Compliance
/app/compliance                   → Compliance dashboard
/app/compliance/updates           → Legislative changes affecting documents
```

### API Route Handlers

```
# Next.js API (/api/*)

GET    /api/documents              → List user's documents (paginated, filtered)
POST   /api/documents              → Create new document
GET    /api/documents/[id]         → Get document detail
PATCH  /api/documents/[id]         → Update document
DELETE /api/documents/[id]         → Delete/archive document
POST   /api/documents/[id]/generate → Trigger AI document generation
POST   /api/documents/[id]/export  → Export to PDF/DOCX
POST   /api/documents/[id]/send    → Send document via email
POST   /api/documents/[id]/duplicate → Clone a document

GET    /api/employees              → List employees
POST   /api/employees              → Create employee
GET    /api/employees/[id]         → Get employee detail
PATCH  /api/employees/[id]         → Update employee
DELETE /api/employees/[id]         → Delete employee

GET    /api/templates              → List available templates
GET    /api/templates/[id]         → Get template + fields schema

GET    /api/subscription           → Get current subscription
POST   /api/subscription/portal    → Get Stripe portal link
POST   /api/subscription/cancel    → Cancel subscription
POST   /api/subscription/change    → Change plan

POST   /api/tools/hiring-calculator → Calculate hiring costs
POST   /api/tools/compliance-check  → Check compliance status

# Webhooks (Cloudflare Worker)
POST   /api/webhooks/stripe         → Stripe subscription events
POST   /api/webhooks/clerk          → User/org lifecycle events
POST   /api/webhooks/resend         → Email delivery events
```

### Cloudflare Worker Routes (Hono)

```
# Heavy document processing (offloaded from main server)
POST /worker/document/generate      → AI document generation job
POST /worker/document/export-pdf     → Generate PDF from document text
POST /worker/document/export-docx    → Generate DOCX from document text
POST /worker/batch/payslips          → Batch generate pay period payslips
POST /worker/legislation/check       → Check if legislation affects any docs
POST /worker/email/send              → Send document via transactional email

# Webhook handlers
POST /worker/webhooks/stripe         → Stripe events
POST /worker/webhooks/clerk          → Clerk events
```

---

## 5. AI Document Generation Pipeline

### Flow: User asks for a document

```
User fills form → Frontend validates → POST /api/documents/[id]/generate
                                  │
                                  ▼
                    1. Collect all form data + employee data
                    2. Load template + prompt template from DB
                    3. Build structured prompt:
                       {
                         employment_type: "full_time",
                         job_title: "Kitchen Assistant",
                         industry: "hospitality",
                         location: "London",
                         salary: 24000,
                         weekly_hours: 40,
                         start_date: "2026-06-01",
                         notice_period: "1 week",
                         probation_period: "3 months",
                         ... all other fields
                       }
                                  │
                                  ▼
                    4. Send to OpenRouter (gemini-2.0-flash)
                       Prompt: "Generate a UK employment contract
                       for the following position. Use the ACAS
                       Code of Practice structure. Ensure Section 1
                       ERA 1996 compliance. Include restrictive
                       covenants appropriate for [industry]."
                                  │
                                  ▼
                    5. Parse structured AI response
                       → Extract: clauses, salary details,
                         holiday entitlement, notice period,
                         restrictive covenants, place of work
                                  │
                                  ▼
                    6. Format into document sections
                       → Apply company branding (logo, colors)
                       → Insert real values (dates, names, amounts)
                       → Generate string template
                                  │
                                  ▼
                    7. Store in DB (documents.generated_text)
                    8. Return to frontend for preview
                    9. User reviews, edits, and approves
                  10. Export as PDF or DOCX on demand
```

### Model Selection Logic

| Task | Model | Why | Cost |
|------|-------|-----|------|
| Contract generation | gemini-2.0-flash | Fast, cheap, good structured output | ~$0.001/doc |
| Offer letter | gemini-2.0-flash | Simple template, no complex reasoning | ~$0.0005/doc |
| Staff handbook | GPT-4o-mini | Longer context, needs better reasoning | ~$0.005/doc |
| Payslip generation | Rule-based (no LLM) | Formulaic, no AI needed | $0 |
| P45 generation | gemini-2.0-flash | Simple form filling | ~$0.0003/doc |
| Document analysis | GPT-4o-mini | "Check my contract" feature | ~$0.002/check |
| Clause suggestions | GPT-4o-mini | Quick inline suggestions | ~$0.001/suggestion |
| Legislative check | gemini-2.0-flash | Monitor changes, flag affected docs | ~$0.01/week |

### Document Structure Standard

Each generated document follows this internal schema:

```json
{
  "document_id": "doc_abc123",
  "doc_type": "contract",
  "version": 1,
  "metadata": {
    "generated_at": "2026-06-01T12:00:00Z",
    "model": "gemini-2.0-flash",
    "prompt_version": "v2",
    "template_id": "tmpl_contract_hospitality_v1"
  },
  "parties": {
    "employer": { "name": "Bob's Bistro", "address": "...", "company_number": "..." },
    "employee": { "name": "Jane Smith", "address": "..." }
  },
  "sections": [
    { "id": "job_title", "title": "Job Title", "content": "Kitchen Assistant" },
    { "id": "start_date", "title": "Start Date", "content": "1 June 2026" },
    { "id": "probation", "title": "Probation Period", "content": "3 months..." },
    { "id": "salary", "title": "Salary", "content": "£24,000 per annum..." },
    { "id": "hours", "title": "Hours of Work", "content": "40 hours per week..." },
    { "id": "holiday", "title": "Holiday Entitlement", "content": "28 days per annum..." },
    { "id": "notice", "title": "Notice Period", "content": "1 week during probation..." },
    { "id": "pension", "title": "Pension", "content": "Auto-enrolment..." },
    { "id": "sick_pay", "title": "Sick Pay", "content": "SSP as per statutory..." },
    { "id": "restrictive_covenants", "title": "Restrictive Covenants", "content": "..." },
    { "id": "discipline", "title": "Disciplinary Procedure", "content": "..." },
    { "id": "grievance", "title": "Grievance Procedure", "content": "..." },
    { "id": "termination", "title": "Termination", "content": "..." },
    { "id": "governing_law", "title": "Governing Law", "content": "England and Wales" },
    { "id": "signatures", "title": "Signatures", "content": "Both parties to sign..." }
  ],
  "section_1_statement": "Full text of the Section 1 statement for compliance",
  "full_text": "Complete formatted document text..."
}
```

---

## 6. Security & Compliance

- **Data residency:** All data stored in UK/EU (Cloudflare London data centre)
- **Encryption:** R2 SSE-C for document storage
- **GDPR:** Built-in data retention policies, export, deletion
- **Document access:** Row-level security via user_id/org_id in all queries
- **Audit trail:** Every document action logged
- **Rate limiting:** KV-based rate limiting per-user on API routes
- **Input sanitization:** Zod schemas on all API inputs
- **Auth:** Clerk middleware on all /app/* and /api/* routes

---

## 7. Key Design Decisions

1. **D1 over Postgres:** Simpler ops, no connection pooling needed, fits the data volume (a few hundred docs per customer, thousands of customers). If we outgrow D1, we migrate to Neon Postgres later.

2. **Offloaded AI workers:** Document generation runs on Cloudflare Workers via Queues — never blocks the main response. User gets a "generating" state and the document appears when ready.

3. **Rule-based payslips:** Payslip generation is purely formulaic (salary × days worked - NI - tax - pension). No AI needed. We use a Cloudflare Worker for this.

4. **Template-driven architecture:** Each document type has a DB template with a JSON Schema for inputs and a prompt template for the LLM. This makes it easy to add new document types without code changes.

5. **Legislative checking is optional in MVP:** The "auto-update" feature is a post-MVP upsell. MVP focuses on generating correct current documents.

6. **P45s are lower priority MVP:** Offboarding is important but most new employers won't need it immediately. MVP ships: contracts → offer letters → handbooks → payslips.

7. **No real-time collaboration in MVP:** Team plan (99/mo) gets multi-user but not real-time. Document editing is single-user-with-shared-view.

8. **Structured LLM output via Instructor:** We use a separate Python CLI (run as Cloudflare Worker or via OpenRouter schema) that forces the LLM to output valid JSON matching our schema, preventing hallucinated clause structures.

---

## 8. MVP Phasing

### Phase 1 (Weeks 1-2): Foundation
- Next.js project scaffold (Cloudflare Pages setup)
- Clerk auth integration
- D1 schema + migrations
- Stripe billing integration
- Basic dashboard shell
- Employee CRUD

### Phase 2 (Weeks 3-4): Core Documents
- Contract generation (AI pipeline)
- Offer letter generation
- Document preview + editing
- PDF export (Cloudflare Worker)
- Document library

### Phase 3 (Weeks 5-6): More Documents + Refinement
- Staff handbook generation
- Payslip generation (rule-based)
- Email sending via Resend
- Template management
- Compliance basics

### Phase 4 (Weeks 7-8): Polish + Launch
- DOCX export
- Hiring calculator (free SEO tool)
- Landing page, blog, SEO content
- Subscription management UI
- Error states, loading, empty states
- Production launch