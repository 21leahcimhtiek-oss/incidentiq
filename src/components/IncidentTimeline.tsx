'use client'

import { useState } from 'react'

interface Update {
  id: string
  message: string
  created_at: string
  users?: { email: string } | null
}

interface IncidentTimelineProps {
  incidentId: string
  updates: Update[]
  canPost: boolean
  currentUserId: string
}

export function IncidentTimeline({ incidentId, updates: initialUpdates, canPost }: IncidentTimelineProps) {
  const [updates, setUpdates] = useState(initialUpdates)
  const [message, setMessage] = useState('')
  const [posting, setPosting] = useState(false)

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setPosting(true)

    const res = await fetch(`/api/incidents/${incidentId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (res.ok) {
      const { update } = await res.json()
      setUpdates(prev => [...prev, update])
      setMessage('')
    }
    setPosting(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Timeline</h2>

      <div className="space-y-4 mb-6">
        {updates.map((update, idx) => (
          <div key={update.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-medium flex-shrink-0">
                {update.users?.email?.[0]?.toUpperCase() || 'S'}
              </div>
              {idx < updates.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">{update.users?.email || 'System'}</span>
                <span className="text-xs text-gray-500">{timeAgo(update.created_at)}</span>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{update.message}</p>
            </div>
          </div>
        ))}
        {updates.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No updates yet</p>
        )}
      </div>

      {canPost && (
        <form onSubmit={handlePost} className="border-t border-gray-100 pt-4">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add an update..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={posting || !message.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {posting ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}