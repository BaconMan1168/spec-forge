# SpecForge — Post-MVP Roadmap

## Purpose

This document captures intentionally out-of-scope future capabilities so they are preserved without expanding MVP scope.

## Roadmap Principle

Each phase should only be built after the preceding MVP hypothesis has been validated. The roadmap is ordered by priority, not by aspiration.

## Phase 4 — Depth & Quality

Focus: improve the quality and flexibility of the core product after beta feedback.

### Candidate Features

- Proposal editing: allow users to manually edit and refine AI-generated proposals in-app before exporting.
- Proposal rating: allow users to thumbs up/down proposals to improve output quality over time.
- Re-analysis with context: allow users to add a natural-language instruction before analysis, such as “focus on onboarding problems.”
- Improved source weighting: allow users to control how heavily each source type influences synthesis.

### Why This Comes Next

These improvements deepen the usefulness of the existing workflow without expanding the product into integrations or team features too early.

## Phase 5 — Integrations

Focus: speed up downstream handoff once export behavior is validated.

### Candidate Features

- GitHub integration: push generated specs directly as GitHub issues or markdown files into a repo.
- Notion integration: export proposals directly to a Notion page.
- Linear integration: create Linear issues from engineering task breakdowns.
- Jira integration: create Jira tickets from engineering tasks.

### Gating Condition

Only build these after users consistently export Markdown and explicitly ask for faster handoffs.

## Phase 6 — Collaboration

Focus: support teams only after there is evidence the product is not just for solo founders.

### Candidate Features

- Team workspaces
- Shared projects
- Proposal commenting and annotation
- Role-based access such as viewer vs. editor

### Gating Condition

Only build once there is evidence of multi-user/team demand.

## Phase 7 — Expanded Inputs

Focus: increase ingestion breadth only after the text-based workflow is proven.

### Candidate Features

- Audio/video upload with transcription before analysis
- CSV and structured support-ticket imports
- Direct integrations to tools such as Intercom, Typeform, or Slack

### Gating Condition

Only build after users explicitly request broader inputs and the text-only loop is validated.

## Phase 8 — Monetization & Growth Features

Focus: add growth and monetization features once the core product is strong.

### Candidate Features

- Introduce pricing tiers
- Usage analytics dashboard showing recurring themes over time
- API access for programmatic submission and retrieval

### Gating Condition

Only build after clear MVP value and repeat usage are demonstrated.

## Explicitly Out of MVP

The following remain out of MVP unless re-scoped:

- Integrations
- Collaboration features
- Role-based permissions
- Audio/video ingestion
- Structured analytics ingestion
- API access
- In-app proposal editing
- Team workspaces
- Usage analytics dashboard

## Notes for Future Prioritization

When prioritizing post-MVP work, evaluate each candidate against:

- user demand frequency
- effect on export behavior
- effect on retention
- implementation complexity
- risk of bloating the product away from its core promise