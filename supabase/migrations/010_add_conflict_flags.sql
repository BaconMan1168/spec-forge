-- Migration 010: add conflict flags to insights and proposals
-- has_conflict: true when sources express genuinely opposing views on the same dimension
-- is_conflict_proposal: true when the proposal was generated from a conflicting theme

alter table insights
  add column if not exists has_conflict boolean not null default false;

alter table proposals
  add column if not exists is_conflict_proposal boolean not null default false;
