'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewIncidentPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const response = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, ...(severity && { severity }) }),
    })

    if (!response.ok) {
      const data = await response.json()
      setError(data.error || 'Failed to create incident')
      setLoading(false)
      return
    }

    const { incident } = await response.json()
    router.push(`/incidents/${incident.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Incident</h1>
        <p className="text-gray-600">AI will automatically classify severity if not specified</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., API gateway returning 503 errors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what is happening, what services are affected, and any error messages..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity <span className="text-gray-400 font-normal">(optional — AI will classify if not set)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'P0', label: 'P0', desc: 'Critical', color: 'border-red-300 bg-red-50 text-red-700' },
                { value: 'P1', label: 'P1', desc: 'High', color: 'border-orange-300 bg-orange-50 text-orange-700' },
                { value: 'P2', label: 'P2', desc: 'Medium', color: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
                { value: 'P3', label: 'P3', desc: 'Low', color: 'border-green-300 bg-green-50 text-green-700' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(severity === opt.value ? '' : opt.value)}
                  className={`border-2 rounded-lg p-3 text-center transition-all ${
                    severity === opt.value
                      ? opt.color + ' border-2'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-xs">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}