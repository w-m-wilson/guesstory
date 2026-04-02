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
        `You judge guesses in a daily ranking game. The category is "[subject] ranked by [metric]".\n\n` +
        `Your job: does the player's guess capture the INTENT of both the subject and the metric? Exact wording doesn't matter — understanding does.\n\n` +
        `Reply with JSON only — no other text: {"verdict":"yes|warm|cold","hint":"string or null"}\n\n` +
        `"yes" — the guess gets the gist of both. Judge by spirit, not letter:\n` +
        `  • Subject: synonyms, informal names, partial labels all fine — "schools"="universities", "films"="movies", "US"="United States"\n` +
        `  • Metric: any phrasing that points at the same underlying dimension counts — "pop size", "how big", "number of students", "by size", "enrollment", "largest first" all capture a size/population metric. Direction words (biggest→smallest, descending, most to least) count. Vague but correct-domain words like "rank", "order" count if the subject is right.\n` +
        `  Bias strongly toward yes. Only withhold yes if the metric is genuinely absent or pointing at a different dimension entirely. hint: null\n` +
        `"warm" — subject is right but metric is absent or pointing at a clearly different dimension (e.g. guessing "by age" when it's "by population"):\n` +
        `  • Missing: hint like "yes, [subject] — but ranked how?" (never name the metric)\n` +
        `  • Wrong dimension: acknowledge subject, nudge that the ordering is different\n` +
        `"cold" — subject is in the wrong domain. hint: brief, "not the right direction" energy.\n` +
        `Hints casual, never robotic.`,
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
