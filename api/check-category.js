import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query, category } = req.body
  if (!query || !category) return res.status(400).json({ error: 'Missing fields' })

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        `You judge guesses in a daily ranking game. The category is "[subject] ranked by [metric]".\n\n` +
        `Your job: does the player's guess capture the INTENT of both the subject and the metric? Spirit matters, not wording.\n\n` +
        `Reply with JSON only — no other text: {"verdict":"yes|warm|cold","hint":"string or null"}\n\n` +
        `"yes" — guess gets the gist of both. Bias strongly toward yes:\n` +
        `  • Subject: synonyms, informal names, partials all fine\n` +
        `  • Metric: any phrasing pointing at the same dimension counts — "pop size", "how big", "by size", direction words (descending, most to least), vague words (rank, order) if subject is right\n` +
        `  Only withhold yes if metric is genuinely absent OR a clearly different dimension. hint: null\n` +
        `"warm" — subject is right, metric is missing or a clearly different dimension:\n` +
        `  • Missing metric: affirm the subject, ask how it's ordered — e.g. "right subject! but ranked by what?" Don't name or hint at the metric.\n` +
        `  • Wrong dimension: affirm subject, note the ordering angle is off — give a gentle nudge toward what KIND of dimension to think about (size? time? quantity?) without naming it.\n` +
        `"cold" — subject is the wrong domain:\n` +
        `  • Give a hint that steers toward the right KIND of subject — what broad category of things are being ranked? Don't name the subject, just gesture at the space. Keep it brief and friendly.\n` +
        `Hints: 1 sentence max, casual, never robotic, never reveal the answer.`,
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
