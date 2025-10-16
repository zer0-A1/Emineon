import { openaiService } from '@/lib/openai';

// Minimal embedding helper. Uses OpenAI when key present, otherwise returns a small mock vector.
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  try {
    if (!apiKey) {
      // Simple deterministic mock for local/dev without OpenAI key
      const hash = Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const vec = new Array(128).fill(0).map((_, i) => ((hash * (i + 1)) % 1000) / 1000);
      return vec;
    }
    // Use OpenAI embeddings via the OpenAI SDK already configured
    const client: any = (openaiService as any)['__client']?.() || undefined;
    // Fallback: access underlying client from openaiService.getOpenAI if exposed; otherwise create locally
    const OpenAI = (await import('openai')).default;
    const openai = client || new OpenAI({ apiKey });
    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    const embedding = resp.data?.[0]?.embedding as number[] | undefined;
    if (!embedding) throw new Error('No embedding returned');
    return embedding;
  } catch (err) {
    console.error('embedText error:', err);
    // Safe fallback
    const vec = new Array(128).fill(0);
    return vec;
  }
}


