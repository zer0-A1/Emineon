'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Building2, Mail, Phone, MapPin, Briefcase, Users2, BarChart3, X, UserCircle2, ChevronDown, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { ClientProfileModal } from '@/components/clients/ClientProfileModal';

interface ClientDrawerProps {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
}

export function ClientDrawer({ open, onClose, clientId }: ClientDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<any | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      if (!open || !clientId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        if (res.ok) {
          const json = await res.json();
          setClient(json?.data || null);
        } else {
          setClient(null);
        }
      } catch (e) {
        setClient(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, clientId]);

  // Listen for deletions to update local state
  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id;
      if (!id) return;
      setClient((prev:any)=> prev ? { ...prev, contacts: (prev.contacts||[]).filter((c:any)=> c.id !== id), _count: { ...(prev._count||{}), contacts: Math.max(0, (prev?._count?.contacts||1)-1) } } : prev);
    };
    (window as any).addEventListener('client-contact-deleted', handler);
    return () => { (window as any).removeEventListener('client-contact-deleted', handler); };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full shadow-xl border-l border-neutral-200 overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg"><Building2 className="h-6 w-6 text-primary-600" /></div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Client Details</h3>
              <p className="text-sm text-neutral-600">Quick overview and related activity</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading ? (
            <div className="text-sm text-neutral-600">Loading...</div>
          ) : !client ? (
            <div className="text-sm text-neutral-600">No client found</div>
          ) : (
            <>
              {/* Header card */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-semibold text-neutral-900">{client.name}</h4>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-neutral-700">
                        {client.industry && <span className="px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200">{client.industry}</span>}
                        {client.contactPerson && <span className="px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200">{client.contactPerson}</span>}
                        {client.email && (
                          <span className="inline-flex items-center px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200">
                            <Mail className="h-3 w-3 mr-1" /> {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="inline-flex items-center px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200">
                            <Phone className="h-3 w-3 mr-1" /> {client.phone}
                          </span>
                        )}
                        {client.address && (
                          <span className="inline-flex items-center px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200">
                            <MapPin className="h-3 w-3 mr-1" /> {client.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-600 mb-1 inline-flex items-center"><Briefcase className="h-3 w-3 mr-1"/>Open Jobs</div>
                  <div className="text-xl font-semibold">{client._count?.jobs || 0}</div>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-600 mb-1 inline-flex items-center"><Users2 className="h-3 w-3 mr-1"/>Projects</div>
                  <div className="text-xl font-semibold">{client._count?.projects || 0}</div>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                  <div className="text-xs text-neutral-600 mb-1 inline-flex items-center"><BarChart3 className="h-3 w-3 mr-1"/>Activities</div>
                  <div className="text-xl font-semibold">{client._count?.activities || 0}</div>
                </div>
              </div>

              {/* Org Chart / Contacts */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-neutral-900">Organization Contacts</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-600">{client._count?.contacts || (client.contacts?.length || 0)} contacts</span>
                      <button onClick={()=> setOpenModal(true)} className="px-2 py-1 text-xs border rounded hover:bg-neutral-50">Open Contacts</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(client.contacts || []).filter((c:any)=>!c.manager_id).map((root:any)=> (
                      <OrgNode key={root.id} node={root} all={client.contacts || []} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                    {(!client.contacts || client.contacts.length===0) && (
                      <div className="text-sm text-neutral-600">No contacts yet</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <CreateContactInline clientId={client.id} onCreated={(c:any)=> setClient((prev:any)=> ({ ...prev, contacts: [c, ...(prev?.contacts||[])], _count: { ...(prev?._count||{}), contacts: (prev?._count?.contacts||0)+1 } }))} />
                  </div>
                </CardContent>
              </Card>

              {/* Related */}
              <Card>
                <CardContent className="p-5">
                  <h5 className="text-sm font-semibold text-neutral-900 mb-3">Recent Jobs</h5>
                  <div className="space-y-2 text-sm">
                    {(client.jobs || []).slice(0, 5).map((j: any) => (
                      <div key={j.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <div className="font-medium">{j.title}</div>
                          <div className="text-neutral-600 text-xs">{new Date(j.createdAt).toLocaleDateString()} • {j.status}</div>
                        </div>
                        <Button variant="outline" size="sm">Open</Button>
                      </div>
                    ))}
                    {(!client.jobs || client.jobs.length === 0) && (
                      <div className="text-neutral-600">No jobs yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h5 className="text-sm font-semibold text-neutral-900 mb-3">Projects</h5>
                  <div className="space-y-2 text-sm">
                    {(client.projects || []).slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-neutral-600 text-xs">{p.status}</div>
                        </div>
                        <Button variant="outline" size="sm">Open</Button>
                      </div>
                    ))}
                    {(!client.projects || client.projects.length === 0) && (
                      <div className="text-neutral-600">No projects yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      <ClientProfileModal clientId={clientId} open={openModal} onClose={()=> setOpenModal(false)} />
    </div>
  );
}


function OrgNode({ node, all, expanded, setExpanded }: { node: any; all: any[]; expanded: Record<string, boolean>; setExpanded: (v: any) => void }) {
  const children = (all || []).filter((c:any)=> c.manager_id === node.id);
  const isOpen = !!expanded[node.id];
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name || '');
  const [title, setTitle] = useState(node.title || '');
  const [email, setEmail] = useState(node.email || '');
  const [department, setDepartment] = useState(node.department || '');
  const [tags, setTags] = useState<string>((node.tags || []).join(', '));
  const [isDM, setIsDM] = useState(!!node.is_decision_maker);
  const [influence, setInfluence] = useState(node.influence_level || '');
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <input className="px-2 py-1 border rounded text-sm" value={name} onChange={e=>setName(e.target.value)} />
                  <input className="px-2 py-1 border rounded text-sm" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
                </>
              ) : (
                <>
                  <div className="font-medium text-neutral-900">{node.name}</div>
                  {node.title && <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">{node.title}</span>}
                </>
              )}
              {node.role && <span className="px-2 py-0.5 text-xs bg-neutral-50 text-neutral-700 rounded-full border border-neutral-200">{node.role}</span>}
            </div>
            <div className="mt-1 text-xs text-neutral-600 flex flex-wrap gap-2">
              {node.department && <span className="px-2 py-0.5 bg-neutral-100 rounded">{node.department}</span>}
              {editing ? (
                <input className="px-2 py-0.5 border rounded text-xs" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
              ) : (
                node.email && <span className="inline-flex items-center"><Mail className="h-3 w-3 mr-1" />{node.email}</span>
              )}
              {node.phone && <span className="inline-flex items-center"><Phone className="h-3 w-3 mr-1" />{node.phone}</span>}
              {node.location && <span className="inline-flex items-center"><MapPin className="h-3 w-3 mr-1" />{node.location}</span>}
              {node.is_decision_maker && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">Decision Maker</span>}
              {node.influence_level && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">{node.influence_level}</span>}
              {Array.isArray(node.tags) && node.tags.slice(0,3).map((t:string, i:number)=> (
                <span key={i} className="px-2 py-0.5 bg-neutral-100 rounded">{t}</span>
              ))}
            </div>
            {editing && (
              <div className="mt-2 flex gap-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
                  <input className="px-2 py-1 border rounded text-sm" value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Department" />
                  <input className="px-2 py-1 border rounded text-sm" value={tags} onChange={e=>setTags(e.target.value)} placeholder="Tags (comma separated)" />
                  <select className="px-2 py-1 border rounded text-sm" value={influence} onChange={e=>setInfluence(e.target.value)}>
                    <option value="">Influence</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="EXECUTIVE">Executive</option>
                  </select>
                  <label className="inline-flex items-center gap-2 text-xs text-neutral-700"><input type="checkbox" checked={isDM} onChange={e=>setIsDM(e.target.checked)} /> Decision Maker</label>
                </div>
                <button
                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded"
                  onClick={async()=>{
                    const res = await fetch(`/api/clients/contacts/${node.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, title, email, department, tags: tags.split(',').map(s=>s.trim()).filter(Boolean), isDecisionMaker: isDM, influenceLevel: influence }) });
                    if (res.ok) { setEditing(false); }
                  }}
                >Save</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={()=>{ setEditing(false); setName(node.name||''); setTitle(node.title||''); setEmail(node.email||''); }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {children.length>0 && (
            <button onClick={()=> setExpanded((s:any)=> ({ ...s, [node.id]: !isOpen }))} className="p-1.5 rounded hover:bg-neutral-100" title={isOpen? 'Collapse' : 'Expand'}>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen? 'rotate-180' : ''}`} />
            </button>
          )}
          <div className="relative">
            <button onClick={()=> setMenuOpen(v=>!v)} className="p-1.5 rounded hover:bg-neutral-100"><MoreVertical className="h-4 w-4" /></button>
            {menuOpen && (
              <div className="absolute right-0 top-7 bg-white border rounded shadow-lg w-36 z-10">
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2" onClick={()=>{ setMenuOpen(false); setEditing(true); }}><Edit3 className="h-4 w-4" /> Edit</button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={async()=>{ setMenuOpen(false); await fetch(`/api/clients/contacts/${node.id}`, { method:'DELETE' }); (window as any).dispatchEvent(new CustomEvent('client-contact-deleted', { detail: { id: node.id } })); }}><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && children.length>0 && (
        <div className="mt-2 pl-6 border-l-2 border-neutral-200 space-y-2">
          {children.map((child:any)=> (
            <OrgNode key={child.id} node={child} all={all} expanded={expanded} setExpanded={setExpanded} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateContactInline({ clientId, onCreated }: { clientId: string; onCreated: (c:any)=>void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/clients/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, name, title, email })
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        onCreated(json.data);
        setName(''); setTitle(''); setEmail(''); setOpen(false);
      }
    } finally { setSaving(false); }
  };
  return (
    <div className="border rounded-lg p-3 bg-neutral-50">
      {!open ? (
        <button onClick={()=>setOpen(true)} className="text-sm text-primary-600 hover:text-primary-700">+ Add contact</button>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="px-2 py-1 border rounded" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="px-2 py-1 border rounded" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="px-2 py-1 border rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <div className="flex gap-2">
            <button disabled={saving} className="px-3 py-1 bg-primary-600 text-white rounded text-sm disabled:opacity-50">Save</button>
            <button type="button" onClick={()=>{ setOpen(false); }} className="px-3 py-1 border rounded text-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

