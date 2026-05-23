# Quickstart: ControlGuard AI

**Feature**: 002-finance-ai-controls-assistant
**Date**: 2026-05-23

---

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+ running locally (or Docker)
- An OpenAI API key with access to GPT-4o

---

## Repository Structure

```
control-guard-ai/
├── backend/          # NestJS API server
├── frontend/         # Vue 3 SPA
├── docs/             # Source PDFs
└── specs/            # Planning artifacts
```

---

## Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env
```

Required `.env` values:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/controlguard
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=8h
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
AI_SYSTEM_PROMPT_VERSION=v1.0
CONFIDENCE_THRESHOLD=0.75
```

```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed a test user (optional)
npx prisma db seed

# Start development server
npm run start:dev
# → API available at http://localhost:3000/api
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Required `.env` values:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

```bash
# Start development server
npm run dev
# → UI available at http://localhost:5173
```

---

## Running Tests

```bash
# Backend unit + integration tests
cd backend && npm run test

# Backend e2e tests (requires running DB)
cd backend && npm run test:e2e

# Frontend component tests
cd frontend && npm run test
```

---

## Default Credentials (Development Seed)

After running the seed script:
- Email: `auditor@example.com`
- Password: `ControlGuard2026!`

---

## Key Commands

| Task | Command |
|---|---|
| Generate Prisma client after schema change | `cd backend && npx prisma generate` |
| Create a new migration | `cd backend && npx prisma migrate dev --name <description>` |
| View DB in Prisma Studio | `cd backend && npx prisma studio` |
| Build backend for production | `cd backend && npm run build` |
| Build frontend for production | `cd frontend && npm run build` |

---

## Architecture at a Glance

```
Browser (Vue 3 + Tailwind)
    │  HTTP/REST
    ▼
NestJS API (Port 3000)
  ├── AuthModule       – JWT login/logout
  ├── SessionsModule   – CRUD + finalise
  ├── DocumentsModule  – Upload + text extraction + sanitisation
  ├── AnalysisModule   – AI call + schema validation
  ├── FindingsModule   – Review decisions
  ├── ReportsModule    – PDF export
  └── AuditLogModule   – Append-only event log
    │
    ▼
PostgreSQL (via Prisma ORM)
    │
    ▼ (from AnalysisModule only)
OpenAI API (GPT-4o)
```

---

## Confidence Threshold

The confidence threshold defaults to `0.75` (75%). To change it:

1. Update `CONFIDENCE_THRESHOLD` in `backend/.env`
2. Restart the backend server

No code change is required. The value is read at runtime via NestJS `ConfigService`.
