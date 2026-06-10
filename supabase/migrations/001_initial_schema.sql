-- Drop old tables first
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS purposes CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Funds table
create table public.funds (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transactions table
create table public.transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  narration text not null,
  amount numeric not null,
  purpose_id text not null,
  date date not null,
  party_id text,
  fund_id text,
  from_fund_id text,
  to_fund_id text,
  linked_to text,
  status text check (status in ('completed', 'pending', 'partial')),
  is_passthrough boolean default false,
  prospect_type text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  expected_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purposes table
create table public.purposes (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null,
  account_type text not null,
  aliases text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Parties table
create table public.parties (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null,
  aliases text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Settings table
create table public.settings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  profile jsonb default '{}',
  recurring jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.funds enable row level security;
alter table public.transactions enable row level security;
alter table public.purposes enable row level security;
alter table public.parties enable row level security;
alter table public.settings enable row level security;

-- Policies for funds
create policy "Users can view own funds"
  on public.funds for select
  using (auth.uid() = user_id);

create policy "Users can insert own funds"
  on public.funds for insert
  with check (auth.uid() = user_id);

create policy "Users can update own funds"
  on public.funds for update
  using (auth.uid() = user_id);

create policy "Users can delete own funds"
  on public.funds for delete
  using (auth.uid() = user_id);

-- Policies for transactions
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Policies for purposes
create policy "Users can view own purposes"
  on public.purposes for select
  using (auth.uid() = user_id);

create policy "Users can insert own purposes"
  on public.purposes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own purposes"
  on public.purposes for update
  using (auth.uid() = user_id);

create policy "Users can delete own purposes"
  on public.purposes for delete
  using (auth.uid() = user_id);

-- Policies for parties
create policy "Users can view own parties"
  on public.parties for select
  using (auth.uid() = user_id);

create policy "Users can insert own parties"
  on public.parties for insert
  with check (auth.uid() = user_id);

create policy "Users can update own parties"
  on public.parties for update
  using (auth.uid() = user_id);

create policy "Users can delete own parties"
  on public.parties for delete
  using (auth.uid() = user_id);

-- Policies for settings
create policy "Users can view own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on public.settings for delete
  using (auth.uid() = user_id);

-- Indexes for sync
create index idx_funds_updated_at on public.funds(updated_at);
create index idx_funds_user_id on public.funds(user_id);
create index idx_transactions_updated_at on public.transactions(updated_at);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_purposes_updated_at on public.purposes(updated_at);
create index idx_purposes_user_id on public.purposes(user_id);
create index idx_parties_updated_at on public.parties(updated_at);
create index idx_parties_user_id on public.parties(user_id);
create index idx_settings_user_id on public.settings(user_id);
