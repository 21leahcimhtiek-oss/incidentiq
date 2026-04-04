import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostmortemEditor } from '@/components/PostmortemEditor'

export default async function PostmortemDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  const { data: postmortem, error } = await supabase
    .from('postmortems')
    .select('*, incidents(title, severity, created_at, resolved_at)')
    .eq('id', params.id)
    .eq('org_id', profile?.org_id)
    .single()
  if (error || !postmortem) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <PostmortemEditor postmortem={postmortem} canEdit={profile?.role !== 'viewer'} />
    </div>
  )
}