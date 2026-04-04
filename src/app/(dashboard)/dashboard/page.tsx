import { createClient } from '@/lib/supabase/server'
import { MTTRChart } from '@/components/MTTRChart'
import { OnCallWidget } from '@/components/OnCallWidget'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const [incidentStats, openIncidents] = await Promise.all([
    supabase.from('incidents')
      .select('severity, status, created_at, resolved_at')
      .eq('org_id', profile?.org_id)
      .not('resolved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('incidents')
      .select('id, title, severity, status, created_at')
      .eq('org_id', profile?.org_id)
      .in('status', ['open', 'investigating'])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const stats = {
    total: incidentStats.data?.length ?? 0,
    p0: incidentStats.data?.filter(i => i.severity === 'P0').length ?? 0,
    p1: incidentStats.data?.filter(i => i.severity === 'P1').length ?? 0,
    open: openIncidents.data?.length ?? 0,
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Incident metrics and team performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Resolved', value: stats.total, color: 'text-gray-900' },
          { label: 'P0 Incidents', value: stats.p0, color: 'text-red-600' },
          { label: 'P1 Incidents', value: stats.p1, color: 'text-orange-600' },
          { label: 'Currently Open', value: stats.open, color: 'text-blue-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">MTTR by Severity</h2>
          <MTTRChart incidents={incidentStats.data ?? []} />
        </div>
        <div>
          <OnCallWidget />
        </div>
      </div>

      {openIncidents.data && openIncidents.data.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Incidents</h2>
          <div className="space-y-3">
            {openIncidents.data.map(incident => (
              <Link key={incident.id} href={`/incidents/${incident.id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    incident.severity === 'P0' ? 'bg-red-100 text-red-700' :
                    incident.severity === 'P1' ? 'bg-orange-100 text-orange-700' :
                    incident.severity === 'P2' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{incident.severity}</span>
                  <span className="text-gray-900 font-medium">{incident.title}</span>
                </div>
                <span className="text-xs text-gray-500">{new Date(incident.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}