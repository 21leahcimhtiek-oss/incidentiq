'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Incident {
  severity: string | null
  created_at: string
  resolved_at: string | null
}

interface MTTRChartProps {
  incidents: Incident[]
}

export function MTTRChart({ incidents }: MTTRChartProps) {
  const severities = ['P0', 'P1', 'P2', 'P3']

  const data = severities.map(severity => {
    const resolved = incidents.filter(i => i.severity === severity && i.resolved_at)
    const avgMinutes = resolved.length > 0
      ? Math.round(resolved.reduce((sum, i) => {
          return sum + (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()) / 60000
        }, 0) / resolved.length)
      : 0

    return {
      severity,
      'MTTR (min)': avgMinutes,
      count: resolved.length,
    }
  })

  if (incidents.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>No resolved incidents yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="severity" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fontSize: 12 }} />
        <Tooltip formatter={(value) => [`${value} min`, 'Avg MTTR']} />
        <Bar dataKey="MTTR (min)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}