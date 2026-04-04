import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IncidentList } from '@/components/IncidentList'

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: { status?: string; severity?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()

  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('incidents')
    .select('*, users!assigned_to(id, email)', { count: 'exact' })
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.severity) query = query.eq('severity', searchParams.severity)

  const { data: incidents, count } = await query

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600">{count ?? 0} total incidents</p>
        </div>
        {profile?.role !== 'viewer' && (
          <Link href="/incidents/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            + New Incident
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        {(['', 'open', 'investigating', 'resolved', 'closed'] as const).map(status => (
          <Link
            key={status || 'all'}
            href={status ? `?status=${status}` : '/incidents'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              (searchParams.status || '') === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
          </Link>
        ))}
      </div>

      <IncidentList incidents={incidents ?? []} />

      {count && count > limit && (
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <Link href={`?page=${page - 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Previous
            </Link>
          )}
          {page * limit < count && (
            <Link href={`?page=${page + 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}