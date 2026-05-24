# Feature Specification: Audit Trail UX & PDF Report Improvements

**Feature Branch**: `003-audit-trail-pdf-improvements`

**Created**: 2026-05-24

**Status**: Draft

**Input**: User description: "Improve audit trail clickability with detailed event info, contextual outcome labels for finding reviews, and better PDF report timestamp and appendix formatting"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clickable Audit Trail Entries with Detail Panel (Priority: P1)

An auditor reviewing a session wants to understand what happened during an AI analysis failure. Currently the audit trail shows `ai response received | SYSTEM | failure` with no way to learn what the failure was. The auditor should be able to click any audit trail row and see full details: a human-readable description, the raw error or response metadata, and any relevant context.

**Why this priority**: Failures without context are useless for audit and compliance purposes. This is the most direct improvement to the audit trail's core value proposition.

**Independent Test**: Can be fully tested by opening a session with a failure event, clicking the row, and confirming a detail panel appears with descriptive failure information.

**Acceptance Scenarios**:

1. **Given** an audit trail row exists, **When** the auditor clicks on it, **Then** an expandable panel or modal opens showing full event details including a human-readable description and any associated metadata (error message, request ID, finding ID, etc.)
2. **Given** an `ai response received` event with `failure` outcome, **When** the auditor clicks the row, **Then** the detail view shows the specific error reason (e.g., "AI provider returned an error: token limit exceeded")
3. **Given** a `finding reviewed` event, **When** the auditor clicks it, **Then** the detail view shows which finding was reviewed and the decision made
4. **Given** any audit trail row, **When** the auditor clicks it, **Then** the row is visually highlighted to indicate it is selected/expanded

---

### User Story 2 - Contextual Outcome Labels in Audit Trail (Priority: P2)

An auditor reviewing the audit trail sees the same generic "success" label for wildly different events — a finding being approved looks identical to a finding being rejected. Outcome labels should reflect the actual decision or result of each event type.

**Why this priority**: Immediately improves readability of the audit trail without requiring any interaction, and directly addresses the user's stated confusion.

**Independent Test**: Can be fully tested by reviewing a session where findings were both approved and rejected and confirming distinct labels appear in the Outcome column.

**Acceptance Scenarios**:

1. **Given** a `finding reviewed` event where the finding was approved, **When** the auditor views the audit trail, **Then** the Outcome column shows "Approved" instead of "success"
2. **Given** a `finding reviewed` event where the finding was rejected, **When** the auditor views the audit trail, **Then** the Outcome column shows "Rejected" instead of "success"
3. **Given** a `session finalised` event, **When** the auditor views the audit trail, **Then** the Outcome column shows "Finalised" (or "Complete") instead of "success"
4. **Given** an `ai response received` event with failure, **When** the auditor views the audit trail, **Then** the Outcome column shows "Failed" in a visually distinct style (e.g., red badge)
5. **Given** any event not covered by a specific label override, **When** the auditor views the audit trail, **Then** the generic "success" / "failure" label is still shown as a sensible fallback

---

### User Story 3 - Formatted Timestamps in PDF Report (Priority: P3)

An auditor exports a PDF report and finds that timestamps throughout the report are poorly formatted (e.g., raw ISO strings like `2026-05-23T21:22:00.000Z`). All dates and times in the PDF should be presented in a clear, human-readable format consistent with the rest of the application.

**Why this priority**: Cosmetic but important for professional presentation in an audit report delivered to stakeholders.

**Independent Test**: Can be fully tested by exporting a PDF and confirming all date/time values are formatted consistently (e.g., "23 May 2026, 23:22").

**Acceptance Scenarios**:

1. **Given** a finalised session, **When** a PDF report is exported, **Then** all timestamps in the report body (session start, finding dates, etc.) are formatted as `DD Mon YYYY, HH:MM` (e.g., "23 May 2026, 23:22")
2. **Given** a PDF report, **When** an auditor reviews the cover page or summary section, **Then** the report date is shown in a full human-readable format
3. **Given** a PDF report, **When** an auditor reviews any section with dates, **Then** no raw ISO 8601 strings (e.g., `T21:22:00.000Z`) are visible

---

### User Story 4 - Structured Audit Trail Appendix in PDF (Priority: P3)

An auditor exports a PDF report and finds the Audit Trail Appendix is presented as an unstructured text block, making it hard to scan. The appendix should use a formatted table with clearly labelled columns so it is easy to read and reference.

**Why this priority**: Equally cosmetic to timestamp formatting; both are low-effort improvements to the PDF that significantly improve perceived quality.

**Independent Test**: Can be fully tested by exporting a PDF and confirming the audit trail appendix is rendered as a properly structured table.

**Acceptance Scenarios**:

1. **Given** a finalised session with audit trail events, **When** a PDF is exported, **Then** the Audit Trail Appendix is rendered as a table with columns: Timestamp, Event, Actor, Outcome
2. **Given** the PDF audit trail table, **When** an auditor reviews it, **Then** all outcome values use the same contextual labels defined in User Story 2 (e.g., "Approved", "Rejected", "Failed")
3. **Given** the PDF audit trail table, **When** an auditor reviews it, **Then** all timestamps use the formatted style defined in User Story 3
4. **Given** the PDF audit trail table, **When** an auditor reviews rows with failure events, **Then** those rows are visually distinct (e.g., text highlighted or prefixed with an indicator)

---

### Edge Cases

- What happens when an audit trail event has no metadata (e.g., old events logged before metadata was added)? The detail panel should still open but show "No additional details available."
- What happens when the detail panel content is very long (e.g., a large AI error payload)? The panel should scroll rather than overflow.
- What happens when a `finding reviewed` event references a finding that has since been deleted? The detail panel should show the finding ID and note it is no longer available.
- What happens when a PDF is exported for a session with zero audit trail events? The appendix section should be omitted or show an "No events recorded" placeholder.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each audit trail row MUST be clickable and open a detail view (inline expansion or modal) showing a human-readable event description and any stored metadata
- **FR-002**: The detail view for failure events MUST display the specific error reason or failure message
- **FR-003**: The Outcome column MUST display contextual labels for `finding reviewed` events: "Approved" when the finding was accepted, "Rejected" when it was declined
- **FR-004**: The Outcome column MUST display "Failed" (with distinct visual styling) for any event with a failure outcome
- **FR-005**: All other outcome values that do not have a specific contextual label MUST fall back to a capitalised human-readable form (e.g., "Success", "Failed")
- **FR-006**: PDF report exports MUST format all date/time values as `DD Mon YYYY, HH:MM` (e.g., "23 May 2026, 23:22") — no raw ISO strings
- **FR-007**: The PDF Audit Trail Appendix MUST be rendered as a table with columns: Timestamp, Event, Actor, Outcome
- **FR-008**: The PDF Audit Trail Appendix table MUST use the same contextual outcome labels as the in-app audit trail (FR-003 through FR-005)
- **FR-009**: The PDF Audit Trail Appendix table MUST use the formatted timestamp style (FR-006)
- **FR-010**: Rows representing failure events in the PDF Audit Trail table MUST be visually distinguished from success rows

### Key Entities

- **AuditTrailEvent**: Represents a single logged action; has a type (e.g., `finding_reviewed`), actor, outcome, timestamp, and optional metadata payload
- **EventDetailMetadata**: Structured or freeform data associated with an event (error messages, finding IDs, request IDs); used to populate the detail view
- **OutcomeLabel**: A mapping from (event type, outcome value, optional metadata) → display label (e.g., `finding_reviewed + success + approved → "Approved"`)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An auditor can identify the specific reason for any failure event in the audit trail in under 10 seconds (one click, readable detail view)
- **SC-002**: All outcome labels in the audit trail accurately reflect the actual decision or result (zero generic "success" labels where a contextual label applies)
- **SC-003**: Exported PDF reports contain zero raw ISO timestamp strings
- **SC-004**: The PDF Audit Trail Appendix is rendered as a structured table, enabling an auditor to scan 20 events in under 30 seconds

## Assumptions

- Audit trail events already store metadata (e.g., error messages, finding decision) in the backend; this feature primarily surfaces existing data in the UI
- If metadata is not currently stored for some event types, the backend may need to be extended — this is considered in scope
- The contextual label mapping covers the specific event types present in the application (`finding_reviewed`, `ai_response_received`, `session_finalised`, `report_exported`); new event types added in the future would default to generic labels until explicitly mapped
- PDF generation is handled by an existing service; timestamp and table formatting changes are within the scope of that service's templates
- Mobile and desktop layouts both need to support the clickable detail view; a modal is appropriate for mobile, inline expansion for desktop
- The `finding reviewed` event metadata already (or will) store whether the finding was approved or rejected; without this, contextual labels for that event type are not possible
