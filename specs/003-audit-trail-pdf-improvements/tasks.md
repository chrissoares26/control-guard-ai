# Tasks: Audit Trail UX & PDF Report Improvements

**Input**: Design documents from `specs/003-audit-trail-pdf-improvements/`

**Prerequisites**: plan.md ✓ | spec.md ✓ | research.md ✓ | data-model.md ✓ | contracts/ ✓

**No tests requested** — no test tasks generated.

**Organization**: Tasks are grouped by user story. Two parallel implementation streams exist:
- **Stream A** (frontend): US1 → US2 (both touch `SessionDetailView.vue`)
- **Stream B** (backend/PDF): US3 → US4 (both touch `reports.service.ts`)

Streams A and B are independent and can be worked in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on other in-progress tasks)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

No setup needed. No new packages, no schema changes, no new files. All changes are to two existing files.

---

## Phase 2: Foundational

No foundational prerequisites. Both streams can start immediately from the current codebase.

---

## Phase 3: User Story 1 — Clickable Audit Trail with Detail Panel (Priority: P1) 🎯 MVP

**Goal**: Each audit trail row can be clicked to expand an inline detail panel showing a human-readable summary, error messages (for failures), and the event's raw metadata as a key-value list.

**Independent Test**: Open a session with a failed `ai response received` event. Click the row. Confirm a panel expands below it showing the error reason from `errorDetail`. Click the row again. Confirm the panel collapses.

### Implementation for User Story 1

- [x] T001 [US1] Extend `auditEntries` ref type to include `payload` and `errorDetail` fields in `frontend/src/views/SessionDetailView.vue` (line 318)
- [x] T002 [US1] Add `expandedAuditId` ref and `toggleAuditDetail(id)` function to script section of `frontend/src/views/SessionDetailView.vue`
- [x] T003 [US1] Add `getEventSummary(entry)` helper function to `frontend/src/views/SessionDetailView.vue` per mapping defined in `specs/003-audit-trail-pdf-improvements/plan.md` (Change 3)
- [x] T004 [US1] Add `hasPayload(entry)` helper that returns true when `entry.payload` has at least one key in `frontend/src/views/SessionDetailView.vue`
- [x] T005 [US1] Update the audit trail `<tr>` in `frontend/src/views/SessionDetailView.vue` to add `@click="toggleAuditDetail(entry.id)"` and `cursor-pointer` class
- [x] T006 [US1] Add the conditional detail expansion `<tr>` immediately after each row `<tr>` in the audit trail `<tbody>` of `frontend/src/views/SessionDetailView.vue` — renders when `expandedAuditId === entry.id` with `colspan="4"`, error box, summary, and key-value payload grid per plan.md Change 3

**Checkpoint**: User Story 1 complete — audit trail rows are clickable and expand/collapse a detail panel with event context and failure reasons.

---

## Phase 4: User Story 2 — Contextual Outcome Labels (Priority: P2)

**Goal**: The Outcome column shows specific labels — "Approved"/"Rejected" for finding reviews, "Finalised" for session finalization, "Failed" for AI errors — instead of the generic "success"/"failure" strings.

**Independent Test**: Review a session where at least one finding was approved and one was rejected. Confirm the audit trail Outcome column shows "Approved" and "Rejected" respectively (not "success"). Confirm a failure event shows "Failed" in red.

**Note**: This phase modifies the same file as US1. It must be done after US1 is complete.

### Implementation for User Story 2

- [x] T007 [US2] Add `getOutcomeLabel(entry)` function to `frontend/src/views/SessionDetailView.vue` per mapping in `specs/003-audit-trail-pdf-improvements/plan.md` (Change 2) — covers `finding_reviewed`, `session_finalised`, `report_exported`, and generic fallbacks
- [x] T008 [US2] Add `getOutcomeClass(entry)` function to `frontend/src/views/SessionDetailView.vue` returning Tailwind classes based on label (emerald for positive outcomes, red for Rejected/Failed, amber for Partial) per plan.md Change 2
- [x] T009 [US2] Replace the outcome `<span>` in the audit trail table (lines 260–273 of `frontend/src/views/SessionDetailView.vue`) to use `:class="getOutcomeClass(entry)"` and `{{ getOutcomeLabel(entry) }}` instead of hardcoded `entry.outcome` string

**Checkpoint**: User Stories 1 and 2 complete — audit trail table shows contextual labels with appropriate colour coding.

---

## Phase 5: User Story 3 — Formatted Timestamps in PDF Report (Priority: P3)

**Goal**: All dates and times in the exported PDF report are formatted as `DD Mon YYYY, HH:MM` — no raw ISO 8601 strings visible to readers.

**Independent Test**: Export a PDF from a finalised session. Open it and confirm all dates (cover page, finding reviewer timestamps) are formatted like "24 May 2026, 15:30" — no `T` separators, no milliseconds, no `Z` suffix.

**Note**: This phase modifies `reports.service.ts` — entirely independent of the frontend changes in US1/US2 and can be done in parallel with Phases 3–4.

### Implementation for User Story 3

- [x] T010 [P] [US3] Add private `formatPdfDate(date: Date): string` method to `ReportsService` in `backend/src/reports/reports.service.ts` that returns `"DD Mon YYYY, HH:MM"` format (e.g. "24 May 2026, 15:30") using `toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })`
- [x] T011 [US3] Replace `session.finalisedAt?.toISOString() || 'N/A'` (line 42) with `session.finalisedAt ? this.formatPdfDate(session.finalisedAt) : 'N/A'` in `backend/src/reports/reports.service.ts`
- [x] T012 [US3] Replace `new Date().toISOString()` (line 43) with `this.formatPdfDate(new Date())` in `backend/src/reports/reports.service.ts`
- [x] T013 [US3] Replace `finding.reviewerDecision.decidedAt.toISOString()` (line 66) with `this.formatPdfDate(finding.reviewerDecision.decidedAt)` in `backend/src/reports/reports.service.ts`

**Checkpoint**: User Story 3 complete — all timestamps in the PDF body use human-readable formatted dates.

---

## Phase 6: User Story 4 — Structured Audit Trail Table in PDF (Priority: P3)

**Goal**: The Audit Trail Appendix in the exported PDF is rendered as a 4-column table (Timestamp | Event | Actor | Outcome) with formatted dates and contextual outcome labels, replacing the current plain-text line-by-line format.

**Independent Test**: Export a PDF from a finalised session with multiple events including finding reviews (accepted and dismissed). Open the Audit Trail Appendix. Confirm it shows a table with column headers, "Approved"/"Rejected" labels for finding reviews, and formatted timestamps.

**Note**: This phase modifies the same file as US3. It must be done after US3 is complete (T010 adds `formatPdfDate` which T018 depends on).

### Implementation for User Story 4

- [x] T014 [US4] Add private `getAuditOutcomeLabel(entry)` method to `ReportsService` in `backend/src/reports/reports.service.ts` per mapping defined in `specs/003-audit-trail-pdf-improvements/plan.md` (Change 5) — mirrors frontend mapping for `finding_reviewed`, `session_finalised`, `report_exported`, failure fallback
- [x] T015 [US4] Replace the plain-text audit trail loop (lines 85–97 of `backend/src/reports/reports.service.ts`) with the column-layout table implementation from `specs/003-audit-trail-pdf-improvements/plan.md` (Change 5) — column x positions: timestamp=50, event=160, actor=335, outcome=425; header row in Helvetica-Bold-8; data rows in Helvetica-8; page overflow check using `pageBottom=780`
- [x] T016 [US4] Verify the audit trail table handles page overflow correctly: when `doc.y > pageBottom`, `doc.addPage()` is called before rendering the next row in `backend/src/reports/reports.service.ts`

**Checkpoint**: All four user stories complete — clickable audit trail, contextual labels, formatted PDF timestamps, structured PDF appendix table.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T017 [P] Verify that the audit trail detail panel collapses correctly when clicking the same row a second time (toggle behaviour) in `frontend/src/views/SessionDetailView.vue`
- [x] T018 [P] Verify that expanding one row automatically collapses any previously expanded row by checking `expandedAuditId` is a single ref (not an array) in `frontend/src/views/SessionDetailView.vue`
- [x] T019 [P] Verify PDF table doesn't break for sessions with 0 audit entries — the `logsToShow` slice will be empty and the table header should still render without data rows in `backend/src/reports/reports.service.ts`
- [x] T020 Smoke test: export a PDF from a finalised session in the running app and visually confirm all four improvements are present

---

## Dependencies & Execution Order

### Stream A — Frontend (sequential, same file)

```
T001 → T002 → T003 → T004 → T005 → T006   (US1 complete)
                                  ↓
                    T007 → T008 → T009      (US2 complete)
```

### Stream B — Backend/PDF (sequential within stream, parallel with Stream A)

```
T010 → T011 → T012 → T013                  (US3 complete)
                         ↓
              T014 → T015 → T016            (US4 complete)
```

### Cross-stream

Stream A and Stream B are fully independent. They touch different files and can be executed by different developers simultaneously, or by a single developer in any order.

### Polish

T017–T020 depend on all streams complete.

---

## Parallel Execution Example

```bash
# Run both streams in parallel (two developers):
Developer A: T001, T002, T003, T004, T005, T006 (US1), then T007, T008, T009 (US2)
Developer B: T010 (parallel), T011, T012, T013 (US3), then T014, T015, T016 (US4)
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete T001–T006 (Stream A, US1)
2. **VALIDATE**: Click a failure event row, confirm detail panel expands with error message
3. If validated, continue to US2

### Recommended Single-Developer Order

1. Stream A first: T001–T009 (frontend, US1 + US2 — higher priority)
2. Stream B second: T010–T016 (backend PDF, US3 + US4)
3. Polish: T017–T020

### Parallel Team Order

- Developer A takes Stream A (T001–T009)
- Developer B takes Stream B (T010–T016)
- Both run T017–T020 together after merge

---

## Notes

- No new npm packages required
- No Prisma migrations required
- No new Vue components required — all changes are within existing files
- `payload` and `errorDetail` are already returned by the API — no backend query changes needed
- The `[P]` marker on T010 indicates it can start immediately (parallel with Stream A), not that it has internal parallelism within Stream B
