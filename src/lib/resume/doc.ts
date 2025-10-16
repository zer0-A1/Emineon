export type SectionKind =
  | 'SUMMARY' | 'KEY_ACHIEVEMENTS' | 'EXPERIENCE' | 'EDUCATION'
  | 'CERTIFICATIONS' | 'LANGUAGES' | 'SKILLS' | 'LINKS'
  | 'INTERESTS' | 'PROJECTS' | 'CUSTOM';

export type RichText = { json: any };

export interface ResumeDoc {
  id: string;
  title: string;
  template: 'double-column' | 'ivy' | 'elegant' | 'contemporary';
  theme: { primary: string; font: string; density: 'compact' | 'normal' | 'spacious' };
  sections: Section[];
  createdAt: string; updatedAt: string; version: number;
}

export interface Section {
  id: string;
  kind: SectionKind;
  title?: string;
  blocks: Block[];
  collapsed?: boolean;
}

export type Block =
  | { type: 'RICH'; id: string; content: RichText }
  | { type: 'ENTRY'; id: string; role: string; company: string; location?: string; start: string; end?: string; current?: boolean; bullets: RichText[]; meta?: Record<string, string> }
  | { type: 'TAGLIST'; id: string; label?: string; tags: string[] }
  | { type: 'LANGS'; id: string; items: { name: string; level: 1|2|3|4|5 }[] }
  | { type: 'LINKS'; id: string; items: { label: string; url: string }[] }
  | { type: 'TILE'; id: string; heading: string; body: RichText; icon?: string };


