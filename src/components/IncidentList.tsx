import { IncidentCard } from './IncidentCard'

interface Incident {
  id: string
  title: string
  severity: string | null
  status: string
  created_at: string
  resolved_at: string | null
  users?: { email: string } | null
}

interface IncidentListProps {
  incidents: Incident[]
}

export function IncidentList({ incidents }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-4xl mb-4">🎉</div>
        <p className="text-lg font-medium text-gray-900">No incidents</p>
        <p className="text-gray-500 mt-1">Everything looks good!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {incidents.map(incident => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  )
}