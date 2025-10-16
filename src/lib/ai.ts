export async function aiRewrite(params: { intent: string; text: string; sectionId: string; kind: string; extra?: string }) {
  const res = await fetch('/api/ai/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`AI edit failed: ${res.status}`);
  return res.json();
}


