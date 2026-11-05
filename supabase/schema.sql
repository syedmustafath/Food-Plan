-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
-- Personal single-user app: no accounts. The anon key can read/write these two tables.

create table if not exists public.log_entries (
  day     date primary key,
  basics  text[] not null default '{}',
  plan    text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_ticks (
  item_id text primary key
);

alter table public.log_entries enable row level security;
alter table public.shop_ticks  enable row level security;

drop policy if exists "anon all" on public.log_entries;
drop policy if exists "anon all" on public.shop_ticks;
create policy "anon all" on public.log_entries for all to anon using (true) with check (true);
create policy "anon all" on public.shop_ticks  for all to anon using (true) with check (true);

-- Live sync across devices
alter publication supabase_realtime add table public.log_entries;
alter publication supabase_realtime add table public.shop_ticks;
