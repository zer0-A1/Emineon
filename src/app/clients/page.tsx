'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Plus, Search, Filter, MoreVertical, 
  Building, Star as StarIcon, TrendingUp, ArrowLeft, 
  FileText, Mail, Phone, MapPin, Globe, 
  Settings, Users2, Briefcase,
  Shield, Brain, PieChart, Handshake, Target, BarChart3, Eye, DollarSign, MessageSquare, Activity,
  Maximize2, Minimize2
} from 'lucide-react';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';
import { CreateClientModal } from '@/components/clients/CreateClientModal';
import { ClientDrawer } from '@/components/clients/ClientDrawer';
import { Search as SearchIcon } from 'lucide-react';
import React from 'react';
import NextDynamic from 'next/dynamic';
const CreateKnowledgeFileModal = NextDynamic(() => import('@/components/knowledge/CreateKnowledgeFileModal').then(m => m.CreateKnowledgeFileModal), { ssr: false, loading: () => null });

function KnowledgeList() {
  const [docs, setDocs] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [refs, setRefs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [resK, resR] = await Promise.all([
          fetch('/api/knowledge'),
          fetch('/api/references')
        ]);
        const jsonK = await resK.json();
        const jsonR = await resR.json();
        if (!ignore) {
          if (jsonK?.success) {
            setDocs(jsonK.data.documents || []);
            setPosts(jsonK.data.posts || []);
          } else {
            setError(jsonK?.error || 'Failed to load knowledge base');
          }
          if (jsonR?.success) {
            setRefs(jsonR.data || []);
          }
        }
      } catch (e) {
        if (!ignore) setError('Failed to load knowledge base');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return <div className="p-6 text-sm text-neutral-600">Loading knowledge...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  // Combine references and documents into one stream, latest first
  const combined = [...(refs||[]).map(r => ({
    id: r.id,
    type: 'reference',
    title: r.clientName || r.anonymizedLabel || 'Client Reference',
    summary: r.anonymizedLabel || r.industryVertical || '',
    url: r.proofSheetUrl || r.narrativeUrl || r.slidesUrl || undefined,
    tags: (r.capabilities || []).slice(0,6),
    updatedAt: r.updatedAt
  })), ...(docs||[]).map((d:any) => ({
    id: d.id,
    type: 'document',
    title: d.title,
    summary: d.summary,
    url: d.url,
    tags: d.tags || [],
    updatedAt: d.updatedAt
  }))].sort((a:any,b:any)=> new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-1">
        <h3 className="text-lg font-bold text-neutral-900 mb-3">References & Documents</h3>
        <div className="space-y-3">
          {combined.map((item:any) => (
            <a key={`${item.type}-${item.id}`} href={item.url || '#'} target={item.url ? '_blank' : undefined} rel={item.url ? 'noreferrer' : undefined} className="block p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="font-medium text-neutral-900 mr-2 truncate">{item.title}</div>
                <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-200 text-neutral-600">{item.type}</span>
              </div>
              {item.summary && <div className="text-sm text-neutral-600 mt-1 line-clamp-2">{item.summary}</div>}
              {item.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.slice(0,6).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 text-xs bg-neutral-100 border border-neutral-200 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              <div className="text-xs text-neutral-500 mt-2">Updated {new Date(item.updatedAt).toLocaleDateString()}</div>
            </a>
          ))}
          {combined.length === 0 && <div className="text-sm text-neutral-600">No references or documents yet</div>}
        </div>
      </div>
      <div className="lg:col-span-1">
        <h3 className="text-lg font-bold text-neutral-900 mb-3">Team Posts</h3>
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="p-4 border border-neutral-200 rounded-xl">
              <div className="font-medium text-neutral-900">{p.title}</div>
              <div className="text-sm text-neutral-600 mt-1 line-clamp-3">{p.content}</div>
              {p.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags.slice(0,6).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 text-xs bg-neutral-100 border border-neutral-200 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              <div className="text-xs text-neutral-500 mt-2">Updated {new Date(p.updatedAt).toLocaleDateString()}</div>
            </div>
          ))}
          {posts.length === 0 && <div className="text-sm text-neutral-600">No posts yet</div>}
        </div>
      </div>
    </div>
  );
}

function ReferencesList() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/references');
        const json = await res.json();
        if (!ignore) {
          if (json?.success) setItems(json.data || []);
          else setError(json?.error || 'Failed to load references');
        }
      } catch (e) {
        if (!ignore) setError('Failed to load references');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return <div className="p-6 text-sm text-neutral-600">Loading references...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-600">
            <th className="py-3 px-4">Client / Label</th>
            <th className="py-3 px-4">Industry</th>
            <th className="py-3 px-4">Owner</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Confidentiality</th>
            <th className="py-3 px-4">Updated</th>
            <th className="py-3 px-4 text-right">Files</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
              <td className="py-3 px-4">
                <div className="font-medium text-neutral-900">{r.clientName}</div>
                {r.anonymizedLabel && <div className="text-xs text-neutral-500">{r.anonymizedLabel}</div>}
              </td>
              <td className="py-3 px-4">{r.industryVertical || '—'}</td>
              <td className="py-3 px-4">{r.ownerEmail || '—'}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 text-xs rounded-full border border-neutral-200">{r.status}</span>
              </td>
              <td className="py-3 px-4">{r.confidentialityLevel}</td>
              <td className="py-3 px-4">{new Date(r.updatedAt).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-right space-x-2">
                {r.proofSheetUrl && <a className="text-primary-600 underline" href={r.proofSheetUrl} target="_blank" rel="noreferrer">Proof</a>}
                {r.narrativeUrl && <a className="text-primary-600 underline" href={r.narrativeUrl} target="_blank" rel="noreferrer">Narrative</a>}
                {r.slidesUrl && <a className="text-primary-600 underline" href={r.slidesUrl} target="_blank" rel="noreferrer">Slides</a>}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className="py-6 px-4 text-center text-neutral-600" colSpan={7}>No references yet</td>
            </tr>
          )}
        </tbody>
      </table>
          </div>
  );
}

function ActivitiesPanel() {
  const [data, setData] = React.useState<{ tasks: any[]; meetings: any[]; clientActivities: any[] }>({ tasks: [], meetings: [], clientActivities: [] });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newTask, setNewTask] = React.useState({ title: '', dueDate: '' });
  const [newMeeting, setNewMeeting] = React.useState({ title: '', startsAt: '' });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/activities');
      const json = await res.json();
      if (json?.success) setData(json.data);
      else setError(json?.error || 'Failed to load activities');
    } catch (e) {
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // KPI computations and helpers
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
  const today = startOfDay(new Date());
  const tasksToday = React.useMemo(() => {
    return (data.tasks || []).filter((t: any) => {
      if (!t.dueDate) return false;
      const dd = new Date(t.dueDate);
      return dd >= today && dd <= endOfDay(today);
    }).length;
  }, [data.tasks]);
  const meetingsToday = React.useMemo(() => {
    return (data.meetings || []).filter((m: any) => {
      if (!m.startsAt) return false;
      const st = new Date(m.startsAt);
      return st >= today && st <= endOfDay(today);
    }).length;
  }, [data.meetings]);
  const overdueFollowups = React.useMemo(() => {
    return (data.tasks || []).filter((t: any) => {
      if (!t.dueDate) return false;
      const dd = new Date(t.dueDate);
      return dd < today;
    }).length;
  }, [data.tasks]);

  // 7‑day calendar
  const next7Days = React.useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return startOfDay(d);
  }), [today]);
  const meetingsByDay = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const d of next7Days) { map[d.toISOString()] = []; }
    for (const m of (data.meetings || [])) {
      if (!m.startsAt) continue;
      const st = new Date(m.startsAt);
      const key = startOfDay(st).toISOString();
      if (map[key]) map[key].push(m);
    }
    return map;
  }, [data.meetings, next7Days]);

  // Simple AI follow‑up suggestions
  const aiSuggestions = React.useMemo(() => {
    const out: Array<{ id: string; text: string }> = [];
    (data.tasks || [])
      .filter((t: any) => t.dueDate && new Date(t.dueDate) < today)
      .slice(0, 3)
      .forEach((t: any, idx: number) => {
        out.push({ id: `overdue-${t.id || idx}`, text: `Follow up on overdue task: “${t.title}” (due ${new Date(t.dueDate).toLocaleDateString()})` });
      });
    next7Days.slice(0, 3).forEach((d, idx) => {
      const key = d.toISOString();
      if ((meetingsByDay[key] || []).length === 0) {
        out.push({ id: `slot-${idx}`, text: `Schedule outreach on ${d.toLocaleDateString()} (no meetings set)` });
      }
    });
    return out.slice(0, 5);
  }, [data.tasks, next7Days, meetingsByDay, today]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    await fetch('/api/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'task', title: newTask.title, dueDate: newTask.dueDate || undefined }) });
    setNewTask({ title: '', dueDate: '' });
    load();
  };
  const addMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.startsAt) return;
    await fetch('/api/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'meeting', title: newMeeting.title, startsAt: newMeeting.startsAt }) });
    setNewMeeting({ title: '', startsAt: '' });
    load();
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
      <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Activities & Communications</h3>
            <p className="text-sm text-neutral-600">Today’s tasks and meetings, 7‑day calendar, AI suggestions, recent activity</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-neutral-200 rounded-xl min-w-0">
            <div className="text-xs text-neutral-600">Tasks Today</div>
            <div className="text-2xl font-bold text-neutral-900">{tasksToday}</div>
          </div>
          <div className="p-3 bg-white border border-neutral-200 rounded-xl min-w-0">
            <div className="text-xs text-neutral-600">Meetings Today</div>
            <div className="text-2xl font-bold text-neutral-900">{meetingsToday}</div>
          </div>
          <div className="p-3 bg-white border border-neutral-200 rounded-xl min-w-0">
            <div className="text-xs text-neutral-600">Overdue Follow-ups</div>
            <div className="text-2xl font-bold text-neutral-900">{overdueFollowups}</div>
          </div>
        </div>
      </div>
      {loading && <div className="p-6 text-sm text-neutral-600">Loading...</div>}
      {error && <div className="p-6 text-sm text-red-600">{error}</div>}
      {!loading && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-neutral-900">Today’s Tasks</h4>
            </div>
            <form onSubmit={addTask} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <input value={newTask.title} onChange={e=>setNewTask(s=>({ ...s, title: e.target.value }))} placeholder="New task" className="flex-1 min-w-0 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
              <input type="date" value={newTask.dueDate} onChange={e=>setNewTask(s=>({ ...s, dueDate: e.target.value }))} className="w-full sm:w-40 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
              <Button type="submit" size="sm">Add</Button>
            </form>
            <div className="space-y-2">
              {data.tasks.map((t:any) => (
                <div key={t.id} className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-900">{t.title}</div>
                    <div className="text-xs text-neutral-600">Due {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-200">{t.priority}</span>
                </div>
              ))}
              {data.tasks.length === 0 && <div className="text-sm text-neutral-600">No tasks</div>}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-neutral-900">Today’s Meetings</h4>
            </div>
            <form onSubmit={addMeeting} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <input value={newMeeting.title} onChange={e=>setNewMeeting(s=>({ ...s, title: e.target.value }))} placeholder="New meeting" className="flex-1 min-w-0 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
              <input type="datetime-local" value={newMeeting.startsAt} onChange={e=>setNewMeeting(s=>({ ...s, startsAt: e.target.value }))} className="w-full sm:w-56 px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
              <Button type="submit" size="sm">Add</Button>
            </form>
            <div className="space-y-2">
              {data.meetings.map((m:any) => (
                <div key={m.id} className="p-3 border border-neutral-200 rounded-lg">
                  <div className="font-medium text-neutral-900">{m.title}</div>
                  <div className="text-xs text-neutral-600">{new Date(m.startsAt).toLocaleString()}</div>
                </div>
              ))}
              {data.meetings.length === 0 && <div className="text-sm text-neutral-600">No meetings</div>}
                  </div>
                  </div>
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">AI Follow‑up Suggestions</h4>
            <div className="space-y-2 mb-4">
              {aiSuggestions.map(s => (
                <div key={s.id} className="p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                  <div className="text-sm text-neutral-900">{s.text}</div>
                </div>
              ))}
              {aiSuggestions.length === 0 && <div className="text-sm text-neutral-600">No suggestions right now</div>}
            </div>
            <h4 className="font-semibold text-neutral-900 mb-3">Recent Client Activity</h4>
            <div className="space-y-2">
              {data.clientActivities.map((a:any) => (
                <div key={a.id} className="p-3 border border-neutral-200 rounded-lg">
                  <div className="text-sm text-neutral-900">{a.action} • {a.resourceType}</div>
                  <div className="text-xs text-neutral-600">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {data.clientActivities.length === 0 && <div className="text-sm text-neutral-600">No recent activity</div>}
            </div>
          </div>
        </div>
      )}
      {/* 7‑day calendar list */}
      {!loading && (
        <div className="px-6 pb-6">
          <h4 className="font-semibold text-neutral-900 mb-3">Next 7 Days</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {next7Days.map((d) => {
              const key = d.toISOString();
              const dayMeetings = meetingsByDay[key] || [];
              const label = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={key} className="p-4 border border-neutral-200 rounded-xl bg-white min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-neutral-900">{label}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-200">{dayMeetings.length} meeting{dayMeetings.length===1?'':'s'}</span>
                  </div>
                  <div className="space-y-2">
                    {dayMeetings.map((m:any) => (
                      <div key={m.id} className="text-sm text-neutral-700">
                        <span className="text-neutral-500 mr-2">{new Date(m.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {m.title}
                      </div>
                    ))}
                    {dayMeetings.length === 0 && (
                      <div className="text-sm text-neutral-500">No meetings scheduled</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineKanban() {
  const stages: Array<{ key: any; label: string }> = [
    { key: 'LEAD', label: 'Lead' },
    { key: 'QUALIFIED', label: 'Qualified' },
    { key: 'PROPOSAL', label: 'Proposal' },
    { key: 'SHORTLIST', label: 'Shortlist' },
    { key: 'NEGOTIATION', label: 'Negotiation' },
    { key: 'WON', label: 'Won' },
    { key: 'LOST', label: 'Lost' },
  ];
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newDeal, setNewDeal] = React.useState({ name: '' });
  const [query, setQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('kanban');

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/opportunities');
      const json = await res.json();
      if (json?.success) setItems(json.data || []);
      else setError(json?.error || 'Failed to load pipeline');
    } catch (e) {
      setError('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const createDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.name) return;
    await fetch('/api/opportunities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newDeal.name }) });
    setNewDeal({ name: '' });
    load();
  };

  const moveTo = async (id: string, stage: string) => {
    await fetch('/api/opportunities', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, stage }) });
    load();
  };

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i:any) => (i.name || '').toLowerCase().includes(q));
  }, [items, query]);

  const stageColor: Record<string, string> = {
    LEAD: 'bg-blue-50 border-blue-200',
    QUALIFIED: 'bg-teal-50 border-teal-200',
    PROPOSAL: 'bg-yellow-50 border-yellow-200',
    SHORTLIST: 'bg-indigo-50 border-indigo-200',
    NEGOTIATION: 'bg-orange-50 border-orange-200',
    WON: 'bg-green-50 border-green-200',
    LOST: 'bg-red-50 border-red-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
      <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Pipeline & Deals</h3>
              <p className="text-sm text-neutral-600">Search and manage opportunities in Kanban or List</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setViewMode('kanban')} className={`px-3 py-2 rounded-lg text-sm border ${viewMode==='kanban'?'bg-primary-600 text-white border-primary-600':'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>Kanban</button>
              <button onClick={()=>setViewMode('list')} className={`px-3 py-2 rounded-lg text-sm border ${viewMode==='list'?'bg-primary-600 text-white border-primary-600':'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>List</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Search deals by name..."
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <form onSubmit={createDeal} className="flex items-center gap-2">
              <input value={newDeal.name} onChange={e=>setNewDeal({ name: e.target.value })} placeholder="New deal name" className="px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
              <button className="btn-primary px-3 py-2 rounded-lg text-sm" type="submit">Add</button>
            </form>
          </div>
        </div>
      </div>
      {loading && <div className="p-6 text-sm text-neutral-600">Loading...</div>}
      {error && <div className="p-6 text-sm text-red-600">{error}</div>}
      {!loading && viewMode==='kanban' && (
        <div className="p-4 overflow-x-scroll" style={{ scrollbarWidth: 'thin' }}>
          <div className="min-w-max grid grid-cols-7 gap-3">
            {stages.map((s) => (
              <div key={s.key} className={`w-80 border rounded-xl ${stageColor[s.key]} bg-opacity-50`}>
                <div className="px-3 py-2 border-b border-neutral-200 font-semibold text-neutral-800">{s.label}</div>
                <div className="p-3 space-y-2">
                  {filteredItems.filter(i=>i.stage===s.key).map((d:any)=> (
                    <div key={d.id} className="bg-white border border-neutral-200 rounded-lg p-3 shadow-soft">
                      <div className="font-medium text-neutral-900 truncate">{d.name}</div>
                      <div className="text-xs text-neutral-600">{d.value ? `${d.currency || 'EUR'} ${(d.value/100).toFixed(0)}k` : '—'}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <button className="text-xs px-2 py-1 border border-neutral-200 rounded" onClick={()=>moveTo(d.id, 'WON')}>Mark Won</button>
                        <button className="text-xs px-2 py-1 border border-neutral-200 rounded" onClick={()=>moveTo(d.id, 'LOST')}>Mark Lost</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && viewMode==='list' && (
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-600">
                <th className="py-2 px-3">Deal</th>
                <th className="py-2 px-3">Stage</th>
                <th className="py-2 px-3">Value</th>
                <th className="py-2 px-3">Probability</th>
                <th className="py-2 px-3">Updated</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((d:any)=> (
                <tr key={d.id} className="border-t border-neutral-100">
                  <td className="py-2 px-3 font-medium text-neutral-900 truncate">{d.name}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 text-xs rounded-full border border-neutral-200">{d.stage}</span>
                  </td>
                  <td className="py-2 px-3">{d.value ? `${d.currency || 'EUR'} ${(d.value/100).toFixed(0)}k` : '—'}</td>
                  <td className="py-2 px-3">{d.probability ? `${d.probability}%` : '—'}</td>
                  <td className="py-2 px-3">{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '—'}</td>
                  <td className="py-2 px-3 text-right space-x-2">
                    <button className="text-xs px-2 py-1 border border-neutral-200 rounded" onClick={()=>moveTo(d.id, 'WON')}>Won</button>
                    <button className="text-xs px-2 py-1 border border-neutral-200 rounded" onClick={()=>moveTo(d.id, 'LOST')}>Lost</button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td className="py-6 px-3 text-center text-neutral-600" colSpan={6}>No deals found</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
      )}
    </div>
  );
}

function ProjectsPanel() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/projects?status=ACTIVE&limit=20');
      const json = await res.json();
      if (res.ok) setItems(json?.projects || []);
      else setError(json?.error || 'Failed to load projects');
    } catch (e) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const progress = (p: any) => {
    const total = p.totalPositions ?? 0;
    const filled = p.filledPositions ?? 0;
    if (total > 0) return Math.min(100, Math.round((filled / total) * 100));
    // fallback using activities counts
    const sourced = p.candidatesSourced ?? 0;
    const presented = p.candidatesPresented ?? 0;
    const denom = Math.max(1, sourced);
    return Math.min(100, Math.round((presented / denom) * 100));
  };

  const riskColor = (p: any) => {
    const end = p.endDate ? new Date(p.endDate).getTime() : null;
    const now = Date.now();
    if (!end) return 'text-neutral-500';
    const daysLeft = Math.round((end - now) / (1000*60*60*24));
    if (daysLeft < 0) return 'text-red-600';
    if (daysLeft <= 14) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
      <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
        <h3 className="text-lg font-bold text-neutral-900">Project Status</h3>
        <p className="text-sm text-neutral-600">Active projects with progress and upcoming milestones</p>
          </div>
      {loading && <div className="p-6 text-sm text-neutral-600">Loading projects...</div>}
      {error && <div className="p-6 text-sm text-red-600">{error}</div>}
      {!loading && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((p:any) => (
            <div key={p.id} className="border border-neutral-200 rounded-2xl p-5 hover:shadow-medium glow-card transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-neutral-900 truncate">{p.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full border border-neutral-200 ${riskColor(p)}`}>{p.status}</span>
              </div>
              <div className="text-sm text-neutral-600 mb-3 truncate">{p.clientName} • {p.location || '—'}</div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-neutral-600">Progress</span>
                <span className="font-medium">{progress(p)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: `${progress(p)}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-neutral-600">Positions</div>
                  <div className="font-semibold text-neutral-900">{p.totalPositions ?? 0}</div>
                </div>
                <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-neutral-600">Jobs</div>
                  <div className="font-semibold text-neutral-900">{p._count?.jobs ?? 0}</div>
                </div>
                <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-neutral-600">Activities</div>
                  <div className="font-semibold text-neutral-900">{p._count?.activities ?? 0}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-neutral-600">
                {p.endDate ? (
                  <span className={riskColor(p)}>Deadline: {new Date(p.endDate).toLocaleDateString()}</span>
                ) : (
                  <span>Deadline: —</span>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-neutral-600">No active projects</div>}
        </div>
      )}
    </div>
  );
}

function ResourcesPanel() {
  const [available, setAvailable] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'matrix'>('list');

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/candidates?limit=100');
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            const list = (json?.data || json?.candidates || []).filter((c: any) => !c.archived);
            setAvailable(list);
          } else {
            setError(json?.error || 'Failed to load resources');
          }
        }
      } catch (e) {
        if (!ignore) setError('Failed to load resources');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((p: any) => {
      const displayName = (p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || '').toLowerCase();
      const allSkills = ([...(p.skills || []), ...(p.technicalSkills || []), ...(p.programmingLanguages || [])] as string[]);
      const skillsStr = allSkills.join(' ').toLowerCase();
      const title = (p.currentRole || p.currentTitle || '').toLowerCase();
      return displayName.includes(q) || skillsStr.includes(q) || title.includes(q);
    });
  }, [available, query]);

  const topSkills = React.useMemo(() => {
    const freq: Record<string, number> = {};
    filtered.forEach((p:any) => {
      const merged = [...(p.technicalSkills || []), ...(p.programmingLanguages || [])];
      const unique = Array.from(new Set(merged));
      unique.forEach((s:string) => {
        if (!s) return;
        freq[s] = (freq[s] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([s]) => s);
  }, [filtered]);

  const hasSkill = (p: any, s: string) => {
    const all = new Set([...(p.technicalSkills || []), ...(p.programmingLanguages || [])]);
    return all.has(s);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
      <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
            <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Resources & Skills</h3>
            <p className="text-sm text-neutral-600">Search consultants by name or skill; switch to skills matrix</p>
                  </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-lg text-sm border ${viewMode === 'list' ? 'bg-primary-600 text-white border-primary-600' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>List</button>
            <button onClick={() => setViewMode('matrix')} className={`px-3 py-2 rounded-lg text-sm border ${viewMode === 'matrix' ? 'bg-primary-600 text-white border-primary-600' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>Skills Matrix</button>
                  </div>
                  </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or skill..."
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
                </div>
        </div>
      </div>
      {loading && <div className="p-6 text-sm text-neutral-600">Loading resources...</div>}
      {error && <div className="p-6 text-sm text-red-600">{error}</div>}
      {!loading && viewMode === 'list' && (
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-600">
                <th className="py-2 px-3">Consultant</th>
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3">Key Skills</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const name = p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || '—';
                const skills = ([...(p.skills || []), ...(p.technicalSkills || []), ...(p.programmingLanguages || [])] as string[]).slice(0, 6);
                return (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className="py-2 px-3 font-medium text-neutral-900 truncate">{name}</td>
                    <td className="py-2 px-3 text-neutral-700 truncate">{p.currentRole || p.currentTitle || '—'}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {skills.map((s: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-neutral-100 border border-neutral-200 rounded-full">{s}</span>
                        ))}
                        {skills.length === 0 && <span className="text-xs text-neutral-500">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="py-6 px-3 text-center text-neutral-600" colSpan={3}>No consultants found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && viewMode === 'matrix' && (
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-600">
                <th className="py-2 px-3">Consultant</th>
                {topSkills.map((s) => (
                  <th key={s} className="py-2 px-3 text-center">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || '—';
                return (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className="py-2 px-3 font-medium text-neutral-900 truncate">{name}</td>
                    {topSkills.map((s) => (
                      <td key={s} className="py-2 px-3 text-center">
                        {hasSkill(p, s) ? (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary-600" />
                        ) : (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-neutral-200" />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FinancialsPanel() {
  const [opps, setOpps] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(()=>{
    let ignore=false;
    (async()=>{
      try {
        setLoading(true);
        const res = await fetch('/api/opportunities');
        const json = await res.json();
        if (!ignore) {
          if (json?.success) setOpps(json.data || []);
          else setError(json?.error || 'Failed to load financials');
        }
      } finally { if (!ignore) setLoading(false); }
    })();
    return ()=>{ ignore=true; };
  },[]);

  const sum = (arr:number[])=>arr.reduce((a,b)=>a+b,0);
  const pipeline = React.useMemo(()=>{
    const byStage: Record<string, any[]> = {};
    for (const o of opps) { (byStage[o.stage] ||= []).push(o); }
    const forecast = sum(opps.map((o:any)=> (o.value||0) * ((o.probability||0)/100)));
    const total = sum(opps.map((o:any)=> o.value||0));
    return { byStage, forecast, total };
  },[opps]);

  const target = 1000000; // placeholder target

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
      <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
        <h3 className="text-lg font-bold text-neutral-900">Financials & Reports</h3>
        <p className="text-sm text-neutral-600">Forecast vs target and pipeline funnel</p>
      </div>
      {loading && <div className="p-6 text-sm text-neutral-600">Loading...</div>}
      {error && <div className="p-6 text-sm text-red-600">{error}</div>}
      {!loading && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-neutral-200 rounded-xl p-4">
            <div className="text-sm text-neutral-600">Forecast</div>
            <div className="text-2xl font-bold text-neutral-900">€ {(pipeline.forecast/100).toFixed(0)}k</div>
            <div className="mt-2 text-xs text-neutral-600">Target: € {(target/1000).toFixed(0)}k</div>
            <div className="mt-3 w-full bg-neutral-200 rounded-full h-2">
              <div className="h-2 bg-primary-600 rounded-full" style={{ width: `${Math.min(100, (pipeline.forecast/target)*100)}%` }} />
            </div>
          </div>
          <div className="lg:col-span-2 border border-neutral-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-neutral-900 mb-2">Pipeline Funnel</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {['LEAD','QUALIFIED','PROPOSAL','SHORTLIST','NEGOTIATION','WON'].map((s)=> (
                <div key={s} className="p-2 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
                  <div className="text-xs text-neutral-600">{s}</div>
                  <div className="text-lg font-bold text-neutral-900">{(pipeline.byStage[s]||[]).length}</div>
                    </div>
                  ))}
                </div>
              </div>
        </div>
      )}
    </div>
  );
}

function AIInsightsPanel() {
  const [clients, setClients] = React.useState<any[]>([]);
  React.useEffect(()=>{ (async()=>{
    try {
      const res = await fetch('/api/clients?activeOnly=true&limit=50');
      const json = await res.json();
      if (res.ok) setClients(json?.data || []);
    } catch {}
  })(); },[]);

  const overdue = React.useMemo(()=>{
    const now = Date.now();
    return (clients||[]).filter((c:any)=>{
      const t = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
      const days = Math.floor((now - t)/(1000*60*60*24));
      return days > 30;
    }).slice(0,6);
  },[clients]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
      <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
        <h3 className="text-lg font-bold text-neutral-900">AI Insights & Automation</h3>
        <p className="text-sm text-neutral-600">Suggested follow-ups and risk alerts</p>
                  </div>
      <div className="p-6">
        <div className="mb-3 text-sm font-semibold text-neutral-900">Smart Reminders</div>
        <div className="space-y-2">
          {overdue.map((c:any)=> (
            <div key={c.id} className="p-3 border border-neutral-200 rounded-lg">
              <div className="text-sm text-neutral-900">Follow up with {c.name}</div>
              <div className="text-xs text-neutral-600">No recent activity in over 30 days</div>
                </div>
          ))}
          {overdue.length === 0 && <div className="text-sm text-neutral-600">No overdue follow-ups</div>}
              </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverData, setHoverData] = useState<Record<string, any>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [segment, setSegment] = useState<'all' | 'active' | 'favorites' | 'mine'>('all');
  const [industry, setIndustry] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'clients' | 'activities' | 'pipeline' | 'projects' | 'resources' | 'financials' | 'knowledge' | 'ai'>('clients');
  const [openKnowledgeModal, setOpenKnowledgeModal] = useState(false);
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);

  const fetchClients = async (search: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/clients?search=${encodeURIComponent(search)}&page=${p}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setItems(json?.data || []);
        setTotal(json?.pagination?.total || 0);
      } else {
        try {
          const j = await res.json();
          setError(j?.error || 'Failed to load clients');
        } catch {
          setError('Failed to load clients');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => fetchClients(query, page), 250);
    return () => clearTimeout(id);
  }, [query, page]);

  // Load/save favorites
  useEffect(() => {
    try {
      const raw = localStorage.getItem('client_favorites');
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('client_favorites', JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  const { user } = useUser();
  const myEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const activeCount = useMemo(() => items.filter(c => c.isActive).length, [items]);
  const openPositions = useMemo(() => items.reduce((sum, c) => sum + (c._count?.jobs || 0), 0), [items]);
  const industries = useMemo(() => Array.from(new Set((items || []).map((c: any) => c.industry).filter(Boolean))), [items]);
  const displayItems = useMemo(() => {
    let list = items as any[];
    if (segment === 'active') list = list.filter(c => c.isActive);
    if (segment === 'favorites') list = list.filter(c => favorites.includes(c.id));
    if (segment === 'mine' && myEmail) list = list.filter(c => (c.email || '').toLowerCase() === myEmail);
    if (industry) list = list.filter(c => (c.industry || '').toLowerCase() === industry.toLowerCase());
    return list;
  }, [items, segment, industry, favorites, myEmail]);
  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const onHoverClient = async (id: string | null) => {
    setHoverId(id);
    if (!id || hoverData[id]) return;
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      setHoverData(prev => ({ ...prev, [id]: json?.data }));
    } catch {}
  };
  const totalProjects = useMemo(() => items.reduce((sum, c) => sum + (c._count?.projects || 0), 0), [items]);
  const totalActivities = useMemo(() => items.reduce((sum, c) => sum + (c._count?.activities || 0), 0), [items]);
  const clientMetrics = [
    { label: 'Active Clients', value: String(activeCount), icon: Building, color: 'primary' },
    { label: 'Open Positions', value: String(openPositions), icon: Briefcase, color: 'teal' },
  ];

  // KPI Summary Bar derived from live data
  const kpiSummary = useMemo(() => {
    // Pipeline total = open positions across all clients (approximation)
    const pipelineTotal = openPositions;

    // Active projects already computed
    const activeProjects = totalProjects;

    // Utilization: mock derived from activities vs clients for now (placeholder until resource data available)
    const utilizationPct = items.length > 0
      ? Math.min(100, Math.round((totalActivities / Math.max(1, items.length)) * 12))
      : 0;

    // Upcoming deadlines approximation: count jobs nearing SLA within 7 days (requires jobs API on client fetch — optional enhancement)
    const upcomingDeadlines = 0;

    return [
      { label: 'Pipeline', value: pipelineTotal.toLocaleString(), icon: Briefcase, trend: '+12%' },
      { label: 'Active Projects', value: String(activeProjects), icon: Users2, trend: '+5%' },
      { label: 'Utilization', value: `${utilizationPct}%`, icon: Activity, trend: '+2%' },
      { label: 'Upcoming Deadlines', value: String(upcomingDeadlines), icon: Target, trend: '' },
    ];
  }, [openPositions, totalProjects, totalActivities, items.length]);

  // Aggregated industry stats derived from live data
  const industryStats = useMemo(() => {
    const map = new Map<string, { count: number; jobs: number; projects: number; activities: number }>();
    for (const c of items) {
      const key = (c.industry || 'Unspecified') as string;
      const current = map.get(key) || { count: 0, jobs: 0, projects: 0, activities: 0 };
      current.count += 1;
      current.jobs += c._count?.jobs || 0;
      current.projects += c._count?.projects || 0;
      current.activities += c._count?.activities || 0;
      map.set(key, current);
    }
    return Array.from(map.entries())
      .map(([name, m]) => ({ name, ...m }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const handleDelete = async (id: string) => {
    try {
      // @ts-ignore simple confirm in browser
      if (typeof window !== 'undefined' && !confirm('Delete this client?')) return;
    } catch {}
    const prev = items;
    setItems(prev.filter(c => c.id !== id));
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      fetchClients(query, page);
    } catch (e) {
      setItems(prev);
    }
  };

  const handleToggleActive = async (client: any) => {
    const prev = items;
    setItems(prev.map(c => (c.id === client.id ? { ...c, isActive: !c.isActive } : c)));
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !client.isActive })
      });
      if (!res.ok) throw new Error('Failed');
    } catch (e) {
      setItems(prev);
    }
  };

  // Removed static categories in favor of live industry aggregation

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <AnimatedPageTitle title="Clients" Icon={Building} />
              <p className="mt-1 text-sm text-gray-500">Manage your client relationships and track engagement & activities</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHeaderMetrics(v => !v)}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800"
              aria-expanded={showHeaderMetrics}
            >
              {showHeaderMetrics ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.47 8.47a.75.75 0 011.06 0l7 7a.75.75 0 11-1.06 1.06L12 9.56l-6.47 6.97a.75.75 0 11-1.06-1.06l7-7z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.53 15.53a.75.75 0 01-1.06 0l-7-7a.75.75 0 111.06-1.06L12 13.44l6.47-6.97a.75.75 0 111.06 1.06l-7 7z" clipRule="evenodd" /></svg>
              )}
              <span>{showHeaderMetrics ? 'Hide header overview' : 'Show header overview'}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters - aligned with /candidates page style */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <div className="flex-1 relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
              placeholder="Search clients by company, industry, contact..."
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <div className="hidden md:flex items-center space-x-2">
              <Button variant={segment==='all'?'primary':'outline'} size="sm" onClick={() => setSegment('all')}>All</Button>
              <Button variant={segment==='active'?'primary':'outline'} size="sm" onClick={() => setSegment('active')}>Active</Button>
              <Button variant={segment==='favorites'?'primary':'outline'} size="sm" onClick={() => setSegment('favorites')}>Favorites</Button>
              <Button variant={segment==='mine'?'primary':'outline'} size="sm" onClick={() => setSegment('mine')}>My Clients</Button>
            </div>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm bg-white min-w-[140px]"
            >
              <option value="">All industries</option>
              {industries.map((ind: string) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <Button size="sm" onClick={() => { setEditingClient(null); setOpenCreate(true); }}>
              <Plus className="h-4 w-4 mr-2" /> New Client
            </Button>
          </div>
        </div>

        {/* Top Metrics (single row: KPIs + Quick metrics) */}
        {showHeaderMetrics && (
          <div className="flex flex-nowrap items-stretch gap-3 overflow-x-auto mb-8">
            {kpiSummary.map((kpi, idx) => (
              <div key={`kpi-${idx}`} className="min-w-[200px] shrink-0 bg-white rounded-2xl p-5 shadow-soft border border-neutral-200 hover:shadow-medium transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{kpi.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-neutral-900">{kpi.value}</span>
                      {kpi.trend && <span className="text-xs text-green-600">{kpi.trend}</span>}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <kpi.icon className="h-5 w-5 text-neutral-600" />
                  </div>
                </div>
              </div>
            ))}
            {clientMetrics.map((metric, index) => (
              <div key={`metric-${index}`} className="min-w-[200px] shrink-0 bg-white rounded-2xl p-5 shadow-soft border border-neutral-200 hover:shadow-medium transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-neutral-900">{metric.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-${metric.color}-50`}>
                    <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Removed legacy top search bar */}

        {/* Tabs - matching competence-files style */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'clients', label: 'Clients', count: displayItems.length },
              { key: 'activities', label: 'Activities & Comms', count: 0 },
              { key: 'pipeline', label: 'Pipeline & Deals', count: 0 },
              { key: 'projects', label: 'Project Status', count: 0 },
              { key: 'resources', label: 'Resource & Skills', count: 0 },
              { key: 'financials', label: 'Financials & Reports', count: 0 },
              { key: 'knowledge', label: 'Knowledge & Collab', count: 0 },
              { key: 'ai', label: 'AI Insights & Automation', count: 0 },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === item.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label} {item.count > 0 && `(${item.count})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Section: Clients */}
        {activeSection === 'clients' && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
              <div className="p-6">
                {error && (
                  <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}
                {loading && <div className="text-sm text-neutral-600">Loading...</div>}
                {!loading && displayItems.length === 0 && (
                  <div className="text-sm text-neutral-600">No clients found</div>
                )}
                {!loading && displayItems.length > 0 && (
                  <div className="space-y-4">
                    {displayItems.map((client) => {
                      const initials = (client.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div
                          data-test="client-card"
                          key={client.id}
                          className={`bg-white border border-gray-200 border-l-4 border-l-primary-500 rounded-lg p-3 glow-card transition-all duration-200 group cursor-pointer`}
                          onClick={() => { setDrawerClientId(client.id); setOpenDrawer(true); }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>{client.isActive ? 'Active' : 'Inactive'}</span>
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    {(client._count?.jobs || 0)} positions
                                  </span>
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                                    Projects: {client._count?.projects || 0}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1 truncate">
                                  {client.industry && <span className="truncate">{client.industry}</span>}
                                  {client.email && (
                                    <span className="flex items-center truncate"><Mail className="h-3 w-3 mr-1" />{client.email}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-4 relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingClient(client); setOpenCreate(true); }}
                                className="hidden" aria-hidden="true"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); setDrawerClientId(client.id); setOpenDrawer(true); }}
                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="View"
                                aria-label="View"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); /* expand inline details in future; placeholder toggle */ }}
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Expand"
                                aria-label="Expand"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === client.id ? null : client.id); }}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                  title="More actions"
                                  aria-haspopup="menu"
                                  aria-expanded={openDropdown === client.id}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {openDropdown === client.id && (
                                  <div className="absolute right-0 top-8 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                    <button
                                      onClick={() => { setEditingClient(client); setOpenCreate(true); setOpenDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >Edit</button>
                                    <button
                                      onClick={() => { handleDelete(client.id); setOpenDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >Delete</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {total > limit && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-neutral-600">Page {page} of {Math.max(1, Math.ceil(total / limit))}</div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                      <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section: Activities & Comms */}
        {activeSection === 'activities' && (
          <div className="mb-8">
            <ActivitiesPanel />
                      </div>
        )}

        {/* Section: Pipeline & Deals */}
        {activeSection === 'pipeline' && (
          <div className="mb-8">
            <PipelineKanban />
                      </div>
        )}

        {/* Section: Project Status */}
        {activeSection === 'projects' && (
          <div className="mb-8">
            <ProjectsPanel />
                    </div>
        )}

        {/* Section: Resources & Skills */}
        {activeSection === 'resources' && (
          <div className="mb-8">
            <ResourcesPanel />
                    </div>
        )}

        {/* Section: Financials & Reports */}
        {activeSection === 'financials' && (
          <div className="mb-8">
            <FinancialsPanel />
                  </div>
        )}

        {/* Section: AI Insights */}
        {activeSection === 'ai' && (
          <div className="mb-8">
            <AIInsightsPanel />
                </div>
        )}

        {/* Knowledge & Collaboration (includes References) */}
        {activeSection === 'knowledge' && (
        <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Knowledge & Collaboration</h2>
              <p className="text-neutral-600">Case studies, references, templates, and team posts</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={() => setOpenKnowledgeModal(true)}>
                Upload & Convert
              </Button>
              <Button type="button" onClick={() => setOpenKnowledgeModal(true)}>
                Create Reference
              </Button>
            </div>
                  </div>
                  
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
            <div className="p-4 border-b border-neutral-200 flex items-center gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search knowledge base (title, summary, tags)..."
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={query}
                  onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                />
                    </div>
              <select
                className="px-2 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onChange={(e) => setIndustry(e.target.value)}
                value={industry}
              >
                <option value="">All types</option>
                <option value="CASE_STUDY">Case Studies</option>
                <option value="CLIENT_REFERENCE">Client References</option>
                <option value="PROJECT_REFERENCE">Project References</option>
                <option value="TEMPLATE">Templates</option>
                <option value="WHITEPAPER">Whitepapers</option>
                <option value="PLAYBOOK">Playbooks</option>
              </select>
                  </div>
            <KnowledgeList />
          </div>
        </div>
        )}

        {/* Client Portfolio (Industry Overview) */}
        {activeSection === 'clients' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Client Portfolio</h2>
              <p className="text-neutral-600">Overview of your client base by industry</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Portfolio Analytics
                  </Button>
                </div>
              </div>
                  
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-600">
                    <th className="py-3 px-4">Industry</th>
                    <th className="py-3 px-4 text-right">Clients</th>
                    <th className="py-3 px-4 text-right">Open Positions</th>
                    <th className="py-3 px-4 text-right">Projects</th>
                    <th className="py-3 px-4 text-right">Activities</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {industryStats.map((row) => (
                    <tr key={row.name} className="border-t border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium text-neutral-900">{row.name}</td>
                      <td className="py-3 px-4 text-right">{row.count}</td>
                      <td className="py-3 px-4 text-right">{row.jobs}</td>
                      <td className="py-3 px-4 text-right">{row.projects}</td>
                      <td className="py-3 px-4 text-right">{row.activities}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                  {industryStats.length === 0 && (
                    <tr>
                      <td className="py-6 px-4 text-center text-neutral-600" colSpan={6}>No data yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        </div>
        </div>
        )}

        

        {/* Quick Actions */}
        {activeSection === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { 
              title: 'Relationship Mapping', 
              description: 'Visualize and track client relationships and touchpoints',
              icon: Activity,
              color: 'primary',
              action: 'View Map'
            },
            { 
              title: 'Proposal Generator', 
              description: 'Create professional proposals with AI assistance',
              icon: FileText,
              color: 'teal',
              action: 'Generate Proposal'
            },
            { 
              title: 'Performance Reports', 
              description: 'Detailed analytics on client satisfaction and retention',
              icon: BarChart3,
              color: 'accent',
              action: 'View Reports'
            }
          ].map((action, index) => (
            <div key={index} className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300 group h-full flex flex-col">
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-${action.color}-50 rounded-xl mb-4`}>
                <action.icon className={`h-6 w-6 text-${action.color}-600`} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{action.title}</h3>
              <p className="text-sm text-neutral-600 mb-4">{action.description}</p>
              <Button variant="outline" fullWidth className="mt-auto">
                {action.action}
              </Button>
            </div>
          ))}
        </div>
        )}

        {/* AI Features */}
        {activeSection === 'clients' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
          <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900">Client Intelligence</h3>
            <p className="text-sm text-neutral-600">AI-powered insights to strengthen client relationships and drive growth</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Engagement Scoring', description: 'AI-powered client health and satisfaction metrics', icon: Target },
                { title: 'Opportunity Detection', description: 'Identify upselling and expansion opportunities', icon: TrendingUp },
                { title: 'Communication Insights', description: 'Optimize touchpoints and relationship building', icon: MessageSquare },
                { title: 'Retention Prediction', description: 'Early warning system for client risk assessment', icon: Shield }
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-3">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h4 className="font-semibold text-neutral-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
      {/* Modals/Drawers */}
      <CreateClientModal
        open={openCreate}
        onClose={() => { setOpenCreate(false); setEditingClient(null); }}
        editingClient={editingClient}
        onSaved={() => fetchClients(query, page)}
      />
      <ClientDrawer open={openDrawer} onClose={() => setOpenDrawer(false)} clientId={drawerClientId} />
      <CreateKnowledgeFileModal
        isOpen={openKnowledgeModal}
        onClose={() => setOpenKnowledgeModal(false)}
        onSuccess={() => setOpenKnowledgeModal(false)}
      />
    </Layout>
  );
} 