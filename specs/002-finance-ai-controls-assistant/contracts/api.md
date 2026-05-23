# API Contract: ControlGuard AI

**Feature**: 002-finance-ai-controls-assistant
**Date**: 2026-05-23
**Base URL**: `/api` (all routes prefixed)
**Auth**: All routes require `Authorization: Bearer <jwt_token>` except `/auth/login`
**Content-Type**: `application/json` unless noted

---

## Authentication

### POST /auth/login
Login with email and password.

**Request body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200**:
```json
{
  "access_token": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "username": "string"
  }
}
```

**Response 401**: Invalid credentials
```json
{ "message": "Invalid credentials" }
```

**Audit log**: `auth_event` with `event_subtype: "login"` on success; `"failed_login"` on 401.

---

### POST /auth/logout
Invalidate session (clears refresh token cookie).

**Response 200**:
```json
{ "message": "Logged out" }
```

**Audit log**: `auth_event` with `event_subtype: "logout"`.

---

### GET /auth/me
Return the currently authenticated user.

**Response 200**:
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string"
}
```

**Response 401**: Token missing or expired.

---

## Sessions

### GET /sessions
List all sessions owned by the authenticated user.

**Response 200**:
```json
[
  {
    "id": "uuid",
    "name": "string",
    "processName": "string",
    "processOwner": "string",
    "status": "DRAFT | ANALYSED | IN_REVIEW | FINALISED",
    "createdAt": "ISO 8601",
    "finalisedAt": "ISO 8601 | null",
    "findingCount": "integer",
    "pendingCount": "integer"
  }
]
```

---

### POST /sessions
Create a new review session.

**Request body**:
```json
{
  "name": "string",
  "processName": "string",
  "processOwner": "string"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "name": "string",
  "processName": "string",
  "processOwner": "string",
  "status": "DRAFT",
  "createdAt": "ISO 8601"
}
```

**Audit log**: `session_created`

---

### GET /sessions/:id
Get full session details including document metadata and finding summary.

**Response 200**:
```json
{
  "id": "uuid",
  "name": "string",
  "processName": "string",
  "processOwner": "string",
  "status": "SessionStatus",
  "createdAt": "ISO 8601",
  "finalisedAt": "ISO 8601 | null",
  "document": {
    "id": "uuid",
    "filename": "string",
    "fileSize": "integer",
    "format": "pdf | docx",
    "wordCount": "integer",
    "uploadedAt": "ISO 8601"
  } | null,
  "findingSummary": {
    "total": "integer",
    "pending": "integer",
    "accepted": "integer",
    "edited": "integer",
    "dismissed": "integer",
    "flaggedForReview": "integer"
  }
}
```

**Response 403**: Session belongs to a different user.
**Response 404**: Session not found.

---

### POST /sessions/:id/finalise
Finalise a session. All findings must be decided.

**Response 200**:
```json
{
  "id": "uuid",
  "status": "FINALISED",
  "finalisedAt": "ISO 8601"
}
```

**Response 409**: Session has pending (undecided) findings.
```json
{
  "message": "Cannot finalise: 3 finding(s) still pending review",
  "pendingCount": 3
}
```

**Response 422**: Session already finalised.

**Audit log**: `session_finalised` with accepted/dismissed/edited counts.

---

## Documents

### POST /sessions/:id/document
Upload a process description document.

**Content-Type**: `multipart/form-data`

**Form fields**:
- `file`: PDF or DOCX file (max 10MB)

**Response 201**:
```json
{
  "id": "uuid",
  "filename": "string",
  "fileSize": "integer",
  "format": "pdf | docx",
  "wordCount": "integer",
  "sanitisationApplied": "boolean",
  "uploadedAt": "ISO 8601"
}
```

**Response 400**: Unsupported file type or file too large.
```json
{ "message": "Only PDF and DOCX files are accepted. Maximum size: 10MB." }
```

**Response 409**: Session already has a document.
**Response 422**: Session is FINALISED.

**Audit log**: `document_uploaded`

---

## Analysis

### POST /sessions/:id/analyse
Trigger AI analysis on the uploaded document. Returns immediately; analysis runs synchronously (prototype) or async (production).

**Response 202**:
```json
{ "message": "Analysis initiated" }
```

**Response 404**: No document uploaded for this session.
**Response 409**: Analysis already run for this session.
**Response 422**: Session is FINALISED.

**Audit log**: `ai_request_initiated` (before AI call), `ai_response_received` (after)

---

## Findings

### GET /sessions/:id/findings
Get all findings for a session, ordered by sequence (descending risk level).

**Response 200**:
```json
[
  {
    "id": "uuid",
    "sequence": "integer",
    "category": "FindingCategory",
    "title": "string",
    "description": "string",
    "affectedProcessStep": "string",
    "riskLevel": "critical | high | medium | low",
    "confidenceScore": "float (0.0–1.0)",
    "confidenceLabel": "high | medium | low | flagged",
    "evidenceExcerpt": "string",
    "recommendation": "string",
    "controlTypeSuggested": "preventive | detective | corrective | multiple",
    "requiresHumanReview": "boolean",
    "reviewStatus": "pending | accepted | edited | dismissed",
    "reviewerDecision": {
      "decidedBy": "string",
      "decidedAt": "ISO 8601",
      "action": "accepted | edited | dismissed",
      "originalRecommendation": "string",
      "finalRecommendation": "string",
      "reviewerNote": "string | null"
    } | null
  }
]
```

---

### POST /sessions/:id/findings/:findingId/review
Submit a reviewer decision on a finding.

**Request body**:
```json
{
  "action": "accepted | edited | dismissed",
  "finalRecommendation": "string (required if action is 'edited')",
  "reviewerNote": "string (required if action is 'dismissed')"
}
```

**Response 200**: Updated finding object (same shape as GET /findings item)

**Response 400**: Validation errors
```json
{
  "message": "Reviewer note is required when dismissing a finding",
  "field": "reviewerNote"
}
```

**Response 409**: Finding has already been decided.
**Response 422**: Session is FINALISED or finding does not belong to this session.

**Audit log**: `finding_reviewed`

---

## Reports

### GET /sessions/:id/report
Export the finalised session as a PDF report.

**Response 200**:
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="controlguard-report-{sessionId}.pdf"`
- Body: PDF binary

**Response 422**: Session is not yet FINALISED.

**Audit log**: `report_exported`

---

## Audit Log

### GET /sessions/:id/audit-log
Get the full audit log for a session, ordered by timestamp ascending.

**Response 200**:
```json
[
  {
    "id": "uuid",
    "eventType": "EventType",
    "eventTimestamp": "ISO 8601",
    "actor": "string",
    "payload": {},
    "outcome": "success | failure | partial",
    "errorDetail": "string | null"
  }
]
```

---

## Error Response Format

All error responses use this consistent shape:
```json
{
  "statusCode": "integer",
  "message": "string (user-facing, no internal details)",
  "error": "string (HTTP status phrase)"
}
```

Internal stack traces and database errors are logged server-side but never included in API responses.

---

## Finding Category Enum Values

| Value | Description |
|---|---|
| `segregation_of_duties` | Single individual controls an entire critical process end-to-end |
| `missing_preventive_control` | A control to stop errors before they occur is absent |
| `missing_detective_control` | A control to identify errors after they occur is absent |
| `missing_corrective_control` | No defined remediation procedure for identified errors |
| `excessive_access` | Individual has access beyond what their function requires |
| `documentation_gap` | A critical process step lacks documentation |
| `manual_process_risk` | Manual or undocumented steps create error or fraud risk |
| `approval_chain_weakness` | An approval step is missing, bypassed, or insufficiently independent |
