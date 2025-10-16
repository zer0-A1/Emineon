'use client';

import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  DollarSign, 
  Building, 
  Code, 
  Database, 
  Cloud, 
  Shield, 
  Monitor, 
  MessageSquare, 
  Settings, 
  Star,
  ExternalLink,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';

interface CandidateFieldDisplayProps {
  candidate: any;
  isEditMode?: boolean;
  onFieldChange?: (field: string, value: any) => void;
  className?: string;
  collapsible?: boolean; // when false, show everything expanded with no toggles
}

interface FieldCategory {
  id: string;
  title: string;
  icon: any;
  fields: FieldGroup[];
  description?: string;
}

interface FieldGroup {
  id: string;
  title: string;
  fields: Field[];
  columns?: number;
}

interface Field {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'date' | 'number' | 'boolean' | 'array' | 'object' | 'select';
  value: any;
  options?: string[];
  icon?: any;
  description?: string;
  format?: (value: any) => string;
}

export function CandidateFieldDisplay({ 
  candidate, 
  isEditMode = false, 
  onFieldChange,
  className = '',
  collapsible = true,
}: CandidateFieldDisplayProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['personal', 'professional']));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const formatValue = (field: Field) => {
    if (field.format) {
      return field.format(field.value);
    }
    
    if (field.type === 'array' && Array.isArray(field.value)) {
      return field.value.length > 0 ? field.value.join(', ') : 'Not specified';
    }
    
    if (field.type === 'boolean') {
      return field.value ? 'Yes' : 'No';
    }
    
    if (field.type === 'url' && field.value) {
      return field.value;
    }
    
    return field.value || 'Not specified';
  };

  const renderField = (field: Field) => {
    const value = formatValue(field);
    const isEmpty = !field.value || (Array.isArray(field.value) && field.value.length === 0);
    
    if (isEmpty && !isEditMode) {
      return null;
    }

    return (
      <div key={field.key} className="space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {field.icon && <field.icon className="h-4 w-4 mr-2 text-gray-500" />}
          {field.label}
        </label>
        
        {isEditMode ? (
          <div className="space-y-1">
            {field.type === 'array' ? (
              <div className="space-y-2">
                <textarea
                  value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                  onChange={(e) => {
                    const newValue = e.target.value.split('\n').filter(v => v.trim());
                    onFieldChange?.(field.key, newValue);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter ${field.label.toLowerCase()}, one per line`}
                  rows={3}
                />
              </div>
            ) : field.type === 'boolean' ? (
              <select
                value={field.value ? 'true' : 'false'}
                onChange={(e) => onFieldChange?.(field.key, e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : field.type === 'select' ? (
              <select
                value={field.value || ''}
                onChange={(e) => onFieldChange?.(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={field.value || ''}
                onChange={(e) => onFieldChange?.(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-900">
            {field.type === 'url' && field.value ? (
              <a 
                href={field.value} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                {field.value}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            ) : field.type === 'array' && Array.isArray(field.value) && field.value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {field.value.map((item, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <span className={isEmpty ? 'text-gray-400 italic' : ''}>
                {value}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const fieldCategories: FieldCategory[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: User,
      description: 'Basic personal details and contact information',
      fields: [
        {
          id: 'basic',
          title: 'Basic Information',
          fields: [
            { key: 'firstName', label: 'First Name', type: 'text', value: candidate.firstName || candidate.first_name },
            { key: 'lastName', label: 'Last Name', type: 'text', value: candidate.lastName || candidate.last_name },
            { key: 'email', label: 'Email', type: 'email', value: candidate.email, icon: Mail },
            { key: 'phone', label: 'Phone', type: 'tel', value: candidate.phone, icon: Phone },
            { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', value: candidate.dateOfBirth || candidate.date_of_birth },
            { key: 'nationality', label: 'Nationality', type: 'text', value: candidate.nationality },
            { key: 'gender', label: 'Gender', type: 'select', value: candidate.gender, options: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
            { key: 'timezone', label: 'Timezone', type: 'text', value: candidate.timezone },
          ]
        },
        {
          id: 'address',
          title: 'Address & Location',
          fields: [
            { key: 'address', label: 'Address', type: 'text', value: candidate.address, icon: MapPin },
            { key: 'currentLocation', label: 'Current Location', type: 'text', value: candidate.currentLocation || candidate.current_location, icon: MapPin },
            { key: 'mobilityCountries', label: 'Mobility Countries', type: 'array', value: candidate.mobilityCountries || candidate.mobility_countries },
            { key: 'mobilityCities', label: 'Mobility Cities', type: 'array', value: candidate.mobilityCities || candidate.mobility_cities },
          ]
        }
      ]
    },
    {
      id: 'professional',
      title: 'Professional Profile',
      icon: Briefcase,
      description: 'Professional background and career information',
      fields: [
        {
          id: 'current',
          title: 'Current Position',
          fields: [
            { key: 'currentTitle', label: 'Current Title', type: 'text', value: candidate.currentTitle || candidate.current_title || candidate.currentRole },
            { key: 'professionalHeadline', label: 'Professional Headline', type: 'text', value: candidate.professionalHeadline || candidate.professional_headline },
            { key: 'currentCompany', label: 'Current Company', type: 'text', value: candidate.currentCompany || candidate.current_company || candidate.company },
            { key: 'summary', label: 'Professional Summary', type: 'text', value: candidate.summary },
            { key: 'experienceYears', label: 'Years of Experience', type: 'number', value: candidate.experienceYears || candidate.experience_years },
            { key: 'seniorityLevel', label: 'Seniority Level', type: 'select', value: candidate.seniorityLevel || candidate.seniority_level, options: ['JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'EXECUTIVE'] },
          ]
        },
        {
          id: 'industry',
          title: 'Industry & Domain',
          fields: [
            { key: 'primaryIndustry', label: 'Primary Industry', type: 'text', value: candidate.primaryIndustry || candidate.primary_industry },
            { key: 'industries', label: 'Industries', type: 'array', value: candidate.industries },
            { key: 'functionalDomain', label: 'Functional Domain', type: 'text', value: candidate.functionalDomain || candidate.functional_domain },
            { key: 'functionalExpertise', label: 'Functional Expertise', type: 'array', value: candidate.functionalExpertise || candidate.functional_expertise },
          ]
        }
      ]
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      icon: Code,
      description: 'Technical and professional skills across all categories',
      fields: [
        {
          id: 'core-skills',
          title: 'Core Skills',
          fields: [
            { key: 'technicalSkills', label: 'Technical Skills', type: 'array', value: candidate.technicalSkills || candidate.technical_skills || candidate.skills },
            { key: 'softSkills', label: 'Soft Skills', type: 'array', value: candidate.softSkills || candidate.soft_skills },
            { key: 'programmingLanguages', label: 'Programming Languages', type: 'array', value: candidate.programmingLanguages || candidate.programming_languages },
            { key: 'frameworks', label: 'Frameworks', type: 'array', value: candidate.frameworks },
            { key: 'toolsAndPlatforms', label: 'Tools & Platforms', type: 'array', value: candidate.toolsAndPlatforms || candidate.tools_and_platforms },
            { key: 'methodologies', label: 'Methodologies', type: 'array', value: candidate.methodologies },
          ]
        },
        {
          id: 'technical-skills',
          title: 'Technical Specializations',
          fields: [
            { key: 'databases', label: 'Databases', type: 'array', value: candidate.databases, icon: Database },
            { key: 'cloudPlatforms', label: 'Cloud Platforms', type: 'array', value: candidate.cloudPlatforms || candidate.cloud_platforms, icon: Cloud },
            { key: 'devOpsTools', label: 'DevOps Tools', type: 'array', value: candidate.devOpsTools || candidate.dev_ops_tools },
            { key: 'testingTools', label: 'Testing Tools', type: 'array', value: candidate.testingTools || candidate.testing_tools },
            { key: 'dataEngineeringTools', label: 'Data Engineering Tools', type: 'array', value: candidate.dataEngineeringTools || candidate.data_engineering_tools },
            { key: 'mlFrameworks', label: 'ML Frameworks', type: 'array', value: candidate.mlFrameworks || candidate.ml_frameworks },
            { key: 'analyticsTools', label: 'Analytics Tools', type: 'array', value: candidate.analyticsTools || candidate.analytics_tools },
            { key: 'mobileTechnologies', label: 'Mobile Technologies', type: 'array', value: candidate.mobileTechnologies || candidate.mobile_technologies },
            { key: 'webTechnologies', label: 'Web Technologies', type: 'array', value: candidate.webTechnologies || candidate.web_technologies },
            { key: 'securityTools', label: 'Security Tools', type: 'array', value: candidate.securityTools || candidate.security_tools, icon: Shield },
            { key: 'monitoringTools', label: 'Monitoring Tools', type: 'array', value: candidate.monitoringTools || candidate.monitoring_tools, icon: Monitor },
            { key: 'messagingSystems', label: 'Messaging Systems', type: 'array', value: candidate.messagingSystems || candidate.messaging_systems },
            { key: 'cmsPlatforms', label: 'CMS Platforms', type: 'array', value: candidate.cmsPlatforms || candidate.cms_platforms },
            { key: 'crmErp', label: 'CRM/ERP', type: 'array', value: candidate.crmErp || candidate.crm_erp },
          ]
        }
      ]
    },
    {
      id: 'education',
      title: 'Education & Certifications',
      icon: GraduationCap,
      description: 'Educational background and professional certifications',
      fields: [
        {
          id: 'education',
          title: 'Education',
          fields: [
            { key: 'educationLevel', label: 'Education Level', type: 'select', value: candidate.educationLevel || candidate.education_level, options: ['HIGH_SCHOOL', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER'] },
            { key: 'universities', label: 'Universities', type: 'array', value: candidate.universities },
            { key: 'degrees', label: 'Degrees', type: 'array', value: candidate.degrees },
            { key: 'graduationYear', label: 'Graduation Year', type: 'number', value: candidate.graduationYear || candidate.graduation_year },
            { key: 'certifications', label: 'Certifications', type: 'array', value: candidate.certifications },
          ]
        },
        {
          id: 'education-details',
          title: 'Education Details',
          fields: [
            { key: 'education', label: 'Education History', type: 'object', value: candidate.education, format: (edu) => Array.isArray(edu) ? `${edu.length} education entries` : 'Not specified' },
          ]
        }
      ]
    },
    {
      id: 'work-preferences',
      title: 'Work Preferences',
      icon: Settings,
      description: 'Salary expectations, work arrangements, and availability',
      fields: [
        {
          id: 'salary',
          title: 'Salary & Compensation',
          fields: [
            { key: 'expectedSalary', label: 'Expected Salary', type: 'text', value: candidate.expectedSalary || candidate.expected_salary, icon: DollarSign },
            { key: 'expectedSalaryMin', label: 'Min Salary', type: 'number', value: candidate.expectedSalaryMin || candidate.expected_salary_min },
            { key: 'expectedSalaryMax', label: 'Max Salary', type: 'number', value: candidate.expectedSalaryMax || candidate.expected_salary_max },
            { key: 'salaryCurrency', label: 'Currency', type: 'text', value: candidate.salaryCurrency || candidate.salary_currency },
          ]
        },
        {
          id: 'work-arrangement',
          title: 'Work Arrangement',
          fields: [
            { key: 'preferredContractType', label: 'Contract Type', type: 'select', value: candidate.preferredContractType || candidate.preferred_contract_type, options: ['PERMANENT', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'PARTTIME'] },
            { key: 'freelancer', label: 'Freelancer', type: 'boolean', value: candidate.freelancer },
            { key: 'remotePreference', label: 'Remote Preference', type: 'select', value: candidate.remotePreference || candidate.remote_preference, options: ['REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE'] },
            { key: 'relocationWillingness', label: 'Relocation Willingness', type: 'boolean', value: candidate.relocationWillingness || candidate.relocation_willingness },
            { key: 'workPermitType', label: 'Work Permit Type', type: 'text', value: candidate.workPermitType || candidate.work_permit_type },
            { key: 'availableFrom', label: 'Available From', type: 'date', value: candidate.availableFrom || candidate.available_from },
            { key: 'noticePeriod', label: 'Notice Period', type: 'text', value: candidate.noticePeriod || candidate.notice_period },
          ]
        }
      ]
    },
    {
      id: 'online-presence',
      title: 'Online Presence',
      icon: Globe,
      description: 'Social profiles and online portfolios',
      fields: [
        {
          id: 'profiles',
          title: 'Online Profiles',
          fields: [
            { key: 'linkedinUrl', label: 'LinkedIn', type: 'url', value: candidate.linkedinUrl || candidate.linkedin_url, icon: LinkIcon },
            { key: 'githubUrl', label: 'GitHub', type: 'url', value: candidate.githubUrl || candidate.github_url, icon: LinkIcon },
            { key: 'portfolioUrl', label: 'Portfolio', type: 'url', value: candidate.portfolioUrl || candidate.portfolio_url, icon: LinkIcon },
            { key: 'personalWebsite', label: 'Personal Website', type: 'url', value: candidate.personalWebsite || candidate.personal_website, icon: LinkIcon },
            { key: 'videoUrl', label: 'Video Profile', type: 'url', value: candidate.videoUrl || candidate.video_url, icon: LinkIcon },
            { key: 'otherUrls', label: 'Other URLs', type: 'array', value: candidate.otherUrls || candidate.other_urls },
          ]
        }
      ]
    },
    {
      id: 'languages',
      title: 'Languages',
      icon: Languages,
      description: 'Language skills and proficiencies',
      fields: [
        {
          id: 'language-skills',
          title: 'Language Skills',
          fields: [
            { key: 'languages', label: 'Languages', type: 'array', value: candidate.languages || candidate.spokenLanguages || candidate.spoken_languages },
            { key: 'nativeLanguage', label: 'Native Language', type: 'text', value: candidate.nativeLanguage || candidate.native_language },
            { key: 'languageProficiencies', label: 'Language Proficiencies', type: 'object', value: candidate.languageProficiencies || candidate.language_proficiencies, format: (prof) => Array.isArray(prof) ? `${prof.length} proficiency entries` : 'Not specified' },
          ]
        }
      ]
    },
    {
      id: 'work-history',
      title: 'Work History',
      icon: Building,
      description: 'Professional work experience and projects',
      fields: [
        {
          id: 'experience',
          title: 'Work Experience',
          fields: [
            { key: 'workHistory', label: 'Work History', type: 'object', value: candidate.workHistory || candidate.work_history, format: (history) => Array.isArray(history) ? `${history.length} work entries` : 'Not specified' },
            { key: 'workExperience', label: 'Work Experience', type: 'object', value: candidate.workExperience, format: (exp) => Array.isArray(exp) ? `${exp.length} experience entries` : 'Not specified' },
          ]
        },
        {
          id: 'projects',
          title: 'Projects',
          fields: [
            { key: 'projects', label: 'Projects', type: 'object', value: candidate.projects, format: (proj) => Array.isArray(proj) ? `${proj.length} project entries` : 'Not specified' },
          ]
        }
      ]
    },
    {
      id: 'additional',
      title: 'Additional Information',
      icon: Award,
      description: 'Publications, awards, references, and other details',
      fields: [
        {
          id: 'achievements',
          title: 'Achievements & Recognition',
          fields: [
            { key: 'publications', label: 'Publications', type: 'array', value: candidate.publications },
            { key: 'awards', label: 'Awards', type: 'object', value: candidate.awards, format: (awards) => Array.isArray(awards) ? `${awards.length} award entries` : 'Not specified' },
            { key: 'hobbies', label: 'Hobbies', type: 'array', value: candidate.hobbies },
            { key: 'volunteerWork', label: 'Volunteer Work', type: 'object', value: candidate.volunteerWork || candidate.volunteer_work, format: (vol) => Array.isArray(vol) ? `${vol.length} volunteer entries` : 'Not specified' },
          ]
        },
        {
          id: 'references',
          title: 'References & Contacts',
          fields: [
            { key: 'references', label: 'References', type: 'object', value: candidate.references, format: (refs) => Array.isArray(refs) ? `${refs.length} reference entries` : 'Not specified' },
            { key: 'emergencyContact', label: 'Emergency Contact', type: 'object', value: candidate.emergencyContact || candidate.emergency_contact, format: (contact) => contact ? 'Emergency contact provided' : 'Not specified' },
          ]
        },
        {
          id: 'additional-details',
          title: 'Additional Details',
          fields: [
            { key: 'militaryService', label: 'Military Service', type: 'boolean', value: candidate.militaryService || candidate.military_service },
            { key: 'securityClearance', label: 'Security Clearance', type: 'text', value: candidate.securityClearance || candidate.security_clearance },
            { key: 'drivingLicense', label: 'Driving License', type: 'array', value: candidate.drivingLicense || candidate.driving_license },
          ]
        }
      ]
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {fieldCategories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const CategoryIcon = category.icon;
        
        return (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {collapsible ? (
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CategoryIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-full px-6 py-4 flex items-center justify-between text-left">
                <div className="flex items-center space-x-3">
                  <CategoryIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(collapsible ? isExpanded : true) && (
              <div className="px-6 pb-6 space-y-6">
                {category.fields.map((group) => {
                  const isGroupExpanded = collapsible ? expandedGroups.has(`${category.id}-${group.id}`) : true;
                  const GroupIcon = group.title.includes('Skills') ? Code : 
                                  group.title.includes('Education') ? GraduationCap :
                                  group.title.includes('Work') ? Briefcase :
                                  group.title.includes('Language') ? Languages :
                                  group.title.includes('Online') ? Globe :
                                  group.title.includes('Additional') ? Award : User;
                  
                  return (
                    <div key={group.id} className="space-y-4">
                      {collapsible ? (
                        <button
                          onClick={() => toggleGroup(`${category.id}-${group.id}`)}
                          className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <GroupIcon className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">{group.title}</h4>
                          </div>
                          {isGroupExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between text-left p-1">
                          <div className="flex items-center space-x-2">
                            <GroupIcon className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">{group.title}</h4>
                          </div>
                        </div>
                      )}
                      
                      {(collapsible ? isGroupExpanded : true) && (
                        <div className={`grid gap-4 ${group.columns === 1 ? 'grid-cols-1' : group.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                          {group.fields.map((field) => renderField(field))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
