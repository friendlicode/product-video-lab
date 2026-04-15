const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'

export type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | OpenAIContentPart[]
}

export interface CallOpenAIOptions {
  model?: OpenAIModel
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' | 'text' }
}

export interface OpenAIResponse<T = unknown> {
  data: T
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Reusable helper for calling the OpenAI chat completions endpoint.
 * Set VITE_OPENAI_API_KEY in your .env.local file.
 *
 * @example
 * const result = await callOpenAI<{ summary: string }>(
 *   [{ role: 'user', content: 'Summarize this product...' }],
 *   { model: 'gpt-4o', response_format: { type: 'json_object' } }
 * )
 */
export async function callOpenAI<T = unknown>(
  messages: OpenAIMessage[],
  options: CallOpenAIOptions = {}
): Promise<OpenAIResponse<T>> {
  const {
    model = 'gpt-4o',
    temperature = 0.7,
    max_tokens,
    response_format,
  } = options

  if (!OPENAI_API_KEY) {
    throw new Error(
      '[openai] VITE_OPENAI_API_KEY is not set. Add it to your .env.local file.'
    )
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  }
  if (max_tokens) body.max_tokens = max_tokens
  if (response_format) body.response_format = response_format

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[openai] API error ${response.status}: ${error}`)
  }

  const json = await response.json()
  const raw = json.choices?.[0]?.message?.content ?? ''

  let data: T
  try {
    data = response_format?.type === 'json_object' ? (JSON.parse(raw) as T) : (raw as T)
  } catch {
    data = raw as T
  }

  return {
    data,
    usage: json.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  }
}
