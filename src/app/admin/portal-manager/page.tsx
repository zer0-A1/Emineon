'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import PortalManager from '@/components/portal/PortalManager';
import { CreatePortalModal } from '@/components/portal/CreatePortalModal';
import { 
  Building2, 
  Users, 
  Activity, 
  Globe,
  Mail,
  Settings,
  Plus,
  BarChart3,
  Search,
  Banknote,
  CreditCard,
  Watch,
  Pill,
  FlaskConical,
  Coffee,
  ShieldCheck,
  Clock,
  ExternalLink
} from 'lucide-react';

interface PortalStats {
  totalPortals: number;
  activeUsers: number;
  totalJobs: number;
  totalCandidates: number;
  monthlyInvitations: number;
  weeklyActivity: number;
}

export default function PortalManagerPage() {
  const [currentPortalId, setCurrentPortalId] = useState<string>();
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data for demo
  useEffect(() => {
    const mockStats: PortalStats = {
      totalPortals: 9,
      activeUsers: 55,
      totalJobs: 65,
      totalCandidates: 1567,
      monthlyInvitations: 31,
      weeklyActivity: 210
    };

    setStats(mockStats);
    setLoading(false);
  }, []);

  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Set base URL on client side to avoid window reference issues
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Icon mapping for different industries
  const getCompanyIcon = (clientId: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'client-ubs': <Banknote className="h-8 w-8 text-blue-600" />,
      'client-credit-suisse': <CreditCard className="h-8 w-8 text-blue-700" />,
      'client-rolex': <Watch className="h-8 w-8 text-yellow-600" />,
      'client-novartis': <Pill className="h-8 w-8 text-blue-500" />,
      'client-roche': <FlaskConical className="h-8 w-8 text-orange-500" />,
      'client-nestle': <Coffee className="h-8 w-8 text-amber-700" />,
      'client-zurich-insurance': <ShieldCheck className="h-8 w-8 text-red-600" />,
      'client-patek-philippe': <Clock className="h-8 w-8 text-yellow-500" />
    };
    return iconMap[clientId] || <Building2 className="h-8 w-8 text-gray-600" />;
  };

  const mockPortals = [
    {
      id: '0',
      clientId: 'client-dataflow-innovations',
      clientName: 'DataFlow Innovations AG',
      clientIcon: <Building2 className="h-8 w-8 text-blue-600" />,
      status: 'active' as const,
      activeJobs: 3,
      totalCandidates: 35,
      lastActivity: '2024-06-24T12:30:00Z',
      portalUrl: `${baseUrl}/clients/client-dataflow-innovations/portal`,
      accessLevel: 'ADMIN' as const,
      invitedUsers: [
        { email: 'emmanuel.d@dataflow-innovations.com', role: 'ADMIN', status: 'accepted' as const, invitedAt: '2024-06-24T09:00:00Z' },
        { email: 'hr.director@dataflow-innovations.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-06-24T10:30:00Z' },
        { email: 'tech.lead@dataflow-innovations.com', role: 'COLLABORATOR', status: 'pending' as const, invitedAt: '2024-06-24T11:15:00Z' }
      ]
    },
    {
      id: '1',
      clientId: 'client-alpinebank',
      clientName: 'Alpine Banking Solutions',
      clientIcon: getCompanyIcon('client-ubs'),
      status: 'active' as const,
      activeJobs: 8,
      totalCandidates: 156,
      lastActivity: '2024-02-15T10:30:00Z',
      portalUrl: `${baseUrl}/clients/client-alpinebank/portal`,
      accessLevel: 'ADMIN' as const,
      invitedUsers: [
        { email: 'talent@alpinebank.com', role: 'ADMIN', status: 'accepted' as const, invitedAt: '2024-02-01T09:00:00Z' },
        { email: 'hr.director@alpinebank.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-02-10T14:30:00Z' }
      ]
    },
    {
      id: '2',
      clientId: 'client-globalfinance',
      clientName: 'Global Finance Partners',
      clientIcon: getCompanyIcon('client-credit-suisse'),
      status: 'active' as const,
      activeJobs: 5,
      totalCandidates: 98,
      lastActivity: '2024-02-14T16:45:00Z',
      portalUrl: `${baseUrl}/clients/client-globalfinance/portal`,
      accessLevel: 'COLLABORATOR' as const,
      invitedUsers: [
        { email: 'recruitment@globalfinance.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-01-15T11:20:00Z' }
      ]
    },
    {
      id: '3',
      clientId: 'client-luxurywatch',
      clientName: 'Swiss Luxury Timepieces',
      clientIcon: getCompanyIcon('client-rolex'),
      status: 'active' as const,
      activeJobs: 4,
      totalCandidates: 67,
      lastActivity: '2024-02-13T08:15:00Z',
      portalUrl: `${baseUrl}/clients/client-luxurywatch/portal`,
      accessLevel: 'ADMIN' as const,
      invitedUsers: [
        { email: 'hr@luxurywatch.com', role: 'ADMIN', status: 'accepted' as const, invitedAt: '2024-01-20T10:00:00Z' },
        { email: 'talent.acquisition@luxurywatch.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-02-05T15:30:00Z' }
      ]
    },
    {
      id: '4',
      clientId: 'client-biopharma',
      clientName: 'BioPharma Innovations',
      clientIcon: getCompanyIcon('client-novartis'),
      status: 'active' as const,
      activeJobs: 12,
      totalCandidates: 289,
      lastActivity: '2024-02-15T12:20:00Z',
      portalUrl: `${baseUrl}/clients/client-biopharma/portal`,
      accessLevel: 'ADMIN' as const,
      invitedUsers: [
        { email: 'global.talent@biopharma.com', role: 'ADMIN', status: 'accepted' as const, invitedAt: '2024-01-20T10:00:00Z' },
        { email: 'hr.basel@biopharma.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-01-25T15:30:00Z' },
        { email: 'recruiter.emea@biopharma.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-02-12T09:45:00Z' }
      ]
    },
    {
      id: '5',
      clientId: 'client-healthtech',
      clientName: 'HealthTech Research Group',
      clientIcon: getCompanyIcon('client-roche'),
      status: 'active' as const,
      activeJobs: 9,
      totalCandidates: 201,
      lastActivity: '2024-02-15T09:15:00Z',
      portalUrl: `${baseUrl}/clients/client-healthtech/portal`,
      accessLevel: 'ADMIN' as const,
      invitedUsers: [
        { email: 'talent.acquisition@healthtech.com', role: 'ADMIN', status: 'accepted' as const, invitedAt: '2024-01-18T14:00:00Z' },
        { email: 'hr.switzerland@healthtech.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-02-01T11:30:00Z' }
      ]
    },
    {
      id: '6',
      clientId: 'client-foodglobal',
      clientName: 'Global Food Solutions',
      clientIcon: getCompanyIcon('client-nestle'),
      status: 'active' as const,
      activeJobs: 15,
      totalCandidates: 342,
      lastActivity: '2024-02-15T14:45:00Z',
      portalUrl: `${baseUrl}/clients/client-foodglobal/portal`,
      accessLevel: 'ADMIN' as const,
      invitedUsers: [
        { email: 'global.recruitment@foodglobal.com', role: 'ADMIN', status: 'accepted' as const, invitedAt: '2024-01-10T09:00:00Z' },
        { email: 'hr.vevey@foodglobal.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-01-22T16:20:00Z' },
        { email: 'talent.emea@foodglobal.com', role: 'COLLABORATOR', status: 'pending' as const, invitedAt: '2024-02-14T10:15:00Z' }
      ]
    },
    {
      id: '7',
      clientId: 'client-insuranceplus',
      clientName: 'Insurance Plus Group',
      clientIcon: getCompanyIcon('client-zurich-insurance'),
      status: 'active' as const,
      activeJobs: 6,
      totalCandidates: 134,
      lastActivity: '2024-02-14T17:30:00Z',
      portalUrl: `${baseUrl}/clients/client-insuranceplus/portal`,
      accessLevel: 'COLLABORATOR' as const,
      invitedUsers: [
        { email: 'talent@insuranceplus.com', role: 'COLLABORATOR', status: 'accepted' as const, invitedAt: '2024-01-28T13:45:00Z' }
      ]
    },
    {
      id: '8',
      clientId: 'client-prestige',
      clientName: 'Prestige Craft Manufacturing',
      clientIcon: getCompanyIcon('client-patek-philippe'),
      status: 'pending' as const,
      activeJobs: 3,
      totalCandidates: 45,
      lastActivity: '2024-02-12T11:20:00Z',
      portalUrl: `${baseUrl}/clients/client-prestige/portal`,
      accessLevel: 'VIEWER' as const,
      invitedUsers: [
        { email: 'hr@prestige.com', role: 'VIEWER', status: 'pending' as const, invitedAt: '2024-02-10T15:00:00Z' }
      ]
    }
  ];

  const handleSwitchPortal = (portalId: string) => {
    setCurrentPortalId(portalId);
    // Navigate to the selected portal
    const portal = mockPortals.find(p => p.id === portalId);
    if (portal) {
      window.open(portal.portalUrl, '_blank');
    }
  };

  const handleSharePortal = (portalId: string, method: 'link' | 'email') => {
    const portal = mockPortals.find(p => p.id === portalId);
    if (!portal) return;

    if (method === 'link') {
      // Copy link functionality is handled in PortalManager component
      console.log('Copying link for portal:', portal.clientName);
    } else if (method === 'email') {
      // Implement email invitation
      console.log('Sending email invitation for portal:', portal.clientName);
      // Here you would integrate with your email service
    }
  };

  const handleInviteUser = (portalId: string, email: string, role: string) => {
    console.log('Inviting user to portal:', { portalId, email, role });
    // Here you would integrate with your invitation system
  };

  const handleManageSettings = (portalId: string) => {
    console.log('Managing settings for portal:', portalId);
    // TODO: Implement settings management
  };

  const handlePortalCreated = (newPortal: unknown) => {
    console.log('New portal created:', newPortal);
    // TODO: Refresh the portals list or add the new portal to the current list
    if (stats) {
      setStats({
        ...stats,
        totalPortals: stats.totalPortals + 1
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Portal Management</h1>
            <p className="text-neutral-600">Manage client portals, invitations, and access controls</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <PortalManager
              portals={mockPortals}
              currentPortalId={currentPortalId}
              onSwitchPortal={handleSwitchPortal}
              onSharePortal={handleSharePortal}
              onInviteUser={handleInviteUser}
              onManageSettings={handleManageSettings}
            />
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portal
            </Button>
            <button
              type="button"
              onClick={() => setShowHeaderMetrics(v => !v)}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800"
              aria-expanded={showHeaderMetrics}
            >
              {showHeaderMetrics ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.47 8.47a.75.75 0 011.06 0l7 7a.75.75 0 11-1.06 1.06L12 9.56l-6.47 6.97a.75.75 0 11-1.06-1.06l7-7z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.53 15.53a.75.75 0 01-1.06 0l-7-7a.75.75 0 111.06-1.06L12 13.44l6.47-6.97a.75.75 0 111.06 1.06l-7 7z" clipRule="evenodd" /></svg>
              )}
              <span>{showHeaderMetrics ? 'Hide header overview' : 'Show header overview'}</span>
            </button>
          </div>
        </div>

        {/* Header Metrics (conditionally rendered) */}
        {showHeaderMetrics && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Portals</p>
                    <p className="text-xl font-bold">{stats.totalPortals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-xl font-bold">{stats.activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Jobs</p>
                    <p className="text-xl font-bold">{stats.totalJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Candidates</p>
                    <p className="text-xl font-bold">{stats.totalCandidates.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Invites</p>
                    <p className="text-xl font-bold">{stats.monthlyInvitations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Weekly Activity</p>
                    <p className="text-xl font-bold">{stats.weeklyActivity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Row */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search portals by client, status, or user..."
              className="w-full pl-10 pr-8 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline">Advanced Filters</Button>
            <Button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portal
            </Button>
          </div>
        </div>

        {/* Portal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPortals.map((portal) => (
            <Card key={portal.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200">
                      {portal.clientIcon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{portal.clientName}</h3>
                      <p className="text-sm text-gray-500">Portal ID: {portal.id}</p>
                    </div>
                  </div>
                  <Badge className={
                    portal.status === 'active' ? 'bg-green-100 text-green-800' :
                    portal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {portal.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Active Jobs</p>
                      <p className="font-medium">{portal.activeJobs}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Candidates</p>
                      <p className="font-medium">{portal.totalCandidates}</p>
                    </div>
                  </div>

                  {/* Access Level */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Access Level</span>
                    <Badge variant="outline" className={
                      portal.accessLevel === 'ADMIN' ? 'border-red-200 text-red-800' :
                      portal.accessLevel === 'COLLABORATOR' ? 'border-blue-200 text-blue-800' :
                      'border-gray-200 text-gray-800'
                    }>
                      {portal.accessLevel}
                    </Badge>
                  </div>

                  {/* Invited Users */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Invited Users</span>
                    <span className="text-sm font-medium">{portal.invitedUsers.length}</span>
                  </div>

                  {/* Last Activity */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Activity</span>
                    <span className="text-sm font-medium">
                      {new Date(portal.lastActivity).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSwitchPortal(portal.id)}
                        className="flex-1"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        View Portal
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleManageSettings(portal.id)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Portal Activity</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { 
                  portal: 'Alpine Banking Solutions', 
                  action: 'New candidate rated by client', 
                  time: '2 hours ago',
                  type: 'rating'
                },
                { 
                  portal: 'Global Food Solutions', 
                  action: 'User invited: manager@foodglobal.com', 
                  time: '4 hours ago',
                  type: 'invitation'
                },
                { 
                  portal: 'BioPharma Innovations', 
                  action: 'Comment added on candidate pipeline', 
                  time: '6 hours ago',
                  type: 'comment'
                },
                { 
                  portal: 'HealthTech Research Group', 
                  action: 'Portal access granted', 
                  time: '1 day ago',
                  type: 'access'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'rating' ? 'bg-yellow-400' :
                      activity.type === 'invitation' ? 'bg-blue-400' :
                      activity.type === 'comment' ? 'bg-green-400' :
                      'bg-purple-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{activity.portal}</p>
                      <p className="text-xs text-gray-600">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create Portal Modal */}
        <CreatePortalModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePortalCreated}
        />
      </div>
    </Layout>
  );
} 