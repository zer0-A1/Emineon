'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Search, Mail, Phone, MapPin, UserCircle2, MoreVertical, Edit3, Trash2, Filter, ChevronLeft, ChevronRight, Building2, Tag } from 'lucide-react';

type Influence = '' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXECUTIVE';

export function ClientProfileModal({ clientId, open, onClose }: { clientId: string | null; open: boolean; onClose: () => void; }) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'contacts' | 'overview' | 'projects'>('contacts');

  // Contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [filterDM, setFilterDM] = useState<boolean | null>(null);
  const [filterInfluence, setFilterInfluence] = useState<Influence>('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<any>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !clientId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        const json = await res.json();
        if (res.ok && json?.success) {
          setClient(json.data);
          setContacts(json.data.contacts || []);
        } else {
          setClient(null);
          setContacts([]);
        }
      } finally { setLoading(false); }
    })();
  }, [open, clientId]);

  const list = useMemo(() => {
    const base = results ?? contacts;
    return base.filter((c:any) => {
      if (filterDM != null) {
        if ((filterDM === true) && !c.is_decision_maker) return false;
        if ((filterDM === false) && !!c.is_decision_maker) return false;
      }
      if (filterInfluence && (c.influence_level || '') !== filterInfluence) return false;
      if (filterDepartment && !(c.department || '').toLowerCase().includes(filterDepartment.toLowerCase())) return false;
      return true;
    });
  }, [results, contacts, filterDM, filterInfluence, filterDepartment]);

  useEffect(() => {
    if (!open || !clientId) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      const q = query.trim();
      if (!q) { setResults(null); setSearching(false); return; }
      try {
        setSearching(true);
        const res = await fetch(`/api/clients/contacts/search?q=${encodeURIComponent(q)}&clientId=${encodeURIComponent(clientId)}&limit=50`, { signal: controller.signal });
        const json = await res.json();
        if (res.ok && json?.success) setResults(json.data || []); else setResults([]);
      } catch {
        setResults([]);
      } finally { setSearching(false); }
    }, 300);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query, open, clientId]);

  const beginEdit = (c:any) => { setEditingId(c.id); setEditDraft({ name: c.name || '', title: c.title || '', email: c.email || '', department: c.department || '', tags: (c.tags||[]).join(', '), is_dm: !!c.is_decision_maker, influence: c.influence_level || '' }); };
  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };
  const saveEdit = async (id: string) => {
    const payload:any = {
      name: editDraft.name,
      title: editDraft.title,
      email: editDraft.email,
      department: editDraft.department,
      tags: String(editDraft.tags||'').split(',').map((s:string)=>s.trim()).filter(Boolean),
      isDecisionMaker: !!editDraft.is_dm,
      influenceLevel: editDraft.influence as Influence,
    };
    const res = await fetch(`/api/clients/contacts/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const json = await res.json();
    if (res.ok && json?.success) {
      setContacts(prev => prev.map(c => c.id===id ? json.data : c));
      setResults(prev => prev ? prev.map(c => c.id===id ? json.data : c) : prev);
      cancelEdit();
    }
  };
  const deleteContact = async (id: string) => {
    const res = await fetch(`/api/clients/contacts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setContacts(prev => prev.filter(c => c.id !== id));
      setResults(prev => prev ? prev.filter(c => c.id !== id) : prev);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ left: 'var(--sidebar-width, 0px)' }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex">
        <div className="w-full h-full bg-white shadow-xl rounded-none overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-100"><Building2 className="h-5 w-5 text-primary-700" /></div>
              <div>
                <div className="text-xl font-semibold text-neutral-900">{client?.name || 'Client'}</div>
                <div className="text-xs text-neutral-600">Contacts & Organization</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100"><X className="h-5 w-5 text-neutral-600" /></button>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 px-4">
            <nav className="-mb-px flex space-x-6">
              {[
                { id:'contacts', label:'Contacts' },
                { id:'overview', label:'Overview' },
                { id:'projects', label:'Projects' },
              ].map(t => (
                <button key={t.id} onClick={()=>setActiveTab(t.id as any)} className={`py-3 border-b-2 text-sm font-medium ${activeTab===t.id? 'border-primary-600 text-primary-700':'border-transparent text-neutral-600 hover:text-neutral-800 hover:border-neutral-300'}`}>{t.label}</button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab==='contacts' && (
              <div className="space-y-4">
                {/* Search + Filters */}
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Vector search by name, title, department, notes..." className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">Searching…</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={filterInfluence} onChange={e=>setFilterInfluence(e.target.value as any)} className="px-2 py-2 border border-neutral-200 rounded-lg text-sm">
                      <option value="">Influence</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="EXECUTIVE">Executive</option>
                    </select>
                    <select value={filterDM===null? '': (filterDM? 'yes':'no')} onChange={e=> setFilterDM(e.target.value===''? null : e.target.value==='yes')} className="px-2 py-2 border border-neutral-200 rounded-lg text-sm">
                      <option value="">All</option>
                      <option value="yes">Decision Makers</option>
                      <option value="no">Non Decision</option>
                    </select>
                    <input value={filterDepartment} onChange={e=>setFilterDepartment(e.target.value)} placeholder="Department" className="px-2 py-2 border border-neutral-200 rounded-lg text-sm" />
                  </div>
                </div>

                {/* Contacts list */}
                <div className="space-y-2">
                  {list.map((c:any)=> (
                    <div key={c.id} className="border rounded-lg p-3 hover:shadow-sm transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700"><UserCircle2 className="h-6 w-6" /></div>
                          <div className="min-w-0">
                            {editingId===c.id ? (
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                <input className="px-2 py-1 border rounded text-sm" value={editDraft.name} onChange={e=>setEditDraft((d:any)=>({ ...d, name:e.target.value }))} placeholder="Full name" />
                                <input className="px-2 py-1 border rounded text-sm" value={editDraft.title} onChange={e=>setEditDraft((d:any)=>({ ...d, title:e.target.value }))} placeholder="Title" />
                                <input className="px-2 py-1 border rounded text-sm" value={editDraft.email} onChange={e=>setEditDraft((d:any)=>({ ...d, email:e.target.value }))} placeholder="Email" />
                                <input className="px-2 py-1 border rounded text-sm" value={editDraft.department} onChange={e=>setEditDraft((d:any)=>({ ...d, department:e.target.value }))} placeholder="Department" />
                                <input className="px-2 py-1 border rounded text-sm" value={editDraft.tags} onChange={e=>setEditDraft((d:any)=>({ ...d, tags:e.target.value }))} placeholder="Tags (comma)" />
                                <div className="flex items-center gap-2">
                                  <select className="px-2 py-1 border rounded text-sm" value={editDraft.influence} onChange={e=>setEditDraft((d:any)=>({ ...d, influence:e.target.value }))}>
                                    <option value="">Influence</option>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="EXECUTIVE">Executive</option>
                                  </select>
                                  <label className="inline-flex items-center gap-2 text-xs text-neutral-700"><input type="checkbox" checked={!!editDraft.is_dm} onChange={e=>setEditDraft((d:any)=>({ ...d, is_dm: e.target.checked }))} /> Decision</label>
                                </div>
                                <div className="flex items-center gap-2 col-span-full">
                                  <button className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm" onClick={()=>saveEdit(c.id)}>Save</button>
                                  <button className="px-3 py-1.5 border rounded text-sm" onClick={cancelEdit}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="font-medium text-neutral-900 truncate">{c.name}</div>
                                  {c.title && <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">{c.title}</span>}
                                  {c.is_decision_maker && <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full border border-green-200">Decision</span>}
                                  {c.influence_level && <span className="px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded-full border border-primary-200">{c.influence_level}</span>}
                                </div>
                                <div className="mt-1 text-xs text-neutral-600 flex flex-wrap gap-2">
                                  {c.department && <span className="px-2 py-0.5 bg-neutral-100 rounded">{c.department}</span>}
                                  {c.email && <span className="inline-flex items-center"><Mail className="h-3 w-3 mr-1" />{c.email}</span>}
                                  {c.phone && <span className="inline-flex items-center"><Phone className="h-3 w-3 mr-1" />{c.phone}</span>}
                                  {c.location && <span className="inline-flex items-center"><MapPin className="h-3 w-3 mr-1" />{c.location}</span>}
                                  {Array.isArray(c.tags) && c.tags.slice(0,3).map((t:string, i:number)=> (<span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 rounded"><Tag className="h-3 w-3" />{t}</span>))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <button onClick={()=> setOpenMenuId(id=> id===c.id? null : c.id)} className="p-1.5 rounded hover:bg-neutral-100"><MoreVertical className="h-4 w-4" /></button>
                          {openMenuId===c.id && (
                            <div className="absolute right-0 top-7 bg-white border rounded shadow-lg w-36 z-10">
                              <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2" onClick={()=>{ setOpenMenuId(null); beginEdit(c); }}><Edit3 className="h-4 w-4" /> Edit</button>
                              <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={()=>{ setOpenMenuId(null); deleteContact(c.id); }}><Trash2 className="h-4 w-4" /> Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {list.length===0 && !loading && (
                    <div className="text-sm text-neutral-600">No contacts match filters{query? ' / search':''}.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab==='overview' && (
              <div className="text-sm text-neutral-600">Overview coming soon.</div>
            )}
            {activeTab==='projects' && (
              <div className="text-sm text-neutral-600">Projects coming soon.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


