'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, CheckCircle, Clock, UserCheck, Search, FileText, Target, BarChart3, Workflow, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';

export default function AssignmentsPage() {
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <AnimatedPageTitle title="Assignments" Icon={UserCheck} />
            <p className="text-neutral-600 mt-1">Track candidate assignments and pipeline progression</p>
          </div>
          <button
            type="button"
            onClick={() => setShowHeaderMetrics((v: boolean) => !v)}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800"
            aria-expanded={showHeaderMetrics}
          >
            {showHeaderMetrics ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
            <span>{showHeaderMetrics ? 'Hide header overview' : 'Show header overview'}</span>
          </button>
        </div>

        {/* Header Metrics (collapsed by default) */}
        {showHeaderMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Active Assignments</p><p className="text-2xl font-bold text-neutral-900">13</p></div><Users className="h-8 w-8 text-blue-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">In Progress</p><p className="text-2xl font-bold text-neutral-900">8</p></div><Clock className="h-8 w-8 text-yellow-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Completion Rate</p><p className="text-2xl font-bold text-neutral-900">92%</p></div><CheckCircle className="h-8 w-8 text-emerald-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Avg. Days to Complete</p><p className="text-2xl font-bold text-neutral-900">4.2</p></div><FileText className="h-8 w-8 text-purple-600" /></div></CardContent></Card>
          </div>
        )}

        {/* Search Row */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assignments by candidate, client, or status..."
              className="w-full pl-10 pr-8 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline">Advanced Filters</Button>
            <Button className="btn-primary">New Assignment</Button>
          </div>
        </div>
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">Applied</h3>
                    <p className="text-2xl font-bold text-blue-600">3</p>
                  </div>
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-yellow-900 mb-1">Long List</h3>
                    <p className="text-2xl font-bold text-yellow-600">4</p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-900 mb-1">Short List</h3>
                    <p className="text-2xl font-bold text-green-600">1</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-purple-900 mb-1">Communication</h3>
                    <p className="text-2xl font-bold text-purple-600">3</p>
                  </div>
                  <Search className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-red-900 mb-1">Screening</h3>
                    <p className="text-2xl font-bold text-red-600">2</p>
                  </div>
                  <UserCheck className="h-6 w-6 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card variant="elevated" className="border-2 border-dashed border-gray-300">
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Assignment Tracking</h3>
                <p className="text-gray-600 mb-4">Pipeline management with drag & drop, automated workflows, and detailed analytics</p>
                <Button variant="ghost">Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 