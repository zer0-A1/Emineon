# Emineon OS (formerly Emineon ATS)

A focused Consulting OS that unifies candidate intelligence, delivery operations, and client collaboration in one product. Built on Next.js with a strong emphasis on data quality, speed, and pragmatic AI.

## What this is

- A single system for consulting workflows: intake, profiles, matching, delivery, feedback, and reporting
- Opinionated design: fast to use, minimal clicks, readable UI, consistent components
- Extensible: clean boundaries, API-first, simple deployment

## Core capabilities

- Candidate intelligence: parsing, profiling, skills taxonomy, language and mobility, documents
- Delivery operations: notes and timeline, communications, assignments to jobs, competence files, document preview
- Matching and search: structured profiles, filters, and planned semantic search
- Admin and controls: authentication, roles, environments, configuration via environment variables

## Features (current)

- Candidate profiles with 80+ user-facing fields grouped by category
- CV and LinkedIn parsing (server endpoint + client orchestrator)
- Multi-step create/edit modal with inline editing in modal and drawer
- Documents: upload, original CV preview, competence file preview
- Communications: email, LinkedIn, WhatsApp quick actions
- Assign to job, create competence file, timelines, notes
- Solid, accessible UI components with Tailwind and lucide-react
- PostgreSQL (Neon) via node-postgres pool; API routes on Next.js App Router
- Authentication via Clerk (can be swapped)

## Quick start

### Prerequisites
- Node.js 18+
- npm or yarn
- Neon (PostgreSQL) connection strings (pooled + unpooled) or another PostgreSQL instance
- Google Cloud SDK (for local ADC) or a service account JSON
- OpenAI API key
- Optional: Clerk (auth) – can be bypassed locally with flags

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app-emineon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` and add:
   ```env
   # Database (Neon)
   DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.neon.tech/neondb?sslmode=require
   DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

   # Authentication (optional in development)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   # Dev bypass
   SKIP_AUTH_CHECK=true
   BYPASS_CLERK=true

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Google Cloud Storage / Document AI
   GCS_BUCKET_NAME=emineon-cv-storage-prod
   USE_GOOGLE_DOCAI=true
   GOOGLE_PROJECT_ID=...
   GOOGLE_LOCATION=eu
   GOOGLE_DOCAI_PROCESSOR_ID=...
   # Local auth for GCP (pick one)
   # GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
   # or run: gcloud auth application-default login

   # Optional integrations
   CLOUDINARY_URL=cloudinary://...   
   BLOB_READ_WRITE_TOKEN=...         # Vercel Blob fallback
   ```

4. **Database Setup**
   - No Prisma. The schema is managed via SQL and is provisioned in Neon.
   - Ensure your Neon project has the expected schema (see `COMPLETE_DATA_MODEL.md`).
   - Local dev can point to Neon directly; no local migrations required.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Architecture

### Tech stack
- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes (Node runtime where needed)
- **Database**: Neon PostgreSQL (pooled + unpooled endpoints) via `pg`
- **Object Storage**: Google Cloud Storage (private buckets, signed URLs)
- **Document AI**: Google Document AI (EU processor) for CV parsing
- **Auth**: Clerk (dev bypass via env flags)
- **AI**: OpenAI Responses API (summaries, parsing assist)
- **UI Components**: Radix UI, Lucide Icons
- **Forms/Validation**: React Hook Form, Zod

### Project structure
```
├── src/
│   ├── app/                    # App Router pages and API routes
│   │   ├── api/               # API endpoints
│   │   ├── candidates/        # Candidate management
│   │   ├── jobs/              # Job management
│   │   └── ...
│   ├── components/            # Reusable UI components
│   ├── lib/                   # DB, storage, services (Neon, GCS, OpenAI)
│   └── types/                 # TypeScript types
└── public/                    # Static assets
```

### Cloud topology
- Runtime/UI: Vercel (Serverless + Edge, with selective Node runtime for APIs)
- Database: Neon (EU-Central; pooled for general queries, unpooled for long-running ops)
- AI Storage/Docs: Google Cloud Storage (private; signed URLs for viewing)
- Parsing: Google Document AI (Processor in `eu` region)
- Optional Blob: Vercel Blob used as fallback when GCS is not configured

### Data flow
1. Candidate created (structured data) persists in Neon
2. CVs and related files upload to GCS under category prefixes (e.g., `cv-uploads/YYYY-MM/*`)
3. Signed URLs are generated for secure inline viewing
4. Document AI extracts text; LLM transforms to structured fields; server validates and stores
5. Candidate UI renders original CV preview + parsed details; drawer/modal consistent across pages

## Deployment

### Vercel deployment (recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard (see below)
   - Deploy automatically

3. **Environment Variables for Vercel**
   Required:
   - Database
     - `DATABASE_URL` (pooled Neon; include `sslmode=require`)
     - `DATABASE_URL_UNPOOLED` (direct Neon)
   - Auth (prod)
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
   - AI
     - `OPENAI_API_KEY`
   - Google Cloud
     - `GCS_BUCKET_NAME`
     - `USE_GOOGLE_DOCAI`
     - `GOOGLE_PROJECT_ID`, `GOOGLE_LOCATION`, `GOOGLE_DOCAI_PROCESSOR_ID`
   - Optional
     - `BLOB_READ_WRITE_TOKEN` (Vercel Blob fallback)
     - `CLOUDINARY_URL` (branding assets)

   Development convenience:
   - `SKIP_AUTH_CHECK=true`
   - `BYPASS_CLERK=true`

   Local Google auth options:
   - ADC login: `gcloud auth application-default login`
   - Or `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

### Manual deployment

1. **Build Production**
   ```bash
   npm run build
   npm start
   ```

2. **Docker Deployment** (Optional)
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

## API endpoints

### Candidates
- `GET /api/candidates` - List all candidates
- `POST /api/candidates` - Create new candidate
- `GET /api/candidates/[id]` - Get candidate details
- `PUT /api/candidates/[id]` - Update candidate
- `DELETE /api/candidates/[id]` - Delete candidate
- `POST /api/candidates/parse-cv` - Parse CV file
- `POST /api/candidates/parse-linkedin` - Parse LinkedIn profile

### AI Features
- `POST /api/ai/job-description` - Generate job description
- `POST /api/ai/candidate-matching` - Match candidates to jobs
- `POST /api/ai/email-template` - Generate email templates

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `GET /api/public/jobs.json` - Public job listings

## Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# E2E tests (Playwright)
npx playwright install

# API tests (exercise DB, GCS, Document AI, OpenAI)
npx playwright test tests/e2e/api-tests.spec.ts --config=playwright.config.no-db.ts

# Candidates UI tests
npx playwright test tests/e2e/specs/candidates.spec.ts

# AI & documents suite (Document AI + GCS flows)
npx playwright test tests/e2e/specs/ai-and-documents.spec.ts --config=playwright.config.no-db.ts
```

## Configuration

### Database schema
The application uses a comprehensive candidate schema (80+ user-facing fields) organized into:
- Personal Information
- Contact Details
- Professional Experience
- Education & Certifications
- Skills & Competencies
- Preferences & Availability
- Documents & References

### Authentication flow
- Production: enforced via Clerk; API and pages require auth unless explicitly public
- Development: bypass with `SKIP_AUTH_CHECK=true` and `BYPASS_CLERK=true`

## Troubleshooting

### Common Issues

1. **Clerk Authentication Error**
   ```
   Missing publishableKey
   ```
   **Solution**: Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env`

2. **Database Connection Error**
   ```
   Can't reach database server
   ```
   **Solution**: Verify `DATABASE_URL`/`DATABASE_URL_UNPOOLED` and Neon project status

3. **Build Warnings**

4. **OpenAI invalid_api_key in dev**
   - Ensure `OPENAI_API_KEY` in `.env.local` is valid (project key or standard key)
   - Restart `npm run dev` after changes

5. **GCS signed URL issues**
   - Bucket must be private; URLs are signed by the server
   - Ensure `GCS_BUCKET_NAME` is set and ADC/credentials are available

6. **Document AI parsing errors**
   - Verify `USE_GOOGLE_DOCAI=true` and processor IDs are correct
   - Confirm ADC is active: `gcloud auth application-default login`

7. **Local schema mismatches (42703)**
   - The code supports both snake_case (prod) and quoted camelCase (some local DBs)
   - Ensure your schema matches `COMPLETE_DATA_MODEL.md` (no Prisma in use)

8. **Port conflicts (3000/3001/3002)**
   - Kill processes: `lsof -ti :3000 :3001 :3002 | xargs kill -9`

## Google Cloud Storage policies (recommended)
- Private bucket (no public ACLs)
- CORS: allow GET from app origin to preview PDFs inline
- Lifecycle rules:
  - Move to Nearline at 30 days, Coldline at 180 days
  - Auto-delete `tmp/` objects after 7 days
  - Noncurrent version deletion after retention
- Object versioning enabled with pruning policy
- Access logging to a dedicated log bucket

## Candidate UI highlights
- Drawer compact width (25vw), push layout; all info expanded by default; tooltips on icons
- Modal full-screen with all 80+ attributes visible without collapses
- Advanced Filters modal wired to backend; preferences persisted to localStorage
- AI one-sentence summaries auto-generated per candidate result

   ```
   Node.js API is used which is not supported in Edge Runtime
   ```
   **Solution**: These are warnings from dependencies and don't affect functionality

## Roadmap

The detailed roadmap with milestones for the next three years is maintained in `docs/ROADMAP.md`.

High level

- Year 1: foundation and data quality; consulting workflows end to end
- Year 2: scale and automation; integrations; advanced matching
- Year 3: ecosystem; marketplace; analytics and benchmarks

## Financial plan

A practical, realistic financial plan with assumptions, cost model, and revenue projections is in `docs/FINANCIAL_PLAN.md`.

## Business development

Our go-to-market and growth plan is in `docs/BUSINESS_DEVELOPMENT.md`. It aligns targets and cadence with the roadmap and financial plan.

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please create an issue in the repository or contact the development team.

---

Built by the Emineon team