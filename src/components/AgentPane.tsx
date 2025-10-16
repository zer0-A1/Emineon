'use client';

import { useState } from 'react';

export function AgentPane() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Agent error');
      setResult(data.result);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md space-y-2">
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the agent..." />
        <button disabled={loading} onClick={execute} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Running...' : 'Run'}</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {result && (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}


