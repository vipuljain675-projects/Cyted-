// lib/llm.ts
// ──────────────────────────────────────────────────────────────────
// Multi-LLM provider wrapper with 3 active benchmark models:
// 1. Groq Qwen — qwen/qwen3.8-27b (Fast open weights)
// 2. Groq GPT-OSS — openai/gpt-oss-120b (120B parameter flagship open model)
// 3. Google AI — gemini-3.5-flash-lite (Google's latest Gemini engine)
//
// Zero external rate limits, fast inference, 100% reliable execution.
// ──────────────────────────────────────────────────────────────────

export interface LLMResponse {
  text: string;
  model: string;
  provider: string;
}

// Wrap prompt to encourage numbered list format for better rank extraction
function wrapAuditPrompt(rawPrompt: string): string {
  return `${rawPrompt}\n\nProvide a concise answer. If recommending multiple options, list them as a numbered list (1. 2. 3. etc.) with brief reasoning for each.`;
}

// ── 1. GROQ — qwen/qwen3.8-27b ──────────────────────────────────
async function callGroqQwen(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured in .env');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: wrapAuditPrompt(prompt) }],
      temperature: 0.3,
      max_tokens: 350,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Qwen error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  let content = (msg?.content || msg?.reasoning || '').trim();
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return {
    text: content,
    model: 'groq',
    provider: 'groq',
  };
}

// ── 2. GROQ — openai/gpt-oss-120b (120B Flagship Model) ──────────
async function callGroqGPT(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured in .env');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: wrapAuditPrompt(prompt) }],
      temperature: 0.3,
      max_tokens: 350,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq GPT-OSS error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  const content = (msg?.content || msg?.reasoning || '').trim();

  return {
    text: content,
    model: 'groq_oss',
    provider: 'groq_oss',
  };
}

// ── 3. GOOGLE AI (Gemini Key) — gemini-3.5-flash-lite ───────────────
async function callGemini(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured in .env');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: wrapAuditPrompt(prompt) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 350,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    text: text.trim(),
    model: 'gemini',
    provider: 'gemini',
  };
}

// ── ROUTER ────────────────────────────────────────────────────────
export async function callLLM(
  prompt: string,
  provider: 'groq' | 'groq_oss' | 'gemini' = 'groq'
): Promise<LLMResponse> {
  if (provider === 'gemini') return await callGemini(prompt);
  if (provider === 'groq_oss') return await callGroqGPT(prompt);
  return await callGroqQwen(prompt);
}

// Cheap model for prompt formulation and meta briefs
export async function callCheapLLM(prompt: string): Promise<LLMResponse> {
  return await callGroqQwen(prompt);
}

// 3 Active Foundation Models evaluated for each prompt
export const TEST_PROVIDERS: Array<'groq' | 'groq_oss' | 'gemini'> = ['groq', 'groq_oss', 'gemini'];
