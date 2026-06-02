# DocuHive — AI Chat Feature (PRD Addendum)

## Executive Summary

**Feature:** AI-powered document editing chat panel  
**Revenue Driver:** Differentiates DocuHive from template-only competitors (BrightHR, Rocket Lawyer). Transforms "autofill" product into "AI document assistant" — justifies Pro tier pricing.  
**Target Launch:** Within current sprint (2-3 sessions)  
**Success Metric:** ≥30% of generated documents receive at least one AI edit within first month of use

## Scope

### In Scope — v1
- Single-edit input on document detail page (type a change instruction → AI regenerates)
- Current document content sent as context to the AI
- Returns updated JSON, saved as next version (v2, v3...) in DB
- "Input data used" preserved across versions
- Download buttons refer to latest version
- Works for all 5 doc types (employment_contract, offer_letter, staff_handbook, payslip, p45)
- Loading state, error state, success feedback

### Out of Scope — v1
- Full chat history / multi-turn conversation (v2)
- Side-by-side diff view (v2)
- AI-suggested edits without user prompting (v3)
- Undo/rollback to previous versions (v2)

## User Flow

1. User opens a generated document → sees rendered content + download buttons
2. Below the content, a text input: *"Tell the AI what to change..."*
3. User types e.g. *"Change the notice period to 3 months and add a commission clause"* and hits Enter/Send
4. Loading spinner appears on the edit input
5. AI receives: current document JSON + edit instruction
6. AI returns updated JSON → saved as new version (version + 1)
7. Page re-renders with updated content
8. Toast / inline success message: *"Document updated — v2"*

## Technical Design

### API Route: `POST /api/documents/:id/edit`
```
Input:  { instruction: string }
Output: { documentId, version: number, content: Record<string, unknown> }
Logic:
1. Load current document from DB (tenant-scoped auth)
2. Build prompt: system prompt (same as generation) + current outputData as context + user's edit instruction
3. Call OpenRouter with `response_format: { type: "json_object" }`
4. Validate response is valid JSON (reuse existing brace-recovery logic from client.ts)
5. Update document record: outputData = new content, version = version + 1, updatedAt = now
6. Return updated document
```

### Prompt Strategy
- System: same UK employment law context as document generation
- Context: "Current document content:\n" + JSON.stringify(existingContent)
- User: "The user wants the following changes applied to the document. Return the COMPLETE updated JSON document with the changes applied. Preserve all existing content unless the user asks to change it.\n\nEdit instruction: {instruction}"
- Key instruction: return the full document JSON, not just the diff

### DB Changes
No schema changes needed — `documents` table already has:
- `outputData` (jsonb) — can store updated content
- `version` (int) — auto-increment on edit
- `updatedAt` (timestamp) — update on edit

### Frontend Component
New component: `DocumentEditor.tsx`
- Text input with submit button, positioned below document content
- Loading state with spinner on the input area
- Calls `POST /api/documents/${id}/edit`
- On success: re-fetch document from API to get new version + content
- On error: inline error message

### Plan for Recovery (already handled)
- If AI returns wrapped/fenced JSON → brace-recovery logic in client.ts handles it
- If AI returns incomplete JSON → frontend re-fetches versioned data; user can retry
- If API errors → inline error with retry button

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI overwrites content it shouldn't | H | M | Prompt instructs to preserve all existing content unless user specifically asks to change it |
| AI cost per-edit adds up | M | H | Track AI usage per-tenant; consider metering edits against plan limit |
| User enters vague instruction, gets bad result | L | H | Show inline guidance: "Be specific — e.g. 'Change notice period to 3 months'" |
| Version bump to 100+ from rapid edits | L | M | Reasonable — documents don't get that many edits. No cap needed for v1 |

## Cost Model

Per AI edit call:
- Input: system prompt (~200 tokens) + document JSON (~500-1500 tokens) + edit instruction (~50 tokens) = ~750-1750 tokens
- Output: full document JSON (~500-1500 tokens)
- Total: ~1250-3250 tokens per edit
- OpenRouter deepseek-v4-flash cost: ~$0.15/M input, $0.60/M output
- Per-edit cost: ~$0.001-0.003
- At 100 edits/month/Pro user: ~$0.10-0.30 — negligible AI cost

## Success Metrics

- **Adoption:** ≥30% of generated documents get at least one AI edit within 30 days of feature launch
- **Engagement:** Average 2.5 edits per document that use the feature
- **Conversion:** Users who use the edit feature retain at 2x rate vs those who don't
- **Cost:** Average AI cost per edit < $0.01 (target for deepseek-v4-flash)