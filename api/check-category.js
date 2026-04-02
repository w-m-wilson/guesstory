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
          `- "yes": the guess gets the right subject AND gestures at the right ranking dimension, even vaguely or with synonyms (e.g. "pop", "size", "enrollment", "students" all count). Abbreviations and shorthand are fine. Be generous. hint: null\n` +
          `- "warm": right subject, but no mention of what's being ranked. hint: a short, casual, encouraging nudge — like something a friend would say. Don't reveal the metric or answer. Make it feel alive, not robotic.\n` +
          `- "cold": wrong subject or completely off. hint: short and punchy, like "Nope" or "Way off" — keep it light\n`,
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
