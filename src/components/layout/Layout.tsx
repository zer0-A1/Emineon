'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function Layout({ children, fullWidth = false }: LayoutProps) {
  // Default SSR-safe values to avoid hydration mismatch; hydrate from localStorage after mount
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const pathname = usePathname();

  // Hydrate pinned/collapsed from localStorage on mount
  useEffect(() => {
    try {
      const pinnedSaved = window.localStorage.getItem('emineon:sidebarPinned') === '1';
      setSidebarPinned(pinnedSaved);
      if (pinnedSaved) setSidebarCollapsed(false);
    } catch {}
  }, []);

  // Auto-collapse the sidebar on route changes
  useEffect(() => {
    if (!sidebarPinned) setSidebarCollapsed(true);
  }, [pathname]);

  // Persist pinned state
  useEffect(() => {
    try { window.localStorage.setItem('emineon:sidebarPinned', sidebarPinned ? '1' : '0'); } catch {}
    // Ensure expanded when pinned
    if (sidebarPinned) setSidebarCollapsed(false);
  }, [sidebarPinned]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div data-test="app-layout" className="min-h-screen bg-neutral-50" style={{ ['--sidebar-width' as any]: sidebarCollapsed ? '4rem' : '16rem' }}>
      {/* Mobile overlay - blocks app on small screens */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/95 backdrop-blur-sm px-6 sm:hidden">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[#0A2F5A]/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-[#0A2F5A]"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-9 4h9M8 6h8m-9 12h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Desktop Web App</h2>
          <p className="mt-2 text-sm text-gray-600">This is a desktop web application. Please open it on a larger screen. Mobile version coming soon.</p>
        </div>
      </div>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} pinned={sidebarPinned} onPinToggle={() => setSidebarPinned(v => !v)} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden items-stretch">
          {/* Page Content */}
          <main
            className="flex-1 overflow-y-auto p-6"
            onClick={() => {
              if (!sidebarPinned && !sidebarCollapsed) setSidebarCollapsed(true);
            }}
          >
            <div className={fullWidth ? "w-full" : "max-w-5xl mx-auto w-full"}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 