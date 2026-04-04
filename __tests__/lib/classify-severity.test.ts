jest.mock('openai')
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

import { classifySeverity } from '@/lib/openai/classify-severity'
import OpenAI from 'openai'

const mockCreate = jest.fn()
;(OpenAI as jest.Mock).mockImplementation(() => ({
  chat: { completions: { create: mockCreate } },
}))

describe('classifySeverity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('classifies P0 for critical outage', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'P0' } }],
    })
    const result = await classifySeverity('Complete database outage', 'All writes failing, data loss possible')
    expect(result).toBe('P0')
  })

  it('classifies P3 for minor issue', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'P3' } }],
    })
    const result = await classifySeverity('Button misaligned on mobile', 'Minor UI issue')
    expect(result).toBe('P3')
  })

  it('falls back to P2 after 3 failed attempts', async () => {
    mockCreate.mockRejectedValue(new Error('OpenAI API error'))
    const result = await classifySeverity('Some incident', 'Some description')
    expect(result).toBe('P2')
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('handles invalid OpenAI response with fallback', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'INVALID_SEVERITY' } }],
    })
    const result = await classifySeverity('Test incident', 'Description')
    expect(result).toBe('P2')
  })

  it('handles empty response with fallback', async () => {
    mockCreate.mockResolvedValue({ choices: [] })
    const result = await classifySeverity('Test', 'Test')
    expect(result).toBe('P2')
  })
})