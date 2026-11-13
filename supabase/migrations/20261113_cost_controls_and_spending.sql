-- ============================================================
-- AuraMind Financial & Spending Controls Schema
-- Migration: 20261113_cost_controls_and_spending.sql
-- ============================================================

-- 1. Extend platinum_beta_access table with Shark Tank cost control columns
alter table if exists public.platinum_beta_access
  add column if not exists total_call_credits integer not null default 20,
  add column if not exists max_call_duration_seconds integer not null default 90,
  add column if not exists total_call_duration_seconds integer not null default 0,
  add column if not exists whatsapp_messages_sent integer not null default 0,
  add column if not exists payment_reference text,
  add column if not exists plan_type text not null default 'platinum_beta';

-- Update call allowance default to 20 for beta participants
alter table if exists public.platinum_beta_access 
  alter column ai_call_allowance set default 20;

-- 2. Call Logs Table for Telephony Auditing
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tier text not null default 'platinum_beta',
  duration_seconds integer not null default 0,
  max_allowed_seconds integer not null default 90,
  cost_inr numeric(8, 2) not null default 0.00,
  provider text not null default 'bland_ai',
  status text not null default 'completed' check (status in ('completed', 'failed', 'terminated_limit', 'rejected_budget', 'rejected_quota')),
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_logs_user on public.call_logs(user_id, created_at desc);
create index if not exists idx_call_logs_status on public.call_logs(status);

-- 3. WhatsApp Messaging Logs Table
create table if not exists public.whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tier text not null default 'platinum_beta',
  message_type text not null default 'checkin_prompt',
  cost_inr numeric(6, 2) not null default 0.80,
  status text not null default 'delivered' check (status in ('delivered', 'failed', 'blocked_quiet_hours', 'blocked_optout', 'blocked_budget')),
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_logs_user on public.whatsapp_logs(user_id, created_at desc);

-- 4. Global Spending & Emergency Kill Switch State
create table if not exists public.system_spending_state (
  id text primary key default 'global_beta',
  budget_ceiling_inr numeric(10, 2) not null default 30000.00,
  total_call_cost numeric(10, 2) not null default 0.00,
  total_whatsapp_cost numeric(10, 2) not null default 0.00,
  total_ai_cost numeric(10, 2) not null default 0.00,
  emergency_calling_kill_switch boolean not null default false,
  emergency_whatsapp_kill_switch boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Initialize default global record if not present
insert into public.system_spending_state (id, budget_ceiling_inr, total_call_cost, total_whatsapp_cost, total_ai_cost)
values ('global_beta', 30000.00, 0.00, 0.00, 0.00)
on conflict (id) do nothing;

-- 5. User Communication Preferences & Quiet Hours
create table if not exists public.user_communication_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_opt_in boolean not null default false,
  calling_opt_in boolean not null default false,
  preferred_calling_start text not null default '10:00',
  preferred_calling_end text not null default '20:00',
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '08:00',
  preferred_language text not null default 'hi',
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.call_logs enable row level security;
alter table public.whatsapp_logs enable row level security;
alter table public.system_spending_state enable row level security;
alter table public.user_communication_preferences enable row level security;

create policy "Users can view own call logs"
  on public.call_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own whatsapp logs"
  on public.whatsapp_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can view and update own preferences"
  on public.user_communication_preferences for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access to financial controls"
  on public.call_logs for all to service_role
  using (true) with check (true);

create policy "Service role full access to whatsapp logs"
  on public.whatsapp_logs for all to service_role
  using (true) with check (true);

create policy "Service role full access to spending state"
  on public.system_spending_state for all to service_role
  using (true) with check (true);
