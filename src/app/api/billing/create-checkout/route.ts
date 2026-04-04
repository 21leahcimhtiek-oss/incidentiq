import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe/client'
import * as Sentry from '@sentry/nextjs'

const CheckoutSchema = z.object({
  plan: z.enum(['starter', 'pro']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const { data: org } = await supabase.from('orgs').select('*').eq('id', profile.org_id).single()
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const body = await request.json()
    const parsed = CheckoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const plan = PLANS[parsed.data.plan]
    let customerId = org.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { org_id: org.id, org_slug: org.slug },
      })
      customerId = customer.id
      await supabase.from('orgs').update({ stripe_customer_id: customerId }).eq('id', org.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: { org_id: org.id, plan: parsed.data.plan },
      subscription_data: { metadata: { org_id: org.id, plan: parsed.data.plan } },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}