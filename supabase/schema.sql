-- ============================================================
-- AuraMind Complete Clean Schema
-- ============================================================

-- 1. Safely remove any half-created or broken legacy tables/views
drop table if exists requests cascade;
drop table if exists checkins cascade;
drop table if exists auramind_focus_sessions cascade;
drop table if exists auramind_goal_runs cascade;
drop table if exists auramind_messages cascade;
drop table if exists auramind_run_reports cascade;
drop table if exists auramind_knowledge cascade;
drop view if exists goal_requests cascade;
drop view if exists auramind_run_logs cascade;

create extension if not exists "pgcrypto";

-- 2. Create Core Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  request_code text unique,
  status text not null default 'pending',
  category text not null default 'other',
  current_level text not null default 'Beginner',
  target_level text not null default 'Advanced',
  timezone text not null default 'UTC',
  context jsonb not null,
  research text,
  research_data jsonb,
  plan jsonb,
  plan_source text default 'ai',
  ready_at timestamptz,
  started_at timestamptz,
  session_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_requests_status on requests(status);
create index idx_requests_code on requests(request_code);
create index idx_requests_user_id on requests(user_id);
create index idx_requests_created_at on requests(created_at desc);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  day int not null,
  planned text not null,
  actual text not null,
  status text not null,
  focused_min int not null default 0,
  distraction_min int not null default 0,
  distraction_type text,
  reason text,
  period text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_checkins_req_day on checkins(request_id, day);
create index idx_checkins_created on checkins(created_at desc);

create table auramind_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  task_activity text not null,
  duration_min int not null,
  actual_duration_min int not null default 0,
  status text not null default 'completed',
  xp_awarded int not null default 0,
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_focus_sessions_req on auramind_focus_sessions(request_id);
create index idx_focus_sessions_started on auramind_focus_sessions(started_at desc);

create table auramind_goal_runs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references requests(id) on delete cascade,
  session_token text not null unique,
  current_day int not null default 1,
  total_xp int not null default 0,
  streak_days int not null default 0,
  longest_streak int not null default 0,
  adaptive_plan jsonb,
  unlocked_achievements text[] default '{}',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_goal_runs_token on auramind_goal_runs(session_token);

create table auramind_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_req on auramind_messages(request_id, created_at asc);

create table auramind_run_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  report_type text not null,
  day int,
  metrics jsonb not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_reports_req on auramind_run_reports(request_id, report_type, day);

create table auramind_knowledge (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  goal_category text,
  source text,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_knowledge_cat on auramind_knowledge(goal_category);

-- 3. Grants and Row-Level Security
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

alter table public.profiles enable row level security;
alter table requests enable row level security;
alter table checkins enable row level security;
alter table auramind_focus_sessions enable row level security;
alter table auramind_goal_runs enable row level security;
alter table auramind_messages enable row level security;
alter table auramind_run_reports enable row level security;
alter table auramind_knowledge enable row level security;

create policy "service_role_profiles" on public.profiles for all to service_role using (true) with check (true);
create policy "users_own_profile_select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "users_own_profile_update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "service_role_requests" on requests for all to service_role using (true) with check (true);
create policy "users_own_requests" on requests for select to authenticated using (auth.uid() = user_id or user_id is null);
create policy "service_role_checkins" on checkins for all to service_role using (true) with check (true);
create policy "service_role_focus" on auramind_focus_sessions for all to service_role using (true) with check (true);
create policy "service_role_runs" on auramind_goal_runs for all to service_role using (true) with check (true);
create policy "service_role_messages" on auramind_messages for all to service_role using (true) with check (true);
create policy "service_role_reports" on auramind_run_reports for all to service_role using (true) with check (true);
create policy "service_role_knowledge" on auramind_knowledge for all to service_role using (true) with check (true);

-- 4. Auth User Profile Trigger
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
