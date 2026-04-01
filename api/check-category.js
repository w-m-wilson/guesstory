import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query, category } = req.body
  if (!query || !category) return res.status(400).json({ error: 'Missing fields' })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content:
          `You are judging a guess in a daily ranking game.\n` +
          `Category: "${category}"\n` +
          `Player's guess: "${query}"\n\n` +
          `Reply with JSON only — no other text:\n` +
          `{"verdict":"yes|warm|cold","hint":"string or null"}\n\n` +
          `Rules:\n` +
          `- "yes": guess correctly captures what is being ranked. hint: null\n` +
          `- "warm": right general subject, missing the specific ranking dimension. hint: one short sentence nudging toward what's missing without revealing it\n` +
          `- "cold": off track. hint: a short punchy dismissal like "Pretty off-base" or "Not even close"\n`,
      }],
    })

    let matched = false, warm = false, cold = false, hint = null
    try {
      const parsed = JSON.parse(message.content[0].text.trim())
      matched = parsed.verdict === 'yes'
      warm    = parsed.verdict === 'warm'
      cold    = parsed.verdict === 'cold'
      hint    = parsed.hint ?? null
    } catch {
      // Unparseable — treat as cold
      cold = true
    }

    res.json({ matched, warm, cold, hint })
  } catch (err) {
    console.error('check-category error:', err)
    res.status(500).json({ error: 'LLM unavailable' })
  }
}
