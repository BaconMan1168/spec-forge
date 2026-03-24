-- supabase/migrations/001_initial_schema.sql

-- Project: primary user-owned container
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- FeedbackFile: a single uploaded or pasted input
create table if not exists public.feedback_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  file_name    text not null,
  source_type  text not null,
  content      text not null,
  storage_url  text,
  mime_type    text,
  input_method text not null check (input_method in ('upload', 'paste')),
  word_count   integer,
  created_at   timestamptz not null default now()
);

-- Insight: a surfaced theme from AI synthesis (Stage 1 output)
create table if not exists public.insights (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  theme_name  text not null,
  frequency   text not null,
  quotes      jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- Proposal: a structured feature proposal (Stage 2 output)
create table if not exists public.proposals (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references public.projects(id) on delete cascade,
  feature_name            text not null,
  problem_statement       text not null,
  evidence                jsonb not null default '[]',
  ui_changes              jsonb not null default '[]',
  data_model_changes      jsonb not null default '[]',
  workflow_changes        jsonb not null default '[]',
  engineering_tasks       jsonb not null default '[]',
  created_at              timestamptz not null default now()
);

-- Row Level Security
alter table public.projects        enable row level security;
alter table public.feedback_files  enable row level security;
alter table public.insights        enable row level security;
alter table public.proposals       enable row level security;

-- RLS Policies: users can only access their own data
create policy "users can manage own projects"
  on public.projects for all
  using (auth.uid() = user_id);

create policy "users can manage own feedback files"
  on public.feedback_files for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

create policy "users can manage own insights"
  on public.insights for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

create policy "users can manage own proposals"
  on public.proposals for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

-- Auto-update updated_at on projects
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at();
