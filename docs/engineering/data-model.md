# `/docs/engineering/data-model.md`

# SpecForge — Data Model

## Purpose

This document defines the MVP data model and the responsibilities of each entity. Supabase migrations should implement this model.

## Modeling Principles

- Keep the MVP data model minimal.
- Persist the data required for revisit, re-run, and export.
- Separate user-owned containers from generated outputs.
- Preserve enough structure to support UI rendering and Markdown export.

## Core Entities

## User

### Description

Authenticated user account managed primarily by Supabase Auth.

### Fields

- `id`
- `email`
- `createdAt`
- `updatedAt`

### Notes

- Auth is handled by Supabase Auth.
- Application tables should reference the auth user ID.

## Project

### Description

Primary user-owned container for a SpecForge workspace.

### Fields

- `id`
- `userId`
- `name`
- `createdAt`
- `updatedAt`

### Relationships

- belongs to one `User`
- has many `FeedbackFile`
- has many `Insight`
- has many `Proposal`

### Notes

Projects are the main object users create and return to.

## FeedbackFile

### Description

A single uploaded or pasted feedback input associated with a project.

### Fields

- `id`
- `projectId`
- `fileName`
- `sourceType`
- `content`
- `storageUrl` (nullable for pasted text)
- `mimeType` (nullable)
- `inputMethod` (`upload` or `paste`)
- `wordCount` (nullable)
- `createdAt`

### Relationships

- belongs to one `Project`

### Notes

- `content` stores normalized text used by the AI pipeline.
- `storageUrl` points to the original uploaded file in Supabase Storage when applicable.
- pasted inputs may not have a file object.

## Insight

### Description

A surfaced theme or recurring pain point generated from project inputs.

### Fields

- `id`
- `projectId`
- `themeName`
- `frequency`
- `quotes`
- `createdAt`

### Relationships

- belongs to one `Project`

### Notes

- `quotes` may be stored as JSON if multiple quotes are preserved.
- `frequency` should be a simple user-readable signal in MVP.
- If multiple analysis runs are retained later, add run/session linkage.

## Proposal

### Description

A structured feature proposal generated from an insight or opportunity area.

### Fields

- `id`
- `projectId`
- `featureName`
- `problemStatement`
- `evidence`
- `uiChanges`
- `dataModelChanges`
- `workflowChanges`
- `engineeringTasks`
- `createdAt`

### Relationships

- belongs to one `Project`

### Notes

- multi-part structured fields may be stored as JSON or text depending on implementation choice
- the persisted shape should support both UI rendering and Markdown export without lossy transformation

## Recommended Relationship Summary

- `User 1 -> many Project`
- `Project 1 -> many FeedbackFile`
- `Project 1 -> many Insight`
- `Project 1 -> many Proposal`

## Persistence Decisions

Persist:

- project metadata
- uploaded input metadata
- normalized text content
- surfaced insights
- proposal outputs

Do not require persistence for:

- temporary parsing artifacts
- temporary chunking artifacts
- temporary prompt assembly state
- transient loading state

## Optional MVP Extensions

Only add if needed during implementation:

- `analysisRunId` on `Insight` and `Proposal`
- `status` fields for long-running analysis
- `errorMessage` on failed parsing records
- `deletedAt` for soft deletion
- `updatedAt` on proposal if editing is later introduced

## Implementation Guidance

- Use Supabase migrations as the single source of truth for table structure.
- Prefer explicit enums where useful, such as source type or input method.
- Keep proposal field names aligned with the output schema.
- Keep the project model stable even if a more explicit session model is added later.