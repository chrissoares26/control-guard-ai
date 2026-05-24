# Research: Audit Trail UX & PDF Report Improvements

**Feature**: 003-audit-trail-pdf-improvements
**Phase**: 0 — Pre-design research
**Date**: 2026-05-24

---

## Decision 1: Does the backend need to change to expose event metadata?

**Decision**: No backend schema or service changes required for metadata exposure.

**Rationale**: `AuditLogService.findBySession()` already performs an unconstrained `findMany` that returns the full Prisma record — including `payload` (JSON) and `errorDetail` (string | null). The API is already sending these fields to the frontend. The frontend `SessionDetailView.vue` just ignores them because the TypeScript type annotation only declares `id`, `eventType`, `eventTimestamp`, `actor`, `outcome`. Expanding the type and reading the additional fields is the only change needed.

**Alternatives considered**: Adding a dedicated `GET /sessions/:id/audit-log/:entryId` detail endpoint. Rejected — unnecessary round trip; all data is already in the list response.

---

## Decision 2: How should finding review outcomes map to contextual labels?

**Decision**: Map via `(eventType, payload.action)` tuple, with fallback to capitalised outcome string.

**Rationale**: The `finding_reviewed` event stores the auditor's decision in `payload.action` as `accepted`, `edited`, or `dismissed`. The outcome field is always `success` for these events (by design in `findings.service.ts`). Relying solely on outcome would lose the distinction. The mapping is:

| Event type | payload.action | Contextual label |
|---|---|---|
| `finding_reviewed` | `accepted` | Approved |
| `finding_reviewed` | `edited` | Approved (with edit) |
| `finding_reviewed` | `dismissed` | Rejected |
| `session_finalised` | — | Finalised |
| `report_exported` | — | Exported |
| `ai_response_received` | — (outcome=failure) | Failed |
| any | — (outcome=success) | Success (fallback) |
| any | — (outcome=failure) | Failed (fallback) |

**Alternatives considered**: Using only `outcome` field. Rejected — `finding_reviewed` always has `outcome: success`, so approved and rejected would look identical. Using a separate `outcome` DB column for decision. Rejected — schema change not needed given payload already stores it.

---

## Decision 3: Detail panel — modal vs inline row expansion?

**Decision**: Inline row expansion (click row → expand a detail row beneath it).

**Rationale**: A modal for compact table rows (each row is ~30px tall) feels heavy-handed. Inline expansion preserves table context and keeps the user's eye on the surrounding events. This pattern is well-established in audit log UIs. On mobile, the same inline expansion works; the panel can stack vertically since mobile already uses a narrower layout.

**Alternatives considered**: Slide-over drawer. Rejected — adds complexity and obscures the rest of the table. Modal. Rejected — disrupts flow for quick lookups.

---

## Decision 4: What content should the detail panel show?

**Decision**: Three tiers of content, shown only when available:

1. **Human-readable summary** — derived from event type + payload (e.g. "Finding #3 was reviewed and accepted by auditor")
2. **Error detail** — `errorDetail` field, shown prominently in red for failure events
3. **Raw metadata** — `payload` JSON rendered as a readable key-value list

If `payload` is empty `{}` and `errorDetail` is null, show: "No additional details recorded for this event."

**Rationale**: Auditors need to quickly understand failures, not just see raw JSON. Prioritising a human-readable summary first makes the panel useful without technical knowledge. Raw payload as secondary layer satisfies power users.

---

## Decision 5: PDF timestamp format

**Decision**: `DD Mon YYYY, HH:MM` (e.g., "24 May 2026, 15:30") — locale-neutral, unambiguous, professional.

**Rationale**: This matches the format already used in the frontend (`toLocaleDateString('en-GB', ...)`). Consistent format across app and PDF avoids confusion. Avoids 12/24h ambiguity by using 24h. ISO strings (`2026-05-24T15:30:12.456Z`) are machine-readable, not human-readable, and should never appear in end-user documents.

**Alternatives considered**: `24/05/2026 15:30` (numeric). Rejected — less readable in a professional report. `May 24, 2026` (US format). Rejected — inconsistent with en-GB locale used elsewhere.

---

## Decision 6: PDF audit trail — table layout approach with pdfkit

**Decision**: Manual column layout using pdfkit's `text()` with explicit x-positions and page-width tracking, with alternating row background.

**Rationale**: pdfkit does not have a native table component. The standard approach is to draw column content at fixed x offsets, advancing y after each row. A header row in Helvetica-Bold, data rows in Helvetica-9pt with alternating slate-50 backgrounds for readability. Outcome column uses the same contextual label mapping as the in-app UI.

Column widths for A4 (usable width ~495pt with 50pt margins):
| Column | Width |
|---|---|
| Timestamp | 110pt |
| Event | 175pt |
| Actor | 90pt |
| Outcome | 120pt |

**Alternatives considered**: Using an external pdfkit table library (pdfkit-table). Rejected — avoids adding a dependency for a simple 4-column appendix. HTML-to-PDF (puppeteer). Rejected — much heavier change; reports.service.ts already uses pdfkit throughout.

---

## Summary: No Backend Schema or API Changes Required

All data needed for these improvements already exists in the database and is already returned by the API. The full scope of changes is:

1. **Frontend** (`SessionDetailView.vue`): Extend type, make rows clickable, add inline detail panel, add `getOutcomeLabel()` mapping function
2. **Backend** (`reports.service.ts`): Add `formatPdfDate()` helper, replace `.toISOString()` calls, replace plain-text audit loop with column-layout table
