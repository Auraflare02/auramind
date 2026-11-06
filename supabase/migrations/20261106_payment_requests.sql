-- ============================================================
-- AuraMind Payment Requests & Manual Verification Schema
-- Migration: 20261106_payment_requests.sql
-- ============================================================

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  user_name text,
  username text,
  auramind_id text,
  tier text not null check (tier in ('gold', 'platinum', 'diamond')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  amount integer not null,
  currency text not null default 'INR',
  transaction_id text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_requests_user on public.payment_requests(user_id, created_at desc);
create index if not exists idx_payment_requests_status on public.payment_requests(status);
create index if not exists idx_payment_requests_tx on public.payment_requests(transaction_id);

-- Row Level Security policies
alter table public.payment_requests enable row level security;

create policy "Users can read own payment requests"
  on public.payment_requests for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own payment requests"
  on public.payment_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Service role full access to payment_requests"
  on public.payment_requests for all
  to service_role
  using (true)
  with check (true);
