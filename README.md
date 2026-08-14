# HireLens

**From resume to offer — one intelligent hiring workspace.**

An AI-powered recruitment and applicant-tracking platform built around **explainable
candidate intelligence**: every match score is backed by structured evidence, skill
gaps are surfaced rather than hidden, and hiring decisions stay with human recruiters.

> This README is updated as each build phase lands. See [Project status](#project-status)
> for what's implemented today vs. planned.

---

## Table of contents

1. [Project status](#project-status)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Repository structure](#repository-structure)
5. [Local setup](#local-setup)
6. [Environment variables](#environment-variables)
7. [Database](#database)
8. [Running the app](#running-the-app)
9. [Known limitations](#known-limitations)

---

## Project status

Built in phases, each one a working increment (see `docs/` for the full phase plan).

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation — repo, frontend, backend, Postgres, Prisma, health check | ✅ Done |
| 2 | Authentication & RBAC | 🚧 In progress |
| 3 | Company & Jobs | ⏳ Planned |
| 4 | Candidates & Applications | ⏳ Planned |
| 5 | Resume upload & parsing | ⏳ Planned |
| 6 | Explainable AI matching | ⏳ Planned |
| 7 | Pipeline (Kanban) | ⏳ Planned |
| 8 | Interviews & feedback | ⏳ Planned |
| 9 | Offers | ⏳ Planned |
| 10 | Candidate portal polish | ⏳ Planned |
| 11 | Analytics | ⏳ Planned |
| 12 | AI interview questions & copilot | ⏳ Planned |
| 13–14 | Security hardening & testing | ⏳ Planned |
| 15–16 | Seed data, docs, deployment, polish | ⏳ Planned |

## Architecture

```
Browser → Next.js (App Router) → REST API (Express) → Prisma → PostgreSQL
                                        │
                                        └─→ AI subsystem (provider-abstracted LLM calls)
                                        └─→ File storage (local disk in dev / Cloudinary-ready)
```

Modular monolith — one deployable backend, organized into feature modules
(`auth`, `companies`, `jobs`, `candidates`, `resumes`, `applications`, `interviews`,
`feedback`, `offers`, `notifications`, `analytics`), not a microservice sprawl.

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL 16 + Prisma ORM
- **Validation:** Zod, on both client input and AI-generated output
- **Charts:** Recharts
- **AI:** Anthropic Claude via a provider-abstracted interface (swappable), mock mode
  available for offline development
- **File storage:** local disk in development behind a storage interface; swappable
  for Cloudinary/S3-equivalent in production

## Repository structure

```
hirelens/
├── frontend/          Next.js app (App Router)
│   └── src/
│       ├── app/            routes
│       ├── components/     shared UI
│       ├── features/       feature-scoped UI + logic
│       ├── hooks/
│       ├── lib/             fetch client, env, helpers
│       ├── services/        typed API service calls
│       └── types/
├── backend/           Express API
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/          env validation, Prisma client
│       ├── middleware/       auth, RBAC, error handling
│       ├── modules/          one folder per domain module
│       ├── ai/                AIProvider abstraction + implementations
│       └── utils/
├── tools/              local Postgres binaries (dev-only, gitignored)
├── docs/
└── .env.example
```

## Local setup

Prerequisites: Node.js 20+, npm.

```bash
git clone <repo>
cd hirelens

# Backend
cd backend
npm install
cp .env.example .env   # fill in values, see below
npm run prisma:migrate
npm run dev             # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

## Environment variables

See [`backend/.env.example`](backend/.env.example) for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Session signing secret (32+ chars) |
| `AI_PROVIDER` | `anthropic` or `mock` |
| `ANTHROPIC_API_KEY` | Leave empty to run AI subsystem in mock mode |
| `STORAGE_DRIVER` | `local` or `cloudinary` |

The backend validates all required environment variables at startup with Zod and
fails fast with a clear message if something required is missing — see
[`backend/src/config/env.ts`](backend/src/config/env.ts).

## Database

Local development uses a portable PostgreSQL 16 instance (no admin rights or Docker
required) — see [`tools/README.md`](tools/README.md) for how it's set up and how to
start/stop it. Production points `DATABASE_URL` at any managed Postgres instance;
nothing else changes.

```bash
cd backend
npx prisma migrate dev      # apply migrations locally
npx prisma studio           # browse data
```

## Running the app

| Service | Command | URL |
|---|---|---|
| Backend API | `npm run dev` (in `backend/`) | http://localhost:4000/api/v1 |
| Frontend | `npm run dev` (in `frontend/`) | http://localhost:3000 |
| Health check | — | http://localhost:4000/api/v1/health |

## Known limitations

- AI subsystem runs in mock mode until `ANTHROPIC_API_KEY` is supplied — see
  `backend/.env.example`.
- File storage defaults to local disk in development; production should set
  `STORAGE_DRIVER=cloudinary` with real credentials.
- This is an MVP: match scores are an evidence-based assistance signal, not a
  guarantee of hiring outcome. See in-app copy on the match screen for the exact
  framing shown to recruiters.
