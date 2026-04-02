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
          `The category has two parts: a specific subject (which things) and a ranking metric (ranked how).\n\n` +
          `Rules:\n` +
          `- "yes": the guess identifies the right specific subject AND gestures at the right metric, even loosely or with synonyms. Be generous. hint: null\n` +
          `- "warm": the guess is heading in the right direction but isn't complete. Pick the most fitting sub-case and write the hint accordingly:\n` +
          `  - Mentions the right specific subject + names a plausible but wrong metric: acknowledge they have the right subject, gently redirect — something's being measured differently here. Don't reveal the metric.\n` +
          `  - Mentions the right specific subject but no metric: nudge them toward the fact that there's a specific ranking dimension to find. Keep it light.\n` +
          `  - Names the right general type of thing but too broad (e.g. the answer is a specific subset, but the guess names the whole class): encourage them to get more specific about which [things], and hint that there's a ranking dimension too. Keep the phrasing natural and general — don't echo the category wording.\n` +
          `- "cold": wrong domain entirely. hint: a brief, light phrase — "not the right direction" energy, don't pile on\n`,
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
