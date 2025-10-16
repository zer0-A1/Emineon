'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp,
  Clock,
  Target,
  Activity,
  MessageSquare,
  Send,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalCandidates: number;
  activeCandidates: number;
  totalJobs: number;
  activeJobs: number;
  applicationsSent: number;
  interviewsScheduled: number;
  hires: number;
  conversionRate: string;
  averageTimeToHire: string;
  topSkills: string[];
  recentActivity: Array<{
    type: string;
    count: number;
    label: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'bot'; content: string }>>([
    { type: 'bot', content: 'Hello! How can I help you with your recruitment today?' }
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { type: 'user', content: inputValue },
      { type: 'bot', content: 'Thanks for your message! I\'m here to help with recruitment tasks.' }
    ]);
    setInputValue('');
  };

  const performanceStats = [
    {
      label: 'Total Candidates',
      value: stats?.totalCandidates || 0,
      change: '+12 this week',
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Active Jobs',
      value: stats?.activeJobs || 0,
      change: '+3 new',
      icon: Briefcase,
      color: 'green'
    },
    {
      label: 'Applications Sent',
      value: stats?.applicationsSent || 0,
      change: '+8 today',
      icon: FileText,
      color: 'purple'
    },
    {
      label: 'Interviews Scheduled',
      value: stats?.interviewsScheduled || 0,
      change: '+5 this week',
      icon: Calendar,
      color: 'orange'
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening with your recruitment pipeline.
            </p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Quick Action</span>
          </Button>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceStats.map((stat, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center bg-${stat.color}-50`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity & AI Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </div>
              {stats?.recentActivity ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-900">{activity.label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">+{activity.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Loading activity...</p>
              )}
            </CardContent>
          </Card>

          {/* AI Chat Assistant */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">AI Assistant</h3>
              </div>
              
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-4 space-y-2">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ask me anything about your recruitment process..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} className="px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span>Add Candidate</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Briefcase className="h-6 w-6" />
                <span>Create Job</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <FileText className="h-6 w-6" />
                <span>Generate Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 