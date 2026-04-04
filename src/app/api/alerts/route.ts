import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const AlertSchema = z.object({
  source: z.string().min(1).max(100),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  payload: z.record(z.unknown()).optional().default({}),
  org_id: z.string().uuid(),
  api_key: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const { success, limit, remaining, reset } = await checkRateLimit('alerts', ip)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          }
        }
      )
    }

    const body = await request.json()
    const parsed = AlertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    
    const { data: org } = await supabase
      .from('orgs')
      .select('id')
      .eq('id', parsed.data.org_id)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        org_id: parsed.data.org_id,
        source: parsed.data.source,
        payload: parsed.data.payload,
        severity: parsed.data.severity || null,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ alert, message: 'Alert ingested successfully' }, { status: 201 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}