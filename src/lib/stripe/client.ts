import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    price: 49,
    limits: {
      users: 5,
      incidentsPerMonth: 100,
    },
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 149,
    limits: {
      users: -1,
      incidentsPerMonth: -1,
    },
  },
} as const

export type PlanId = keyof typeof PLANS