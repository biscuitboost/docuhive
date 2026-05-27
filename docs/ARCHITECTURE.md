# DocuHive — Architecture Design

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | Robert's usual, great DX, API routes + SSR in one |
| **Language** | TypeScript | Type safety across the stack |
| **UI** | Tailwind CSS + shadcn/ui | Fast builds, accessible components out the box |
| **Auth** | Clerk | Robert's usual — deferred until feature-full, but scaffolded from day 1 |
| **Database** | Neon (Postgres) | Serverless Postgres, scales to zero, great DX |
| **ORM** | Drizzle | Type-safe SQL, migrations, lighter than Prisma |
| **AI** | OpenRouter (multi-model) | Single API for Claude/Gemini/OpenAI — swap models per task |
| **Payments** | Stripe | Subscriptions, metered billing, UK VAT handling |
| **Storage** | Vercel Blob / R2 | Document PDF/Word output storage |
| **Deploy** | Vercel | Robert's usual, zero-config deploys from git |
| **Doc Generation** | @react-pdf/renderer + docx.js | PDF and Word output from templates |
| **Validation** | Zod | Runtime validation for forms + API inputs |
| **State** | Zustand | Lightweight global state, no boilerplate |

## Data Model

### Users (Clerk-managed)
```
clerk_user_id  → linked to subscriptions + documents
```

### Tenants (organisations)
```
id (uuid)
name
plan: enum [essentials, pro, team]
stripe_customer_id
stripe_subscription_id
created_at
updated_at
```

### Tenant Members
```
id
tenant_id → tenants.id
clerk_user_id
role: enum [owner, admin, member]
created_at
```

### Documents
```
id (uuid)
tenant_id → tenants.id
type: enum [employment_contract, offer_letter, staff_handbook, payslip, p45, custom]
title
status: enum [draft, generated, downloaded]
input_data (jsonb) — the form values used to generate
output_url — blob storage URL for PDF/Word
ai_model — which model generated it
version — document template version
created_by → clerk_user_id
created_at
updated_at
```

### Document Templates
```
id
type: enum [employment_contract, offer_letter, ...]
name
version
prompt_template (text) — the AI prompt with {{variables}}
schema (jsonb) — Zod schema for input validation
is_active
created_at
```

### Subscriptions (Stripe mirror)
```
id
tenant_id → tenants.id
stripe_subscription_id
stripe_price_id
status: enum [active, past_due, cancelled, trialing]
current_period_start
current_period_end
plan: enum [essentials, pro, team]
documents_used (int) — counter for metered billing
created_at
updated_at
```

### Legislative Updates
```
id
title
description
affected_template_types (text[])
effective_date
is_actioned (bool) — has the template been updated?
created_at
```

## API Routes

```
POST   /api/documents/generate     — Generate a document (AI call + PDF render)
GET    /api/documents              — List tenant documents
GET    /api/documents/:id          — Get document metadata
GET    /api/documents/:id/download — Download PDF/Word
DELETE /api/documents/:id          — Soft delete

POST   /api/stripe/webhook         — Stripe events (subscription lifecycle)
GET    /api/stripe/checkout        — Create checkout session
GET    /api/stripe/portal          — Customer portal redirect

GET    /api/templates              — List active templates
GET    /api/templates/:type        — Get template schema for form rendering

GET    /api/legislative-updates    — List pending legislative updates
POST   /api/legislative-updates/:id/apply — Mark as actioned

GET    /api/usage                  — Current period document count
```

## Component Tree

```
app/
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx    — Clerk sign-in
│   └── sign-up/[[...sign-up]]/page.tsx    — Clerk sign-up
├── (dashboard)/
│   ├── layout.tsx                          — Sidebar + header
│   ├── page.tsx                            — Dashboard home (stats + recent docs)
│   ├── documents/
│   │   ├── page.tsx                        — Document list
│   │   ├── new/page.tsx                    — New document wizard
│   │   └── [id]/page.tsx                   — Document detail + download
│   ├── templates/
│   │   └── page.tsx                        — Template browser
│   ├── settings/
│   │   ├── page.tsx                        — Org settings
│   │   ├── billing/page.tsx                — Stripe portal
│   │   └── team/page.tsx                   — Team management
│   └── legislative/
│       └── page.tsx                        — Legislative updates feed
├── api/                                    — (see API routes above)
├── layout.tsx                              — Root layout
└── page.tsx                                — Landing page (marketing)

components/
├── ui/                                     — shadcn/ui primitives
├── documents/
│   ├── DocumentForm.tsx                    — Dynamic form from template schema
│   ├── DocumentPreview.tsx                 — Live PDF preview
│   ├── DocumentList.tsx                    — Table with filters
│   └── DocumentWizard.tsx                 — Step-by-step doc creation
├── layout/
│   ├── Sidebar.tsx                         — Dashboard nav
│   ├── Header.tsx                          — Top bar + user menu
│   └── Footer.tsx
├── billing/
│   ├── PricingTable.tsx                    — Plan comparison
│   ├── UsageBar.tsx                        — Documents used / limit
│   └── CheckoutButton.tsx                  — Stripe checkout trigger
└── marketing/
    ├── Hero.tsx
    ├── Features.tsx
    ├── Pricing.tsx
    └── Calculator.tsx                      — "Cost of hiring" free tool

lib/
├── db/                                     — Drizzle schema + connection
│   ├── schema.ts
│   ├── index.ts
│   └── migrations/
├── ai/                                     — OpenRouter client
│   ├── client.ts
│   ├── prompts.ts                          — Document generation prompts
│   └── models.ts                           — Model selection per doc type
├── stripe/
│   ├── client.ts
│   ├── webhooks.ts
   └── pricing.ts                           — Plan config + limits
├── documents/
│   ├── generate.ts                         — Orchestrate AI → PDF
│   ├── pdf.ts                              — @react-pdf renderer
│   └── word.ts                             — docx.js generator
└── utils/
    ├── constants.ts
    └── helpers.ts
```

## AI Integration

### Document Generation Flow
```
1. User fills form (validated by Zod schema from template)
2. POST /api/documents/generate
3. Build prompt from template + user inputs
4. Call OpenRouter (model per doc type — see below)
5. Parse AI response (structured JSON)
6. Render to PDF (@react-pdf) + Word (docx.js)
7. Upload to blob storage
8. Save document record + return download URL
```

### Model Selection
| Doc Type | Model | Rationale |
|----------|-------|-----------|
| Employment Contract | anthropic/claude-sonnet-4 | Best at legal reasoning, UK law |
| Offer Letter | anthropic/claude-sonnet-4 | Consistency with contracts |
| Staff Handbook | google/gemini-2.5-pro | Long-form, structured content |
| Payslip | openai/gpt-4o | Simple structured data, fast |
| P45 | openai/gpt-4o | Template-driven, minimal AI |

### Prompt Strategy
- System prompt: UK employment law context + ERA 2025 awareness
- Template prompts with `{{variable}}` interpolation
- Output: structured JSON matching document sections
- Post-process: validate required clauses present

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://neon...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENTIALS=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...

# AI
OPENROUTER_API_KEY=sk-or-...

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# App
NEXT_PUBLIC_APP_URL=https://docuhive.com
```

## Deployment

```
GitHub repo → Vercel (auto-deploy on push)
Neon DB → linked via DATABASE_URL
Stripe webhooks → Vercel endpoint (production)
Clerk → configured for docuhive.com domain
```

## MVP Scope (6-8 weeks)

### Week 1-2: Foundation
- [ ] Next.js 14 project init + Tailwind + shadcn
- [ ] Neon DB + Drizzle schema + migrations
- [ ] Clerk auth scaffold (deferred enforcement)
- [ ] Landing page + marketing site
- [ ] Stripe checkout + webhook handler

### Week 3-4: Core Documents
- [ ] Employment Contract generator (AI + PDF)
- [ ] Offer Letter generator
- [ ] Document list + download
- [ ] Usage tracking + plan limits

### Week 5-6: Expansion
- [ ] Staff Handbook generator
- [ ] Payslip generator
- [ ] P45 generator
- [ ] Word export (docx.js)

### Week 7-8: Polish
- [ ] Legislative updates feed
- [ ] "Hiring Calculator" free tool
- [ ] Team management (multi-user)
- [ ] Settings + billing portal
- [ ] Error states, loading states, edge cases
