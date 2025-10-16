import OpenAI from 'openai';

type BackoffOptions = {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number; // 0..1
};

export interface ResponsesParams {
  model?: string;
  input: any[]; // OpenAI Responses input array
  idempotencyKey?: string;
}

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function expBackoffDelay(attempt: number, opts: BackoffOptions): number {
  const base = Math.min(
    (opts.initialDelayMs || 400) * Math.pow(2, attempt),
    opts.maxDelayMs || 5000
  );
  const jitter = (opts.jitterRatio ?? 0.2) * base * (Math.random() * 2 - 1);
  return Math.max(100, Math.round(base + jitter));
}

export async function responsesCreateWithRetry(
  params: ResponsesParams,
  backoff: BackoffOptions = {}
) {
  const client = getOpenAIClient();
  const maxRetries = backoff.maxRetries ?? 2;
  const model = params.model || 'gpt-4o';

  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {};
      if (params.idempotencyKey) headers['Idempotency-Key'] = params.idempotencyKey;

      const res = await client.responses.create({
        model,
        input: params.input,
      } as any, { headers });
      return res;
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.code;
      const retryable = status === 429 || status === 408 || status === 500 || status === 502 || status === 503 || status === 504;
      if (attempt < maxRetries && retryable) {
        await sleep(expBackoffDelay(attempt, backoff));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export function buildIdempotencyKey(seed: string): string {
  // Simple stable hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `idem_${Math.abs(hash)}`;
}


