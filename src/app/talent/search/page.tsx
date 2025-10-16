'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Search as SearchIcon, Users, Plus, X, Mic, AudioLines } from 'lucide-react';

export default function TalentSearchPage() {
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('talent:saved-searches')||'[]'); } catch { return []; }
  });

  const addTag = (t: string) => {
    const v = t.trim(); if (!v) return; setTags(prev => Array.from(new Set([...prev, v])));
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x=>x!==t));
  const saveSearch = () => {
    const name = query || tags.join(' ');
    if (!name) return;
    const next = Array.from(new Set([name, ...savedSearches])).slice(0, 20);
    setSavedSearches(next);
    try { localStorage.setItem('talent:saved-searches', JSON.stringify(next)); } catch {}
  };

  return (
    <Layout fullWidth>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header with glowing icon + typing animation (match Candidates page) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white ring-2 ring-primary-300 shadow-sm shadow-[0_0_24px_rgba(37,99,235,0.35)] animate-pulse">
              <Users className="w-4 h-4 text-primary-700" />
            </span>
            <TypingTitle text="Search" />
          </div>
          <button onClick={saveSearch} className="inline-flex items-center gap-2 text-sm bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700"><Plus className="h-4 w-4"/>Save</button>
        </div>

        {/* AI Co-pilot style hero */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-gray-200 p-6">
          <div className="text-lg font-semibold text-gray-800 mb-2">Who are you looking for?</div>
          <div className="w-full max-w-3xl">
            <div className="relative flex items-center gap-2 bg-white border border-neutral-300 rounded-full px-3 py-2 shadow-sm">
              <span className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" title="Search">
                <SearchIcon className="w-5 h-5 text-neutral-700" />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Ask anything"
                className="flex-1 px-3 py-3 outline-none text-neutral-900 placeholder-neutral-500 bg-transparent"
              />
              <span className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" title="Voice">
                <Mic className="w-5 h-5 text-neutral-700" />
              </span>
              <span className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" title="Transcribe">
                <AudioLines className="w-5 h-5 text-neutral-700" />
              </span>
            </div>
          </div>
          <HighlightTags query={query} onClickTag={addTag} />
          {tags.length>0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.map(t=> (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs border border-primary-200">{t}<button onClick={()=>removeTag(t)}><X className="h-3 w-3"/></button></span>
              ))}
            </div>
          )}
        </div>

        {/* Saved searches list in sidebar style */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="space-y-1">
                {savedSearches.map((s)=> (
                  <button key={s} className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-sm truncate" onClick={()=>setQuery(s)}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            
          </div>
        </div>
      </div>
    </Layout>
  );
}

function HighlightTags({ query, onClickTag }: { query: string; onClickTag: (t: string)=>void }) {
  // naive keyword buckets; can be expanded later
  const isJob = /\b(product\s*owner|developer|engineer|designer|manager|analyst|consultant|architect|lead|po|scrum\s*master|data\s*scientist|product\s*manager)\b/i.test(query);
  const isLocation = /\b(paris|london|geneva|zurich|berlin|remote|hybrid|switzerland|germany|france|usa|uk|europe|nyc|california|san\s*francisco)\b/i.test(query);
  const isYears = /(\b\d+\s*\+?\s*(years?|yrs?)\b|\b(senior|junior|mid)\b)/i.test(query);
  const isIndustry = /\b(banking|finance|fintech|insurance|pharma|healthcare|retail|e-?commerce|automotive|energy|telecom|bank|insurer)\b/i.test(query);
  const isSkills = /\b(java|javascript|typescript|react|node(\.js)?|python|aws|gcp|azure|sql|spring|kubernetes|docker|next\.js|postgres|llm|nlp)\b/i.test(query);
  const items = [
    { key: 'Location', active: isLocation },
    { key: 'Job Title', active: isJob },
    { key: 'Years of Experience', active: isYears },
    { key: 'Industry', active: isIndustry },
    { key: 'Skills', active: isSkills },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(({ key, active }) => (
        <button
          key={key}
          onClick={()=>onClickTag(key)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            active
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          title={active ? 'Detected in query' : 'Add to query'}
        >
          {key}
        </button>
      ))}
    </div>
  );
}

function TypingTitle({ text }: { text: string }) {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'typing'|'done'>('typing');
  React.useEffect(() => {
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


