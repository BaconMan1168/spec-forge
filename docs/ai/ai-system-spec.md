# SpecForge — AI System Spec

## Purpose

This document defines the MVP AI pipeline, model behavior requirements, and generation rules for synthesis and proposal output.

## AI System Goals

- Turn raw qualitative feedback into trustworthy structured product artifacts.
- Ground all synthesis in uploaded source material.
- Produce outputs that are both human-readable and directly useful in AI coding workflows.
- Handle weak inputs honestly rather than fabricating precision.

## High-Level Pipeline

The MVP AI system runs in two stages:

1. **Stage 1 — Synthesis**
2. **Stage 2 — Proposal Generation**

Both stages should be orchestrated through the Vercel AI SDK.

## Inputs to the AI System

The AI system receives normalized plain text derived from:

- `.txt` uploads
- `.pdf` uploads
- `.docx` uploads
- pasted text

Each input must also include:

- source label
- file/input identifier
- project context

## Stage 1 — Synthesis

### Goal

Identify recurring themes, pain points, and opportunities across all valid user inputs.

### Responsibilities

- ingest all normalized text inputs
- analyze across all uploaded/pasted feedback
- group semantically similar feedback
- surface recurring themes
- estimate or compute theme frequency
- extract representative supporting quotes
- preserve source attribution for evidence

### Expected Output

A structured object containing, at minimum:

- theme name
- frequency signal
- representative quotes
- source labels for quotes

### Recommended Processing Pattern

- chunk input content if needed for model limits or reliability
- use semantic grouping/clustering to combine similar complaints or themes
- aggregate across inputs before proposal generation
- return structured output, preferably JSON or equivalent typed structure

## Stage 2 — Proposal Generation

### Goal

Generate one structured product proposal per surfaced opportunity/theme.

### Responsibilities

For each selected theme:

- produce a plain-language problem statement
- include direct evidence from user inputs
- propose UI changes
- propose data model changes
- propose workflow changes
- produce atomic implementation tasks suitable for AI-assisted execution

### Expected Output

A structured proposal containing:

- feature name
- problem statement
- user evidence
- suggested UI changes
- suggested data model changes
- suggested workflow changes
- engineering tasks

## Behavioral Constraints

The AI system must obey the following rules:

### Grounding Rules

- Never fabricate quotes.
- Quotes must come from uploaded source material.
- Quotes should be verbatim or near-verbatim only when supported by the source text.
- Output should remain scoped to the actual user feedback.

### Proposal Scoping Rules

- Each proposal should be narrowly scoped to a single feature or opportunity.
- Do not merge multiple unrelated opportunities into one proposal.
- Prefer clarity over comprehensiveness.

### Engineering Task Rules

- Engineering tasks must be atomic.
- Tasks should be AI-agent-executable where possible.
- Tasks should be implementation-oriented rather than vague product advice.
- Task order should roughly reflect build order where applicable.

### Low-Signal Rules

- If signal is weak, warn instead of overreaching.
- If no recurring themes exist, return an insufficient-signal state.
- Do not force proposals from noise.

## Streaming Behavior

Where supported, both synthesis and proposal generation should stream or progressively reveal output so the UI can show that work is happening.

## Model Configuration

- Use Vercel AI SDK as the model abstraction layer.
- Default model is `claude-sonnet-4-5`.
- Model selection must be controlled by `AI_MODEL`.
- No other code changes should be required to swap models.

## Cost and Efficiency Considerations

- Use prompt caching where supported for static system prompts.
- Keep system prompts stable to maximize caching benefit.
- Pre-validate inputs before sending them to the model.
- Avoid unnecessary repeated full-project calls when only formatting/export changes are needed.

## Failure Modes to Handle

- input too sparse
- no recurring themes found
- conflicting or noisy data
- malformed structured response from model
- model timeout or provider failure

## Design Principle

SpecForge should be opinionated about structure, but conservative about evidence. It is better to return fewer well-grounded proposals than many weak ones.