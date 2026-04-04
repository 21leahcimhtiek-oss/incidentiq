'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  user: { email?: string } | null
  profile: { role: string; orgs?: { name: string; plan: string } } | null
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/incidents', label: 'Incidents', icon: '🚨' },
  { href: '/postmortems', label: 'Post-Mortems', icon: '📄' },
  { href: '/oncall', label: 'On-Call', icon: '📟' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/billing', label: 'Billing', icon: '💳' },
]

export function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IQ</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">IncidentIQ</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.orgs?.plan || 'starter'} plan</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">{user?.email?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}