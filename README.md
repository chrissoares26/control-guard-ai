# ControlGuard AI

An AI-assisted internal financial controls evaluation assistant. Upload a process description document, run AI analysis to identify control gaps, review findings with explicit human decisions, and export a finalised PDF report.

---

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- An OpenAI API key (GPT-4o access)

---

## Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, OPENAI_API_KEY at minimum
npm install
```

**Start PostgreSQL:**
```bash
# From repo root
docker-compose up -d
```

**Run migrations and seed:**
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

**Start the API server:**
```bash
npm run start:dev
# Runs on http://localhost:3000
```

---

## Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env if your API runs on a different port
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Default Credentials

| Field    | Value                        |
|----------|------------------------------|
| Email    | `auditor@example.com`        |
| Password | `ControlGuard2026!`          |

---

## Running Tests

```bash
# Backend unit tests
cd backend
npx jest --rootDir . --testPathPattern="test/unit" --no-coverage
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable               | Required | Description                                  |
|------------------------|----------|----------------------------------------------|
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                 |
| `JWT_SECRET`           | Yes      | Secret for signing JWTs (use a long random string) |
| `JWT_EXPIRES_IN`       | No       | Token lifetime, e.g. `1d` (default: `1d`)   |
| `OPENAI_API_KEY`       | Yes      | OpenAI API key                               |
| `OPENAI_MODEL`         | No       | Model ID (default: `gpt-4o`)                |
| `AI_SYSTEM_PROMPT_VERSION` | No   | Prompt version tag for audit trail (default: `v1.0`) |
| `CONFIDENCE_THRESHOLD` | No       | Float 0–1, findings below this score get `requiresHumanReview: true` (default: `0.75`) |

### Frontend (`frontend/.env`)

| Variable            | Description                      |
|---------------------|----------------------------------|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:3000/api`) |

---

## Architecture Overview

ControlGuard AI is a two-tier web application:

**Backend** (NestJS + PostgreSQL via Prisma): A REST API serving all business logic. Key design constraints — every finding must be explicitly accepted or dismissed by a human reviewer before a session can be finalised; the audit log is append-only and records every significant event; document text is sanitised of PII before being sent to the OpenAI API.

**Frontend** (Vue 3 + Vite + Pinia + Tailwind CSS): A single-page application providing the full auditor workflow from session creation through finding review to PDF report export.

See `ARCHITECTURE.md` for a detailed design breakdown.

---

## Confidence Threshold Configuration

Set `CONFIDENCE_THRESHOLD` in `backend/.env` to control which findings are flagged for mandatory human review. The default is `0.75` (75%). Any finding where the AI's confidence score is below this threshold will have `requiresHumanReview: true` and will display an amber warning in the review UI, requiring an explicit confirmation step before acceptance.

To flag all findings (useful for testing): `CONFIDENCE_THRESHOLD=0.99`
