'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, Phone, MapPin, Link as LinkIcon, Calendar, FileText, UserPlus, Edit3, Download, Clock } from 'lucide-react';

interface UICandidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currentRole?: string;
  location?: string;
  summary?: string;
  professionalHeadline?: string;
  experienceYears?: number;
  seniorityLevel?: string;
  primaryIndustry?: string;
  functionalDomain?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  dateOfBirth?: string;
  nationality?: string;
  timezone?: string;
  workPermitType?: string;
  address?: string;
  mobilityCountries?: string[];
  mobilityCities?: string[];
  remotePreference?: string;
  preferredContractType?: string;
  relocationWillingness?: boolean;
  availableFrom?: string;
  expectedSalary?: string;
  programmingLanguages?: string[];
  frameworks?: string[];
  toolsAndPlatforms?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  spokenLanguages?: string[];
  methodologies?: string[];
  educationLevel?: string;
  degrees?: string[];
  universities?: string[];
  graduationYear?: number;
  certifications?: string[];
  originalCvUrl?: string;
  originalCvFileName?: string;
  originalCvUploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CandidatePage() {
  const params = useParams();
  const candidateId = params?.id as string;
  const [candidate, setCandidate] = useState<UICandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/candidates/${candidateId}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed');
        setCandidate(json.data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load candidate');
      } finally {
        setLoading(false);
      }
    };
    if (candidateId) fetchCandidate();
  }, [candidateId]);

  return (
    <Layout fullWidth>
      <div className="px-6 lg:px-10 py-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#0A2F5A]/10 text-[#0A2F5A] flex items-center justify-center text-xl font-bold">
                {candidate?.name?.split(' ').map(s=>s[0]).join('').slice(0,2) || 'CA'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{candidate?.name || 'Candidate'}</h1>
                <p className="text-gray-600">{candidate?.currentRole || 'Not specified'}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-700">
                  {candidate?.email && (
                    <span className="inline-flex items-center"><Mail className="h-4 w-4 mr-2 text-gray-500" />{candidate.email}</span>
                  )}
                  {candidate?.phone && (
                    <span className="inline-flex items-center"><Phone className="h-4 w-4 mr-2 text-gray-500" />{candidate.phone}</span>
                  )}
                  {candidate?.location && (
                    <span className="inline-flex items-center"><MapPin className="h-4 w-4 mr-2 text-gray-500" />{candidate.location}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-primary-600 text-white"><FileText className="h-4 w-4 mr-2" />Create Competence File</Button>
              <Button className="bg-teal-600 text-white"><UserPlus className="h-4 w-4 mr-2" />Add to Job</Button>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Professional Summary" />
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">{candidate?.summary || 'No summary available'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Professional Details" />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <Detail label="Headline" value={candidate?.professionalHeadline} />
                  <Detail label="Years of Experience" value={candidate?.experienceYears?.toString()} />
                  <Detail label="Seniority Level" value={candidate?.seniorityLevel} />
                  <Detail label="Primary Industry" value={candidate?.primaryIndustry} />
                  <Detail label="Functional Domain" value={candidate?.functionalDomain} />
                  <Detail label="LinkedIn" value={candidate?.linkedinUrl} isLink />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Skills & Technologies" />
              <CardContent>
                <TagGroup label="Programming Languages" items={candidate?.programmingLanguages} />
                <TagGroup label="Frameworks & Libraries" items={candidate?.frameworks} />
                <TagGroup label="Tools & Platforms" items={candidate?.toolsAndPlatforms} />
                <TagGroup label="Technical Skills" items={candidate?.technicalSkills} />
                <TagGroup label="Methodologies" items={candidate?.methodologies} />
                <TagGroup label="Languages" items={candidate?.spokenLanguages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Education & Certifications" />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <Detail label="Education Level" value={candidate?.educationLevel} />
                  <Detail label="Graduation Year" value={candidate?.graduationYear?.toString()} />
                </div>
                <TagGroup label="Degrees" items={candidate?.degrees} />
                <TagGroup label="Universities" items={candidate?.universities} />
                <TagGroup label="Certifications" items={candidate?.certifications} />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Personal Information" />
              <CardContent>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <Detail label="Date of Birth" value={candidate?.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString() : undefined} />
                  <Detail label="Nationality" value={candidate?.nationality} />
                  <Detail label="Timezone" value={candidate?.timezone} />
                  <Detail label="Work Permit" value={candidate?.workPermitType} />
                  <Detail label="Address" value={candidate?.address} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Work Preferences" />
              <CardContent>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <Detail label="Remote Preference" value={candidate?.remotePreference} />
                  <Detail label="Contract Type" value={candidate?.preferredContractType} />
                  <Detail label="Open to relocation" value={candidate?.relocationWillingness ? 'Yes' : 'No'} />
                  <Detail label="Available From" value={candidate?.availableFrom ? new Date(candidate.availableFrom).toLocaleDateString() : undefined} />
                  <Detail label="Expected Salary" value={candidate?.expectedSalary} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Mobility" />
              <CardContent>
                <TagGroup label="Countries" items={candidate?.mobilityCountries} />
                <TagGroup label="Cities" items={candidate?.mobilityCities} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Documents" />
              <CardContent>
                {candidate?.originalCvUrl ? (
                  <a href={candidate.originalCvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Download className="h-4 w-4 mr-2" /> Download CV
                  </a>
                ) : (
                  <p className="text-gray-500">No documents uploaded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Activity" />
              <CardContent>
                <div className="text-sm text-gray-600 flex items-center"><Clock className="h-4 w-4 mr-2" />Created {candidate?.createdAt ? new Date(candidate.createdAt).toLocaleString() : '-'}</div>
                <div className="text-sm text-gray-600">Updated {candidate?.updatedAt ? new Date(candidate.updatedAt).toLocaleString() : '-'}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Detail({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      {value ? (
        isLink ? <a className="text-primary-700 hover:underline" href={value} target="_blank" rel="noreferrer">{value}</a>
               : <span className="text-gray-900">{value}</span>
      ) : (
        <span className="text-gray-400">Not specified</span>
      )}
    </div>
  );
}

function TagGroup({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return (
    <div className="mb-3">
      <div className="text-gray-500 text-sm mb-2">{label}</div>
      <div className="text-gray-400 text-sm">Not specified</div>
    </div>
  );
  return (
    <div className="mb-3">
      <div className="text-gray-500 text-sm mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span key={idx} className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">{item}</span>
        ))}
      </div>
    </div>
  );
}


