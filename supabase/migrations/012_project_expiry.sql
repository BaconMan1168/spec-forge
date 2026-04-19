-- Migration 012: free-plan project expiry
--
-- Free users' projects expire 7 days after creation.
-- Pro/Max users have indefinite persistence.
--
-- expires_at is set on the server when a project is created (free plan only).
-- NULL means "no expiry" (paid plans or projects created before this migration).

alter table public.projects
  add column if not exists expires_at timestamptz;

-- Cleanup function: hard-delete projects whose expires_at has passed.
-- Cascade deletes handle child rows (feedback_files, insights, proposals, exports).
create or replace function public.delete_expired_projects()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.projects
  where expires_at is not null
    and expires_at < now();
end;
$$;

-- Grant execute to service role so a cron caller or edge function can invoke it.
grant execute on function public.delete_expired_projects() to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- To activate automatic nightly cleanup, run the following ONE-TIME command
-- in the Supabase SQL editor AFTER enabling the pg_cron extension
-- (Dashboard → Database → Extensions → pg_cron):
--
--   select cron.schedule(
--     'delete-expired-projects',   -- job name
--     '0 3 * * *',                 -- daily at 03:00 UTC
--     'select public.delete_expired_projects()'
--   );
-- ─────────────────────────────────────────────────────────────────────────────
