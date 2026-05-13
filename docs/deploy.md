# Deploy Guide

End-to-end steps to get arxify.ai live. Assumes you've cloned this repo and
have an account at each named service.

## 1. Domain (Cloudflare Registrar)

```
arxify.ai → $80/year
```

Set nameservers to Cloudflare. Once DNS is active, add:
- `arxify.ai → Vercel CNAME / A` (set after step 3)
- `api.arxify.ai → Railway` (set after step 4)

Fallback domains if taken: `empirica.ai`, `researchdraft.ai`, `theoremlab.com`.

## 2. Database (Neon / Supabase / Railway Postgres)

```bash
# Neon: https://neon.tech, create project arxify
# Get DATABASE_URL — paste into api/.env and Railway env vars
cd db
pnpm install
DATABASE_URL=postgres://... pnpm push    # apply Drizzle schema
```

## 3. Frontend (Vercel)

```bash
cd web
pnpm install
vercel link
vercel env add NEXT_PUBLIC_API_URL production    # set to https://api.arxify.ai
vercel --prod
```

Custom domain: in Vercel project settings → Domains → add `arxify.ai`. Vercel will
display CNAME/A target — set on Cloudflare DNS.

## 4. Backend (Railway)

```bash
cd api
railway init
railway link    # create new project
# Set env vars in Railway dashboard from .env.example
railway up
```

Custom domain: Railway → Settings → Networking → add `api.arxify.ai`. Set CNAME on
Cloudflare DNS to point to Railway's generated host.

## 5. Stripe

In Stripe dashboard:

1. Create products:
   - **Scholar** — monthly $39, yearly $396 ($33/mo equivalent)
   - **Lab** — monthly $99, yearly $1008 ($84/mo equivalent)
2. Copy the 4 Price IDs into Railway env:
   ```
   STRIPE_PRICE_SCHOLAR_MONTHLY=price_…
   STRIPE_PRICE_SCHOLAR_YEARLY=price_…
   STRIPE_PRICE_LAB_MONTHLY=price_…
   STRIPE_PRICE_LAB_YEARLY=price_…
   ```
3. Add webhook endpoint:
   - URL: `https://api.arxify.ai/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET` in Railway env.
4. Set `STRIPE_SECRET_KEY` in Railway env.

## 6. Object storage (S3 / R2)

Create bucket `arxify-artifacts` on Cloudflare R2 (cheaper) or AWS S3. Set:
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=arxify-artifacts
AWS_REGION=auto    # for R2
```

## 7. Redis (Upstash / Railway)

```
REDIS_URL=redis://default:…@…upstash.io:6379
```

## 8. Pipeline binaries

The Railway worker image needs:
- `ai-researcher` cloned at `/opt/ai-researcher`
- `AI-Scientist-v2` cloned at `/opt/AI-Scientist-v2` with Python venv installed

Recommended: build a custom Docker image that bakes both repos plus their Python deps.
For MVP / first 10 users: keep the Railway worker single-instance + manually verify
runs in production.

## 9. Smoke test (end-to-end)

```bash
# 1. Sign up at https://arxify.ai/signup
# 2. Create a project — paste the contents of /Users/hunter/ai-researcher/examples/workshop_example.md
# 3. Trigger ideation run
# 4. Wait ~5 minutes (depending on Claude / MiroThinker latency)
# 5. Verify 5 idea JSON artifacts in dashboard
# 6. Trigger tournament run
# 7. Verify tournament markdown artifact
# 8. (Optional) Trigger writeup → PDF
# 9. Upgrade to Scholar via Stripe Checkout in test mode
# 10. Verify webhook fires and credits_remaining = 5000
```

## 10. Launch

- Post to Hacker News: "arxify.ai — From idea to paper, built on AI-Scientist-v2 + MiroThinker"
- Post to r/AcademicTwitter / r/PhD / r/MachineLearning
- DM the people who commented on Hunter's Xiaohongshu post (the 共创伙伴 招募)
- Offer first 10 customers 90 days free in exchange for testimonial
