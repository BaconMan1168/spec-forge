create table if not exists public.exports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (project_id, proposal_id)
);

-- Users can read their own export rows (used for limit checks via RLS-safe queries)
alter table public.exports enable row level security;

create policy "Users can read own exports"
  on public.exports for select
  using (auth.uid() = user_id);

-- Inserts are done via service role in server actions (bypasses RLS)
-- No user-facing insert policy needed.
