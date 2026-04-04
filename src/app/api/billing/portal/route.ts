import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import * as Sentry from '@sentry/nextjs'

export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const { data: org } = await supabase.from('orgs').select('stripe_customer_id').eq('id', profile.org_id).single()
    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}