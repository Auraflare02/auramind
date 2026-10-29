-- =========================================================================
-- AURAMIND LIVE CHAT SYSTEM MIGRATION
-- Adds:
-- 1. auramind_world_messages (World Live Chat for everyone in the community)
-- 2. auramind_direct_messages (1-on-1 Live Private Chat between friends)
-- =========================================================================

-- 1. WORLD LIVE CHAT TABLE
create table if not exists public.auramind_world_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0 and char_length(message) <= 2000),
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Index for speedy chronological pagination & polling
create index if not exists idx_world_messages_created_at
  on public.auramind_world_messages (created_at desc);

create index if not exists idx_world_messages_user_id
  on public.auramind_world_messages (user_id);

-- Enable Row Level Security
alter table public.auramind_world_messages enable row level security;

-- Policies for world messages
create policy "World messages are viewable by authenticated users"
  on public.auramind_world_messages for select
  to authenticated
  using (true);

create policy "Authenticated users can post world messages"
  on public.auramind_world_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Service role has full access to world messages"
  on public.auramind_world_messages for all
  to service_role
  using (true)
  with check (true);


-- 2. PRIVATE DIRECT CHAT TABLE
create table if not exists public.auramind_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0 and char_length(message) <= 2000),
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint check_dm_participants_distinct check (sender_id != recipient_id)
);

-- Indexes for conversation fetching, unread counters, and chronological order
create index if not exists idx_dm_pair_chronological
  on public.auramind_direct_messages (sender_id, recipient_id, created_at desc);

create index if not exists idx_dm_recipient_unread
  on public.auramind_direct_messages (recipient_id, is_read, created_at desc);

-- Enable Row Level Security
alter table public.auramind_direct_messages enable row level security;

-- Policies for direct messages
create policy "Users can view direct messages they sent or received"
  on public.auramind_direct_messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can send direct messages as sender"
  on public.auramind_direct_messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "Users can update read status of incoming messages"
  on public.auramind_direct_messages for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "Service role has full access to direct messages"
  on public.auramind_direct_messages for all
  to service_role
  using (true)
  with check (true);
