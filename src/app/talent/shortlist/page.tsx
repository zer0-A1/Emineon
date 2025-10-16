'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Users } from 'lucide-react';

export default function ShortlistPage() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(()=>{
    try { setItems(JSON.parse(localStorage.getItem('talent:shortlist')||'[]')); } catch {}
  },[]);
  return (
    <Layout fullWidth>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white ring-2 ring-primary-300 shadow-sm shadow-[0_0_24px_rgba(37,99,235,0.35)] animate-pulse">
            <Users className="w-4 h-4 text-primary-700" />
          </span>
          <TypingTitle text="Shortlist" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          {items.length===0 ? (
            <div className="text-sm text-gray-600">Your shortlist is empty.</div>
          ) : (
            <ul className="list-disc list-inside text-sm text-gray-800">
              {items.map((s, i)=> (<li key={i}>{s}</li>))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}

function TypingTitle({ text }: { text: string }) {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'typing'|'done'>('typing');
  useEffect(() => {
    if (phase === 'typing') {
      if (display.length < text.length) {
        const t = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), 45);
        return () => clearTimeout(t);
      } else {
        setPhase('done');
      }
    }
  }, [display, phase, text]);
  return (
    <h1 className="text-3xl font-normal text-neutral-700 flex items-center gap-2">
      <span>{display}</span>
      <span className="ml-0.5 inline-block w-[1px] h-6 bg-neutral-400 align-middle animate-pulse" />
    </h1>
  );
}


