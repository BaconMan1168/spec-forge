# SpecForge — Output Specification

## Purpose

This document defines the canonical structure of AI-generated proposal output for both UI rendering and Markdown export.

## Canonical Proposal Structure

Each proposal must contain the following sections in this order:

1. Feature Name
2. Problem Statement
3. User Evidence
4. Suggested UI Changes
5. Suggested Data Model Changes
6. Suggested Workflow Changes
7. Engineering Tasks

## Section Definitions

### 1. Feature Name

A short, descriptive title for the proposal.

Requirements:

- concise
- specific
- readable in both UI card and Markdown export
- scoped to a single feature/opportunity

### 2. Problem Statement

A plain-language description of the user pain or opportunity.

Requirements:

- typically 2–3 sentences
- explain the problem clearly
- grounded in the surfaced theme
- avoid generic fluff

### 3. User Evidence

Direct supporting quotes from uploaded feedback.

Requirements:

- include 3–5 quotes when evidence supports it
- each quote should include source label
- quotes must be verbatim or near-verbatim only when grounded in source material
- if fewer than 3 strong quotes exist, include fewer rather than fabricating more

### 4. Suggested UI Changes

A bullet list of interface-level recommendations.

Requirements:

- concrete
- scoped to the surfaced problem
- avoid implementation detail that belongs in engineering tasks

### 5. Suggested Data Model Changes

A plain-language description of new or modified data structures that may be required.

Requirements:

- describe data implications clearly
- do not require schema syntax in the AI output
- keep this section optional in spirit but present in structure; if none are needed, say so plainly

### 6. Suggested Workflow Changes

A stepwise outline of how the user flow or system process would change.

Requirements:

- written as a concise ordered or stepwise list
- focused on user or system behavior impact
- tightly connected to the feature scope

### 7. Engineering Tasks

A numbered list of discrete implementation tasks.

Requirements:

- atomic
- implementation-oriented
- suitable for handoff to Cursor or Claude Code
- ordered sensibly where possible

## Canonical Markdown Shape

```md
# {Feature Name}

## Problem Statement
{2–3 sentence description}

## User Evidence
- "{Quote 1}" — {Source Label}
- "{Quote 2}" — {Source Label}
- "{Quote 3}" — {Source Label}

## Suggested UI Changes
- ...
- ...

## Suggested Data Model Changes
- ...

## Suggested Workflow Changes
1. ...
2. ...

## Engineering Tasks
1. ...
2. ...
3. ...
```

## Structured Data Shape

If the AI response is first captured in structured form, use a canonical shape equivalent to:

```json
{
  "featureName": "string",
  "problemStatement": "string",
  "userEvidence": [
    {
      "quote": "string",
      "sourceLabel": "string"
    }
  ],
  "suggestedUiChanges": ["string"],
  "suggestedDataModelChanges": ["string"],
  "suggestedWorkflowChanges": ["string"],
  "engineeringTasks": ["string"]
}
```

## Export Rule

Markdown output must remain clean enough to paste directly into Cursor or Claude Code with minimal or no editing.