import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query, category } = req.body
  if (!query || !category) return res.status(400).json({ error: 'Missing fields' })
  if (typeof query !== 'string' || query.length > 200) return res.status(400).json({ error: 'Invalid input' })
  if (typeof category !== 'string' || category.length > 300) return res.status(400).json({ error: 'Invalid input' })

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        `You are a friendly guide in a ranking puzzle game. The hidden category follows the format "[subject] ranked by [metric]". Your role is to help players discover it through their guesses.\n\n` +
        `CRITICAL: Judge only against the given category string. Never add requirements not in it.\n\n` +
        `Reply with JSON only: {"verdict":"yes|warm|cold","hint":"string or null"}\n\n` +
        `"yes" — the guess captures the spirit of both subject and metric. Be very generous:\n` +
        `  • Any synonym, shorthand, partial, or reasonable subcategory/supercategory of the subject is fine — e.g. "candy brands" or "candy bars" when the subject is "candy"\n` +
        `  • Any phrasing that points at the same metric dimension counts — vague words (size, amount, number, rank, order), direction words (most to least, descending, biggest first), or even approximate domain words all count\n` +
        `  • Inverted phrasing is fine — "most-used social media" is equivalent to "social media by users". Leading with the metric dimension is just as valid as leading with the subject.\n` +
        `  • Adjective-first constructions like "best selling candy", "top-grossing movies", "most popular songs" all count as yes — the superlative/adjective IS the metric.\n` +
        `  • If the subject domain is right and any ordering/ranking/popularity dimension is implied at all, that is yes.\n` +
        `  • When in doubt, always choose yes over warm. hint: null\n` +
        `"warm" — subject is clearly right but metric is absent or a different dimension entirely:\n` +
        `  • No metric: warmly affirm the subject, then explain the game format — e.g. "exactly the right subject! categories here are always '[thing] by [how they're ranked]' — what's the ranking dimension?" Never name or hint at the actual metric.\n` +
        `  • Wrong dimension: affirm subject, tell them the ranking angle is different, nudge the KIND of dimension (a quantity? a physical property? a date?) without naming it.\n` +
        `"cold" — subject is the wrong domain:\n` +
        `  • Be warm and helpful: briefly explain what kind of things ARE being ranked (e.g. "think more [broad domain]") without naming the subject. New players may not know how the game works — if the guess looks like they're still learning the format, explain it gently.\n` +
        `Hints: 1–2 sentences, warm and encouraging, never robotic, never reveal the answer.`,
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
