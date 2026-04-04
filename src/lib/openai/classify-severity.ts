import OpenAI from 'openai'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SeveritySchema = z.enum(['P0', 'P1', 'P2', 'P3'])
type Severity = z.infer<typeof SeveritySchema>

const SEVERITY_PROMPT = `You are an incident severity classifier for a software engineering team.
Classify the incident severity based on the title and description.

Severity levels:
- P0: Complete service outage, data loss, security breach, revenue-critical system down
- P1: Major feature broken, significant user impact, degraded performance for majority of users
- P2: Partial service degradation, workaround available, moderate user impact
- P3: Minor issue, cosmetic bug, low user impact, non-urgent

Respond with ONLY one of: P0, P1, P2, P3`

async function attemptClassification(title: string, description: string): Promise<Severity> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SEVERITY_PROMPT },
      { role: 'user', content: `Title: ${title}\nDescription: ${description || 'No description provided'}` },
    ],
    max_tokens: 10,
    temperature: 0,
  })

  const result = response.choices[0]?.message?.content?.trim().toUpperCase()
  return SeveritySchema.parse(result)
}

export async function classifySeverity(title: string, description: string): Promise<Severity> {
  const maxAttempts = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await attemptClassification(title, description)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500))
      }
    }
  }

  Sentry.captureException(lastError, {
    extra: { title, description, context: 'classifySeverity' },
  })

  return 'P2'
}