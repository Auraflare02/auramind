-- ============================================================
-- AuraMind Complete PostgreSQL Schema & Migrations
-- Resolves Supabase 42501 (insufficient_privilege) by explicitly
-- configuring grants and service_role RLS policies.
-- ============================================================

-- Ensure uuid generation extension is active
create extension if not exists "pgcrypto";

-- 1. Main Goal Requests Table
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

-- Backward-compatibility & alias view for goal_requests
create or replace view goal_requests as select * from requests;

-- Indexes for fast lookup
create index if not exists idx_requests_status on requests(status);
create index if not exists idx_requests_code on requests(request_code);
create index if not exists idx_requests_created_at on requests(created_at desc);

-- 2. Hourly Check-ins Table
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

create index if not exists idx_checkins_req_day on checkins(request_id, day);
create index if not exists idx_checkins_created on checkins(created_at desc);

-- Backward-compatibility view for auramind_run_logs
create or replace view auramind_run_logs as select * from checkins;

-- 3. Focus Sessions Table (Timer sessions persistence)
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

create index if not exists idx_focus_sessions_req on auramind_focus_sessions(request_id);
create index if not exists idx_focus_sessions_started on auramind_focus_sessions(started_at desc);

-- 4. Persistent Goal Runs (Sessions, streaks, adaptive schedules)
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

create index if not exists idx_goal_runs_token on auramind_goal_runs(session_token);

-- 5. AI Conversational Assistant Messages (Ask AuraMind)
create table if not exists auramind_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_req on auramind_messages(request_id, created_at asc);

-- 6. Generated Reports (Daily & Weekly summaries)
create table if not exists auramind_run_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  report_type text not null check (report_type in ('daily', 'weekly', 'adaptive')),
  day int,
  metrics jsonb not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_req on auramind_run_reports(request_id, report_type, day);

-- 7. Knowledge Base (Cached research and verified benchmarks)
create table if not exists auramind_knowledge (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  goal_category text,
  source text,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_knowledge_cat on auramind_knowledge(goal_category);

-- ============================================================
-- Security, Permissions & RLS Configuration
-- Fixes error 42501 by explicitly granting service_role permissions
-- and establishing full-access policies for service_role.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- Enable RLS on all tables
alter table requests enable row level security;
alter table checkins enable row level security;
alter table auramind_focus_sessions enable row level security;
alter table auramind_goal_runs enable row level security;
alter table auramind_messages enable row level security;
alter table auramind_run_reports enable row level security;
alter table auramind_knowledge enable row level security;

-- Policies for service_role (privileged server operations)
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
