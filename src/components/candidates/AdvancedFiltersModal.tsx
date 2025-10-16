'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Filter,
  Search,
  MapPin,
  Briefcase,
  Building2,
  Users,
  GraduationCap,
  Languages,
  Calendar,
  Brain,
  ListChecks,
  ShieldCheck,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react';

export interface AdvancedFilters {
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  requiredContactInfo: string[]; // e.g., ['email','phone','linkedin']
  requiredContactMatch: 'any' | 'all';
  onlyConnections: 'none' | 'first' | 'first_second';
  hideViewed: 'none' | 'viewed' | 'shortlisted' | 'both';
  locations: string[];
  radiusMiles: number | null; // e.g., 25
  timezone: string | null;
  pastLocations: string[];
  jobTitles: string[];
  pastJobTitles: string[];
  jobTitleLevels: string[];
  jobTitleRoles: string[];
  companies: string[];
  excludedCompanies: string[];
  excludeDncCompanies: boolean;
  companyIndustries: string[];
  skillsOrKeywords: string[];
  powerFilters: {
    likelyIndicators: boolean;
    averageTenure: boolean;
    recentLayoffs: boolean;
    companyFunding: boolean;
    vesting: boolean;
    leadershipChanges: boolean;
    careerStage: boolean;
  };
  universities: string[];
  excludedUniversities: string[];
  universityLocations: string[];
  degreeRequirement: 'regular' | 'preferred' | 'required';
  fieldsOfStudy: string[];
  graduationYearMin: number | null;
  graduationYearMax: number | null;
  languages: string[];
  booleanExpression: string;
  fullName: string;
  attributeFilters: Array<{ field: string; operator: 'contains' | 'equals' | 'gt' | 'lt'; value: string }>;
}

const initialFilters: AdvancedFilters = {
  minExperienceYears: 0,
  maxExperienceYears: null,
  requiredContactInfo: [],
  requiredContactMatch: 'any',
  onlyConnections: 'none',
  hideViewed: 'none',
  locations: [],
  radiusMiles: 25,
  timezone: null,
  pastLocations: [],
  jobTitles: [],
  pastJobTitles: [],
  jobTitleLevels: [],
  jobTitleRoles: [],
  companies: [],
  excludedCompanies: [],
  excludeDncCompanies: true,
  companyIndustries: [],
  skillsOrKeywords: [],
  powerFilters: {
    likelyIndicators: false,
    averageTenure: false,
    recentLayoffs: false,
    companyFunding: false,
    vesting: false,
    leadershipChanges: false,
    careerStage: false,
  },
  universities: [],
  excludedUniversities: [],
  universityLocations: [],
  degreeRequirement: 'regular',
  fieldsOfStudy: [],
  graduationYearMin: null,
  graduationYearMax: null,
  languages: [],
  booleanExpression: '',
  fullName: '',
  attributeFilters: [],
};

interface AdvancedFiltersModalProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
}

function TagsInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    setInput('');
  };
  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(input);
    }
    if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={`border border-gray-300 rounded-lg p-2 flex flex-wrap gap-1 bg-white ${className}`}>
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs">
          {v}
          <button onClick={() => remove(v)} className="hover:text-primary-900">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] outline-none px-2 py-1 text-sm"
      />
    </div>
  );
}

export function AdvancedFiltersModal({ open, onClose, onApplyFilters }: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<AdvancedFilters>(initialFilters);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    experience: true,
    locations: true,
    titles: true,
    companies: true,
    skills: true,
    power: false,
    education: false,
    languages: false,
    advanced: false,
  });

  useEffect(() => {
    if (!open) return;
    // optionally load last-used filters later
  }, [open]);

  if (!open) return null;

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const apply = () => {
    // Provide both normalized payload and query params for backend
    const params = new URLSearchParams();
    if (filters.minExperienceYears != null) params.set('experienceMin', String(filters.minExperienceYears));
    if (filters.maxExperienceYears != null) params.set('experienceMax', String(filters.maxExperienceYears));
    if (filters.locations.length) params.set('locations', filters.locations.join(','));
    if (filters.pastLocations.length) params.set('pastLocations', filters.pastLocations.join(','));
    if (filters.radiusMiles != null) params.set('radius', String(filters.radiusMiles));
    if (filters.timezone) params.set('timezone', filters.timezone);
    if (filters.jobTitles.length) params.set('jobTitles', filters.jobTitles.join(','));
    if (filters.pastJobTitles.length) params.set('pastJobTitles', filters.pastJobTitles.join(','));
    if (filters.jobTitleLevels.length) params.set('jobLevels', filters.jobTitleLevels.join(','));
    if (filters.jobTitleRoles.length) params.set('jobRoles', filters.jobTitleRoles.join(','));
    if (filters.companies.length) params.set('companies', filters.companies.join(','));
    if (filters.excludedCompanies.length) params.set('excludedCompanies', filters.excludedCompanies.join(','));
    if (filters.excludeDncCompanies) params.set('excludeDNC', '1');
    if (filters.companyIndustries.length) params.set('industries', filters.companyIndustries.join(','));
    if (filters.skillsOrKeywords.length) params.set('skills', filters.skillsOrKeywords.join(','));
    if (filters.universities.length) params.set('universities', filters.universities.join(','));
    if (filters.excludedUniversities.length) params.set('excludedUniversities', filters.excludedUniversities.join(','));
    if (filters.universityLocations.length) params.set('universityLocations', filters.universityLocations.join(','));
    if (filters.degreeRequirement) params.set('degreeReq', filters.degreeRequirement);
    if (filters.fieldsOfStudy.length) params.set('fieldsOfStudy', filters.fieldsOfStudy.join(','));
    if (filters.graduationYearMin != null) params.set('gradMin', String(filters.graduationYearMin));
    if (filters.graduationYearMax != null) params.set('gradMax', String(filters.graduationYearMax));
    if (filters.languages.length) params.set('languages', filters.languages.join(','));
    if (filters.booleanExpression) params.set('boolean', filters.booleanExpression);
    if (filters.fullName) params.set('fullName', filters.fullName);

    const payload = { filters };
    onApplyFilters(Object.assign({ __query: params.toString(), __payload: payload }, filters) as any);
    try { localStorage.setItem('advFilters:v1', JSON.stringify(filters)); } catch {}
    onClose();
  };

  const clear = () => setFilters(initialFilters);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0A2F5A]/10">
              <Filter className="h-6 w-6 text-[#0A2F5A]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Filters</h2>
              <p className="text-xs text-gray-600">Refine your candidate search across 80+ attributes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto px-6 py-5 bg-gradient-to-br from-neutral-50 to-neutral-100 space-y-5">
          {/* Experience */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('experience')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary-600" /> Min/Max Experience (Years)</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.experience ? 'rotate-180' : ''}`} />
            </button>
            {expanded.experience && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Experience</label>
                  <input type="number" value={filters.minExperienceYears ?? ''} onChange={(e)=>setFilters(p=>({ ...p, minExperienceYears: e.target.value===''?null:parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Experience</label>
                  <input type="number" value={filters.maxExperienceYears ?? ''} onChange={(e)=>setFilters(p=>({ ...p, maxExperienceYears: e.target.value===''?null:parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Example: 10" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Required Contact Info</label>
                  <div className="flex flex-wrap gap-2">
                    {['Email','Phone','LinkedIn'].map((k)=>{
                      const key = k.toLowerCase();
                      const active = filters.requiredContactInfo.includes(key);
                      return (
                        <button key={k} onClick={()=>setFilters(p=>({ ...p, requiredContactInfo: active ? p.requiredContactInfo.filter(v=>v!==key) : [...p.requiredContactInfo, key] }))} className={`px-3 py-1.5 rounded-lg text-sm border ${active?'bg-primary-50 text-primary-700 border-primary-200':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{k}</button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Match
                    <select value={filters.requiredContactMatch} onChange={(e)=>setFilters(p=>({ ...p, requiredContactMatch: e.target.value as 'any'|'all' }))} className="ml-2 border border-gray-300 rounded px-2 py-1 text-xs">
                      <option value="any">Match Any</option>
                      <option value="all">Match All</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Only Connections</label>
                    <select value={filters.onlyConnections} onChange={(e)=>setFilters(p=>({ ...p, onlyConnections: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="none">Don't restrict to connections</option>
                      <option value="first">1st-degree only</option>
                      <option value="first_second">1st & 2nd-degree</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hide Viewed or Shortlisted Profiles</label>
                    <select value={filters.hideViewed} onChange={(e)=>setFilters(p=>({ ...p, hideViewed: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="none">Don't hide profiles</option>
                      <option value="viewed">Hide viewed</option>
                      <option value="shortlisted">Hide shortlisted</option>
                      <option value="both">Hide viewed & shortlisted</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Locations */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('locations')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary-600" /> Location(s) & Timezone</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.locations ? 'rotate-180' : ''}`} />
            </button>
            {expanded.locations && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location(s)</label>
                  <TagsInput value={filters.locations} onChange={(v)=>setFilters(p=>({ ...p, locations: v }))} placeholder="Examples: San Francisco / United States / NYC / California" />
                  <p className="text-xs text-amber-600 mt-1">⚠️ No locations added</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Within (miles)</label>
                  <input type="number" value={filters.radiusMiles ?? ''} onChange={(e)=>setFilters(p=>({ ...p, radiusMiles: e.target.value===''?null:parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="25" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
                  <input type="text" value={filters.timezone ?? ''} onChange={(e)=>setFilters(p=>({ ...p, timezone: e.target.value || null }))} placeholder="Select timezone" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Past Locations</label>
                  <TagsInput value={filters.pastLocations} onChange={(v)=>setFilters(p=>({ ...p, pastLocations: v }))} placeholder="Examples: San Francisco / United States / NYC / California" />
                </div>
              </div>
            )}
          </section>

          {/* Titles */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('titles')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary-600" /> Job Titles</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.titles ? 'rotate-180' : ''}`} />
            </button>
            {expanded.titles && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Titles</label>
                  <TagsInput value={filters.jobTitles} onChange={(v)=>setFilters(p=>({ ...p, jobTitles: v }))} placeholder="Start typing a job title and select from the list" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Past Job Titles</label>
                  <TagsInput value={filters.pastJobTitles} onChange={(v)=>setFilters(p=>({ ...p, pastJobTitles: v }))} placeholder="Start typing a job title and select from the list" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Title Levels</label>
                  <TagsInput value={filters.jobTitleLevels} onChange={(v)=>setFilters(p=>({ ...p, jobTitleLevels: v }))} placeholder="e.g., Senior, Lead, Principal" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Title Roles</label>
                  <TagsInput value={filters.jobTitleRoles} onChange={(v)=>setFilters(p=>({ ...p, jobTitleRoles: v }))} placeholder="e.g., Engineering, Product, Data" />
                </div>
              </div>
            )}
          </section>

          {/* Companies */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('companies')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><Building2 className="h-4 w-4 mr-2 text-primary-600" /> Companies & Industries</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.companies ? 'rotate-180' : ''}`} />
            </button>
            {expanded.companies && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Companies</label>
                  <TagsInput value={filters.companies} onChange={(v)=>setFilters(p=>({ ...p, companies: v }))} placeholder="Large recruiting agencies, Google, Indian IT companies, etc." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Excluded Companies</label>
                  <TagsInput value={filters.excludedCompanies} onChange={(v)=>setFilters(p=>({ ...p, excludedCompanies: v }))} placeholder="Example: Google, Microsoft, Apple, etc." />
                </div>
                <div className="flex items-center gap-2">
                  <input id="dnc" type="checkbox" checked={filters.excludeDncCompanies} onChange={(e)=>setFilters(p=>({ ...p, excludeDncCompanies: e.target.checked }))} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <label htmlFor="dnc" className="text-sm text-gray-700">Remove your DNC Companies from results</label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Industries</label>
                  <TagsInput value={filters.companyIndustries} onChange={(v)=>setFilters(p=>({ ...p, companyIndustries: v }))} placeholder="Finance Related Fields, Tech Industries, Robotics, etc." />
                </div>
              </div>
            )}
          </section>

          {/* Skills */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('skills')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><Brain className="h-4 w-4 mr-2 text-primary-600" /> Skills or Keywords</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.skills ? 'rotate-180' : ''}`} />
            </button>
            {expanded.skills && (
              <div className="pt-4">
                <TagsInput value={filters.skillsOrKeywords} onChange={(v)=>setFilters(p=>({ ...p, skillsOrKeywords: v }))} placeholder="Start typing — select from the list, or just hit enter" />
              </div>
            )}
          </section>

          {/* Power Filters */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('power')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><ListChecks className="h-4 w-4 mr-2 text-primary-600" /> Power Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.power ? 'rotate-180' : ''}`} />
            </button>
            {expanded.power && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <button onClick={()=>setFilters(p=>({ ...p, powerFilters: Object.fromEntries(Object.keys(p.powerFilters).map(k=>[k,true])) as AdvancedFilters['powerFilters'] }))} className="px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 hover:bg-gray-50">Enable all</button>
                  <button onClick={()=>setFilters(p=>({ ...p, powerFilters: Object.fromEntries(Object.keys(p.powerFilters).map(k=>[k,false])) as AdvancedFilters['powerFilters'] }))} className="px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 hover:bg-gray-50">Disable all</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(
                    [
                      ['likelyIndicators','Likely Indicators'],
                      ['averageTenure','Average Tenure'],
                      ['recentLayoffs','Recent Layoffs'],
                      ['companyFunding','Company Funding'],
                      ['vesting','Vesting'],
                      ['leadershipChanges','Leadership Changes'],
                      ['careerStage','Career Stage'],
                    ] as Array<[keyof AdvancedFilters['powerFilters'], string]>
                  ).map(([key,label])=>{
                    const on = filters.powerFilters[key];
                    return (
                      <label key={key as string} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={on} onChange={(e)=>setFilters(p=>({ ...p, powerFilters: { ...p.powerFilters, [key]: e.target.checked } }))} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Education */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('education')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><GraduationCap className="h-4 w-4 mr-2 text-primary-600" /> Education</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.education ? 'rotate-180' : ''}`} />
            </button>
            {expanded.education && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Universities</label>
                  <TagsInput value={filters.universities} onChange={(v)=>setFilters(p=>({ ...p, universities: v }))} placeholder="HBCUs, Vanderbilt, All Ivy Leagues, Stanford, etc." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Excluded Universities</label>
                  <TagsInput value={filters.excludedUniversities} onChange={(v)=>setFilters(p=>({ ...p, excludedUniversities: v }))} placeholder="HBCUs, Vanderbilt, All Ivy Leagues, Stanford, etc." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">University Locations</label>
                  <TagsInput value={filters.universityLocations} onChange={(v)=>setFilters(p=>({ ...p, universityLocations: v }))} placeholder="Examples: San Francisco / United States / NYC / California" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Degree Requirements</label>
                  <select value={filters.degreeRequirement} onChange={(e)=>setFilters(p=>({ ...p, degreeRequirement: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="regular">Regular</option>
                    <option value="preferred">Preferred</option>
                    <option value="required">Required</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fields of Study</label>
                  <TagsInput value={filters.fieldsOfStudy} onChange={(v)=>setFilters(p=>({ ...p, fieldsOfStudy: v }))} placeholder="All Engineering Majors, Natural Sciences, CS, etc." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Graduation Year (Min)</label>
                  <input type="number" value={filters.graduationYearMin ?? ''} onChange={(e)=>setFilters(p=>({ ...p, graduationYearMin: e.target.value===''?null:parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Graduation Year (Max)</label>
                  <input type="number" value={filters.graduationYearMax ?? ''} onChange={(e)=>setFilters(p=>({ ...p, graduationYearMax: e.target.value===''?null:parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
            )}
          </section>

          {/* Languages */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('languages')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><Languages className="h-4 w-4 mr-2 text-primary-600" /> Languages</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.languages ? 'rotate-180' : ''}`} />
            </button>
            {expanded.languages && (
              <div className="pt-4">
                <TagsInput value={filters.languages} onChange={(v)=>setFilters(p=>({ ...p, languages: v }))} placeholder="Example: English, Spanish, Mandarin, etc." />
              </div>
            )}
          </section>

          {/* Advanced query */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-soft">
            <button onClick={() => toggle('advanced')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
              <span className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary-600" /> Advanced</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded.advanced ? 'rotate-180' : ''}`} />
            </button>
            {expanded.advanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Boolean Expression</label>
                  <textarea value={filters.booleanExpression} onChange={(e)=>setFilters(p=>({ ...p, booleanExpression: e.target.value }))} rows={3} placeholder='Example: ("software engineer" OR "software developer") AND ("San Francisco" OR "San Jose")' className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input type="text" value={filters.fullName} onChange={(e)=>setFilters(p=>({ ...p, fullName: e.target.value }))} placeholder="John Doe" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Additional Attribute Filters (80+ fields)</label>
                  <AttributeFiltersBuilder value={filters.attributeFilters} onChange={(v)=>setFilters(p=>({ ...p, attributeFilters: v }))} />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
          <button onClick={clear} className="text-sm text-gray-600 hover:text-gray-800 font-medium">Clear all filters</button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400">Cancel</button>
            <button onClick={apply} className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800">Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeFiltersBuilder({ value, onChange }: {
  value: Array<{ field: string; operator: 'contains' | 'equals' | 'gt' | 'lt'; value: string }>;
  onChange: (next: Array<{ field: string; operator: 'contains' | 'equals' | 'gt' | 'lt'; value: string }>) => void;
}) {
  const add = () => onChange([...(value ?? []), { field: '', operator: 'contains', value: '' }]);
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<{ field: string; operator: 'contains' | 'equals' | 'gt' | 'lt'; value: string }>) => {
    const next = value.map((row, i) => (i === idx ? { ...row, ...patch } : row));
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {(value ?? []).map((row, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input value={row.field} onChange={(e)=>update(idx,{ field: e.target.value })} placeholder="Field name (e.g., seniorityLevel)" className="md:col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          <select value={row.operator} onChange={(e)=>update(idx,{ operator: e.target.value as any })} className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="contains">contains</option>
            <option value="equals">equals</option>
            <option value="gt">greater than</option>
            <option value="lt">less than</option>
          </select>
          <input value={row.value} onChange={(e)=>update(idx,{ value: e.target.value })} placeholder="Value" className="md:col-span-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          <button onClick={()=>remove(idx)} className="md:col-span-1 px-2 text-red-600 hover:text-red-700">Remove</button>
        </div>
      ))}
      <button onClick={add} className="px-3 py-1.5 text-sm border rounded-lg bg-white text-gray-700 hover:bg-gray-50">Add attribute filter</button>
    </div>
  );
}

export default AdvancedFiltersModal;


