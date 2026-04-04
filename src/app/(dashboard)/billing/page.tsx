import { createClient } from '@/lib/supabase/server'
import { BillingPlans } from '@/components/BillingPlans'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  const { data: org } = await supabase
    .from('orgs')
    .select('plan, stripe_subscription_id')
    .eq('id', profile?.org_id)
    .single()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600">Manage your subscription</p>
      </div>

      {searchParams.success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
          🎉 Subscription activated! Welcome to the team.
        </div>
      )}
      {searchParams.canceled && (
        <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-6">
          Checkout was canceled. Your plan has not changed.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Current plan</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{org?.plan || 'Starter'}</p>
          </div>
          {org?.stripe_subscription_id && profile?.role === 'admin' && (
            <form action="/api/billing/portal" method="POST">
              <button
                type="submit"
                className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Subscription
              </button>
            </form>
          )}
        </div>
      </div>

      <BillingPlans currentPlan={org?.plan} showActions={profile?.role === 'admin'} />
    </div>
  )
}