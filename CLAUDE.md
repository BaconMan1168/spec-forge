# CLAUDE.md — SpecForge

## Purpose

This file defines how Claude should operate when working on SpecForge.

Goals:
- small, correct, production-ready changes
- minimal token usage
- consistent architecture
- no hallucination in AI outputs

---

## Non-Negotiables

- NEVER fabricate user quotes
- NEVER break output schema (see output-spec.md)
- NEVER commit secrets
- KEEP changes small and scoped
- DO NOT refactor unrelated code
- FOLLOW repo structure strictly
- DO NOT invent UI styles outside the design system
- Never say "co authored by claude" in any commit messages

---

## Source of Truth

Claude must follow:

- Product → docs/product/prd.md
- User flows → docs/product/user-flows.md
- Design system → docs/product/design-system.md
- Engineering → docs/engineering/engineering-spec.md
- Data model → docs/engineering/data-model.md
- Repo structure → docs/engineering/repo-structure.md

- AI system → docs/ai/ai-system-spec.md
- Prompt design → docs/ai/prompt-design.md
- Output spec → docs/ai/output-spec.md
- Evaluation → docs/ai/eval-plan.md

Priority:
1. output-spec.md (strictest for AI output structure)
2. design-system.md (strictest for UI styling and component constraints)
3. engineering-spec.md
4. prd.md

---

## System Overview

SpecForge consists of:

1. File ingestion + parsing
2. AI pipeline:
   - Stage 1: synthesis (themes + quotes)
   - Stage 2: proposal generation
3. Session storage (projects, inputs, outputs)
4. Markdown export

Claude must preserve this architecture.

---

## Development Workflow (MANDATORY)

For every task:

1. EXPLORE
   - read relevant docs + code

2. PLAN
   - outline approach
   - list files to change

3. IMPLEMENT
   - minimal, clean code
   - follow existing patterns

4. VALIDATE
   - output matches spec
   - no hallucination
   - no schema drift

5. ITERATE

Do NOT jump straight to coding.

---

## Implementation Workflow (STRICT)

For every implementation task, Claude must:

1. Restate the task (1–3 lines)
2. Provide a short plan (bullet points)
3. List files to be created/modified
4. Implement changes
5. Validate:
   - output matches output-spec.md
   - no hallucinated data
   - no schema violations
   - UI follows design-system.md if any UI was touched
6. Summarize:
   - what changed
   - how to test locally
   - any follow-ups

Claude must avoid:
- long explanations
- unnecessary refactors
- adding dependencies without justification

---

## Scope Control

- Keep changes small and focused
- Do not modify unrelated files
- Do not refactor outside the task scope
- Prefer minimal diffs over large rewrites

---

## Codebase Rules

- Follow repo-structure.md strictly
- Do not create new top-level folders
- Prefer modifying existing files over creating new ones
- Keep functions small and explicit
- Avoid over-engineering

---

## Design System & UI Guidelines

### Canonical Design Spec

The design system is defined in:

- `docs/product/design-system.md`

### Enforcement Rules (CRITICAL)

Claude must:

- Use ONLY the tokens, components, patterns, and constraints defined in `docs/product/design-system.md`
- Never invent new colors, spacing values, radii, shadows, typography values, or animation timings unless explicitly instructed
- Never modify design tokens without explicit approval
- If a requested UI conflicts with the design system, ask before proceeding
- Keep new UI visually consistent with the rest of the product

### Implementation Expectations

- Tailwind-based implementation is acceptable, but must remain design-system-driven
- Prefer central tokens, shared classes, CSS variables, or theme extensions over scattered arbitrary values
- Avoid one-off styling unless explicitly approved
- Always include loading, empty, and error states when relevant
- Preserve accessibility defaults:
  - clear contrast
  - keyboard accessibility
  - focus states
  - readable spacing and hierarchy

### UI Change Rule

If a task touches UI, Claude must read `docs/product/design-system.md` before implementing changes.

---

## Code Style Guidelines

- TypeScript strict mode
- Avoid `any` unless necessary
- Prefer explicit, readable logic
- Keep functions small and testable

Naming:
- Components: PascalCase
- Utilities: kebab-case
- Variables/functions: camelCase

---

## API Conventions

- Use REST-style endpoints
- Use consistent error format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "optional"
  }
}