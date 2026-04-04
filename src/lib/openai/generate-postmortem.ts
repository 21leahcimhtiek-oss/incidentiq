import OpenAI from 'openai'
import * as Sentry from '@sentry/nextjs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface IncidentContext {
  title: string
  description: string | null
  severity: string
  status: string
  createdAt: string
  resolvedAt: string | null
  updates: Array<{
    message: string
    createdAt: string
    userEmail?: string
  }>
}

const POSTMORTEM_PROMPT = `You are an expert SRE writing a professional post-mortem document.
Generate a comprehensive post-mortem in Markdown format with these sections:

# Post-Mortem: [Incident Title]

## Summary
Brief 2-3 sentence summary of the incident.

## Impact
- Duration: [calculated from timestamps]
- Severity: [P0/P1/P2/P3]
- Systems Affected: [infer from description]
- User Impact: [describe impact]

## Timeline
Chronological list of events from the incident updates.

## Root Cause
Analysis of the likely root cause based on the incident description and updates.

## Contributing Factors
Bullet list of contributing factors.

## Resolution
How the incident was resolved.

## Action Items
| Priority | Action | Owner | Due Date |
|----------|--------|-------|----------|
| P1 | [action item] | TBD | TBD |

## Lessons Learned
Key takeaways to prevent future incidents.

## Detection & Response Metrics
- Time to Detect: [calculate]
- Time to Resolve: [calculate]
- Responders: [list from updates]`

export async function generatePostmortem(incident: IncidentContext): Promise<string> {
  const maxAttempts = 3
  let lastError: Error | null = null

  const timeline = incident.updates
    .map(u => `[${new Date(u.createdAt).toISOString()}] ${u.userEmail || 'System'}: ${u.message}`)
    .join('\n')

  const incidentSummary = `
Incident Title: ${incident.title}
Description: ${incident.description || 'No description'}
Severity: ${incident.severity}
Status: ${incident.status}
Created At: ${incident.createdAt}
Resolved At: ${incident.resolvedAt || 'Not yet resolved'}

Timeline of Updates:
${timeline || 'No updates recorded'}
`

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: POSTMORTEM_PROMPT },
          { role: 'user', content: incidentSummary },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from OpenAI')
      return content
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  Sentry.captureException(lastError, {
    extra: { incidentTitle: incident.title, context: 'generatePostmortem' },
  })

  return `# Post-Mortem: ${incident.title}

## Summary
This post-mortem could not be generated automatically. Please fill in the details manually.

## Impact
- Severity: ${incident.severity}
- Created: ${incident.createdAt}
- Resolved: ${incident.resolvedAt || 'Ongoing'}

## Timeline
${timeline || 'No updates recorded'}

## Root Cause
[To be determined]

## Action Items
| Priority | Action | Owner | Due Date |
|----------|--------|-------|----------|

## Lessons Learned
[To be determined]`
}