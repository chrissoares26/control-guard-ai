# Tasks: ControlGuard AI — Finance Controls Assistant

**Input**: Design documents from `specs/002-finance-ai-controls-assistant/`

**Prerequisites**: plan.md ✓ | spec.md ✓ | research.md ✓ | data-model.md ✓ | contracts/api.md ✓

**AI Agent Guidance**: Each task touches ONE file or one tightly-scoped concern. Reference `contracts/api.md` for endpoint shapes, `data-model.md` for schema, `research.md` for library patterns. Never implement "the module" — implement the specific file listed.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel with other [P] tasks in same phase (different files, no shared deps)
- **[Story]**: Maps to user story from spec.md (US1–US5)
- Exact file paths are required on every task

---

## Phase 1: Setup

**Purpose**: Create project skeletons and shared configuration. All tasks can start immediately.

- [x] T001 Initialise NestJS project in `backend/` with TypeScript strict mode (`nest new backend --strict`) and install all backend dependencies: `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`, `@prisma/client`, `prisma`, `bcrypt`, `multer`, `pdf-parse`, `mammoth`, `openai`, `zod`, `pdfkit`, `class-validator`, `class-transformer`
- [x] T002 [P] Initialise Vue 3 + Vite project in `frontend/` (`npm create vue@latest`) selecting: TypeScript, Vue Router, Pinia, Vitest. Then install: `axios`, `tailwindcss`, `autoprefixer`, `postcss`
- [x] T003 [P] Create `docker-compose.yml` at repo root with a `postgres:15` service exposing port 5432, with `POSTGRES_DB=controlguard`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=password`
- [x] T004 [P] Create `backend/.env.example` with all required variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_SYSTEM_PROMPT_VERSION`, `CONFIDENCE_THRESHOLD`
- [x] T005 [P] Create `frontend/.env.example` with `VITE_API_BASE_URL=http://localhost:3000/api`
- [x] T006 Copy the Prisma schema from `specs/002-finance-ai-controls-assistant/data-model.md` into `backend/prisma/schema.prisma` (all models, enums, and relations verbatim)
- [x] T007 Configure `tailwind.config.js` and `postcss.config.js` in `frontend/`, add Tailwind directives to `frontend/src/assets/main.css`

**Checkpoint**: Both projects scaffold correctly. `cd backend && npm run build` passes. `cd frontend && npm run build` passes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, auth, audit log, global error handling. MUST complete before any user story work.

**⚠️ CRITICAL**: Nothing in Phase 3+ can start until this phase is complete.

- [x] T008 Run `npx prisma migrate dev --name init` in `backend/` to generate the initial migration from `schema.prisma`. Verify all tables and enums are created.
- [x] T009 [P] Create `backend/src/prisma/prisma.service.ts` — class extending `PrismaClient`, implements `OnModuleInit` calling `$connect()`. Create `backend/src/prisma/prisma.module.ts` — `@Global()` module exporting `PrismaService`.
- [x] T010 [P] Create `backend/src/config/configuration.ts` — exports typed config factory reading all env vars from `.env`. Register `ConfigModule.forRoot({ isGlobal: true, load: [configuration] })` in `backend/src/app.module.ts`.
- [x] T011 Create `backend/src/audit-log/audit-log.service.ts` — single `log(entry: CreateAuditLogDto)` method that inserts into `AuditLogEntry` using `prisma.auditLogEntry.create()`. Create `backend/src/audit-log/audit-log.module.ts` exporting `AuditLogService`. This service must NEVER expose update or delete.
- [x] T012 Create `backend/prisma/seed.ts` — inserts one user with `email: auditor@example.com`, `username: auditor`, password bcrypt-hashed from `ControlGuard2026!`. Register seed script in `backend/package.json` under `"prisma": { "seed": "ts-node prisma/seed.ts" }`.
- [x] T013 [P] Create `backend/src/auth/jwt.strategy.ts` — extends `PassportStrategy(Strategy)`, validates JWT payload, returns `{ id, email, username }`. Create `backend/src/auth/jwt-auth.guard.ts` — extends `AuthGuard('jwt')`, returns HTTP 401 on invalid/missing token.
- [x] T014 Create `backend/src/auth/auth.service.ts` — `login(email, password)` validates user with bcrypt, returns signed JWT. `getMe(userId)` returns user without `passwordHash`.
- [x] T015 Create `backend/src/auth/auth.controller.ts` — implements `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` per `contracts/api.md`. Apply `@Public()` decorator on login route (or use `IS_PUBLIC_KEY` metadata to skip guard). Wire audit log calls: `auth_event` on login, failed_login, logout.
- [x] T016 Create `backend/src/auth/auth.module.ts` — imports `JwtModule.registerAsync` with secret from `ConfigService`. Register `JwtAuthGuard` as global guard via `APP_GUARD` in `backend/src/app.module.ts`.
- [x] T017 [P] Create global `AllExceptionsFilter` in `backend/src/common/filters/all-exceptions.filter.ts` — catches all exceptions, returns `{ statusCode, message, error }` with no stack traces. Register in `backend/src/main.ts`. Also configure CORS in `main.ts` to allow `http://localhost:5173`.

**Checkpoint**: `POST /api/auth/login` with seed credentials returns JWT. `GET /api/auth/me` with valid token returns user. Invalid token returns 401. All other endpoints return 401 without token.

---

## Phase 3: US4 — Document Upload & Sanitisation (Priority: P1)

**Goal**: Auditor creates a session and uploads a process description document. The document is extracted and sanitised before storage. No AI call yet.

**Independent Test**: Create a session, upload a PDF containing a mock email address. Verify the `sanitisedText` field in the DB does not contain the original email address. `SanitisationService` unit tests all pass independently.

### Implementation

- [x] T018 [US4] Create `backend/src/sessions/dto/create-session.dto.ts` with `name`, `processName`, `processOwner` fields — all required strings, `@IsString()` validation. Create `backend/src/sessions/sessions.service.ts` with `create(userId, dto)`, `findAll(userId)`, `findOne(userId, id)`, `finalise(userId, id)` methods using Prisma. `finalise` must throw 409 if any findings are `pending`, 422 if already `FINALISED`.
- [x] T019 [US4] Create `backend/src/sessions/sessions.controller.ts` — `POST /sessions`, `GET /sessions`, `GET /sessions/:id`, `POST /sessions/:id/finalise` per `contracts/api.md`. Inject `AuditLogService` and write `session_created` audit entry (within Prisma transaction in service) on create, `session_finalised` on finalise.
- [x] T020 [US4] Create `backend/src/sessions/sessions.module.ts` importing `PrismaModule` and `AuditLogModule`. Register `SessionsController` and `SessionsService`.
- [x] T021 [P] [US4] Create `backend/src/documents/sanitisation.service.ts` — discrete service with `sanitise(text: string): SanitisationResult` method. Regex patterns: email (`/[\w.\-]+@[\w.\-]+\.\w+/g → [EMAIL]`), phone (`/(\+\d{1,3}[\s\-.]?)?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}/g → [PHONE]`), IBAN/account (`/\b[A-Z]{2}\d{2}[\sA-Z0-9]{11,30}\b/g → [IBAN]`, `/\b\d{8,}\b/g → [ACCOUNT]`). Returns `{ sanitisedText, patternsMatched, sanitisationApplied }`.
- [x] T022 [US4] Write unit tests for `SanitisationService` in `backend/test/unit/sanitisation.service.spec.ts`. Test cases: email in body replaced, phone replaced, IBAN replaced, clean text unchanged, empty string, mixed PII types. Tests MUST pass before Phase 4 begins.
- [x] T023 [US4] Create `backend/src/documents/documents.service.ts` — `upload(userId, sessionId, file: Express.Multer.File)` method. Validates session ownership. Extracts text using `pdf-parse` (PDF) or `mammoth` (DOCX). Calls `SanitisationService.sanitise()`. Saves `Document` record with both `extractedText` and `sanitisedText`. Rejects if session already has a document (409), if session is FINALISED (422).
- [x] T024 [US4] Create `backend/src/documents/documents.controller.ts` — `POST /sessions/:id/document` with multer `MemoryStorage`, file filter for PDF/DOCX MIME types, 10MB size limit. Returns 400 with clear message on wrong format or size. Writes `document_uploaded` audit log entry (within transaction in service).
- [x] T025 [US4] Create `backend/src/documents/documents.module.ts` importing `PrismaModule`, `AuditLogModule`, `SessionsModule`. Register `DocumentsController`, `DocumentsService`, `SanitisationService`.

**Checkpoint**: T022 unit tests all pass. `POST /api/sessions` creates session. `POST /api/sessions/:id/document` with real PDF stores document. DB `Document.sanitisedText` does not contain an email present in the uploaded file.

---

## Phase 4: US1 — Core Review Session — Backend AI + Findings (Priority: P1)

**Goal**: AI analysis runs on the uploaded document, produces validated findings, and auditor can make accept/edit/dismiss decisions. Full backend for the review workflow.

**Independent Test**: Upload a document, call `POST /api/sessions/:id/analyse`. Verify findings are stored in DB. Call `POST /api/sessions/:id/findings/:id/review` with action `accepted`. Verify `finding_reviewed` audit log entry exists. Call dismiss without note — verify 400.

### Implementation

- [x] T026 [US1] Create `backend/src/analysis/ai-prompt.service.ts` — stores the versioned system prompt as a constant (`SYSTEM_PROMPT_V1`). The prompt must define: the role (internal controls expert), the control framework (SoD, preventive, detective, corrective), the full output JSON schema matching `contracts/api.md` Finding fields, confidence scoring instructions (0.0–1.0, flag below 0.75), hallucination mitigations (require evidence_excerpt, flag uncertainty rather than guess). Expose `getSystemPrompt(): { content: string; version: string }` and `buildUserPrompt(sessionContext, sanitisedText): string`.
- [x] T027 [US1] Create `backend/src/analysis/findings-schema.ts` — Zod schema validating the AI response structure: top-level `session_id`, `analysis_timestamp`, `document_metadata`, `findings` array, `summary`. Each finding in the array must match all required fields from `data-model.md` Finding entity. Export `validateAiResponse(raw: unknown)` function returning typed result or throwing `ZodError`.
- [x] T028 [US1] Create `backend/src/analysis/analysis.service.ts` — `analyse(userId, sessionId)` method. Step 1: load session + document, verify session is ANALYSED-eligible. Step 2: write `ai_request_initiated` audit log entry (system_prompt_version, user_prompt_hash, model) BEFORE calling OpenAI. Step 3: call OpenAI with `response_format: { type: "json_object" }`. Step 4: write `ai_response_received` audit log entry with raw response BEFORE parsing. Step 5: parse + validate with Zod schema from T027. Step 6: on validation failure, log error, throw `AnalysisFailedException`. Step 7: persist `Finding` records. Step 8: transition session to `ANALYSED`.
- [x] T029 [US1] Create `backend/src/analysis/analysis.controller.ts` — `POST /sessions/:id/analyse`. Returns 202 on success, 404 if no document, 409 if analysis already run, 422 if FINALISED. Create `backend/src/analysis/analysis.module.ts`.
- [x] T030 [US1] Create `backend/src/findings/dto/review-finding.dto.ts` — `action` (enum: accepted/edited/dismissed), `finalRecommendation` (required when action=edited), `reviewerNote` (required when action=dismissed). Use `@ValidateIf` decorators for conditional requirements.
- [x] T031 [US1] Create `backend/src/findings/findings.service.ts` — `findAll(userId, sessionId)`: returns all findings ordered by sequence, includes `reviewerDecision`. `review(userId, sessionId, findingId, dto)`: creates `ReviewerDecision`, stores `originalRecommendation` from current finding, updates `Finding.reviewStatus`, writes `finding_reviewed` audit entry — ALL in a single `prisma.$transaction`. Throws 409 if finding already decided, 422 if session FINALISED.
- [x] T032 [US1] Create `backend/src/findings/findings.controller.ts` — `GET /sessions/:id/findings`, `POST /sessions/:id/findings/:findingId/review` per `contracts/api.md`. Create `backend/src/findings/findings.module.ts`.
- [x] T033 [US1] Create `backend/src/reports/reports.service.ts` — `generate(userId, sessionId)` returns a `Buffer`. Use `pdfkit` to build: (1) cover page with session metadata + disclosure statement, (2) accepted findings sections (title, risk, confidence, evidence, final recommendation, reviewer + timestamp), (3) dismissed findings summary (title + justification), (4) audit trail appendix table (timestamp, event, actor, detail). Throw 422 if session not FINALISED.
- [x] T034 [US1] Create `backend/src/reports/reports.controller.ts` — `GET /sessions/:id/report`: sets `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="controlguard-report-{sessionId}.pdf"`, streams PDF buffer. Writes `report_exported` audit log entry. Create `backend/src/reports/reports.module.ts`.
- [x] T035 [US1] Add `GET /sessions/:id/audit-log` to a new `backend/src/audit-log/audit-log.controller.ts` — returns all audit log entries for the session ordered by `eventTimestamp` ASC. Register controller in `audit-log.module.ts`.
- [x] T036 [US1] Register all new modules (`SessionsModule`, `DocumentsModule`, `AnalysisModule`, `FindingsModule`, `ReportsModule`, `AuditLogModule`) in `backend/src/app.module.ts`. Set global prefix `/api` in `backend/src/main.ts`.

**Checkpoint**: Full backend flow works: create session → upload doc → analyse → list findings → review all → finalise → export PDF returns 200 with `application/pdf`. Audit log has entries for every step. Dismiss without note returns 400.

---

## Phase 5: US1 — Core Review Session — Frontend (Priority: P1)

**Goal**: Complete Vue 3 SPA — auth, session creation, document upload, finding review, finalise, export. The full end-to-end workflow completable in the browser.

**Independent Test**: Open the app, log in with seed credentials, create a session, upload a PDF, trigger analysis, review all findings (accept some, dismiss one with note), finalise, download report. All without page errors.

### Implementation

- [x] T037 [US1] Create `frontend/src/services/api.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_BASE_URL`. Request interceptor: attach `Authorization: Bearer {token}` from auth store. Response interceptor: on 401, clear auth store + `router.push('/login')`.
- [x] T038 [US1] Create `frontend/src/stores/auth.ts` (Pinia) — state: `{ token: string | null, user: User | null }`. Actions: `login(email, password)` calls `POST /auth/login`, stores token in memory. `logout()` calls `POST /auth/logout`, clears state. `checkSession()` calls `GET /auth/me` — sets user or clears state. Getter `isAuthenticated`.
- [x] T039 [US1] Create `frontend/src/router/index.ts` — routes: `/login` (LoginView, public), `/sessions` (SessionsView), `/sessions/new` (NewSessionView), `/sessions/:id` (SessionDetailView), `/sessions/:id/review` (ReviewView). Global `beforeEach` guard: call `authStore.checkSession()` on first load; redirect to `/login` if `!isAuthenticated` for protected routes.
- [x] T040 [US1] Create `frontend/src/views/LoginView.vue` — email + password form, submits to `authStore.login()`, redirects to `/sessions` on success, shows error message on 401.
- [x] T041 [US1] Create `frontend/src/stores/sessions.ts` (Pinia) — state: `{ sessions: Session[], currentSession: Session | null, findings: Finding[] }`. Actions: `fetchSessions()`, `fetchSession(id)`, `createSession(dto)`, `uploadDocument(sessionId, file)`, `triggerAnalysis(sessionId)`, `fetchFindings(sessionId)`, `reviewFinding(sessionId, findingId, dto)`, `finaliseSession(sessionId)`.
- [x] T042 [US1] Create `frontend/src/views/SessionsView.vue` — lists sessions from store, shows name, processName, status badge, finding count, creation date. "New Session" button navigates to `/sessions/new`.
- [x] T043 [US1] Create `frontend/src/views/NewSessionView.vue` — form: session name, process name, process owner. On submit calls `sessionsStore.createSession()`, navigates to `/sessions/:id` on success.
- [x] T044 [US1] Create `frontend/src/views/SessionDetailView.vue` — shows session metadata. If status is DRAFT: shows file upload area (drag-drop or input[type=file], validates PDF/DOCX client-side, max 10MB). After upload: shows "Run Analysis" button. If ANALYSED/IN_REVIEW: shows "Review Findings" button → navigates to `/sessions/:id/review`. If FINALISED: shows "Download Report" button that fetches `GET /sessions/:id/report` and triggers browser download.
- [x] T045 [US1] Create `frontend/src/components/RiskBadge.vue` — colour-coded pill: critical=red, high=orange, medium=yellow, low=green. Create `frontend/src/components/SessionStatusBadge.vue` — distinct colour per status (DRAFT=grey, ANALYSED=blue, IN_REVIEW=purple, FINALISED=green).
- [x] T046 [US1] Create `frontend/src/components/ConfidenceBadge.vue` — shows confidence score as percentage + label (high/medium/low/flagged). Flagged badge: amber background, "⚠ Requires Human Review" text.
- [x] T047 [US1] Create `frontend/src/components/DismissModal.vue` — modal with required textarea for justification note. Submit button disabled when textarea is empty. Emits `confirm(note: string)` and `cancel` events.
- [x] T048 [US1] Create `frontend/src/components/EditFindingModal.vue` — modal showing original AI recommendation (read-only, labelled "AI Original") and an editable textarea for final recommendation. Emits `confirm(finalRecommendation: string)` and `cancel` events.
- [x] T049 [US1] Create `frontend/src/components/FindingCard.vue` — displays: sequence, category, title, risk badge, confidence badge, evidence excerpt (blockquote), description, recommendation. Three action buttons: "Accept", "Edit & Accept", "Dismiss". Emits `accept`, `edit-accept(finalRec)`, `dismiss(note)` events to parent. If `finding.reviewerDecision` exists: shows decision summary instead of buttons.
- [x] T050 [US1] Create `frontend/src/views/ReviewView.vue` — fetches findings on mount. Shows progress counter ("3 of 7 reviewed"). Renders `FindingCard` for each finding. Handles accept/edit-accept/dismiss events by calling `sessionsStore.reviewFinding()`. "Finalise Session" button: enabled only when all findings have `reviewStatus !== 'pending'`. On finalise click: shows confirm dialog, calls `sessionsStore.finaliseSession()`, navigates back to `/sessions/:id`.
- [x] T051 [US1] Add loading spinners and skeleton states to: document upload in `SessionDetailView.vue` (while uploading), analysis trigger (while waiting for AI response), finding review actions (while submitting), report download (while generating).

**Checkpoint**: Full end-to-end workflow completable in browser. Dismiss without note is blocked by `DismissModal.vue`. "Finalise" button disabled while findings are pending. Downloaded report is a valid PDF.

---

## Phase 6: US2 — Confidence-Gated Finding Review (Priority: P2)

**Goal**: Low-confidence findings (below threshold) are visually distinguished and require explicit additional confirmation before acceptance. Cannot be silently accepted.

**Independent Test**: Upload a doc that produces a finding with `confidenceScore < 0.75`. Verify it has `requiresHumanReview: true` in the API response. Verify the `FindingCard` for this finding has distinct visual styling and the standard Accept button is replaced with a two-step confirmation.

### Implementation

- [x] T052 [US2] Update `frontend/src/components/FindingCard.vue` — when `finding.requiresHumanReview === true`: wrap card in `border-2 border-amber-400 bg-amber-50` Tailwind classes, show `ConfidenceBadge` with flagged state. Replace standard "Accept" button with "Review Required" button that opens an explicit confirmation dialog: "This finding has low AI confidence. Are you sure you want to include it in the report?" with Cancel and Confirm buttons. Only emit `accept` after Confirm is clicked.
- [x] T053 [US2] Verify `backend/src/analysis/analysis.service.ts` correctly sets `requiresHumanReview: true` on any finding where `confidenceScore < CONFIDENCE_THRESHOLD` (from `ConfigService`). Write a unit test in `backend/test/unit/analysis.service.spec.ts` that mocks an AI response with a sub-threshold finding and confirms `requiresHumanReview` is set.
- [x] T054 [US2] Verify the `CONFIDENCE_THRESHOLD` is read from `ConfigService` (not hardcoded) in `backend/src/analysis/analysis.service.ts`. If it's hardcoded, refactor it now.
- [x] T055 [US2] Update `frontend/src/views/ReviewView.vue` — add a summary banner at the top showing count of findings requiring human review: "⚠ N finding(s) require mandatory review". This should dismiss once all flagged findings are decided.

**Checkpoint**: Setting `CONFIDENCE_THRESHOLD=0.99` in `.env` causes all findings to have `requiresHumanReview: true`. Flagged findings in the UI have amber styling and two-step confirmation. Standard findings are unaffected.

---

## Phase 7: US3 — Audit Trail Verification (Priority: P2)

**Goal**: Every decision in a finalised session is traceable in the audit log. Finalised sessions are locked. The exported report contains a complete audit trail appendix.

**Independent Test**: Finalise a session with accepted + dismissed findings. Inspect `GET /api/sessions/:id/audit-log` — verify one `finding_reviewed` entry per decision. Attempt to review a finding in the finalised session — verify 422. Open the exported PDF and confirm the audit trail appendix lists all events.

### Implementation

- [x] T056 [US3] Audit all audit log writes across the backend. Verify these event types are written in the correct services: `session_created` (SessionsService.create), `document_uploaded` (DocumentsService.upload), `ai_request_initiated` (AnalysisService before API call), `ai_response_received` (AnalysisService after API call), `finding_reviewed` (FindingsService.review), `session_finalised` (SessionsService.finalise), `report_exported` (ReportsController), `auth_event` login/logout/failed_login (AuthController). Create a checklist comment in each service confirming the audit write is present.
- [x] T057 [US3] Verify `backend/src/sessions/sessions.service.ts` — `finalise()` sets `finalisedAt` timestamp and transitions status to `FINALISED`. Verify that `FindingsService.review()`, `DocumentsService.upload()`, and `AnalysisService.analyse()` all return 422 when session status is `FINALISED`. Write these as unit test cases in their respective `.spec.ts` files.
- [x] T058 [US3] Verify `backend/src/reports/reports.service.ts` — the audit trail appendix section renders ALL `AuditLogEntry` records for the session (ordered by timestamp). Each row must include: timestamp, event_type, actor, outcome, and key payload fields. If this is missing or incomplete from T033, complete it now.
- [x] T059 [US3] Add audit log viewer to `frontend/src/views/SessionDetailView.vue` — for FINALISED sessions, show a collapsible "Audit Trail" section that fetches and displays `GET /sessions/:id/audit-log` entries in a table (timestamp, event, actor, outcome).

**Checkpoint**: `GET /api/sessions/:id/audit-log` returns entries for every significant action. Attempting to modify a FINALISED session returns 422. Exported PDF audit appendix matches the audit log entries.

---

## Phase 8: US5 — Session Management & History (Priority: P3)

**Goal**: Auditors can view past sessions, resume in-progress work, and all previous decisions are preserved across navigation.

**Independent Test**: Create a session, review 2 of 5 findings, navigate away, navigate back. Verify: the 2 reviewed findings still show their decisions, the 3 pending findings are still actionable, and session status is `IN_REVIEW`.

### Implementation

- [x] T060 [US5] Verify `backend/src/sessions/sessions.service.ts` `findAll()` returns `findingCount` (total) and `pendingCount` (where reviewStatus=pending) as computed fields using Prisma `_count`. Update the `GET /sessions` response shape to include these fields as documented in `contracts/api.md`.
- [x] T061 [US5] Update `frontend/src/views/SessionsView.vue` — show each session card with: status badge, finding count, pending count, creation date. Add Tailwind hover styles. Clicking a session navigates to `/sessions/:id`. Add empty state ("No sessions yet. Create your first review session.").
- [x] T062 [US5] Verify `frontend/src/stores/sessions.ts` `fetchFindings(sessionId)` preserves all `reviewerDecision` data when returning to a session. When `ReviewView.vue` mounts on a session already in `IN_REVIEW`, findings with existing decisions must render their decided state (not show action buttons again).
- [x] T063 [P] [US5] Add session status filter to `frontend/src/views/SessionsView.vue` — tab or dropdown to filter by: All / In Progress / Finalised. This is UI-only; filter the already-fetched sessions array in the store.

**Checkpoint**: Navigate away from a partial review session and return — all previous decisions are preserved. Sessions list shows correct counts. Status filter works.

---

## Phase 9: Polish & Assessment Deliverables

**Purpose**: Error states, empty states, security hardening, and mandatory assessment documents.

- [x] T064 [P] Audit all API error responses in backend — verify no endpoint returns a stack trace, database error message, or internal path. Check `AllExceptionsFilter` handles `PrismaClientKnownRequestError` gracefully (map to 409/404 as appropriate).
- [x] T065 [P] Verify `OPENAI_API_KEY` is accessed only via `ConfigService` in `backend/src/analysis/analysis.service.ts` and never logged. Check `backend/src/config/configuration.ts` does not log config values on startup. Run `grep -r "process.env.OPENAI" backend/src` — should return nothing.
- [x] T066 [P] Verify `backend/src/audit-log/` has no `update` or `delete` Prisma calls. Verify no route in `AuditLogController` exposes modification. Add a comment block in `audit-log.service.ts` marking this as append-only by design.
- [x] T067 Add empty state components to frontend: (a) `ReviewView.vue` when `findings` array is empty — "No control gaps identified by AI analysis"; (b) `SessionsView.vue` when `sessions` is empty — "No sessions yet"; (c) analysis failure state in `SessionDetailView.vue` — "Analysis failed. Please try again." with retry button.
- [x] T068 Add a `backend/src/common/guards/session-ownership.guard.ts` — reusable guard that extracts `:id` from route params, loads the session, and throws `ForbiddenException` if `session.userId !== request.user.id`. Apply this guard to all session-scoped routes in `SessionsController`, `DocumentsController`, `AnalysisController`, `FindingsController`, `ReportsController`.
- [x] T069 Write `README.md` at repo root covering: prerequisites, backend setup (env vars, migration, seed, start), frontend setup (env vars, start), running tests, default credentials, architecture overview (paragraph), and confidence threshold configuration.
- [x] T070 [P] Write `AI_USAGE_REPORT.md` at repo root — document: (1) which tools were used (Claude Code, OpenAI GPT-4o), (2) the system prompt design and rationale, (3) areas where AI-generated code was reviewed and modified, (4) how AI outputs were validated (Zod schema, unit tests, manual review).
- [x] T071 [P] Write `ARCHITECTURE.md` at repo root — short design summary (1-2 pages): system overview diagram (ASCII), module responsibilities, key architectural decisions (human-in-the-loop enforcement, append-only audit log, sanitisation-before-AI-call, confidence-gated review), and out-of-scope notes.
- [x] T072 Final end-to-end smoke test: follow `quickstart.md` from scratch on a clean environment (fresh DB, fresh env). Complete the full flow: login → create session → upload sample doc → analyse → review all findings → finalise → export report → verify PDF opens correctly.

**Checkpoint**: All assessment deliverables present (README, AI_USAGE_REPORT, ARCHITECTURE). No stack traces in API error responses. No OPENAI_API_KEY in logs or source. Audit log append-only enforced. Full flow works from quickstart.md instructions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. All T001–T007 can run in parallel.
- **Phase 2 (Foundational)**: Depends on Phase 1. T008 (migration) must run before T009+. T013 (JWT strategy) and T014 (auth service) before T015 (auth controller). T016 after T015.
- **Phases 3–8 (User Stories)**: ALL depend on Phase 2 completion. Phase 3 must complete before Phase 4 (analysis depends on document upload). Phases 5–8 depend on Phase 4 backend being complete.
- **Phase 9 (Polish)**: Depends on all story phases complete.

### User Story Dependencies

| Story | Depends On | Can Start After |
|---|---|---|
| US4 — Document Upload | Phase 2 | Phase 2 complete |
| US1 Backend — AI + Findings | US4 (Phase 3) | Phase 3 complete |
| US1 Frontend | US1 Backend (Phase 4) | Phase 4 complete |
| US2 — Confidence Gate | US1 Frontend (Phase 5) | Phase 5 complete |
| US3 — Audit Trail | US1 Backend (Phase 4) | Phase 4 complete |
| US5 — Session History | US1 Frontend (Phase 5) | Phase 5 complete |

### Within Each Phase: Task Ordering

- DTOs and service before controller (T018 before T019)
- Module registration last within domain (T020 after T018–T019)
- Zod schema (T027) before AnalysisService (T028)
- AiPromptService (T026) before AnalysisService (T028)
- All backend modules registered (T036) before frontend work starts

---

## Parallel Execution Examples

### Phase 1 — All parallelizable after T001:
```
T001 (NestJS init) → T002, T003, T004, T005 all in parallel
T006 (schema) → T007 (migration)
T007 → Phase 2 begins
```

### Phase 2 — After T008:
```
T009 (PrismaService) ─┐
T010 (ConfigModule)   ├─ all in parallel
T012 (seed.ts)        ┘

T013 (JWT strategy) → T014 (auth service) → T015 (auth controller) → T016 (auth module)
T017 (exception filter) — parallel with T013–T016
```

### Phase 4 — Sequential by dependency:
```
T026 (ai-prompt.service) ─┐
T027 (zod schema)         ├─ parallel, then:
                           T028 → T029 (analysis.service)
T030 (review DTO) → T031 (findings.service) → T032 (findings.controller)
T033 → T034 (reports) — parallel with T031–T032
T035 (audit-log controller) — parallel with T033–T034
```

---

## Implementation Strategy

### MVP (Phase 1 + 2 + 3 + 4 + 5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US4 (Document Upload)
4. Complete Phase 4: US1 Backend (AI + Review)
5. Complete Phase 5: US1 Frontend
6. **STOP and validate**: Full end-to-end workflow in browser

This delivers the complete core value proposition. US2, US3, US5 are governance polish and session management on top of a working system.

### Incremental After MVP

- Add US2 (confidence gating) — 4 tasks, purely frontend
- Add US3 (audit trail) — 4 tasks, verification + frontend display
- Add US5 (session history) — 4 tasks, minor backend + frontend
- Phase 9 (polish) — assessment deliverables

---

## Task Summary

| Phase | Tasks | Story |
|---|---|---|
| Phase 1: Setup | T001–T007 | — |
| Phase 2: Foundational | T008–T017 | — |
| Phase 3: Document Upload | T018–T025 | US4 |
| Phase 4: AI + Review Backend | T026–T036 | US1 |
| Phase 5: Frontend | T037–T051 | US1 |
| Phase 6: Confidence Gate | T052–T055 | US2 |
| Phase 7: Audit Trail | T056–T059 | US3 |
| Phase 8: Session History | T060–T063 | US5 |
| Phase 9: Polish | T064–T072 | — |
| **Total** | **72 tasks** | |

### Parallel Opportunities per Phase
- Phase 1: 5 tasks parallelizable (T002–T005, T007 after T006)
- Phase 2: 6 tasks parallelizable (T009, T010, T012, T013, T017)
- Phase 3: 1 parallelizable (T021 SanitisationService independent of session/document setup)
- Phase 4: 6 parallelizable (T026, T027, T030, T033, T035, T036 within ordering)
- Phase 5: 4 parallelizable (T045, T046, T047, T048 are leaf components)
- Phase 9: 5 parallelizable (T064, T065, T066, T070, T071)

---

## Notes

- **Context rot prevention**: Each task = one file. Reference `contracts/api.md` for shapes, `data-model.md` for schema. Never implement "a module" — implement the specific file named.
- **[P] tasks** = different files, no incomplete shared dependencies — safe to parallelise with other [P] tasks in the same phase.
- **Prisma transactions**: FindingsService.review(), SessionsService.create(), DocumentsService.upload() must write audit log entries within `$transaction` — atomic or nothing.
- **No OPENAI_API_KEY in source**: Read only via `ConfigService`. Never in logs.
- **Audit log is append-only**: `auditLogEntry.create()` only — never `update()` or `delete()`.
- Commit after each completed phase checkpoint.
