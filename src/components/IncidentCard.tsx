import Link from 'next/link'
import { SeverityBadge } from './SeverityBadge'

interface Incident {
  id: string
  title: string
  severity: string | null
  status: string
  created_at: string
  resolved_at: string | null
  users?: { email: string } | null
}

interface IncidentCardProps {
  incident: Incident
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-orange-100 text-orange-700',
  resolved: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-700',
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const duration = incident.resolved_at
    ? Math.round((new Date(incident.resolved_at).getTime() - new Date(incident.created_at).getTime()) / 60000)
    : null

  return (
    <Link href={`/incidents/${incident.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={incident.severity} size="sm" />
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[incident.status] || 'bg-gray-100 text-gray-700'}`}>
              {incident.status}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{incident.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{new Date(incident.created_at).toLocaleString()}</span>
            {incident.users && <span>Assigned to {incident.users.email}</span>}
            {duration !== null && <span>Resolved in {duration}m</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}