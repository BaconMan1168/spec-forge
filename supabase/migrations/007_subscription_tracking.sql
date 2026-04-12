-- Migration 007: Add subscription period and cancel tracking to profiles

alter table public.profiles
  add column if not exists subscription_period_start timestamptz,
  add column if not exists subscription_period_end   timestamptz,
  add column if not exists subscription_cancel_at    timestamptz;
