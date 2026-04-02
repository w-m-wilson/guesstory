import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query, category } = req.body
  if (!query || !category) return res.status(400).json({ error: 'Missing fields' })

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system:
        `You judge guesses in a daily ranking game. The category has two parts: a subject (what's being ranked) and a metric (how it's ordered).\n\n` +
        `CRITICAL: Judge ONLY against the given category string. Do not invent requirements that aren't in it — no "which specific ones?" or extra qualifiers.\n\n` +
        `Reply with JSON only — no other text: {"verdict":"yes|warm|cold","hint":"string or null"}\n\n` +
        `Verdicts:\n` +
        `"yes" — subject matches AND metric matches. Be very generous with synonyms: "descending/ascending", "biggest to smallest", "most to least", "highest to lowest", "largest to smallest", "ranked by X" all count. hint: null\n` +
        `"warm" — subject matches but metric is missing or wrong:\n` +
        `  • No metric: hint like "yes, [subject] — but in what order?" (never reveal the metric)\n` +
        `  • Wrong metric: acknowledge subject is right, gently say the ordering is different\n` +
        `"cold" — subject is wrong. hint: brief, light, "not the right direction" energy.\n` +
        `Hints should sound like a friend — casual, never robotic.`,
      messages: [{
        role: 'user',
        content: `Category: "${category}"\nPlayer's guess: "${query}"`,
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
