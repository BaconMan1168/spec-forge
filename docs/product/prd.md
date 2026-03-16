# SpecForge — MVP PRD

## Document Metadata

- **Owner:** Founder / PM
- **Status:** Draft
- **Version:** v1.0
- **Last Updated:** March 16, 2026
- **Intended Release:** MVP Beta
- **Reviewers / Stakeholders:** Founder, engineering lead, design collaborator

## TL;DR

SpecForge is an AI-native product discovery tool that ingests customer interview transcripts and written feedback, synthesizes insights, and generates structured feature proposals. These proposals are exportable as Markdown for direct use in AI coding tools like Cursor and Claude Code. The MVP targets early-stage founders, PMs, and small engineering teams who want to go from raw discovery input to actionable specs—fast.

## Background / Strategic Context

- Teams already collect large volumes of customer feedback, but synthesizing it into clear product direction is still highly manual and time-consuming.
- Existing workflows often break between discovery and delivery: insights live in notes or docs, while implementation happens elsewhere.
- AI-assisted coding tools increase the value of structured, high-quality product specs that can be handed directly into a build workflow.
- SpecForge’s MVP focuses on a narrow, high-value wedge: turning raw qualitative feedback into evidence-backed, exportable feature proposals.

## Goals

### Business Goals

- Validate the core hypothesis that teams will use AI to synthesize feedback into actionable feature specs.
- Achieve an early retention signal (users returning to upload and analyze new feedback at least one additional time).
- Establish MVP as the go-to artifact layer connecting product discovery with AI-assisted development.
- Reach a 30%+ week-2 retention rate during early access.

### User Goals

- Minimize time from raw feedback to clear, structured feature proposals.
- Surface patterns and themes across varied feedback sources such as interviews, support tickets, surveys, and Slack.
- Eliminate manual synthesis work by producing editor-ready Markdown output.
- Enable confident, evidence-backed product decisions.

### Non-Goals

- Ingestion of structured usage analytics or data such as CSVs or event logs.
- Third-party integrations such as Jira, GitHub, Notion, or roadmap tools.
- Team collaboration features, workflow orchestration, or full end-to-end product lifecycle management.
- Audio/video ingestion, API-based ingestion, or external data sync in MVP.

## Assumptions

- Users are more likely to trust AI-generated synthesis when direct customer quotes are shown as evidence.
- Markdown export is the primary value realization moment for early users.
- Requiring source labels adds mild friction but improves output quality enough to justify it.
- Early users are willing to upload raw customer feedback if privacy expectations are clearly communicated.

## Dependencies

- Reliable parsing for `.txt`, `.pdf`, and `.docx` files.
- Stable authentication, storage, and database infrastructure.
- LLM latency and output quality remain within acceptable MVP thresholds.
- Clear privacy and data-retention messaging is in place before beta usage.

## Constraints

- Desktop web app only for MVP; no mobile experience required.
- Maximum supported session size is 10 documents of up to 5,000 words each.
- Supported inputs are limited to `.txt`, `.pdf`, `.docx`, and pasted text.
- No third-party integrations in MVP.
- No collaboration, shared workspaces, or role-based permissions in MVP.
- No structured analytics, CSV ingestion, audio/video upload, or API-based ingestion in MVP.

## User Stories

### Startup Founder — “What should we build next?”

- As a founder, I want to upload a batch of customer interview transcripts, so that I can get a prioritized feature proposal to share with my engineering team.
- As a founder, I want to label each feedback file by source such as interview or support ticket, so that the AI can weigh insights appropriately.
- As a founder, I want to see specific customer quotes linked to proposed features, so that I can feel confident about the recommendations.
- As a founder, I want to export feature proposals in Markdown format, so that I can share or use them in Cursor or Claude Code immediately.

### Product Manager — “Synthesize feedback at scale”

- As a product manager, I want to upload survey responses and support tickets, so that I can quickly find recurring pain points.
- As a product manager, I want to synthesize disparate feedback sources into one unified summary, so that our team can align on what matters.
- As a product manager, I want AI-generated feature proposals to include a clear problem statement, supporting evidence, and next steps.
- As a product manager, I want to revisit a project session after new feedback comes in, so that our feature pipeline stays current.

### Solo Engineer / Technical Founder — “Skip manual PM work”

- As a solo engineer, I want to paste raw feedback text and immediately receive a spec ready to paste into Cursor or Claude Code, so that I can move from discovery to delivery without bottlenecks.
- As a solo engineer, I want proposals broken down into atomic, AI-executable engineering tasks.
- As a solo engineer, I want the system to gracefully handle short or low-signal inputs, so that I can get value even when user feedback is sparse.

## Functional Requirements

### Feedback Ingestion (P0)

- Support multi-file upload for `.txt`, `.pdf`, and `.docx`.
- Allow users to paste unstructured text directly into the interface.
- Require each upload or pasted input to be tagged with a source type such as interview, support ticket, survey, or Slack.
- Enable ingestion of multiple files and sources in a single run.

### AI Analysis Engine (P0)

- Analyze all uploaded inputs to identify recurring themes, pain points, and opportunities.
- Surface direct customer quotes as supporting evidence for each insight.
- Group similar feedback items and quantify theme frequency.

### Feature Proposal Generation (P0)

- Generate proposals per opportunity that include:
  - problem statement
  - supporting evidence
  - suggested UI changes
  - suggested data model changes
  - suggested workflow changes
  - engineering tasks
- Render each proposal as a card expandable to full detail.

### Markdown Export (P0)

- Allow export of a single proposal or all proposals as Markdown.
- Support both copy-in-app and download-as-`.md` flows.
- Preserve proposal structure in a format suitable for AI coding tools.

### Session / Project Management (P1)

- Save uploaded feedback and generated proposals under discrete project sessions.
- Allow users to re-run analysis after adding more feedback to a session.
- Allow users to revisit prior project sessions and view saved results.

## Acceptance Criteria

### Feedback Ingestion

- Users can upload `.txt`, `.pdf`, and `.docx` files successfully.
- Users can paste raw text directly into the product.
- Every uploaded or pasted input must have a source label before analysis can begin.
- Users can include multiple files and source types in a single analysis session.
- Unsupported file types show a clear validation error.

### AI Analysis Engine

- The system identifies recurring themes across uploaded inputs.
- Each surfaced theme includes supporting evidence from source material.
- The system provides meaningful output when signal is sufficient and a low-signal warning when it is not.
- Theme frequency is displayed in a user-readable format.

### Feature Proposal Generation

- The system generates at least one structured proposal when sufficient signal is present.
- Each proposal includes a problem statement, evidence, suggested changes, and engineering tasks.
- Proposal cards are expandable and readable in-app.

### Markdown Export

- Users can copy a single proposal as Markdown.
- Users can download a single proposal as a `.md` file.
- Users can export all proposals as Markdown.
- Exported Markdown preserves section hierarchy and readability.

### Session / Project Management

- Users can save project sessions with uploaded inputs and generated outputs.
- Users can return to an existing session and view prior results.
- Users can re-run analysis after adding new feedback to an existing session.

## User Experience

### Entry Point & First-Time User Experience

- Users access the MVP via a simple desktop web app.
- No formal onboarding.
- Users land on a minimal dashboard with a clear CTA to create a new project.
- Project creation prompts for a project name.
- Empty state instructions explain the core loop: upload feedback, label source, analyze.

### Core Experience

1. User creates and names a new project.
2. User uploads files or pastes text.
3. Each input requires a source-type label.
4. User clicks Analyze.
5. The system shows progress and/or streaming output.
6. The user reviews a synthesis panel showing themes, frequency, and evidence quotes.
7. The user opens expandable proposal cards with structured proposal sections.
8. The user copies or downloads one or more proposals as Markdown.

### UI/UX Highlights

- Minimal navigation: dashboard, project, analysis/results.
- Expandable proposal cards.
- Sticky export actions for Markdown.
- Responsive perceived performance with skeleton states or streaming feedback.
- Accessible design with high contrast, large click targets, and keyboard navigation.
- Consistent visual hierarchy in exported Markdown.

## Narrative

Sarah, a solo founder building a B2B SaaS product, is three months in. She’s interviewed a dozen customers and collected a batch of support tickets, but she feels she’s chasing the wrong problems. Overwhelmed, Sarah spends her weekend trying to synthesize this feedback manually—reading, highlighting, searching for themes—but ends up with more questions than answers.

On Monday, she discovers SpecForge. She creates a new project in seconds, uploads her interview transcripts and tickets, labels their source, and clicks Analyze. Within moments, clear themes emerge, each backed by direct customer quotes. The top insight points to a workflow problem that users repeatedly mention.

The tool generates a feature proposal that explains the problem, cites real evidence from users, outlines suggested changes, and produces an engineering task breakdown ready for AI coding agents. She exports the spec in Markdown and pastes it into Claude Code. For the first time, product discovery and AI-driven delivery feel seamlessly connected.

## Edge Cases & Expected System Behavior

- **No feedback uploaded:** Show an empty state with guidance to upload files or paste text.
- **Unsupported file type:** Reject the file and show a clear validation error.
- **Corrupt or unreadable file:** Show a file-specific parsing error and allow the user to continue with other valid inputs.
- **Inputs too short or low-signal:** Warn the user that the system may not generate meaningful synthesis and suggest adding more detail or more files.
- **No clear recurring themes found:** Return an insufficient-signal state instead of forcing weak proposals.
- **Long-running analysis:** Show progress indication or streaming feedback so the user understands work is in progress.
- **Partial processing failure:** Preserve successfully processed files and communicate which inputs failed.

## Success Metrics

### User-Centric Metrics

- **Proposal Export Rate:** % of sessions where at least one proposal is exported as Markdown. Target: >40%.
- **Time to Value:** Median time from first feedback upload to proposal export. Target: <10 minutes.
- **Qualitative User Satisfaction:** Mean proposal quality score in user interviews. Target: >4 out of 5.

### Business Metrics

- **Projects per User:** Average number of project sessions created per user in 30 days.
- **Week-2 Return Rate:** % of users who return to create/upload more feedback within 14 days. Target: >30%.

### Technical Metrics

- **AI Analysis Latency:** 95th percentile time from Analyze click to first proposal output. Target: <30 seconds for 10 or fewer documents.
- **Export Success Rate:** % of successful Markdown exports. Target: >99% with zero data loss.

### Tracking Plan

- Project session created
- Feedback uploaded
- AI analysis triggered
- Insight viewed
- Proposal expanded
- Proposal exported
- Copy-to-clipboard clicked

## Quality Risks & Evaluation

- **Quote Accuracy:** Supporting evidence must be grounded in uploaded source material.
- **Theme Relevance:** Surfaced themes should reflect meaningful recurring pain points rather than noise.
- **Proposal Usefulness:** Generated proposals should be actionable enough to export, share, or build from.
- **Low-Signal Handling:** The system should warn instead of overconfidently generating weak output.

## Implementation Constraints

- MVP will be delivered as a desktop web application.
- Managed authentication, storage, and database services are preferred to minimize implementation overhead.
- The AI model provider must be configurable without requiring application code changes.
- The system must support streaming or progressive feedback during analysis.
- Parsing must support `.txt`, `.pdf`, `.docx`, and pasted text inputs.
- Session persistence is included, but collaboration and integrations are out of scope.

## Data Inputs

### Supported Input Types

- Customer interview transcripts (`.txt`, `.pdf`, `.docx`, pasted text)
- Written customer feedback such as support tickets, surveys, Slack exports, and NPS comments as unstructured text

### Source Labeling

- Mandatory user-provided tag per upload such as Interview or Survey

### Excluded in MVP

- Video or audio
- Structured CSV
- Product usage analytics
- CRM data
- Direct API-based ingestion

## Feature Proposal Output

Every proposal must include:

- **Feature Name**
- **Problem Statement**
- **User Evidence**
- **Suggested UI Changes**
- **Suggested Data Model Changes**
- **Suggested Workflow Changes**
- **Engineering Tasks**

## Open Questions

- Should proposals be automatically prioritized or simply listed in MVP?
- What exact threshold should trigger the insufficient-signal state?
- Should users be able to edit proposals before export in MVP, or should that remain post-MVP?
- Should theme frequency be shown as raw count, weighted count, or another simpler signal?

## Milestones & Sequencing

### Project Estimate

- Medium: 2–4 weeks from kickoff to functional MVP

### Team Size & Composition

- Lean team: 2–3 people
  - 1 full-stack engineer
  - 1 founder/PM
  - Optional 1 part-time engineer for UI/UX polish sprint

### Suggested Phases

#### Phase 1 — Core Loop (Week 1–2)

- Feedback ingestion
- AI synthesis and proposal generation
- Structured proposal output and cards
- Basic project/session UI

#### Phase 2 — Export & Polish (Week 3)

- In-app Markdown export
- Streaming AI output
- Basic persistence
- Empty-state and error-handling polish

#### Phase 3 — Validation (Week 4)

- Early access to 10–20 beta users
- Instrument tracking
- Structured user interviews
- Iterative refinements to proposal quality and UX

## Related Documents

- `/docs/product/user-flows.md`
- `/docs/product/post-mvp-roadmap.md`
- `/docs/engineering/engineering-spec.md`
- `/docs/engineering/repo-structure.md`
- `/docs/engineering/data-model.md`
- `/docs/ai/ai-system-spec.md`
- `/docs/ai/prompt-design.md`
- `/docs/ai/output-spec.md`
- `/docs/ai/eval-plan.md`
- `/docs/operations/operations.md`
- `/docs/go-to-market/beta-launch-plan.md`
- `/docs/business/pricing-monetization.md`
- `/docs/business/cost-model.md`