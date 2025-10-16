# Emineon OS — Detailed Roadmap and Backlog

This document expands the executive roadmap into concrete milestones, features, user stories, acceptance criteria, status, and priorities. It is a living plan aligned with the high‑level roadmap in `docs/ROADMAP.md`.

## Status Legend
- Ready: implemented and in production
- In progress: actively being built or verified
- Planned: scheduled and scoped
- Critical: items that unblock core workflows, stability, or investor demos

## Milestones by Quarter

| Period | Objective | Key Deliverables | Status |
|---|---|---|---|
| Q4 2025 | Foundation and first external demos | Candidate OS v1 (all fields visible/editable), CV/LinkedIn parsing v1, documents upload/preview, communications timeline and quick actions, assign to job, performance and observability, Vercel + managed Postgres deployment | In progress |
| Q1 2026 | Launch and polishing | Inline editing everywhere, competence file generation UX, drawer parity with modal, investor demo copilot (canned + docs ingestion), docs site and public roadmap | In progress |
| Q2 2026 | Growth and onboarding | Guided onboarding, saved searches and presets, improved permissions and sharing, reliability hardening | Planned |
| Q3 2026 | Automation | Outreach and follow‑up templates, bulk operations with safeguards, structured review flows | Planned |
| Q4 2026 | Matching v2 | Hybrid + vector search across candidates and jobs, explainable ranking, enrichment hooks | Planned |
| 2027 | Integrations | Email, calendar, storage, selective CRM/HRIS touchpoints with sync policies | Planned |
| 2028 | Ecosystem | Plugin interface and curated marketplace, enterprise rollouts (multi‑office/brand) | Planned |
| 2029–2031 | Analytics and benchmarks | Delivery metrics (throughput, cycle time), analytics packages, opt‑in benchmarks | Planned |

## Feature Map and Readiness

| Area | Feature | Description | Status | Critical |
|---|---|---|---|---|
| Profiles | Candidate OS v1 | 80+ user‑facing fields, category tabs, Emineon UI, read/write everywhere (modal + drawer) | In progress | Yes |
| Parsing | CV parsing v1 | Upload CV, server parsing, structured fields | In progress | Yes |
| Parsing | LinkedIn parsing v1 | URL ingest, profile extraction | In progress | Yes |
| Documents | Upload and preview | Original CV and competence file preview, document store | In progress | Yes |
| Operations | Communications timeline | List with inbound/outbound, quick actions (email, LinkedIn, WhatsApp) | In progress | Yes |
| Assignments | Assign candidate to job | Create application, track status | In progress | Yes |
| Matching | Structured search v1 | Filterable search across profiles | Ready | Yes |
| Matching | Matching v2 | Hybrid + vector with explainable ranking | Planned | Yes |
| Copilot | Canned investor FAQs | Pre‑programmed, structured responses + pills | Ready | Yes |
| Copilot | Knowledge ingestion | Docs ingestion endpoint, hybrid search over docs | Ready | Medium |
| Onboarding | Guided setup | 2‑hour checklist, data import, presets | Planned | Medium |
| Automation | Templates and bulk ops | Outreach/follow‑ups, guarded bulk changes | Planned | Medium |
| Integrations | Email/calendar/storage | Lightweight hooks and sync policies | Planned | Medium |
| Ecosystem | Plugin interface | Curated marketplace for add‑ons | Planned | Medium |
| Analytics | Delivery metrics and benchmarks | Throughput, cycle time, opt‑in cross‑client benchmarks | Planned | Medium |

## User Stories and Acceptance Criteria (Initial)

### Profiles
- As a delivery manager, I can view and edit all candidate fields grouped by category so I can assess and correct data quickly.
  - Acceptance: every field in the model is visible; array fields render as readable pills; edit mode persists changes; no missing categories.
- As a recruiter, I can inline edit any field in the modal or drawer without navigating away.
  - Acceptance: toggling edit reveals inputs; save updates; cancel restores; validations on type/format.

### Parsing and Documents
- As a recruiter, I can upload a CV (PDF/DOCX/TXT/HTML/MD/PNG/JPEG/WEBP) and get parsed fields mapped correctly.
  - Acceptance: supported file types accepted; server returns fields; failures show actionable errors; original CV preview is available.
- As a consultant, I can paste a LinkedIn URL and fetch a structured profile for review.
  - Acceptance: URL validation; extracted fields populate profile; manual corrections persist.
- As a user, I can generate and preview a competence file.
  - Acceptance: preview loads; exports are consistent; links work.

### Operations and Assignments
- As a delivery manager, I can view communications and act (email, LinkedIn, WhatsApp) from the candidate/profile context.
  - Acceptance: timeline entries render; direction tags; quick actions open correct handlers.
- As a recruiter, I can assign a candidate to a job and track the resulting application.
  - Acceptance: application created; status visible; errors surfaced clearly.

### Matching and Search
- As a user, I can run structured searches to filter candidates by skills, location, experience, and availability.
  - Acceptance: filter combinations return results within acceptable latency; empty states are clear.
- As a user, I can ask the copilot to find matches from a JD or profile.
  - Acceptance: structured response listing candidates with rationale; links to details; ability to refine.

### Copilot and Documentation
- As an investor or prospect, I can ask for roadmap, pricing, market, and team plans and receive a structured, complete answer without emojis.
  - Acceptance: responses include headings and bullets; pills appear for quick topic follow‑ups; backed by docs ingestion.

## Risks and Dependencies
- Data quality and parsing correctness require continuous tuning and validation at scale.
- Vector search costs must be bounded; use hybrid strategies and caching.
- Integrations must avoid vendor lock‑in; rely on simple hooks where possible.

## Non‑Goals (Now)
- Full custom workflow builder. Keep scope tight and opinionated.
- Heavy analytics warehouse. Start with focused delivery metrics, expand later.

## How We Track
- Monthly: pipeline and financial dashboard review
- Quarterly: re‑baseline roadmap by evidence; update this document accordingly

---

Source of truth for high‑level goals: `docs/ROADMAP.md`. This file is the working plan used for execution.

## Pages & API Audit (initial pass)

UI Pages

| Path | Purpose | Status | Priority |
|---|---|---|---|
| / | Home redirect and quick handoff to copilot | Ready (build OK), needs runtime QA | High |
| /dashboard | Overview widgets and navigation | Ready (build OK), needs runtime QA | High |
| /candidates | Candidate list, filters, actions | In progress (new list client in repo), needs end‑to‑end QA | Critical |
| /candidates/[id] | Candidate detail and actions | In progress, verify edit and docs preview | Critical |
| /jobs | Job list and kanban | In progress, verify create/close/assign flows | High |
| /jobs/[id] | Job detail with candidates and actions | In progress, verify pipeline and status updates | High |
| /clients | Client list and basic profile/drawers | In progress | Medium |
| /projects | Project tracker (lightweight) | In progress | Medium |
| /competence-files | Competence file workspace | In progress, verify generate/preview | Critical |
| /assessments | Assessments management | Planned (API present), UI thin | Medium |
| /assignments | Assignments overview | In progress | Medium |
| /analytics | KPIs (early) | Planned (skeleton) | Medium |
| /reports | Reports (skeleton) | Planned | Medium |
| /notes | Notes hub | In progress | Medium |
| /user | User profile | In progress | Low |
| /workflows | Workflow stubs | Planned | Low |
| /video-interviews | Video interviews stubs | Planned | Low |
| /(dashboard)/ai-copilot | Copilot chat with roadmap FAQ pills | Ready (canned + structured) | Critical |
| /ai-tools | Tools index | Ready | Low |
| /ai-tools/content-generator | Content generator | Ready | Low |
| /insights | Insights stub | Planned | Low |
| /admin/portal-manager | Admin portal | In progress | Medium |
| /apply/[jobId] | Public apply flow | Ready (build OK), needs runtime QA | High |
| /sign-in, /sign-up | Auth pages | Ready | High |
| /unauthorized | Guard page | Ready | High |

Key APIs (representative)

| Route | Purpose | Status | Priority |
|---|---|---|---|
| /api/candidates (CRUD, search) | Core candidates API | In progress (Neon/pg paths live) | Critical |
| /api/candidates/parse-cv, /parse-linkedin | Parsing endpoints | In progress | Critical |
| /api/candidates/vector-search | Vector search | Ready (hybrid/vector backends) | High |
| /api/jobs (CRUD) | Jobs management | In progress | High |
| /api/competence-files/* | Generate/preview/download | In progress | Critical |
| /api/ai-copilot/chat, /stream | Copilot chat & streaming | Ready (canned + structured policy) | Critical |
| /api/knowledge/ingest, /search | Docs ingestion and search | Ready | High |
| /api/ai/search (hybrid) | App-wide hybrid search | Ready | High |
| /api/clients/*, /projects/* | Client/project ops | In progress | Medium |
| /api/assessments/* | Assessments | Planned | Medium |

Gaps and improvements (initial)

- Candidates and jobs: complete end‑to‑end QA on create/edit/assign/close; add optimistic updates and error handling.
- Competence files: finalize structured generate flow, consistent preview, and export.
- Parsing: add robust error surfacing and field mapping audits on a set of golden CVs and LinkedIn profiles.
- Copilot: keep answers in sync with docs; add context‑aware links into app screens where relevant.
- Onboarding: add guided checklist and presets; improve saved searches and permissioned sharing.

Action items

- Expand e2e coverage for candidates, jobs, competence files, parsing, and copilot FAQ flows.
- Track issues per gap with owner and estimate; link from this document.
- Re-baseline statuses after QA and update the priority flags accordingly.
