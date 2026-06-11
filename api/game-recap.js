import Anthropic from '@anthropic-ai/sdk'
import { sanitizeStr } from './_sanitize.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (req.headers['x-api-key'] !== process.env.API_SECRET) return res.status(401).end()

  const { attempts, coins, won, category, difficulty, categoryGuessed } = req.body
  if (!category) return res.status(400).json({ error: 'Missing fields' })
  if (typeof category !== 'string' || category.length > 300) return res.status(400).json({ error: 'Invalid input' })
  if (difficulty !== undefined && !['lite', 'medium', 'challenge'].includes(difficulty)) return res.status(400).json({ error: 'Invalid input' })
  if (attempts !== undefined && (!Number.isInteger(attempts) || attempts < 0)) return res.status(400).json({ error: 'Invalid input' })
  if (coins !== undefined && (!Number.isInteger(coins) || coins < 0)) return res.status(400).json({ error: 'Invalid input' })

  const safeCategory = sanitizeStr(category)

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system:
        `You are writing a 1–2 sentence recap of a player's game in Guesstory, a daily ranking puzzle. ` +
        `The puzzle's category: "${safeCategory}". ` +
        `Difficulty context — use this to calibrate your tone:\n` +
        `  Lite: forgiving scoring, answers seeded. 90+ coins = fine. 70+ = decent.\n` +
        `  Medium: standard. 90+ coins = good. 80+ = solid. Below 60 = rough.\n` +
        `  Challenge: no seeds, steeper penalties. 90+ coins = genuinely excellent. ` +
        `80+ = strong. Guessing the category on challenge costs more and is harder — mention it if they did.\n` +
        `Tone: dry, a little oblique, like a sports columnist who's seen everything. ` +
        `Find a specific, unexpected angle — comment on something surprising about the numbers, ` +
        `draw an odd comparison, or let the category's subject inform the voice. ` +
        `Avoid: "brute-force", "methodically", "systematically", "managed to", "impressive", ` +
        `"well done", generic encouragement, and any phrasing that could describe any game. ` +
        `If they lost, don't soften it. If they won cleanly on challenge, say so plainly — that's worth noting. ` +
        `Reply with just the recap, no quotes.`,
      messages: [{
        role: 'user',
        content:
          `Difficulty: ${difficulty ?? 'medium'}. ` +
          `${attempts} attempt${attempts !== 1 ? 's' : ''}. ` +
          `${coins} coins remaining. ` +
          `${won ? 'Won.' : 'Did not win.'} ` +
          `${categoryGuessed ? 'Guessed the category.' : 'Never figured out the category.'}`,
      }],
    })

    res.json({ recap: message.content[0].text.trim() })
  } catch (err) {
    console.error('game-recap error:', err)
    res.json({ recap: null })
  }
}
