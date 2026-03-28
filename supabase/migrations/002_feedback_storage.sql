-- Migration 002: Supabase Storage bucket + RLS for feedback file uploads
-- Run manually in Supabase SQL editor

-- Create private storage bucket for feedback file uploads
insert into storage.buckets (id, name, public)
values ('feedback-uploads', 'feedback-uploads', false)
on conflict (id) do nothing;

-- RLS: authenticated users can upload to their own project paths
create policy "Authenticated users can upload feedback files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'feedback-uploads');

-- RLS: authenticated users can read feedback files
create policy "Authenticated users can read feedback files"
on storage.objects for select
to authenticated
using (bucket_id = 'feedback-uploads');

-- RLS: authenticated users can delete feedback files
create policy "Authenticated users can delete feedback files"
on storage.objects for delete
to authenticated
using (bucket_id = 'feedback-uploads');
