'use client'

import { useState } from 'react'

interface BillingPlansProps {
  currentPlan?: string
  showActions?: boolean
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'For small teams getting started',
    features: ['5 users', '100 incidents/month', 'AI severity classification', 'Basic post-mortems', 'Email notifications'],
    cta: 'Start with Starter',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$149',
    period: '/month',
    description: 'For growing engineering teams',
    features: ['Unlimited users', 'Unlimited incidents', 'AI post-mortem generation', 'Advanced analytics', 'Slack & PagerDuty', 'On-call scheduling', 'Priority support'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: ['Everything in Pro', 'SSO/SAML', 'Custom integrations', 'SLA guarantees', 'Dedicated support', 'Audit logs'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export function BillingPlans({ currentPlan, showActions = true }: BillingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSelectPlan(planId: string) {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@incidentiq.app?subject=Enterprise Plan'
      return
    }
    setLoading(planId)
    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(null)
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {PLANS.map(plan => (
        <div
          key={plan.id}
          className={`rounded-xl border p-8 relative ${plan.highlight ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}
        >
          {plan.highlight && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </div>
          )}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-gray-500">{plan.period}</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {plan.features.map(feature => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500 flex-shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          {showActions && (
            <button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={currentPlan === plan.id || loading === plan.id}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                currentPlan === plan.id
                  ? 'bg-gray-100 text-gray-500 cursor-default'
                  : plan.highlight
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              {currentPlan === plan.id ? 'Current Plan' : loading === plan.id ? 'Loading...' : plan.cta}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}