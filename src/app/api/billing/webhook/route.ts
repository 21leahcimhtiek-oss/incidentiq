import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        const orgId = session.metadata?.org_id
        const plan = session.metadata?.plan
        if (orgId && plan) {
          await supabase.from('orgs').update({
            plan,
            stripe_subscription_id: session.subscription as string,
          }).eq('id', orgId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.org_id
        const plan = subscription.metadata?.plan
        if (orgId) {
          await supabase.from('orgs').update({
            plan: plan || 'starter',
            stripe_subscription_id: subscription.id,
          }).eq('id', orgId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.org_id
        if (orgId) {
          await supabase.from('orgs').update({
            plan: 'starter',
            stripe_subscription_id: null,
          }).eq('id', orgId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        if (customerId) {
          await supabase.from('orgs').update({ plan: 'starter' }).eq('stripe_customer_id', customerId)
        }
        break
      }
    }
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

export const runtime = 'nodejs'