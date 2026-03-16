# SpecForge — User Flows

## Purpose

This document defines the primary user journeys for the MVP so implementation can preserve the intended product behavior from entry point to export.

## Flow 1 — Create New Project

### Goal

Allow a user to create a new project with minimal friction.

### Steps

1. User lands on the dashboard.
2. User sees a primary CTA: **Create New Project**.
3. User clicks the CTA.
4. User enters a project name.
5. User submits the form.
6. System creates a new project record.
7. System redirects the user to the project workspace.

### Expected UX

- Fast and simple
- No formal onboarding required
- Clear empty-state guidance after project creation

## Flow 2 — Add Feedback Inputs

### Goal

Allow a user to add feedback through file upload or pasted text.

### Steps

1. User enters a project workspace.
2. User chooses either:
   - upload files
   - paste raw text
3. If uploading files, user can multi-select supported file types.
4. System validates file type and size before processing.
5. For each uploaded or pasted input, system requires a source label.
6. User assigns source labels such as Interview, Support Ticket, Survey, or Slack.
7. System stores valid inputs in the current project/session.

### Expected UX

- Support multiple files and multiple source types in one session
- Clear validation errors for unsupported files
- Continue gracefully when only some files fail

## Flow 3 — Run Analysis

### Goal

Allow a user to trigger synthesis and proposal generation from the current project inputs.

### Steps

1. User reviews uploaded or pasted inputs.
2. User clicks **Analyze**.
3. System validates that:
   - at least one valid input exists
   - all inputs have source labels
4. System begins analysis.
5. System shows progress, loading states, or streaming feedback.
6. System parses input content into normalized text.
7. System runs AI synthesis across all valid inputs.
8. System extracts recurring themes and supporting quotes.
9. System generates feature proposals from surfaced opportunities.
10. System saves analysis outputs to the current project/session.

### Expected UX

- One primary action to start analysis
- Feedback that work is in progress
- No confusing intermediate steps
- Graceful warnings for low-signal or sparse inputs

## Flow 4 — Review Synthesis Results

### Goal

Help the user understand what the system found before export.

### Steps

1. User sees a synthesis/results view after analysis completes.
2. System displays surfaced themes.
3. System displays theme frequency in a user-readable format.
4. System displays supporting quotes for each theme.
5. User can expand or collapse quote groupings for deeper review.

### Expected UX

- Clear relationship between theme and evidence
- Easy scanning
- Evidence visible enough to build trust in AI output

## Flow 5 — Review Proposal Cards

### Goal

Allow the user to inspect structured proposals before export.

### Steps

1. System displays generated proposals as cards.
2. Each card shows a high-level summary first.
3. User expands a card to view full detail.
4. Expanded proposal includes:
   - feature name
   - problem statement
   - user evidence
   - suggested UI changes
   - suggested data model changes
   - suggested workflow changes
   - engineering tasks

### Expected UX

- Cards should be readable, scannable, and expandable
- Users should not need to leave the page to compare proposals
- Proposal structure should match the Markdown export structure as closely as possible

## Flow 6 — Export Proposal as Markdown

### Goal

Allow the user to move from discovery output into an implementation workflow.

### Steps

1. User chooses a single proposal or all proposals.
2. User clicks:
   - **Copy Markdown**, or
   - **Download .md**
3. System generates Markdown with consistent section hierarchy.
4. System either:
   - copies Markdown to clipboard, or
   - downloads a `.md` file

### Expected UX

- Export should be one-click
- Markdown should be clean enough to paste directly into Cursor or Claude Code
- Export format should preserve proposal structure and readability

## Flow 7 — Revisit Existing Project Session

### Goal

Allow users to return to prior work and continue using the project.

### Steps

1. User opens an existing project from the dashboard or project list.
2. User sees previously uploaded feedback and previous outputs.
3. User adds more feedback if needed.
4. User re-runs analysis.
5. System updates synthesis and proposal outputs for that session or project state.

### Expected UX

- Prior results should be visible on return
- Re-analysis should feel like continuing work, not starting over
- Session persistence should support iterative discovery

## Edge-State Flows

### No Feedback Uploaded

1. User opens a project with no inputs.
2. System shows empty-state guidance:
   - upload files
   - paste feedback
   - label source
   - click Analyze

### Unsupported File Type

1. User uploads an unsupported file.
2. System rejects the file.
3. System shows a clear validation error.
4. User can continue with other supported files.

### Corrupt or Unreadable File

1. User uploads a corrupted file.
2. System reports a file-specific parsing failure.
3. System continues processing other valid inputs.

### Low-Signal Input

1. User uploads very sparse or low-quality feedback.
2. System attempts analysis.
3. System warns that signal is insufficient or weak.
4. System suggests adding more feedback or richer inputs.

### No Clear Recurring Themes

1. System completes analysis but does not detect meaningful recurring themes.
2. System returns an insufficient-signal state instead of weak or forced proposals.