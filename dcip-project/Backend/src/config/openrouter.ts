const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL   = 'gemini-3.1-flash-lite'

export interface AIMessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | AIMessageContent[]
}

// Convert OpenAI-format messages to Gemini's contents + systemInstruction format
function toGeminiBody(messages: AIMessage[]): Record<string, unknown> {
  const systemMsg = messages.find(m => m.role === 'system')
  const turns     = messages.filter(m => m.role !== 'system')

  const contents = turns.map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user'

    if (typeof m.content === 'string') {
      return { role, parts: [{ text: m.content }] }
    }

    const parts = m.content.map(c => {
      if (c.type === 'text') return { text: c.text ?? '' }
      if (c.type === 'image_url' && c.image_url) {
        const url = c.image_url.url
        if (url.startsWith('data:')) {
          const [header, data] = url.split(',')
          const mimeType = header.split(':')[1].split(';')[0]
          return { inlineData: { mimeType, data } }
        }
        return { fileData: { mimeType: 'image/png', fileUri: url } }
      }
      return { text: '' }
    })

    return { role, parts }
  })

  const body: Record<string, unknown> = { contents }
  if (systemMsg) {
    const text = typeof systemMsg.content === 'string' ? systemMsg.content : ''
    body.systemInstruction = { parts: [{ text }] }
  }
  return body
}

async function callGemini(messages: AIMessage[]): Promise<{ ok: boolean; content: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, content: '' }

  try {
    const res = await fetch(`${GEMINI_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(toGeminiBody(messages)),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error(`Gemini failed (${res.status}):`, err)
      return { ok: false, content: '' }
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { ok: true, content: text }
  } catch (err) {
    console.error('Gemini network error:', err)
    return { ok: false, content: '' }
  }
}

// Fallback chain — each model is from a different provider with its own rate-limit pool.
// Vision-capable models are listed first (needed for artwork critique).
// Text-only models follow as final fallbacks (sufficient for course hints).
const FALLBACK_CHAIN = [
  'nvidia/nemotron-nano-12b-v2-vl:free',           // NVIDIA — vision-capable
  'meta-llama/llama-3.3-70b-instruct:free',         // Meta — text-only, generous quota
  'qwen/qwen3-next-80b-a3b-instruct:free',          // Qwen — text-only, large model
]

async function callModel(
  apiKey: string,
  model: string,
  messages: AIMessage[],
): Promise<{ ok: boolean; status: number; content: string }> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  process.env.CLIENT_URL || 'https://dcip-rw.online',
      'X-Title':       'DCIP',
    },
    body: JSON.stringify({ model, messages }),
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    return { ok: false, status: res.status, content: errBody }
  }
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return { ok: true, status: res.status, content: data.choices?.[0]?.message?.content ?? '' }
}

export async function callAI(messages: AIMessage[], extraFallbacks: string[] = []): Promise<string> {
  // Gemini first — direct API, more reliable and generous free quota
  const gemini = await callGemini(messages)
  if (gemini.ok && gemini.content) return gemini.content

  // Fall back to OpenRouter chain
  const apiKey = process.env.OPENROUTER_API_KEY
  const model  = process.env.OPENROUTER_MODEL

  if (!apiKey || !model) {
    throw new Error('AI is not configured: missing API keys')
  }

  const chain = [model, ...FALLBACK_CHAIN, ...extraFallbacks]

  for (const m of chain) {
    const result = await callModel(apiKey, m, messages)

    if (result.ok && result.content) return result.content

    if (!result.ok && result.status !== 429) {
      throw new Error(`OpenRouter model ${m} failed (${result.status}): ${result.content}`)
    }
  }

  throw new Error('All AI models are currently unavailable. Please try again in a moment.')
}
