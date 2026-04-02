import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query, category } = req.body
  if (!query || !category) return res.status(400).json({ error: 'Missing fields' })

  try {
    const client = new Anthropic()
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
          `- "yes": the guess captures the right subject AND the right general ranking dimension, even if phrased loosely or abbreviated. Be permissive — if they clearly get the idea, accept it. hint: null\n` +
          `- "warm": they have the right subject but are missing the ranking dimension entirely. hint: a vague nudge in the right direction — do NOT mention the specific metric, unit, or answer. One short sentence.\n` +
          `- "cold": off track. hint: a short punchy dismissal like "Pretty off-base" or "Not even close"\n`,
      }],
    })

    let matched = false, warm = false, cold = false, hint = null
    try {
      const raw = message.content[0].text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()
      const parsed = JSON.parse(raw)
      matched = parsed.verdict === 'yes'
      warm    = parsed.verdict === 'warm'
      cold    = parsed.verdict === 'cold'
      hint    = parsed.hint ?? null
      console.log('[check-category] verdict:', parsed.verdict, '| hint:', hint)
    } catch {
      console.warn('[check-category] unparseable response:', message.content[0].text)
      cold = true
      hint = 'Not quite'
    }

    res.json({ matched, warm, cold, hint })
  } catch (err) {
    console.error('check-category error:', err)
    res.status(500).json({ error: 'LLM unavailable' })
  }
}
