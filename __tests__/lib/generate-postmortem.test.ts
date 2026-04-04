jest.mock('openai')
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

import { generatePostmortem } from '@/lib/openai/generate-postmortem'
import OpenAI from 'openai'

const mockCreate = jest.fn()
;(OpenAI as jest.Mock).mockImplementation(() => ({
  chat: { completions: { create: mockCreate } },
}))

const sampleIncident = {
  title: 'API gateway timeout',
  description: 'All API requests timing out after 30s',
  severity: 'P1',
  status: 'resolved',
  createdAt: '2024-01-15T10:00:00Z',
  resolvedAt: '2024-01-15T12:30:00Z',
  updates: [
    { message: 'Incident created', createdAt: '2024-01-15T10:00:00Z', userEmail: 'alice@acme.com' },
    { message: 'Identified as upstream provider issue', createdAt: '2024-01-15T10:30:00Z', userEmail: 'bob@acme.com' },
    { message: 'Failover initiated', createdAt: '2024-01-15T11:00:00Z', userEmail: 'alice@acme.com' },
    { message: 'All services restored', createdAt: '2024-01-15T12:30:00Z', userEmail: 'alice@acme.com' },
  ],
}

describe('generatePostmortem', () => {
  beforeEach(() => jest.clearAllMocks())

  it('generates postmortem from incident data', async () => {
    const mockContent = '# Post-Mortem: API gateway timeout\n\n## Summary\nThe API gateway experienced timeouts.'
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: mockContent } }],
    })
    const result = await generatePostmortem(sampleIncident)
    expect(result).toBe(mockContent)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o',
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('API gateway timeout') }),
      ]),
    }))
  })

  it('returns fallback postmortem after 3 failed attempts', async () => {
    mockCreate.mockRejectedValue(new Error('OpenAI error'))
    const result = await generatePostmortem(sampleIncident)
    expect(result).toContain('# Post-Mortem: API gateway timeout')
    expect(result).toContain('could not be generated automatically')
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('includes timeline updates in the prompt', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '# Post-Mortem' } }],
    })
    await generatePostmortem(sampleIncident)
    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string; content: string }) => m.role === 'user').content
    expect(userMessage).toContain('alice@acme.com')
    expect(userMessage).toContain('Failover initiated')
  })

  it('handles incident with no updates', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '# Post-Mortem\nNo updates.' } }],
    })
    const incidentNoUpdates = { ...sampleIncident, updates: [] }
    const result = await generatePostmortem(incidentNoUpdates)
    expect(result).toBeTruthy()
  })
})