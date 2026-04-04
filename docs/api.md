# IncidentIQ API Documentation

## Base URL

```
https://incidentiq.vercel.app/api
```

## Authentication

All API endpoints (except `/api/v1/alerts`) require authentication via Supabase session cookies. For programmatic access, include your session token in the `Authorization` header.

## Rate Limits

| Endpoint Group | Limit |
|---------------|-------|
| General API | 100 req/min per IP |
| Alert Ingestion | 30 req/min per IP |
| Auth Endpoints | 10 req/15min per IP |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Incidents

### List Incidents

```
GET /api/incidents
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: `open`, `investigating`, `resolved`, `closed` |
| severity | string | Filter by severity: `P0`, `P1`, `P2`, `P3` |
| page | integer | Page number (default: 1) |
| limit | integer | Results per page (default: 20, max: 100) |

**Response:**
```json
{
  "incidents": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Create Incident

```
POST /api/incidents
```

**Request Body:**
```json
{
  "title": "string (required, max 255 chars)",
  "description": "string (optional, max 10000 chars)",
  "severity": "P0 | P1 | P2 | P3 (optional — AI classifies if not provided)",
  "assigned_to": "UUID (optional)"
}
```

**Response (201):**
```json
{
  "incident": {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "severity": "P0 | P1 | P2 | P3",
    "ai_severity_suggestion": "P0 | P1 | P2 | P3",
    "status": "open",
    "org_id": "uuid",
    "created_at": "ISO 8601 timestamp"
  }
}
```

### Get Incident

```
GET /api/incidents/:id
```

Returns full incident with timeline updates and assigned user.

### Update Incident

```
PATCH /api/incidents/:id
```

**Request Body** (all fields optional):
```json
{
  "title": "string",
  "description": "string",
  "severity": "P0 | P1 | P2 | P3",
  "status": "open | investigating | resolved | closed",
  "assigned_to": "UUID | null"
}
```

### Delete Incident

```
DELETE /api/incidents/:id
```

Requires `admin` role.

## Incident Updates

### List Updates

```
GET /api/incidents/:id/updates
```

### Add Update

```
POST /api/incidents/:id/updates
```

**Request Body:**
```json
{
  "message": "string (required, max 5000 chars)"
}
```

## Post-Mortems

### Get Post-Mortem

```
GET /api/incidents/:id/postmortem
```

### Generate or Update Post-Mortem

```
POST /api/incidents/:id/postmortem
```

**To generate with AI** (send empty body):
```json
{}
```

**To save manually:**
```json
{
  "content_md": "# Post-Mortem\n...",
  "published": false
}
```

## Alert Ingestion

External systems can push alerts to IncidentIQ via this endpoint. No user authentication required — identify your org with `org_id`.

### Ingest Alert

```
POST /api/alerts
```

**Request Body:**
```json
{
  "source": "string (e.g., 'datadog', 'pagerduty', 'custom')",
  "org_id": "UUID of your organization",
  "api_key": "your API key",
  "severity": "P0 | P1 | P2 | P3 (optional)",
  "payload": {
    "alert_name": "High error rate",
    "threshold": 5,
    "current_value": 12.5
  }
}
```

**Response (201):**
```json
{
  "alert": {
    "id": "uuid",
    "source": "datadog",
    "severity": "P1",
    "status": "open",
    "created_at": "ISO 8601"
  },
  "message": "Alert ingested successfully"
}
```

## On-Call

### Get Current On-Call

```
GET /api/oncall
```

Returns the user currently on-call for the authenticated org.

## Billing

### Create Checkout Session

```
POST /api/billing/create-checkout
```

**Request Body:**
```json
{
  "plan": "starter | pro"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### Open Billing Portal

```
POST /api/billing/portal
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "details": { }
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — not authenticated |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |