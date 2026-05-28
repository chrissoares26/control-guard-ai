# AI Usage Report — ControlGuard AI

## Tools Used

| Tool | Purpose |
|------|---------|
| **Claude Code (claude-sonnet-4-6)** | Assisted with planning, architecture design, code generation, and implementation of all application components |
| **OpenAI GPT-4o** | Runtime AI model used by the application to analyse process documents and identify internal control gaps |

---

## Example Prompts Used

Below are representative prompts submitted to Claude Code during development.

**Specification generation:**
> "I have a Finance AI assessment brief (PDF attached). I want to build Option 2 — Internal Controls Evaluation Assistant. Create a full feature specification with user stories, functional requirements, success criteria, and edge cases. The application must include human-in-the-loop validation, an audit trail, and AI-powered control gap analysis."

**Architecture design:**
> "Design the NestJS backend architecture for ControlGuard AI. It needs: JWT authentication, document upload with text extraction (PDF and DOCX), OpenAI integration for control gap analysis, an append-only audit log, and PDF report export. Define the module structure, key design constraints, and data model. The audit log must be strictly immutable — no updates or deletes ever."

**PII sanitisation module:**
> "Implement a SanitisationService in NestJS that strips PII from extracted document text before it's sent to the OpenAI API. It must redact: email addresses, phone numbers (international and domestic), IBANs, and account numbers (8+ digit sequences). Return the sanitised text plus a summary of what was matched. Include a unit test file covering each pattern type."

**Governance enforcement prompt:**
> "In the AnalysisService, after receiving and validating the OpenAI response, persist each finding. Apply a confidence threshold check: if a finding's confidence_score is below the CONFIDENCE_THRESHOLD env var (default 0.75), set requiresHumanReview to true. This must be evaluated and stored at write time, not read time, so that changing the env var never retroactively alters existing findings."

**Audit trail atomicity:**
> "In the FindingsService review method, wrap the finding status update and the audit log entry in a single prisma.$transaction so both succeed or both roll back. The transaction must also transition the session from ANALYSED to IN_REVIEW if this is the first finding decision. The audit log entry must store the reviewer identity, the action taken, and whether the recommendation was edited."

---

## Claude Code Usage

Claude Code was used throughout the entire development lifecycle:

1. **Specification phase**: Translated the assessment brief and PRD context PDF into a structured feature specification with user stories, functional requirements, and success criteria.

2. **Planning phase**: Generated technical architecture decisions (see `specs/002-finance-ai-controls-assistant/research.md`), data model (`data-model.md`), API contracts (`contracts/api.md`), and project structure.

3. **Task decomposition**: Broke the implementation into 72 atomic tasks (one file per task) designed to avoid context rot in AI-assisted development sessions.

4. **Code generation**: Generated all backend modules (NestJS services, controllers, guards, filters, Prisma schema, seed script) and frontend components (Vue 3 SPA with Pinia stores, Tailwind-styled views and components).

5. **Review**: All AI-generated code was reviewed for correctness, security, and alignment with the architectural constraints before being accepted.

---

## System Prompt Design

The AI analysis system prompt (see `backend/src/analysis/ai-prompt.service.ts`) was designed around three goals:

### 1. Role clarity
The prompt establishes the AI as an internal controls expert familiar with the COSO framework, segregation of duties principles, and the four standard control types (preventive, detective, corrective, compensating). This grounds the analysis in a recognisable professional framework.

### 2. Structured output enforcement
The prompt specifies an exact JSON schema the model must follow, matching the application's `Finding` entity. This is paired with `response_format: { type: "json_object" }` in the OpenAI API call, and further validated with a Zod schema on the response. Multi-layer validation catches both schema deviations and semantic issues.

### 3. Hallucination mitigations
- Every finding must include an `evidence_excerpt` (a direct quote from the document). Findings without evidence are discarded at parse time.
- Confidence scores must be grounded: the prompt instructs the model to assign `flagged` / low scores when uncertain, rather than fabricating high confidence.
- The prompt instructs the model to flag ambiguous findings rather than guess, and to prefer false negatives over false positives.

---

## Areas Reviewed and Modified

All AI-generated code was reviewed. Notable modifications made during review:

1. **Prisma JSON typing**: Claude initially generated `CreateAuditLogDto` as a class with typed `payload`. This caused a TypeScript error at the Prisma boundary (`InputJsonValue` namespace). Fixed by: converting to an `interface` with `payload: Record<string, unknown>` and adding an `as any` cast only at the Prisma `.create()` call — keeping types correct everywhere else.

2. **Auth store token handling**: The `api.ts` response interceptor used `window.location.href` for 401 redirects rather than Vue Router. Kept intentionally — the Axios interceptor cannot access the router instance without a circular dependency; `window.location.href` is a safe fallback.

3. **tsconfig.node.json**: The template tsconfig extended `@tsconfig/node20` which was not installed. Added it as a dev dependency to restore the intended configuration rather than inlining the settings.

4. **Analysis error handling**: Added `requiresHumanReview: f.confidence_score < this.confidenceThreshold` at the persistence layer to ensure threshold is evaluated at write time (not read time), so changing `CONFIDENCE_THRESHOLD` does not retroactively alter existing findings.

---

## Validation Approach

AI outputs were validated through three complementary mechanisms:

1. **Zod schema validation** (`backend/src/analysis/findings-schema.ts`): The raw JSON from the OpenAI API is parsed through a complete Zod schema before any data is persisted. Any schema mismatch throws a handled error and creates a `failure` audit log entry.

2. **Unit tests** (`backend/test/unit/sanitisation.service.spec.ts`): The PII sanitisation service was tested independently with known inputs (emails, IBANs, account numbers, clean text) to verify regex patterns behave correctly before the service was integrated.

3. **Manual review**: The full end-to-end flow (login → create session → upload document → analyse → review findings → finalise → export PDF) was validated manually against the API contracts.
