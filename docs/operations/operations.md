# SpecForge — Operations

## Purpose

This document defines the MVP operational setup, environment configuration, deployment assumptions, and basic runbook guidance.

## Environment Variables

Minimum expected variables:

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=claude-sonnet-4-5
NEXT_PUBLIC_APP_URL=
```

## Environment Variable Rules

- AI_MODEL must be the single control point for model selection.
- Model provider changes should not require code changes outside configuration unless the provider contract truly differs.
- Secrets must never be committed to the repo.
- Use .env.local for local development.