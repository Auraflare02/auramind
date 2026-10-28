-- ============================================================
-- AuraMind Google Calendar Integration Schema
-- Migration: 20261027_google_calendar.sql
-- ============================================================

-- 1. Table for securely storing user calendar connections
create table if not exists public.user_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  google_email text,
  google_account_id text,
  encrypted_refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  calendar_id text not null default 'primary',
  auto_sync boolean not null default true,
  sync_deletions boolean not null default false,
  last_synced_at timestamptz,
  sync_status text not null default 'connected', -- 'connected' | 'syncing' | 'synced' | 'error' | 'disconnected'
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for connection lookups
create index if not exists idx_calendar_conn_user on public.user_calendar_connections(user_id);
create index if not exists idx_calendar_conn_status on public.user_calendar_connections(sync_status);

-- 2. Table for tracking synced calendar events (guarantees idempotency and prevents duplicates)
create table if not exists public.auramind_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null references public.requests(id) on delete cascade,
  day int not null,
  block_index int not null,
  task_activity text not null,
  google_calendar_id text not null default 'primary',
  google_event_id text not null,
  event_start timestamptz not null,
  event_end timestamptz not null,
  sync_hash text,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint uq_request_day_block unique(request_id, day, block_index)
);

-- Indexes for event lookups
create index if not exists idx_calendar_events_user on public.auramind_calendar_events(user_id);
create index if not exists idx_calendar_events_req on public.auramind_calendar_events(request_id);
create index if not exists idx_calendar_events_google on public.auramind_calendar_events(google_event_id);

-- 3. Row-Level Security
alter table public.user_calendar_connections enable row level security;
alter table public.auramind_calendar_events enable row level security;

-- Drop previous policies to allow idempotent execution
drop policy if exists "Users can view own calendar connection" on public.user_calendar_connections;
drop policy if exists "Users can update own calendar connection" on public.user_calendar_connections;
drop policy if exists "Users can delete own calendar connection" on public.user_calendar_connections;
drop policy if exists "Service role full access to user_calendar_connections" on public.user_calendar_connections;

drop policy if exists "Users can view own calendar events" on public.auramind_calendar_events;
drop policy if exists "Users can delete own calendar events" on public.auramind_calendar_events;
drop policy if exists "Service role full access to auramind_calendar_events" on public.auramind_calendar_events;

-- Policies for user_calendar_connections
create policy "Users can view own calendar connection"
  on public.user_calendar_connections for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own calendar connection"
  on public.user_calendar_connections for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own calendar connection"
  on public.user_calendar_connections for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role full access to user_calendar_connections"
  on public.user_calendar_connections for all
  to service_role
  using (true)
  with check (true);

-- Policies for auramind_calendar_events
create policy "Users can view own calendar events"
  on public.auramind_calendar_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own calendar events"
  on public.auramind_calendar_events for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role full access to auramind_calendar_events"
  on public.auramind_calendar_events for all
  to service_role
  using (true)
  with check (true);

-- 4. Schema Permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on public.user_calendar_connections to service_role;
grant all on public.auramind_calendar_events to service_role;
grant select, update, delete on public.user_calendar_connections to authenticated;
grant select, delete on public.auramind_calendar_events to authenticated;
