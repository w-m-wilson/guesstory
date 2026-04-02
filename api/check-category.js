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
          `- "warm": the guess is in the right ballpark but incomplete. Two sub-cases:\n` +
          `  - If the guess names the right *specific* subject but doesn't say what's being ranked: give a short, casual hint nudging toward the ranking dimension only. Don't reveal it — just a friendly poke, like something a friend would say.\n` +
          `  - If the guess is in the right *general domain* but too vague (e.g. "schools" when the subject is a specific group of schools): hint should nudge toward both the specificity of the subject AND that there's a ranking dimension. E.g. "a specific kind of school, ranked a specific way" — keep the same energy, not robotic.\n` +
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
