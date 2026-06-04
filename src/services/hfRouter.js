/**
 * Hugging Face Inference Router (OpenAI-compatible)
 * https://router.huggingface.co/v1
 */

const ROUTER_URL =
  process.env.HF_ROUTER_URL || 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_MODEL =
  process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';

function getApiKey() {
  return process.env.HUGGINGFACE_API_KEY?.trim();
}

export function isDemoMode() {
  const key = getApiKey();
  if (!key || key.includes('fake') || key === 'hf_your_token_here') return true;
  return process.env.DEMO_MODE?.toLowerCase() === 'true';
}

function extractMessage(message) {
  if (!message) return '';
  const content = (message.content || '').trim();
  if (content) return content;
  return (message.reasoning_content || '').trim();
}

async function routerRequest(body) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Thiếu HUGGINGFACE_API_KEY trong Backend/.env');

  const res = await fetch(ROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`HF API phản hồi không hợp lệ (${res.status})`);
  }

  if (!res.ok) {
    const errMsg =
      data?.error?.message || data?.error || data?.message || text.slice(0, 200);
    throw new Error(`Hugging Face (${res.status}): ${errMsg}`);
  }

  return data;
}

export async function chatComplete(messages, options = {}) {
  const data = await routerRequest({
    model: options.model || DEFAULT_MODEL,
    messages,
    max_tokens: options.max_tokens ?? 2048,
    temperature: options.temperature ?? 0.7,
    stream: false,
  });

  return extractMessage(data.choices?.[0]?.message);
}

export async function* chatCompleteStream(messages, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Thiếu HUGGINGFACE_API_KEY');

  const res = await fetch(ROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      max_tokens: options.max_tokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg = text.slice(0, 300);
    try {
      const j = JSON.parse(text);
      errMsg = j.error?.message || j.error || errMsg;
    } catch {
      /* ignore */
    }
    throw new Error(`Hugging Face stream (${res.status}): ${errMsg}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Không đọc được stream');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta;
        const token = delta?.content || delta?.reasoning_content;
        if (token) yield token;
      } catch {
        /* skip malformed chunk */
      }
    }
  }
}
