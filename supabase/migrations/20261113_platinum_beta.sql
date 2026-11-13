-- ============================================================
-- AuraMind Platinum-Level Beta Access Schema
-- Migration: 20261113_platinum_beta.sql
-- ============================================================

-- 1. Ensure profiles supports 'platinum_beta' and status 'expired'
alter table if exists public.profiles 
  drop constraint if exists profiles_subscription_tier_check;

alter table if exists public.profiles 
  add constraint profiles_subscription_tier_check 
  check (subscription_tier in ('gold', 'platinum', 'diamond', 'beta', 'platinum_beta'));

alter table if exists public.profiles 
  drop constraint if exists profiles_subscription_status_check;

alter table if exists public.profiles 
  add constraint profiles_subscription_status_check 
  check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'expired'));

-- 2. Ensure payment_requests supports 'platinum_beta'
alter table if exists public.payment_requests 
  drop constraint if exists payment_requests_tier_check;

alter table if exists public.payment_requests 
  add constraint payment_requests_tier_check 
  check (tier in ('gold', 'platinum', 'diamond', 'beta', 'platinum_beta'));

-- 3. Ensure user_subscriptions supports 'platinum_beta'
alter table if exists public.user_subscriptions 
  drop constraint if exists user_subscriptions_tier_check;

alter table if exists public.user_subscriptions 
  add constraint user_subscriptions_tier_check 
  check (tier in ('free', 'gold', 'platinum', 'diamond', 'beta', 'platinum_beta'));

-- 4. Dedicated Platinum Beta Access Table
create table if not exists public.platinum_beta_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payment_status text not null default 'approved' check (payment_status in ('approved', 'pending', 'rejected')),
  beta_activation_date timestamptz not null default now(),
  beta_expiry_date timestamptz not null default (now() + interval '20 days'),
  max_active_goals integer not null default 3,
  max_friends integer not null default 15,
  ai_call_allowance integer not null default 60,
  ai_calls_consumed integer not null default 0,
  whatsapp_eligible boolean not null default true,
  calendar_eligible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indices
create index if not exists idx_platinum_beta_expiry on public.platinum_beta_access(beta_expiry_date);
create index if not exists idx_platinum_beta_user on public.platinum_beta_access(user_id);

-- Row Level Security
alter table public.platinum_beta_access enable row level security;

create policy "Users can read own platinum beta access"
  on public.platinum_beta_access for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role full access to platinum_beta_access"
  on public.platinum_beta_access for all
  to service_role
  using (true)
  with check (true);
