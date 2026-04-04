# IncidentIQ Architecture

## Overview

IncidentIQ is a production-grade AI-powered incident management SaaS built on a modern serverless stack. The application is designed for reliability, security, and scale.

## System Architecture

```
+-------------------------------------------------------------+
|                        Vercel Edge Network                   |
+---------------+----------------+----------------------------+
|   Next.js App |  API Routes    |  Edge Middleware            |
|   (App Router)|  (Node.js)     |  (Auth gating, RBAC)       |
+---------------+--------+-------+----------------------------+
                         |
         +---------------+--------------+
         v               v              v
   +-----------+   +-----------+  +-----------+
   | Supabase  |   |  OpenAI   |  |  Stripe   |
   | (Postgres |   |  GPT-4o   |  | Billing   |
   |  + Auth)  |   |           |  |           |
   +-----------+   +-----------+  +-----------+
         |
   +-----+------+
   |  Upstash   |
   |  Redis     |
   |(Rate limit)|
   +------------+
```

## Technology Stack

### Frontend
- **Next.js 14 (App Router)**: Server-side rendering, nested layouts, server components for data fetching
- **TypeScript**: Strict mode throughout the entire codebase
- **Tailwind CSS**: Utility-first CSS with custom design tokens
- **Recharts**: Data visualization for MTTR dashboards
- **Radix UI**: Accessible component primitives

### Backend
- **Next.js API Routes**: REST API endpoints running on Node.js runtime
- **Zod**: Runtime type validation for all API inputs
- **Sentry**: Error tracking and performance monitoring

### Data Layer
- **Supabase (PostgreSQL)**: Primary database with Row Level Security for org isolation
- **Supabase Auth**: Email/password authentication with JWT tokens
- **Upstash Redis**: Rate limiting via sliding window algorithm

### AI Layer
- **OpenAI GPT-4o-mini**: Severity classification (fast, cheap)
- **OpenAI GPT-4o**: Post-mortem generation (thorough, detailed)
- Both with retry logic (3 attempts, exponential backoff) and graceful fallbacks

### Payments
- **Stripe**: Subscription billing with Checkout Sessions and Customer Portal
- Webhook signature verification for all Stripe events

### Observability
- **Sentry**: Client + server + edge error capture, performance tracing
- **Vercel Analytics**: Web vitals and page-level analytics

## Database Schema

### Org Isolation
Every table has an `org_id` foreign key. Row Level Security policies enforce that users can only access data belonging to their organization. The helper function `get_user_org_id()` resolves the current user's organization from the `users` table.

### RBAC
Three roles enforced at both application and database level:
- **admin**: Full CRUD on all resources, can invite users, manage billing
- **responder**: Can create and update incidents, add updates, generate post-mortems
- **viewer**: Read-only access to all resources

### Table Relationships

```
orgs
  +-- users (org_id)
  +-- incidents (org_id)
      +-- incident_updates (incident_id)
      +-- postmortems (incident_id, org_id)
  +-- oncall_schedules (org_id)
  +-- alerts (org_id)
  +-- integrations (org_id)
```

## API Design

### Authentication
All protected routes extract the user from the Supabase session via server-side cookies. The middleware refreshes sessions automatically on each request.

### Rate Limiting
Using Upstash Redis with sliding window algorithm:
- General API: 100 req/min per IP
- Alert ingestion: 30 req/min per IP
- Auth endpoints: 10 req/15min per IP

### Error Handling
All API routes follow this pattern:
1. Check rate limit
2. Validate authentication
3. Check RBAC permissions
4. Validate request body with Zod
5. Execute business logic
6. Return typed response or error with appropriate HTTP status code
7. Capture unexpected errors with Sentry

## AI Integration

### Severity Classification Flow
1. User submits incident with title and description
2. API sends to `classifySeverity(title, description)`
3. OpenAI GPT-4o-mini classifies as P0/P1/P2/P3
4. Returns suggestion stored as `ai_severity_suggestion`
5. User can override with manual severity selection
6. On failure: 3 retries with exponential backoff, fallback to P2

### Post-Mortem Generation Flow
1. User triggers "Generate Post-Mortem" on a resolved incident
2. API fetches full incident with all timeline updates
3. Sends context to `generatePostmortem(incidentContext)`
4. OpenAI GPT-4o generates comprehensive post-mortem markdown
5. Stored in `postmortems` table as draft
6. User can edit and publish

## Security

### Authentication
- Supabase handles all auth token management
- Cookies are httpOnly and secure in production
- Middleware refreshes sessions on every protected route

### Authorization
- RLS at database level: impossible to access other orgs' data
- API-level role checks: admin/responder/viewer enforced per endpoint
- Webhook: Stripe signature verification before processing any events

### Rate Limiting
- Per-IP sliding window on all API endpoints
- Stricter limits on auth endpoints to prevent brute force

### Input Validation
- All API inputs validated with Zod schemas before processing
- SQL injection impossible via Supabase's parameterized queries

## Deployment

### Vercel
- Automatic HTTPS, global CDN
- Preview deployments for every PR
- Edge middleware runs at every Vercel PoP
- Region: `iad1` (US East) by default

### Environment Variables
See `.env.example` for all required environment variables.

### Database Migrations
Run against Supabase via `supabase db push` or directly via the Supabase dashboard SQL editor.