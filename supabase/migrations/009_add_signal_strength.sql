-- Migration 009: add signal_strength column to insights
-- Tracks AI-assessed evidence quality per theme ("high", "medium", "low")
-- Nullable to remain compatible with existing rows from prior analyses

alter table insights
  add column if not exists signal_strength text;
