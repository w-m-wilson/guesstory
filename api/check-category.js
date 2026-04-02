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
          `- "yes": the guess correctly identifies the subject AND gestures at the ranking dimension, even vaguely or with synonyms (e.g. "pop", "size", "enrollment", "students" all count). Abbreviations and shorthand are fine. Be generous. hint: null\n` +
          `- "warm": the guess involves the right subject but the ranking dimension is off or missing. Three sub-cases:\n` +
          `  - Right specific subject + wrong metric mentioned (e.g. "ivy league by endowment" when the metric is enrollment): gently redirect the metric. Acknowledge they have the right group, nudge toward the right kind of measurement — don't reveal it. Casual, like a friend.\n` +
          `  - Right specific subject, no metric mentioned: give a short, casual hint nudging toward the ranking dimension only. Don't reveal it — just a friendly poke.\n` +
          `  - Right general domain but too vague (e.g. "schools" when the subject is a specific group of schools): nudge toward both the specificity of the subject AND that there's a ranking dimension. E.g. "a specific kind of school, ranked a specific way" — not robotic.\n` +
          `- "cold": wrong subject or completely off base. hint: a brief phrase that conveys "not the right direction" — something like "That's a different angle" or "We're headed elsewhere" — light touch, don't pile on\n`,
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
