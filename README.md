# IncidentIQ

**AI incident management. Zero manual post-mortems.**

IncidentIQ is a production-grade, open-source incident management and post-mortem automation SaaS. Built for SRE and DevOps teams who want AI to handle the documentation work.

[![CI](https://github.com/21leahcimhtiek-oss/incidentiq/actions/workflows/ci.yml/badge.svg)](https://github.com/21leahcimhtiek-oss/incidentiq/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/21leahcimhtiek-oss/incidentiq)

## Features

| Feature | Description |
|---------|-------------|
| AI Severity Classification | GPT-4 classifies every incident as P0-P3 automatically |
| AI Post-Mortems | One-click generates complete post-mortems from incident timelines |
| On-Call Routing | Auto-pages on-call engineers for P0/P1 via Slack |
| MTTR Analytics | Charts showing mean time to resolve by severity and team |
| Real-Time Timeline | Live updates feed on every incident |
| Alert Ingestion API | REST API for external monitoring tools to push alerts |
| Subscription Billing | Stripe-powered plans with Customer Portal |
| Org Isolation | Full RLS enforcement at database level |

## Architecture

```
Next.js 14 (App Router)
+-- Supabase (PostgreSQL + Auth + RLS)
+-- OpenAI (GPT-4o-mini for severity, GPT-4o for post-mortems)
+-- Stripe (subscription billing)
+-- Upstash Redis (rate limiting)
+-- Sentry (error tracking)
```

Deployed on Vercel with edge middleware for auth gating.

## Quick Start

### Local Development

```bash
git clone https://github.com/21leahcimhtiek-oss/incidentiq
cd incidentiq
npm install
cp .env.example .env.local
# Configure .env.local with your credentials
npm run dev
```

See [docs/setup.md](docs/setup.md) for complete setup instructions.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/21leahcimhtiek-oss/incidentiq)

## Database

Run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

Tables: `orgs`, `users`, `incidents`, `incident_updates`, `oncall_schedules`, `postmortems`, `alerts`, `integrations`

All tables have RLS enabled with org-isolation policies.

## API Reference

Full API documentation: [docs/api.md](docs/api.md)

### Alert Ingestion (External)

```bash
curl -X POST https://incidentiq.vercel.app/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "source": "datadog",
    "org_id": "your-org-uuid",
    "api_key": "your-api-key",
    "severity": "P1",
    "payload": { "alert": "High error rate", "threshold": 5 }
  }'
```

## Pricing

| Plan | Price | Users | Incidents |
|------|-------|-------|-----------|
| Starter | $49/month | 5 | 100/month |
| Pro | $149/month | Unlimited | Unlimited |
| Enterprise | Custom | Unlimited | Unlimited |

## Self-Hosting with Docker

```bash
docker build -t incidentiq .
docker run -p 3000:3000 --env-file .env.local incidentiq
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o / GPT-4o-mini
- **Billing**: Stripe
- **Rate Limiting**: Upstash Redis
- **Error Tracking**: Sentry
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Testing**: Jest + Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [AUDIT.md](AUDIT.md) for the security audit results.

To report a vulnerability, email security@incidentiq.app.

## License

MIT (c) 2024 [Aurora Rayes LLC](https://aurorarayes.com)