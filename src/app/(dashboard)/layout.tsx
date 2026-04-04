import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, orgs(*)')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} profile={profile} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}