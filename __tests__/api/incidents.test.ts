import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))
jest.mock('@/lib/openai/classify-severity', () => ({
  classifySeverity: jest.fn().mockResolvedValue('P2'),
}))
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: 0 }),
}))
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

import { GET, POST } from '@/app/api/incidents/route'
import { createClient } from '@/lib/supabase/server'

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
}

const mockFrom = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
  in: jest.fn().mockReturnThis(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  mockSupabase.from.mockReturnValue(mockFrom)
})

describe('GET /api/incidents', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const request = new NextRequest('http://localhost:3000/api/incidents')
    const response = await GET(request)
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns incidents for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.single.mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
    mockFrom.range.mockResolvedValueOnce({
      data: [{ id: 'inc-1', title: 'Test Incident', severity: 'P2', status: 'open', created_at: new Date().toISOString() }],
      count: 1,
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/incidents')
    const response = await GET(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.incidents).toHaveLength(1)
    expect(body.pagination.total).toBe(1)
  })
})

describe('POST /api/incidents', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const request = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', description: 'Test description' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 for missing title', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.single.mockResolvedValueOnce({ data: { org_id: 'org-1', role: 'admin' }, error: null })
    const request = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      body: JSON.stringify({ description: 'No title' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('creates incident with AI severity suggestion', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.single
      .mockResolvedValueOnce({ data: { org_id: 'org-1', role: 'admin' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'inc-1', title: 'API down', severity: 'P2', ai_severity_suggestion: 'P2', status: 'open', created_at: new Date().toISOString() }, error: null })
    mockFrom.insert.mockReturnThis()

    const request = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      body: JSON.stringify({ title: 'API down', description: 'Service is unavailable' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.incident.title).toBe('API down')
  })

  it('returns 403 for viewer role', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.single.mockResolvedValueOnce({ data: { org_id: 'org-1', role: 'viewer' }, error: null })
    const request = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', description: 'Test' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
  })
})