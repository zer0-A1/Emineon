'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, Users, Briefcase, ClipboardList, Activity } from 'lucide-react';

type ApiItem = Record<string, any>;

export default function InsightsPage() {
  const [jobs, setJobs] = useState<ApiItem[] | null>(null);
  const [candidates, setCandidates] = useState<ApiItem[] | null>(null);
  const [applications, setApplications] = useState<ApiItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [jobsRes, candidatesRes, applicationsRes] = await Promise.all([
          fetch('/api/jobs', { cache: 'no-store' }).catch(() => null),
          fetch('/api/candidates', { cache: 'no-store' }).catch(() => null),
          fetch('/api/applications', { cache: 'no-store' }).catch(() => null),
        ]);

        const jobsJson = jobsRes && jobsRes.ok ? await jobsRes.json() : null;
        const candidatesJson = candidatesRes && candidatesRes.ok ? await candidatesRes.json() : null;
        const applicationsJson = applicationsRes && applicationsRes.ok ? await applicationsRes.json() : null;

        if (!mounted) return;
        setJobs(Array.isArray(jobsJson) ? jobsJson : (Array.isArray(jobsJson?.data) ? jobsJson.data : null));
        setCandidates(Array.isArray(candidatesJson) ? candidatesJson : (Array.isArray(candidatesJson?.data) ? candidatesJson.data : null));
        setApplications(Array.isArray(applicationsJson) ? applicationsJson : (Array.isArray(applicationsJson?.data) ? applicationsJson.data : null));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totalJobs = jobs?.length ?? 0;
  const totalCandidates = candidates?.length ?? 0;
  const totalApplications = applications?.length ?? 0;

  // Try to surface locally created assessments cached by the app (non-blocking)
  const totalAssessments = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = sessionStorage.getItem('assessments_list');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, []);

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-6 w-6 text-primary-600 mr-2" />
              Insights
            </h1>
            <p className="text-gray-600 mt-1">High-level KPIs across your ATS.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center">
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Jobs</div>
                  <div className="text-2xl font-semibold text-gray-900">{loading ? '—' : totalJobs}</div>
                </div>
                <Briefcase className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Candidates</div>
                  <div className="text-2xl font-semibold text-gray-900">{loading ? '—' : totalCandidates}</div>
                </div>
                <Users className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Applications</div>
                  <div className="text-2xl font-semibold text-gray-900">{loading ? '—' : totalApplications}</div>
                </div>
                <Activity className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Assessments</div>
                  <div className="text-2xl font-semibold text-gray-900">{totalAssessments}</div>
                </div>
                <ClipboardList className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simple Trends (placeholders without external charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Applications trend (last 14 days)</h3>
                <Badge variant="secondary">Overview</Badge>
              </div>
              <div className="h-32 bg-gray-100 rounded flex items-end p-2 gap-2">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="flex-1 bg-primary-200 rounded" style={{ height: `${20 + (i % 7) * 10}px` }} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Candidate pipeline</h3>
                <Badge variant="secondary">Snapshot</Badge>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'New', value: Math.max(0, Math.round((totalCandidates || 0) * 0.25)) },
                  { label: 'Screening', value: Math.max(0, Math.round((totalCandidates || 0) * 0.35)) },
                  { label: 'Interview', value: Math.max(0, Math.round((totalCandidates || 0) * 0.25)) },
                  { label: 'Offer', value: Math.max(0, Math.round((totalCandidates || 0) * 0.15)) },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded border bg-white">
                    <div className="text-xs text-gray-600 mb-1">{s.label}</div>
                    <div className="text-lg font-semibold text-gray-900">{loading ? '—' : s.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


