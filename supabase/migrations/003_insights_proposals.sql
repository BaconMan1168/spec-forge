-- Migration 003: insights, proposals, and analysis_runs tables
-- Run manually in Supabase SQL editor

-- insights: surfaced themes from Stage 1 analysis
create table if not exists insights (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade not null,
  theme_name  text not null,
  frequency   text not null,
  quotes      jsonb not null default '[]',
  created_at  timestamptz default now() not null
);

-- proposals: feature proposals from Stage 2 analysis
create table if not exists proposals (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid references projects(id) on delete cascade not null,
  feature_name          text not null,
  problem_statement     text not null,
  evidence              jsonb not null default '[]',
  ui_changes            jsonb not null default '[]',
  data_model_changes    jsonb not null default '[]',
  workflow_changes      jsonb not null default '[]',
  engineering_tasks     jsonb not null default '[]',
  created_at            timestamptz default now() not null
);

-- analysis_runs: lightweight rate limiting + staleness tracking
create table if not exists analysis_runs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  project_id  uuid references projects(id) on delete cascade not null,
  input_count int not null default 0,
  created_at  timestamptz default now() not null
);

-- Indexes for common queries
create index if not exists insights_project_id_idx on insights(project_id);
create index if not exists proposals_project_id_idx on proposals(project_id);
create index if not exists analysis_runs_user_id_created_at_idx on analysis_runs(user_id, created_at desc);
create index if not exists analysis_runs_project_id_created_at_idx on analysis_runs(project_id, created_at desc);

-- RLS: insights
alter table insights enable row level security;

create policy "Users can read their own project insights"
on insights for select
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can insert insights for their own projects"
on insights for insert
to authenticated
with check (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can delete insights for their own projects"
on insights for delete
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

-- RLS: proposals
alter table proposals enable row level security;

create policy "Users can read their own project proposals"
on proposals for select
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can insert proposals for their own projects"
on proposals for insert
to authenticated
with check (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can delete proposals for their own projects"
on proposals for delete
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

-- RLS: analysis_runs
alter table analysis_runs enable row level security;

create policy "Users can read their own analysis runs"
on analysis_runs for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own analysis runs"
on analysis_runs for insert
to authenticated
with check (auth.uid() = user_id);
