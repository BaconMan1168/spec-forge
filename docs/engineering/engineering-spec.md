# SpecForge — Engineering Spec

## Purpose

This document defines the implementation-level architecture for the MVP. It is the primary technical reference for building SpecForge.

## Engineering Goals

- Minimize implementation complexity for a solo or lean team.
- Keep the architecture Claude Code-friendly by reducing file sprawl and unnecessary services.
- Preserve a clean path from user input to AI output to Markdown export.
- Use managed services where possible to reduce operational burden.

## Architecture Overview

SpecForge is a desktop-first web application that allows users to upload or paste customer feedback, analyze it with an AI pipeline, and generate structured feature proposals.

The MVP architecture consists of:

- Next.js application layer
- Supabase-backed auth, database, and file storage
- AI processing layer using Vercel AI SDK
- Parsing layer for supported document types
- Markdown export layer
- Project/session persistence

## Stack Decisions

### Frontend

- **Framework:** Next.js with App Router (latest version)
- **Styling:** Tailwind CSS (latest version)

### Backend

- **Runtime model:** Next.js API routes and/or server actions
- **Separate backend:** none

### Database

- **Database:** Supabase Postgres (latest version)
- **Client:** Supabase JS client (`@supabase/supabase-js`, `@supabase/ssr`)


### Authentication

- **Provider:** Supabase Auth (latest version)
- **Methods:** email/password AND OAuth providers such as Google or GitHub
- **Session handling:** Supabase’s Next.js auth helpers or equivalent recommended package

### Validation
- **Library:** Zod (latest version)
- **Purpose:** runtime schema validation for AI output, API inputs, parsed files, and export data
- **Usage:** input ingestion layer, AI analysis layer, export layer, environment variable validation

### Billing
- **Provider:** Stripe (latest version)
- **Purpose:** handle SaaS subscriptions and payments
- **Integration:** Stripe Checkout + webhook handling
- **Data mapping:** store `stripeCustomerId`, `stripeSubscriptionId`, and `subscriptionStatus` in user records

### AI Layer

- **SDK:** Vercel AI SDK (latest version)
- **Default model:** Anthropic Claude Sonnet 4.5
- **Model configuration:** controlled by environment variable

#### Hard Requirement

The AI model must be swappable through a single environment variable: `AI_MODEL`.

- Default value: `claude-sonnet-4-5`
- The system must continue to work if `AI_MODEL` is changed to another Vercel AI SDK-compatible model string
- No other code changes should be required for a model swap

### File Parsing

- `.pdf`: `pdf-parse`
- `.docx`: `mammoth`
- `.txt`: native Node.js text handling
- pasted text: direct string input

All parsed content must be normalized into plain UTF-8 text before entering the AI pipeline.

### Hosting

- **Application hosting:** Vercel
- **Database/storage/auth:** Supabase

### File Storage

- **Storage provider:** Supabase Storage

Recommended MVP approach:

- store original uploads in Supabase Storage
- store parsed text and metadata in database records
- link stored file objects to the associated project/session records

## Core System Components

### 1. Project Workspace Layer

Responsible for:

- project creation
- project retrieval
- project-level display of feedback and outputs
- re-entry into saved work

### 2. Input Ingestion Layer

Responsible for:

- file upload handling
- pasted text handling
- validation of supported formats
- source labeling requirement enforcement
- passing valid inputs to parsing

### 3. Parsing & Normalization Layer

Responsible for:

- reading uploaded files
- extracting text from `.pdf` and `.docx`
- normalizing text into a consistent plain-text representation
- returning parsing errors without crashing the whole session

### 4. AI Analysis Layer

Responsible for:

- theme synthesis
- quote extraction
- proposal generation
- streaming output when supported
- low-signal detection and response shaping

### 5. Proposal Rendering Layer

Responsible for:

- proposal card rendering
- expanded proposal detail view
- showing synthesis themes and evidence
- keeping UI representation aligned with export representation

### 6. Export Layer

Responsible for:

- generating consistently structured Markdown
- copy-to-clipboard flow
- download-as-`.md` flow
- single-proposal and all-proposal export

### 7. Persistence Layer

Responsible for:

- storing projects
- storing uploaded inputs and metadata
- storing analysis outputs
- storing proposal outputs
- supporting re-run and revisit flows

## Request / Data Flow

### Create Project

1. User creates a project.
2. System creates a project record tied to the authenticated user.
3. User is redirected to the project workspace.

### Upload / Add Inputs

1. User uploads files or pastes text.
2. System validates file types and required source labels.
3. System stores file objects where applicable.
4. System parses supported files into normalized text.
5. System stores input metadata and parsed text.

### Run Analysis

1. User clicks Analyze.
2. System verifies that valid labeled inputs exist.
3. System collects all normalized text for the project/session.
4. System sends text into the AI synthesis stage.
5. System receives structured themes and supporting quotes.
6. System runs proposal generation for each selected/surfaced theme.
7. System stores synthesis and proposal outputs.
8. UI updates with themes, evidence, and proposal cards.

### Export Proposal

1. User chooses one proposal or all proposals.
2. System converts proposal data into Markdown using the export schema.
3. System either copies Markdown to clipboard or returns a downloadable `.md` payload.

## Session Lifecycle

For MVP, project and session behavior can be treated simply:

- a project is the primary user-owned container
- a project contains uploaded inputs and generated outputs
- re-running analysis updates or appends outputs within that project context
- persistence is required so users can return to prior work

If you later distinguish project vs session more strongly, preserve backward compatibility in the data model.

## Error Handling Requirements

The system must gracefully handle:

- unsupported file types
- corrupt/unreadable files
- partial parsing failure
- low-signal input
- no recurring themes found
- AI call failures or timeouts
- export generation failures

Rules:

- do not fail the full run because one file fails
- preserve successfully processed inputs
- show file-specific errors where possible
- warn rather than fabricate when signal is weak

## Privacy & Data Handling Requirements

- Data must remain isolated per user/project.
- No cross-user data access.
- Upload UX should clearly state retention/privacy expectations.
- The product should support deleting data on user request.
- The system should follow basic data-handling best practices aligned with GDPR principles where applicable.
- User data must not be represented as available for model training in product messaging.

## Performance Expectations

- Support up to 10 documents of up to 5,000 words each per session/project.
- Pre-validate input before expensive AI calls.
- Keep median time-to-value low.
- Stream or progressively reveal work when analysis is in progress.
- Optimize repeated prompt cost with prompt caching where applicable.

## Implementation Rules

- Prefer managed services to reduce DevOps overhead.
- Keep the architecture simple enough for a single full-stack engineer.
- Avoid introducing services not justified by MVP requirements.
- Keep AI provider usage abstracted behind the Vercel AI SDK.
- Keep database code aligned to the Supabase schema as the single source of truth.
- Keep output structure deterministic enough that Markdown export and UI rendering do not diverge.

## Explicitly Out of Scope

- Separate Express backend
- Microservice decomposition
- Team workspaces
- Role-based permissions
- Third-party integrations
- Background job orchestration beyond simple MVP needs
- Audio/video transcription pipeline
- Structured analytics ingestion