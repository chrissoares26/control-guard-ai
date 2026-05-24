# API Contract: Audit Log Endpoint

**Endpoint**: `GET /sessions/:id/audit-log`
**Controller**: `backend/src/audit-log/audit-log.controller.ts`

## No Changes Required

The endpoint already returns all necessary fields. No contract change is needed.

## Current Response Shape

```typescript
Array<{
  id: string                      // UUID
  eventType: EventType            // e.g. "finding_reviewed"
  eventTimestamp: string          // ISO 8601 datetime
  actor: string                   // username or "SYSTEM"
  payload: Record<string, unknown> // event-specific metadata (already returned)
  outcome: "success" | "failure" | "partial"
  errorDetail: string | null      // error message for failures (already returned)
  sessionId: string | null
  userId: string | null
  createdAt: string               // Prisma auto field
}>
```

## Frontend Usage Change

The frontend currently only reads `id`, `eventType`, `eventTimestamp`, `actor`, `outcome`. After this feature:
- `payload` is read for contextual outcome labels and detail panel content
- `errorDetail` is read for failure event detail display

No breaking changes. Fully backward compatible.
