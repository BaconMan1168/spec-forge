-- Migration 011: preserve analysis_runs after project deletion
--
-- Bug: analysis_runs.project_id used ON DELETE CASCADE, so deleting a project
-- also deleted its analysis_runs record. canCreateProject() counts analyzed
-- projects via analysis_runs, so deleted projects stopped counting toward the
-- monthly limit — allowing users to bypass it by cycling through deletions.
--
-- Fix: change the FK to ON DELETE SET NULL so the analysis_runs row stays,
-- keeping the monthly count accurate even after a project is deleted.

-- 1. Drop the old FK constraint
alter table public.analysis_runs
  drop constraint if exists analysis_runs_project_id_fkey;

-- 2. Make project_id nullable (required for SET NULL)
alter table public.analysis_runs
  alter column project_id drop not null;

-- 3. Re-add FK with SET NULL behaviour
alter table public.analysis_runs
  add constraint analysis_runs_project_id_fkey
  foreign key (project_id)
  references public.projects(id)
  on delete set null;
