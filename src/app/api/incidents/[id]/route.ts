import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const UpdateIncidentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
})

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: incident, error } = await supabase
      .from('incidents')
      .select('*, users!assigned_to(id, email), incident_updates(*, users(id, email))')
      .eq('id', params.id)
      .single()

    if (error || !incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ incident })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const parsed = UpdateIncidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const updates: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.status === 'resolved' || parsed.data.status === 'closed') {
      updates.resolved_at = new Date().toISOString()
    }

    const { data: incident, error } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !incident) return NextResponse.json({ error: 'Not found or update failed' }, { status: 404 })

    if (parsed.data.status) {
      await supabase.from('incident_updates').insert({
        incident_id: params.id,
        user_id: user.id,
        message: `Status changed to ${parsed.data.status}.`,
      })
    }

    return NextResponse.json({ incident })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const { error } = await supabase.from('incidents').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}