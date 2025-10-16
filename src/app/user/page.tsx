'use client';

import { UserProfile, SignOutButton, useUser } from '@clerk/nextjs';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  LogOut, 
  User, 
  Settings, 
  Shield, 
  Mail, 
  Calendar,
  Activity,
  Bell,
  Lock,
  Smartphone,
  Briefcase,
  Users,
  FileText,
  FolderOpen,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  Target,
  Award
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';

interface UserStats {
  overview: {
    jobsCreated: number;
    candidatesCreated: number;
    competenceFilesGenerated: number;
    projectsCreated: number;
    totalDownloads: number;
  };
  thisMonth: {
    jobsCreated: number;
    candidatesCreated: number;
    competenceFilesGenerated: number;
  };
  recentActivity: Array<{
    id: string;
    fileName: string;
    candidateName: string;
    createdAt: string;
    status: string;
  }>;
}

export default function UserPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          // Extract data from the nested structure
          setStats(result.data || result);
        } else {
          console.error('Failed to fetch user stats');
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, getToken]);

  // Helper function to get badge styles based on status
  const getBadgeStyles = (status: string | undefined | null) => {
    // Handle undefined, null, or empty status
    if (!status) {
      return 'bg-gray-100 text-gray-800 border-gray-300 font-semibold';
    }
    
    switch (status.toUpperCase()) {
      case 'GENERATED':
        return 'bg-green-100 text-green-800 border-green-300 font-semibold';
      case 'USER':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
      case 'DISABLED':
        return 'bg-red-100 text-red-800 border-red-300 font-semibold';
      case 'ENABLED':
        return 'bg-green-100 text-green-800 border-green-300 font-semibold';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-300 font-semibold';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-semibold';
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-300 font-semibold';
      case 'UNVERIFIED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 font-semibold';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 font-semibold';
    }
  };

  const userRole = user?.publicMetadata?.role as string || 'user';
  const accountCreated = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
  const lastSignIn = user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never';

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Minimal header */}
        <div className="mb-2">
          <AnimatedPageTitle title="Account" Icon={User} />
          <p className="mt-1 text-sm text-neutral-600">Manage your profile, security, and activity</p>
        </div>

        {/* Statistics Overview */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : stats ? (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Your Activity Overview</h2>
            </div>
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Jobs Available</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.overview?.jobsCreated || 0}</p>
                    </div>
                    <Briefcase className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Candidates</p>
                      <p className="text-2xl font-bold text-green-900">{stats.overview?.candidatesCreated || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Competence Files</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.overview?.competenceFilesGenerated || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Projects</p>
                      <p className="text-2xl font-bold text-orange-900">{stats.overview?.projectsCreated || 0}</p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-700">Downloads</p>
                      <p className="text-2xl font-bold text-indigo-900">{stats.overview?.totalDownloads || 0}</p>
                    </div>
                    <Download className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* This Month Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-gray-900">This Month</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Jobs:</span>
                    <span className="text-sm font-medium text-blue-600">{stats.thisMonth?.jobsCreated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Candidates:</span>
                    <span className="text-sm font-medium text-green-600">{stats.thisMonth?.candidatesCreated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Files Generated:</span>
                    <span className="text-sm font-medium text-purple-600">{stats.thisMonth?.competenceFilesGenerated || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="md:col-span-2 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Recent Activity</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.recentActivity && stats.recentActivity.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentActivity.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{activity.candidateName}</p>
                              <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge className={`text-xs ${getBadgeStyles(activity.status)}`}>
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Unable to load statistics at this time.</p>
          </div>
        )}

        {/* Account Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Account Info</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900 truncate ml-2">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Role:</span>
                <Badge className={`ml-2 text-xs ${getBadgeStyles(userRole)}`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Member since:</span>
                <span className="text-sm font-medium text-gray-900">{accountCreated}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Activity</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last sign in:</span>
                <span className="text-sm font-medium text-gray-900">{lastSignIn}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className={`text-xs ${getBadgeStyles('ACTIVE')}`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sessions:</span>
                <span className="text-sm font-medium text-gray-900">1 active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Security</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">2FA:</span>
                <Badge className={`ml-2 text-xs ${getBadgeStyles(user?.twoFactorEnabled ? 'ENABLED' : 'DISABLED')}`}>
                  {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email verified:</span>
                <Badge className={`text-xs ${getBadgeStyles(user?.primaryEmailAddress?.verification?.status === 'verified' ? 'VERIFIED' : 'UNVERIFIED')}`}>
                  {user?.primaryEmailAddress?.verification?.status === 'verified' ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-gray-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span>Quick Actions</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-start h-auto py-4 px-4 bg-white hover:bg-blue-50 border-gray-300 hover:border-blue-300 text-gray-700 hover:text-blue-700 transition-all duration-200"
                onClick={() => {
                  const profileElement = document.querySelector('[data-clerk-element="profile"]');
                  if (profileElement) {
                    profileElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <User className="h-4 w-4" />
                <span className="font-medium">Edit Profile</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-start h-auto py-4 px-4 bg-white hover:bg-purple-50 border-gray-300 hover:border-purple-300 text-gray-700 hover:text-purple-700 transition-all duration-200"
                onClick={() => {
                  const securityElement = document.querySelector('[data-clerk-element="security"]');
                  if (securityElement) {
                    securityElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Lock className="h-4 w-4" />
                <span className="font-medium">Security Settings</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-start h-auto py-4 px-4 bg-white hover:bg-green-50 border-gray-300 hover:border-green-300 text-gray-700 hover:text-green-700 transition-all duration-200"
                onClick={() => {
                  const notificationsElement = document.querySelector('[data-clerk-element="notifications"]');
                  if (notificationsElement) {
                    notificationsElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Bell className="h-4 w-4" />
                <span className="font-medium">Notifications</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-start h-auto py-4 px-4 bg-white hover:bg-red-50 border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-700 transition-all duration-200"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Sign Out</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-gray-200">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <LogOut className="h-5 w-5 text-red-600" />
                  <span>Confirm Sign Out</span>
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to sign out of your account?
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <SignOutButton>
                    <Button variant="danger" className="flex-1">
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Profile Component */}
        <div className="flex justify-center" data-clerk-element="profile">
          <UserProfile
            appearance={{
              elements: {
                card: 'shadow-lg border border-gray-200 rounded-lg',
                headerTitle: 'text-gray-900 font-semibold',
                headerSubtitle: 'text-gray-600',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                formButtonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                navbarButton: 'text-gray-700 hover:text-blue-700',
                navbarButtonIcon: 'text-gray-500',
              }
            }}
          />
        </div>
      </div>
    </Layout>
  );
} 