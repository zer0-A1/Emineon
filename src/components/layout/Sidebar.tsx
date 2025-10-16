'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Building2, 
  Briefcase,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  BarChart3,
  FileText,
  Activity,
  Brain,
  Share2,
  Video,
  Workflow,
  User,
  Settings,
  TrendingUp,
  Plus,
  Mail,
  Bot,
  Menu,
  X,
  Pin,
  PinOff,
  Search,
  LucideIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useUser } from '@clerk/nextjs';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  pinned?: boolean;
  onPinToggle?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavigationSection {
  name: string;
  icon: LucideIcon;
  items: NavigationItem[];
  collapsible?: boolean;
}

const navigationSections: NavigationSection[] = [
  {
    name: 'Home',
    icon: LayoutDashboard,
    items: [
      {
        name: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
      },
    ],
    collapsible: false,
  },
  {
    name: 'Jobs',
    icon: Briefcase,
    items: [
      {
        name: 'Jobs',
        href: '/jobs',
        icon: Briefcase,
      },
    ],
    collapsible: false,
  },
  {
    name: 'Projects',
    icon: ClipboardList,
    items: [
      {
        name: 'Projects',
        href: '/projects',
        icon: ClipboardList,
      },
    ],
    collapsible: false,
  },
  {
    name: 'Talent',
    icon: Users,
    items: [
      {
        name: 'Candidates',
        href: '/candidates',
        icon: Users,
      },
      {
        name: 'Search',
        href: '/talent/search',
        icon: Search,
      },
      {
        name: 'Shortlist',
        href: '/talent/shortlist',
        icon: User,
      },
      {
        name: 'Competence Files',
        href: '/competence-files',
        icon: FileText,
      },
      {
        name: 'Assessments',
        href: '/assessments',
        icon: ClipboardList,
      },
      {
        name: 'Video Interviews',
        href: '/video-interviews',
        icon: Video,
      },
      {
        name: 'Tasks',
        href: '/assignments',
        icon: ClipboardList,
      },
    ],
    collapsible: true,
  },
  {
    name: 'Clients',
    icon: Building2,
    items: [
      {
        name: 'Clients',
        href: '/clients',
        icon: Building2,
      },
      {
        name: 'Portal Manager',
        href: '/admin/portal-manager',
        icon: Share2,
      },
      {
        name: 'Notes',
        href: '/notes',
        icon: FileText,
      },
    ],
    collapsible: true,
  },
  {
    name: 'AI Tools',
    icon: Brain,
    items: [
      {
        name: 'AI Tools',
        href: '/ai-tools',
        icon: Brain,
      },
      {
            name: 'AI Co-pilot',
            href: '/ai-copilot',
        icon: Bot,
      },
      {
        name: 'Content Generator',
        href: '/ai-tools/content-generator',
        icon: ClipboardList,
      },
    ],
    collapsible: true,
  },
  {
    name: 'Automation',
    icon: Workflow,
    items: [
      {
        name: 'Workflows',
        href: '/workflows',
        icon: Workflow,
      },
    ],
    collapsible: true,
  },
  {
    name: 'Insights',
    icon: TrendingUp,
    items: [
      {
        name: 'Reports',
        href: '/reports',
        icon: BarChart3,
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: Activity,
      },
    ],
    collapsible: true,
  },
  {
    name: 'Account',
    icon: User,
    items: [
      {
        name: 'Profile',
        href: '/user',
        icon: User,
      },
    ],
    collapsible: true,
  },
];

export function Sidebar({ collapsed = false, onToggle, pinned = false, onPinToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize with collapsible sections collapsed, but keep Talent expanded for easy access
  const [collapsedSections, setCollapsedSections] = useState<string[]>(
    navigationSections
      .filter(section => section.collapsible && section.name !== 'Talent')
      .map(section => section.name)
  );

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => 
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isItemActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const isSectionActive = (section: NavigationSection) => {
    return section.items.some(item => isItemActive(item.href));
  };

  const scheduleGentleCollapse = (delayMs: number = 1200) => {
    if (!onToggle) return;
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    collapseTimeoutRef.current = setTimeout(() => {
      onToggle?.();
      collapseTimeoutRef.current = null;
    }, delayMs);
  };

  const cancelScheduledCollapse = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  };

  return (
    <div
      id="app-sidebar"
      className={cn(
        "relative flex flex-col bg-white border-r border-secondary-200 min-h-screen sticky top-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => {
        cancelScheduledCollapse();
        // Open sidebar on hover when collapsed
        if (collapsed && !pinned) {
          onToggle?.();
        }
      }}
      onMouseLeave={() => {
        if (!pinned && !collapsed) scheduleGentleCollapse(1800);
      }}
    >
      {/* Header with Toggle Button */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-secondary-200">
        {!collapsed && (
          <Link href="/" className="flex items-center group">
            <div className="relative w-8 h-8 mr-2 transition-transform group-hover:scale-105">
              <Image
                src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png"
                alt="Emineon"
                width={32}
                height={32}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png";
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary-900 leading-tight">
                Emineon
              </span>
              {/* Removed "ATS" label as requested */}
            </div>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <Menu className="h-5 w-5 text-secondary-600" />
            ) : (
              <X className="h-5 w-5 text-secondary-600" />
            )}
          </button>
        </div>
      </div>

      {/* Logo - Collapsed State */}
      {collapsed && (
        <div className="flex-shrink-0 flex items-center justify-center px-2 py-4">
          <Link href="/" className="group">
            <div className="relative w-8 h-8 transition-transform group-hover:scale-105">
              <Image
                src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png"
                alt="Emineon"
                width={32}
                height={32}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png";
                }}
              />
            </div>
          </Link>
        </div>
      )}

      {/* Navigation - Scrollable */}
      <nav className="flex-1 px-2 pb-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {/* Search Bar */}
        {!collapsed && (
          <div className="mb-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                id="sidebar-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-8 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-secondary-100 rounded transition-colors"
                  type="button"
                >
                  <X className="h-3 w-3 text-secondary-400" />
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Search Icon for Collapsed State */}
        {collapsed && (
          <button
            onClick={() => {
              onToggle?.();
              // Focus search input after expanding
              setTimeout(() => {
                const searchInput = document.querySelector('#sidebar-search') as HTMLInputElement;
                searchInput?.focus();
              }, 300);
            }}
            className="w-full mb-4 mt-2 p-3 rounded-lg hover:bg-secondary-50 transition-colors flex items-center justify-center"
            title="Search"
          >
            <Search className="h-4 w-4 text-secondary-500" />
          </button>
        )}
        
        {navigationSections
          .filter((section) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            // Check if section name or any item matches
            return (
              section.name.toLowerCase().includes(query) ||
              section.items.some(item => 
                item.name.toLowerCase().includes(query)
              )
            );
          })
          .map((section) => {
          const sectionActive = isSectionActive(section);
          const isCollapsed = collapsedSections.includes(section.name);
          const mainItem = section.items[0]; // First item is considered the main page
          const subItems = section.items.slice(1); // Rest are sub-items
          
          // Filter sub-items based on search
          const filteredSubItems = searchQuery 
            ? subItems.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                section.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : subItems;
          
          // Auto-expand sections when searching if they have matching sub-items
          const showItems = !section.collapsible || !isCollapsed || (searchQuery && filteredSubItems.length > 0);

          return (
            <div key={section.name} className="space-y-1">
              {/* Main Section Item */}
              {!collapsed ? (
                <div className="flex items-center">
                  <Link
                    href={mainItem.href}
                    data-test={`nav-${mainItem.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={cn(
                      'flex-1 group flex items-center rounded-lg transition-all duration-200 px-3 py-2',
                      isItemActive(mainItem.href)
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
                    )}
                  >
                    <section.icon
                      className={cn(
                        'h-4 w-4 mr-3 transition-colors',
                        isItemActive(mainItem.href)
                          ? 'text-primary-700'
                          : 'text-secondary-500 group-hover:text-secondary-700'
                      )}
                    />
                    <span className="text-sm font-medium">{section.name}</span>
                    {isItemActive(mainItem.href) && (
                      <ChevronRight className="ml-auto h-3 w-3 text-primary-700" />
                    )}
                  </Link>
                  
                  {/* Expand/Collapse Button for sections with sub-items */}
                  {section.collapsible && subItems.length > 0 && (
                    <button
                      onClick={() => toggleSection(section.name)}
                      className="ml-1 p-1 rounded hover:bg-secondary-100 transition-colors"
                      title={isCollapsed ? `Expand ${section.name}` : `Collapse ${section.name}`}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 text-secondary-500" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-secondary-500" />
                      )}
                    </button>
                  )}
                </div>
              ) : (
                // Collapsed sidebar - click expands first, keep open to allow submenu selection
                <button
                  onClick={() => {
                    cancelScheduledCollapse();
                    if (!pinned) onToggle?.();
                    // Ensure the clicked section is expanded when sidebar opens
                    setCollapsedSections(prev => prev.filter(name => name !== section.name));
                    // Schedule a gentle collapse if user does nothing
                    if (!pinned) scheduleGentleCollapse(2500);
                  }}
                  className={cn(
                    'group flex items-center rounded-lg transition-all duration-200 px-3 py-3 justify-center w-full',
                    isItemActive(mainItem.href)
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
                  )}
                  title={`Expand ${section.name}`}
                >
                  <section.icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isItemActive(mainItem.href)
                        ? 'text-primary-700'
                        : 'text-secondary-500 group-hover:text-secondary-700'
                    )}
                  />
                </button>
              )}

              {/* Sub-items */}
              {!collapsed && showItems && filteredSubItems.length > 0 && (
                <div className="ml-6 space-y-1">
                  {filteredSubItems.map((item) => {
                    const isActive = isItemActive(item.href);
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        data-test={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          'group flex items-center rounded-lg transition-all duration-200 px-3 py-2',
                          isActive
                            ? 'bg-primary-100 text-primary-700 border border-primary-200'
                            : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4 mr-3 transition-colors',
                            isActive
                              ? 'text-primary-700'
                              : 'text-secondary-500 group-hover:text-secondary-700'
                          )}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto h-3 w-3 text-primary-700" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {/* Bottom-right discreet pin control (visible only when expanded) */}
      {!collapsed && (
        <button
          onClick={onPinToggle}
          className={cn(
            "absolute bottom-3 right-3 p-2 rounded-full transition-colors border shadow-sm",
            pinned
              ? "bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100"
              : "bg-white/70 border-secondary-200/70 text-secondary-500 hover:text-secondary-700 hover:bg-white"
          )}
          title={pinned ? "Unpin sidebar" : "Pin sidebar"}
          aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          {pinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
} 