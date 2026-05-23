# AI Usage Report — ControlGuard AI

## Tools Used

| Tool | Purpose |
|------|---------|
| **Claude Code (claude-sonnet-4-6)** | Assisted with planning, architecture design, code generation, and implementation of all application components |
| **OpenAI GPT-4o** | Runtime AI model used by the application to analyse process documents and identify internal control gaps |

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
