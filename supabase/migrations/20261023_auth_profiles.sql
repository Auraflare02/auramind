-- ============================================================
-- AuraMind Authentication & User Profiles Schema
-- ============================================================

-- 1. Create profiles table linked to Supabase auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies if any to avoid errors on rerun
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Service role full access to profiles" on public.profiles;

-- RLS Policies
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Service role full access to profiles"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);

-- 2. Automatically create profile on new user signup (Email or Google OAuth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Link Requests to Authenticated Users
alter table public.requests
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_requests_user_id on public.requests(user_id);

-- Add authenticated user policy on requests
drop policy if exists "Users can view own requests" on public.requests;
create policy "Users can view own requests"
  on public.requests for select
  to authenticated
  using (auth.uid() = user_id or user_id is null);

-- 4. Grant schema usage
grant usage on schema public to anon, authenticated, service_role;
grant all on public.profiles to service_role;
grant select, update on public.profiles to authenticated;
