'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Shield,
  Settings,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  AlertCircle,
  User,
  Crown,
  UserCheck,
  Link,
  Copy,
  Send,
  MapPin,
  Calendar,
  Briefcase,
  Target,
  Zap,
  Sparkles
} from 'lucide-react';

// Portal schema with comprehensive validation
const portalSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  clientId: z.string().min(3, 'Client ID must be at least 3 characters'),
  industry: z.string().min(1, 'Industry is required'),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  
  // Primary contact information
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().optional(),
  contactTitle: z.string().optional(),
  
  // Portal settings
  portalUrl: z.string().min(1, 'Portal URL is required'),
  accessLevel: z.enum(['ADMIN', 'COLLABORATOR', 'VIEWER']),
  allowSelfRegistration: z.boolean(),
  requireApproval: z.boolean(),
  
  // Additional team members
  teamMembers: z.array(z.object({
    email: z.string().email('Please enter a valid email address'),
    role: z.enum(['ADMIN', 'COLLABORATOR', 'VIEWER']),
    name: z.string().optional()
  })),
  
  // Location and preferences
  location: z.string().optional(),
  timezone: z.string().optional(),
  preferredLanguage: z.string(),
  
  // Portal customization
  companyLogo: z.string().optional(),
  brandColor: z.string().optional(),
  welcomeMessage: z.string().optional()
});

type PortalFormData = z.infer<typeof portalSchema>;

interface CreatePortalModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (portal: any) => void;
}

const industries = [
  'Technology', 'Finance & Banking', 'Healthcare & Life Sciences', 'Manufacturing',
  'Consulting', 'Retail & E-commerce', 'Education', 'Real Estate', 'Legal',
  'Media & Entertainment', 'Energy & Utilities', 'Transportation & Logistics',
  'Government & Public Sector', 'Non-profit', 'Other'
];

const timezones = [
  'Europe/Zurich', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
  'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'es', name: 'Spanish' }
];

export function CreatePortalModal({ open, onClose, onSuccess }: CreatePortalModalProps) {
  const [currentStep, setCurrentStep] = useState<'details' | 'contact' | 'settings' | 'team' | 'review'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
    reset,
    trigger
  } = useForm<PortalFormData>({
    resolver: zodResolver(portalSchema),
    defaultValues: {
      clientName: '',
      clientId: '',
      industry: '',
      description: '',
      website: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactTitle: '',
      portalUrl: '',
      accessLevel: 'ADMIN',
      allowSelfRegistration: false,
      requireApproval: true,
      teamMembers: [],
      location: '',
      timezone: '',
      preferredLanguage: 'en',
      companyLogo: '',
      brandColor: '#3B82F6',
      welcomeMessage: ''
    }
  });

  const watchedValues = watch();
  const teamMembers = watch('teamMembers') || [];

  // Generate portal URL from client name
  const generatePortalUrl = (clientName: string) => {
    const cleanName = clientName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
    return cleanName;
  };

  // Auto-generate client ID and portal URL when client name changes
  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('clientName', name);
    
    if (name) {
      const cleanId = generatePortalUrl(name);
      setValue('clientId', `client-${cleanId}`);
      setValue('portalUrl', cleanId);
      setPortalUrl(cleanId);
    }
  };

  const addTeamMember = () => {
    const current = getValues('teamMembers') || [];
    setValue('teamMembers', [...current, { email: '', role: 'COLLABORATOR' as const }]);
  };

  const removeTeamMember = (index: number) => {
    const current = getValues('teamMembers') || [];
    setValue('teamMembers', current.filter((_, i) => i !== index));
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof PortalFormData)[] = [];
    
    switch (currentStep) {
      case 'details':
        fieldsToValidate = ['clientName', 'clientId', 'industry', 'website'];
        break;
      case 'contact':
        fieldsToValidate = ['contactName', 'contactEmail', 'contactPhone', 'contactTitle'];
        break;
      case 'settings':
        fieldsToValidate = ['portalUrl', 'accessLevel'];
        break;
      case 'team':
        fieldsToValidate = ['teamMembers'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    const steps = ['details', 'contact', 'settings', 'team', 'review'] as const;
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = ['details', 'contact', 'settings', 'team', 'review'] as const;
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const onSubmit = async (data: PortalFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPortal = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        status: 'active',
        createdAt: new Date().toISOString(),
        portalUrl: `${window.location.origin}/clients/${data.clientId}/portal`
      };

      onSuccess?.(newPortal);
      reset();
      setCurrentStep('details');
      onClose();
    } catch (error) {
      console.error('Error creating portal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep('details');
    onClose();
  };

  if (!open) return null;

  const stepIndicator = (
    <div className="flex items-center justify-between mb-8">
      {[
        { key: 'details', label: 'Details', icon: Building2 },
        { key: 'contact', label: 'Contact', icon: User },
        { key: 'settings', label: 'Settings', icon: Settings },
        { key: 'team', label: 'Team', icon: Users },
        { key: 'review', label: 'Review', icon: Check }
      ].map((step, index) => {
        const isActive = currentStep === step.key;
        const isCompleted = ['details', 'contact', 'settings', 'team', 'review'].indexOf(currentStep) > index;
        
        return (
          <div key={step.key} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
              ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                'border-gray-300 bg-white text-gray-400'}
            `}>
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {index < 4 && (
              <ChevronRight className="w-4 h-4 text-gray-300 mx-3" />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Client Portal</h2>
            <p className="text-gray-600 mt-1">Set up a new client portal with customized access</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          {stepIndicator}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Client Details */}
            {currentStep === 'details' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                    <p className="text-gray-600">Basic details about your client organization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Client Name"
                    placeholder="e.g., Tech Innovations AG"
                    {...register('clientName')}
                    onChange={handleClientNameChange}
                    error={errors.clientName?.message}
                    required
                    leftIcon={<Building2 className="w-4 h-4" />}
                  />

                  <Input
                    label="Client ID"
                    placeholder="Auto-generated from name"
                    {...register('clientId')}
                    error={errors.clientId?.message}
                    required
                    leftIcon={<Target className="w-4 h-4" />}
                    helperText="Used for internal identification and URL generation"
                  />

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('industry')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                    {errors.industry && (
                      <p className="text-sm text-red-600">{errors.industry.message}</p>
                    )}
                  </div>

                  <Input
                    label="Website"
                    placeholder="https://company.com"
                    {...register('website')}
                    error={errors.website?.message}
                    leftIcon={<Globe className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <Textarea
                    label="Description"
                    placeholder="Brief description of the client and their business..."
                    {...register('description')}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 'contact' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Primary Contact</h3>
                    <p className="text-gray-600">Main point of contact for this portal</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Contact Name"
                    placeholder="John Smith"
                    {...register('contactName')}
                    error={errors.contactName?.message}
                    required
                    leftIcon={<User className="w-4 h-4" />}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john.smith@company.com"
                    {...register('contactEmail')}
                    error={errors.contactEmail?.message}
                    required
                    leftIcon={<Mail className="w-4 h-4" />}
                  />

                  <Input
                    label="Phone Number"
                    placeholder="+41 44 123 45 67"
                    {...register('contactPhone')}
                    error={errors.contactPhone?.message}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />

                  <Input
                    label="Job Title"
                    placeholder="HR Director"
                    {...register('contactTitle')}
                    error={errors.contactTitle?.message}
                    leftIcon={<Briefcase className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Location"
                    placeholder="Zurich, Switzerland"
                    {...register('location')}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                      {...register('timezone')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select timezone</option>
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Portal Settings */}
            {currentStep === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Portal Configuration</h3>
                    <p className="text-gray-600">Access settings and portal customization</p>
                  </div>
                </div>

                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Link className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">Portal URL</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Your client will access the portal at this URL
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{window.location.origin}/clients/</span>
                        <Input
                          {...register('portalUrl')}
                          error={errors.portalUrl?.message}
                          placeholder="client-name"
                          className="flex-1 max-w-xs"
                        />
                        <span className="text-sm text-gray-600">/portal</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Default Access Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('accessLevel')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ADMIN">Admin - Full access</option>
                      <option value="COLLABORATOR">Collaborator - Limited access</option>
                      <option value="VIEWER">Viewer - Read-only access</option>
                    </select>
                    {errors.accessLevel && (
                      <p className="text-sm text-red-600">{errors.accessLevel.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Preferred Language</label>
                    <select
                      {...register('preferredLanguage')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow Self Registration</h4>
                      <p className="text-sm text-gray-600">Users can request access to the portal</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('allowSelfRegistration')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Approval</h4>
                      <p className="text-sm text-gray-600">New registrations need admin approval</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('requireApproval')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <Textarea
                    label="Welcome Message"
                    placeholder="Welcome to our client portal! Here you can view job openings, track candidates, and collaborate with our team."
                    {...register('welcomeMessage')}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Team Members */}
            {currentStep === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                      <p className="text-gray-600">Invite additional team members to the portal</p>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTeamMember}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>

                {teamMembers.length === 0 ? (
                  <Card className="p-8 text-center bg-gray-50">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-900 mb-2">No team members yet</h4>
                    <p className="text-gray-600 mb-4">
                      Add team members to give them access to the portal
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTeamMember}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Member
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <Input
                            label="Email Address"
                            type="email"
                            placeholder="colleague@company.com"
                            {...register(`teamMembers.${index}.email` as const)}
                            error={errors.teamMembers?.[index]?.email?.message}
                            leftIcon={<Mail className="w-4 h-4" />}
                          />
                          
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select
                              {...register(`teamMembers.${index}.role` as const)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="COLLABORATOR">Collaborator</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTeamMember(index)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Review & Create</h3>
                    <p className="text-gray-600">Review all settings before creating the portal</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Client Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Name:</span> {watchedValues.clientName}</div>
                      <div><span className="text-gray-600">ID:</span> {watchedValues.clientId}</div>
                      <div><span className="text-gray-600">Industry:</span> {watchedValues.industry}</div>
                      {watchedValues.website && (
                        <div><span className="text-gray-600">Website:</span> {watchedValues.website}</div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Primary Contact
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Name:</span> {watchedValues.contactName}</div>
                      <div><span className="text-gray-600">Email:</span> {watchedValues.contactEmail}</div>
                      {watchedValues.contactTitle && (
                        <div><span className="text-gray-600">Title:</span> {watchedValues.contactTitle}</div>
                      )}
                      {watchedValues.location && (
                        <div><span className="text-gray-600">Location:</span> {watchedValues.location}</div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Portal Settings
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">URL:</span> /clients/{watchedValues.portalUrl}/portal</div>
                      <div><span className="text-gray-600">Access Level:</span> {watchedValues.accessLevel}</div>
                      <div><span className="text-gray-600">Self Registration:</span> {watchedValues.allowSelfRegistration ? 'Enabled' : 'Disabled'}</div>
                      <div><span className="text-gray-600">Requires Approval:</span> {watchedValues.requireApproval ? 'Yes' : 'No'}</div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Team Members
                    </h4>
                    <div className="space-y-2 text-sm">
                      {teamMembers.length === 0 ? (
                        <p className="text-gray-500">No additional team members</p>
                      ) : (
                        teamMembers.map((member, index) => (
                          <div key={index}>
                            <span className="text-gray-600">{member.email}</span> ({member.role})
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                {currentStep !== 'details' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                
                {currentStep !== 'review' ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Portal...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Portal
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 