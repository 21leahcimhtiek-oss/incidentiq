import { createClient } from '@/lib/supabase/server'
import { OnCallWidget } from '@/components/OnCallWidget'

export default async function OnCallPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  const now = new Date().toISOString()
  const { data: schedules } = await supabase
    .from('oncall_schedules')
    .select('*, users(id, email)')
    .eq('org_id', profile?.org_id)
    .order('start_at', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">On-Call Schedule</h1>
          <p className="text-gray-600">Manage rotation and view current on-call</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Responder</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Start</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">End</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules?.map(s => {
                  const isActive = s.start_at <= now && s.end_at >= now
                  return (
                    <tr key={s.id} className={isActive ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-900">{s.users?.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.start_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.end_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.rotation_type}</td>
                      <td className="px-4 py-3">
                        {isActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>}
                      </td>
                    </tr>
                  )
                })}
                {(!schedules || schedules.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No schedules configured</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <OnCallWidget />
      </div>
    </div>
  )
}