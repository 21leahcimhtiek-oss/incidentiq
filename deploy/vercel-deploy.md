# Deploying IncidentIQ to Vercel

## Prerequisites

- Vercel account
- GitHub repository set up
- All third-party services configured (see docs/setup.md)

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/21leahcimhtiek-oss/incidentiq)

## Manual Deployment

### 1. Connect to Vercel

```bash
npm i -g vercel
vercel login
vercel link
```

### 2. Configure environment variables

In the Vercel dashboard -> Project -> Settings -> Environment Variables, add all variables from `.env.example`:

| Variable | Environment |
|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | All |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | All |
| SUPABASE_SERVICE_ROLE_KEY | Production, Preview |
| STRIPE_SECRET_KEY | Production, Preview |
| STRIPE_WEBHOOK_SECRET | Production |
| OPENAI_API_KEY | Production, Preview |
| UPSTASH_REDIS_REST_URL | All |
| UPSTASH_REDIS_REST_TOKEN | All |
| NEXT_PUBLIC_APP_URL | All (set per env) |

### 3. Deploy

```bash
vercel --prod
```

Or push to `main` branch for automatic deployment.

## Stripe Webhook Configuration

After deployment, update your Stripe webhook URL:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) -> Developers -> Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Custom Domain

1. In Vercel dashboard -> Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

## Monitoring

### Sentry
1. Create project at [sentry.io](https://sentry.io)
2. Add `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to Vercel env vars
3. Add to `next.config.mjs`: Sentry org and project

### Vercel Analytics
Already integrated via `@vercel/analytics`. Enable in Vercel dashboard -> Analytics.