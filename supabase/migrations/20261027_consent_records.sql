-- ============================================================
-- AuraMind Consent Management & Audit Schema
-- Migration: 20261027_consent_records.sql
-- ============================================================

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null, -- 'terms_and_conditions' | 'personal_data_processing' | 'product_updates'
  policy_name text not null, -- 'Terms & Conditions' | 'Privacy Policy' | 'Product Communications'
  policy_version text not null default '2026-10-V1',
  consented boolean not null default false,
  ip_address text,
  user_agent text,
  consented_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for efficient queries
create index if not exists idx_user_consents_user on public.user_consents(user_id);
create index if not exists idx_user_consents_type on public.user_consents(consent_type);
create index if not exists idx_user_consents_created on public.user_consents(created_at desc);

-- Enable Row-Level Security
alter table public.user_consents enable row level security;

-- Drop previous policies to avoid errors on rerun
drop policy if exists "Users can view own consent records" on public.user_consents;
drop policy if exists "Users can update own consent records" on public.user_consents;
drop policy if exists "Service role full access to user_consents" on public.user_consents;

-- RLS Policies
create policy "Users can view own consent records"
  on public.user_consents for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own consent records"
  on public.user_consents for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access to user_consents"
  on public.user_consents for all
  to service_role
  using (true)
  with check (true);

-- Grant appropriate permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on public.user_consents to service_role;
grant select, update on public.user_consents to authenticated;
