# Data Model: Audit Trail UX & PDF Report Improvements

**Feature**: 003-audit-trail-pdf-improvements
**Date**: 2026-05-24

---

## No Schema Changes

All required data already exists. This feature is purely a presentation layer improvement — no new tables, columns, or migrations needed.

---

## Existing Entities (relevant fields)

### AuditLogEntry (already in DB)

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| eventType | EventType enum | See values below |
| eventTimestamp | DateTime | UTC |
| actor | String | Username or "SYSTEM" |
| payload | Json | Flexible metadata — see payload shapes below |
| outcome | Outcome enum | `success` \| `failure` \| `partial` |
| errorDetail | String? | Populated for failure events |
| sessionId | String? | FK to Session |
| userId | String? | FK to User |

### EventType enum values

- `session_created`
- `document_uploaded`
- `ai_request_initiated`
- `ai_response_received`
- `finding_reviewed`
- `session_finalised`
- `report_exported`
- `auth_event`

---

## Payload Shapes (per event type)

### `finding_reviewed`
```json
{
  "finding_id": "uuid",
  "action": "accepted" | "edited" | "dismissed",
  "confidence_score": 0.87,
  "had_edit": false,
  "note_provided": false
}
```

### `ai_response_received` (failure)
```json
{}
```
Error message is in `errorDetail` field, not `payload`.

### `ai_request_initiated`
```json
{
  "document_id": "uuid",
  "document_name": "filename.pdf"
}
```

### `report_exported`
```json
{
  "report_filename": "controlguard-report-uuid.pdf",
  "session_id": "uuid",
  "exported_by": "username"
}
```

### `document_uploaded`
```json
{
  "filename": "file.docx",
  "filesize": 204800,
  "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
```

---

## Frontend Type Extension

The frontend `auditEntries` array type needs to be extended to expose `payload` and `errorDetail`:

```typescript
// Before (SessionDetailView.vue line 318)
Array<{
  id: string
  eventType: string
  eventTimestamp: string
  actor: string
  outcome: string
}>

// After
Array<{
  id: string
  eventType: string
  eventTimestamp: string
  actor: string
  outcome: string
  payload: Record<string, unknown>
  errorDetail: string | null
}>
```

---

## Outcome Label Mapping

Deterministic function — no state, no API call needed:

```
getOutcomeLabel(entry: AuditEntry): string
  if entry.eventType === 'finding_reviewed':
    if entry.payload.action === 'accepted'  → "Approved"
    if entry.payload.action === 'edited'    → "Approved"
    if entry.payload.action === 'dismissed' → "Rejected"
  if entry.eventType === 'session_finalised':
    → "Finalised"
  if entry.eventType === 'report_exported':
    → "Exported"
  // fallback
  if entry.outcome === 'success' → "Success"
  if entry.outcome === 'failure' → "Failed"
  if entry.outcome === 'partial' → "Partial"
```

---

## PDF Date Format Helper

```
formatPdfDate(date: Date): string
  → "DD Mon YYYY, HH:MM"  (e.g. "24 May 2026, 15:30")
```

Replaces all `.toISOString()` calls in `reports.service.ts` on:
- `session.finalisedAt` (line 42)
- `new Date()` export date (line 43)
- `finding.reviewerDecision.decidedAt` (line 66)
- `entry.eventTimestamp` in audit trail loop (line 94)
