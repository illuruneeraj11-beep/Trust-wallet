create extension if not exists pgcrypto;

create table if not exists public.mock_wallet_assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  decimals integer not null default 2 check (decimals >= 0 and decimals <= 18),
  icon_key text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#0500e8',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mock_wallet_balances (
  wallet_id uuid not null references public.mock_wallets(id) on delete cascade,
  asset_id uuid not null references public.mock_wallet_assets(id) on delete restrict,
  amount numeric(28, 8) not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now(),
  primary key (wallet_id, asset_id)
);

create table if not exists public.mock_wallet_funding_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.mock_wallets(id) on delete cascade,
  asset_id uuid not null references public.mock_wallet_assets(id) on delete restrict,
  amount numeric(28, 8) not null check (amount > 0),
  dummy_card_brand text not null default 'Demo Card',
  dummy_card_last4 text not null check (dummy_card_last4 ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.mock_wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_wallet_id uuid not null references public.mock_wallets(id) on delete cascade,
  to_wallet_id uuid not null references public.mock_wallets(id) on delete cascade,
  asset_id uuid not null references public.mock_wallet_assets(id) on delete restrict,
  amount numeric(28, 8) not null check (amount > 0),
  note text,
  status text not null default 'completed' check (status in ('completed', 'failed')),
  created_at timestamptz not null default now(),
  check (from_wallet_id <> to_wallet_id)
);

create index if not exists mock_wallets_owner_idx on public.mock_wallets(owner_id, sort_order, created_at);
create index if not exists mock_wallet_balances_wallet_idx on public.mock_wallet_balances(wallet_id);
create index if not exists mock_wallet_transfers_owner_idx on public.mock_wallet_transfers(owner_id, created_at desc);
create index if not exists mock_wallet_funding_owner_idx on public.mock_wallet_funding_events(owner_id, created_at desc);

create or replace function public.touch_mock_wallet_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_mock_wallets_updated_at on public.mock_wallets;
create trigger touch_mock_wallets_updated_at
before update on public.mock_wallets
for each row execute function public.touch_mock_wallet_updated_at();

insert into public.mock_wallet_assets (symbol, name, decimals, icon_key, display_order)
values
  ('USD', 'US Dollar Demo Balance', 2, 'usd', 1),
  ('TWT', 'Trust Wallet Token', 8, 'twt', 2),
  ('BNB', 'BNB Smart Chain', 8, 'bnb', 3),
  ('ETH', 'Ethereum', 8, 'eth', 4),
  ('SOL', 'Solana', 8, 'sol', 5)
on conflict (symbol) do update set
  name = excluded.name,
  decimals = excluded.decimals,
  icon_key = excluded.icon_key,
  display_order = excluded.display_order;

alter table public.mock_wallet_assets enable row level security;
alter table public.mock_wallets enable row level security;
alter table public.mock_wallet_balances enable row level security;
alter table public.mock_wallet_funding_events enable row level security;
alter table public.mock_wallet_transfers enable row level security;

drop policy if exists "assets readable by authenticated users" on public.mock_wallet_assets;
create policy "assets readable by authenticated users"
on public.mock_wallet_assets for select
to authenticated
using (true);

drop policy if exists "wallets owned by user" on public.mock_wallets;
create policy "wallets owned by user"
on public.mock_wallets for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "balances readable for owned wallets" on public.mock_wallet_balances;
create policy "balances readable for owned wallets"
on public.mock_wallet_balances for select
to authenticated
using (
  exists (
    select 1 from public.mock_wallets w
    where w.id = wallet_id and w.owner_id = auth.uid()
  )
);

drop policy if exists "funding events owned by user" on public.mock_wallet_funding_events;
create policy "funding events owned by user"
on public.mock_wallet_funding_events for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "transfers owned by user" on public.mock_wallet_transfers;
create policy "transfers owned by user"
on public.mock_wallet_transfers for select
to authenticated
using (owner_id = auth.uid());

create or replace function public.create_mock_wallet(p_name text default 'Main Wallet 1')
returns public.mock_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.mock_wallets;
  v_owner uuid := auth.uid();
begin
  if v_owner is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.mock_wallets (owner_id, name, sort_order)
  values (
    v_owner,
    coalesce(nullif(trim(p_name), ''), 'Main Wallet 1'),
    (select coalesce(max(sort_order), -1) + 1 from public.mock_wallets where owner_id = v_owner)
  )
  returning * into v_wallet;

  insert into public.mock_wallet_balances (wallet_id, asset_id, amount)
  select v_wallet.id, id, 0
  from public.mock_wallet_assets
  on conflict do nothing;

  return v_wallet;
end;
$$;

create or replace function public.fund_mock_wallet(
  p_wallet_id uuid,
  p_asset_symbol text,
  p_amount numeric,
  p_dummy_card_last4 text,
  p_dummy_card_brand text default 'Demo Card'
)
returns public.mock_wallet_funding_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_asset_id uuid;
  v_event public.mock_wallet_funding_events;
begin
  if v_owner is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;
  if p_dummy_card_last4 is null or p_dummy_card_last4 !~ '^[0-9]{4}$' then
    raise exception 'Dummy card last4 must be four digits';
  end if;
  if not exists (select 1 from public.mock_wallets where id = p_wallet_id and owner_id = v_owner) then
    raise exception 'Wallet not found';
  end if;

  select id into v_asset_id
  from public.mock_wallet_assets
  where upper(symbol) = upper(p_asset_symbol);

  if v_asset_id is null then
    raise exception 'Asset not found';
  end if;

  insert into public.mock_wallet_balances (wallet_id, asset_id, amount)
  values (p_wallet_id, v_asset_id, p_amount)
  on conflict (wallet_id, asset_id)
  do update set amount = mock_wallet_balances.amount + excluded.amount, updated_at = now();

  insert into public.mock_wallet_funding_events (
    owner_id, wallet_id, asset_id, amount, dummy_card_brand, dummy_card_last4
  )
  values (
    v_owner, p_wallet_id, v_asset_id, p_amount,
    coalesce(nullif(trim(p_dummy_card_brand), ''), 'Demo Card'),
    p_dummy_card_last4
  )
  returning * into v_event;

  return v_event;
end;
$$;

create or replace function public.transfer_between_mock_wallets(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_asset_symbol text,
  p_amount numeric,
  p_note text default null
)
returns public.mock_wallet_transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_asset_id uuid;
  v_current_amount numeric(28, 8);
  v_transfer public.mock_wallet_transfers;
begin
  if v_owner is null then
    raise exception 'Not authenticated';
  end if;
  if p_from_wallet_id = p_to_wallet_id then
    raise exception 'Choose two different wallets';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;
  if not exists (select 1 from public.mock_wallets where id = p_from_wallet_id and owner_id = v_owner) then
    raise exception 'Source wallet not found';
  end if;
  if not exists (select 1 from public.mock_wallets where id = p_to_wallet_id and owner_id = v_owner) then
    raise exception 'Destination wallet not found';
  end if;

  select id into v_asset_id
  from public.mock_wallet_assets
  where upper(symbol) = upper(p_asset_symbol);

  if v_asset_id is null then
    raise exception 'Asset not found';
  end if;

  insert into public.mock_wallet_balances (wallet_id, asset_id, amount)
  values (p_from_wallet_id, v_asset_id, 0)
  on conflict do nothing;

  select amount into v_current_amount
  from public.mock_wallet_balances
  where wallet_id = p_from_wallet_id and asset_id = v_asset_id
  for update;

  if coalesce(v_current_amount, 0) < p_amount then
    raise exception 'Insufficient balance';
  end if;

  update public.mock_wallet_balances
  set amount = amount - p_amount, updated_at = now()
  where wallet_id = p_from_wallet_id and asset_id = v_asset_id;

  insert into public.mock_wallet_balances (wallet_id, asset_id, amount)
  values (p_to_wallet_id, v_asset_id, p_amount)
  on conflict (wallet_id, asset_id)
  do update set amount = mock_wallet_balances.amount + excluded.amount, updated_at = now();

  insert into public.mock_wallet_transfers (
    owner_id, from_wallet_id, to_wallet_id, asset_id, amount, note
  )
  values (
    v_owner, p_from_wallet_id, p_to_wallet_id, v_asset_id, p_amount, p_note
  )
  returning * into v_transfer;

  return v_transfer;
end;
$$;

grant execute on function public.create_mock_wallet(text) to authenticated;
grant execute on function public.fund_mock_wallet(uuid, text, numeric, text, text) to authenticated;
grant execute on function public.transfer_between_mock_wallets(uuid, uuid, text, numeric, text) to authenticated;
