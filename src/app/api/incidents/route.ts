import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { classifySeverity } from '@/lib/openai/classify-severity'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const CreateIncidentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(10000).optional(),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  assigned_to: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

    let query = supabase
      .from('incidents')
      .select('*, users!assigned_to(id, email)', { count: 'exact' })
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (severity) query = query.eq('severity', severity)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({
      incidents: data,
      pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await checkRateLimit('api', ip)
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (!['admin', 'responder'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = CreateIncidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const { title, description, severity, assigned_to } = parsed.data
    const aiSuggestion = await classifySeverity(title, description || '')

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        org_id: profile.org_id,
        title,
        description: description || null,
        severity: severity || aiSuggestion,
        ai_severity_suggestion: aiSuggestion,
        assigned_to: assigned_to || null,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('incident_updates').insert({
      incident_id: incident.id,
      user_id: user.id,
      message: `Incident created with severity ${incident.severity}. AI suggested: ${aiSuggestion}.`,
    })

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}