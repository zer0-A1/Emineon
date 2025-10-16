'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { useUser, useOrganization } from '@clerk/nextjs';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Briefcase, 
  Building2, 
  Brain, 
  ArrowUpRight,
  BarChart3,
  Calendar,
  MessageSquare,
  Video,
  ClipboardList,
  Mail,
  Quote,
  Sparkles,
  Clock,
  Bell,
  AlertTriangle,
  Eye,
  Send,
  Plus,
  UserPlus,
  CalendarDays,
  Timer,
  Flame,
  Hourglass,
  Handshake,
  Activity,
  Mic,
  AudioLines,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardChatbox } from '@/components/dashboard/DashboardChatbox';

interface DailyQuote {
  text: string;
  author: string;
  date: string;
}

interface UrgentItem {
  id: string;
  type: 'sla_breach' | 'interview_today' | 'follow_up_overdue' | 'candidate_waiting' | 'client_deadline';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  dueTime?: string;
  candidate?: string;
  client?: string;
  job?: string;
  action: string;
  href: string;
}

interface PriorityJob {
  id: string;
  title: string;
  client: string;
  status: 'urgent' | 'at_risk' | 'on_track' | 'stalled';
  daysToSLA: number;
  candidatesInPipeline: number;
  lastActivity: string;
  bottleneck?: string;
  nextAction: string;
}

interface RecentActivity {
  id: string;
  type: 'candidate_applied' | 'interview_completed' | 'offer_sent' | 'client_feedback' | 'assessment_submitted';
  title: string;
  description: string;
  time: string;
  candidate?: string;
  job?: string;
  client?: string;
  href: string;
}

interface QuickStat {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
  href?: string;
}

// Fallback quotes for when API is unavailable
const fallbackQuotes: DailyQuote[] = [
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
    date: "fallback"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    date: "fallback"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    date: "fallback"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    date: "fallback"
  },
  {
    text: "Your network is your net worth.",
    author: "Porter Gale",
    date: "fallback"
  },
  {
    text: "Talent wins games, but teamwork and intelligence win championships.",
    author: "Michael Jordan",
    date: "fallback"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    date: "fallback"
  }
];

import React from 'react';
import { File as FileIcon, X as XIcon } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  type HomeUpload = { id: string; name: string; type: string; status: 'uploading' | 'completed' };
  const [homeUploads, setHomeUploads] = useState<HomeUpload[]>([]);
  const handleHomeDrop = React.useCallback(async (files: FileList | File[]) => {
    try {
      const fileArray = Array.from(files || []);
      if (fileArray.length === 0) return;
      // Add placeholder chips as uploading
      const ids = fileArray.map(f => `${Date.now()}_${f.name}_${Math.random().toString(36).slice(2)}`);
      setHomeUploads(prev => ([
        ...prev,
        ...fileArray.map((f, i) => ({ id: ids[i], name: f.name, type: f.type || 'application/octet-stream', status: 'uploading' as const }))
      ]));

      const toBase64 = (file: File) => new Promise<{ name: string; type: string; data: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', data: (reader.result as string) });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const encoded = await Promise.all(fileArray.map(f => toBase64(f)));
      sessionStorage.setItem('ai_dropped_files', JSON.stringify(encoded));
      // Signal Copilot to ignore the immediate native drop event to avoid double attachments
      sessionStorage.setItem('ai_skip_drop', '1');
      // Mark chips completed
      setHomeUploads(prev => prev.map(u => (
        ids.some(id => id === u.id) ? { ...u, status: 'completed' } : u
      )));

      // Subtle toast hint
      try {
        const hintId = `upload-hint-${Date.now()}`;
        const hint = document.createElement('div');
        hint.id = hintId;
        hint.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white/95 border border-neutral-200 shadow-md rounded-full px-3 py-1 text-xs text-neutral-700';
        hint.textContent = 'Document attached';
        document.body.appendChild(hint);
        setTimeout(()=>{
          const el = document.getElementById(hintId);
          if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 2000);
      } catch {}

      // Navigate to Copilot so the chip shows there and the files are available immediately
      router.push('/ai-copilot');
    } catch {
      // no-op
    }
  }, []);

  // Global drag handlers to avoid flicker between children
  useEffect(() => {
    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDragEnter = (e: DragEvent) => { e.preventDefault(); setDragCounter(c=>c+1); setIsDragOver(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setDragCounter(c=>{ const n=Math.max(0,c-1); if(n===0) setIsDragOver(false); return n; }); };
    const onDropGlobal = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) handleHomeDrop(files as any);
      setDragCounter(0);
      setIsDragOver(false);
    };
    window.addEventListener('dragover', onDragOver as any);
    window.addEventListener('dragenter', onDragEnter as any);
    window.addEventListener('dragleave', onDragLeave as any);
    window.addEventListener('drop', onDropGlobal as any);
    return () => {
      window.removeEventListener('dragover', onDragOver as any);
      window.removeEventListener('dragenter', onDragEnter as any);
      window.removeEventListener('dragleave', onDragLeave as any);
      window.removeEventListener('drop', onDropGlobal as any);
    };
  }, [handleHomeDrop]);
  const [showPlan, setShowPlan] = useState(false);
  const { user } = useUser();
  const { organization } = useOrganization();
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchDailyQuote = async () => {
      try {
        // Try to fetch from API (no-cache so each reload may show a new quote)
        const response = await fetch('/api/daily-quote', { cache: 'no-store' });
        if (response.ok) {
          const apiResponse = await response.json();
          // Extract the quote from the nested API response structure
          const quoteData = {
            text: apiResponse.data.quote.text,
            author: apiResponse.data.quote.author,
            date: apiResponse.data.date
          };
          setDailyQuote(quoteData);
        } else {
          throw new Error('API unavailable');
        }
      } catch (error) {
        console.log('Using fallback quote');
        // Pick a random fallback quote if API fails
        const fallbackQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        setDailyQuote(fallbackQuote);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchDailyQuote();
  }, []);

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Urgent items derived from live data
  const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([]);

  // Priority jobs derived from live data
  const [priorityJobs, setPriorityJobs] = useState<PriorityJob[]>([]);

  // Recent activity feed from live data
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const criticalCount = useMemo(() => urgentItems.filter(item => item.priority === 'critical').length, [urgentItems]);

  // Performance metrics (live, UI preserved)
  const [performanceStats, setPerformanceStats] = useState<QuickStat[]>([
    { label: 'Active Jobs', value: '—', icon: Briefcase, color: 'blue', href: '/jobs' },
    { label: 'Candidates in Pipeline', value: '—', icon: Users, color: 'green', href: '/candidates' },
    { label: 'Avg. Time to Fill', value: '—', icon: Timer, color: 'purple', href: '/analytics' },
    { label: 'This Week Placements', value: '—', icon: Handshake, color: 'orange', href: '/reports' }
  ]);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const actionPlanToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch('/api/jobs?limit=200');
        if (!res.ok) return;
        const data = await res.json();
        const jobs: any[] = data?.jobs || [];

        const normalizeStatus = (s: any) => (typeof s === 'string' ? s.toUpperCase() : '');
        const activeJobs = jobs.filter(j => normalizeStatus(j.status) === 'ACTIVE').length;

        const totalApplications = jobs.reduce((sum, j) => {
          const apps = Array.isArray(j.applications) ? j.applications : [];
          const count = j._count?.applications || apps.length || 0;
          return sum + count;
        }, 0);

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const hiresThisWeek = jobs.reduce((sum, j) => {
          const apps = Array.isArray(j.applications) ? j.applications : [];
          const hires = apps.filter((a: any) => normalizeStatus(a.status) === 'HIRED' && a.updatedAt && new Date(a.updatedAt) >= weekAgo).length;
          return sum + hires;
        }, 0);

        const closedJobs = jobs.filter(j => normalizeStatus(j.status) === 'CLOSED');
        let avgDays = 0;
        if (closedJobs.length > 0) {
          const days = closedJobs.map((j: any) => {
            const start = new Date(j.createdAt).getTime();
            const end = new Date(j.updatedAt || j.createdAt).getTime();
            return Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
          });
          avgDays = days.reduce((a: number, b: number) => a + b, 0) / days.length;
        } else if (jobs.length > 0) {
          const days = jobs.map((j: any) => {
            const start = new Date(j.createdAt).getTime();
            return Math.max(0, (now.getTime() - start) / (1000 * 60 * 60 * 24));
          });
          avgDays = days.reduce((a: number, b: number) => a + b, 0) / days.length;
        }

        setPerformanceStats([
          { label: 'Active Jobs', value: activeJobs, icon: Briefcase, color: 'blue', href: '/jobs' },
          { label: 'Candidates in Pipeline', value: totalApplications, icon: Users, color: 'green', href: '/candidates' },
          { label: 'Avg. Time to Fill', value: `${Math.round(avgDays)}d`, icon: Timer, color: 'purple', href: '/analytics' },
          { label: 'This Week Placements', value: hiresThisWeek, icon: Handshake, color: 'orange', href: '/reports' }
        ]);

        // Helper to format relative time
        const relativeTime = (dateStr: string | Date) => {
          const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
          const diffMs = now.getTime() - d.getTime();
          const mins = Math.floor(diffMs / 60000);
          if (mins < 60) return `${mins} min ago`;
          const hrs = Math.floor(mins / 60);
          if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
          const days = Math.floor(hrs / 24);
          return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        };

        // Compute Priority Jobs
        const prioJobs: PriorityJob[] = jobs.map((j: any) => {
          const deadline = j.slaDeadline ? new Date(j.slaDeadline) : null;
          const daysToSLA = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
          const apps = Array.isArray(j.applications) ? j.applications : [];
          const candidatesInPipeline = j._count?.applications || apps.length || 0;
          const lastUpdate = apps.reduce((acc: Date | null, a: any) => {
            const u = a.updatedAt ? new Date(a.updatedAt) : null;
            return !acc || (u && u > acc) ? u : acc;
          }, null as Date | null);
          let status: PriorityJob['status'] = 'on_track';
          if (daysToSLA < 0) status = 'urgent';
          else if (daysToSLA <= 3) status = 'at_risk';
          else if (candidatesInPipeline === 0) status = 'stalled';
          const nextAction = status === 'urgent' ? 'Escalate to client' : status === 'at_risk' ? 'Schedule interviews' : status === 'stalled' ? 'Source candidates' : 'Review applications';
          return {
            id: j.id,
            title: j.title,
            client: j.client?.name || 'Client',
            status,
            daysToSLA: isFinite(daysToSLA) ? daysToSLA : 0,
            candidatesInPipeline,
            lastActivity: lastUpdate ? relativeTime(lastUpdate) : 'No activity',
            bottleneck: status === 'stalled' ? 'No candidates yet' : undefined,
            nextAction,
          };
        }).sort((a, b) => a.daysToSLA - b.daysToSLA).slice(0, 6);
        setPriorityJobs(prioJobs);

        // Compute Urgent Items
        const urgent: UrgentItem[] = [];
        jobs.forEach((j: any) => {
          const deadline = j.slaDeadline ? new Date(j.slaDeadline) : null;
          if (normalizeStatus(j.status) === 'ACTIVE' && deadline && now > deadline) {
            const overdueDays = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
            urgent.push({
              id: `sla-${j.id}`,
              type: 'sla_breach',
              title: 'SLA Breach',
              description: `${j.title} is ${overdueDays}d overdue`,
              priority: overdueDays > 3 ? 'critical' : 'high',
              client: j.client?.name,
              job: j.title,
              action: 'Review pipeline',
              href: `/jobs/${j.id}`,
            });
          }
          const apps = Array.isArray(j.applications) ? j.applications : [];
          const lastUpdate = apps.reduce((acc: Date | null, a: any) => {
            const u = a.updatedAt ? new Date(a.updatedAt) : null;
            return !acc || (u && u > acc) ? u : acc;
          }, null as Date | null);
          if (normalizeStatus(j.status) === 'ACTIVE' && lastUpdate && (now.getTime() - lastUpdate.getTime()) > 5 * 24 * 60 * 60 * 1000) {
            urgent.push({
              id: `follow-${j.id}`,
              type: 'follow_up_overdue',
              title: 'Follow-up overdue',
              description: `${j.title} has no updates for ${relativeTime(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)).replace(' ago','')}`,
              priority: 'medium',
              client: j.client?.name,
              job: j.title,
              action: 'Contact client',
              href: `/jobs/${j.id}`,
            });
          }
          const waiting = apps.find((a: any) => normalizeStatus(a.status) === 'INTERVIEWED');
          if (waiting) {
            urgent.push({
              id: `wait-${waiting.id}`,
              type: 'candidate_waiting',
              title: 'Candidate awaiting feedback',
              description: `${j.title}: interview completed`,
              priority: 'high',
              candidate: '',
              job: j.title,
              action: 'Provide feedback',
              href: `/jobs/${j.id}`,
            });
          }
        });
        setUrgentItems(urgent.slice(0, 6));

        // Recent Activity from applications across jobs
        const activities: RecentActivity[] = [];
        jobs.forEach((j: any) => {
          const apps = Array.isArray(j.applications) ? j.applications : [];
          apps.forEach((a: any) => {
            const updated = a.updatedAt ? new Date(a.updatedAt) : null;
            const created = a.createdAt ? new Date(a.createdAt) : null;
            if (created) {
              activities.push({
                id: `app-${a.id}-c`,
                type: 'candidate_applied',
                title: 'New application',
                description: `Application received for ${j.title}`,
                time: relativeTime(created),
                candidate: '',
                job: j.title,
                href: `/jobs/${j.id}`,
              });
            }
            if (updated) {
              const st = normalizeStatus(a.status);
              const map: any = {
                INTERVIEWED: 'interview_completed',
                OFFER_EXTENDED: 'offer_sent',
                REVIEWING: 'client_feedback',
              };
              const type = map[st];
              if (type) {
                activities.push({
                  id: `app-${a.id}-u`,
                  type,
                  title: type === 'offer_sent' ? 'Offer sent' : type === 'interview_completed' ? 'Interview completed' : 'Client review update',
                  description: `${j.title} status: ${st.replace('_',' ')}`,
                  time: relativeTime(updated),
                  job: j.title,
                  href: `/jobs/${j.id}`,
                });
              }
            }
          });
        });
        activities.sort((a, b) => 0); // already relative; keep order of push
        setRecentActivity(activities.slice(0, 12));
      } catch (e) {
        // leave defaults
      }
    };
    loadDashboard();
  }, []);

  const getUrgentItemIcon = (type: UrgentItem['type']) => {
    switch (type) {
      case 'sla_breach': return AlertTriangle;
      case 'interview_today': return Video;
      case 'follow_up_overdue': return Clock;
      case 'candidate_waiting': return Hourglass;
      case 'client_deadline': return Calendar;
      default: return Bell;
    }
  };

  const getUrgentItemColor = (priority: UrgentItem['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-700';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getJobStatusColor = (status: PriorityJob['status']) => {
    switch (status) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'at_risk': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'stalled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'on_track': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'candidate_applied': return UserPlus;
      case 'interview_completed': return Video;
      case 'offer_sent': return Send;
      case 'client_feedback': return MessageSquare;
      case 'assessment_submitted': return ClipboardList;
      default: return Activity;
    }
  };

  return (
    <>
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8">
        {/* Minimalist hero like AI Copilot */}
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center select-none mb-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-white ring-4 ring-primary-200 shadow-[0_0_40px_rgba(37,99,235,0.35)] flex items-center justify-center animate-pulse">
              <Image src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png" alt="Emineon Logo" width={56} height={56} />
            </div>
            {isDragOver && (
              <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none select-none">
                <div className="text-center px-6 py-8 bg-white/90 rounded-2xl shadow-xl border border-neutral-200 pointer-events-auto">
                  <div className="text-lg font-semibold text-neutral-900 mb-2">Add anything</div>
                  <div className="text-sm text-neutral-600">Drop any file here to add it to the conversation.</div>
                </div>
              </div>
            )}
          </div>
          {(() => {
            const firstName = user?.firstName || user?.fullName?.split(' ')?.[0] || '';
            const line1 = firstName ? `Hello, ${firstName}` : 'Hello';
            const line2 = 'How can I help you today?';
            const [phase, setPhase] = React.useState<'typing1'|'typing2'|'done'>('typing1');
            const [text1, setText1] = React.useState('');
            const [text2, setText2] = React.useState('');
            React.useEffect(() => {
              if (phase === 'typing1') {
                if (text1.length < line1.length) {
                  const t = setTimeout(() => setText1(line1.slice(0, text1.length + 1)), 35);
                  return () => clearTimeout(t);
                }
                const t = setTimeout(() => setPhase('typing2'), 300);
                return () => clearTimeout(t);
              }
              if (phase === 'typing2') {
                if (text2.length < line2.length) {
                  const t = setTimeout(() => setText2(line2.slice(0, text2.length + 1)), 35);
                  return () => clearTimeout(t);
                }
                setPhase('done');
              }
            }, [phase, text1, text2, line1, line2]);
            return (
              <div className="mb-6 text-neutral-700">
                <h1 className="text-xl md:text-2xl font-normal">
                  <span className="font-semibold">{text1}</span>{text2 ? ' ' : ''}
                  <span className="font-normal">{text2}</span>
                  {phase !== 'done' && (
                    <span className="ml-1 inline-block w-[1px] h-5 bg-neutral-400 align-middle animate-pulse" />
                  )}
                </h1>
              </div>
            );
          })()}

          {/* Suggestions toggle */}
          <div className="w-full max-w-5xl mx-auto -mt-2 mb-4">
            <button
              type="button"
              onClick={() => setShowSuggestions(v => !v)}
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800"
              aria-expanded={showSuggestions}
            >
              <span>Suggestions</span>
              {showSuggestions ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.53 8.47a.75.75 0 00-1.06 0l-7 7a.75.75 0 101.06 1.06L12 10.56l6.47 6.97a.75.75 0 101.06-1.06l-7-7z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.47 15.53a.75.75 0 001.06 0l7-7a.75.75 0 10-1.06-1.06L12 13.44 5.53 7.47A.75.75 0 104.47 8.53l7 7z" clipRule="evenodd" /></svg>
              )}
            </button>
          </div>

          {showSuggestions && (
            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Create Job */}
              <a href="/jobs" className="block rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-purple-50 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-[#0A2F5A]/10">
                    <Briefcase className="w-5 h-5 text-[#0A2F5A]" />
                  </div>
                  <span className="text-xs text-neutral-600">Quick action</span>
                </div>
                <div className="text-neutral-900 font-semibold">Create a Job</div>
                <div className="text-sm text-neutral-600 mt-1">Post a new role and start sourcing</div>
              </a>
              {/* Add Candidate */}
              <a href="/candidates" className="block rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-purple-50 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-[#0A2F5A]/10">
                    <UserPlus className="w-5 h-5 text-[#0A2F5A]" />
                  </div>
                  <span className="text-xs text-neutral-600">Quick action</span>
                </div>
                <div className="text-neutral-900 font-semibold">Add a Candidate</div>
                <div className="text-sm text-neutral-600 mt-1">Upload CV or create a profile</div>
              </a>
              {/* Create Competence File */}
              <a href="/competence-files" className="block rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-purple-50 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-[#0A2F5A]/10">
                    <ClipboardList className="w-5 h-5 text-[#0A2F5A]" />
                  </div>
                  <span className="text-xs text-neutral-600">Quick action</span>
                </div>
                <div className="text-neutral-900 font-semibold">Create Competence File</div>
                <div className="text-sm text-neutral-600 mt-1">Generate a client-ready profile</div>
              </a>
              {/* AI Matching */}
              <a href="/jobs" className="block rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-purple-50 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-[#0A2F5A]/10">
                    <Brain className="w-5 h-5 text-[#0A2F5A]" />
                  </div>
                  <span className="text-xs text-neutral-600">AI</span>
                </div>
                <div className="text-neutral-900 font-semibold">Run AI Matching</div>
                <div className="text-sm text-neutral-600 mt-1">Match candidates to open jobs</div>
              </a>
            </div>
          )}
          <div className="w-full max-w-3xl">
            <div
              className="flex items-center gap-2 bg-white border border-neutral-300 rounded-full px-3 py-2 shadow-sm"
              onDragOver={(e)=>{ e.preventDefault(); }}
            >
              {/* Upload chips */}
              {homeUploads.length > 0 && (
                <div className="absolute -top-14 left-0 right-0 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {homeUploads.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 shadow-sm">
                        <div className={`h-6 w-6 rounded-md flex items-center justify-center ${doc.status === 'uploading' ? 'bg-primary-100' : 'bg-primary-200'}`}>
                          {doc.status === 'uploading' ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-primary-600" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                          ) : (
                            <FileIcon className="h-3.5 w-3.5 text-primary-700" />
                          )}
                        </div>
                        <div className="text-xs text-neutral-800 max-w-[220px] truncate" title={doc.name}>{doc.name}</div>
                        <button onClick={()=> setHomeUploads(prev => prev.filter(d => d.id !== doc.id))} className="text-neutral-400 hover:text-neutral-600">
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" onClick={() => (document.getElementById('home-file-picker') as HTMLInputElement)?.click()} title="Attach documents">
                <Plus className="w-5 h-5 text-neutral-700" />
              </button>
              <input id="home-file-picker" type="file" multiple hidden accept=".pdf,.doc,.docx,.txt" onChange={(e)=>{ const files = Array.from(e.target.files || []); if(files.length){ handleHomeDrop(files as any);} (e.target as HTMLInputElement).value=''; }} />
              <input
                type="text"
                onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value.trim(); if(v) router.push(`/ai-copilot?message=${encodeURIComponent(v)}`); } }}
                placeholder="Ask Emineon"
                className="flex-1 px-3 py-3 outline-none text-neutral-900 placeholder-neutral-500 bg-transparent"
                onDragOver={(e)=>{ e.preventDefault(); }}
              />
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" title="Voice">
                <Mic className="w-5 h-5 text-neutral-700" />
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" title="Transcribe">
                <AudioLines className="w-5 h-5 text-neutral-700" />
              </button>
            </div>
          </div>
          {isLoadingQuote && (
            <div className="mt-8 max-w-3xl w-full">
              <div className="space-y-2 animate-pulse">
                <div className="h-4 rounded bg-neutral-200/60 w-11/12"></div>
                <div className="h-4 rounded bg-neutral-200/50 w-10/12"></div>
                <div className="h-3 rounded bg-neutral-200/40 w-3/12 mt-3"></div>
              </div>
            </div>
          )}
          {dailyQuote && (
            <div className="mt-8 max-w-3xl text-left">
              <div className="flex items-start gap-3 text-neutral-700">
                <Quote className="w-6 h-6 text-primary-600 mt-1" />
                <div>
                  <p className="italic">“{dailyQuote.text}”</p>
                  <p className="text-sm text-neutral-500 mt-2">— {dailyQuote.author}</p>
                </div>
              </div>
            </div>
          )}
          {/* Bottom fixed action plan toggle */}
        </div>

        {/* 🎯 ACTIONS FOR TODAY - Friendly, inviting section */}
        {showPlan && urgentItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white ring-2 ring-primary-300 shadow-[0_0_24px_rgba(37,99,235,0.35)] animate-pulse">
                  <ClipboardList className="h-4 w-4 text-primary-700" />
                </span>
                <h2 id="todays-action-plan" className="text-xl font-normal text-neutral-700">Today's Action Plan</h2>
                {/* Critical-only filter pill */}
                <button
                  type="button"
                  onClick={() => setCriticalOnly(prev => !prev)}
                  className={`text-xs font-medium px-2 py-1 rounded-full border transition-colors ${
                    criticalOnly
                      ? 'bg-red-600 text-white border-red-600'
                      : criticalCount === 0
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                  aria-pressed={criticalOnly}
                  aria-label="Toggle critical actions only"
                >
                  {criticalCount} critical
                </button>
              </div>
              <Link href="/jobs">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(criticalOnly ? urgentItems.filter(i => i.priority === 'critical') : urgentItems).slice(0, 4).map((item) => {
                const Icon = getUrgentItemIcon(item.type);
                return (
                  <Link key={item.id} href={item.href}>
                    <div className={`p-4 rounded-xl border-2 hover:shadow-lg transition-all duration-200 cursor-pointer ${getUrgentItemColor(item.priority)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white/50 rounded-lg">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{item.title}</h3>
                            <p className="text-xs opacity-80">{item.description}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 opacity-60" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs flex items-center space-x-3">
                          {item.candidate && (
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{item.candidate}</span>
                            </span>
                          )}
                          {item.client && (
                            <span className="flex items-center space-x-1">
                              <Building2 className="h-3 w-3" />
                              <span>{item.client}</span>
                            </span>
                          )}
                          {item.dueTime && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{item.dueTime}</span>
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                          {item.action}
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 📊 PERFORMANCE OVERVIEW */}
        {showPlan && (
        <div id="dashboard-sections" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {performanceStats.map((stat, index) => (
            <Link key={index} href={stat.href || '#'}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                  {stat.change && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      stat.changeType === 'positive' ? 'bg-green-50 text-green-700' :
                      stat.changeType === 'negative' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {stat.change}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}

        {/* 🎯 PRIORITY JOBS & 📈 RECENT ACTIVITY */}
        {showPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Priority Jobs - Jobs that need attention */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Priority Jobs</h3>
                  <p className="text-sm text-gray-600">Jobs requiring your attention</p>
                </div>
                <Link href="/jobs">
                  <Button variant="outline" size="sm">
                    <Briefcase className="h-4 w-4 mr-2" />
                    All Jobs
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {priorityJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{job.client}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${job.daysToSLA < 0 ? 'text-red-600' : job.daysToSLA <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                          {job.daysToSLA < 0 ? `${Math.abs(job.daysToSLA)}d overdue` : `${job.daysToSLA}d to SLA`}
                        </div>
                        <div className="text-xs text-gray-500">{job.candidatesInPipeline} candidates</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {job.bottleneck && (
                          <span className="flex items-center space-x-1 text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{job.bottleneck}</span>
                          </span>
                        )}
                        {!job.bottleneck && <span>Last activity: {job.lastActivity}</span>}
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                        {job.nextAction}
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <p className="text-sm text-gray-600">Latest updates across your pipeline</p>
                </div>
                <Link href="/activity">
                  <Button variant="outline" size="sm">
                    <Activity className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <Link key={activity.id} href={activity.href}>
                    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          {activity.candidate && (
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{activity.candidate}</span>
                            </span>
                          )}
                          {activity.client && (
                            <span className="flex items-center space-x-1">
                              <Building2 className="h-3 w-3" />
                              <span>{activity.client}</span>
                            </span>
                          )}
                          {activity.job && (
                            <span className="flex items-center space-x-1">
                              <Briefcase className="h-3 w-3" />
                              <span>{activity.job}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        )}

        {/* Quick Actions removed per request */}
      </div>
    </Layout>
    {/* Fixed bottom toggle */}
    <div className="fixed bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white/90 border border-neutral-200 rounded-full px-3 py-1.5 shadow-sm">
        <button
          ref={actionPlanToggleRef}
          type="button"
          onClick={() => {
            const next = !showPlan;
            setShowPlan(next);
            if (!next) return;
            setTimeout(() => {
              try {
                document.getElementById('todays-action-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } catch {}
            }, 50);
          }}
          className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
          aria-expanded={showPlan}
        >
          <span>{showPlan ? "Hide today's action plan" : "Show me today's action plan"}</span>
          {showPlan ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.53 8.47a.75.75 0 00-1.06 0l-7 7a.75.75 0 101.06 1.06L12 10.56l6.47 6.97a.75.75 0 101.06-1.06l-7-7z" clipRule="evenodd" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.47 15.53a.75.75 0 001.06 0l7-7a.75.75 0 10-1.06-1.06L12 13.44 5.53 7.47A.75.75 0 104.47 8.53l7 7z" clipRule="evenodd" /></svg>
          )}
        </button>
      </div>
    </div>
    </>
  );
} 