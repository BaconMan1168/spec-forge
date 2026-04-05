alter table public.profiles
  add column if not exists subscription_plan text;
