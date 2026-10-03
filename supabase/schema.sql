create extension if not exists pgcrypto;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  deadline date not null,
  current_level text not null,
  target_level text not null,
  fixed_schedule text not null default '',
  daily_available_minutes integer not null default 180 check (daily_available_minutes > 0),
  success_definition text not null,
  status text not null default 'active' check (status in ('active','paused','completed','failed','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  scheduled_for date not null,
  start_time time not null,
  end_time time not null,
  activity text not null,
  category text not null,
  priority text not null check (priority in ('high','medium','low')),
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.hourly_logs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  logged_for date not null,
  hour_start time not null,
  hour_end time not null,
  planned_activity text not null default '',
  actual_activity text not null default '',
  outcome text not null default 'completed' check (outcome in ('completed','partial','skipped','different')),
  focused_minutes integer not null default 0 check (focused_minutes between 0 and 60),
  distraction_minutes integer not null default 0 check (distraction_minutes between 0 and 60),
  distraction_category text,
  distraction_reason text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  report_date date not null,
  completion_percent numeric(5,2) not null default 0,
  planned_minutes integer not null default 0,
  focused_minutes integer not null default 0,
  distraction_minutes integer not null default 0,
  strongest_period text,
  weakest_period text,
  key_problem text,
  solution text,
  created_at timestamptz not null default now(),
  unique(goal_id, report_date)
);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  completion_percent numeric(5,2) not null default 0,
  focused_minutes integer not null default 0,
  distraction_minutes integer not null default 0,
  best_period text,
  worst_period text,
  top_distractions jsonb not null default '[]'::jsonb,
  recurring_reasons jsonb not null default '[]'::jsonb,
  patterns jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(goal_id, week_start)
);

alter table public.goals enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.hourly_logs enable row level security;
alter table public.daily_reports enable row level security;
alter table public.weekly_reports enable row level security;

create policy "own goals"
on public.goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "own schedule"
on public.schedule_blocks for all
using (exists (select 1 from public.goals g where g.id=schedule_blocks.goal_id and g.user_id=auth.uid()))
with check (exists (select 1 from public.goals g where g.id=schedule_blocks.goal_id and g.user_id=auth.uid()));

create policy "own hourly logs"
on public.hourly_logs for all
using (exists (select 1 from public.goals g where g.id=hourly_logs.goal_id and g.user_id=auth.uid()))
with check (exists (select 1 from public.goals g where g.id=hourly_logs.goal_id and g.user_id=auth.uid()));

create policy "own daily reports"
on public.daily_reports for all
using (exists (select 1 from public.goals g where g.id=daily_reports.goal_id and g.user_id=auth.uid()))
with check (exists (select 1 from public.goals g where g.id=daily_reports.goal_id and g.user_id=auth.uid()));

create policy "own weekly reports"
on public.weekly_reports for all
using (exists (select 1 from public.goals g where g.id=weekly_reports.goal_id and g.user_id=auth.uid()))
with check (exists (select 1 from public.goals g where g.id=weekly_reports.goal_id and g.user_id=auth.uid()));


create table if not exists public.goal_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  goal text not null,
  deadline date not null,
  current_level text not null,
  target_level text not null,
  fixed_schedule text not null default '',
  daily_hours integer not null default 3 check (daily_hours between 1 and 12),
  timezone text not null default 'Asia/Kolkata',
  preferred_focus_time text not null default '',
  known_distractions text not null default '',
  past_attempts text not null default '',
  constraints text not null default '',
  status text not null default 'pending' check (status in ('pending','researching','review','ready','archived')),
  research jsonb,
  plan jsonb,
  eta_at timestamptz not null default (now() + interval '12 hours'),
  created_at timestamptz not null default now(),
  ready_at timestamptz
);

create index if not exists goal_requests_status_created_idx
  on public.goal_requests(status, created_at desc);

alter table public.goal_requests enable row level security;
