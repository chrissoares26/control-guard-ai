# Implementation Plan: Audit Trail UX & PDF Report Improvements

**Branch**: `003-audit-trail-pdf-improvements` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-audit-trail-pdf-improvements/spec.md`

---

## Summary

Improve the audit trail table in `SessionDetailView.vue` with clickable row expansion (detail panel showing event metadata and failure reasons), contextual outcome labels (Approved/Rejected for findings, Failed for AI errors), and fix the PDF report's raw ISO timestamps and plain-text audit appendix — replacing them with formatted dates and a proper 4-column table layout.

**No backend schema or API changes are required.** All data already exists and is already returned by the API; this is a pure presentation-layer improvement.

---

## Technical Context

**Language/Version**: TypeScript 5.x (both frontend and backend)

**Primary Dependencies**:
- Frontend: Vue 3 + Vite + Tailwind CSS (existing)
- Backend: NestJS + pdfkit (existing)

**Storage**: PostgreSQL via Prisma — no changes

**Testing**: Vitest (frontend unit), Jest (backend unit) — existing setup

**Target Platform**: Web (desktop + mobile responsive)

**Project Type**: Full-stack web application (NestJS API + Vue 3 SPA)

**Performance Goals**: Inline detail expansion is synchronous (data already in memory) — no loading state needed for row expansion

**Constraints**: Must not change the API contract; must not modify Prisma schema

**Scale/Scope**: 2 files to edit (`SessionDetailView.vue`, `reports.service.ts`); no new files required

---

## Constitution Check

Constitution is a blank template (not yet filled in for this project). No gates to evaluate.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-audit-trail-pdf-improvements/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entity shapes and type changes
├── contracts/
│   └── audit-log-api.md ← API contract (no changes needed)
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (files to change)

```text
frontend/
└── src/
    └── views/
        └── SessionDetailView.vue    ← audit trail table + detail panel + outcome labels

backend/
└── src/
    └── reports/
        └── reports.service.ts       ← PDF timestamp formatting + audit table layout
```

**Structure Decision**: Web application (Option 2 from template). Only two existing files need edits; no new files, no new components.

---

## Implementation Breakdown

### Change 1 — Frontend: Extend audit entry type (SessionDetailView.vue)

**File**: `frontend/src/views/SessionDetailView.vue` line 318

Extend the `auditEntries` type to include `payload` and `errorDetail`:

```typescript
auditEntries = ref<Array<{
  id: string
  eventType: string
  eventTimestamp: string
  actor: string
  outcome: string
  payload: Record<string, unknown>
  errorDetail: string | null
}>>([])
```

---

### Change 2 — Frontend: Contextual outcome label function

Add a `getOutcomeLabel(entry)` function and a `getOutcomeMeta(entry)` function for badge color:

```typescript
function getOutcomeLabel(entry: AuditEntry): string {
  if (entry.eventType === 'finding_reviewed') {
    const action = entry.payload?.action as string
    if (action === 'accepted' || action === 'edited') return 'Approved'
    if (action === 'dismissed') return 'Rejected'
  }
  if (entry.eventType === 'session_finalised') return 'Finalised'
  if (entry.eventType === 'report_exported') return 'Exported'
  if (entry.outcome === 'success') return 'Success'
  if (entry.outcome === 'failure') return 'Failed'
  return 'Partial'
}

// Returns Tailwind classes for the badge
function getOutcomeClass(entry: AuditEntry): string {
  const label = getOutcomeLabel(entry)
  if (label === 'Approved' || label === 'Finalised' || label === 'Exported' || label === 'Success') {
    return 'inline-flex items-center gap-1 text-emerald-700 font-medium'
  }
  if (label === 'Rejected' || label === 'Failed') {
    return 'inline-flex items-center gap-1 text-red-600 font-medium'
  }
  return 'inline-flex items-center gap-1 text-amber-600 font-medium'
}
```

Replace the hardcoded `entry.outcome` text in the table with `getOutcomeLabel(entry)`.

---

### Change 3 — Frontend: Clickable rows with inline detail expansion

**State to add**:
```typescript
const expandedAuditId = ref<string | null>(null)

function toggleAuditDetail(id: string) {
  expandedAuditId.value = expandedAuditId.value === id ? null : id
}
```

**Table row changes**:
- Add `@click="toggleAuditDetail(entry.id)"` and `cursor-pointer` to each `<tr>`
- After each `<tr>`, conditionally render a detail `<tr>` when `expandedAuditId === entry.id`

**Detail row content**:
```
if errorDetail → show error message in red box
if payload (non-empty) → show human-readable summary + key-value list
else → "No additional details recorded for this event."
```

**Human-readable summary logic**:
```typescript
function getEventSummary(entry: AuditEntry): string {
  const p = entry.payload as any
  switch (entry.eventType) {
    case 'finding_reviewed':
      return `Finding was ${getOutcomeLabel(entry).toLowerCase()} (action: ${p.action})`
    case 'document_uploaded':
      return `Document "${p.filename}" (${formatFileSize(p.filesize)}) was uploaded`
    case 'ai_request_initiated':
      return `AI analysis started for document "${p.document_name}"`
    case 'ai_response_received':
      return entry.outcome === 'failure'
        ? 'AI analysis failed — see error detail below'
        : 'AI analysis completed successfully'
    case 'report_exported':
      return `Report exported by ${p.exported_by} as "${p.report_filename}"`
    case 'session_finalised':
      return 'Session was marked as finalised'
    case 'session_created':
      return 'Session was created'
    default:
      return entry.eventType.replace(/_/g, ' ')
  }
}
```

**Detail row layout**:
```html
<tr v-if="expandedAuditId === entry.id">
  <td colspan="4" class="px-5 py-4 bg-slate-50 border-b border-slate-100">
    <!-- Error box (failure events only) -->
    <div v-if="entry.errorDetail" class="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
      <span class="font-semibold">Error:</span> {{ entry.errorDetail }}
    </div>

    <!-- Summary -->
    <p class="text-xs text-slate-700 mb-2 font-medium">{{ getEventSummary(entry) }}</p>

    <!-- Key-value metadata -->
    <div v-if="hasPayload(entry)" class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      <template v-for="(val, key) in entry.payload" :key="key">
        <span class="text-slate-400 font-mono">{{ key }}</span>
        <span class="text-slate-700">{{ val }}</span>
      </template>
    </div>

    <!-- No data fallback -->
    <p v-else-if="!entry.errorDetail" class="text-xs text-slate-400 italic">
      No additional details recorded for this event.
    </p>
  </td>
</tr>
```

---

### Change 4 — Backend PDF: Timestamp formatting helper

**File**: `backend/src/reports/reports.service.ts`

Add a private helper method:
```typescript
private formatPdfDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '') // produces "24 May 2026 15:30"
}
```

Replace all `.toISOString()` date calls in `generate()`:
- Line 42: `session.finalisedAt?.toISOString()` → `session.finalisedAt ? this.formatPdfDate(session.finalisedAt) : 'N/A'`
- Line 43: `new Date().toISOString()` → `this.formatPdfDate(new Date())`
- Line 66: `finding.reviewerDecision.decidedAt.toISOString()` → `this.formatPdfDate(finding.reviewerDecision.decidedAt)`
- Line 94 (audit loop): `entry.eventTimestamp.toISOString()` → `this.formatPdfDate(entry.eventTimestamp)`

---

### Change 5 — Backend PDF: Audit trail table layout

**File**: `backend/src/reports/reports.service.ts` lines 85-97

Replace the plain-text audit loop with a pdfkit column-layout table:

```typescript
// Audit trail appendix
doc.addPage()
doc.fontSize(14).font('Helvetica-Bold').text('Audit Trail Appendix')
doc.moveDown(0.5)

// Column x positions (A4 usable width ~495pt, margins 50pt each side)
const cols = { timestamp: 50, event: 160, actor: 335, outcome: 425 }
const rowHeight = 16
const pageBottom = 780 // leave margin before new page

// Header row
doc.fontSize(8).font('Helvetica-Bold')
doc.text('Timestamp', cols.timestamp, doc.y, { width: 105, lineBreak: false })
doc.text('Event', cols.event, doc.y - 8, { width: 170, lineBreak: false })
doc.text('Actor', cols.actor, doc.y - 8, { width: 85, lineBreak: false })
doc.text('Outcome', cols.outcome, doc.y - 8, { width: 120 })
doc.moveDown(0.3)

// Divider line
const headerBottom = doc.y
doc.moveTo(50, headerBottom).lineTo(545, headerBottom).stroke()
doc.moveDown(0.3)

// Data rows
doc.fontSize(8).font('Helvetica')
const logsToShow = session.auditLogs.slice(0, 200)
for (const entry of logsToShow) {
  if (doc.y > pageBottom) doc.addPage()

  const outcomeLabel = this.getAuditOutcomeLabel(entry)
  const rowY = doc.y

  doc.text(this.formatPdfDate(entry.eventTimestamp), cols.timestamp, rowY, { width: 105, lineBreak: false })
  doc.text(entry.eventType.replace(/_/g, ' '), cols.event, rowY, { width: 170, lineBreak: false })
  doc.text(entry.actor, cols.actor, rowY, { width: 85, lineBreak: false })
  doc.text(outcomeLabel, cols.outcome, rowY, { width: 120 })
  doc.moveDown(0.1)
}
```

Add a private `getAuditOutcomeLabel` method mirroring the frontend mapping:
```typescript
private getAuditOutcomeLabel(entry: { eventType: string; outcome: string; payload: unknown }): string {
  const p = entry.payload as Record<string, unknown> | null
  if (entry.eventType === 'finding_reviewed') {
    if (p?.action === 'accepted' || p?.action === 'edited') return 'Approved'
    if (p?.action === 'dismissed') return 'Rejected'
  }
  if (entry.eventType === 'session_finalised') return 'Finalised'
  if (entry.eventType === 'report_exported') return 'Exported'
  if (entry.outcome === 'failure') return 'Failed'
  return 'Success'
}
```

---

## Complexity Tracking

No constitution violations. This feature makes no architectural changes — it's a UI and document formatting improvement across two existing files.
