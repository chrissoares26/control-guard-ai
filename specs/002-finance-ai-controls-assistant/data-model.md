# Data Model: ControlGuard AI

**Feature**: 002-finance-ai-controls-assistant
**Date**: 2026-05-23
**Storage**: PostgreSQL via Prisma ORM

---

## Entity Relationship Overview

```
User ──< Session ──── Document
              │
              ├──< Finding ──── ReviewerDecision
              │
              └──< AuditLogEntry
```

A `User` owns many `Sessions`. Each `Session` has one `Document`, many `Findings`, and many `AuditLogEntries`. Each `Finding` has at most one `ReviewerDecision` (set when the auditor acts on it).

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────────────────────────

enum SessionStatus {
  DRAFT
  ANALYSED
  IN_REVIEW
  FINALISED
}

enum FindingCategory {
  segregation_of_duties
  missing_preventive_control
  missing_detective_control
  missing_corrective_control
  excessive_access
  documentation_gap
  manual_process_risk
  approval_chain_weakness
}

enum RiskLevel {
  critical
  high
  medium
  low
}

enum ConfidenceLabel {
  high
  medium
  low
  flagged
}

enum ReviewStatus {
  pending
  accepted
  edited
  dismissed
}

enum ReviewAction {
  accepted
  edited
  dismissed
}

enum ControlTypeSuggested {
  preventive
  detective
  corrective
  multiple
}

enum EventType {
  session_created
  document_uploaded
  ai_request_initiated
  ai_response_received
  finding_reviewed
  session_finalised
  report_exported
  auth_event
}

enum Outcome {
  success
  failure
  partial
}

// ─── Models ──────────────────────────────────────────────────────────────────

model User {
  id           String          @id @default(uuid())
  email        String          @unique
  username     String          @unique
  passwordHash String
  createdAt    DateTime        @default(now())

  sessions     Session[]
  auditLogs    AuditLogEntry[]
}

model Session {
  id           String        @id @default(uuid())
  name         String
  processName  String
  processOwner String
  status       SessionStatus @default(DRAFT)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  finalisedAt  DateTime?

  userId       String
  user         User          @relation(fields: [userId], references: [id])

  document     Document?
  findings     Finding[]
  auditLogs    AuditLogEntry[]
}

model Document {
  id              String   @id @default(uuid())
  filename        String
  fileSize        Int
  format          String   // "pdf" | "docx"
  extractedText   String   @db.Text
  sanitisedText   String   @db.Text
  wordCount       Int
  sanitisationApplied Boolean @default(false)
  uploadedAt      DateTime @default(now())

  sessionId       String   @unique
  session         Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model Finding {
  id                   String               @id @default(uuid())
  sequence             Int
  category             FindingCategory
  title                String               @db.VarChar(80)
  description          String               @db.Text
  affectedProcessStep  String
  riskLevel            RiskLevel
  confidenceScore      Float
  confidenceLabel      ConfidenceLabel
  evidenceExcerpt      String               @db.VarChar(200)
  recommendation       String               @db.Text
  controlTypeSuggested ControlTypeSuggested
  requiresHumanReview  Boolean
  reviewStatus         ReviewStatus         @default(pending)
  createdAt            DateTime             @default(now())

  sessionId            String
  session              Session              @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  reviewerDecision     ReviewerDecision?

  @@unique([sessionId, sequence])
}

model ReviewerDecision {
  id                     String       @id @default(uuid())
  decidedBy              String
  decidedAt              DateTime     @default(now())
  action                 ReviewAction
  originalRecommendation String       @db.Text
  finalRecommendation    String       @db.Text
  reviewerNote           String?      @db.Text

  findingId              String       @unique
  finding                Finding      @relation(fields: [findingId], references: [id], onDelete: Cascade)
}

model AuditLogEntry {
  id             String    @id @default(uuid())
  eventType      EventType
  eventTimestamp DateTime  @default(now())
  actor          String
  payload        Json
  outcome        Outcome
  errorDetail    String?   @db.Text

  sessionId      String?
  session        Session?  @relation(fields: [sessionId], references: [id])

  userId         String?
  user           User?     @relation(fields: [userId], references: [id])
}
```

---

## Entity Descriptions

### User
Represents an authenticated member of the finance/audit team.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | string | Unique login identifier |
| username | string | Display name in reports and audit log |
| passwordHash | string | bcrypt hash — never returned in API responses |
| createdAt | DateTime | Registration timestamp |

**Constraints**: `email` and `username` must be unique. `passwordHash` is never serialised to API responses.

---

### Session
A single internal controls evaluation engagement for one process document.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | string | Auditor-assigned session label |
| processName | string | Name of the process being evaluated |
| processOwner | string | Local unit or process owner name |
| status | SessionStatus | State machine: DRAFT → ANALYSED → IN_REVIEW → FINALISED |
| createdAt | DateTime | Session creation timestamp |
| finalisedAt | DateTime? | Set when session is finalised; null otherwise |

**State transitions**:
- `DRAFT` → `ANALYSED`: triggered by successful AI analysis
- `ANALYSED` → `IN_REVIEW`: triggered when auditor opens findings for review
- `IN_REVIEW` → `FINALISED`: triggered by explicit finalise action (requires all findings decided)

**Constraints**: Only the owning user may read or modify the session.

---

### Document
The process description file uploaded to a session.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| filename | string | Original filename from upload |
| fileSize | int | Bytes |
| format | string | "pdf" or "docx" |
| extractedText | text | Full raw text extracted from document |
| sanitisedText | text | Text after PII sanitisation — this is what is sent to AI |
| wordCount | int | Word count of sanitised text |
| sanitisationApplied | bool | True if sanitisation ran and produced changes |

**Constraints**: One document per session (1:1 relationship). `extractedText` is stored but never transmitted to AI.

---

### Finding
An AI-generated candidate control gap, presented to the auditor for review.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| sequence | int | Display order (1-based), ordered by descending risk level |
| category | FindingCategory | Enum — one of 8 control gap categories |
| title | string (≤80) | Concise, specific finding title |
| description | text | Clear explanation of the gap and why it is a risk |
| affectedProcessStep | string | Specific process step where gap exists |
| riskLevel | RiskLevel | critical / high / medium / low |
| confidenceScore | float (0.0–1.0) | AI confidence that this is a genuine finding |
| confidenceLabel | ConfidenceLabel | high / medium / low / flagged |
| evidenceExcerpt | string (≤200) | Direct quote from source document — REQUIRED |
| recommendation | text | Specific, actionable suggested control improvement |
| controlTypeSuggested | ControlTypeSuggested | preventive / detective / corrective / multiple |
| requiresHumanReview | bool | True if confidenceScore < threshold |
| reviewStatus | ReviewStatus | pending / accepted / edited / dismissed |

**Constraints**: `evidenceExcerpt` is required — findings without it are invalid. `reviewStatus` starts as `pending`; transitions are one-way (no un-reviewing). `sequence + sessionId` must be unique.

---

### ReviewerDecision
The auditor's decision on a specific finding. Created at decision time; immutable thereafter.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| decidedBy | string | Username of the reviewer |
| decidedAt | DateTime | UTC timestamp of decision |
| action | ReviewAction | accepted / edited / dismissed |
| originalRecommendation | text | The AI's original recommendation — immutable |
| finalRecommendation | text | Text in the report; equals original if accepted unchanged |
| reviewerNote | string? | Required if action is `dismissed`; optional otherwise |

**Constraints**: One per Finding (1:1). `originalRecommendation` is never modified after creation. `reviewerNote` must be non-empty when `action = dismissed`.

---

### AuditLogEntry
Immutable record of every significant system event.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| eventType | EventType | One of 8 event types |
| eventTimestamp | DateTime | UTC timestamp |
| actor | string | Username or "SYSTEM" |
| payload | JSON | Event-specific data (see below) |
| outcome | Outcome | success / failure / partial |
| errorDetail | string? | Error message if outcome is failure |

**Payload shapes by event type**:

| EventType | Key payload fields |
|---|---|
| `session_created` | `session_name`, `process_name`, `process_owner` |
| `document_uploaded` | `filename`, `file_size`, `word_count`, `sanitisation_applied` |
| `ai_request_initiated` | `system_prompt_version`, `user_prompt_hash`, `model` |
| `ai_response_received` | `response_id`, `finding_count`, `flagged_count`, `raw_response_stored_at` |
| `finding_reviewed` | `finding_id`, `action`, `confidence_score`, `had_edit`, `note_provided` |
| `session_finalised` | `total_findings`, `accepted_count`, `dismissed_count`, `edited_count` |
| `report_exported` | `report_filename`, `included_finding_count`, `exported_by` |
| `auth_event` | `event_subtype` (login/logout/failed_login), `user_agent` |

**Constraints**: Entries are inserted only — no update or delete operations exist in the application. No UI feature exposes modification of existing entries.

---

## State Machine: Session Status

```
[DRAFT]
  │  document uploaded + AI analysis triggered
  ▼
[ANALYSED]
  │  auditor opens findings view
  ▼
[IN_REVIEW]
  │  all findings decided + finalise action taken
  ▼
[FINALISED] ── (immutable; report export available)
```

## State Machine: Finding Review Status

```
[pending]
  ├── Accept action ──────────────────────► [accepted]
  ├── Edit + Accept action ───────────────► [edited]
  └── Dismiss action (+ note) ───────────► [dismissed]
```

All transitions are one-way. A decided finding cannot be returned to `pending`.
