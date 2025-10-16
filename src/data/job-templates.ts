export interface StyleConfig {
  // Typography
  titleFont: string;
  titleSize: string;
  titleWeight: string;
  titleColor: string;
  
  subtitleFont: string;
  subtitleSize: string;
  subtitleWeight: string;
  subtitleColor: string;
  
  bodyFont: string;
  bodySize: string;
  bodyWeight: string;
  bodyColor: string;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  
  // Layout
  spacing: 'compact' | 'normal' | 'spacious';
  borderRadius: string;
  borderWidth: string;
  
  // Section styling
  sectionHeaderFont: string;
  sectionHeaderSize: string;
  sectionHeaderWeight: string;
  sectionHeaderColor: string;
  sectionHeaderBackground: string;
  
  // List styling
  bulletStyle: 'disc' | 'circle' | 'square' | 'none' | 'custom';
  bulletColor: string;
  listIndent: string;
  
  // Skills/Tags styling
  tagBackground: string;
  tagColor: string;
  tagBorder: string;
  tagBorderRadius: string;
}

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string;
  colorHex: string;
  font: string;
  previewImage?: string;
  
  // Enhanced styling configuration
  styleConfig: StyleConfig;
  
  sections: {
    key: string;
    label: string;
    show: boolean;
    order: number;
  }[];
  sampleContent: {
    title: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
  };
}

// Font options
export const fontOptions = [
  { value: 'Inter', label: 'Inter (Modern Sans-serif)' },
  { value: 'Helvetica', label: 'Helvetica (Classic Sans-serif)' },
  { value: 'Times New Roman', label: 'Times New Roman (Serif)' },
  { value: 'Georgia', label: 'Georgia (Readable Serif)' },
  { value: 'Arial', label: 'Arial (Universal Sans-serif)' },
  { value: 'Roboto', label: 'Roboto (Google Sans-serif)' },
  { value: 'Open Sans', label: 'Open Sans (Friendly Sans-serif)' },
  { value: 'Lato', label: 'Lato (Humanist Sans-serif)' },
  { value: 'Montserrat', label: 'Montserrat (Geometric Sans-serif)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant Serif)' }
];

// Color palette options
export const colorPalettes = [
  {
    name: 'Professional Blue',
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#60A5FA'
  },
  {
    name: 'Tech Purple',
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#A78BFA'
  },
  {
    name: 'Success Green',
    primary: '#059669',
    secondary: '#10B981',
    accent: '#34D399'
  },
  {
    name: 'Creative Orange',
    primary: '#EA580C',
    secondary: '#F97316',
    accent: '#FB923C'
  },
  {
    name: 'Elegant Red',
    primary: '#DC2626',
    secondary: '#EF4444',
    accent: '#F87171'
  },
  {
    name: 'Minimal Gray',
    primary: '#374151',
    secondary: '#6B7280',
    accent: '#9CA3AF'
  }
];

// Predefined style presets
export const stylePresets: Record<string, StyleConfig> = {
  emineon: {
    titleFont: 'Inter',
    titleSize: '2.5rem',
    titleWeight: '800',
    titleColor: '#0A2F5A', // Primary Deep Navy Blue
    
    subtitleFont: 'Inter',
    subtitleSize: '1.375rem',
    subtitleWeight: '600',
    subtitleColor: '#444B54', // Secondary Steel Gray
    
    bodyFont: 'Inter',
    bodySize: '1.125rem',
    bodyWeight: '400',
    bodyColor: '#6C757D', // Neutral gray for readability
    
    primaryColor: '#0A2F5A', // Deep Navy Blue
    secondaryColor: '#C75B12', // Burnt Orange accent
    accentColor: '#008080', // Teal for highlights
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E9F1', // Primary-100
    
    spacing: 'normal',
    borderRadius: '12px',
    borderWidth: '2px',
    
    sectionHeaderFont: 'Inter',
    sectionHeaderSize: '1.25rem',
    sectionHeaderWeight: '700',
    sectionHeaderColor: '#0A2F5A',
    sectionHeaderBackground: 'linear-gradient(135deg, #F0F4F8 0%, #E1E9F1 100%)', // Primary gradient
    
    bulletStyle: 'custom',
    bulletColor: '#C75B12', // Burnt Orange bullets
    listIndent: '1.75rem',
    
    tagBackground: '#F0F4F8', // Primary-50
    tagColor: '#0A2F5A', // Primary
    tagBorder: '#C3D3E3', // Primary-200
    tagBorderRadius: '8px'
  },
  modern: {
    titleFont: 'Inter',
    titleSize: '2rem',
    titleWeight: '700',
    titleColor: '#1F2937',
    
    subtitleFont: 'Inter',
    subtitleSize: '1.25rem',
    subtitleWeight: '600',
    subtitleColor: '#374151',
    
    bodyFont: 'Inter',
    bodySize: '1rem',
    bodyWeight: '400',
    bodyColor: '#6B7280',
    
    primaryColor: '#3B82F6',
    secondaryColor: '#6366F1',
    accentColor: '#10B981',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    
    spacing: 'normal',
    borderRadius: '0.5rem',
    borderWidth: '1px',
    
    sectionHeaderFont: 'Inter',
    sectionHeaderSize: '1.125rem',
    sectionHeaderWeight: '600',
    sectionHeaderColor: '#1F2937',
    sectionHeaderBackground: '#F9FAFB',
    
    bulletStyle: 'disc',
    bulletColor: '#3B82F6',
    listIndent: '1.5rem',
    
    tagBackground: '#EFF6FF',
    tagColor: '#1D4ED8',
    tagBorder: '#DBEAFE',
    tagBorderRadius: '0.375rem'
  },
  
  classic: {
    titleFont: 'Times New Roman',
    titleSize: '2.25rem',
    titleWeight: '700',
    titleColor: '#1F2937',
    
    subtitleFont: 'Times New Roman',
    subtitleSize: '1.5rem',
    subtitleWeight: '600',
    subtitleColor: '#374151',
    
    bodyFont: 'Times New Roman',
    bodySize: '1.125rem',
    bodyWeight: '400',
    bodyColor: '#4B5563',
    
    primaryColor: '#1E40AF',
    secondaryColor: '#1E3A8A',
    accentColor: '#059669',
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    
    spacing: 'spacious',
    borderRadius: '0.25rem',
    borderWidth: '2px',
    
    sectionHeaderFont: 'Times New Roman',
    sectionHeaderSize: '1.25rem',
    sectionHeaderWeight: '700',
    sectionHeaderColor: '#1E40AF',
    sectionHeaderBackground: '#F8FAFC',
    
    bulletStyle: 'square',
    bulletColor: '#1E40AF',
    listIndent: '2rem',
    
    tagBackground: '#F1F5F9',
    tagColor: '#1E40AF',
    tagBorder: '#CBD5E1',
    tagBorderRadius: '0.25rem'
  },
  
  minimal: {
    titleFont: 'Helvetica',
    titleSize: '1.875rem',
    titleWeight: '300',
    titleColor: '#111827',
    
    subtitleFont: 'Helvetica',
    subtitleSize: '1.125rem',
    subtitleWeight: '400',
    subtitleColor: '#374151',
    
    bodyFont: 'Helvetica',
    bodySize: '0.875rem',
    bodyWeight: '400',
    bodyColor: '#6B7280',
    
    primaryColor: '#000000',
    secondaryColor: '#374151',
    accentColor: '#6B7280',
    backgroundColor: '#FFFFFF',
    borderColor: '#F3F4F6',
    
    spacing: 'compact',
    borderRadius: '0rem',
    borderWidth: '1px',
    
    sectionHeaderFont: 'Helvetica',
    sectionHeaderSize: '1rem',
    sectionHeaderWeight: '500',
    sectionHeaderColor: '#111827',
    sectionHeaderBackground: 'transparent',
    
    bulletStyle: 'none',
    bulletColor: '#000000',
    listIndent: '1rem',
    
    tagBackground: '#F9FAFB',
    tagColor: '#374151',
    tagBorder: '#E5E7EB',
    tagBorderRadius: '0rem'
  },
  
  creative: {
    titleFont: 'Inter',
    titleSize: '2.5rem',
    titleWeight: '800',
    titleColor: '#7C3AED',
    
    subtitleFont: 'Inter',
    subtitleSize: '1.375rem',
    subtitleWeight: '600',
    subtitleColor: '#A855F7',
    
    bodyFont: 'Inter',
    bodySize: '1rem',
    bodyWeight: '400',
    bodyColor: '#4B5563',
    
    primaryColor: '#7C3AED',
    secondaryColor: '#A855F7',
    accentColor: '#EC4899',
    backgroundColor: '#FFFFFF',
    borderColor: '#E879F9',
    
    spacing: 'normal',
    borderRadius: '1rem',
    borderWidth: '2px',
    
    sectionHeaderFont: 'Inter',
    sectionHeaderSize: '1.25rem',
    sectionHeaderWeight: '700',
    sectionHeaderColor: '#7C3AED',
    sectionHeaderBackground: '#FAF5FF',
    
    bulletStyle: 'circle',
    bulletColor: '#A855F7',
    listIndent: '1.5rem',
    
    tagBackground: '#F3E8FF',
    tagColor: '#7C3AED',
    tagBorder: '#DDD6FE',
    tagBorderRadius: '0.75rem'
  }
};



export const jobTemplates: JobTemplate[] = [
  {
    id: 'emineon-professional',
    name: 'Emineon Professional',
    description: 'Premium Emineon template with sophisticated design and professional styling',
    category: 'Professional',
    industry: 'All Industries',
    colorHex: '#0A2F5A',
    font: 'Inter',
    previewImage: '/templates/emineon-professional-preview.png',
    styleConfig: {
      // Typography - Matching Emineon competence file exactly
      titleFont: 'Inter',
      titleSize: '2.5rem',
      titleWeight: '700',
      titleColor: '#0A2F5A', // Deep Navy Blue
      
      subtitleFont: 'Inter',
      subtitleSize: '1.375rem',
      subtitleWeight: '600',
      subtitleColor: '#444B54', // Steel Gray
      
      bodyFont: 'Inter',
      bodySize: '1.125rem',
      bodyWeight: '400',
      bodyColor: '#6C757D', // Neutral gray for readability
      
      // Colors - Exact Emineon brand palette
      primaryColor: '#0A2F5A', // Deep Navy Blue
      secondaryColor: '#C75B12', // Burnt Orange (corrected from original)
      accentColor: '#008080', // Teal
      backgroundColor: '#FFFFFF',
      borderColor: '#E1E9F1', // Primary-100
      
      // Layout
      spacing: 'normal',
      borderRadius: '12px',
      borderWidth: '2px',
      
      // Section styling - Matching competence file
      sectionHeaderFont: 'Inter',
      sectionHeaderSize: '1.25rem',
      sectionHeaderWeight: '700',
      sectionHeaderColor: '#0A2F5A',
      sectionHeaderBackground: 'linear-gradient(135deg, #F0F4F8 0%, #E1E9F1 100%)',
      
      // List styling - Orange bullets like competence file
      bulletStyle: 'custom',
      bulletColor: '#C75B12', // Burnt Orange bullets
      listIndent: '1.75rem',
      
      // Skills/Tags styling
      tagBackground: '#F0F4F8', // Primary-50
      tagColor: '#0A2F5A', // Primary
      tagBorder: '#C3D3E3', // Primary-200
      tagBorderRadius: '8px'
    },
    sections: [
      { key: 'title', label: 'Position Title', show: true, order: 1 },
      { key: 'company', label: 'Company Information', show: true, order: 2 },
      { key: 'location', label: 'Location & Work Mode', show: true, order: 3 },
      { key: 'description', label: 'Role Overview', show: true, order: 4 },
      { key: 'responsibilities', label: 'Key Responsibilities', show: true, order: 5 },
      { key: 'requirements', label: 'Requirements & Qualifications', show: true, order: 6 },
      { key: 'skills', label: 'Required Skills & Competencies', show: true, order: 7 },
      { key: 'benefits', label: 'Benefits & Compensation', show: true, order: 8 },
      { key: 'salary', label: 'Salary Range', show: true, order: 9 },
      { key: 'languages', label: 'Language Requirements', show: true, order: 10 },
    ],
    sampleContent: {
      title: 'Senior Software Engineer',
      description: 'Join our innovative team to build cutting-edge solutions that drive digital transformation. We are seeking a passionate engineer who thrives in a collaborative environment and is committed to delivering exceptional results.',
      responsibilities: [
        'Design and develop scalable software solutions using modern technologies',
        'Collaborate with cross-functional teams to define and implement new features',
        'Participate in code reviews and maintain high-quality coding standards',
        'Mentor junior developers and contribute to technical decision-making',
        'Drive continuous improvement initiatives and technical innovation'
      ],
      requirements: [
        'Bachelor\'s degree in Computer Science, Engineering, or related field',
        '5+ years of professional software development experience',
        'Strong expertise in modern programming languages and frameworks',
        'Experience with cloud platforms and microservices architecture',
        'Excellent problem-solving skills and attention to detail'
      ],
      benefits: [
        'Competitive salary with performance-based bonuses',
        'Comprehensive health insurance and wellness programs',
        'Flexible work arrangements and remote work options',
        'Professional development budget and learning opportunities',
        'Stock options and retirement savings plan'
      ]
    }
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    description: 'Modern, dynamic template for technology startups and scale-ups',
    category: 'Technology',
    industry: 'Software & Technology',
    colorHex: '#6366F1',
    font: 'Inter',
    previewImage: '/templates/tech-startup-preview.png',
    styleConfig: {
      ...stylePresets.modern,
      primaryColor: '#6366F1',
      secondaryColor: '#8B5CF6',
      accentColor: '#A78BFA'
    },
    sections: [
      { key: 'title', label: 'Job Title', show: true, order: 1 },
      { key: 'company', label: 'Company Information', show: true, order: 2 },
      { key: 'location', label: 'Location & Work Mode', show: true, order: 3 },
      { key: 'description', label: 'Role Overview', show: true, order: 4 },
      { key: 'responsibilities', label: 'Key Responsibilities', show: true, order: 5 },
      { key: 'requirements', label: 'Requirements', show: true, order: 6 },
      { key: 'skills', label: 'Technical Skills', show: true, order: 7 },
      { key: 'benefits', label: 'What We Offer', show: true, order: 8 },
      { key: 'salary', label: 'Compensation', show: false, order: 9 },
      { key: 'languages', label: 'Language Requirements', show: false, order: 10 },
    ],
    sampleContent: {
      title: 'Senior Software Engineer',
      description: 'Join our innovative team and help build the next generation of software solutions. We\'re looking for passionate engineers who thrive in a fast-paced, collaborative environment.',
      responsibilities: [
        'Design and develop scalable web applications',
        'Collaborate with cross-functional teams',
        'Mentor junior developers',
        'Participate in architecture decisions',
        'Ensure code quality and best practices'
      ],
      requirements: [
        '5+ years of software development experience',
        'Proficiency in modern web technologies',
        'Experience with cloud platforms',
        'Strong problem-solving skills',
        'Excellent communication abilities'
      ],
      benefits: [
        'Competitive salary and equity',
        'Flexible working arrangements',
        'Professional development budget',
        'Health and wellness benefits',
        'Modern office environment'
      ]
    }
  },
  {
    id: 'corporate-finance',
    name: 'Corporate Finance',
    description: 'Professional template for banking and financial services positions',
    category: 'Finance',
    industry: 'Banking & Finance',
    colorHex: '#1E40AF',
    font: 'Helvetica',
    previewImage: '/templates/corporate-finance-preview.png',
    styleConfig: {
      ...stylePresets.classic,
      primaryColor: '#1E40AF',
      secondaryColor: '#1E3A8A',
      titleFont: 'Helvetica',
      subtitleFont: 'Helvetica',
      bodyFont: 'Helvetica',
      sectionHeaderFont: 'Helvetica'
    },
    sections: [
      { key: 'title', label: 'Position Title', show: true, order: 1 },
      { key: 'company', label: 'Institution', show: true, order: 2 },
      { key: 'location', label: 'Location', show: true, order: 3 },
      { key: 'description', label: 'Position Summary', show: true, order: 4 },
      { key: 'responsibilities', label: 'Primary Responsibilities', show: true, order: 5 },
      { key: 'requirements', label: 'Qualifications', show: true, order: 6 },
      { key: 'skills', label: 'Required Skills', show: true, order: 7 },
      { key: 'benefits', label: 'Benefits Package', show: true, order: 8 },
      { key: 'salary', label: 'Compensation Range', show: true, order: 9 },
      { key: 'languages', label: 'Language Proficiency', show: true, order: 10 },
    ],
    sampleContent: {
      title: 'Investment Banking Analyst',
      description: 'We are seeking a highly motivated Investment Banking Analyst to join our team. This role offers exposure to complex financial transactions and the opportunity to work with leading corporations.',
      responsibilities: [
        'Conduct financial analysis and modeling',
        'Prepare pitch books and client presentations',
        'Support senior bankers in deal execution',
        'Perform industry and company research',
        'Assist in due diligence processes'
      ],
      requirements: [
        'Bachelor\'s degree in Finance, Economics, or related field',
        'Strong analytical and quantitative skills',
        'Proficiency in Excel and financial modeling',
        'Excellent written and verbal communication',
        'Ability to work under pressure and meet deadlines'
      ],
      benefits: [
        'Competitive base salary and bonus',
        'Comprehensive health insurance',
        'Professional development opportunities',
        'Retirement savings plan',
        'Prestigious career advancement path'
      ]
    }
  },
  {
    id: 'consulting-strategy',
    name: 'Strategy Consulting',
    description: 'Premium template for management consulting and strategy roles',
    category: 'Consulting',
    industry: 'Management Consulting',
    colorHex: '#059669',
    font: 'Times New Roman',
    previewImage: '/templates/consulting-strategy-preview.png',
    styleConfig: {
      ...stylePresets.classic,
      primaryColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#10B981'
    },
    sections: [
      { key: 'title', label: 'Role Title', show: true, order: 1 },
      { key: 'company', label: 'Firm Information', show: true, order: 2 },
      { key: 'location', label: 'Office Location', show: true, order: 3 },
      { key: 'description', label: 'Role Description', show: true, order: 4 },
      { key: 'responsibilities', label: 'Key Responsibilities', show: true, order: 5 },
      { key: 'requirements', label: 'Requirements', show: true, order: 6 },
      { key: 'skills', label: 'Core Competencies', show: true, order: 7 },
      { key: 'benefits', label: 'Career Benefits', show: true, order: 8 },
      { key: 'salary', label: 'Compensation', show: false, order: 9 },
      { key: 'languages', label: 'Language Skills', show: true, order: 10 },
    ],
    sampleContent: {
      title: 'Senior Consultant',
      description: 'Join our world-class consulting team to solve complex business challenges for Fortune 500 clients. This role offers exceptional growth opportunities and exposure to diverse industries.',
      responsibilities: [
        'Lead client engagements and project workstreams',
        'Develop strategic recommendations and solutions',
        'Conduct market research and competitive analysis',
        'Present findings to C-level executives',
        'Mentor junior consultants and analysts'
      ],
      requirements: [
        'MBA from top-tier business school',
        '3+ years of consulting or relevant experience',
        'Strong analytical and problem-solving skills',
        'Excellent presentation and communication abilities',
        'Willingness to travel extensively'
      ],
      benefits: [
        'Highly competitive compensation',
        'Accelerated career progression',
        'Global mobility opportunities',
        'Comprehensive training programs',
        'World-class client exposure'
      ]
    }
  },
  {
    id: 'healthcare-medical',
    name: 'Healthcare & Medical',
    description: 'Specialized template for healthcare and medical professionals',
    category: 'Healthcare',
    industry: 'Healthcare & Life Sciences',
    colorHex: '#DC2626',
    font: 'Open Sans',
    previewImage: '/templates/healthcare-medical-preview.png',
    styleConfig: {
      ...stylePresets.modern,
      primaryColor: '#DC2626',
      secondaryColor: '#EF4444',
      accentColor: '#F87171',
      titleFont: 'Open Sans',
      subtitleFont: 'Open Sans',
      bodyFont: 'Open Sans',
      sectionHeaderFont: 'Open Sans'
    },
    sections: [
      { key: 'title', label: 'Position', show: true, order: 1 },
      { key: 'company', label: 'Healthcare Institution', show: true, order: 2 },
      { key: 'location', label: 'Location', show: true, order: 3 },
      { key: 'description', label: 'Position Overview', show: true, order: 4 },
      { key: 'responsibilities', label: 'Clinical Responsibilities', show: true, order: 5 },
      { key: 'requirements', label: 'Qualifications & Licensing', show: true, order: 6 },
      { key: 'skills', label: 'Clinical Skills', show: true, order: 7 },
      { key: 'benefits', label: 'Benefits & Support', show: true, order: 8 },
      { key: 'salary', label: 'Compensation Package', show: true, order: 9 },
      { key: 'languages', label: 'Language Requirements', show: false, order: 10 },
    ],
    sampleContent: {
      title: 'Senior Clinical Specialist',
      description: 'We are seeking a dedicated healthcare professional to join our clinical team. This role offers the opportunity to make a meaningful impact on patient care while advancing your career.',
      responsibilities: [
        'Provide direct patient care and clinical support',
        'Collaborate with multidisciplinary healthcare teams',
        'Maintain accurate patient records and documentation',
        'Participate in quality improvement initiatives',
        'Mentor junior clinical staff'
      ],
      requirements: [
        'Valid medical license and certifications',
        'Minimum 5 years of clinical experience',
        'Board certification in relevant specialty',
        'Strong clinical assessment skills',
        'Commitment to patient safety and quality care'
      ],
      benefits: [
        'Competitive salary and benefits',
        'Continuing education support',
        'Malpractice insurance coverage',
        'Flexible scheduling options',
        'Career advancement opportunities'
      ]
    }
  },
  {
    id: 'creative-design',
    name: 'Creative & Design',
    description: 'Modern template for creative, design, and marketing roles',
    category: 'Creative',
    industry: 'Design & Marketing',
    colorHex: '#7C3AED',
    font: 'Inter',
    previewImage: '/templates/creative-design-preview.png',
    styleConfig: {
      ...stylePresets.creative,
      primaryColor: '#7C3AED',
      secondaryColor: '#A855F7',
      accentColor: '#EC4899'
    },
    sections: [
      { key: 'title', label: 'Creative Role', show: true, order: 1 },
      { key: 'company', label: 'Agency/Company', show: true, order: 2 },
      { key: 'location', label: 'Studio Location', show: true, order: 3 },
      { key: 'description', label: 'Creative Brief', show: true, order: 4 },
      { key: 'responsibilities', label: 'Creative Responsibilities', show: true, order: 5 },
      { key: 'requirements', label: 'Portfolio Requirements', show: true, order: 6 },
      { key: 'skills', label: 'Creative Skills', show: true, order: 7 },
      { key: 'benefits', label: 'Creative Perks', show: true, order: 8 },
      { key: 'salary', label: 'Compensation', show: false, order: 9 },
      { key: 'languages', label: 'Communication Skills', show: false, order: 10 },
    ],
    sampleContent: {
      title: 'Senior UX Designer',
      description: 'Join our creative team to design exceptional user experiences that delight customers and drive business results. We\'re looking for a passionate designer who thinks beyond pixels.',
      responsibilities: [
        'Design intuitive user interfaces and experiences',
        'Conduct user research and usability testing',
        'Create wireframes, prototypes, and design systems',
        'Collaborate with product and engineering teams',
        'Present design concepts to stakeholders'
      ],
      requirements: [
        'Bachelor\'s degree in Design or related field',
        '4+ years of UX/UI design experience',
        'Strong portfolio demonstrating design process',
        'Proficiency in design tools (Figma, Sketch, etc.)',
        'Understanding of user-centered design principles'
      ],
      benefits: [
        'Creative freedom and autonomy',
        'State-of-the-art design tools',
        'Flexible work arrangements',
        'Professional development budget',
        'Inspiring work environment'
      ]
    }
  },
  {
    id: 'sales-business',
    name: 'Sales & Business Development',
    description: 'Results-driven template for sales and business development positions',
    category: 'Sales',
    industry: 'Sales & Business Development',
    colorHex: '#EA580C',
    font: 'Roboto',
    previewImage: '/templates/sales-business-preview.png',
    styleConfig: {
      ...stylePresets.modern,
      primaryColor: '#EA580C',
      secondaryColor: '#F59E0B',
      accentColor: '#F97316'
    },
    sections: [
      { key: 'title', label: 'Sales Position', show: true, order: 1 },
      { key: 'company', label: 'Company', show: true, order: 2 },
      { key: 'location', label: 'Territory/Location', show: true, order: 3 },
      { key: 'description', label: 'Role Overview', show: true, order: 4 },
      { key: 'responsibilities', label: 'Sales Responsibilities', show: true, order: 5 },
      { key: 'requirements', label: 'Requirements', show: true, order: 6 },
      { key: 'skills', label: 'Sales Skills', show: true, order: 7 },
      { key: 'benefits', label: 'Compensation & Benefits', show: true, order: 8 },
      { key: 'salary', label: 'Base + Commission', show: true, order: 9 },
      { key: 'languages', label: 'Language Skills', show: false, order: 10 },
    ],
    sampleContent: {
      title: 'Senior Sales Executive',
      description: 'Drive revenue growth and build lasting client relationships in this exciting sales role. We\'re looking for a results-oriented professional who thrives in a competitive environment.',
      responsibilities: [
        'Generate new business opportunities and leads',
        'Manage full sales cycle from prospect to close',
        'Build and maintain strong client relationships',
        'Achieve and exceed quarterly sales targets',
        'Collaborate with marketing and product teams'
      ],
      requirements: [
        '5+ years of B2B sales experience',
        'Proven track record of exceeding targets',
        'Strong negotiation and closing skills',
        'Experience with CRM systems',
        'Excellent communication and presentation abilities'
      ],
      benefits: [
        'Competitive base salary plus commission',
        'Uncapped earning potential',
        'Sales incentive trips and bonuses',
        'Professional development opportunities',
        'Comprehensive benefits package'
      ]
    }
  }
];

export const jobTemplateCategories = [
  'All',
  'Professional',
  'Technology',
  'Finance',
  'Consulting',
  'Healthcare',
  'Creative',
  'Sales',
  'Operations',
  'Marketing',
  'Legal',
  'Education'
]; 