create extension if not exists pgcrypto;

create table if not exists public.auramind_knowledge (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  domain text not null default 'general',
  content text not null,
  source_url text,
  tags text[] not null default '{}',
  priority integer not null default 50,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists auramind_knowledge_active_priority_idx
  on public.auramind_knowledge(active, priority desc);

create table if not exists public.auramind_goal_runs (
  id uuid primary key default gen_random_uuid(),
  access_token text not null unique,
  request_code text references public.goal_requests(request_code) on delete set null,
  plan jsonb not null,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auramind_goal_runs_request_idx
  on public.auramind_goal_runs(request_code);

create table if not exists public.auramind_run_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.auramind_goal_runs(id) on delete cascade,
  logged_for date not null,
  hour_start text not null,
  hour_end text not null,
  planned_activity text not null default '',
  actual_activity text not null default '',
  outcome text not null check (outcome in ('completed','partial','skipped','different')),
  focused_minutes integer not null default 0 check (focused_minutes between 0 and 60),
  distraction_minutes integer not null default 0 check (distraction_minutes between 0 and 60),
  distraction_category text,
  distraction_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id, logged_for, hour_start)
);

create index if not exists auramind_run_logs_run_date_idx
  on public.auramind_run_logs(run_id, logged_for desc);

create table if not exists public.auramind_run_reports (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.auramind_goal_runs(id) on delete cascade,
  report_type text not null check (report_type in ('daily','weekly','adaptive')),
  report_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(run_id, report_type, report_key)
);

create index if not exists auramind_run_reports_run_idx
  on public.auramind_run_reports(run_id, created_at desc);

create table if not exists public.auramind_messages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.auramind_goal_runs(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists auramind_messages_run_idx
  on public.auramind_messages(run_id, created_at desc);

alter table public.auramind_knowledge enable row level security;
alter table public.auramind_goal_runs enable row level security;
alter table public.auramind_run_logs enable row level security;
alter table public.auramind_run_reports enable row level security;
alter table public.auramind_messages enable row level security;

insert into public.auramind_knowledge (slug,title,domain,content,source_url,tags,priority)
values
('planning-specificity','Specific planning beats vague task labels','planning','Translate broad intentions into concrete actions with a clear deliverable. Prefer tasks that can be checked as done.','https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation',array['planning','execution','metacognition'],100),
('plan-monitor-adapt','Plan, monitor, evaluate, adapt','learning','A strong self-regulation loop plans the approach, monitors performance, evaluates what happened and adapts the next attempt.','https://educationendowmentfoundation.org.uk/16-19/developing-independent-learners/metacognition-and-self-regulation',array['learning','adaptation','self-regulation'],100),
('task-sizing','Shrink blocked tasks before adding pressure','behavior','When a user repeatedly fails because a task is unclear or too difficult, reduce task size, add prerequisites, or change the task shape before increasing workload.','',array['behavior','difficulty','recovery'],90),
('environment-friction','Change the environment when distractions repeat','behavior','Treat repeated distraction as evidence about the environment. Recommend practical friction changes before relying on motivation alone.','',array['behavior','distractions','environment'],90),
('recovery-protection','Protect recovery','planning','Do not fill every available minute. Maintain realistic transition time, recovery and essential commitments.','',array['planning','recovery'],95),
('deliberate-practice','Sequence learning from foundation to application','learning','For skill goals, move from prerequisites to deliberate practice, application, review, error repair and checkpoints as appropriate.','',array['learning','practice','sequence'],85),
('evidence-honesty','Separate evidence from planning judgement','research','When external research exists, distinguish retrieved evidence from planning decisions. Never invent citations, statistics, requirements or guarantees.','',array['research','grounding','trust'],100),
('missed-work-is-data','Treat missed work as information','behavior','A missed task is useful data about workload, timing, difficulty, energy, interruptions or environment. Use it to improve the system rather than shame the user.','',array['behavior','accountability','adaptation'],100)
on conflict (slug) do update set
  title=excluded.title,
  domain=excluded.domain,
  content=excluded.content,
  source_url=excluded.source_url,
  tags=excluded.tags,
  priority=excluded.priority,
  active=true,
  updated_at=now();

create or replace function public.auramind_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists auramind_goal_runs_updated_at on public.auramind_goal_runs;
create trigger auramind_goal_runs_updated_at
before update on public.auramind_goal_runs
for each row execute function public.auramind_touch_updated_at();

drop trigger if exists auramind_run_logs_updated_at on public.auramind_run_logs;
create trigger auramind_run_logs_updated_at
before update on public.auramind_run_logs
for each row execute function public.auramind_touch_updated_at();
