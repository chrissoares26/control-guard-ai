# Architecture — ControlGuard AI

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Vue 3 SPA)                      │
│                                                                 │
│  LoginView  SessionsView  SessionDetailView  ReviewView         │
│       │           │              │               │              │
│       └───────────┴──────────────┴───────────────┘              │
│                         Pinia Stores                            │
│                    (auth.ts, sessions.ts)                       │
│                              │ Axios (Bearer JWT)               │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTP /api/*
┌──────────────────────────────▼──────────────────────────────────┐
│                     NestJS API (port 3000)                      │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │ Sessions │ │Documents │ │ Analysis │           │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │Findings  │ │ Reports  │ │AuditLog  │                        │
│  │ Module   │ │ Module   │ │ Module   │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                 │
│  Global: JwtAuthGuard (APP_GUARD) + AllExceptionsFilter         │
│                              │                                  │
│                         PrismaService                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PostgreSQL 15      │
                    │   (Docker)          │
                    └─────────────────────┘
                               
                    ┌─────────────────────┐
                    │   OpenAI API        │
                    │   GPT-4o            │
                    └─────────────────────┘
                    (called by AnalysisService only)
```

---

## Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| **AuthModule** | JWT login/logout/me endpoints, `JwtAuthGuard` registered globally via `APP_GUARD`, `@Public()` decorator to bypass guard |
| **SessionsModule** | CRUD for review sessions, session status transitions, finalisation with pending-findings guard |
| **DocumentsModule** | Multipart file upload (PDF/DOCX), text extraction (pdf-parse/mammoth), PII sanitisation before storage |
| **AnalysisModule** | OpenAI API call, versioned system prompt, Zod response validation, finding persistence, two pre/post audit log entries |
| **FindingsModule** | Reviewer decisions (accept/edit/dismiss), `$transaction` for atomicity, session status transition ANALYSED→IN_REVIEW |
| **ReportsModule** | PDF generation with pdfkit — cover page, accepted findings, dismissed summary, audit trail appendix |
| **AuditLogModule** | Append-only `AuditLogEntry` inserts only. `GET /sessions/:id/audit-log` endpoint for trail inspection |
| **PrismaModule** | Global singleton `PrismaService` — shared across all modules |

---

## Key Architectural Decisions

### 1. Human-in-the-Loop Enforcement

Every finding produced by the AI must receive an explicit reviewer decision (accepted / edited / dismissed) before a session can be finalised. This is enforced at two layers:

- **Database layer**: `SessionsService.finalise()` queries for any `Finding` with `reviewStatus = 'pending'` and throws `ConflictException` if any exist. A session cannot reach `FINALISED` status with undecided findings.
- **UI layer**: The "Finalise Session" button in `ReviewView.vue` is disabled while `pendingCount > 0`.

No AI output enters the final report without an explicit human decision. This is the primary governance guarantee of the system.

### 2. Append-Only Audit Log

`AuditLogService` exposes only `log()` (insert) and `findBySession()` (read). No update or delete methods exist. This is enforced at the service level — not just by convention — so that no future caller can accidentally modify the trail.

Significant events logged:
- `session_created`, `session_finalised`
- `document_uploaded`
- `ai_request_initiated` (before OpenAI call, includes prompt hash)
- `ai_response_received` (after OpenAI call, includes response preview)
- `finding_reviewed`
- `report_exported`
- `auth_event` (login, logout, failed login)

The AI audit entries are written before and after the OpenAI call so the trail is complete even if parsing fails.

### 3. Sanitisation Before AI Call

`SanitisationService` strips PII (email addresses, IBANs, account numbers) from document text using regex patterns before the text is sent to OpenAI. The original extracted text is stored in `Document.extractedText`; the cleaned version in `Document.sanitisedText`. Only `sanitisedText` is included in the OpenAI prompt.

This prevents PII from leaving the organisation's infrastructure in API calls.

### 4. Confidence-Gated Review

When `AnalysisService` persists findings, it evaluates each finding's `confidenceScore` against `CONFIDENCE_THRESHOLD` (from `ConfigService`, default 0.75) and sets `requiresHumanReview: true` for those below the threshold.

The UI (`FindingCard.vue`) applies distinct amber styling to flagged findings and replaces the standard Accept button with a two-step confirmation. This prevents low-confidence findings from being silently accepted.

The threshold is evaluated at write time and stored as a boolean on the `Finding` record — changing the environment variable does not retroactively alter existing findings.

### 5. Prisma Transactions for Atomicity

Business operations that involve both domain state changes and audit log writes use `prisma.$transaction()`:
- Session creation + `session_created` audit entry
- Session finalisation + `session_finalised` audit entry  
- Finding review + `finding_reviewed` audit entry (also transitions session to `IN_REVIEW` if needed)

This ensures the audit trail is always consistent with domain state — a finding review cannot be committed without its audit record.

---

## Out of Scope

- Multi-tenancy / team-based access (single-user sessions only)
- Async/background AI analysis (analysis is synchronous in this prototype)
- Refresh token rotation (JWT tokens expire after `JWT_EXPIRES_IN`, re-login required)
- File storage (documents extracted and stored as text only; original files not persisted)
- Role-based access control beyond basic session ownership
