# DocuHive UI Overview

> Architecture, component tree, screens, and key user flows for DocuHive — an
> AI-powered UK employment document generator for micro-businesses.

---

## 1. Architecture Overview

DocuHive is a **Next.js 14** app (App Router) with **Clerk** for authentication
and **Tailwind CSS** for styling. The UI is split into two distinct zones:

| Zone | Routes | Layout | Clerk Auth |
|------|--------|--------|------------|
| **Public (Marketing)** | `/`, `/pricing`, `/sign-in`, `/sign-up` | Standalone pages, no sidebar | Signed-out / sign-in flow |
| **Dashboard (Auth)** | `/dashboard`, `/documents/*`, `/settings/*`, `/legislative`, `/templates` | `DashboardShell` (sidebar + header) | Signed-in required |

The Clerk provider is deferred to the browser via `dynamic(() => ..., { ssr: false })`
to avoid its `atob()` crash during Next.js static page generation.

### Root Layout Hierarchy

```
<html>
  <body className={inter.className}>
    <ClerkProviders>          ← client-side deferred ClerkProvider
      <Public Routes>         ← plain layout, no sidebar
      — or —
      <DashboardShell>        ← sidebar + header wrapper
        <SettingsLayout>      ← tabbed sub-navigation (General | Billing | Team)
        — or direct page content
    </ClerkProviders>
  </body>
</html>
```

---

## 2. Component Tree

```
RootLayout (app/layout.tsx)
├── ClerkProvider (client-only, deferred)
│
├── PUBLIC ROUTES (no sidebar)
│   ├── page.tsx (Home — "/")
│   │   ├── Hero
│   │   ├── Features
│   │   ├── Pricing (dynamic import, client-side only)
│   │   ├── Calculator
│   │   └── Footer
│   │
│   ├── pricing/page.tsx ("/pricing")
│   │   ├── Hero
│   │   ├── Pricing
│   │   ├── Features
│   │   └── Footer
│   │
│   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── Clerk <SignIn /> (dynamic import)
│   │
│   └── sign-up/[[...sign-up]]/page.tsx
│       └── Clerk <SignUp /> (dynamic import)
│
├── DASHBOARD SHELL (auth required)
│   └── DashboardShell
│       ├── Sidebar (inline — nav items + DocuHive logo)
│       ├── Header
│       │   ├── <SignedIn> → Clerk <UserButton />
│       │   └── <SignedOut> → "Sign In" Link
│       └── <main> — page content
│           │
│           ├── dashboard/page.tsx ("/dashboard")
│           │   ├── UsageBar
│           │   ├── Recent Documents list / empty state
│           │   └── Quick Actions (New Document, View Documents, Billing)
│           │
│           ├── documents/page.tsx ("/documents")
│           │   └── DocumentList
│           │       ├── Filter buttons (All | by type)
│           │       ├── Documents table (Title, Type, Status, Created, Model, Actions)
│           │       └── "View" link → /documents/[id]
│           │
│           ├── documents/new/page.tsx ("/documents/new")
│           │   └── DocumentWizard
│           │       ├── Step 1: Document type selector (5 types)
│           │       ├── Step 2: Dynamic form (varies by type, up to 13 fields)
│           │       └── Step 3: Result (download PDF / Word)
│           │
│           ├── documents/[id]/page.tsx ("/documents/[id]")
│           │   ├── Breadcrumb (← Back to documents)
│           │   ├── Document header (title, type, version, status badge)
│           │   ├── Document content sections (prose)
│           │   ├── Download buttons (PDF + Word)
│           │   ├── Input Data collapsible details
│           │   └── AI model attribution
│           │
│           ├── legislative/page.tsx ("/legislative")
│           │   └── LegislativeUpdatesList
│           │       └── Card grid (pending first, then actioned)
│           │
│           ├── templates/page.tsx ("/templates")
│           │   └── Placeholder — "Browse available templates"
│           │
│           ├── settings/layout.tsx ("/settings/*" tab layout)
│           │   ├── Settings tabs (General | Billing | Team)
│           │   │
│           │   ├── settings/page.tsx ("/settings")
│           │   │   └── GeneralSettingsForm (org name, user profile)
│           │   │
│           │   ├── settings/billing/page.tsx
│           │   │   └── BillingOverview
│           │   │       ├── Plan info card (name, price, status badge)
│           │   │       ├── Document Usage (UsageBar)
│           │   │       └── Manage Subscription → Stripe Customer Portal
│           │   │
│           │   └── settings/team/page.tsx
│           │       └── TeamManagement
│           │           ├── Team Members list (role badges)
│           │           ├── Pending Invitations
│           │           ├── Invite form (owner/admin only)
│           │           └── Read-only notice (member role)
│           │
│           └── ping/page.tsx ("/ping")
│               └── Health check endpoint
```

---

## 3. Key Screens & Purpose

### 3.1 Public Pages

#### Home (`/`)
Dark-themed landing page with:
- **Hero** — ERA 2025 badge, tagline, CTA buttons ("Start Free Trial" / "See Pricing"), social proof bar
- **Features** — 4-card grid (AI Contract Generator, Staff Handbook Builder, Payslip & P45 Generator, Legislative Auto-Pilot)
- **Pricing** — 3-tier table (Essentials £49, Pro £79, Team £99), Stripe Checkout integration, "canceled" state handling
- **Calculator** — Interactive cost comparison (solicitor vs DocuHive)
- **Footer** — Product/Company/Legal link groups

#### Pricing (`/pricing`)
Standalone pricing page reusing Hero, Pricing component, Features, Footer.

#### Sign In / Sign Up (`/sign-in`, `/sign-up`)
Clerk-hosted auth components, dynamically imported to avoid SSR crashes.

### 3.2 Dashboard Pages

#### Dashboard (`/dashboard`)
Hub page showing:
- Tenant name greeting
- **UsageBar** — plan-level document usage with progress bar (unlimited/limited, near-limit warning, over-limit upgrade prompt)
- **Recent Documents** — list with type badges, status pills, date formatting
- **Quick Actions** — styled card links (New Document, View Documents, Billing)
- Empty states with CTAs for new users
- Loading skeleton animation

#### Documents List (`/documents`)
Full document table with:
- Type filter buttons (All, Contract, Offer Letter, etc.)
- Sortable-like table columns (Title, Type, Status, Created, AI Model, Actions)
- Client-side inline PDF download
- Empty state with "Create your first document" CTA
- "+ New Document" button

#### New Document (`/documents/new`)
3-step wizard:
1. **Select Type** — 5 card buttons (Employment Contract, Offer Letter, Staff Handbook, Payslip, P45)
2. **Fill Details** — Dynamic form rendered from field definitions (text, number, select inputs) with client-side validation; 46 total fields across all types
3. **Download** — Success state with PDF + Word download links, "Create another" option
- Loading spinner during AI generation
- Error display with red alert box

#### Document Detail (`/documents/[id]`)
Full document viewer:
- Breadcrumb navigation
- Header card (title, type, version, date, status)
- Content rendered as prose sections
- PDF + Word download buttons (disabled if draft)
- Collapsible "Input Data Used" details panel
- AI model attribution

#### Legislative Updates (`/legislative`)
Card-based list of UK employment law changes:
- Pending updates first (highlighted), actioned updates below
- Status badges (Pending / Actioned with icons)
- Effective date display, template type badges
- Loading spinner, error state, empty state

#### Templates (`/templates`) — **Shell page**
- Currently a placeholder — page title + description only, no content populated yet.
- Wired into sidebar navigation.

### 3.3 Settings Pages

Settings has its own nested layout with tabbed sub-navigation.

#### General (`/settings`)
- Organisation name form (saves to API)
- User profile display (Clerk data)
- Loading and error states

#### Billing (`/settings/billing`)
- Plan info card (name, price, status badge with colour coding)
- Billing period display
- Document Usage bar (reuses UsageBar component)
- **Manage Subscription** → Stripe Customer Portal (opens new tab)
- Success / Canceled banners from Stripe redirect

#### Team (`/settings/team`)
- **Members list** — avatars, roles (owner/admin/member with colour-coded badges)
- **Pending Invitations** — email list with pending badge
- **Invite form** — email input + send button (owner/admin only)
- **Read-only notice** — shown to member-role users
- Loading skeletons, error state

---

## 4. Layout Structure Details

### DashboardShell

The authenticated layout consists of:

```
+---------------------+------------------------------------------+
|  SIDEBAR (w-64)     |  HEADER                                    |
|                     |  [UserButton / Sign In]                    |
|  DocuHive logo      +------------------------------------------+
|  ─────────────────                                          |
|  • Dashboard        |  MAIN (flex-1, overflow-y-auto, p-6)     |
|  • Documents        |                                          |
|  • New Document     |  ← page content injected as children     |
|  • Templates        |                                          |
|  • Settings         |                                          |
|  • Legislative      |                                          |
|  Updates            |                                          |
+---------------------+------------------------------------------+
```

- Sidebar: `w-64`, white bg, border-right, fixed at top of viewport
- Header: flex, `justify-end`, border-bottom, white bg, contains Clerk UserButton
- Main: `flex-1 overflow-y-auto p-6`, grey background (`bg-gray-50`)
- Active nav item: blue highlight with `bg-blue-50 text-blue-700`

### SettingsLayout

Nested inside DashboardShell with an additional tab bar:

```
[DashboardShell]
  Settings
  Account settings and preferences
  ─────────────────────────────────────────────
  [General]  [Billing]  [Team]
  ─────────────────────────────────────────────
  ← page content →
```

- Active tab: blue underline (`border-b-2 border-blue-600`)
- Inactive tabs: grey text with transparent underline, hover effect

---

## 5. Key User Flows

### Flow A: New user → sign up → first document

```
/ (Hero Start Free Trial)
  → /sign-up (Clerk SignUp)
    → /dashboard (empty state — "No documents yet")
      → "Create your first document" CTA
        → /documents/new
          → Step 1: Select "Employment Contract"
          → Step 2: Fill 13 fields → "Generate Document"
          → Step 3: Download PDF / Word
```

### Flow B: Returning user → view document

```
/dashboard
  → Click recent document (or "View all" → /documents)
    → /documents (filter, search, browse)
      → Click document title
        → /documents/[id] (view content, download)
```

### Flow C: Subscribe to paid plan

```
/pricing or /settings/billing
  → "Subscribe Now" on a plan card
    → [if not signed in] /sign-up?redirect=pricing
    → POST /api/stripe/checkout { plan: "pro" }
    → Stripe Checkout URL (redirect)
      → [success] /settings/billing?success=true
      → [cancel] /pricing?canceled=true or /settings/billing?canceled=true
```

### Flow D: Invite team member

```
/settings/team
  → Enter email → "Send Invite"
    → POST /api/tenants/members { email }
    → Clerk creates invitation (email sent)
    → Pending invitation appears in list
    → Recipient signs up → joins tenant
```

### Flow E: Legislative update check

```
/dashboard → click "Legislative Updates" in sidebar
  → /legislative
    → View pending updates (amber highlights)
    → View actioned updates (green checkmarks)
    → Check effective dates for compliance deadlines
```

### Flow F: Manage subscription

```
/settings/billing
  → View plan + usage
  → "Manage Subscription" → Stripe Customer Portal (new tab)
    → Change plan, update payment method, view invoices
```

---

## 6. Design Tokens & Conventions

| Token | Value | Usage |
|-------|-------|-------|
| Background (public) | `bg-[#0f172a]` | Dark marketing pages |
| Background (dashboard) | `bg-gray-50` | App area |
| Card backgrounds | `bg-white` | All dashboard cards |
| Primary button | `bg-blue-600` + `text-white` | CTAs |
| Secondary button | `border border-gray-300` `bg-white` | Secondary actions |
| Brand accent | `text-blue-600` / `bg-blue-600` | Links, active states |
| Status success | `bg-green-100 text-green-700` | Generated docs, active subs |
| Status warning | `bg-amber-100 text-amber-700` | Near-limit, pending |
| Status error | `bg-red-50 text-red-700` | Errors, over-limit |
| Font | `Inter` (`next/font/google`) | Global |
| Border radius | `rounded-xl` (cards), `rounded-lg` (buttons) | Consistent |
| Spacing | `p-6` cards, `gap-4`/`gap-6` grids | Consistent units |

---

## 7. API Routes Referenced by UI

| Route | Method | UI Component |
|-------|--------|-------------|
| `/api/dashboard` | GET | DashboardPage, UsageBar |
| `/api/documents` | GET | DocumentList |
| `/api/documents/generate` | POST | DocumentWizard |
| `/api/documents/[id]` | GET | DocumentDetailPage |
| `/api/documents/[id]/download` | GET | DocumentDetailPage, DocumentList |
| `/api/documents/[id]/download/word` | GET | DocumentDetailPage, DocumentWizard |
| `/api/tenants` | GET/PATCH | GeneralSettingsForm |
| `/api/tenants/members` | GET/POST | TeamManagement |
| `/api/billing/subscription` | GET | BillingOverview |
| `/api/stripe/checkout` | POST | Pricing, CheckoutButton |
| `/api/stripe/portal` | GET | BillingOverview |
| `/api/legislative-updates` | GET | LegislativeUpdatesList |

---

## 8. Stub Components (Identified)

These components exist as files but are **not imported or used** in any active route:

| Component | File | Notes |
|-----------|------|-------|
| `Sidebar` | `components/layout/Sidebar.tsx` | Replaced by inline sidebar in DashboardShell |
| `Header` | `components/layout/Header.tsx` | Replaced by inline header in DashboardShell |
| `DocumentForm` | `components/documents/DocumentForm.tsx` | Wizard handles forms internally |
| `DocumentPreview` | `components/documents/DocumentPreview.tsx` | Not wired — preview rendered inline in detail page |
| `PricingTable` | `components/billing/PricingTable.tsx` | Server component — Pricing.tsx is the active one |
| `CheckoutButton` | `components/billing/CheckoutButton.tsx` | Pricing.tsx handles checkout inline |
| `/templates` page | `app/templates/page.tsx` | Shell page, no content |
