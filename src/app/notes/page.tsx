'use client';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Clock, Plus, FileText, Users, BarChart3, Zap, Search, Filter, User, Tag, Eye, Edit, Trash2 } from 'lucide-react';

import { useState } from 'react';

export default function NotesPage() {
  const noteCategories = [
    { name: 'Interview', count: 18, color: 'primary' },
    { name: 'Follow-up', count: 12, color: 'success' },
    { name: 'Reference', count: 8, color: 'warning' },
    { name: 'Feedback', count: 9, color: 'accent' }
  ];

  const recentNotes = [
    {
      id: 1,
      title: 'Interview Notes - John Smith',
      content: 'Candidate showed strong technical skills in React and Node.js. Excellent problem-solving approach during coding interview.',
      category: 'Interview',
      candidate: 'John Smith',
      position: 'Senior Frontend Developer',
      timestamp: '2 hours ago',
      author: 'David Chen',
      priority: 'high',
      tags: ['technical', 'react', 'node.js']
    },
    {
      id: 2,
      title: 'Follow-up Scheduled - Sarah Johnson',
      content: 'Scheduled second interview for frontend developer position. Client expressed strong interest.',
      category: 'Follow-up',
      candidate: 'Sarah Johnson',
      position: 'Frontend Developer',
      timestamp: '1 day ago',
      author: 'Emily Rodriguez',
      priority: 'medium',
      tags: ['interview', 'client-interest', 'frontend']
    },
    {
      id: 3,
      title: 'Reference Check - Mike Chen',
      content: 'Positive feedback from previous manager at Tech Corp. Highlighted leadership and technical expertise.',
      category: 'Reference',
      candidate: 'Mike Chen',
      position: 'Tech Lead',
      timestamp: '3 days ago',
      author: 'Sarah Wilson',
      priority: 'low',
      tags: ['reference', 'leadership', 'positive']
    },
    {
      id: 4,
      title: 'Client Feedback - Alex Martinez',
      content: 'Client provided detailed feedback on candidate presentation. Impressed with communication skills and industry knowledge.',
      category: 'Feedback',
      candidate: 'Alex Martinez',
      position: 'Business Analyst',
      timestamp: '5 days ago',
      author: 'Michael Chang',
      priority: 'medium',
      tags: ['client-feedback', 'communication', 'presentation']
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'low': return 'border-green-400 bg-green-50';
      default: return 'border-neutral-400 bg-neutral-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Interview': return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'Follow-up': return 'bg-success-100 text-success-700 border-success-200';
      case 'Reference': return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'Feedback': return 'bg-accent-100 text-accent-700 border-accent-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Notes</h1>
            <p className="text-neutral-600 mt-1">Track candidate interactions and recruitment notes</p>
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

        {/* Header Metrics (collapsed by default) */}
        {showHeaderMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Total Notes</p><p className="text-2xl font-bold text-neutral-900">47</p></div><FileText className="h-8 w-8 text-blue-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">This Week</p><p className="text-2xl font-bold text-neutral-900">12</p></div><Clock className="h-8 w-8 text-yellow-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Follow-ups</p><p className="text-2xl font-bold text-neutral-900">8</p></div><Users className="h-8 w-8 text-emerald-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Active Threads</p><p className="text-2xl font-bold text-neutral-900">23</p></div><MessageSquare className="h-8 w-8 text-purple-600" /></div></CardContent></Card>
          </div>
        )}

        {/* Note Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {noteCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-medium transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${category.color}-50`}>
                  <Tag className={`h-6 w-6 text-${category.color}-600`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-neutral-900">{category.count}</p>
                  <p className="text-sm text-neutral-600">{category.name}</p>
                </div>
              </div>
              <Button variant="outline" fullWidth>
                View {category.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Search Row - Clients-like */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes by candidate, content, or tags..."
              className="w-full pl-10 pr-8 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Recent Notes</h2>
              <p className="text-neutral-600 mt-1">Latest interactions and updates</p>
            </div>
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        
          <div className="space-y-4">
            {recentNotes.map((note) => (
              <div key={note.id} className={`border-l-4 ${getPriorityColor(note.priority)} rounded-r-xl p-6 transition-all duration-300 hover:shadow-medium`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-2">{note.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(note.category)}`}>
                        {note.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                        <User className="h-3 w-3 mr-1" />
                        {note.candidate}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                        {note.position}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                        <Clock className="h-3 w-3 mr-1" />
                        {note.timestamp}
                      </span>
                    </div>
                    <p className="text-neutral-600 text-sm mb-3">{note.content}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {note.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-xs text-neutral-500">
                      <span>By {note.author}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Card variant="elevated" className="border-2 border-dashed border-neutral-300">
          <CardContent>
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">Advanced note-taking features</p>
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                  AI-powered insights
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                  Voice-to-text
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                  Smart categorization
                </span>
              </div>
              <Button variant="outline">Coming Soon</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 