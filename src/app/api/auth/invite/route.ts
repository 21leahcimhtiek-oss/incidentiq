import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'responder', 'viewer']).default('viewer'),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await checkRateLimit('auth', ip)
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data: orgData } = await serviceClient.from('orgs').select('plan').eq('id', profile.org_id).single()
    
    if (orgData?.plan === 'starter') {
      const { count } = await serviceClient.from('users').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id)
      if ((count ?? 0) >= 5) {
        return NextResponse.json({ error: 'User limit reached for Starter plan. Upgrade to Pro for unlimited users.' }, { status: 403 })
      }
    }

    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { org_id: profile.org_id, role: parsed.data.role },
    })

    if (inviteError) throw inviteError

    await serviceClient.from('users').insert({
      id: inviteData.user.id,
      org_id: profile.org_id,
      email: parsed.data.email,
      role: parsed.data.role,
    })

    return NextResponse.json({ message: 'Invitation sent', user: inviteData.user }, { status: 201 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}