-- ============================================================
-- AuraMind Subscription Plans Schema
-- Migration: 20261105_subscription_plans.sql
-- ============================================================

-- 1. Extend profiles table with subscription tracking
alter table public.profiles
  add column if not exists subscription_tier text not null default 'gold' check (subscription_tier in ('gold', 'platinum', 'diamond')),
  add column if not exists subscription_status text not null default 'active' check (subscription_status in ('active', 'trialing', 'past_due', 'canceled')),
  add column if not exists subscription_started_at timestamptz not null default now(),
  add column if not exists subscription_renews_at timestamptz not null default (now() + interval '30 days'),
  add column if not exists ai_calls_used_this_month integer not null default 0;

create index if not exists idx_profiles_subscription_tier on public.profiles(subscription_tier);

-- 2. Create subscription history / audit table
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null check (tier in ('gold', 'platinum', 'diamond')),
  status text not null default 'active',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  started_at timestamptz not null default now(),
  renews_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_subscriptions_user on public.user_subscriptions(user_id, created_at desc);

-- 3. Row Level Security policies
alter table public.user_subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.user_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role full access to user_subscriptions"
  on public.user_subscriptions for all
  to service_role
  using (true)
  with check (true);
