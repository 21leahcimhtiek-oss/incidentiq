import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PostmortemsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data: postmortems } = await supabase
    .from('postmortems')
    .select('*, incidents(title, severity)')
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post-Mortems</h1>
        <p className="text-gray-600">{postmortems?.length ?? 0} post-mortems</p>
      </div>
      <div className="space-y-4">
        {postmortems?.map(pm => (
          <Link key={pm.id} href={`/postmortems/${pm.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{pm.incidents?.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(pm.created_at).toLocaleDateString()} · {pm.ai_generated ? 'AI-generated' : 'Manual'} · {pm.published ? 'Published' : 'Draft'}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                pm.incidents?.severity === 'P0' ? 'bg-red-100 text-red-700' :
                pm.incidents?.severity === 'P1' ? 'bg-orange-100 text-orange-700' :
                pm.incidents?.severity === 'P2' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>{pm.incidents?.severity}</span>
            </div>
          </Link>
        ))}
        {(!postmortems || postmortems.length === 0) && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No post-mortems yet</p>
            <p className="text-sm mt-2">Resolve an incident and generate a post-mortem to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}