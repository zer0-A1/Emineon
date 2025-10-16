'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Workflow, 
  Play, 
  Pause,
  Settings, 
  Plus, 
  ArrowRight,
  Mail,
  Calendar,
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  description: string;
  config: Record<string, any>;
}

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  steps: WorkflowStep[];
  executionCount: number;
  lastRun: string;
  successRate: number;
}

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowData[]>([
    {
      id: '1',
      name: 'New Application Notification',
      description: 'Send email and SMS notifications when a new application is received',
      status: 'active',
      trigger: 'New Application Received',
      steps: [
        { id: '1', type: 'trigger', name: 'Application Received', description: 'Triggers when new application submitted', config: {} },
        { id: '2', type: 'action', name: 'Send Email', description: 'Email notification to hiring manager', config: { template: 'new_application' } },
        { id: '3', type: 'action', name: 'Send SMS', description: 'SMS alert to recruiter', config: { message: 'New application received' } }
      ],
      executionCount: 245,
      lastRun: '2024-01-19T10:30:00Z',
      successRate: 98
    },
    {
      id: '2',
      name: 'Interview Reminder Sequence',
      description: 'Automated reminder sequence for scheduled interviews',
      status: 'active',
      trigger: 'Interview Scheduled',
      steps: [
        { id: '1', type: 'trigger', name: 'Interview Scheduled', description: 'Triggers when interview is scheduled', config: {} },
        { id: '2', type: 'action', name: 'Schedule Reminder', description: 'Calendar reminder 24h before', config: { hours_before: 24 } },
        { id: '3', type: 'action', name: 'Send Confirmation', description: 'Email confirmation to candidate', config: { template: 'interview_confirmation' } },
        { id: '4', type: 'action', name: 'SMS Reminder', description: 'SMS reminder 2h before', config: { hours_before: 2 } }
      ],
      executionCount: 127,
      lastRun: '2024-01-18T14:20:00Z',
      successRate: 95
    },
    {
      id: '3',
      name: 'Candidate Follow-up',
      description: 'Follow up with candidates who haven\'t responded',
      status: 'paused',
      trigger: 'No Response After 3 Days',
      steps: [
        { id: '1', type: 'trigger', name: 'No Response Timer', description: 'Triggers after 3 days of no response', config: { days: 3 } },
        { id: '2', type: 'condition', name: 'Check Status', description: 'Only if application still pending', config: { status: 'pending' } },
        { id: '3', type: 'action', name: 'Send Follow-up', description: 'Gentle follow-up email', config: { template: 'follow_up' } }
      ],
      executionCount: 89,
      lastRun: '2024-01-17T09:15:00Z',
      successRate: 87
    }
  ]);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: '',
    steps: []
  });

  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'draft':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700 border border-success-200';
      case 'paused':
        return 'bg-warning-100 text-warning-700 border border-warning-200';
      case 'draft':
        return 'bg-neutral-100 text-neutral-700 border border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border border-neutral-200';
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'action':
        return <Target className="h-5 w-5 text-green-600" />;
      case 'condition':
        return <CheckCircle className="h-5 w-5 text-purple-600" />;
      default:
        return <Settings className="h-5 w-5 text-neutral-600" />;
    }
  };

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
        : w
    ));
  };

  const createWorkflow = async () => {
    console.log('Creating workflow:', newWorkflow);
    // Reset form
    setNewWorkflow({
      name: '',
      description: '',
      trigger: '',
      steps: []
    });
    setActiveTab('overview');
  };

  const predefinedTriggers = [
    'New Application Received',
    'Interview Scheduled', 
    'Application Status Changed',
    'Assessment Completed',
    'No Response After X Days',
    'Job Posted',
    'Candidate Profile Updated'
  ];

  const predefinedActions = [
    { type: 'email', name: 'Send Email', icon: Mail, description: 'Send automated email' },
    { type: 'sms', name: 'Send SMS', icon: MessageSquare, description: 'Send SMS notification' },
    { type: 'calendar', name: 'Schedule Event', icon: Calendar, description: 'Create calendar event' },
    { type: 'task', name: 'Create Task', icon: CheckCircle, description: 'Create follow-up task' },
    { type: 'status', name: 'Update Status', icon: Settings, description: 'Change application status' }
  ];

  const tabs = [
    { id: 'overview', label: 'All Workflows', icon: Workflow },
    { id: 'create', label: 'Create Workflow', icon: Plus },
    { id: 'templates', label: 'Templates', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Minimal header */}
        <div className="flex items-center justify-between">
          <div>
            <AnimatedPageTitle title="Workflows" Icon={Workflow} />
            <p className="mt-1 text-sm text-neutral-600">Create and manage automated recruitment workflows</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-6"><div className="flex items-center"><div className="p-2 bg-blue-100 rounded-lg"><Workflow className="h-6 w-6 text-blue-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Workflows</p><p className="text-2xl font-bold text-gray-900">{workflows.length}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center"><div className="p-2 bg-green-100 rounded-lg"><Play className="h-6 w-6 text-green-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Active</p><p className="text-2xl font-bold text-gray-900">{workflows.filter(w => w.status === 'active').length}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center"><div className="p-2 bg-purple-100 rounded-lg"><Zap className="h-6 w-6 text-purple-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Executions</p><p className="text-2xl font-bold text-gray-900">{workflows.reduce((sum, w) => sum + w.executionCount, 0)}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center"><div className="p-2 bg-yellow-100 rounded-lg"><BarChart3 className="h-6 w-6 text-yellow-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Success Rate</p><p className="text-2xl font-bold text-gray-900">{Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)}%</p></div></div></CardContent></Card>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-soft">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'primary' : 'outline'}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards (hide when header overview is visible) */}
            {!showHeaderMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Workflow className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                      <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Play className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {workflows.filter(w => w.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Executions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}

            {/* Workflows List */}
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} variant="elevated">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Workflow className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                            <p className="text-sm text-gray-600">{workflow.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Trigger: {workflow.trigger}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{workflow.executionCount}</p>
                          <p className="text-xs text-gray-500">Executions</p>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{workflow.successRate}%</p>
                          <p className="text-xs text-gray-500">Success Rate</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(workflow.lastRun).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">Last Run</p>
                        </div>

                        <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(workflow.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(workflow.status)}
                            <span className="capitalize">{workflow.status}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => toggleWorkflowStatus(workflow.id)}
                          >
                            {workflow.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Workflow Steps Preview */}
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <div className="flex items-center space-x-2 overflow-x-auto">
                        {workflow.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center space-x-2 flex-shrink-0">
                            <div className="flex items-center space-x-2 px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                              {getStepIcon(step.type)}
                              <span className="font-medium">{step.name}</span>
                            </div>
                            {index < workflow.steps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-neutral-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <Card>
            <CardHeader title="Create New Workflow">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Workflow Name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Candidate Onboarding"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Event</label>
                    <select
                      value={newWorkflow.trigger}
                      onChange={(e) => setNewWorkflow(prev => ({ ...prev, trigger: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a trigger...</option>
                      {predefinedTriggers.map((trigger) => (
                        <option key={trigger} value={trigger}>{trigger}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {predefinedActions.map((action) => (
                      <div key={action.type} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <action.icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{action.name}</h4>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <Button onClick={createWorkflow} className="flex-1">
                    Create Workflow
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('overview')} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-900">Workflow Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'New Hire Onboarding',
                  description: 'Complete onboarding sequence for new hires',
                  steps: 8,
                  category: 'Onboarding'
                },
                {
                  name: 'Interview Scheduling',
                  description: 'Automated interview scheduling and reminders',
                  steps: 5,
                  category: 'Interviews'
                },
                {
                  name: 'Application Review',
                  description: 'Automated application screening and scoring',
                  steps: 6,
                  category: 'Screening'
                },
                {
                  name: 'Rejection Notification',
                  description: 'Professional rejection emails with feedback',
                  steps: 3,
                  category: 'Communication'
                },
                {
                  name: 'Reference Check',
                  description: 'Automated reference check requests',
                  steps: 4,
                  category: 'Verification'
                },
                {
                  name: 'Offer Management',
                  description: 'Job offer creation and tracking',
                  steps: 7,
                  category: 'Offers'
                }
              ].map((template, index) => (
                <Card key={index} variant="elevated">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{template.name}</h3>
                        <p className="text-sm text-neutral-600 mt-1">{template.description}</p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full border border-primary-200">
                        {template.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full border border-neutral-200">
                        {template.steps} steps
                      </span>
                      <Button variant="outline">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Workflow Analytics">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-primary-800 p-6 rounded-lg text-white">
                    <h3 className="text-lg font-medium">Total Executions</h3>
                    <p className="text-3xl font-bold mt-2">
                      {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
                    </p>
                    <p className="text-blue-100 text-sm">This month</p>
                  </div>
                  
                  <div className="bg-primary-800 p-6 rounded-lg text-white">
                    <h3 className="text-lg font-medium">Success Rate</h3>
                    <p className="text-3xl font-bold mt-2">
                      {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)}%
                    </p>
                    <p className="text-green-100 text-sm">Average across all workflows</p>
                  </div>
                  
                  <div className="bg-primary-800 p-6 rounded-lg text-white">
                    <h3 className="text-lg font-medium">Time Saved</h3>
                    <p className="text-3xl font-bold mt-2">124hrs</p>
                    <p className="text-purple-100 text-sm">Estimated this month</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-medium text-neutral-900 mb-4">Workflow Performance</h4>
                  <div className="space-y-4">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="bg-neutral-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-neutral-900">{workflow.name}</h5>
                            <p className="text-sm text-neutral-600">{workflow.executionCount} executions</p>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-lg font-bold text-neutral-900">{workflow.successRate}%</p>
                              <p className="text-xs text-neutral-500">Success Rate</p>
                            </div>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workflow.status)}`}>
                              {workflow.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Workflow Detail Modal */}
        {selectedWorkflow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900">{selectedWorkflow.name}</h2>
                  <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>
                    Close
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <p className="text-neutral-600">{selectedWorkflow.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Executions</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedWorkflow.executionCount}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">{selectedWorkflow.successRate}%</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-neutral-900">Last Run</p>
                      <p className="text-lg font-bold text-neutral-600">
                        {new Date(selectedWorkflow.lastRun).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">Workflow Steps</h3>
                    <div className="space-y-4">
                      {selectedWorkflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center space-x-4 p-4 border border-neutral-200 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-medium text-blue-600">
                            {index + 1}
                          </div>
                          {getStepIcon(step.type)}
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900">{step.name}</h4>
                            <p className="text-sm text-neutral-600">{step.description}</p>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            step.type === 'trigger' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            step.type === 'action' ? 'bg-success-100 text-success-700 border border-success-200' :
                            'bg-accent-100 text-accent-700 border border-accent-200'
                          }`}>
                            {step.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 