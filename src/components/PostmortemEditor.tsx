'use client'

import { useState } from 'react'

interface Postmortem {
  id: string
  incident_id: string
  content_md: string
  ai_generated: boolean
  published: boolean
  incidents?: {
    title: string
    severity: string
    created_at: string
    resolved_at: string | null
  } | null
}

interface PostmortemEditorProps {
  postmortem: Postmortem
  canEdit: boolean
}

export function PostmortemEditor({ postmortem, canEdit }: PostmortemEditorProps) {
  const [content, setContent] = useState(postmortem.content_md)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/incidents/${postmortem.incident_id}/postmortem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_md: content }),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  async function handlePublish() {
    setSaving(true)
    await fetch(`/api/incidents/${postmortem.incident_id}/postmortem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_md: content, published: true }),
    })
    setSaving(false)
    window.location.reload()
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post-Mortem</h1>
          <p className="text-gray-600">{postmortem.incidents?.title}</p>
          <div className="flex gap-2 mt-2">
            {postmortem.ai_generated && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">AI-generated</span>
            )}
            {postmortem.published && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Published</span>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Draft'}
            </button>
            {!postmortem.published && (
              <button onClick={handlePublish} disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                Publish
              </button>
            )}
          </div>
        )}
      </div>

      {canEdit ? (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full h-[calc(100vh-300px)] px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Post-mortem content in Markdown..."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-800">{content}</pre>
        </div>
      )}
    </div>
  )
}