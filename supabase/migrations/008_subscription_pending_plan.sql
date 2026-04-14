-- Migration 008: Track pending plan changes (e.g. scheduled downgrades)

alter table public.profiles
  add column if not exists subscription_pending_plan  text,
  add column if not exists subscription_schedule_id   text;
