# DocuHive — Version History, Audit Trail & Issued Status

## Executive Summary

**Feature:** Complete document version control: every edit creates a recoverable snapshot, users can edit inline (not just AI), and mark specific versions as "issued" to track what was sent to the other party.

**Revenue Driver:** Team tier differentiator — "Audit log & version history" is marketed on the pricing page but has zero code. This feature justifies the £99/Team tier and is a compliance requirement for HR departments, accountants, and law firms.

**Target:** This sprint (build order: DB → API → capture hooks → manual edit → UI → tests)

**Success Metric:** ≥20% of generated documents have >1 version within first month; ≥10% have an issued version stamped.

---

## Problem Statement

### Current State
- Documents have a `version` column that never increments beyond 1
- AI edits (via `/api/documents/:id/edit`) silently overwrite `outputData` — old content is permanently lost
- No changelog, no "what changed" tracking, no diff visibility
- No way to manually edit a document section without exporting to Word
- No concept of "this version was sent to the employee/contractor"
- No rollback capability

### User Needs
1. **"I edited the offer letter but I need to go back to what it said before"** — Rollback
2. **"Who changed what and when?"** — Audit trail
3. **"Which version did I actually send to the employee?"** — Issued status
4. **"I just want to fix a typo, not re-run the AI"** — Manual inline editing
5. **"Show me what changed between versions"** — Diff view

---

## Scope

### In Scope — This Build

#### 1. Database — `document_versions` table
Stores a full snapshot on every change. Every generate, AI edit, manual edit, or restore creates a new row.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Unique version ID |
| document_id | uuid (FK → documents) | Parent document |
| version | integer | Monotonically incrementing per document |
| output_data | jsonb | Full document content snapshot |
| input_data | jsonb | Input data at time of snapshot |
| change_type | text | `ai_edit` \| `manual_edit` \| `regenerate` \| `restore` \| `initial` |
| change_description | text | What changed (user's instruction or auto-generated summary) |
| changed_by | text | Clerk user ID of who made the change |
| created_at | timestamp | When this version was created |

#### 2. Database — `issued_status` on documents
Add to the `documents` table:
- `current_issued_version` (integer, nullable) — which version is currently marked as issued
- Add `issued` to `doc_status` enum

#### 3. Backend — Version capture hooks
- **On generate:** Auto-create version 1 with `change_type='initial'`
- **On AI edit:** Capture old content as a version before overwriting
- **On manual edit:** Same — snapshot before applying
- **On restore:** New version from the restored snapshot (doesn't delete old ones)

#### 4. Backend — Version API endpoints
- `GET /api/documents/:id/versions` — List all versions with metadata (no content payload by default)
- `GET /api/documents/:id/versions/:version` — Get specific version snapshot
- `POST /api/documents/:id/versions/:version/restore` — Restore to this version (creates new version with `restore` type)
- `POST /api/documents/:id/versions/:version/issue` — Mark this version as the issued one
- `GET /api/documents/:id/versions/issued` — Get the currently issued version info

#### 5. Backend — In-app manual editing
- `POST /api/documents/:id/sections/:sectionKey` — Edit one document section directly
- Accepts `{ content: string }`, creates a new version, returns updated doc

#### 6. Frontend — Version history panel
- Timeline view on document detail page: v1, v2, v3... with date, author, change type, description
- Click a version → preview content inline
- "Restore this version" button with confirmation dialog
- "Issue this version" button (marks as the official sent version)

#### 7. Frontend — Issued status badge
- "Currently Issued" badge on the document header showing which version
- Timeline shows which version is issued (visual indicator)
- Date of issuance shown

#### 8. Frontend — Inline document editing
- Rendered document sections are clickable
- Click a section → textarea replaces readonly content
- Save button → calls manual edit API → new version created
- Visual feedback (flash green on success)

### Out of Scope — v1
- Side-by-side visual diff (v2 — use a diff view library)
- Version comparison (v2)
- Auto-suggested edits (v3)
- Download specific version (v2 — currently downloads always latest)
- Email notification on version issue (v2)
- Offline editing (never)

---

## Technical Design

### Schema Migration

```sql
-- New document_versions table
CREATE TABLE document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  output_data JSONB NOT NULL,
  input_data JSONB,
  change_type TEXT NOT NULL CHECK (change_type IN ('initial', 'ai_edit', 'manual_edit', 'regenerate', 'restore')),
  change_description TEXT,
  changed_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, version)
);

-- Index for fast per-document lookups
CREATE INDEX idx_document_versions_doc_id ON document_versions(document_id, version DESC);

-- Add issued to doc_status enum
ALTER TYPE doc_status ADD VALUE IF NOT EXISTS 'issued';

-- Add current_issued_version to documents
ALTER TABLE documents ADD COLUMN current_issued_version INTEGER;
```

### API Routes Design

#### `GET /api/documents/:id/versions`
```
Response: {
  versions: Array<{
    version: number,
    changeType: string,
    changeDescription: string | null,
    changedBy: string | null,
    createdAt: string,
    isIssued: boolean  // true if matches document.currentIssuedVersion
  }>,
  totalCount: number
}
```

#### `GET /api/documents/:id/versions/:version`
```
Response: {
  version: number,
  outputData: Record<string, unknown>,
  inputData: Record<string, unknown> | null,
  changeType: string,
  changeDescription: string | null,
  changedBy: string | null,
  createdAt: string,
  isIssued: boolean
}
```

#### `POST /api/documents/:id/versions/:version/restore`
```
Request: {} (empty)
Response: {
  documentId: string,
  newVersion: number,
  content: Record<string, unknown>
}
Logic: Create new version by copying snapshot from target version, set change_type='restore', change_description='Restored from version N'
```

#### `POST /api/documents/:id/versions/:version/issue`
```
Request: {} (empty)
Response: {
  documentId: string,
  issuedVersion: number,
  issuedAt: string
}
Logic: Set document.currentIssuedVersion = :version. Update document status to 'issued'.
```

#### `POST /api/documents/:id/sections/:sectionKey`
```
Request: { content: string }
Response: {
  documentId: string,
  version: number,
  content: Record<string, unknown>
}
Logic: Deep-clone current outputData, replace section[sectionKey] with new content, save as new version with change_type='manual_edit'
```

### Version Capture in Existing Routes

**`POST /api/documents/generate`** (lib/documents/generate.ts):
Insert a `document_versions` row alongside the document creation:
```ts
const [doc] = await db.insert(documents).values({...}).returning({ id: documents.id });
await db.insert(documentVersions).values({
  documentId: doc.id,
  version: 1,
  outputData: content,
  inputData: validated.userInputs,
  changeType: 'initial',
  changeDescription: 'Document generated',
  changedBy: validated.createdBy ?? null,
});
```

**`POST /api/documents/:id/edit`** (edit/route.ts):
Before overwriting `outputData`, snapshot the old content:
```ts
// Snapshot current version before overwriting
await db.insert(documentVersions).values({
  documentId: doc.id,
  version: doc.version,
  outputData: doc.outputData,
  inputData: doc.inputData,
  changeType: 'ai_edit',
  changeDescription: instruction,
  changedBy: clerkUserId,
});

// Then update with new content
const newVersion = doc.version + 1;
await db.update(documents).set({
  outputData: updatedContent,
  version: newVersion,
  updatedAt: new Date(),
});
```

### Frontend Components

#### `DocumentDetailPage` (modified)
- Below document content: version history timeline sidebar/panel
- Version entries show version, date, changeType badge, description
- "Issued" entry has a green checkmark badge
- Click version to preview
- "Restore" and "Issue" buttons per version
- Section text becomes click-to-edit spans

#### `VersionTimeline` (new component)
```
Props: { documentId: string, currentVersion: number }
State: versions[], selectedVersion, loading
- Fetches GET /api/documents/:id/versions on mount
- Renders a vertical timeline (v1 → v2 → v3 → current)
- Each node: version number, date, type badge, description
- Highlight current version and issued version
- Click to expand/collapse content preview
- Action buttons: Restore, Issue
```

#### `InlineSectionEditor` (new component)
```
Props: { sectionKey: string, content: string, onSave: (sectionKey, newContent) => void }
State: isEditing, draftContent
- Renders content as plain text by default
- On click: switches to textarea
- On save: calls POST /api/documents/:id/sections/:sectionKey
- On success: updates parent content, shows brief "Saved vN" toast
- On error: inline error message
```

---

## Data Flow

### Document Lifecycle with Versions

```
Generate → v1 (initial)
   ↓
AI Edit → v2 (ai_edit)  [v1 snapshot saved]
   ↓
Manual Edit → v3 (manual_edit)  [v2 snapshot saved]
   ↓
Mark v2 as "Issued" → document.currentIssuedVersion = 2
   ↓
User clicks "Restore to v1" → v4 (restore) [content = v1's content]
```

### What the User Sees

```
┌─────────────────────────────────────┐
│  Offer Letter - John Smith      v3  │
│  Status: Generated          ⭐ v2 Issued │
│  ┌─────────────────────────────┐    │
│  │ Document Content            │    │
│  │ [Employee Name] John Smith ← click to edit │
│  │ [Position] Software Dev                      │
│  │ [Salary] £45,000                             │
│  └─────────────────────────────┘    │
│                                      │
│  ── Version History ──              │
│  ⭐ v2  Issued • 2 Jun 2026         │
│        "Changed notice period to 3 months" │
│   v1  Initial • 1 Jun 2026         │
│        "Document generated"         │
│   ◄ v3  Current • 3 Jun 2026       │
│        "Manual edit: corrected salary"    │
│                                      │
│  [Restore to v1] [Issue this v]      │
└─────────────────────────────────────┘
```

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| DB storage growth from version snapshots | M | H | Each snapshot is <50KB JSON. Even 100 versions = 5MB per document. Acceptable. |
| Restore creates new version (doesn't delete history) confuses users | L | M | Clear changelog description "Restored from version 2" + UI shows it |
| Concurrent edit race condition | M | L | All edit endpoints use a DB transaction that reads current version before writing |
| Manual edit conflicts with AI-generated sections | L | L | Section-level edits respect the JSON structure; AI edit returns full JSON |
| Performance of version listing for docs with 100+ versions | L | L | Indexed by (document_id, version DESC). LIMIT 50 with pagination. |

## Cost Analysis

Zero additional AI cost — versions are DB snapshots, not AI calls. The manual editing endpoint doesn't call AI at all. Only restore uses a DB read.

Storage: ~50KB per version × 100 versions × 1000 documents = ~5GB total — negligible for PostgreSQL.

## Success Metrics

- **Adoption:** ≥20% of documents have >1 version within 30 days
- **Issued usage:** ≥10% of documents have an issued version within 30 days
- **Engagement:** Average 2.5 versions per document that use the feature
- **Conversion:** Team sign-ups citing "version history + audit log" as a key reason
- **Support tickets:** Zero tickets about "lost my content" or "which version did I send"