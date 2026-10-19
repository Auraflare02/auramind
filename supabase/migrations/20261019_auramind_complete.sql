-- Migration: 20261019_auramind_complete.sql
-- Resolves Supabase 42501 and creates all AuraMind tables, indexes, views, and service_role RLS policies.

create extension if not exists "pgcrypto";

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  request_code text unique,
  status text not null default 'pending' check (status in ('pending', 'researching', 'review', 'ready', 'archived')),
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

-- Add any missing columns to requests if table already existed previously
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='request_code') then
    alter table requests add column request_code text unique;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='category') then
    alter table requests add column category text not null default 'other';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='current_level') then
    alter table requests add column current_level text not null default 'Beginner';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='target_level') then
    alter table requests add column target_level text not null default 'Advanced';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='timezone') then
    alter table requests add column timezone text not null default 'UTC';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='research_data') then
    alter table requests add column research_data jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='ready_at') then
    alter table requests add column ready_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='requests' and column_name='session_token') then
    alter table requests add column session_token text;
  end if;
end $$;

create or replace view goal_requests as select * from requests;

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  day int not null check (day between 1 and 30),
  planned text not null,
  actual text not null,
  status text not null check (status in ('done', 'partial', 'missed', 'different')),
  focused_min int not null default 0,
  distraction_min int not null default 0,
  distraction_type text,
  reason text,
  period text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Ensure status check constraint allows 'different'
do $$
begin
  alter table checkins drop constraint if exists checkins_status_check;
  alter table checkins add constraint checkins_status_check check (status in ('done', 'partial', 'missed', 'different'));
exception when others then null;
end $$;

create index if not exists idx_checkins_req_day on checkins(request_id, day);
create or replace view auramind_run_logs as select * from checkins;

create table if not exists auramind_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  task_activity text not null,
  duration_min int not null,
  actual_duration_min int not null default 0,
  status text not null default 'completed' check (status in ('completed', 'abandoned', 'in_progress')),
  xp_awarded int not null default 0,
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists auramind_goal_runs (
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

create table if not exists auramind_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists auramind_run_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  report_type text not null check (report_type in ('daily', 'weekly', 'adaptive')),
  day int,
  metrics jsonb not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists auramind_knowledge (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  goal_category text,
  source text,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

alter table requests enable row level security;
alter table checkins enable row level security;
alter table auramind_focus_sessions enable row level security;
alter table auramind_goal_runs enable row level security;
alter table auramind_messages enable row level security;
alter table auramind_run_reports enable row level security;
alter table auramind_knowledge enable row level security;

drop policy if exists "service_role_requests" on requests;
create policy "service_role_requests" on requests for all to service_role using (true) with check (true);

drop policy if exists "service_role_checkins" on checkins;
create policy "service_role_checkins" on checkins for all to service_role using (true) with check (true);

drop policy if exists "service_role_focus" on auramind_focus_sessions;
create policy "service_role_focus" on auramind_focus_sessions for all to service_role using (true) with check (true);

drop policy if exists "service_role_runs" on auramind_goal_runs;
create policy "service_role_runs" on auramind_goal_runs for all to service_role using (true) with check (true);

drop policy if exists "service_role_messages" on auramind_messages;
create policy "service_role_messages" on auramind_messages for all to service_role using (true) with check (true);

drop policy if exists "service_role_reports" on auramind_run_reports;
create policy "service_role_reports" on auramind_run_reports for all to service_role using (true) with check (true);

drop policy if exists "service_role_knowledge" on auramind_knowledge;
create policy "service_role_knowledge" on auramind_knowledge for all to service_role using (true) with check (true);
