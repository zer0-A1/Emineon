import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedTextSmall1536(text: string): Promise<number[]> {
  const input = text.length > 8000 ? text.slice(0, 8000) : text;
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  });
  const vec = res.data?.[0]?.embedding;
  if (!vec || !Array.isArray(vec)) throw new Error('Failed to compute embedding');
  return vec as number[];
}

export function toVectorLiteral(vec: number[]): string {
  return `[${vec.map((v) => (Number.isFinite(v) ? v.toFixed(6) : 0)).join(',')}]`;
}


