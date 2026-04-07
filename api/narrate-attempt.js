import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { slots, feedback, attemptNumber, coinsRemaining } = req.body
  if (!feedback || !attemptNumber) return res.status(400).json({ error: 'Missing fields' })

  const correctCount = feedback.filter(f => f === 'correct').length
  const presentCount = feedback.filter(f => f === 'present').length
  const filledCount = (slots ?? []).filter(Boolean).length

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      system:
        `You are a dry, knowledgeable narrator for a ranking puzzle game (Mastermind-style). ` +
        `React to the player's attempt in exactly 1 short sentence. ` +
        `Tone: a knowledgeable friend watching over your shoulder — spare, honest, never sycophantic, occasionally wry. ` +
        `React to the feedback quality only. Never hint at the answer or name specific items. ` +
        `Reply with just the sentence, no quotes.`,
      messages: [{
        role: 'user',
        content:
          `Attempt #${attemptNumber}. ${filledCount}/5 slots filled. ` +
          `${correctCount} in right position, ${presentCount} in top 5 but wrong spot. ` +
          `${coinsRemaining} coins remaining.`,
      }],
    })

    res.json({ narration: message.content[0].text.trim() })
  } catch (err) {
    console.error('narrate-attempt error:', err)
    res.json({ narration: null })
  }
}
