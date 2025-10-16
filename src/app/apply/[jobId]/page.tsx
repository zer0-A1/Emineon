'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { 
  MapPin, Calendar, DollarSign, Clock, User, Mail, Phone, 
  FileText, Star, Building, Users, Upload, CheckCircle
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  employmentType?: string[];
  benefits?: string[];
  requirements?: string[];
  responsibilities?: string[];
  isRemote: boolean;
  publishedAt: string;
}

export default function JobApplicationPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    referralCode: '',
    cvUrl: '',
  });

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/public/jobs?id=${jobId}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setJob(data.data[0]);
      } else {
        setError('Job not found or no longer available');
      }
    } catch (err) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          ...formData,
          source: 'direct_application',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.history.back()} className="btn-secondary">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in the {job?.title} position. 
              We'll review your application and get back to you soon.
            </p>
            <Button onClick={() => window.location.href = '/'} className="btn-primary">
              View More Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Job Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job?.title}</h1>
                <div className="flex items-center space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {job?.department}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job?.isRemote ? 'Remote' : job?.location}
                  </div>
                  {job?.salaryMin && job?.salaryMax && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salaryCurrency}{job.salaryMin.toLocaleString()} - {job.salaryCurrency}{job.salaryMax.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Posted {new Date(job?.publishedAt || '').toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-6">{job?.description}</p>
              
              {job?.responsibilities && job.responsibilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {job.responsibilities.map((item, index) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job?.requirements && job.requirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {job.requirements.map((item, index) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job?.benefits && job.benefits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {job.benefits.map((item, index) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Apply for this position</h2>
            <p className="text-gray-600">Submit your application to join our team</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume/CV URL
                </label>
                <Input
                  type="url"
                  value={formData.cvUrl}
                  onChange={(e) => handleInputChange('cvUrl', e.target.value)}
                  placeholder="https://example.com/your-resume.pdf"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload your resume to Google Drive, Dropbox, or another cloud service and paste the public link here
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <Textarea
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Code (Optional)
                </label>
                <Input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => handleInputChange('referralCode', e.target.value)}
                  placeholder="Enter referral code if you have one"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6">
                <Button
                  type="button"
                  onClick={() => window.history.back()}
                  className="btn-secondary"
                >
                  Back to Jobs
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 