# Research: ControlGuard AI — Finance Controls Assistant

**Feature**: 002-finance-ai-controls-assistant
**Date**: 2026-05-23
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. Authentication Strategy

**Decision**: NestJS JWT authentication using Passport.js. Tokens stored in-memory on the frontend (not localStorage). HTTP-only refresh cookie for session persistence across page reloads.

**Rationale**: Passport.js is the idiomatic NestJS auth library with clean module separation. JWT avoids server-side session storage. Memory storage prevents XSS token theft. Refresh token via HTTP-only cookie restores session on reload without localStorage risk.

**Libraries**: `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`, `bcrypt`

**Key patterns**:
- `AuthModule` with `JwtModule.register({ secret, expiresIn: '8h' })`
- `JwtStrategy` extends `PassportStrategy(Strategy)`, validates payload, returns user
- `JwtAuthGuard` applied globally via `APP_GUARD` in AppModule — all routes protected by default
- Unauthenticated requests return HTTP 401
- Auth events (login, logout, failed_login) written to audit log

**Risks**: Page reload clears in-memory token — mitigated by refresh token cookie + `/auth/me` call on app init.

---

## 2. Document Upload & Text Extraction

**Decision**: `multer` for file uploads (memory storage); `pdf-parse` for PDF text extraction; `mammoth` for DOCX extraction.

**Rationale**: Both libraries operate on Node.js `Buffer` objects from multer's memory storage — no temporary files needed. pdf-parse is lightweight and well-tested. mammoth produces clean text from DOCX without external dependencies.

**Libraries**: `multer`, `@types/multer`, `pdf-parse`, `mammoth`

**Key patterns**:
- Multer `MemoryStorage` to receive file as `req.file.buffer`
- File validation: MIME type (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) + file size ≤ 10MB
- `pdf-parse(buffer)` → `data.text`
- `mammoth.extractRawText({ buffer })` → `result.value`
- Word count from extracted text: `text.split(/\s+/).filter(Boolean).length`
- For production: consider isolating parsing in worker threads to prevent memory spikes

**Risks**: Memory spike on large files (mitigated by 10MB limit for prototype). Scanned PDFs produce empty text — handled by empty-text guard before AI call.

---

## 3. PII Sanitisation Service

**Decision**: Discrete regex-based `SanitisationService` that replaces identifiable patterns with labelled placeholders. Testable in isolation with known inputs.

**Rationale**: Deterministic, fast, auditable. The spec requires this to be a discrete, independently testable component. Regex is sufficient for the prototype — production would layer in NLP/NER.

**Key patterns**:
- Email: `/[\w.\-]+@[\w.\-]+\.\w+/g` → `[EMAIL]`
- Phone (international): `/(\+\d{1,3}[\s\-.]?)?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}/g` → `[PHONE]`
- IBAN / account numbers: `/\b[A-Z]{2}\d{2}[\sA-Z0-9]{11,30}\b|\b\d{8,}\b/g` → `[ACCOUNT]`
- Proper names: context-dependent — for prototype, redact strings matching Church unit name patterns from session metadata
- Sanitisation result includes: `sanitisedText`, `patternsMatched` (count by type), `sanitisationApplied: boolean`

**Risks**: False positives may redact relevant numerical evidence. Mitigation: log pattern match counts in audit entry; reviewer can reference original document if needed.

---

## 4. AI Integration (OpenAI Structured Output)

**Decision**: OpenAI SDK with `response_format: { type: "json_object" }` and a structured system prompt defining the control framework and exact JSON schema. Raw response stored in audit log before parsing. Zod for post-parse schema validation.

**Rationale**: JSON mode forces valid JSON. Zod provides type-safe, readable schema validation that produces clear error messages. Storing raw response before parsing fulfils the governance requirement that the audit trail is complete even if parsing fails.

**Libraries**: `openai`, `zod`

**Key patterns**:
- Two-component prompt: System prompt (versioned, stored pre-call) + User prompt (sanitised text + session context, stored pre-call)
- System prompt version stored as env var `AI_SYSTEM_PROMPT_VERSION`
- Retry with exponential backoff on 429/5xx: max 3 attempts
- Parse flow: `rawResponse → store in DB → JSON.parse → zod.parse → present to user`
- If zod validation fails: log error, notify user "Analysis failed", do not display partial findings
- Confidence threshold default: 75% (configurable via `CONFIDENCE_THRESHOLD` env var)

**Risks**: OpenAI API key must never appear in logs or client code. Mitigated by env var storage and NestJS `ConfigService`. LLM hallucinations bypassing schema validation addressed by mandatory human review requirement.

---

## 5. PDF Report Generation

**Decision**: `pdfkit` with `pdfkit-table` for structured reports with tabular audit trail.

**Rationale**: pdfkit is lightweight with no browser dependency (unlike puppeteer). pdfkit-table handles the audit trail appendix table. No HTML template required. The report structure is well-defined, making programmatic generation straightforward.

**Libraries**: `pdfkit`, `pdfkit-table`

**Key patterns**:
- Generate report as a `Buffer` stream, return via `res.setHeader('Content-Type', 'application/pdf')`
- Report sections: cover/metadata → disclosure statement → accepted findings → dismissed findings summary → audit trail appendix
- Each finding section: title, risk level, confidence score, evidence excerpt, final recommendation, reviewer name + timestamp
- Audit trail appendix: table with columns: Timestamp, Event, Actor, Detail

**Risks**: pdfkit table layouts can be finicky for large tables — cap audit log display at last 200 entries for prototype.

---

## 6. Database & Prisma Patterns

**Decision**: PostgreSQL with Prisma ORM. `PrismaService` as a global singleton module. Audit log entries inserted within transactions alongside the triggering business operation.

**Rationale**: Prisma provides type-safe queries, clear migrations, and enum support that maps to PostgreSQL native enums. Global singleton prevents connection pool exhaustion. Transactional audit writes ensure no business event can succeed without its corresponding log entry.

**Key patterns**:
- `PrismaModule` marked `@Global()`, exports `PrismaService`
- `PrismaService` extends `PrismaClient`, calls `$connect()` on `onModuleInit`
- Audit writes: `prisma.$transaction([businessOperation, auditLogInsert])`
- Audit log entries: `create()` only — no `update()` or `delete()` exposed on `AuditLogEntry`
- Enums defined in `schema.prisma` using `enum` keyword — map to PostgreSQL `CREATE TYPE`

**Risks**: Enum additions in PostgreSQL require migrations (non-destructive adds are safe). N+1 queries mitigated by using Prisma `include` with sessions→findings.

---

## 7. Frontend Architecture (Vue 3 + Pinia + Tailwind)

**Decision**: Vue 3 Composition API with `<script setup>`, Pinia for state, Vue Router with navigation guards, Tailwind CSS for styling. Axios for HTTP with interceptors for auth headers and 401 handling.

**Rationale**: Composition API with `<script setup>` is the modern Vue 3 standard. Pinia is the official Vue state management library. Tailwind enables rapid, consistent UI development without custom CSS overhead.

**Key patterns**:
- Pinia `useAuthStore`: `{ token, user, isAuthenticated }` — token in memory only
- App init: `authStore.checkSession()` calls `GET /auth/me` on mount, sets user or clears state
- Vue Router `beforeEach` guard: redirect to `/login` if `!authStore.isAuthenticated`
- Axios instance with `Authorization: Bearer ${token}` interceptor
- 401 response interceptor: clear auth store → redirect to `/login`
- Finding card component receives finding prop, emits `accept`, `edit-accept`, `dismiss` events to parent ReviewView
- Low-confidence findings: distinct visual treatment via Tailwind (`border-yellow-400`, `bg-yellow-50`, `ring-2 ring-yellow-300`)

**Risks**: Token lost on page reload — mitigated by `/auth/me` on mount. Component event bubble on dismiss requires justification note validation before emitting.
