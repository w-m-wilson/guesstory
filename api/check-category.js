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
        `You judge guesses in a daily ranking game. Every category has two parts:\n` +
        `- Subject: the specific group of things being ranked\n` +
        `- Metric: what they are ranked by\n\n` +
        `Reply with JSON only — no other text: {"verdict":"yes|warm|cold","hint":"string or null"}\n\n` +
        `Verdicts:\n` +
        `"yes" — guess names the right specific subject AND the right metric (synonyms and vague gestures are fine). hint: null\n` +
        `"warm" — guess is on the right track but not complete. Use the most fitting sub-case:\n` +
        `  • Right specific subject + wrong metric stated: acknowledge the subject is right, gently redirect the metric without revealing it.\n` +
        `  • Right specific subject + no metric: nudge them to complete the guess — the format is "[subject] by [metric]". Don't reveal the metric, but make clear they need to add one. E.g. "try [subject] by something" or echo their guess with a "by ___?" trailing hint.\n` +
        `  • Too broad: the guess names a wide class that contains the specific subject — "universities" when the answer is a particular group of universities, "songs" when the answer is a specific artist's songs, etc. Key test: would this guess also fit dozens of other possible categories? If yes, it's too broad. Tell them to narrow down which [things] AND that there's a ranking dimension. Don't echo or paraphrase the category.\n` +
        `"cold" — wrong domain entirely. hint: brief, light, "not the right direction" energy.\n` +
        `Warm hints should sound like a friend — casual, never robotic, never reveal the answer.`,
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
