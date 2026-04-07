import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { category } = req.body
  if (!category) return res.status(400).json({ error: 'Missing fields' })

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      system:
        `You are a hint generator for a ranking puzzle. The puzzle's hidden category is: "${category}"\n\n` +
        `Write ONE clue sentence that obliquely hints at this category without naming it directly. ` +
        `Point toward the subject domain and/or the ranking metric — something a player could act on. ` +
        `Max 15 words. No quotes. Just the sentence.`,
      messages: [{ role: 'user', content: 'Give me a clue.' }],
    })

    res.json({ clue: message.content[0].text.trim() })
  } catch (err) {
    console.error('category-nudge error:', err)
    res.json({ clue: null })
  }
}
