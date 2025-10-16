'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Filter, MapPin, Building, Briefcase, GraduationCap, Star, Clock, DollarSign, Globe, Users, Award, Code, Languages, Calendar, Target, Search, ChevronDown, Plus, Minus, Check, User, MessageSquare, Phone, Mail, Activity, BarChart3, Zap, Shield, TrendingUp, Database } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: CandidateFilters) => void;
}

export interface CandidateFilters {
  keywords: string;
  location: {
    countries: string[];
    cities: string[];
    remote: boolean;
    hybrid: boolean;
    onSite: boolean;
  };
  experience: {
    minYears: number;
    maxYears: number;
    industries: string[];
    functions: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
    frameworks: string[];
    programmingLanguages: string[];
  };
  education: {
    degrees: string[];
    universities: string[];
    graduationYears: { from: number; to: number };
  };
  availability: {
    statuses: string[];
    availableFrom: string;
    contractTypes: string[];
    freelancer: boolean;
  };
  compensation: {
    minSalary: number;
    maxSalary: number;
    currency: string;
  };
  languages: string[];
  certifications: string[];
  lastActivity: string;
  rating: number;
  source: string[];
}

// Pre-defined option sets for dropdowns and autocomplete
const COUNTRIES = [
  'Switzerland', 'Germany', 'Austria', 'France', 'Italy', 'Netherlands', 
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Sweden', 
  'Norway', 'Denmark', 'Belgium', 'Spain', 'Portugal'
];

const CITIES = [
  'Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Munich', 'Berlin', 
  'Frankfurt', 'Vienna', 'Paris', 'London', 'Amsterdam', 'Stockholm', 
  'Copenhagen', 'Milan', 'Madrid', 'Barcelona', 'New York', 'San Francisco', 
  'Toronto', 'Sydney', 'Dubai'
];

const INDUSTRIES = [
  'Technology', 'Financial Services', 'Healthcare & Life Sciences', 
  'Consulting', 'Manufacturing', 'Retail & E-commerce', 'Media & Entertainment',
  'Education', 'Government', 'Real Estate', 'Energy & Utilities', 
  'Transportation', 'Telecommunications', 'Non-profit'
];

const UNIVERSITIES = [
  'ETH Zurich', 'University of Zurich', 'EPFL', 'University of Geneva',
  'University of Basel', 'HSG St. Gallen', 'MIT', 'Stanford University',
  'Harvard University', 'University of Cambridge', 'University of Oxford',
  'Technical University of Munich', 'INSEAD', 'London Business School'
];

const CERTIFICATIONS = [
  'AWS Certified Solutions Architect', 'Google Cloud Professional',
  'Microsoft Azure Fundamentals', 'Certified Kubernetes Administrator',
  'PMP', 'Scrum Master', 'Six Sigma', 'CFA', 'CPA', 'CISSP'
];

const PROGRAMMING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'C++', 'Scala', 'R', 'MATLAB'
];

const FRAMEWORKS = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 
  'Spring Boot', 'Laravel', '.NET', 'Flutter', 'React Native', 
  'Next.js', 'Nuxt.js', 'FastAPI', 'Flask'
];

const TECHNICAL_SKILLS = [
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 
  'DevOps', 'Machine Learning', 'Data Science', 'Blockchain', 
  'Cybersecurity', 'Mobile Development', 'UI/UX Design', 'Product Management'
];

const SOFT_SKILLS = [
  'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
  'Project Management', 'Strategic Thinking', 'Adaptability', 'Creativity',
  'Analytical Thinking', 'Negotiation', 'Mentoring', 'Cross-functional Collaboration'
];

const SOURCE_CHANNELS = [
  'LinkedIn', 'Direct Application', 'Referral', 'Recruiter', 'Career Fair', 
  'Company Website', 'GitHub', 'Stack Overflow', 'Indeed', 'Glassdoor',
  'AngelList', 'Xing', 'Monster', 'ZipRecruiter'
];

const initialFilters: CandidateFilters = {
  keywords: '',
  location: {
    countries: [],
    cities: [],
    remote: false,
    hybrid: false,
    onSite: false,
  },
  experience: {
    minYears: 0,
    maxYears: 20,
    industries: [],
    functions: [],
  },
  skills: {
    technical: [],
    soft: [],
    frameworks: [],
    programmingLanguages: [],
  },
  education: {
    degrees: [],
    universities: [],
    graduationYears: { from: 2000, to: new Date().getFullYear() },
  },
  availability: {
    statuses: [],
    availableFrom: '',
    contractTypes: [],
    freelancer: false,
  },
  compensation: {
    minSalary: 0,
    maxSalary: 300000,
    currency: 'CHF',
  },
  languages: [],
  certifications: [],
  lastActivity: '',
  rating: 0,
  source: [],
};

// Autocomplete/Multi-Select Component
interface AutocompleteProps {
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder: string;
  className?: string;
}

function AutocompleteMultiSelect({ options, selected, onSelectionChange, placeholder, className = '' }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selected.includes(option)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addOption = (option: string) => {
    onSelectionChange([...selected, option]);
    setSearchTerm('');
    setIsOpen(false);
  };

  const removeOption = (option: string) => {
    onSelectionChange(selected.filter(item => item !== option));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected items */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium"
            >
              {item}
              <button
                onClick={() => removeOption(item)}
                className="text-primary-500 hover:text-primary-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={option}
              onClick={() => addOption(option)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Number Range Input Component
interface NumberRangeProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
  unit?: string;
}

function NumberRangeInput({ min, max, value, onChange, step = 1, formatValue, unit = '' }: NumberRangeProps) {
  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.max(min, Math.min(newMin, value[1]));
    onChange([clampedMin, value[1]]);
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.min(max, Math.max(newMax, value[0]));
    onChange([value[0], clampedMax]);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Minimum {unit}
          </label>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={(e) => handleMinChange(parseInt(e.target.value) || min)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Maximum {unit}
          </label>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value[1]}
            onChange={(e) => handleMaxChange(parseInt(e.target.value) || max)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center">
        {formatValue ? `${formatValue(value[0])} - ${formatValue(value[1])}` : `${value[0]} - ${value[1]} ${unit}`.trim()}
      </div>
    </div>
  );
}

export function AdvancedFilterDrawer({ isOpen, onClose, onApplyFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState<CandidateFilters>(initialFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['location', 'experience']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Helper function to update nested filter properties
  const updateFilterArray = (section: keyof CandidateFilters, field: string, value: string[]) => {
    setFilters(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-large rounded-l-2xl">
        <div className="flex h-full flex-col">
          {/* Header (match Candidate Drawer gradient) */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-tl-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#0A2F5A]/10 rounded-lg">
                <Filter className="h-6 w-6 text-[#0A2F5A]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filters Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-gradient-to-br from-neutral-50 to-neutral-100">
            
            {/* Keywords Search */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                <Search className="h-4 w-4 mr-2 text-primary-600" />
                Keywords
              </h3>
              <input
                type="text"
                placeholder="Skills, job titles, companies..."
                value={filters.keywords}
                onChange={(e) => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft"
              />
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary-600" />
                  Location & Remote Work
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('location') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('location') && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Countries</label>
                    <AutocompleteMultiSelect
                      options={COUNTRIES}
                      selected={filters.location.countries}
                      onSelectionChange={(countries) => updateFilterArray('location', 'countries', countries)}
                      placeholder="Search and select countries..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Cities</label>
                    <AutocompleteMultiSelect
                      options={CITIES}
                      selected={filters.location.cities}
                      onSelectionChange={(cities) => updateFilterArray('location', 'cities', cities)}
                      placeholder="Search and select cities..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Work Arrangement</label>
                    <div className="space-y-2">
                      {[
                        { key: 'remote', label: 'Remote Only', icon: Globe },
                        { key: 'hybrid', label: 'Hybrid', icon: Building },
                        { key: 'onSite', label: 'On-site', icon: MapPin }
                      ].map(({ key, label, icon: Icon }) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(filters.location as any)[key]}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              location: { ...prev.location, [key]: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('experience')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-primary-600" />
                  Experience & Industry
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('experience') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('experience') && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Years of Experience</label>
                    <NumberRangeInput
                      min={0}
                      max={25}
                      value={[filters.experience.minYears, filters.experience.maxYears]}
                      onChange={([min, max]) => setFilters(prev => ({
                        ...prev,
                        experience: { 
                          ...prev.experience, 
                          minYears: min, 
                          maxYears: max 
                        }
                      }))}
                      unit="years"
                      formatValue={(value) => `${value} years`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Industry</label>
                    <AutocompleteMultiSelect
                      options={INDUSTRIES}
                      selected={filters.experience.industries}
                      onSelectionChange={(industries) => updateFilterArray('experience', 'industries', industries)}
                      placeholder="Search and select industries..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('skills')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <Code className="h-4 w-4 mr-2 text-primary-600" />
                  Skills & Technologies
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('skills') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('skills') && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                      <Code className="h-3 w-3 mr-1 text-purple-500" />
                      Programming Languages
                    </label>
                    <AutocompleteMultiSelect
                      options={PROGRAMMING_LANGUAGES}
                      selected={filters.skills.programmingLanguages}
                      onSelectionChange={(languages) => updateFilterArray('skills', 'programmingLanguages', languages)}
                      placeholder="Search programming languages..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                      <Database className="h-3 w-3 mr-1 text-blue-500" />
                      Frameworks & Libraries
                    </label>
                    <AutocompleteMultiSelect
                      options={FRAMEWORKS}
                      selected={filters.skills.frameworks}
                      onSelectionChange={(frameworks) => updateFilterArray('skills', 'frameworks', frameworks)}
                      placeholder="Search frameworks & libraries..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                      <Zap className="h-3 w-3 mr-1 text-orange-500" />
                      Technical Skills & Tools
                    </label>
                    <AutocompleteMultiSelect
                      options={TECHNICAL_SKILLS}
                      selected={filters.skills.technical}
                      onSelectionChange={(technical) => updateFilterArray('skills', 'technical', technical)}
                      placeholder="Search technical skills..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                      <Users className="h-3 w-3 mr-1 text-green-500" />
                      Soft Skills
                    </label>
                    <AutocompleteMultiSelect
                      options={SOFT_SKILLS}
                      selected={filters.skills.soft}
                      onSelectionChange={(soft) => updateFilterArray('skills', 'soft', soft)}
                      placeholder="Search soft skills..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('education')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2 text-primary-600" />
                  Education
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('education') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('education') && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Degree Level</label>
                    <select
                      multiple
                      value={filters.education.degrees}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        updateFilterArray('education', 'degrees', selected);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      size={3}
                    >
                      <option value="High School">High School</option>
                      <option value="Associate">Associate Degree</option>
                      <option value="Bachelor">Bachelor's Degree</option>
                      <option value="Master">Master's Degree</option>
                      <option value="PhD">PhD/Doctorate</option>
                      <option value="Professional Certification">Professional Certification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Universities & Schools</label>
                    <AutocompleteMultiSelect
                      options={UNIVERSITIES}
                      selected={filters.education.universities}
                      onSelectionChange={(universities) => updateFilterArray('education', 'universities', universities)}
                      placeholder="Search universities..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Graduation Year Range</label>
                    <NumberRangeInput
                      min={1990}
                      max={new Date().getFullYear()}
                      value={[filters.education.graduationYears.from, filters.education.graduationYears.to]}
                      onChange={([from, to]) => setFilters(prev => ({
                        ...prev,
                        education: { 
                          ...prev.education, 
                          graduationYears: { from, to } 
                        }
                      }))}
                      unit=""
                      formatValue={(value) => value.toString()}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('availability')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary-600" />
                  Availability & Status
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('availability') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('availability') && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Candidate Status</label>
                    <select
                      multiple
                      value={filters.availability.statuses}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        updateFilterArray('availability', 'statuses', selected);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      size={4}
                    >
                      <option value="Active">Active</option>
                      <option value="Passive">Passive</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Contract Type</label>
                    <select
                      multiple
                      value={filters.availability.contractTypes}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        updateFilterArray('availability', 'contractTypes', selected);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      size={3}
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Available From</label>
                    <input
                      type="date"
                      value={filters.availability.availableFrom}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        availability: { ...prev.availability, availableFrom: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Compensation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('compensation')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-primary-600" />
                  Compensation
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('compensation') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('compensation') && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={filters.compensation.currency}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        compensation: { ...prev.compensation, currency: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="CHF">Swiss Franc (CHF)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Annual Salary Range</label>
                    <NumberRangeInput
                      min={30000}
                      max={500000}
                      step={5000}
                      value={[filters.compensation.minSalary, filters.compensation.maxSalary]}
                      onChange={([min, max]) => setFilters(prev => ({
                        ...prev,
                        compensation: { 
                          ...prev.compensation, 
                          minSalary: min, 
                          maxSalary: max 
                        }
                      }))}
                      unit=""
                      formatValue={(value) => `${filters.compensation.currency} ${value.toLocaleString()}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('languages')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <Languages className="h-4 w-4 mr-2 text-primary-600" />
                  Languages
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('languages') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('languages') && (
                <div className="space-y-4 pl-6">
                  <AutocompleteMultiSelect
                    options={['English', 'German', 'French', 'Italian', 'Spanish', 'Portuguese', 'Dutch', 'Chinese (Mandarin)', 'Japanese', 'Russian', 'Arabic', 'Hindi', 'Korean', 'Polish', 'Swedish', 'Norwegian', 'Danish']}
                    selected={filters.languages}
                    onSelectionChange={(languages) => setFilters(prev => ({ ...prev, languages }))}
                    placeholder="Search and select languages..."
                  />
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <button
                onClick={() => toggleSection('certifications')}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
              >
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-primary-600" />
                  Certifications
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has('certifications') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.has('certifications') && (
                <div className="space-y-4 pl-6">
                  <AutocompleteMultiSelect
                    options={CERTIFICATIONS}
                    selected={filters.certifications}
                    onSelectionChange={(certifications) => setFilters(prev => ({ ...prev, certifications }))}
                    placeholder="Search certifications..."
                  />
                </div>
              )}
            </div>

            {/* Rating & Source */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <Star className="h-4 w-4 mr-2 text-primary-600" />
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-primary-600" />
                    Source Channel
                  </label>
                  <select
                    multiple
                    value={filters.source}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, source: selected }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    size={6}
                  >
                    {SOURCE_CHANNELS.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                    Last Activity
                  </label>
                  <select
                    value={filters.lastActivity}
                    onChange={(e) => setFilters(prev => ({ ...prev, lastActivity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any time</option>
                    <option value="1d">Last 24 hours</option>
                    <option value="3d">Last 3 days</option>
                    <option value="1w">Last week</option>
                    <option value="1m">Last month</option>
                    <option value="3m">Last 3 months</option>
                    <option value="6m">Last 6 months</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-white rounded-bl-2xl">
            <div className="flex items-center justify-between">
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Clear all filters
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 