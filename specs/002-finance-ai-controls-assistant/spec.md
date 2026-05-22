# Feature Specification: ControlGuard AI — Finance Controls Assistant

**Feature Branch**: `002-finance-ai-controls-assistant`

**Created**: 2026-05-23

**Status**: Draft

**Input**: Based on `docs/ControlGuard_AI_PRD_Context.pdf` and `docs/Finance_AI_Assessment_Candidate_Instructions.pdf`

---

## Background & Problem Statement

Finance and audit teams within large faith-based and non-profit organisations routinely evaluate internal controls across dozens of operational units per audit cycle. Today this work is almost entirely manual: an auditor reads a process document, applies professional judgement to identify gaps, writes findings by hand, and submits them through a review chain.

Three structural problems make this unscalable:

- **Inconsistency** — Different auditors identify different gaps in the same process. Without a uniform framework applied consistently, coverage quality varies by individual.
- **Speed** — A thorough review of a single process description can take hours. When dozens of units require evaluation within a cycle, scope is inevitably compressed.
- **Traceability** — The connection between a specific text passage in a process document and the resulting finding is rarely captured, making retrospective review and appeals difficult.

ControlGuard AI addresses all three by applying a consistent analytical framework at machine speed, surfacing candidate findings with supporting evidence and confidence scores, and presenting them to a human reviewer who makes every final decision. The AI accelerates discovery; the human owns the conclusion.

This specification covers the full prototype scope submitted as a technical assessment for the Finance AI Automation Developer role (Option 2 — Internal Controls Evaluation Assistant).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — End-to-End Audit Review Session (Priority: P1)

A finance auditor at the Frankfurt department creates a new review session for a local unit's disbursement process, uploads the process description document, triggers AI analysis, reviews the structured candidate findings, makes accept/edit/dismiss decisions on each, finalises the session, and exports a PDF report — all without leaving the application.

**Why this priority**: This is the entire value proposition of the product. Every other story is a refinement of this core flow. Without it, nothing else matters.

**Independent Test**: A test user with valid credentials can complete the full workflow from session creation to PDF export using a sample process document, and the exported PDF contains at least the accepted findings and an audit trail appendix.

**Acceptance Scenarios**:

1. **Given** a logged-in auditor with no existing sessions, **When** they create a session with a process name and unit name and upload a valid PDF document, **Then** the system creates the session, extracts the document text, triggers AI analysis, and presents structured finding cards within a reasonable wait time.
2. **Given** a session in "Analysed" state with findings displayed, **When** the auditor accepts a finding, **Then** the finding is marked accepted, the decision is written to the audit log with a timestamp and reviewer identity, and the finding appears in the final report.
3. **Given** a session in "Analysed" state, **When** the auditor edits a finding's recommendation text and accepts it, **Then** both the original AI text and the final edited text are preserved in the audit record.
4. **Given** a session in "Analysed" state, **When** the auditor dismisses a finding without providing a written justification, **Then** the system prevents the dismissal and prompts for a justification note.
5. **Given** all findings in a session have been decided, **When** the auditor finalises the session, **Then** the session state transitions to "Finalised", no further changes are permitted, and the export button becomes available.
6. **Given** a finalised session, **When** the auditor exports the report, **Then** a PDF is generated containing: session metadata, all accepted findings with reviewer-approved text, AI confidence scores, evidence excerpts, reviewer attribution, and a complete audit trail appendix.

---

### User Story 2 — Confidence-Gated Finding Review (Priority: P2)

An auditor encounters findings that fall below the configured confidence threshold. These are visually distinguished from high-confidence findings and cannot be silently accepted — the system forces the auditor to explicitly confirm they have read and evaluated the finding before including it.

**Why this priority**: Governance quality depends on this. Low-confidence findings are the most likely to be hallucinated or weakly evidenced. Forcing explicit review is the primary guard against AI errors entering official reports without human scrutiny.

**Independent Test**: Can be tested by uploading a document that produces findings with confidence scores below 75%. The UI must visually flag these and block the standard accept button, requiring an explicit "I have reviewed this" confirmation.

**Acceptance Scenarios**:

1. **Given** the system produces a finding with a confidence score below the configured threshold (default 75%), **When** the finding card is displayed, **Then** it is visually differentiated (e.g., flagged badge, distinct colour) and labelled as requiring mandatory human review.
2. **Given** a low-confidence finding card, **When** the auditor attempts to accept it using the standard accept action, **Then** the system requires an explicit confirmation step before the acceptance is recorded.
3. **Given** the confidence threshold is changed in system configuration, **When** the same document is re-analysed, **Then** the new threshold applies to all findings in the new analysis.

---

### User Story 3 — Audit Trail Verification (Priority: P2)

A compliance supervisor opens a finalised session and reviews the complete audit log to verify that every finding in the exported report has a traceable, attributed decision, and that no AI output was included without explicit human acceptance.

**Why this priority**: This is the governance proof-of-concept. The supervisor persona exists specifically to validate that the human-in-the-loop requirement is architecturally enforced, not just documented.

**Independent Test**: Can be tested independently by inspecting the audit log entries for a finalised session. Every finding in the report must have a corresponding `finding_reviewed` log entry. No finding in the report may lack an acceptance decision.

**Acceptance Scenarios**:

1. **Given** a finalised session with accepted, edited, and dismissed findings, **When** the audit log is inspected, **Then** every reviewer action appears with: action type, original AI text, final text, reviewer identity, and UTC timestamp.
2. **Given** the exported PDF report, **When** the audit trail appendix is reviewed, **Then** every finding in the main report body has a corresponding log entry, and every dismissed finding appears in the appendix with its justification note.
3. **Given** a finalised session, **When** any user attempts to modify a finding or its decision, **Then** the system prevents the modification and returns an appropriate error.

---

### User Story 4 — Document Upload & Sanitisation (Priority: P1)

An auditor uploads a process description document. The system extracts the text content, applies a sanitisation pass to remove or mask identifiable personal data before the text is sent to the AI model, and stores both the original file reference and the extracted text in the session record.

**Why this priority**: Data handling correctness is a hard requirement — process documents are potentially sensitive. Sanitisation must happen before any external AI call. This cannot be deferred.

**Independent Test**: Can be tested by uploading a document containing mock personal identifiers (names, account numbers). The text sent to the AI model (visible in the audit log's `ai_request_initiated` entry) must not contain the original identifiers.

**Acceptance Scenarios**:

1. **Given** a valid PDF or DOCX file within the size limit, **When** the auditor uploads it, **Then** the system accepts the file, extracts readable text, and confirms the upload.
2. **Given** an uploaded document, **When** the sanitisation step runs, **Then** the sanitised text (not the original) is what is sent to the AI model, and the sanitisation event is recorded.
3. **Given** a file exceeding the size limit or in an unsupported format, **When** the auditor attempts to upload it, **Then** the system rejects the file with a clear error message before any processing occurs.

---

### User Story 5 — Session Management & History (Priority: P3)

An auditor can view a list of their past sessions, see each session's status, finding count, and creation date, and resume an in-progress session to continue review without data loss.

**Why this priority**: Completes the operational workflow. Auditors rarely finish a review in one sitting. Session persistence and resumability are necessary for real-world usability.

**Independent Test**: Can be tested independently by creating a session, partially reviewing findings, closing the browser, and returning to find the session in the same state with decisions preserved.

**Acceptance Scenarios**:

1. **Given** an auditor with multiple sessions in different states, **When** they view the sessions list, **Then** each session shows its name, process name, status, creation date, and finding count.
2. **Given** an in-progress session where the auditor has accepted some findings and dismissed others, **When** the auditor navigates away and returns, **Then** all previous decisions are preserved and the remaining pending findings are still actionable.
3. **Given** a finalised session in the sessions list, **When** the auditor clicks on it, **Then** they can view the findings and export the report but cannot make new decisions.

---

### Edge Cases

- What happens when the AI model returns a malformed or schema-invalid response? The system must log the raw response, inform the auditor that analysis failed, and not display partial or invalid findings.
- What happens when the uploaded document produces no findings? The system must display an explicit "No control gaps identified" state rather than an empty list with no message.
- What happens when a document is text-sparse (e.g., mostly tables or images)? The system should indicate that text extraction produced limited content and confidence in analysis may be low.
- What happens if the AI call times out or returns an error? The session remains in "Analysed pending" state, the error is logged, and the auditor is notified with the option to retry.
- What happens when the auditor tries to finalise a session with undecided findings? The system must prevent finalisation and indicate which findings still require a decision.
- What happens if two browser tabs have the same session open? The system should handle concurrent access gracefully — last write wins is acceptable for the prototype.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Access Control**

- **FR-001**: System MUST require authenticated access before any feature is available. Unauthenticated requests to any route must be blocked.
- **FR-002**: System MUST enforce session data isolation — a user may only access sessions they created or have been explicitly granted access to.
- **FR-003**: System MUST maintain authenticated session state with appropriate expiry.

**Session Management**

- **FR-004**: Users MUST be able to create a new review session by providing a session name, process name, and process owner / local unit name.
- **FR-005**: System MUST assign each session a unique identifier and record a creation timestamp.
- **FR-006**: Sessions MUST progress through defined states: Draft → Analysed → In Review → Finalised.
- **FR-007**: Users MUST be able to view a list of their sessions with status, date, and finding count.
- **FR-008**: Users MUST be able to resume any non-finalised session and continue from where they left off.

**Document Upload**

- **FR-009**: System MUST accept process description documents in PDF and DOCX formats only.
- **FR-010**: System MUST validate file type and size at upload, rejecting invalid files with a descriptive error before any processing.
- **FR-011**: System MUST extract plain text from uploaded documents and store it as part of the session record.
- **FR-012**: System MUST apply a sanitisation pass to extracted text before transmitting it to the AI model. The sanitisation function must be a discrete, independently testable component.
- **FR-013**: System MUST store the original file reference and the sanitised extracted text separately in the session record.

**AI-Powered Finding Generation**

- **FR-014**: System MUST invoke the AI model with a governed system prompt that defines the control framework (Segregation of Duties, preventive/detective/corrective controls), required output schema, confidence scoring methodology, and hallucination-reduction instructions.
- **FR-015**: The system prompt used for each analysis MUST be versioned and stored with the session audit record before the AI call is made.
- **FR-016**: The full user prompt (sanitised document text + session context) MUST be stored in the session audit log before the AI call is made.
- **FR-017**: The raw AI response MUST be stored in the audit log before any parsing or transformation occurs.
- **FR-018**: System MUST validate the AI response against the defined findings schema before presenting any findings to the user. Invalid responses must be logged as errors and the user notified.
- **FR-019**: System MUST NOT display findings that do not include a required evidence excerpt. A finding without supporting evidence from the source document is invalid.

**Finding Review Interface**

- **FR-020**: Each AI-generated finding MUST be presented as an individual card displaying: title, category, risk level, confidence score, confidence label, evidence excerpt from the source document, and recommended control improvement.
- **FR-021**: The review interface MUST support three actions per finding: Accept, Edit and Accept, and Dismiss.
- **FR-022**: Dismiss actions MUST require the auditor to provide a written justification note before the dismissal is recorded.
- **FR-023**: Edit and Accept MUST preserve the original AI recommendation text immutably alongside the auditor's final text.
- **FR-024**: All three actions MUST write a timestamped, attributed entry to the audit log immediately upon execution.

**Confidence Threshold Enforcement**

- **FR-025**: Findings with a confidence score below a configurable threshold (default 75%) MUST be visually differentiated in the review interface.
- **FR-026**: Low-confidence findings MUST require explicit manual confirmation before acceptance and MUST NOT be silently accepted.
- **FR-027**: The confidence threshold MUST be stored as a configuration value, not hardcoded anywhere in the application.

**Audit Log**

- **FR-028**: System MUST write an immutable audit log entry for each of the following events: session creation, document upload, AI request initiation, AI response receipt, each finding review decision, session finalisation, and report export.
- **FR-029**: Each audit log entry MUST include: unique log ID, session ID, event type, UTC timestamp, actor identity, event-specific payload, and outcome (success/failure/partial).
- **FR-030**: The audit log MUST be append-only. No application feature may permit deletion or modification of existing log entries.
- **FR-031**: Auth events (login, logout, failed login) MUST also be written to the audit log.

**Session Finalisation**

- **FR-032**: Users MUST NOT be able to finalise a session while any finding remains in "pending" (undecided) state.
- **FR-033**: Session finalisation MUST be a discrete, logged event that locks the session against further modification.

**Report Export**

- **FR-034**: Finalised sessions MUST be exportable as a structured PDF report containing: session metadata, all accepted findings with final reviewer-approved text, AI confidence scores and evidence references, reviewer attribution for each finding, and a complete audit trail appendix showing every action taken.
- **FR-035**: The exported report MUST include a disclosure statement indicating that findings were generated with AI assistance and reviewed by a qualified human auditor.
- **FR-036**: The report export event MUST be written to the audit log.

**Governance**

- **FR-037**: No AI-generated finding may appear in a finalised report without a logged, attributed human acceptance decision.
- **FR-038**: All AI call inputs (system prompt, user prompt, document text) MUST be stored before the AI call is made, so the audit trail is complete even if the call fails.
- **FR-039**: Process documents MUST NOT be transmitted to the AI model without the sanitisation step having run first.
- **FR-040**: AI API credentials MUST be stored as environment variables and must never appear in client-side code, logs, or version control.

---

### Key Entities

- **User**: An authenticated member of the finance or audit team. Has identity (username/email), credentials, and owns one or more sessions.
- **Session**: A single internal controls evaluation engagement. Has a name, process name, process owner, status, creation timestamp, associated document, findings list, and audit log.
- **Document**: A process description file uploaded to a session. Has an original filename, file size, format, extracted text, sanitised text, and word count.
- **Finding**: An AI-generated candidate control gap. Has a unique ID, category (from enum), title, description, affected process step, risk level, confidence score, confidence label, evidence excerpt, recommendation, control type suggested, review status, and reviewer decision object.
- **ReviewerDecision**: The human decision on a finding. Has deciding user identity, UTC timestamp, action (accepted/edited/dismissed), original AI recommendation (immutable), final recommendation text, and optional reviewer note.
- **AuditLogEntry**: An immutable record of a system event. Has log ID, session ID, event type, UTC timestamp, actor, event-specific payload, and outcome.
- **Report**: A finalised export artifact. Has generation timestamp, session metadata, accepted findings, and audit trail appendix.

---

## Success Criteria *(mandatory)*

### Functional Completeness

- **SC-001**: A user can complete the entire workflow — log in, create a session, upload a document, trigger analysis, review all findings, finalise, and export a PDF report — end-to-end without errors.
- **SC-002**: Every AI finding presented to the user conforms to the defined schema. An invalid or malformed finding cannot reach the review interface.
- **SC-003**: Findings below the confidence threshold are visually distinguishable and cannot be accepted without an explicit additional confirmation step.
- **SC-004**: Every reviewer action in a session produces a corresponding audit log entry that persists beyond the session.
- **SC-005**: The exported PDF report contains both the accepted findings and the complete audit trail appendix.

### Governance Quality

- **SC-006**: No finding appears in an exported report without a corresponding logged acceptance decision attributed to a named reviewer.
- **SC-007**: All AI inputs (system prompt, user prompt, document text) are recorded in the audit log before the AI call executes, so the trail is complete even if the call fails.
- **SC-008**: Dismissed findings are preserved in the audit log with the reviewer's written justification.
- **SC-009**: Raw AI responses are stored before parsing. If parsing fails, the raw response is preserved and the error is logged.

### Performance & Usability

- **SC-010**: A complete review session — upload to export — is completable in under 10 minutes for a typical two-page process document.
- **SC-011**: The review cycle for a typical document (5–10 findings) can be completed by a first-time user without training beyond reading the interface.
- **SC-012**: Error states (failed AI call, invalid schema, upload failure) are presented to the user with actionable messages and without exposing internal system details.

### Assessment Evaluation Criteria

- **SC-013**: The AI prompt layer, the parsing/validation layer, and the review workflow layer are clearly separated in the application structure, demonstrating maintainable architectural thinking.
- **SC-014**: The confidence threshold is a configuration value — changing it requires no code modification.
- **SC-015**: The codebase includes a README with complete setup and execution instructions sufficient for the evaluation panel to run the application independently.
- **SC-016**: An AI usage report documents the prompts used, areas where AI-generated code was modified, and the validation approach applied.

---

## Out of Scope

The following capabilities are explicitly excluded from this prototype. Where relevant, the production path is noted.

- **Multi-role permissions**: Only a single authenticated user role is required. Production would distinguish auditor, reviewer, and admin roles with different access levels.
- **Real-time collaboration**: A single reviewer per session is assumed. Production would require conflict resolution and concurrent access handling.
- **Encryption at rest**: Documents and session data are stored without encryption at rest in the prototype. Production would require encrypted storage, particularly for anything containing personally identifiable information.
- **Document formats beyond PDF and DOCX**: No support for Excel, plain text, image-based documents, or scanned PDFs requiring OCR.
- **Integration with external systems**: No integration with document management, ERP, or audit management systems.
- **API rate limiting and abuse prevention**: Not implemented. Production would require this to control costs and prevent abuse.
- **Multi-language support**: English-only interface and document processing. The Frankfurt production context would likely require German language support.
- **Mobile-optimised interface**: Desktop browser use only.
- **Automated remediation tracking**: The system surfaces findings but does not track whether they have been remediated. Production would link findings to action items and track closure.
- **Automated finding acceptance**: No finding is ever included in a report without an explicit human decision. There is no "auto-accept all high-confidence findings" feature.

---

## Assumptions

- Process description documents uploaded by users are text-based (not scanned images). OCR is not required for the prototype.
- A single user session at a time per review session is sufficient. Concurrent session handling is not a requirement.
- Mock/synthetic data is acceptable for development and testing. No real Church financial data or real personal identifiers will be used.
- The confidence threshold default of 75% is appropriate for the prototype and should be validated with domain experts before production use.
- English-language process documents are the primary input format for this prototype.
- The AI model used is a capable instruction-following language model accessible via a standard API, capable of structured JSON output and multi-step reasoning over unstructured text. GPT-4o is the reference model.
- In the prototype, the standard AI provider API is used with data retention opted out where the API supports this configuration. In production, Azure OpenAI Service would be strongly preferred for data residency guarantees.
- The reviewer of AI outputs in the prototype workflow is the same auditor who uploaded the document. In production, this role may be separated (auditor uploads; supervisor reviews).
- All users have stable desktop browser connectivity during review sessions.
- The evaluating panel will have access to the source code repository. API keys are provided by the candidate and are not expected from the assessment panel.
