import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { attempts, coins, won, category, categoryGuessed } = req.body
  if (!category) return res.status(400).json({ error: 'Missing fields' })

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system:
        `You are a witty, concise narrator writing a 1–2 sentence recap of how a player did in a ranking puzzle game called Reckon. ` +
        `The puzzle's category: "${category}". ` +
        `Style: dry, specific, personal — like a knowledgeable friend recapping a match. ` +
        `Never be sycophantic. If they struggled, say so honestly but warmly. ` +
        `Reply with just the recap, no quotes.`,
      messages: [{
        role: 'user',
        content:
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
