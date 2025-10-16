'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Bell, Search, ChevronRight, Command, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  name: string;
  href: string;
  isSection: boolean;
  isCurrent?: boolean;
}

// Breadcrumb mapping for better UX
const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/candidates': 'Candidates',
  '/competence-files': 'Competence Files',
  '/jobs': 'Jobs',
  '/clients': 'Clients',
  '/ai-tools': 'AI Tools',
  '/assessments': 'Assessments',
  '/video-interviews': 'Video Interviews',
  '/workflows': 'Workflows',
  '/assignments': 'Tasks',
  '/reports': 'Reports',
  '/analytics': 'Analytics',
  '/notes': 'Notes',
  '/user': 'Profile',
};

const sectionMap: Record<string, string> = {
  '/candidates': 'Talent',
  '/candidates/new': 'Talent',
  '/competence-files': 'Talent',
  '/assessments': 'Talent',
  '/video-interviews': 'Talent',
  '/assignments': 'Talent',
  '/jobs': 'Jobs',
  '/ai-tools': 'Jobs',
  '/clients': 'Clients',
  '/notes': 'Clients',
  '/workflows': 'Automation',
  '/reports': 'Insights',
  '/analytics': 'Insights',
  '/user': 'Account',
};

export function Header() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [cfPill, setCfPill] = useState<any | null>(null);
  const [ccPill, setCcPill] = useState<any | null>(null);

  // Competence-file minimized pill state (persisted via localStorage by the modal)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cfPill');
      setCfPill(raw ? JSON.parse(raw) : null);
    } catch {}
    try {
      const raw2 = localStorage.getItem('ccPill');
      setCcPill(raw2 ? JSON.parse(raw2) : null);
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cfPill') {
        try { setCfPill(e.newValue ? JSON.parse(e.newValue) : null); } catch { setCfPill(null); }
      }
      if (e.key === 'ccPill') {
        try { setCcPill(e.newValue ? JSON.parse(e.newValue) : null); } catch { setCcPill(null); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleCfPillClick = () => {
    try { localStorage.removeItem('cfPill'); } catch {}
    // Navigate back to competence files page; a future enhancement can auto-open the modal
    window.location.href = '/competence-files';
  };

  const handleCcPillClick = () => {
    try { localStorage.removeItem('ccPill'); } catch {}
    // Navigate back to candidates page and request opening the modal
    window.location.href = '/candidates?openCreate=1';
  };

  // Generate breadcrumbs
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [{ name: 'Dashboard', href: '/', isSection: false }];
    
    if (pathname !== '/') {
      const currentPath = `/${paths.join('/')}`;
      const section = sectionMap[currentPath];
      const pageName = breadcrumbMap[currentPath] || paths[paths.length - 1];
      
      if (section && section !== pageName) {
        breadcrumbs.push({ name: section, href: '#', isSection: true });
      }
      
      breadcrumbs.push({ 
        name: pageName, 
        href: currentPath, 
        isSection: false,
        isCurrent: true 
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="bg-white border-b border-secondary-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center space-x-2">
            <nav className="flex items-center space-x-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-3 w-3 text-secondary-400 mx-2" />
                  )}
                  {crumb.isCurrent ? (
                    <span className="font-medium text-secondary-900">
                      {crumb.name}
                    </span>
                  ) : crumb.isSection ? (
                    <span className="text-secondary-500 text-xs uppercase tracking-wide font-semibold">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-secondary-500 hover:text-secondary-700 transition-colors"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Center: Global Search */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div
                className={cn(
                  'flex items-center w-full px-4 py-2 bg-secondary-50 border rounded-lg transition-all duration-200',
                  searchFocused
                    ? 'border-primary-300 bg-white shadow-sm'
                    : 'border-secondary-200 hover:border-secondary-300'
                )}
              >
                <Search className="h-4 w-4 text-secondary-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search candidates, jobs, clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder-secondary-400"
                />
                <div className="flex items-center space-x-1 text-xs text-secondary-400">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
              </div>
              
              {/* Search Results Dropdown */}
              {searchQuery && searchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg z-50">
                  <div className="p-3">
                    <div className="text-xs text-secondary-500 uppercase tracking-wide font-semibold mb-2">
                      Search Results
                    </div>
                    <div className="text-sm text-secondary-600">
                      No results found for "{searchQuery}"
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Add Button */}
            <div className="relative group">
              <button className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </div>

            {/* User Menu */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>
      </div>
      {cfPill?.active && (
        <button
          onClick={handleCfPillClick}
          className={`fixed bottom-4 right-4 z-[70] px-4 py-2 rounded-full shadow-emineon flex items-center space-x-2 transition-colors ${cfPill?.status==='ready' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#0A2F5A] hover:bg-[#083248] text-white'}`}
          title={cfPill?.status==='ready' ? 'Ready - open' : 'Working - view progress'}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${cfPill?.status==='ready' ? 'bg-white/20' : 'bg-white/10'}`}>
            <Brain className={`h-4 w-4 ${cfPill?.status==='ready' ? 'text-white' : 'text-white animate-pulse'}`} />
          </div>
          <span className="text-sm font-medium">
            {cfPill?.status==='extracting' && 'Extracting…'}
            {cfPill?.status==='generating' && `Generating ${cfPill?.progress ?? 0}%`}
            {cfPill?.status==='ready' && 'Ready'}
          </span>
        </button>
      )}
      {ccPill?.active && (
        <button
          onClick={handleCcPillClick}
          className={`fixed bottom-4 right-4 z-[70] mr-[10.5rem] px-4 py-2 rounded-full shadow-emineon flex items-center space-x-2 transition-colors ${ccPill?.status==='ready' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#0A2F5A] hover:bg-[#083248] text-white'}`}
          title={ccPill?.status==='ready' ? 'Ready - open' : 'Working - view progress'}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ccPill?.status==='ready' ? 'bg-white/20' : 'bg-white/10'}`}>
            <Brain className={`h-4 w-4 ${ccPill?.status==='ready' ? 'text-white' : 'text-white animate-pulse'}`} />
          </div>
          <span className="text-sm font-medium">
            {ccPill?.status==='extracting' && 'Extracting…'}
            {ccPill?.status==='ready' && 'Ready'}
          </span>
        </button>
      )}
    </header>
  );
} 