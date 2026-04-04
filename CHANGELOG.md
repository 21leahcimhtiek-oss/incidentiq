# Changelog

All notable changes to IncidentIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Initial production release of IncidentIQ
- Supabase authentication (email/password) with org creation on signup
- Organization-based multi-tenancy with full RLS enforcement
- RBAC system: admin, responder, viewer roles
- Incident management: create, read, update, delete incidents
- AI severity classification using OpenAI GPT-4o-mini (P0-P3)
- Real-time incident timeline with updates feed
- On-call schedule management with current on-call display
- AI post-mortem generation using OpenAI GPT-4o
- Post-mortem editor with draft/publish workflow
- MTTR analytics dashboard with Recharts bar charts
- Alert ingestion REST API for external tools
- Stripe subscription billing (Starter: $49/mo, Pro: $149/mo)
- Stripe Customer Portal for self-service subscription management
- Team invitation system with role assignment
- Rate limiting via Upstash Redis (sliding window)
- Error tracking via Sentry (client + server + edge)
- Complete database migration with 8 tables and RLS policies
- Jest unit tests for API routes and AI functions
- Playwright E2E tests for critical user flows
- GitHub Actions CI/CD pipeline (lint -> typecheck -> test -> build -> e2e)
- Comprehensive API documentation
- Architecture documentation
- Security audit
- Docker support for self-hosting
- Vercel deployment configuration

### Security
- Row Level Security on all database tables
- Stripe webhook signature verification
- Input validation with Zod on all API endpoints
- Rate limiting on all public endpoints
- No secrets committed to repository