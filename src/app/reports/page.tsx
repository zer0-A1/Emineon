'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Briefcase,
  TrendingUp,
  Star,
  Clock,
  Target,
  Brain,
  Sparkles,
  Presentation,
  Mail,
  Share,
  Filter,
  Plus,
  Eye,
  Edit,
  ArrowUpRight,
  Globe,
  Shield,
  Zap,
  Activity,
  CheckCircle
} from 'lucide-react';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';

interface Report {
  id: string;
  title: string;
  type: 'client' | 'candidate' | 'performance' | 'market';
  status: 'draft' | 'ready' | 'shared';
  createdDate: string;
  lastModified: string;
  recipients?: string[];
  metrics: {
    pages: number;
    insights: number;
    recommendations: number;
  };
}

export default function ReportsPage() {
  const [reports] = useState([]);
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);

  const reportMetrics = [
    { label: 'Reports Generated', value: '1.8k', icon: FileText, color: 'teal' },
    { label: 'Client Presentations', value: '127', icon: Presentation, color: 'primary' },
    { label: 'Time Saved', value: '240hrs', icon: Clock, color: 'accent' },
    { label: 'Avg Rating', value: '4.9', icon: Star, color: 'secondary' }
  ];

  const reportTemplates = [
    {
      title: 'Executive Summary',
      description: 'High-level overview for C-suite stakeholders',
      icon: Briefcase,
      color: 'primary',
      usage: '45%',
      features: ['Key metrics', 'Strategic insights', 'Market analysis', 'ROI summary']
    },
    {
      title: 'Candidate Presentation',
      description: 'Detailed profiles for client consideration',
      icon: Users,
      color: 'teal',
      usage: '38%',
      features: ['Skills assessment', 'Cultural fit', 'Interview insights', 'References']
    },
    {
      title: 'Market Intelligence',
      description: 'Industry trends and competitive landscape',
      icon: TrendingUp,
      color: 'accent',
      usage: '25%',
      features: ['Salary benchmarks', 'Skill trends', 'Hiring patterns', 'Forecasting']
    },
    {
      title: 'Performance Analytics',
      description: 'Recruitment efficiency and KPI tracking',
      icon: BarChart3,
      color: 'secondary',
      usage: '32%',
      features: ['Time-to-fill', 'Quality metrics', 'Cost analysis', 'Success rates']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-success-100 text-success-700 border border-success-200';
      case 'draft':
        return 'bg-warning-100 text-warning-700 border border-warning-200';
      case 'shared':
        return 'bg-primary-100 text-primary-700 border border-primary-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border border-neutral-200';
    }
  };

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8">
        {/* Minimal header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <AnimatedPageTitle title="Reports" Icon={Presentation} />
            <p className="mt-1 text-sm text-neutral-600">Create data-driven reports and client presentations</p>
          </div>
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

        {showHeaderMetrics && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {reportMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${metric.color}-50`}>
                    <metric.icon className={`h-6 w-6 text-${metric.color}-600`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">{metric.value}</p>
                    <p className="text-sm text-neutral-600">{metric.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Removed default-visible metrics to keep header overview collapsed by default */}

        {/* Report Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-neutral-600">Professional templates optimized for different stakeholders</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {reportTemplates.map((template, index) => (
              <div key={index} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-medium transition-all duration-300 group">
                {/* Template Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-xl bg-[#0A2F5A]/10">
                        <template.icon className="h-6 w-6 text-[#0A2F5A]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900">{template.title}</h3>
                        <p className="text-neutral-700 text-sm">{template.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-neutral-700 text-sm">Usage</div>
                      <div className="text-neutral-900 font-bold">{template.usage}</div>
                    </div>
                  </div>
                </div>

                {/* Template Content */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {template.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success-500" />
                        <span className="text-sm text-neutral-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" fullWidth>
                      Use Template
                    </Button>
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft mb-8">
          <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Recent Reports</h3>
                <p className="text-sm text-neutral-600">Your latest generated reports and presentations</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {[
                { title: 'Q4 Talent Market Analysis', type: 'Market Intelligence', created: '2 hours ago', status: 'ready', downloads: 12 },
                { title: 'Senior Developer Shortlist', type: 'Candidate Presentation', created: '5 hours ago', status: 'ready', downloads: 8 },
                { title: 'TechCorp Recruitment Summary', type: 'Executive Summary', created: '1 day ago', status: 'ready', downloads: 15 },
                { title: 'Monthly Performance Review', type: 'Performance Analytics', created: '2 days ago', status: 'generating', downloads: 0 }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-neutral-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <FileText className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900 mb-2">{report.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full border border-primary-200">
                          {report.type}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {report.created}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                          <Download className="h-3 w-3 mr-1" />
                          {report.downloads} downloads
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      report.status === 'ready' ? 'bg-success-100 text-success-700 border border-success-200' : 'bg-warning-100 text-warning-700 border border-warning-200'
                    }`}>
                      {report.status === 'ready' ? 'Ready' : 'Generating...'}
                    </div>
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Share className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Capabilities */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-soft">
          <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900">AI-Powered Features</h3>
            <p className="text-sm text-neutral-600">Advanced capabilities that enhance your reporting workflow</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Smart Insights', description: 'AI identifies key trends and patterns in your data', icon: Brain },
                { title: 'Auto-Formatting', description: 'Professional layouts generated automatically', icon: Sparkles },
                { title: 'Data Visualization', description: 'Interactive charts and graphs created instantly', icon: BarChart3 },
                { title: 'Narrative Generation', description: 'AI writes compelling report narratives', icon: FileText }
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-3">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h4 className="font-semibold text-neutral-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 