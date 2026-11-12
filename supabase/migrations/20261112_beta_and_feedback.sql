-- ============================================================
-- AuraMind Beta Programme & Feedback Triage System
-- Migration: 20261112_beta_and_feedback.sql
-- ============================================================

-- 1. Ensure payment_requests supports 'beta' tier
alter table if exists public.payment_requests 
  drop constraint if exists payment_requests_tier_check;

alter table if exists public.payment_requests 
  add constraint payment_requests_tier_check check (tier in ('gold', 'platinum', 'diamond', 'beta'));

-- 2. Ensure user_subscriptions supports 'beta' tier
alter table if exists public.user_subscriptions 
  drop constraint if exists user_subscriptions_tier_check;

alter table if exists public.user_subscriptions 
  add constraint user_subscriptions_tier_check check (tier in ('free', 'gold', 'platinum', 'diamond', 'beta'));

-- 3. Feedback Submissions Table for Beta User Triage
create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_name text,
  category text not null check (category in ('bug', 'feature_request', 'ai_quality', 'timetable', 'ux', 'performance', 'other')),
  feature text,
  description text not null,
  satisfaction_rating integer check (satisfaction_rating between 1 and 5),
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indices for fast admin filtering & sorting
create index if not exists idx_feedback_priority on public.feedback_submissions(priority, created_at desc);
create index if not exists idx_feedback_status on public.feedback_submissions(status);
create index if not exists idx_feedback_user on public.feedback_submissions(user_id);
create index if not exists idx_feedback_category on public.feedback_submissions(category);

-- Row Level Security
alter table public.feedback_submissions enable row level security;

-- Authenticated users can view their own submissions
create policy "Users can view own feedback submissions"
  on public.feedback_submissions for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can submit feedback
create policy "Users can insert feedback submissions"
  on public.feedback_submissions for insert
  to authenticated
  with check (auth.uid() = user_id or auth.uid() is null);

-- Full access for service role / admin APIs
create policy "Service role full access to feedback_submissions"
  on public.feedback_submissions for all
  to service_role
  using (true)
  with check (true);
