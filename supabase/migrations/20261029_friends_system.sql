-- ============================================================
-- AuraMind Friends & Social Accountability System Schema
-- Migration: 20261029_friends_system.sql
-- ============================================================

-- 1. Enhance Profiles table with public username, AuraMind ID, and privacy settings
alter table public.profiles
  add column if not exists username text,
  add column if not exists auramind_id text,
  add column if not exists bio text,
  add column if not exists privacy_discoverable boolean not null default true,
  add column if not exists privacy_share_goals boolean not null default false,
  add column if not exists privacy_share_stats boolean not null default true,
  add column if not exists privacy_allow_requests text not null default 'everyone';

-- Ensure unique indices for username and auramind_id
create unique index if not exists idx_profiles_username_unique on public.profiles (lower(username)) where username is not null;
create unique index if not exists idx_profiles_auramind_id_unique on public.profiles (auramind_id) where auramind_id is not null;

-- Populate existing profiles with default auramind_id and username if missing
update public.profiles
set
  auramind_id = coalesce(auramind_id, 'AM-' || upper(substring(replace(id::text, '-', ''), 1, 6))),
  username = coalesce(username, 'user_' || lower(substring(replace(id::text, '-', ''), 1, 6)))
where auramind_id is null or username is null;

-- 2. Create canonical Friendships table
-- Pairs are ordered (user_id < friend_id) so exactly ONE row exists per pair of users.
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  action_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_users_different check (user_id != friend_id),
  constraint friendships_canonical_pair check (user_id < friend_id),
  constraint friendships_unique_pair unique (user_id, friend_id)
);

create index if not exists idx_friendships_user_id on public.friendships(user_id);
create index if not exists idx_friendships_friend_id on public.friendships(friend_id);
create index if not exists idx_friendships_status on public.friendships(status);
create index if not exists idx_friendships_action_user on public.friendships(action_user_id);

-- 3. Create Friendship Activities / Notifications table
create table if not exists public.friendship_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('request_received', 'request_accepted', 'goal_shared', 'milestone_completed', 'cheer')),
  title text not null,
  message text,
  metadata jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_friendship_activities_user on public.friendship_activities(user_id, created_at desc);

-- 4. Enable social sharing on goals (requests table)
alter table public.requests
  add column if not exists is_shared_with_friends boolean not null default false,
  add column if not exists shared_caption text;

create index if not exists idx_requests_shared_friends on public.requests(user_id, is_shared_with_friends);

-- 5. Row Level Security policies
alter table public.friendships enable row level security;
alter table public.friendship_activities enable row level security;

-- Drop existing friendship policies to ensure idempotent migration
drop policy if exists "Users can read own friendships" on public.friendships;
drop policy if exists "Service role full access to friendships" on public.friendships;
drop policy if exists "Users can read own friendship activities" on public.friendship_activities;
drop policy if exists "Users can update own friendship activities" on public.friendship_activities;
drop policy if exists "Service role full access to friendship activities" on public.friendship_activities;

-- Friendship policies
create policy "Users can read own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Service role full access to friendships"
  on public.friendships for all
  to service_role
  using (true)
  with check (true);

-- Activity policies
create policy "Users can read own friendship activities"
  on public.friendship_activities for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own friendship activities"
  on public.friendship_activities for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access to friendship activities"
  on public.friendship_activities for all
  to service_role
  using (true)
  with check (true);
