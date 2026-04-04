# IncidentIQ Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (free tier works)
- Stripe account
- OpenAI API key
- Upstash Redis account

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/21leahcimhtiek-oss/incidentiq
cd incidentiq
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. See details below.

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings -> API and copy:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY`
3. Run the database migration:
   - Open the SQL editor in Supabase dashboard
   - Paste and run `supabase/migrations/001_initial_schema.sql`

### 4. Set up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two products with monthly prices:
   - Starter: $49/month
   - Pro: $149/month
3. Copy the price IDs to `STRIPE_STARTER_PRICE_ID` and `STRIPE_PRO_PRICE_ID`
4. Set up a webhook endpoint pointing to `/api/billing/webhook`
5. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

For local testing, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### 5. Set up OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add to `OPENAI_API_KEY`

### 6. Set up Upstash Redis

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token to `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires dev server running)
npm run dev &
npm run test:e2e
```

## Database Migrations

When making schema changes, add a new file to `supabase/migrations/` with an incremented number prefix (e.g., `002_add_notifications.sql`).

## Deployment

See [deploy/vercel-deploy.md](../deploy/vercel-deploy.md) for complete deployment instructions.