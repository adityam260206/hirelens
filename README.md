# HireLens

**From resume to offer — one intelligent hiring workspace.**

An AI-powered recruitment and applicant-tracking platform built around **explainable
candidate intelligence**: every match score is backed by structured, per-skill evidence
(not just an LLM's opinion), skill gaps are surfaced rather than hidden, and hiring
decisions stay with human recruiters.

---

## 🔗 Live deployment

| | |
|---|---|
| **App (frontend)** | **[hirelens-pearl.vercel.app](https://hirelens-pearl.vercel.app)** |
| **API (backend)** | [hirelens-backend-ubtq.onrender.com/api/v1](https://hirelens-backend-ubtq.onrender.com/api/v1) |
| **API health check** | [hirelens-backend-ubtq.onrender.com/api/v1/health](https://hirelens-backend-ubtq.onrender.com/api/v1/health) |
| **Source** | [github.com/adityam260206/hirelens](https://github.com/adityam260206/hirelens) |

> ⏱️ **First load may be slow.** The backend runs on Render's free tier, which spins
> down after ~15 minutes of no traffic. The first request after idle takes 30–60s to
> wake up (cold start) — this is a hosting-tier characteristic, not a bug. Subsequent
> requests are fast.

### Demo credentials

All three roles are pre-seeded on the live deployment under one company
(**Nimbus Technologies**), with a published job and one fully AI-analyzed application
ready to explore immediately:

| Role | Email | Password |
|---|---|---|
| Recruiter | `demo.recruiter@hirelens.dev` | `HireLens2026!` |
| Interviewer | `demo.interviewer@hirelens.dev` | `HireLens2026!` |
| Candidate | `demo.candidate@hirelens.dev` | `HireLens2026!` |

Suggested walkthrough:
1. Log in as **recruiter** → see the "Backend Engineer" and "ML Engineer" jobs, open
   the Backend Engineer pipeline to see Alex Morgan's application with an **88/100**
   AI match score and full skill-by-skill evidence.
2. Log in as **candidate** → view application status from the candidate's side.
3. Log in as **interviewer** → see what an interviewer can (and can't) access.
4. Try registering a brand-new recruiter or candidate account — self-registration is
   fully open.

---

## What's implemented

| Area | Status |
|---|---|
| Auth & RBAC (Candidate / Recruiter / Interviewer) | ✅ |
| Company & Jobs (draft → publish → close) | ✅ |
| Candidate profiles & applications | ✅ |
| Resume upload & AI parsing (PDF/DOCX) | ✅ |
| Explainable AI matching engine (deterministic scoring + evidence) | ✅ |
| Recruitment pipeline (drag-and-drop Kanban) | ✅ |
| Interviews & structured feedback | ✅ |
| Offers | ✅ |
| Candidate portal | ✅ |
| Recruiter analytics dashboard | ✅ |
| AI interview question generator | ✅ |
| RBAC / IDOR security hardening | ✅ |
| Automated test suite | 🚧 in progress |
| Notifications | ⏳ not built (documented gap) |

## How the matching engine works

The headline feature is **explainable, not just AI-flavored**. Scoring is a **pure,
deterministic function** over parsed resume data vs. job requirements — the same
resume and job always produce the same score, with a machine-checkable evidence array
(`skill → matched/gap → why`). The AI layer only adds a plain-English narrative on top
of numbers that are already final; if the AI call fails, the score and evidence are
completely unaffected; only the narrative sentence is missing.

```
Resume + Job requirements
        │
        ▼
Deterministic scorer (pure functions, no AI)
  → overallScore, technicalScore, experienceScore, evidence[]
        │
        ▼
AI narrative (optional gloss — Gemini)
  → 2–3 sentence plain-English summary of the numbers above
```

## Architecture

```
Browser → Next.js 16 (App Router) → REST API (Express) → Prisma → PostgreSQL (Neon)
                                          │
                                          └─→ AI subsystem (provider-abstracted)
                                          └─→ File storage (local disk / Cloudinary-ready)
```

Modular monolith — one deployable backend organized into feature modules (`auth`,
`companies`, `jobs`, `candidates`, `resumes`, `applications`, `interviews`,
`feedback`, `offers`, `analytics`, `users`), not a microservice sprawl.

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 — deployed on Vercel
- **Backend:** Node.js, Express, TypeScript — deployed on Render
- **Database:** PostgreSQL (Neon, serverless) + Prisma ORM
- **Validation:** Zod, on both client input and AI-generated output (never trust raw LLM JSON)
- **Charts:** Recharts
- **AI:** Google Gemini (`gemini-flash-latest`) via a provider-abstracted interface —
  also supports Anthropic Claude and a deterministic mock mode; swap with one env var
- **Auth:** JWT in httpOnly/sameSite cookies, bcrypt password hashing
- **File storage:** local disk in development behind a storage interface; swappable
  for Cloudinary in production

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
│       ├── ai/                AIProvider abstraction (Gemini / Anthropic / mock)
│       └── utils/
├── render.yaml         Render Blueprint (backend deploy config)
├── tools/              local Postgres binaries (dev-only, gitignored)
└── .env.example
```

## Running it locally

Prerequisites: Node.js 20+, npm, a PostgreSQL database (local or hosted).

```bash
git clone https://github.com/adityam260206/hirelens.git
cd hirelens

# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, and an AI key (or leave AI keys empty for mock mode)
npx prisma migrate dev
npm run dev              # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env.local
npm run dev              # http://localhost:3000
```

### Environment variables

See [`backend/.env.example`](backend/.env.example) for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Session signing secret (32+ chars) |
| `AI_PROVIDER` | `gemini` \| `anthropic` \| `mock` |
| `GEMINI_API_KEY` | Free at [aistudio.google.com](https://aistudio.google.com) — leave empty to run in mock mode |
| `STORAGE_DRIVER` | `local` or `cloudinary` |

The backend validates all required environment variables at startup with Zod and
fails fast with a clear message if something required is missing — see
[`backend/src/config/env.ts`](backend/src/config/env.ts).

## Known limitations

- **Gemini free tier can be intermittently overloaded.** `gemini-flash-latest` on the
  free tier occasionally returns `503 UNAVAILABLE` under Google's own load, causing a
  resume parse or AI narrative to fail. The backend retries automatically with
  exponential backoff; the deterministic match score and evidence are computed
  independently of the AI narrative and are never affected by this. Re-uploading a
  resume or re-triggering analysis on transient failure always works.
- **Render free tier cold start.** ~30–60s wake-up after 15 minutes of inactivity.
- **Automated test suite** (RBAC/IDOR, matching determinism, auth) is in progress,
  not yet complete — correctness so far has been verified through extensive manual
  and scripted API testing (documented via curl round-trips during development).
- **Notifications** (email/in-app) are not implemented — an explicitly documented gap.
- This is an MVP: match scores are an evidence-based assistance signal for recruiters,
  not a guarantee or sole basis for a hiring decision.

## Security notes

- RBAC enforced server-side at both the router level (`requireRole`) and the service
  level (ownership/company-scoping checks) — a candidate can never fetch another
  candidate's data, and a recruiter can never fetch another company's data, regardless
  of what IDs they guess.
- AI prompts explicitly instruct the model to never infer or comment on protected
  characteristics (race, religion, gender, age, disability, etc.) and treat resume
  text strictly as data, never as instructions — resisting prompt injection embedded
  in an uploaded resume.
- All AI-generated structured output (parsed resume fields, interview questions) is
  re-validated against a Zod schema after parsing — a malformed or hallucinated LLM
  response is rejected rather than trusted.
