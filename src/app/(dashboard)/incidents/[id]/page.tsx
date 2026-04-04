import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IncidentTimeline } from '@/components/IncidentTimeline'
import { SeverityBadge } from '@/components/SeverityBadge'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()

  const { data: incident, error } = await supabase
    .from('incidents')
    .select('*, users!assigned_to(id, email), incident_updates(*, users(id, email))')
    .eq('id', params.id)
    .eq('org_id', profile?.org_id)
    .single()

  if (error || !incident) notFound()

  const { data: postmortem } = await supabase
    .from('postmortems')
    .select('id, published, ai_generated')
    .eq('incident_id', params.id)
    .maybeSingle()

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    investigating: 'bg-orange-100 text-orange-700',
    resolved: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/incidents" className="text-blue-600 hover:underline text-sm">← Back to incidents</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <SeverityBadge severity={incident.severity} />
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
              {incident.status}
            </span>
          </div>
          <div className="flex gap-2">
            {profile?.role !== 'viewer' && !postmortem && (
              <button
                onClick={async () => {
                  await fetch(`/api/incidents/${params.id}/postmortem`, { method: 'POST' })
                  window.location.href = `/postmortems?incident=${params.id}`
                }}
                className="border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Generate Post-Mortem
              </button>
            )}
            {postmortem && (
              <Link href={`/postmortems/${postmortem.id}`} className="border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                View Post-Mortem
              </Link>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{incident.title}</h1>
        {incident.description && (
          <p className="text-gray-600 mb-4">{incident.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900">{new Date(incident.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">AI Suggestion</p>
            <p className="text-sm font-medium text-gray-900">{incident.ai_severity_suggestion || 'None'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Assigned To</p>
            <p className="text-sm font-medium text-gray-900">{incident.users?.email || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Resolved At</p>
            <p className="text-sm font-medium text-gray-900">{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : 'Ongoing'}</p>
          </div>
        </div>
      </div>

      <IncidentTimeline
        incidentId={incident.id}
        updates={incident.incident_updates || []}
        canPost={profile?.role !== 'viewer'}
        currentUserId={user.id}
      />
    </div>
  )
}