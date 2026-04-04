import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generatePostmortem } from '@/lib/openai/generate-postmortem'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const UpdatePostmortemSchema = z.object({
  content_md: z.string().min(1),
  published: z.boolean().optional(),
})

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: postmortem, error } = await supabase
      .from('postmortems')
      .select('*')
      .eq('incident_id', params.id)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ postmortem })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await checkRateLimit('api', ip)
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
    if (!profile || !['admin', 'responder'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const isManualUpdate = UpdatePostmortemSchema.safeParse(body)
    
    if (isManualUpdate.success) {
      const { data: existing } = await supabase.from('postmortems').select('id').eq('incident_id', params.id).maybeSingle()
      let postmortem
      if (existing) {
        const { data } = await supabase.from('postmortems').update(isManualUpdate.data).eq('incident_id', params.id).select().single()
        postmortem = data
      } else {
        const { data } = await supabase.from('postmortems').insert({ incident_id: params.id, org_id: profile.org_id, ...isManualUpdate.data }).select().single()
        postmortem = data
      }
      return NextResponse.json({ postmortem })
    }

    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('*, incident_updates(*, users(email))')
      .eq('id', params.id)
      .single()

    if (incidentError || !incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

    const content = await generatePostmortem({
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.created_at,
      resolvedAt: incident.resolved_at,
      updates: (incident.incident_updates || []).map((u: { message: string; created_at: string; users?: { email: string } | null }) => ({
        message: u.message,
        createdAt: u.created_at,
        userEmail: u.users?.email,
      })),
    })

    const { data: existing } = await supabase.from('postmortems').select('id').eq('incident_id', params.id).maybeSingle()
    let postmortem
    if (existing) {
      const { data } = await supabase.from('postmortems').update({ content_md: content, ai_generated: true }).eq('incident_id', params.id).select().single()
      postmortem = data
    } else {
      const { data } = await supabase.from('postmortems').insert({ incident_id: params.id, org_id: profile.org_id, content_md: content, ai_generated: true }).select().single()
      postmortem = data
    }

    return NextResponse.json({ postmortem }, { status: 201 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}