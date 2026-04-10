import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { guess, category, foundItems } = req.body
  if (!guess || !category) return res.status(400).json({ error: 'Missing fields' })
  if (typeof guess !== 'string' || guess.length > 200) return res.status(400).json({ error: 'Invalid input' })
  if (typeof category !== 'string' || category.length > 300) return res.status(400).json({ error: 'Invalid input' })
  if (foundItems !== undefined && (!Array.isArray(foundItems) || foundItems.length > 20)) return res.status(400).json({ error: 'Invalid input' })

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system:
        `You are a guide in "Reckon", a ranking puzzle game. The hidden category is: "${category}".\n` +
        `Players type specific named items into a search field to discover them. Each item is a proper noun — a specific named entity that fits the category.\n` +
        `Items found so far: ${foundItems?.length ? foundItems.join(', ') : 'none yet'}\n\n` +
        `The player typed "${guess}" and got a miss. Write ONE short actionable hint (max 20 words):\n` +
        `- If it looks like a category/metric answer, redirect them to the category field at the top of the screen\n` +
        `- If it's the right domain but wrong format (e.g. a single film, a studio, a genre), tell them specifically how to refine it\n` +
        `- If it's the wrong domain entirely, redirect toward the right kind of thing without naming any answers\n` +
        `Be specific and actionable — not vague encouragement. Never name specific bank items. Just write the sentence, no JSON.`,
      messages: [{ role: 'user', content: `Player typed: "${guess}"` }],
    })

    const hint = message.content[0].text.trim()
    res.json({ type: 'hint', message: hint || null })
  } catch (err) {
    console.error('hint-bank-guess error:', err)
    res.json({ type: 'skip', message: null })
  }
}
