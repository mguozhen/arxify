# arxify.ai

**From idea to paper. One person. One lab.**

SaaS wrapper around the open-source [ai-researcher](https://github.com/mguozhen/ai-researcher) pipeline, which itself is an integration of [SakanaAI/AI-Scientist-v2](https://github.com/SakanaAI/AI-Scientist-v2) and [MiroMindAI/MiroThinker](https://github.com/MiroMindAI/MiroThinker).

```
INPUT  → your data / idea / proposal
PLAN   → AI generates research plan + experiment design
DATA   → you upload experimental results
PAPER  → AI generates LaTeX + PDF draft
```

## Pricing

| Tier | $/mo | $/mo (annual) | Credits | For |
|---|---|---|---|---|
| **Spark** | $0 | $0 | 300 | First paper |
| **Scholar** | $39 | $33 | 5,000 | Your dissertation |
| **Lab** | $99 | $84 | 15,000 | Your team |

Anchored to Manus tier structure ($20–$200) but priced upward because output (paper draft) carries higher stakes than task automation.

## Repo layout

```
arxify/
├── web/              # Next.js 15 frontend (Vercel)
│   ├── app/
│   │   ├── (marketing)/      # Landing + pricing
│   │   ├── (dashboard)/       # Authenticated app
│   │   └── globals.css        # Tailwind 4 design tokens
│   └── package.json
├── api/              # FastAPI backend (Railway / Modal)
│   ├── main.py
│   ├── routes/                # /auth /projects /runs /artifacts /billing
│   ├── jobs/                  # subprocess wrappers around ai-researcher CLI
│   ├── billing/               # Stripe Checkout + portal + webhooks
│   └── utils/
├── db/               # Drizzle schema + migrations
│   ├── schema/                # auth, orgs, projects, runs, billing
│   └── drizzle.config.ts
├── docs/             # Architecture notes
└── scripts/          # Deploy + ops helpers
```

## Architecture

```
                   ┌──────────────────────────────┐
                   │  arxify.ai (Next.js · Vercel) │
                   │  Landing · Dashboard · Auth   │
                   └──────────────┬───────────────┘
                                  │ REST + WebSocket
                                  ▼
              ┌─────────────────────────────────────┐
              │  FastAPI backend (Railway)            │
              │  - better-auth session validation     │
              │  - Stripe Billing (Checkout + Portal) │
              │  - Project / Run / Artifact CRUD      │
              │  - File upload → S3 / R2              │
              │  - Job enqueue → arq + Redis          │
              └───────────────────┬─────────────────┘
                                  │
                          ┌───────┴───────┐
                          ▼               ▼
                  ┌────────────┐   ┌──────────────────┐
                  │ arq workers │   │ Postgres (Drizzle)│
                  │ subprocess: │   │ auth_users        │
                  │ → ai-       │   │ orgs / org_members│
                  │   researcher│   │ projects          │
                  │   CLI       │   │ runs / artifacts  │
                  └──────┬─────┘   │ subscriptions     │
                         │         │ credit_ledger     │
                         ▼         └──────────────────┘
              ┌─────────────────────────────────┐
              │ ai-researcher pipeline             │
              │ perform_ideation_temp_free.py      │
              │ rank_ideas.py · tournament_ideas.py│
              │ DeepCritique · SearchLiterature    │
              │ perform_writeup.py (LaTeX→PDF)     │
              └────────────────────────────────┘
```

## Quick start (local dev)

### Prereqs

- Node 22+ (`bun` or `pnpm` either fine)
- Python 3.12
- Postgres 16 (or Supabase / Neon)
- Redis 7 (for arq workers)
- The `ai-researcher` repo cloned at `/opt/ai-researcher` (or set `AI_RESEARCHER_DIR` env)
- AI-Scientist-v2 cloned at `/opt/AI-Scientist-v2` (or set `AI_SCIENTIST_DIR` env)

### 1. Database

```bash
createdb arxify
cd db
pnpm install
pnpm push   # runs drizzle-kit push
```

### 2. Backend

```bash
cd api
python3.12 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in keys
uvicorn api.main:app --reload --port 8000
```

For local dev without auth/billing: `export ARXIFY_DEV_USER=hunter@arxify.ai` and `export ARXIFY_INLINE_JOBS=1`.

### 3. Frontend

```bash
cd web
pnpm install
pnpm dev          # http://localhost:3000
```

## Deploy steps (user action required)

The MVP scaffold is local-only. Going live requires the following manual setup:

1. **Domain** — register `arxify.ai` at Cloudflare Registrar ($80/yr)
2. **Vercel** — `vercel link` against `web/`, set env vars (`NEXT_PUBLIC_API_URL`, etc.), `vercel --prod`
3. **Railway** — new project from `api/`; set all env vars from `.env.example`; deploy with `Procfile` or Railway's autodetect
4. **Postgres** — Railway has Postgres add-on; or use Neon/Supabase. Set `DATABASE_URL`.
5. **Redis** — Railway / Upstash. Set `REDIS_URL`.
6. **Stripe** — create products `Scholar` (monthly + yearly) and `Lab` (monthly + yearly) in dashboard. Copy 4 price IDs into env. Set webhook to `https://api.arxify.ai/api/billing/webhook` (event types: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded`).
7. **DNS** — Cloudflare DNS: `arxify.ai → Vercel`, `api.arxify.ai → Railway`
8. **S3 / R2** — bucket `arxify-artifacts`; access key in backend env
9. **First run** — sign up via web; create a project from `examples/workshop_example.md`; trigger ideation; verify artifact written.

## Status

- ✅ Skeleton ready (Nov 2026)
- ⏳ Database migrations pending first push
- ⏳ Stripe products pending creation
- ⏳ Domain registration pending
- ⏳ First end-to-end test pending

This is an MVP scaffold built in one session. Full 4-week plan: `/Users/hunter/.claude/plans/manus-glittery-bachman.md`.

## License

SaaS layer (this repo): source-available, not OSI-licensed. See LICENSE.
Core pipeline (separate repo `ai-researcher`): MIT.
