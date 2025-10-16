"use client";
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { create } from 'zustand';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import DOMPurify from 'isomorphic-dompurify';
import { aiRewrite } from '@/lib/ai';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Trash2, Calendar, MapPin } from 'lucide-react';

type Section = { id: string; kind: string; title: string; html: string; order?: number; visible?: boolean };
type CV = { id: string; sections: Section[] };

type InlineState = {
  cv: CV;
  activeId: string | null;
  setActive: (id: string | null) => void;
  updateSection: (id: string, html: string) => void;
  setSectionVisible: (id: string, visible: boolean) => void;
  removeSection: (id: string) => void;
};

export const useInlineStore = create<InlineState>((set) => ({
  cv: { id: 'cv', sections: [] },
  activeId: null,
  setActive: (id) => set({ activeId: id }),
  updateSection: (id, html) => set((s) => ({
    cv: { ...s.cv, sections: s.cv.sections.map(sec => sec.id === id ? { ...sec, html } : sec) }
  })),
  setSectionVisible: (id, visible) => set((s) => ({
    cv: { ...s.cv, sections: s.cv.sections.map(sec => sec.id === id ? { ...sec, visible } : sec) }
  })),
  removeSection: (id) => set((s) => ({
    cv: { ...s.cv, sections: s.cv.sections.filter(sec => sec.id !== id) }
  })),
}));

function useDebounced(fn: () => void, deps: any[], ms: number) {
  useEffect(() => {
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function toStrongHtml(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function buildHtmlFromBoldCategories(raw: string): string | null {
  const text = raw.trim();
  const matches = Array.from(text.matchAll(/\*\*([^*]+)\*\*/g));
  if (matches.length === 0) return null;
  let html = '';
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const start = (current.index || 0) + current[0].length;
    const end = next ? (next.index as number) : text.length;
    const category = current[1].trim();
    const slice = text.slice(start, end);
    const items = slice.split('•').map(s => s.trim()).filter(Boolean);
    html += `<p><strong>${category}</strong></p>`;
    if (items.length > 0) {
      html += `<ul>${items.map(it => `<li>${toStrongHtml(it)}</li>`).join('')}</ul>`;
    }
  }
  return html;
}

function buildHtmlFromBullets(raw: string): string | null {
  if (!raw.includes('•')) return null;
  const items = raw.split('•').map(s => s.trim()).filter(Boolean);
  if (items.length === 0) return null;
  return `<ul>${items.map(it => `<li>${toStrongHtml(it)}</li>`).join('')}</ul>`;
}

function normalizeSectionHtml(possibleHtml: string, title: string): string {
  if (!possibleHtml) return '';
  const looksLikeHtml = /<\w+[^>]*>/.test(possibleHtml);
  if (looksLikeHtml) {
    return DOMPurify.sanitize(possibleHtml);
  }
  const raw = possibleHtml.replace(/\r\n|\r/g, '\n').trim();
  // Try category-based parsing first (common for Technical/Functional/Experience)
  const catHtml = buildHtmlFromBoldCategories(raw);
  if (catHtml) return DOMPurify.sanitize(catHtml);
  // Try simple bullets
  const bulletHtml = buildHtmlFromBullets(raw);
  if (bulletHtml) return DOMPurify.sanitize(bulletHtml);
  // Fallback to paragraphs, keep strong markers
  const paragraphs = raw
    .split(/\n{2,}/)
    .map(p => `<p>${toStrongHtml(p.replace(/\n/g, '<br/>'))}</p>`) 
    .join('');
  return DOMPurify.sanitize(paragraphs);
}

function extractDateLocationFromHtml(html: string): { date?: string; location?: string } {
  try {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = (div.textContent || '').replace(/\s+/g, ' ').trim();
    // Common date formats like 01/2021 - 10/2022 or 2019 - 2021 or Jan 2020 - Oct 2022
    const dateRegex = /(\b\d{2}\/[0-9]{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s?\d{4}\b|\b\d{4}\b)\s*[\-–]\s*(\b\d{2}\/[0-9]{4}\b|\b(?:Present|Now|Today|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s?\d{4})\b)/i;
    const dateMatch = text.match(dateRegex);
    let location: string | undefined;
    // Try a simple City, Country after a pin/ dash or following the date substring
    const after = dateMatch ? text.slice(dateMatch.index! + dateMatch[0].length) : text;
    const locRegex = /\b([A-Za-zÀ-ÖØ-öø-ÿ.'\-\s]+,\s*[A-Za-zÀ-ÖØ-öø-ÿ.'\-\s]+)\b/;
    const locMatch = after.match(locRegex);
    if (locMatch) location = locMatch[1].trim();
    return { date: dateMatch?.[0], location };
  } catch {
    return {};
  }
}

function parseSkillsFromHtml(html: string): string[] {
  if (!html) return [];
  try {
    const container = document.createElement('div');
    container.innerHTML = html;
    const lis = Array.from(container.querySelectorAll('li')).map(li => li.textContent?.trim() || '').filter(Boolean);
    if (lis.length > 0) return lis;
  } catch {}
  // Fallback plain text parsing
  const text = html.replace(/<[^>]+>/g, ' ');
  return text.split(/[•,;\n]/).map(s => s.trim()).filter(Boolean);
}

function buildSkillsHtml(skills: string[]): string {
  return `<ul>${skills.map(s => `<li>${DOMPurify.sanitize(s)}</li>`).join('')}</ul>`;
}

type LanguageItem = { name: string; level: number };
const LEVEL_LABELS = ['None', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Native'];
function labelFromLevel(l: number): string {
  if (l >= 5) return 'Native';
  if (l === 4) return 'Advanced';
  if (l === 3) return 'Intermediate';
  if (l === 2) return 'Elementary';
  if (l === 1) return 'Beginner';
  return 'None';
}
function levelFromText(t: string): number {
  const s = t.toLowerCase();
  if (/(native|mother tongue)/.test(s)) return 5;
  if (/advanced|professional|fluent/.test(s)) return 4;
  if (/intermediate|professional working|conversational/.test(s)) return 3;
  if (/elementary|basic/.test(s)) return 2;
  if (/beginner|basic/.test(s)) return 1;
  return 3;
}
function parseLanguagesFromHtml(html: string): LanguageItem[] {
  if (!html) return [];
  const items: LanguageItem[] = [];
  try {
    const container = document.createElement('div');
    container.innerHTML = html;
    const lis = Array.from(container.querySelectorAll('li'));
    if (lis.length) {
      lis.forEach(li => {
        const txt = (li.textContent || '').trim();
        if (!txt) return;
        const parts = txt.split(/[-–]|\(|\)/).map(s => s.trim()).filter(Boolean);
        const name = parts[0] || txt;
        const level = levelFromText(parts.slice(1).join(' '));
        items.push({ name, level });
      });
      return items;
    }
  } catch {}
  const text = html.replace(/<[^>]+>/g, ' ');
  text.split(/[\n•,;]/).map(s => s.trim()).filter(Boolean).forEach(seg => {
    const parts = seg.split(/[-–]|\(|\)/).map(p => p.trim()).filter(Boolean);
    if (!parts.length) return;
    const name = parts[0];
    if (!name) return;
    const level = levelFromText(parts.slice(1).join(' '));
    items.push({ name, level });
  });
  return items;
}
function buildLanguagesHtml(langs: LanguageItem[]): string {
  return `<ul>${langs.map(l => `<li><strong>${DOMPurify.sanitize(l.name)}</strong> - ${labelFromLevel(l.level)}</li>`).join('')}</ul>`;
}

export function EmineonInlineEditor({ initial, fileId, onSave, onGenerateDocument, isGenerating, isAutoSaving }: { initial: CV; fileId?: string; onSave?: () => void; onGenerateDocument?: (format: 'pdf' | 'docx', sections: any[]) => void; isGenerating?: boolean; isAutoSaving?: boolean; }) {
  const { cv, activeId, setActive, updateSection } = useInlineStore();
  const [diff, setDiff] = useState<{ left: string; right: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // seed
    const seeded: CV = {
      id: initial.id,
      sections: (initial.sections || []).map((s) => ({
        ...s,
        html: normalizeSectionHtml(s.html, s.title),
        visible: s.visible !== false,
      })),
    };
    useInlineStore.setState({ cv: seeded });
  }, [initial]);

  const onApplyAI = (id: string) => {
    if (!diff) return;
    updateSection(id, DOMPurify.sanitize(diff.right));
    setDiff(null);
  };

  // Debounced autosave to backend when any section changes
  useEffect(() => {
    if (!fileId) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setSaving(true);
        const sanitized = cv.sections.map(s => ({
          id: s.id,
          title: s.title,
          type: s.kind,
          content: '',
          htmlContent: DOMPurify.sanitize(s.html),
          visible: s.visible !== false,
          order: s.order || 0,
          editable: true,
        }));
        const res = await fetch(`/api/competence-files/${encodeURIComponent(fileId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: sanitized, status: 'DRAFT' }),
          signal: controller.signal,
        });
        // Swallow errors for autosave
        await res.text().catch(() => undefined);
      } catch {}
      finally {
        setSaving(false);
      }
    }, 800);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [cv, fileId]);

  const exportSections = () => {
    return (cv.sections || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(s => ({ id: s.id, type: s.kind, title: s.title, content: s.html, visible: s.visible !== false, order: s.order || 0, editable: true }));
  };

  return (
    <div className="w-full h-full bg-white overflow-y-auto overscroll-contain">
      <div className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-secondary-700">
            <span className="font-medium">Zoom</span>
            <input aria-label="Zoom" type="range" min="0.8" max="1.4" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onSave?.()} disabled={!!isAutoSaving}>{isAutoSaving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" onClick={() => onGenerateDocument?.('pdf', exportSections())} isLoading={!!isGenerating}>Download PDF</Button>
          </div>
        </div>
      </div>
      <div className="max-w-[900px] mx-auto p-6" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        {cv.sections.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            active={activeId === sec.id}
            onActivate={() => setActive(sec.id)}
            onDeactivate={() => setActive(null)}
            onChange={(html) => updateSection(sec.id, html)}
            onAI={async (intent, text) => {
              setAiLoading(true);
              try {
                const res = await aiRewrite({ intent, text, sectionId: sec.id, kind: sec.kind });
                setDiff({ left: text, right: DOMPurify.sanitize(res.html || '') });
              } finally {
                setAiLoading(false);
              }
            }}
            diff={diff}
            aiLoading={aiLoading}
            onApplyAI={() => onApplyAI(sec.id)}
            onDiscardAI={() => setDiff(null)}
          />
        ))}
        {fileId && (
          <div className="text-xs text-secondary-500 mt-2" aria-live="polite">{saving ? 'Saving…' : ''}</div>
        )}
      </div>
    </div>
  );
}

function SectionBlock({ section, active, onActivate, onDeactivate, onChange, onAI, diff, aiLoading, onApplyAI, onDiscardAI }:
  { section: Section; active: boolean; onActivate: () => void; onDeactivate: () => void; onChange: (html: string) => void; onAI: (intent: string, text: string) => Promise<void>; diff: {left:string;right:string}|null; aiLoading: boolean; onApplyAI: () => void; onDiscardAI: () => void; }) {
  const setSectionVisible = useInlineStore(s => s.setSectionVisible);
  const removeSection = useInlineStore(s => s.removeSection);
  const isTechnical = (section.title || '').toUpperCase().includes('TECHNICAL');
  const isLanguages = (section.title || '').toUpperCase().includes('LANGUAGE');
  const isExperience = (section.title || '').toUpperCase().includes('EXPERIENCE');
  const [skills, setSkills] = useState<string[]>(() => isTechnical ? parseSkillsFromHtml(section.html) : []);
  const [languages, setLanguages] = useState<LanguageItem[]>(() => isLanguages ? parseLanguagesFromHtml(section.html) : []);
  useEffect(() => {
    if (isTechnical) {
      setSkills(parseSkillsFromHtml(section.html));
    }
    if (isLanguages) {
      setLanguages(parseLanguagesFromHtml(section.html));
    }
  }, [isTechnical, section.html]);
  const editor = useEditor({
    extensions: [StarterKit, Link, Underline, Placeholder.configure({ placeholder: section.title })],
    content: section.html,
    editable: active,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedSave(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    // Keep content in sync when deactivating
    if (!active) {
      editor.commands.setContent(section.html, false);
    }
    // Toggle editability on activation changes
    editor.setEditable(!!active);
    if (active) {
      // Focus at end when activating for immediate typing
      try { editor.commands.focus('end'); } catch {}
    }
  }, [active, editor, section.html]);

  // No floating menu; previously menuOpen logic removed

  const debouncedSave = useMemo(() => {
    let timer: any;
    return (html: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => onChange(html), 800);
    };
  }, [onChange]);

  return (
    <section role="region" aria-label={section.title} className={`group relative border-l-4 ${active ? 'border-primary-600' : 'border-transparent'} hover:border-gray-300 rounded-md mb-6 p-4 bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary-900 tracking-wide uppercase">{section.title}</h3>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-gray-100 text-secondary-600"
            title={section.visible !== false ? 'Hide section' : 'Show section'}
            aria-label={section.visible !== false ? 'Hide section' : 'Show section'}
            onClick={(e) => { e.stopPropagation(); setSectionVisible(section.id, !(section.visible !== false)); }}
          >
            {section.visible !== false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            className="p-1 rounded hover:bg-red-50 text-red-600"
            title="Delete section"
            aria-label="Delete section"
            onClick={(e) => { e.stopPropagation(); if (confirm('Delete this section?')) removeSection(section.id); }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {active && (
        <div className="mt-2 mb-3">
          <div className="w-full rounded-md border bg-white shadow-sm px-2 py-1.5 flex items-center gap-1">
            <Button size="sm" title="Bold" onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></Button>
            <Button size="sm" title="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></Button>
            <Button size="sm" title="Underline" onClick={() => editor?.chain().focus().toggleUnderline?.().run?.()}>U</Button>
            <div className="h-5 w-px bg-gray-200 mx-1" />
            <Button size="sm" title="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}>•</Button>
            <Button size="sm" title="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1.</Button>
            <div className="h-5 w-px bg-gray-200 mx-1" />
            <select aria-label="Font" className="text-sm border rounded px-1 py-0.5">
              <option>Font</option>
              <option>Inter</option>
              <option>Serif</option>
              <option>Mono</option>
            </select>
            <select aria-label="Size" className="text-sm border rounded px-1 py-0.5">
              <option>Size</option>
              <option>12</option>
              <option>14</option>
              <option>16</option>
            </select>
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="outline" title="Undo" onClick={() => editor?.chain().focus().undo().run()}>↶</Button>
              <Button size="sm" variant="outline" title="Redo" onClick={() => editor?.chain().focus().redo().run()}>↷</Button>
              <Button size="sm" variant="outline" title="Clear content" onClick={() => editor?.commands.clearContent()}>✕</Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-2" onClick={onActivate} onKeyDown={(e) => { if (e.key === 'Enter') onActivate(); if (e.key === 'Escape') onDeactivate(); }} tabIndex={0}>
        {isTechnical ? (
          <TechnicalSkillsEditor
            active={active}
            skills={skills}
            onChange={(next) => {
              setSkills(next);
              onChange(buildSkillsHtml(next));
            }}
            readHtml={section.html}
          />
        ) : isLanguages ? (
          <LanguagesEditor
            active={active}
            items={languages}
            onChange={(next) => {
              setLanguages(next);
              onChange(buildLanguagesHtml(next));
            }}
          />
        ) : active ? (
          <EditorContent editor={editor} data-testid={`section-editor-${section.id}`} />
        ) : (
          <div>
            {isExperience && (() => {
              const meta = extractDateLocationFromHtml(section.html);
              if (!meta.date && !meta.location) return null;
              return (
                <div className="flex items-center gap-6 text-secondary-600 text-sm mb-2">
                  {meta.date && (
                    <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {meta.date}</span>
                  )}
                  {meta.location && (
                    <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {meta.location}</span>
                  )}
                </div>
              );
            })()}
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.html) }} />
          </div>
        )}
      </div>
      {/* removed mini inline toolbar */}
    </section>
  );
}


function LanguagesEditor({ active, items, onChange }: { active: boolean; items: LanguageItem[]; onChange: (next: LanguageItem[]) => void }) {
  const [name, setName] = useState('');
  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (items.some(i => i.name.toLowerCase() === n.toLowerCase())) { setName(''); return; }
    onChange([...items, { name: n, level: 3 }]);
    setName('');
  };
  const setLevel = (idx: number, lvl: number) => {
    const next = items.slice();
    next[idx] = { ...next[idx], level: lvl };
    onChange(next);
  };
  const remove = (idx: number) => {
    const next = items.slice();
    next.splice(idx, 1);
    onChange(next);
  };
  return (
    <div>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 bg-white">
            <div className="flex items-center gap-3">
              <div className="font-medium text-primary-900">{it.name}</div>
              <div className="text-xs text-secondary-600">{labelFromLevel(it.level)}</div>
            </div>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Set level ${n}`}
                  disabled={!active}
                  onClick={(e) => { e.stopPropagation(); setLevel(idx, n); }}
                  className={`h-4 w-4 rounded-full ${it.level >= n ? 'bg-orange-500' : 'bg-gray-300'} transition-colors`}
                />
              ))}
              {active && (
                <button className="ml-2 text-red-600 hover:text-red-700" aria-label="Remove language" onClick={(e) => { e.stopPropagation(); remove(idx); }}>✕</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {active && (
        <div className="mt-3 flex items-center gap-2">
          <input
            aria-label="Add language"
            className="border rounded px-3 py-1 text-sm"
            placeholder="Add language"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          />
          <Button size="sm" onClick={add}>Add</Button>
        </div>
      )}
    </div>
  );
}

function TechnicalSkillsEditor({ active, skills, onChange, readHtml }: { active: boolean; skills: string[]; onChange: (skills: string[]) => void; readHtml: string }) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    const value = input.trim();
    if (!value) return;
    if (skills.includes(value)) { setInput(''); return; }
    onChange([...skills, value]);
    setInput('');
  };
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };
  const removeAt = (idx: number) => {
    const next = skills.slice();
    next.splice(idx, 1);
    onChange(next);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s, idx) => (
          <span key={idx} className="inline-flex items-center rounded-full bg-primary-50 text-primary-800 px-3 py-1 text-xs font-medium border border-primary-200">
            {s}
            {active && (
              <button className="ml-2 text-primary-700 hover:text-primary-900" aria-label={`Remove ${s}`} onClick={(e) => { e.stopPropagation(); removeAt(idx); }}>×</button>
            )}
          </span>
        ))}
        {active && (
          <input
            aria-label="Add skill"
            className="border rounded-full px-3 py-1 text-xs"
            placeholder="Add skill"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={handleAdd}
          />
        )}
      </div>
      {!active && skills.length === 0 && (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(readHtml) }} />
      )}
    </div>
  );
}

