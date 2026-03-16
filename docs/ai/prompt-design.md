# SpecForge — Prompt Design

## Purpose

This document defines prompt design principles and baseline prompt templates for the MVP AI workflow.

## Prompt Design Goals

- produce reliable structured outputs
- maximize grounding in user-provided source text
- minimize hallucinated evidence
- keep outputs predictable enough for UI rendering and Markdown export
- keep prompts stable enough to benefit from caching

## Global Prompt Rules

All prompts should enforce the following:

- only use the provided source material
- do not fabricate quotes
- do not invent user pain points not supported by evidence
- prefer precise, scoped outputs
- keep proposal outputs structured and deterministic
- if evidence is insufficient, say so

## Stage 1 — Synthesis Prompt

### Purpose

Analyze all provided feedback inputs and identify recurring themes with evidence.

### Inputs

- normalized feedback text
- source labels
- optional file identifiers

### Required Output Shape

The model should return a structured result containing:

- themes
- frequency signal for each theme
- representative quotes
- source label for each quote

### Example Prompt Template

```text
You are analyzing customer feedback for a product team.

Your job is to identify recurring themes, pain points, and opportunities across the provided feedback.

Rules:
- Only use the provided source text.
- Do not fabricate or embellish quotes.
- Quotes must be verbatim or near-verbatim and clearly attributable to a provided source label.
- Group semantically similar feedback into recurring themes.
- Prefer meaningful recurring pain points over one-off comments.
- If the signal is weak, return an insufficient-signal result instead of forcing themes.

Return a structured result with:
- theme_name
- frequency
- representative_quotes
- source_labels
```

## Stage 2 - Proposal Generation Prompt

### Purpose

Generate one structured product proposal per surfaced theme.

### Inputs

- selected theme
- supporting quotes and evidence
- source labels
- optional project context

### Required Output Shape

The model should return a structured result containing:

- feature name
- problem statement
- user evidence
- suggested UI changes
- suggested data model changes
- suggested workflow changes
- engineering tasks

### Example Prompt Template

```text
You are generating a structured product feature proposal from validated customer feedback.

Use the provided theme and evidence to produce one narrowly scoped proposal.

Rules:
- Only use evidence provided from the source material.
- Do not fabricate quotes or unsupported claims.
- Scope the proposal to a single feature or opportunity.
- Write a concise problem statement in plain language.
- Suggest UI, workflow, and data model changes only if they are justified by the evidence.
- Break engineering work into atomic, implementation-ready steps.
- If the evidence is too weak, say so instead of overreaching.

Return the proposal with these sections:
- Feature Name
- Problem Statement
- User Evidence
- Suggested UI Changes
- Suggested Data Model Changes
- Suggested Workflow Changes
- Engineering Tasks
```

## Prompt Construction Guidance

### Keep System Prompts Stable

Use stable system prompts where possible so caching can reduce cost.

### Separate Stage Logic

Do not overload one prompt with both theme synthesis and proposal generation when a two-stage pipeline is more reliable.

### Prefer Structured Responses

Prefer JSON or other strongly structured output where practical, then convert to UI/export shapes.

### Keep Source Labels Visible

Always pass source labels alongside content or evidence so outputs preserve trust signals.

### Use Explicit Failure Paths

Prompts should explicitly allow:
- insufficient signal
- no recurring themes
- limited confidence
This is better than forcing content.



