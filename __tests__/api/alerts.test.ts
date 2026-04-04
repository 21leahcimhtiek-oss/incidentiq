import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(),
}))
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, limit: 30, remaining: 29, reset: 0 }),
}))
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

import { POST } from '@/app/api/alerts/route'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const mockSupabase = {
  from: jest.fn(),
}
const mockFrom = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createServiceClient as jest.Mock).mockReturnValue(mockSupabase)
  mockSupabase.from.mockReturnValue(mockFrom)
})

describe('POST /api/alerts', () => {
  it('returns 429 when rate limited', async () => {
    ;(checkRateLimit as jest.Mock).mockResolvedValueOnce({ success: false, limit: 30, remaining: 0, reset: Date.now() + 60000 })
    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ source: 'datadog', org_id: 'org-1', api_key: 'key' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(429)
  })

  it('returns 400 for invalid payload', async () => {
    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ source: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('creates alert for valid payload', async () => {
    mockFrom.single
      .mockResolvedValueOnce({ data: { id: 'org-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'alert-1', source: 'datadog', severity: 'P1', status: 'open', created_at: new Date().toISOString() }, error: null })
    mockFrom.insert.mockReturnThis()

    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      body: JSON.stringify({
        source: 'datadog',
        org_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        api_key: 'test-key',
        severity: 'P1',
        payload: { alert: 'High error rate', threshold: 5 },
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})