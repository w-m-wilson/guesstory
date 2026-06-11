import Anthropic from '@anthropic-ai/sdk'
import { sanitizeStr } from './_sanitize.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (req.headers['x-api-key'] !== process.env.API_SECRET) return res.status(401).end()

  const { category, difficulty } = req.body
  if (!category) return res.status(400).json({ error: 'Missing fields' })
  if (typeof category !== 'string' || category.length > 300) return res.status(400).json({ error: 'Invalid input' })
  if (difficulty !== undefined && !['lite', 'medium', 'challenge'].includes(difficulty)) return res.status(400).json({ error: 'Invalid input' })

  const safeCategory = sanitizeStr(category)

  const system = difficulty === 'challenge'
    ? `The puzzle's hidden category is: "${safeCategory}"\n\n` +
      `Write ONE sentence clue. It must contain exactly one genuine foothold — a word or image that ` +
      `points at the subject or metric if the player is paying close attention. ` +
      `Wrap it in something unexpected: a fragment, an odd comparison, a thing that feels slightly off. ` +
      `Do not be vague for its own sake. Do not rhyme. Do not start with "Think" or "Consider". ` +
      `Max 15 words. No quotes. Just the sentence.`
    : `The puzzle's hidden category is: "${safeCategory}"\n\n` +
      `Write ONE clue sentence that points at the subject or ranking metric without naming either. ` +
      `Be concrete — give the player something to act on, not a feeling. ` +
      `Do not start with "Think" or "Consider". Avoid metaphors that could describe anything. ` +
      `Max 15 words. No quotes. Just the sentence.`

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      system,
      messages: [{ role: 'user', content: 'Give me a clue.' }],
    })

    res.json({ clue: message.content[0].text.trim() })
  } catch (err) {
    console.error('category-nudge error:', err)
    res.json({ clue: null })
  }
}
