'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';
import { 
  Brain, 
  Search, 
  FileText, 
  Mail, 
  Users, 
  Target,
  Sparkles,
  Send,
  Download,
  Calendar,
  TrendingUp,
  Zap,
  MessageSquare,
  ArrowUpRight,
  Star,
  Clock,
  CheckCircle,
  Globe,
  Shield,
  BarChart3,
  Activity
} from 'lucide-react';

interface Candidate {
  name: string;
  title: string;
  company: string;
  location: string;
  match: number;
  highlights: string[];
  experience: string;
  skills: string[];
}

export default function AIToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidateMatches, setCandidateMatches] = useState<Candidate[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);

  const handleNaturalSearch = async () => {
    setIsGenerating(true);
    // Simulate AI search - would integrate with actual AI service
    setTimeout(() => {
      setCandidateMatches([
        {
          name: 'Sarah Chen',
          title: 'Senior Search Engineer',
          company: 'Elastic',
          location: 'San Francisco, CA',
          match: 96,
          highlights: ['Built core search infra handling 1B+ daily queries', 'Led team of 12 search engineers', 'Reduced query latency by 40%'],
          experience: '8 years',
          skills: ['Elasticsearch', 'Machine Learning', 'Distributed Systems']
        },
        {
          name: 'Michael Rodriguez',
          title: 'Search Infrastructure Lead',
          company: 'Amazon',
          location: 'Seattle, WA',
          match: 89,
          highlights: ['Architected vector search platform serving 500M users', 'Scaled B2B search infrastructure 10x', 'Reduced infrastructure costs by 35%'],
          experience: '10 years',
          skills: ['AWS', 'Vector Search', 'Infrastructure']
        },
        {
          name: 'Emily Watson',
          title: 'Search Platform Architect',
          company: 'Google',
          location: 'New York, NY',
          match: 75,
          highlights: ['Developed semantic search algorithms', 'Improved search relevance by 25%', 'Strong in query optimization'],
          experience: '6 years',
          skills: ['Search Algorithms', 'Machine Learning', 'Python']
        }
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const generateContent = (candidate: Candidate) => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedContent(`Subject: Exceptional ${candidate.title} - Available for Immediate Placement

Dear Hiring Manager,

I hope this email finds you well. I wanted to bring to your attention an exceptional ${candidate.title} who has recently become available and would be a perfect fit for your team.

**Candidate Highlights:**
• ${candidate.highlights.join('\n• ')}
• ${candidate.experience} of proven experience in the field
• Currently based in ${candidate.location}

**Why ${candidate.name} is Perfect for Your Team:**
${candidate.name} brings a unique combination of technical expertise and leadership experience that's rare in today's market. Their track record of ${candidate.highlights[0].toLowerCase()} demonstrates exactly the kind of impact they could bring to your organization.

**Key Technical Skills:**
${candidate.skills.map((skill: string) => `• ${skill}`).join('\n')}

I believe ${candidate.name} would be an exceptional addition to your team and would love to arrange a brief conversation to discuss how their background aligns with your current needs.

Would you be available for a 15-minute call this week to explore this opportunity further?

Best regards,
[Your Name]
Emineon Recruitment`);
      setIsGenerating(false);
    }, 1500);
  };

  const performAISearch = async () => {
    setIsSearching(true);
    // Simulate AI search - would integrate with actual AI service
    setTimeout(() => {
      setSearchResults([
        {
          name: 'Sarah Chen',
          title: 'Senior Search Engineer',
          company: 'Elastic',
          location: 'San Francisco, CA',
          match: 96,
          highlights: ['Built core search infra handling 1B+ daily queries', 'Led team of 12 search engineers', 'Reduced query latency by 40%'],
          experience: '8 years',
          skills: ['Elasticsearch', 'Machine Learning', 'Distributed Systems']
        },
        {
          name: 'Michael Rodriguez',
          title: 'Search Infrastructure Lead',
          company: 'Amazon',
          location: 'Seattle, WA',
          match: 89,
          highlights: ['Architected vector search platform serving 500M users', 'Scaled B2B search infrastructure 10x', 'Reduced infrastructure costs by 35%'],
          experience: '10 years',
          skills: ['AWS', 'Vector Search', 'Infrastructure']
        },
        {
          name: 'Emily Watson',
          title: 'Search Platform Architect',
          company: 'Google',
          location: 'New York, NY',
          match: 75,
          highlights: ['Developed semantic search algorithms', 'Improved search relevance by 25%', 'Strong in query optimization'],
          experience: '6 years',
          skills: ['Search Algorithms', 'Machine Learning', 'Python']
        }
      ]);
      setIsSearching(false);
    }, 2000);
  };

  const aiTools = [
    {
      id: 'content-generator',
      title: 'Content Generator',
      description: 'Generate compelling candidate introductions and business development materials',
      icon: FileText,
      color: 'primary',
      metrics: { generated: '15k+', satisfaction: '94%', timeReduction: '60%' },
      features: ['Personalized templates', 'Brand alignment', 'Multi-format export', 'Client customization']
    },
    {
      id: 'competence-files',
      title: 'Competence Files',
      description: 'Create polished, client-facing candidate profiles with AI assistance',
      icon: Users,
      color: 'secondary',
      metrics: { files: '2.5k+', quality: '97%', timeReduction: '80%' },
      features: ['AI-powered drafting', 'Template customization', 'Client branding', 'Export options']
    },
    {
      id: 'outlook-plugin',
      title: 'Outlook Add-in',
      description: 'Seamlessly integrate Emineon with your email workflow for instant recruitment intelligence',
      icon: Mail,
      color: 'primary',
      metrics: { emails: '100k+', analysis: '98%', workflow: '+65%' },
      features: ['Email analysis', 'Contact extraction', 'AI templates', 'Quick actions']
    },
    {
      id: 'timing',
      title: 'Perfect Timing AI',
      description: 'Detect optimal engagement moments through business signals and behavior analysis',
      icon: Target,
      color: 'accent',
      metrics: { signals: '50k+', accuracy: '89%', engagement: '+23%' },
      features: ['Signal detection', 'Timing optimization', 'Engagement analytics', 'Behavior tracking']
    }
  ];

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8">
        {/* Minimal header like Clients */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <AnimatedPageTitle title="AI Tools" Icon={Brain} />
            <p className="mt-1 text-sm text-neutral-600">Explore Emineon’s AI capabilities and accelerate your workflow</p>
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

        {/* Key metrics */}
        {showHeaderMetrics && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { label: 'Candidate Matches', value: '50k+', icon: Users, color: 'teal' },
              { label: 'Search Accuracy', value: '96%', icon: Target, color: 'primary' },
              { label: 'Time Saved', value: '75%', icon: Clock, color: 'accent' },
              { label: 'Client Satisfaction', value: '94%', icon: Star, color: 'secondary' }
            ].map((metric, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200">
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

        {/* AI Tools Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-12">
          {aiTools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-medium transition-all duration-300 group">
              {/* Tool Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-xl bg-[#0A2F5A]/10">
                      <tool.icon className="h-6 w-6 text-[#0A2F5A]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">
                        {tool.title}
                      </h3>
                      <p className="text-neutral-700 text-sm">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-neutral-700 transition-colors" />
                </div>
              </div>

              {/* Tool Content */}
              <div className="p-6">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Object.entries(tool.metrics).map(([key, value], index) => (
                    <div key={index} className="text-center">
                      <p className="text-lg font-bold text-neutral-900">{value}</p>
                      <p className="text-xs text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {tool.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success-500" />
                      <span className="text-sm text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    if (tool.id === 'competence-files') {
                      window.location.href = '/competence-files';
                    } else if (tool.id === 'outlook-plugin') {
                      window.open('https://app-emineon.vercel.app/api/outlook-addin/download.html', '_blank');
                    } else {
                      setActiveTab(tool.id);
                    }
                  }}
                  variant="outline"
                  fullWidth
                >
                  {tool.id === 'outlook-plugin' ? 'Download Add-in' : 'Explore Tool'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Tool Interface */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-medium">
            <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {aiTools.find(t => t.id === activeTab)?.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Advanced AI-powered recruitment intelligence
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab('overview')}
                  variant="outline"
                >
                  Back to Overview
                </Button>
              </div>
            </div>

            <div className="p-6">
              {/* Tool-specific content would go here */}
              {activeTab === 'content-generator' && generatedContent && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-neutral-900">
                      Generated Content
                    </h2>
                    <div className="flex space-x-2">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        onClick={() => {
                          // Implement email sending logic
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-neutral-700 font-mono">
                      {isGenerating ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                          Generating personalized content...
                        </div>
                      ) : (
                        generatedContent
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 