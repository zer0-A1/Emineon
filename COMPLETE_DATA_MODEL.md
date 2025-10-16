# Complete Emineon ATS Data Model

## ✅ Candidate Fields - FULLY IMPLEMENTED

### 📋 Basic Information
- ✅ `firstName` / `first_name` - First name
- ✅ `lastName` / `last_name` - Last name  
- ✅ `email` - Email address (unique)
- ✅ `phone` - Phone number

### 💼 Professional Profile
- ✅ `currentTitle` / `current_title` - Current job title
- ✅ `professionalHeadline` / `professional_headline` - Professional tagline
- ✅ `currentLocation` / `current_location` - Current location
- ✅ `summary` - Professional summary
- ✅ `experienceYears` / `experience_years` - Years of experience (integer)
- ✅ `seniorityLevel` / `seniority_level` - Enum: JUNIOR, MID_LEVEL, SENIOR, LEAD, C_LEVEL

### 🛠 Skills & Expertise (6 Categories)
- ✅ `technicalSkills` / `technical_skills` - Array of technical skills
- ✅ `softSkills` / `soft_skills` - Array of soft skills
- ✅ `programmingLanguages` / `programming_languages` - Array of programming languages
- ✅ `frameworks` - Array of frameworks
- ✅ `toolsAndPlatforms` / `tools_and_platforms` - Array of tools & platforms
- ✅ `methodologies` - Array of methodologies

### 🎓 Education
- ✅ `educationLevel` / `education_level` - Enum: HIGH_SCHOOL, BACHELORS, MASTERS, PHD, OTHER
- ✅ `universities` - Array of universities attended
- ✅ `degrees` - Array of degrees earned
- ✅ `graduationYear` / `graduation_year` - Year of graduation (integer)
- ✅ `certifications` - Array of certifications

### 💰 Work Preferences
- ✅ `expectedSalary` / `expected_salary` - Expected salary range
- ✅ `preferredContractType` / `preferred_contract_type` - Enum: FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP, TEMPORARY
- ✅ `freelancer` - Boolean for freelancer status
- ✅ `remotePreference` / `remote_preference` - Enum: ON_SITE, HYBRID, REMOTE
- ✅ `relocationWillingness` / `relocation_willingness` - Boolean
- ✅ `mobilityCountries` / `mobility_countries` - Array of countries willing to work in
- ✅ `mobilityCities` / `mobility_cities` - Array of cities willing to work in
- ✅ `workPermitType` / `work_permit_type` - Work permit status
- ✅ `availableFrom` / `available_from` - Date when available to start
- ✅ `noticePeriod` / `notice_period` - Notice period required

### 🏢 Industry & Experience
- ✅ `primaryIndustry` / `primary_industry` - Primary industry experience
- ✅ `functionalDomain` / `functional_domain` - Functional area of expertise
- ✅ `companies` - JSONB with company history (current, previous, positions)
- ✅ `notableProjects` / `notable_projects` - Array of notable projects

### 🌍 Personal Details
- ✅ `nationality` - Nationality
- ✅ `spokenLanguages` / `spoken_languages` - Array of languages spoken
- ✅ `timezone` - Timezone
- ✅ `address` - Physical address
- ✅ `dateOfBirth` / `date_of_birth` - Date of birth

### 🔗 Online Presence
- ✅ `linkedinUrl` / `linkedin_url` - LinkedIn profile URL
- ✅ `githubUrl` / `github_url` - GitHub profile URL
- ✅ `portfolioUrl` / `portfolio_url` - Portfolio website URL
- ✅ `videoInterviewUrl` / `video_interview_url` - Video interview URL
- ✅ `personalWebsite` / `personal_website` - Personal website URL

### 📝 Notes & Metadata
- ✅ `recruiterNotes` / `recruiter_notes` - Array of recruiter notes
- ✅ `motivationalFitNotes` / `motivational_fit_notes` - Motivational fit assessment
- ✅ `culturalFitScore` / `cultural_fit_score` - Cultural fit score (0-100)
- ✅ `tags` - Array of tags for categorization
- ✅ `source` - Source of the candidate (LinkedIn, Referral, etc.)
- ✅ `sourceDetails` / `source_details` - JSONB with detailed source information
- ✅ `referees` - JSONB with reference information
- ✅ `referencesChecked` / `references_checked` - Boolean

### 📄 Document Content
- ✅ `originalCvUrl` / `original_cv_url` - URL to uploaded CV
- ✅ `originalCvFileName` / `original_cv_file_name` - Original CV filename
- ✅ `originalCvUploadedAt` / `original_cv_uploaded_at` - CV upload timestamp
- ✅ `competenceFileUrl` / `competence_file_url` - URL to competence file
- ✅ `competenceFileUploadedAt` / `competence_file_uploaded_at` - Competence file upload timestamp

### 🎥 Video Content
- ✅ `videoTitle` / `video_title` - Video title
- ✅ `videoDescription` / `video_description` - Video description
- ✅ `videoUrl` / `video_url` - Video URL
- ✅ `videoThumbnailUrl` / `video_thumbnail_url` - Video thumbnail URL
- ✅ `videoDuration` / `video_duration` - Video duration in seconds
- ✅ `videoUploadedAt` / `video_uploaded_at` - Video upload timestamp
- ✅ `videoStatus` / `video_status` - Enum: PROCESSING, READY, FAILED

### 🔍 AI & Matching
- ✅ `matchingScore` / `matching_score` - AI matching score (0-100)
- ✅ `interviewScores` / `interview_scores` - JSONB with interview scores
- ✅ `embedding` - Vector(1536) for semantic search

### 👥 Client Visibility
- ✅ `clientVisible` / `client_visible` - Boolean for client visibility
- ✅ `shareWithClient` / `share_with_client` - Boolean for sharing permission
- ✅ `clientRating` / `client_rating` - Client rating (1-5)

### 🔒 Background & Compliance
- ✅ `backgroundCheckStatus` / `background_check_status` - Background check status
- ✅ `backgroundCheckDate` / `background_check_date` - Background check date
- ✅ `gdprConsent` / `gdpr_consent` - GDPR consent boolean
- ✅ `gdprConsentDate` / `gdpr_consent_date` - GDPR consent timestamp

### 📊 Status & System Fields
- ✅ `status` - General status (active, inactive)
- ✅ `conversionStatus` / `conversion_status` - Enum: NEW, ACTIVE, PASSIVE, DO_NOT_CONTACT, BLACKLISTED
- ✅ `archived` - Boolean for soft delete
- ✅ `createdBy` / `created_by` - User ID who created the record
- ✅ `createdAt` / `created_at` - Creation timestamp
- ✅ `updatedAt` / `updated_at` - Last update timestamp

## Database Schema Summary

### Tables Created (23 total)
1. ✅ `candidates` - Complete with ALL fields
2. ✅ `jobs` - Complete job postings
3. ✅ `applications` - Candidate-job relationships
4. ✅ `interviews` - Interview scheduling and tracking
5. ✅ `users` - System users with roles
6. ✅ `clients` - Client organizations
7. ✅ `projects` - Client projects
8. ✅ `competence_files` - Generated competence documents
9. ✅ `uploaded_files` - All file uploads
10. ✅ `email_templates` - Email templates
11. ✅ `messages` - Email/SMS tracking
12. ✅ `notifications` - In-app notifications
13. ✅ `talent_pools` - Candidate groupings
14. ✅ `talent_pool_candidates` - Pool memberships
15. ✅ `search_history` - User search history
16. ✅ `saved_searches` - Saved search criteria
17. ✅ `project_activities` - Activity logs
18. ✅ `client_comments` - Client feedback
19. ✅ `ai_matches` - AI matching results
20. ✅ `ai_assessments` - AI evaluations
21. ✅ `audit_logs` - System audit trail
22. ✅ `user_permissions` - Granular permissions
23. ✅ `settings` - Global settings

### Enums Created (19 total)
- ✅ `candidate_status`
- ✅ `seniority_level`
- ✅ `remote_preference`
- ✅ `job_status`
- ✅ `job_close_outcome`
- ✅ `urgency_level`
- ✅ `application_status`
- ✅ `activity_type`
- ✅ `project_status`
- ✅ `education_level`
- ✅ `contract_type`
- ✅ `notification_type`
- ✅ `notification_status`
- ✅ `file_type`
- ✅ `template_type`
- ✅ `message_status`
- ✅ `video_status`
- ✅ `search_type`
- ✅ `user_role`
- ✅ `permission_type`

### Features Implemented
- ✅ Full-text search with pg_trgm
- ✅ Vector search with pgvector (1536 dimensions)
- ✅ Automatic updated_at triggers
- ✅ JSONB for flexible data (companies, referees, etc.)
- ✅ Array fields for multi-value attributes
- ✅ Proper foreign key constraints
- ✅ Comprehensive indexes for performance
- ✅ GDPR compliance fields
- ✅ Client visibility controls
- ✅ Background check tracking

## Testing the API

### Create a Candidate (with all fields)
```bash
curl -X POST http://localhost:3002/api/candidates \
  -H "Content-Type: application/json" \
  -d @candidate-full.json
```

### Get All Candidates
```bash
curl http://localhost:3002/api/candidates
```

### Search Candidates
```bash
# Text search
curl "http://localhost:3002/api/candidates?search=python"

# Vector search (semantic)
curl "http://localhost:3002/api/candidates/vector-search?q=experienced%20data%20engineer%20with%20ML%20skills"
```

## Next Steps
1. ✅ Database schema complete
2. ✅ API endpoints working
3. ✅ All fields properly mapped
4. 🔄 Implement file upload for CVs and competence files
5. 🔄 Set up automatic embedding generation
6. 🔄 Implement the frontend forms with all fields
