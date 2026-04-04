import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const CreateUpdateSchema = z.object({
  message: z.string().min(1).max(5000),
})

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: updates, error } = await supabase
      .from('incident_updates')
      .select('*, users(id, email)')
      .eq('incident_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ updates })
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

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'responder'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = CreateUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const { data: update, error } = await supabase
      .from('incident_updates')
      .insert({ incident_id: params.id, user_id: user.id, message: parsed.data.message })
      .select('*, users(id, email)')
      .single()

    if (error) throw error
    return NextResponse.json({ update }, { status: 201 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}