'use client'

import { useState, useEffect } from 'react'

interface OnCallSchedule {
  id: string
  start_at: string
  end_at: string
  rotation_type: string
  users: { email: string } | null
}

export function OnCallWidget() {
  const [oncall, setOncall] = useState<OnCallSchedule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/oncall')
      .then(r => r.json())
      .then(({ oncall }) => { setOncall(oncall); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Currently On-Call</h2>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : oncall ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-semibold">{oncall.users?.email?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{oncall.users?.email}</p>
              <p className="text-xs text-gray-500">On-call now</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-700">
              Until {new Date(oncall.end_at).toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-gray-500 text-sm">No one is on-call</p>
          <p className="text-gray-400 text-xs mt-1">Configure on-call schedules</p>
        </div>
      )}
    </div>
  )
}