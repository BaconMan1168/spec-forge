create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text,
  updated_at              timestamptz default now()
);

-- Auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row-level security: users can read their own profile row only
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- No user-facing update policy — billing fields are only written by the
-- service role via the webhook handler, which bypasses RLS.
