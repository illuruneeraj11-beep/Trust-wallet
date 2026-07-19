-- Professional, centralized demo-wallet ledger.
--
-- This migration is intentionally additive: it preserves every legacy row while
-- removing legacy client access and Realtime publication. The authoritative
-- ledger lives in the unexposed demo_ledger schema. Expo uses only the nine
-- hardened JSON RPC functions created at the end of this file.
--
-- Amount contract: every client amount is a base-10 integer string. PostgreSQL
-- stores it as numeric(78,0); JSON responses serialize all unit amounts as text.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Phase 0: contain legacy objects without deleting data.
-- ---------------------------------------------------------------------------

do $contain_legacy$
declare
  v_table text;
  v_policy record;
begin
  foreach v_table in array array[
    'wallets',
    'transactions',
    'networks',
    'assets',
    'user_balances',
    'wallet_transactions',
    'user_wallets',
    'app_config',
    'mock_wallet_assets',
    'mock_wallets',
    'mock_wallet_balances',
    'mock_wallet_funding_events',
    'mock_wallet_transfers'
  ]
  loop
    if pg_catalog.to_regclass(pg_catalog.format('public.%I', v_table)) is not null then
      execute pg_catalog.format('alter table public.%I enable row level security', v_table);
      execute pg_catalog.format(
        'revoke all privileges on table public.%I from public, anon, authenticated, service_role',
        v_table
      );

      for v_policy in
        select p.policyname
        from pg_catalog.pg_policies p
        where p.schemaname = 'public'
          and p.tablename = v_table
      loop
        execute pg_catalog.format(
          'drop policy %I on public.%I',
          v_policy.policyname,
          v_table
        );
      end loop;

      if exists (
        select 1
        from pg_catalog.pg_publication_tables pt
        where pt.pubname = 'supabase_realtime'
          and pt.schemaname = 'public'
          and pt.tablename = v_table
      ) then
        execute pg_catalog.format(
          'alter publication supabase_realtime drop table public.%I',
          v_table
        );
      end if;
    end if;
  end loop;
end;
$contain_legacy$;

do $harden_legacy_functions$
declare
  v_function regprocedure;
begin
  foreach v_function in array array[
    pg_catalog.to_regprocedure('public.create_mock_wallet(text)'),
    pg_catalog.to_regprocedure('public.fund_mock_wallet(uuid,text,numeric,text,text)'),
    pg_catalog.to_regprocedure('public.transfer_between_mock_wallets(uuid,uuid,text,numeric,text)'),
    pg_catalog.to_regprocedure('public.recalc_wallet_total()'),
    pg_catalog.to_regprocedure('public.touch_mock_wallet_updated_at()')
  ]
  loop
    if v_function is not null then
      execute pg_catalog.format(
        'revoke all privileges on function %s from public, anon, authenticated, service_role',
        v_function
      );
      execute pg_catalog.format(
        'alter function %s set search_path = pg_catalog, public',
        v_function
      );
    end if;
  end loop;
end;
$harden_legacy_functions$;

-- ---------------------------------------------------------------------------
-- Isolated authoritative schema.
-- ---------------------------------------------------------------------------

create schema demo_ledger;

revoke all privileges on schema demo_ledger from public, anon, authenticated;
grant usage on schema demo_ledger to service_role;

create table demo_ledger.profiles (
  -- Financial history is intentionally retained. Deleting an Auth user with
  -- posted history must go through a future anonymization workflow rather than
  -- cascading away journal ownership.
  user_id uuid primary key references auth.users(id) on delete restrict,
  handle text not null,
  display_name text not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint profiles_handle_format check (
    handle = pg_catalog.lower(handle)
    and handle ~ '^[a-z][a-z0-9_]{2,29}$'
  ),
  constraint profiles_display_name_length check (
    pg_catalog.char_length(display_name) between 1 and 80
  )
);

create unique index profiles_handle_unique_idx
  on demo_ledger.profiles (pg_catalog.lower(handle));

create table demo_ledger.networks (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  address_prefix text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default pg_catalog.now(),
  constraint networks_slug_format check (slug ~ '^[a-z][a-z0-9-]{1,31}$'),
  constraint networks_address_prefix_format check (
    address_prefix = 'demo:' || slug || ':'
  )
);

create table demo_ledger.assets (
  id uuid primary key,
  network_id uuid not null references demo_ledger.networks(id) on delete restrict,
  asset_code text not null unique,
  symbol text not null,
  name text not null,
  decimals integer not null,
  is_native boolean not null default false,
  contract_identifier text,
  icon_key text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default pg_catalog.now(),
  constraint assets_code_format check (asset_code ~ '^[A-Z][A-Z0-9_]{1,31}$'),
  constraint assets_symbol_format check (symbol ~ '^[A-Z0-9]{2,12}$'),
  constraint assets_decimals_range check (decimals between 0 and 36),
  constraint assets_native_contract check (
    (is_native and contract_identifier is null)
    or (not is_native and contract_identifier is not null)
  ),
  unique (network_id, contract_identifier)
);

create unique index assets_one_native_per_network_idx
  on demo_ledger.assets (network_id)
  where is_native;

create table demo_ledger.wallets (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  color text not null default '#0500e8',
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint wallets_name_length check (pg_catalog.char_length(name) between 1 and 80),
  constraint wallets_color_format check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint wallets_archive_consistency check (
    (is_archived and archived_at is not null)
    or (not is_archived and archived_at is null)
  ),
  unique (id, owner_id)
);

create index wallets_owner_order_idx
  on demo_ledger.wallets (owner_id, is_archived, sort_order, created_at);

create table demo_ledger.wallet_addresses (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  wallet_id uuid not null references demo_ledger.wallets(id) on delete restrict,
  network_id uuid not null references demo_ledger.networks(id) on delete restrict,
  address text not null,
  created_at timestamptz not null default pg_catalog.now(),
  unique (wallet_id, network_id),
  unique (network_id, address)
);

create index wallet_addresses_address_idx
  on demo_ledger.wallet_addresses (address);

create table demo_ledger.ledger_accounts (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  wallet_id uuid,
  owner_id uuid,
  asset_id uuid not null references demo_ledger.assets(id) on delete restrict,
  account_kind text not null,
  system_key text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint ledger_accounts_wallet_owner_fk
    foreign key (wallet_id, owner_id)
    references demo_ledger.wallets(id, owner_id)
    on delete restrict,
  constraint ledger_accounts_kind_check check (
    (
      account_kind = 'user_asset'
      and wallet_id is not null
      and owner_id is not null
      and system_key is null
    )
    or (
      account_kind in ('demo_issuer', 'fee_collector', 'opening_equity')
      and wallet_id is null
      and owner_id is null
      and system_key is not null
    )
  ),
  unique (id, asset_id)
);

create unique index ledger_accounts_wallet_asset_unique_idx
  on demo_ledger.ledger_accounts (wallet_id, asset_id)
  where wallet_id is not null;

create unique index ledger_accounts_system_asset_unique_idx
  on demo_ledger.ledger_accounts (system_key, asset_id)
  where wallet_id is null;

create index ledger_accounts_owner_idx
  on demo_ledger.ledger_accounts (owner_id, wallet_id, asset_id)
  where owner_id is not null;

create table demo_ledger.account_balances (
  account_id uuid primary key,
  asset_id uuid not null,
  posted_units numeric(78, 0) not null default 0,
  held_units numeric(78, 0) not null default 0,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint account_balances_account_asset_fk
    foreign key (account_id, asset_id)
    references demo_ledger.ledger_accounts(id, asset_id)
    on delete restrict,
  constraint account_balances_held_nonnegative check (held_units >= 0)
);

create table demo_ledger.recipient_tokens (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_wallet_id uuid not null references demo_ledger.wallets(id) on delete restrict,
  wallet_address_id uuid not null references demo_ledger.wallet_addresses(id) on delete restrict,
  network_id uuid not null references demo_ledger.networks(id) on delete restrict,
  expires_at timestamptz not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint recipient_tokens_expiry check (expires_at > created_at)
);

create index recipient_tokens_requester_expiry_idx
  on demo_ledger.recipient_tokens (requester_id, expires_at desc);

create table demo_ledger.transfer_quotes (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  from_wallet_id uuid not null references demo_ledger.wallets(id) on delete restrict,
  recipient_wallet_id uuid not null references demo_ledger.wallets(id) on delete restrict,
  wallet_address_id uuid not null references demo_ledger.wallet_addresses(id) on delete restrict,
  asset_id uuid not null references demo_ledger.assets(id) on delete restrict,
  amount_units numeric(78, 0) not null,
  fee_asset_id uuid references demo_ledger.assets(id) on delete restrict,
  fee_units numeric(78, 0) not null default 0,
  expires_at timestamptz not null,
  used_transaction_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  constraint transfer_quotes_wallets_differ check (from_wallet_id <> recipient_wallet_id),
  constraint transfer_quotes_amount_positive check (amount_units > 0),
  constraint transfer_quotes_fee_nonnegative check (fee_units >= 0),
  constraint transfer_quotes_fee_asset_consistency check (
    (fee_units = 0 and fee_asset_id is null)
    or (fee_units > 0 and fee_asset_id is not null)
  ),
  constraint transfer_quotes_expiry check (expires_at > created_at)
);

create index transfer_quotes_requester_expiry_idx
  on demo_ledger.transfer_quotes (requester_id, expires_at desc);

create table demo_ledger.transactions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  kind text not null,
  status text not null,
  asset_id uuid not null references demo_ledger.assets(id) on delete restrict,
  amount_units numeric(78, 0) not null,
  fee_asset_id uuid references demo_ledger.assets(id) on delete restrict,
  fee_units numeric(78, 0) not null default 0,
  sender_wallet_id uuid references demo_ledger.wallets(id) on delete restrict,
  recipient_wallet_id uuid references demo_ledger.wallets(id) on delete restrict,
  quote_id uuid unique references demo_ledger.transfer_quotes(id) on delete restrict,
  reverses_transaction_id uuid unique references demo_ledger.transactions(id) on delete restrict,
  mock_hash text not null unique,
  note text,
  created_at timestamptz not null default pg_catalog.now(),
  confirmed_at timestamptz,
  constraint transactions_kind_check check (
    kind in ('funding', 'transfer', 'opening_balance', 'reversal')
  ),
  constraint transactions_status_check check (
    status in ('submitted', 'pending', 'confirmed', 'failed', 'expired', 'reversed')
  ),
  constraint transactions_amount_positive check (amount_units > 0),
  constraint transactions_fee_nonnegative check (fee_units >= 0),
  constraint transactions_fee_asset_consistency check (
    (fee_units = 0 and fee_asset_id is null)
    or (fee_units > 0 and fee_asset_id is not null)
  ),
  constraint transactions_mock_hash_format check (mock_hash ~ '^demo_[0-9a-f]{64}$'),
  constraint transactions_note_length check (
    note is null or pg_catalog.char_length(note) <= 280
  ),
  constraint transactions_confirmed_time check (
    (status = 'confirmed' and confirmed_at is not null)
    or (status <> 'confirmed' and confirmed_at is null)
  ),
  constraint transactions_shape check (
    (
      kind in ('funding', 'opening_balance')
      and sender_wallet_id is null
      and recipient_wallet_id is not null
    )
    or (
      kind = 'transfer'
      and sender_wallet_id is not null
      and recipient_wallet_id is not null
      and sender_wallet_id <> recipient_wallet_id
    )
    or (kind = 'reversal' and reverses_transaction_id is not null)
  )
);

alter table demo_ledger.transfer_quotes
  add constraint transfer_quotes_used_transaction_fk
  foreign key (used_transaction_id)
  references demo_ledger.transactions(id)
  on delete restrict;

create index transactions_created_idx
  on demo_ledger.transactions (created_at desc, id);

create index transactions_sender_idx
  on demo_ledger.transactions (sender_wallet_id, created_at desc)
  where sender_wallet_id is not null;

create index transactions_recipient_idx
  on demo_ledger.transactions (recipient_wallet_id, created_at desc)
  where recipient_wallet_id is not null;

create table demo_ledger.transaction_participants (
  transaction_id uuid not null references demo_ledger.transactions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  wallet_id uuid not null,
  direction text not null,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (transaction_id, user_id),
  constraint transaction_participants_wallet_owner_fk
    foreign key (wallet_id, user_id)
    references demo_ledger.wallets(id, owner_id)
    on delete restrict,
  constraint transaction_participants_direction_check check (
    direction in ('incoming', 'outgoing')
  )
);

create index transaction_participants_user_activity_idx
  on demo_ledger.transaction_participants (user_id, created_at desc, transaction_id);

create table demo_ledger.transaction_status_events (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  transaction_id uuid not null references demo_ledger.transactions(id) on delete restrict,
  event_index smallint not null,
  status text not null,
  reason text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint transaction_status_events_status_check check (
    status in ('submitted', 'pending', 'confirmed', 'failed', 'expired', 'reversed')
  ),
  constraint transaction_status_events_index_positive check (event_index > 0),
  constraint transaction_status_events_reason_length check (
    reason is null or pg_catalog.char_length(reason) <= 280
  ),
  unique (transaction_id, event_index)
);

create index transaction_status_events_transaction_idx
  on demo_ledger.transaction_status_events (transaction_id, created_at, id);

create table demo_ledger.journal_entries (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  transaction_id uuid not null references demo_ledger.transactions(id) on delete restrict,
  account_id uuid not null,
  asset_id uuid not null,
  amount_units numeric(78, 0) not null,
  entry_kind text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint journal_entries_account_asset_fk
    foreign key (account_id, asset_id)
    references demo_ledger.ledger_accounts(id, asset_id)
    on delete restrict,
  constraint journal_entries_nonzero check (amount_units <> 0),
  constraint journal_entries_kind_check check (
    entry_kind in ('funding', 'transfer', 'fee', 'opening_balance', 'reversal')
  ),
  unique (transaction_id, account_id, entry_kind)
);

create index journal_entries_transaction_asset_idx
  on demo_ledger.journal_entries (transaction_id, asset_id);

create index journal_entries_account_idx
  on demo_ledger.journal_entries (account_id, created_at, id);

create table demo_ledger.account_holds (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  transaction_id uuid not null references demo_ledger.transactions(id) on delete restrict,
  account_id uuid not null,
  asset_id uuid not null,
  amount_units numeric(78, 0) not null,
  status text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default pg_catalog.now(),
  resolved_at timestamptz,
  constraint account_holds_account_asset_fk
    foreign key (account_id, asset_id)
    references demo_ledger.ledger_accounts(id, asset_id)
    on delete restrict,
  constraint account_holds_amount_positive check (amount_units > 0),
  constraint account_holds_status_check check (
    status in ('open', 'captured', 'released', 'expired')
  ),
  constraint account_holds_resolution_check check (
    (status = 'open' and resolved_at is null)
    or (status <> 'open' and resolved_at is not null)
  ),
  unique (transaction_id, account_id, asset_id)
);

create index account_holds_open_expiry_idx
  on demo_ledger.account_holds (expires_at)
  where status = 'open';

create table demo_ledger.idempotency_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  state text not null default 'started',
  transaction_id uuid references demo_ledger.transactions(id) on delete restrict,
  response jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz,
  primary key (user_id, operation, idempotency_key),
  constraint idempotency_key_format check (
    pg_catalog.char_length(idempotency_key) between 8 and 200
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  ),
  constraint idempotency_request_hash_format check (request_hash ~ '^[0-9a-f]{64}$'),
  constraint idempotency_state_check check (state in ('started', 'completed')),
  constraint idempotency_completion_check check (
    (state = 'started' and response is null and completed_at is null)
    or (state = 'completed' and response is not null and completed_at is not null)
  )
);

create table demo_ledger.outbox_events (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  transaction_id uuid references demo_ledger.transactions(id) on delete restrict,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint outbox_events_type_check check (
    event_type in ('account_bootstrapped', 'wallet_created', 'funding_confirmed', 'transfer_confirmed')
  )
);

create index outbox_events_user_created_idx
  on demo_ledger.outbox_events (user_id, created_at desc, id);

create table demo_ledger.audit_events (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint audit_events_event_type_length check (
    pg_catalog.char_length(event_type) between 1 and 80
  ),
  constraint audit_events_entity_type_length check (
    pg_catalog.char_length(entity_type) between 1 and 80
  )
);

create table demo_ledger.address_book_entries (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  wallet_address_id uuid not null references demo_ledger.wallet_addresses(id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  constraint address_book_entries_label_length check (
    pg_catalog.char_length(label) between 1 and 80
  ),
  unique (owner_id, wallet_address_id)
);

-- Supabase owns realtime.messages, so project migrations cannot safely add
-- Broadcast authorization policies there. This minimal public mirror uses
-- ordinary table RLS and Postgres Changes instead. It contains invalidation
-- identifiers only; portfolio/activity RPCs remain the source of truth.
create table public.demo_wallet_notifications (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  transaction_id uuid references demo_ledger.transactions(id) on delete cascade,
  created_at timestamptz not null default pg_catalog.now(),
  constraint demo_wallet_notifications_type_check check (
    event_type in ('account_bootstrapped', 'wallet_created', 'funding_confirmed', 'transfer_confirmed')
  )
);

create index demo_wallet_notifications_owner_created_idx
  on public.demo_wallet_notifications (owner_id, created_at desc, id);

comment on table public.demo_wallet_notifications is
  'RLS-protected, append-only Postgres Changes invalidations; contains no balances or secrets.';

-- Stable catalog IDs make app fixtures and SQL verification deterministic.
insert into demo_ledger.networks (id, slug, name, address_prefix, display_order)
values
  ('10000000-0000-4000-8000-000000000000', 'demo', 'Demo Dollar Network', 'demo:demo:', 1),
  ('10000000-0000-4000-8000-000000000001', 'bitcoin', 'Bitcoin', 'demo:bitcoin:', 10),
  ('10000000-0000-4000-8000-000000000002', 'ethereum', 'Ethereum', 'demo:ethereum:', 20),
  ('10000000-0000-4000-8000-000000000003', 'bsc', 'BNB Smart Chain', 'demo:bsc:', 30),
  ('10000000-0000-4000-8000-000000000004', 'solana', 'Solana', 'demo:solana:', 40),
  ('10000000-0000-4000-8000-000000000005', 'tron', 'Tron', 'demo:tron:', 50);

insert into demo_ledger.assets (
  id,
  network_id,
  asset_code,
  symbol,
  name,
  decimals,
  is_native,
  contract_identifier,
  icon_key,
  display_order
)
values
  ('20000000-0000-4000-8000-000000000000', '10000000-0000-4000-8000-000000000000', 'USD', 'USD', 'US Dollar Demo Balance', 2, true, null, 'usd', 1),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'BTC', 'BTC', 'Bitcoin', 8, true, null, 'btc', 10),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'ETH', 'ETH', 'Ethereum', 18, true, null, 'eth', 20),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'BNB', 'BNB', 'BNB Smart Chain', 18, true, null, 'bnb', 30),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'SOL', 'SOL', 'Solana', 9, true, null, 'sol', 40),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 'TRX', 'TRX', 'Tron', 6, true, null, 'trx', 50),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 'TWT', 'TWT', 'Trust Wallet Token', 18, false, 'bep20:demo-twt', 'twt', 60),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'ETH_USDT', 'USDT', 'Tether USD (Ethereum Demo)', 6, false, 'erc20:demo-usdt', 'usdt', 70),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', 'ETH_USDC', 'USDC', 'USD Coin (Ethereum Demo)', 6, false, 'erc20:demo-usdc', 'usdc', 80),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'BSC_USDT', 'USDT', 'Tether USD (BNB Demo)', 18, false, 'bep20:demo-usdt', 'usdt', 90),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000004', 'SOL_USDC', 'USDC', 'USD Coin (Solana Demo)', 6, false, 'spl:demo-usdc', 'usdc', 100),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000005', 'TRON_USDT', 'USDT', 'Tether USD (Tron Demo)', 6, false, 'trc20:demo-usdt', 'usdt', 110);

-- ---------------------------------------------------------------------------
-- RLS and role grants. The schema is not exposed through the Data API; these
-- policies are defense in depth. Client reads and writes go through RPC only.
-- ---------------------------------------------------------------------------

alter table demo_ledger.profiles enable row level security;
alter table demo_ledger.networks enable row level security;
alter table demo_ledger.assets enable row level security;
alter table demo_ledger.wallets enable row level security;
alter table demo_ledger.wallet_addresses enable row level security;
alter table demo_ledger.ledger_accounts enable row level security;
alter table demo_ledger.account_balances enable row level security;
alter table demo_ledger.recipient_tokens enable row level security;
alter table demo_ledger.transfer_quotes enable row level security;
alter table demo_ledger.transactions enable row level security;
alter table demo_ledger.transaction_participants enable row level security;
alter table demo_ledger.transaction_status_events enable row level security;
alter table demo_ledger.journal_entries enable row level security;
alter table demo_ledger.account_holds enable row level security;
alter table demo_ledger.idempotency_requests enable row level security;
alter table demo_ledger.outbox_events enable row level security;
alter table demo_ledger.audit_events enable row level security;
alter table demo_ledger.address_book_entries enable row level security;
alter table public.demo_wallet_notifications enable row level security;

create policy "catalog networks are readable by signed in users"
on demo_ledger.networks for select to authenticated
using ((select auth.uid()) is not null and is_active);

create policy "catalog assets are readable by signed in users"
on demo_ledger.assets for select to authenticated
using ((select auth.uid()) is not null and is_active);

create policy "users can read their own demo profile"
on demo_ledger.profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read their own demo wallets"
on demo_ledger.wallets for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "users can read addresses for their own demo wallets"
on demo_ledger.wallet_addresses for select to authenticated
using (
  exists (
    select 1
    from demo_ledger.wallets w
    where w.id = wallet_addresses.wallet_id
      and w.owner_id = (select auth.uid())
  )
);

create policy "users can read their own demo ledger accounts"
on demo_ledger.ledger_accounts for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "users can read their own demo account balances"
on demo_ledger.account_balances for select to authenticated
using (
  exists (
    select 1
    from demo_ledger.ledger_accounts la
    where la.id = account_balances.account_id
      and la.owner_id = (select auth.uid())
  )
);

create policy "users can read their own recipient tokens"
on demo_ledger.recipient_tokens for select to authenticated
using ((select auth.uid()) = requester_id);

create policy "users can read their own transfer quotes"
on demo_ledger.transfer_quotes for select to authenticated
using ((select auth.uid()) = requester_id);

create policy "participants can read shared demo transactions"
on demo_ledger.transactions for select to authenticated
using (
  exists (
    select 1
    from demo_ledger.transaction_participants tp
    where tp.transaction_id = transactions.id
      and tp.user_id = (select auth.uid())
  )
);

create policy "users can read their own transaction participation"
on demo_ledger.transaction_participants for select to authenticated
using ((select auth.uid()) = user_id);

create policy "participants can read demo transaction status events"
on demo_ledger.transaction_status_events for select to authenticated
using (
  exists (
    select 1
    from demo_ledger.transaction_participants tp
    where tp.transaction_id = transaction_status_events.transaction_id
      and tp.user_id = (select auth.uid())
  )
);

create policy "participants can read demo journal entries"
on demo_ledger.journal_entries for select to authenticated
using (
  exists (
    select 1
    from demo_ledger.transaction_participants tp
    where tp.transaction_id = journal_entries.transaction_id
      and tp.user_id = (select auth.uid())
  )
);

create policy "users can read their own demo holds"
on demo_ledger.account_holds for select to authenticated
using (
  exists (
    select 1
    from demo_ledger.ledger_accounts la
    where la.id = account_holds.account_id
      and la.owner_id = (select auth.uid())
  )
);

create policy "users can read their own idempotency records"
on demo_ledger.idempotency_requests for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read their own safe outbox events"
on demo_ledger.outbox_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read their own address book"
on demo_ledger.address_book_entries for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "users can read their own demo wallet notifications"
on public.demo_wallet_notifications for select to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
);

revoke all privileges on table public.demo_wallet_notifications
  from public, anon, authenticated, service_role;
grant select on table public.demo_wallet_notifications
  to authenticated, service_role;

revoke all privileges on all tables in schema demo_ledger
  from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema demo_ledger
  to service_role;

alter default privileges for role postgres in schema demo_ledger
  revoke all privileges on tables from public, anon, authenticated;
alter default privileges for role postgres in schema demo_ledger
  revoke all privileges on functions from public, anon, authenticated;
alter default privileges for role postgres in schema demo_ledger
  revoke all privileges on sequences from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Invariants and internal helpers.
-- ---------------------------------------------------------------------------

create function demo_ledger.reject_immutable_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  raise exception '% is append-only', tg_table_name
    using errcode = '55000';
end;
$function$;

create trigger transactions_are_immutable
before update or delete on demo_ledger.transactions
for each row execute function demo_ledger.reject_immutable_mutation();

create trigger participants_are_immutable
before update or delete on demo_ledger.transaction_participants
for each row execute function demo_ledger.reject_immutable_mutation();

create trigger status_events_are_immutable
before update or delete on demo_ledger.transaction_status_events
for each row execute function demo_ledger.reject_immutable_mutation();

create trigger journal_entries_are_immutable
before update or delete on demo_ledger.journal_entries
for each row execute function demo_ledger.reject_immutable_mutation();

create trigger audit_events_are_immutable
before update or delete on demo_ledger.audit_events
for each row execute function demo_ledger.reject_immutable_mutation();

create trigger demo_wallet_notifications_are_immutable
before update or delete on public.demo_wallet_notifications
for each row execute function demo_ledger.reject_immutable_mutation();

create function demo_ledger.validate_posted_transaction()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_transaction_id uuid := coalesce(new.id, old.id);
  v_status text;
begin
  select t.status
  into v_status
  from demo_ledger.transactions t
  where t.id = v_transaction_id;

  if v_status = 'confirmed' then
    if exists (
      select 1
      from demo_ledger.transactions t
      join demo_ledger.wallets sw on sw.id = t.sender_wallet_id
      join demo_ledger.wallets rw on rw.id = t.recipient_wallet_id
      where t.id = v_transaction_id
        and t.kind = 'transfer'
        and sw.owner_id = rw.owner_id
    ) then
      raise exception 'Self-recipient transfers are not supported'
        using errcode = '23514';
    end if;

    if not exists (
      select 1
      from demo_ledger.journal_entries je
      where je.transaction_id = v_transaction_id
    ) then
      raise exception 'Confirmed transaction % has no journal entries', v_transaction_id
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from demo_ledger.journal_entries je
      where je.transaction_id = v_transaction_id
      group by je.asset_id
      having pg_catalog.sum(je.amount_units) <> 0
        or pg_catalog.count(*) < 2
    ) then
      raise exception 'Transaction % is not balanced by asset', v_transaction_id
        using errcode = '23514';
    end if;

    if not exists (
      select 1
      from demo_ledger.transaction_participants tp
      where tp.transaction_id = v_transaction_id
    ) then
      raise exception 'Transaction % has no participant', v_transaction_id
        using errcode = '23514';
    end if;
  end if;

  return null;
end;
$function$;

create constraint trigger transactions_must_balance
after insert on demo_ledger.transactions
deferrable initially deferred
for each row execute function demo_ledger.validate_posted_transaction();

create function demo_ledger.validate_entry_balance()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_transaction_id uuid := coalesce(new.transaction_id, old.transaction_id);
begin
  if exists (
    select 1
    from demo_ledger.journal_entries je
    where je.transaction_id = v_transaction_id
    group by je.asset_id
    having pg_catalog.sum(je.amount_units) <> 0
      or pg_catalog.count(*) < 2
  ) then
    raise exception 'Transaction % is not balanced by asset', v_transaction_id
      using errcode = '23514';
  end if;
  return null;
end;
$function$;

create constraint trigger journal_entries_must_balance
after insert on demo_ledger.journal_entries
deferrable initially deferred
for each row execute function demo_ledger.validate_entry_balance();

create function demo_ledger.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true' then
    raise exception 'Anonymous sessions cannot use the shared demo ledger'
      using errcode = '28000';
  end if;

  return v_user_id;
end;
$function$;

create function demo_ledger.parse_positive_units(p_units text)
returns numeric
language plpgsql
immutable
set search_path = ''
as $function$
declare
  v_units numeric(78, 0);
begin
  if p_units is null
    or p_units !~ '^[1-9][0-9]{0,59}$' then
    raise exception 'Amount must be a positive base-unit integer string with at most 60 digits'
      using errcode = '22023';
  end if;

  v_units := p_units::numeric(78, 0);
  return v_units;
end;
$function$;

create function demo_ledger.sha256_text(p_value text)
returns text
language sql
immutable
set search_path = ''
as $function$
  select pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(p_value, 'UTF8'), 'sha256'),
    'hex'
  )
$function$;

create function demo_ledger.claim_idempotency(
  p_user_id uuid,
  p_operation text,
  p_idempotency_key text,
  p_request_hash text
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_existing demo_ledger.idempotency_requests%rowtype;
begin
  if p_idempotency_key is null
    or pg_catalog.char_length(p_idempotency_key) not between 8 and 200
    or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$' then
    raise exception 'Invalid idempotency key'
      using errcode = '22023';
  end if;

  insert into demo_ledger.idempotency_requests (
    user_id,
    operation,
    idempotency_key,
    request_hash
  )
  values (
    p_user_id,
    p_operation,
    p_idempotency_key,
    p_request_hash
  )
  on conflict (user_id, operation, idempotency_key) do nothing;

  if found then
    return null;
  end if;

  select ir.*
  into v_existing
  from demo_ledger.idempotency_requests ir
  where ir.user_id = p_user_id
    and ir.operation = p_operation
    and ir.idempotency_key = p_idempotency_key
  for update;

  if v_existing.request_hash <> p_request_hash then
    raise exception 'Idempotency key was already used with a different request'
      using errcode = '22023';
  end if;

  if v_existing.state <> 'completed' or v_existing.response is null then
    raise exception 'Matching request is still in progress'
      using errcode = '55000';
  end if;

  return v_existing.response;
end;
$function$;

create function demo_ledger.complete_idempotency(
  p_user_id uuid,
  p_operation text,
  p_idempotency_key text,
  p_transaction_id uuid,
  p_response jsonb
)
returns void
language plpgsql
set search_path = ''
as $function$
begin
  update demo_ledger.idempotency_requests ir
  set state = 'completed',
      transaction_id = p_transaction_id,
      response = p_response,
      completed_at = pg_catalog.now()
  where ir.user_id = p_user_id
    and ir.operation = p_operation
    and ir.idempotency_key = p_idempotency_key
    and ir.state = 'started';

  if not found then
    raise exception 'Unable to complete idempotency request'
      using errcode = '55000';
  end if;
end;
$function$;

create function demo_ledger.apply_projection(
  p_account_id uuid,
  p_asset_id uuid,
  p_delta_units numeric
)
returns void
language plpgsql
set search_path = ''
as $function$
declare
  v_kind text;
  v_posted numeric(78, 0);
  v_held numeric(78, 0);
begin
  select la.account_kind
  into v_kind
  from demo_ledger.ledger_accounts la
  where la.id = p_account_id
    and la.asset_id = p_asset_id
  for update;

  if v_kind is null then
    raise exception 'Ledger account not found'
      using errcode = 'P0002';
  end if;

  insert into demo_ledger.account_balances (
    account_id,
    asset_id,
    posted_units,
    held_units
  )
  values (p_account_id, p_asset_id, p_delta_units, 0)
  on conflict (account_id) do update
  set posted_units = demo_ledger.account_balances.posted_units + excluded.posted_units,
      updated_at = pg_catalog.now()
  returning posted_units, held_units
  into v_posted, v_held;

  if v_kind = 'user_asset' and v_posted - v_held < 0 then
    raise exception 'Insufficient available balance'
      using errcode = '22003';
  end if;
end;
$function$;

create function demo_ledger.ensure_system_accounts()
returns void
language plpgsql
set search_path = ''
as $function$
begin
  insert into demo_ledger.ledger_accounts (
    asset_id,
    account_kind,
    system_key
  )
  select a.id, 'demo_issuer', 'demo_issuer'
  from demo_ledger.assets a
  where a.is_active
  on conflict do nothing;

  insert into demo_ledger.ledger_accounts (
    asset_id,
    account_kind,
    system_key
  )
  select a.id, 'fee_collector', 'fee_collector'
  from demo_ledger.assets a
  where a.is_active
    and a.is_native
  on conflict do nothing;

  insert into demo_ledger.account_balances (account_id, asset_id)
  select la.id, la.asset_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id is null
  on conflict (account_id) do nothing;
end;
$function$;

create function demo_ledger.create_wallet_internal(
  p_owner_id uuid,
  p_name text
)
returns uuid
language plpgsql
set search_path = ''
as $function$
declare
  v_wallet_id uuid;
  v_name text := coalesce(nullif(pg_catalog.btrim(p_name), ''), 'Main Wallet 1');
begin
  perform 1
  from demo_ledger.profiles p
  where p.user_id = p_owner_id
  for update;

  if pg_catalog.char_length(v_name) > 80 then
    raise exception 'Wallet name is too long'
      using errcode = '22023';
  end if;

  if (
    select pg_catalog.count(*)
    from demo_ledger.wallets w
    where w.owner_id = p_owner_id
      and not w.is_archived
  ) >= 10 then
    raise exception 'Demo wallet limit reached'
      using errcode = '54000';
  end if;

  insert into demo_ledger.wallets (owner_id, name, sort_order)
  values (
    p_owner_id,
    v_name,
    (
      select coalesce(pg_catalog.max(w.sort_order), -1) + 1
      from demo_ledger.wallets w
      where w.owner_id = p_owner_id
    )
  )
  returning id into v_wallet_id;

  insert into demo_ledger.wallet_addresses (wallet_id, network_id, address)
  select
    v_wallet_id,
    n.id,
    n.address_prefix
      || pg_catalog.substr(
        pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
        1,
        24
      )
  from demo_ledger.networks n
  where n.is_active;

  insert into demo_ledger.ledger_accounts (
    wallet_id,
    owner_id,
    asset_id,
    account_kind
  )
  select v_wallet_id, p_owner_id, a.id, 'user_asset'
  from demo_ledger.assets a
  where a.is_active;

  insert into demo_ledger.account_balances (account_id, asset_id)
  select la.id, la.asset_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id = v_wallet_id;

  perform demo_ledger.ensure_system_accounts();
  return v_wallet_id;
end;
$function$;

create function demo_ledger.wallet_json(
  p_wallet_id uuid,
  p_owner_id uuid
)
returns jsonb
language sql
stable
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'color', w.color,
    'sortOrder', w.sort_order,
    'createdAt', w.created_at,
    'addresses', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', wa.id,
          'networkId', n.id,
          'networkSlug', n.slug,
          'networkName', n.name,
          'address', wa.address,
          'qrPayload', 'trustdemo://receive?network=' || n.slug || '&address=' || wa.address
        )
        order by n.display_order, n.slug
      )
      from demo_ledger.wallet_addresses wa
      join demo_ledger.networks n on n.id = wa.network_id
      where wa.wallet_id = w.id
        and n.is_active
    ), '[]'::jsonb),
    'accounts', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'accountId', la.id,
          'assetId', a.id,
          'assetCode', a.asset_code,
          'symbol', a.symbol,
          'name', a.name,
          'networkSlug', n.slug,
          'decimals', a.decimals,
          'postedUnits', b.posted_units::text,
          'heldUnits', b.held_units::text,
          'availableUnits', (b.posted_units - b.held_units)::text,
          'displayOrder', a.display_order
        )
        order by a.display_order, a.asset_code
      )
      from demo_ledger.ledger_accounts la
      join demo_ledger.account_balances b on b.account_id = la.id
      join demo_ledger.assets a on a.id = la.asset_id
      join demo_ledger.networks n on n.id = a.network_id
      where la.wallet_id = w.id
        and la.owner_id = p_owner_id
        and a.is_active
        and n.is_active
    ), '[]'::jsonb)
  )
  from demo_ledger.wallets w
  where w.id = p_wallet_id
    and w.owner_id = p_owner_id
    and not w.is_archived
$function$;

create function demo_ledger.portfolio_json(p_user_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object(
    'profile', (
      select pg_catalog.jsonb_build_object(
        'userId', p.user_id,
        'handle', p.handle,
        'displayName', p.display_name
      )
      from demo_ledger.profiles p
      where p.user_id = p_user_id
    ),
    'wallets', coalesce((
      select pg_catalog.jsonb_agg(
        demo_ledger.wallet_json(w.id, p_user_id)
        order by w.sort_order, w.created_at, w.id
      )
      from demo_ledger.wallets w
      where w.owner_id = p_user_id
        and not w.is_archived
    ), '[]'::jsonb),
    'assets', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', a.id,
          'assetCode', a.asset_code,
          'symbol', a.symbol,
          'name', a.name,
          'networkId', n.id,
          'networkSlug', n.slug,
          'networkName', n.name,
          'decimals', a.decimals,
          'isNative', a.is_native,
          'displayOrder', a.display_order
        )
        order by a.display_order, a.asset_code
      )
      from demo_ledger.assets a
      join demo_ledger.networks n on n.id = a.network_id
      where a.is_active
        and n.is_active
    ), '[]'::jsonb),
    'realtime', pg_catalog.jsonb_build_object(
      'mode', 'postgres_changes',
      'channel', 'user:' || p_user_id::text || ':wallet',
      'schema', 'public',
      'table', 'demo_wallet_notifications',
      'event', 'INSERT',
      'filter', 'owner_id=eq.' || p_user_id::text
    ),
    'updatedAt', pg_catalog.now()
  )
$function$;

create function demo_ledger.transaction_json(
  p_transaction_id uuid,
  p_user_id uuid
)
returns jsonb
language sql
stable
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object(
    'id', t.id,
    'kind', t.kind,
    'status', t.status,
    'mockHash', t.mock_hash,
    'assetCode', a.asset_code,
    'symbol', a.symbol,
    'decimals', a.decimals,
    'amountUnits', t.amount_units::text,
    'feeUnits', t.fee_units::text,
    'createdAt', t.created_at,
    'confirmedAt', t.confirmed_at,
    'direction', mine.direction,
    'note', t.note,
    'counterparty', case
      when t.kind in ('funding', 'opening_balance') then
        pg_catalog.jsonb_build_object(
          'handle', 'demo-faucet',
          'displayName', 'Demo Faucet'
        )
      else pg_catalog.jsonb_build_object(
        'handle', other_profile.handle,
        'displayName', other_profile.display_name
      )
    end
  )
  from demo_ledger.transactions t
  join demo_ledger.assets a on a.id = t.asset_id
  join demo_ledger.transaction_participants mine
    on mine.transaction_id = t.id
   and mine.user_id = p_user_id
  left join demo_ledger.transaction_participants other_participant
    on other_participant.transaction_id = t.id
   and other_participant.user_id <> p_user_id
  left join demo_ledger.profiles other_profile
    on other_profile.user_id = other_participant.user_id
  where t.id = p_transaction_id
$function$;

create function demo_ledger.publish_outbox_notification()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  insert into public.demo_wallet_notifications (
    owner_id,
    event_type,
    transaction_id
  )
  values (
    new.user_id,
    new.event_type,
    new.transaction_id
  );
  return new;
end;
$function$;

create trigger publish_demo_wallet_outbox
after insert on demo_ledger.outbox_events
for each row execute function demo_ledger.publish_outbox_notification();

do $publish_demo_notifications$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication p
    where p.pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_catalog.pg_publication_tables pt
    where pt.pubname = 'supabase_realtime'
      and pt.schemaname = 'public'
      and pt.tablename = 'demo_wallet_notifications'
  ) then
    alter publication supabase_realtime
      add table public.demo_wallet_notifications;
  end if;
end;
$publish_demo_notifications$;

create function demo_ledger.verify_ledger()
returns jsonb
language sql
stable
set search_path = ''
as $function$
  with journal_totals as (
    select je.transaction_id, je.asset_id, pg_catalog.sum(je.amount_units) as units
    from demo_ledger.journal_entries je
    group by je.transaction_id, je.asset_id
  ),
  projected as (
    select
      la.id as account_id,
      coalesce(pg_catalog.sum(je.amount_units), 0::numeric) as journal_units
    from demo_ledger.ledger_accounts la
    left join demo_ledger.journal_entries je on je.account_id = la.id
    group by la.id
  )
  select pg_catalog.jsonb_build_object(
    'unbalancedTransactionAssets', (
      select pg_catalog.count(*)
      from journal_totals jt
      where jt.units <> 0
    ),
    'projectionMismatches', (
      select pg_catalog.count(*)
      from projected p
      left join demo_ledger.account_balances b on b.account_id = p.account_id
      where b.account_id is null
        or b.posted_units <> p.journal_units
    ),
    'negativeAvailableUserAccounts', (
      select pg_catalog.count(*)
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      where la.account_kind = 'user_asset'
        and b.posted_units - b.held_units < 0
    ),
    'confirmedWithoutParticipants', (
      select pg_catalog.count(*)
      from demo_ledger.transactions t
      where t.status = 'confirmed'
        and not exists (
          select 1
          from demo_ledger.transaction_participants tp
          where tp.transaction_id = t.id
        )
    ),
    'confirmedWithoutEntries', (
      select pg_catalog.count(*)
      from demo_ledger.transactions t
      where t.status = 'confirmed'
        and not exists (
          select 1
          from demo_ledger.journal_entries je
          where je.transaction_id = t.id
        )
    )
  )
$function$;

-- ---------------------------------------------------------------------------
-- Expo JSON API. These are the only client-executable database functions.
-- SECURITY DEFINER is necessary because the authoritative schema is unexposed;
-- every wrapper derives the actor from auth.uid(), rejects anonymous sessions,
-- uses an empty search path, and fully qualifies every object.
-- ---------------------------------------------------------------------------

comment on schema demo_ledger is
  'Private authoritative demo-wallet ledger. Client access is RPC-only.';

create function public.bootstrap_demo_account(
  p_handle text,
  p_display_name text,
  p_wallet_name text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_handle text := pg_catalog.regexp_replace(
    pg_catalog.lower(pg_catalog.btrim(coalesce(p_handle, ''))),
    '^@',
    ''
  );
  v_display_name text;
  v_request_hash text;
  v_replay jsonb;
  v_wallet_id uuid;
  v_created_wallet boolean := false;
  v_portfolio jsonb;
  v_response jsonb;
  v_existing_handle text;
begin
  if v_handle !~ '^[a-z][a-z0-9_]{2,29}$' then
    raise exception 'Handle must be 3-30 lowercase letters, numbers, or underscores'
      using errcode = '22023';
  end if;

  v_display_name := coalesce(
    nullif(pg_catalog.btrim(p_display_name), ''),
    v_handle
  );
  if pg_catalog.char_length(v_display_name) > 80 then
    raise exception 'Display name is too long'
      using errcode = '22023';
  end if;

  v_request_hash := demo_ledger.sha256_text(
    'bootstrap|' || v_handle || '|' || v_display_name || '|'
      || coalesce(pg_catalog.btrim(p_wallet_name), '')
  );
  v_replay := demo_ledger.claim_idempotency(
    v_user_id,
    'bootstrap_demo_account',
    p_idempotency_key,
    v_request_hash
  );
  if v_replay is not null then
    return v_replay;
  end if;

  select p.handle
  into v_existing_handle
  from demo_ledger.profiles p
  where p.user_id = v_user_id
  for update;

  if v_existing_handle is not null and v_existing_handle <> v_handle then
    raise exception 'This account already has a different demo handle'
      using errcode = '23505';
  end if;

  insert into demo_ledger.profiles (user_id, handle, display_name)
  values (v_user_id, v_handle, v_display_name)
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      updated_at = pg_catalog.now();

  select w.id
  into v_wallet_id
  from demo_ledger.wallets w
  where w.owner_id = v_user_id
    and not w.is_archived
  order by w.sort_order, w.created_at, w.id
  limit 1;

  if v_wallet_id is null then
    v_wallet_id := demo_ledger.create_wallet_internal(v_user_id, p_wallet_name);
    v_created_wallet := true;
  end if;

  if v_created_wallet then
    insert into demo_ledger.outbox_events (user_id, event_type)
    values (v_user_id, 'account_bootstrapped');

    insert into demo_ledger.audit_events (
      actor_id,
      event_type,
      entity_type,
      entity_id
    )
    values (v_user_id, 'account_bootstrapped', 'wallet', v_wallet_id);
  end if;

  v_portfolio := demo_ledger.portfolio_json(v_user_id);
  v_response := pg_catalog.jsonb_build_object(
    'profile', v_portfolio -> 'profile',
    'wallet', demo_ledger.wallet_json(v_wallet_id, v_user_id),
    'portfolio', v_portfolio
  );

  perform demo_ledger.complete_idempotency(
    v_user_id,
    'bootstrap_demo_account',
    p_idempotency_key,
    null,
    v_response
  );
  return v_response;
end;
$function$;

comment on function public.bootstrap_demo_account(text, text, text, text) is
  'Returns {profile,wallet,portfolio}; idempotent account and first-wallet bootstrap.';

create function public.create_demo_wallet(
  p_name text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_request_hash text := demo_ledger.sha256_text(
    'create_wallet|' || coalesce(pg_catalog.btrim(p_name), '')
  );
  v_replay jsonb;
  v_wallet_id uuid;
  v_portfolio jsonb;
  v_response jsonb;
begin
  if not exists (
    select 1 from demo_ledger.profiles p where p.user_id = v_user_id
  ) then
    raise exception 'Bootstrap the demo account first'
      using errcode = '55000';
  end if;

  v_replay := demo_ledger.claim_idempotency(
    v_user_id,
    'create_demo_wallet',
    p_idempotency_key,
    v_request_hash
  );
  if v_replay is not null then
    return v_replay;
  end if;

  v_wallet_id := demo_ledger.create_wallet_internal(v_user_id, p_name);

  insert into demo_ledger.outbox_events (user_id, event_type)
  values (v_user_id, 'wallet_created');

  insert into demo_ledger.audit_events (
    actor_id,
    event_type,
    entity_type,
    entity_id
  )
  values (v_user_id, 'wallet_created', 'wallet', v_wallet_id);

  v_portfolio := demo_ledger.portfolio_json(v_user_id);
  v_response := pg_catalog.jsonb_build_object(
    'profile', v_portfolio -> 'profile',
    'wallet', demo_ledger.wallet_json(v_wallet_id, v_user_id),
    'portfolio', v_portfolio
  );

  perform demo_ledger.complete_idempotency(
    v_user_id,
    'create_demo_wallet',
    p_idempotency_key,
    null,
    v_response
  );
  return v_response;
end;
$function$;

comment on function public.create_demo_wallet(text, text) is
  'Returns {profile,wallet,portfolio}; creates one additional network-aware demo wallet.';

create function public.get_portfolio()
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
begin
  return demo_ledger.portfolio_json(v_user_id);
end;
$function$;

comment on function public.get_portfolio() is
  'Returns {profile,wallets,assets,realtime,updatedAt}; activity is intentionally separate.';

create function public.resolve_recipient(
  p_recipient text,
  p_network_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_recipient text := pg_catalog.btrim(coalesce(p_recipient, ''));
  v_handle text;
  v_network_id uuid;
  v_network_slug text;
  v_recipient_user_id uuid;
  v_recipient_wallet_id uuid;
  v_address_id uuid;
  v_address text;
  v_display_name text;
  v_token_id uuid;
  v_expires_at timestamptz := pg_catalog.now() + interval '10 minutes';
begin
  select n.id, n.slug
  into v_network_id, v_network_slug
  from demo_ledger.networks n
  where n.slug = pg_catalog.lower(pg_catalog.btrim(p_network_slug))
    and n.is_active;

  if v_network_id is null then
    raise exception 'Unsupported demo network'
      using errcode = '22023';
  end if;

  if pg_catalog.lower(v_recipient) like 'demo:%' then
    select
      p.user_id,
      p.handle,
      p.display_name,
      w.id,
      wa.id,
      wa.address
    into
      v_recipient_user_id,
      v_handle,
      v_display_name,
      v_recipient_wallet_id,
      v_address_id,
      v_address
    from demo_ledger.wallet_addresses wa
    join demo_ledger.wallets w on w.id = wa.wallet_id
    join demo_ledger.profiles p on p.user_id = w.owner_id
    where wa.network_id = v_network_id
      and pg_catalog.lower(wa.address) = pg_catalog.lower(v_recipient)
      and not w.is_archived
    limit 1;
  else
    v_handle := pg_catalog.regexp_replace(
      pg_catalog.lower(v_recipient),
      '^@',
      ''
    );

    select
      p.user_id,
      p.handle,
      p.display_name,
      w.id,
      wa.id,
      wa.address
    into
      v_recipient_user_id,
      v_handle,
      v_display_name,
      v_recipient_wallet_id,
      v_address_id,
      v_address
    from demo_ledger.profiles p
    join demo_ledger.wallets w on w.owner_id = p.user_id
    join demo_ledger.wallet_addresses wa
      on wa.wallet_id = w.id
     and wa.network_id = v_network_id
    where p.handle = v_handle
      and not w.is_archived
    order by w.sort_order, w.created_at, w.id
    limit 1;
  end if;

  if v_recipient_user_id is null then
    raise exception 'Demo recipient not found on this network'
      using errcode = 'P0002';
  end if;

  if v_recipient_user_id = v_user_id then
    raise exception 'Choose a different demo account as the recipient'
      using errcode = '22023';
  end if;

  insert into demo_ledger.recipient_tokens (
    requester_id,
    recipient_wallet_id,
    wallet_address_id,
    network_id,
    expires_at
  )
  values (
    v_user_id,
    v_recipient_wallet_id,
    v_address_id,
    v_network_id,
    v_expires_at
  )
  returning id into v_token_id;

  return pg_catalog.jsonb_build_object(
    'recipientToken', v_token_id,
    'handle', v_handle,
    'displayName', v_display_name,
    'address', v_address,
    'networkSlug', v_network_slug,
    'expiresAt', v_expires_at
  );
end;
$function$;

comment on function public.resolve_recipient(text, text) is
  'Returns {recipientToken,handle,displayName,address,networkSlug,expiresAt}; rejects real-chain and self-recipient addresses.';

create function public.add_demo_funds(
  p_wallet_id uuid,
  p_asset_code text,
  p_amount_units text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_asset_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_asset_code, '')));
  v_amount_units numeric(78, 0) := demo_ledger.parse_positive_units(p_amount_units);
  v_request_hash text;
  v_replay jsonb;
  v_asset_id uuid;
  v_user_account_id uuid;
  v_issuer_account_id uuid;
  v_lock_id uuid;
  v_transaction_id uuid := pg_catalog.gen_random_uuid();
  v_mock_hash text;
  v_transaction jsonb;
  v_response jsonb;
begin
  if not exists (
    select 1
    from demo_ledger.wallets w
    where w.id = p_wallet_id
      and w.owner_id = v_user_id
      and not w.is_archived
  ) then
    raise exception 'Demo wallet not found'
      using errcode = 'P0002';
  end if;

  select a.id
  into v_asset_id
  from demo_ledger.assets a
  join demo_ledger.networks n on n.id = a.network_id
  where a.asset_code = v_asset_code
    and a.is_active
    and n.is_active;

  if v_asset_id is null then
    raise exception 'Demo asset not found'
      using errcode = 'P0002';
  end if;

  v_request_hash := demo_ledger.sha256_text(
    'fund|' || p_wallet_id::text || '|' || v_asset_code || '|' || v_amount_units::text
  );
  v_replay := demo_ledger.claim_idempotency(
    v_user_id,
    'add_demo_funds',
    p_idempotency_key,
    v_request_hash
  );
  if v_replay is not null then
    return pg_catalog.jsonb_set(v_replay, '{replayed}', 'true'::jsonb, true);
  end if;

  perform demo_ledger.ensure_system_accounts();

  select la.id
  into v_user_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id = p_wallet_id
    and la.owner_id = v_user_id
    and la.asset_id = v_asset_id
    and la.account_kind = 'user_asset';

  select la.id
  into v_issuer_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id is null
    and la.asset_id = v_asset_id
    and la.account_kind = 'demo_issuer'
    and la.system_key = 'demo_issuer';

  if v_user_account_id is null or v_issuer_account_id is null then
    raise exception 'Demo ledger account is missing'
      using errcode = '55000';
  end if;

  -- Lock all affected accounts in UUID order to avoid transfer/funding deadlocks.
  for v_lock_id in
    select la.id
    from demo_ledger.ledger_accounts la
    where la.id in (v_user_account_id, v_issuer_account_id)
    order by la.id
    for update
  loop
    null;
  end loop;

  v_mock_hash := 'demo_' || demo_ledger.sha256_text(
    'transaction|' || v_transaction_id::text
  );

  insert into demo_ledger.transactions (
    id,
    kind,
    status,
    asset_id,
    amount_units,
    recipient_wallet_id,
    mock_hash,
    confirmed_at
  )
  values (
    v_transaction_id,
    'funding',
    'confirmed',
    v_asset_id,
    v_amount_units,
    p_wallet_id,
    v_mock_hash,
    pg_catalog.now()
  );

  insert into demo_ledger.transaction_participants (
    transaction_id,
    user_id,
    wallet_id,
    direction
  )
  values (v_transaction_id, v_user_id, p_wallet_id, 'incoming');

  insert into demo_ledger.transaction_status_events (transaction_id, event_index, status)
  values
    (v_transaction_id, 1, 'submitted'),
    (v_transaction_id, 2, 'confirmed');

  insert into demo_ledger.journal_entries (
    transaction_id,
    account_id,
    asset_id,
    amount_units,
    entry_kind
  )
  values
    (v_transaction_id, v_issuer_account_id, v_asset_id, -v_amount_units, 'funding'),
    (v_transaction_id, v_user_account_id, v_asset_id, v_amount_units, 'funding');

  perform demo_ledger.apply_projection(v_issuer_account_id, v_asset_id, -v_amount_units);
  perform demo_ledger.apply_projection(v_user_account_id, v_asset_id, v_amount_units);

  insert into demo_ledger.outbox_events (
    user_id,
    event_type,
    transaction_id
  )
  values (v_user_id, 'funding_confirmed', v_transaction_id);

  insert into demo_ledger.audit_events (
    actor_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_user_id,
    'demo_funding_confirmed',
    'transaction',
    v_transaction_id,
    pg_catalog.jsonb_build_object('assetCode', v_asset_code)
  );

  v_transaction := demo_ledger.transaction_json(v_transaction_id, v_user_id);
  v_response := pg_catalog.jsonb_build_object(
    'replayed', false,
    'transaction', v_transaction,
    'portfolio', demo_ledger.portfolio_json(v_user_id)
  );

  perform demo_ledger.complete_idempotency(
    v_user_id,
    'add_demo_funds',
    p_idempotency_key,
    v_transaction_id,
    v_response
  );
  return v_response;
end;
$function$;

comment on function public.add_demo_funds(uuid, text, text, text) is
  'Returns {replayed,transaction,portfolio}; posts a balanced issuer-to-user funding transaction.';

create function public.create_transfer_quote(
  p_from_wallet_id uuid,
  p_recipient_token uuid,
  p_asset_code text,
  p_amount_units text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_asset_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_asset_code, '')));
  v_amount_units numeric(78, 0) := demo_ledger.parse_positive_units(p_amount_units);
  v_asset_id uuid;
  v_symbol text;
  v_decimals integer;
  v_asset_network_id uuid;
  v_recipient_network_id uuid;
  v_recipient_wallet_id uuid;
  v_wallet_address_id uuid;
  v_recipient_user_id uuid;
  v_handle text;
  v_display_name text;
  v_address text;
  v_network_slug text;
  v_quote_id uuid;
  v_expires_at timestamptz := pg_catalog.now() + interval '5 minutes';
begin
  if not exists (
    select 1
    from demo_ledger.wallets w
    where w.id = p_from_wallet_id
      and w.owner_id = v_user_id
      and not w.is_archived
  ) then
    raise exception 'Source demo wallet not found'
      using errcode = 'P0002';
  end if;

  select
    rt.network_id,
    rt.recipient_wallet_id,
    rt.wallet_address_id,
    w.owner_id,
    p.handle,
    p.display_name,
    wa.address,
    n.slug
  into
    v_recipient_network_id,
    v_recipient_wallet_id,
    v_wallet_address_id,
    v_recipient_user_id,
    v_handle,
    v_display_name,
    v_address,
    v_network_slug
  from demo_ledger.recipient_tokens rt
  join demo_ledger.wallets w on w.id = rt.recipient_wallet_id
  join demo_ledger.profiles p on p.user_id = w.owner_id
  join demo_ledger.wallet_addresses wa on wa.id = rt.wallet_address_id
  join demo_ledger.networks n on n.id = rt.network_id
  where rt.id = p_recipient_token
    and rt.requester_id = v_user_id
    and rt.expires_at > pg_catalog.now()
    and not w.is_archived;

  if v_recipient_wallet_id is null then
    raise exception 'Recipient token is missing or expired'
      using errcode = '22023';
  end if;

  if v_recipient_user_id = v_user_id then
    raise exception 'Choose a different demo account as the recipient'
      using errcode = '22023';
  end if;

  select a.id, a.symbol, a.decimals, a.network_id
  into v_asset_id, v_symbol, v_decimals, v_asset_network_id
  from demo_ledger.assets a
  where a.asset_code = v_asset_code
    and a.is_active;

  if v_asset_id is null then
    raise exception 'Demo asset not found'
      using errcode = 'P0002';
  end if;

  if v_asset_network_id <> v_recipient_network_id then
    raise exception 'Recipient address and asset must use the same demo network'
      using errcode = '22023';
  end if;

  insert into demo_ledger.transfer_quotes (
    requester_id,
    from_wallet_id,
    recipient_wallet_id,
    wallet_address_id,
    asset_id,
    amount_units,
    fee_asset_id,
    fee_units,
    expires_at
  )
  values (
    v_user_id,
    p_from_wallet_id,
    v_recipient_wallet_id,
    v_wallet_address_id,
    v_asset_id,
    v_amount_units,
    null,
    0,
    v_expires_at
  )
  returning id into v_quote_id;

  return pg_catalog.jsonb_build_object(
    'quoteId', v_quote_id,
    'assetCode', v_asset_code,
    'symbol', v_symbol,
    'decimals', v_decimals,
    'amountUnits', v_amount_units::text,
    'feeAssetCode', null,
    'feeUnits', '0',
    'expiresAt', v_expires_at,
    'recipient', pg_catalog.jsonb_build_object(
      'handle', v_handle,
      'displayName', v_display_name,
      'address', v_address,
      'networkSlug', v_network_slug
    )
  );
end;
$function$;

comment on function public.create_transfer_quote(uuid, uuid, text, text) is
  'Returns {quoteId,assetCode,symbol,decimals,amountUnits,feeAssetCode,feeUnits,expiresAt,recipient}; binds an expiring recipient and amount.';

create function public.submit_transfer(
  p_quote_id uuid,
  p_idempotency_key text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_note text := nullif(pg_catalog.btrim(p_note), '');
  v_request_hash text;
  v_replay jsonb;
  v_quote demo_ledger.transfer_quotes%rowtype;
  v_recipient_user_id uuid;
  v_sender_account_id uuid;
  v_recipient_account_id uuid;
  v_lock_id uuid;
  v_available_units numeric(78, 0);
  v_transaction_id uuid := pg_catalog.gen_random_uuid();
  v_mock_hash text;
  v_transaction jsonb;
  v_response jsonb;
begin
  if v_note is not null and pg_catalog.char_length(v_note) > 280 then
    raise exception 'Transfer note is too long'
      using errcode = '22023';
  end if;

  v_request_hash := demo_ledger.sha256_text(
    'submit_transfer|' || coalesce(p_quote_id::text, '') || '|'
      || coalesce(v_note, '')
  );
  v_replay := demo_ledger.claim_idempotency(
    v_user_id,
    'submit_transfer',
    p_idempotency_key,
    v_request_hash
  );
  if v_replay is not null then
    return pg_catalog.jsonb_set(v_replay, '{replayed}', 'true'::jsonb, true);
  end if;

  select q.*
  into v_quote
  from demo_ledger.transfer_quotes q
  where q.id = p_quote_id
    and q.requester_id = v_user_id
  for update;

  if v_quote.id is null then
    raise exception 'Transfer quote not found'
      using errcode = 'P0002';
  end if;
  if v_quote.expires_at <= pg_catalog.now() then
    raise exception 'Transfer quote expired'
      using errcode = '22023';
  end if;
  if v_quote.used_transaction_id is not null then
    raise exception 'Transfer quote was already submitted'
      using errcode = '23505';
  end if;

  if not exists (
    select 1
    from demo_ledger.wallets w
    where w.id = v_quote.from_wallet_id
      and w.owner_id = v_user_id
      and not w.is_archived
  ) then
    raise exception 'Source demo wallet not found'
      using errcode = 'P0002';
  end if;

  select w.owner_id
  into v_recipient_user_id
  from demo_ledger.wallets w
  where w.id = v_quote.recipient_wallet_id
    and not w.is_archived;

  if v_recipient_user_id is null then
    raise exception 'Recipient demo wallet not found'
      using errcode = 'P0002';
  end if;
  if v_recipient_user_id = v_user_id then
    raise exception 'Choose a different demo account as the recipient'
      using errcode = '22023';
  end if;

  select la.id
  into v_sender_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id = v_quote.from_wallet_id
    and la.owner_id = v_user_id
    and la.asset_id = v_quote.asset_id
    and la.account_kind = 'user_asset';

  select la.id
  into v_recipient_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id = v_quote.recipient_wallet_id
    and la.owner_id = v_recipient_user_id
    and la.asset_id = v_quote.asset_id
    and la.account_kind = 'user_asset';

  if v_sender_account_id is null or v_recipient_account_id is null then
    raise exception 'Demo asset account is missing for a transfer participant'
      using errcode = '55000';
  end if;

  -- Fixed-order account locks make opposite-direction concurrent transfers safe.
  for v_lock_id in
    select la.id
    from demo_ledger.ledger_accounts la
    where la.id in (v_sender_account_id, v_recipient_account_id)
    order by la.id
    for update
  loop
    null;
  end loop;

  select b.posted_units - b.held_units
  into v_available_units
  from demo_ledger.account_balances b
  where b.account_id = v_sender_account_id
  for update;

  if coalesce(v_available_units, 0) < v_quote.amount_units + v_quote.fee_units then
    raise exception 'Insufficient available balance'
      using errcode = '22003';
  end if;

  v_mock_hash := 'demo_' || demo_ledger.sha256_text(
    'transaction|' || v_transaction_id::text
  );

  insert into demo_ledger.transactions (
    id,
    kind,
    status,
    asset_id,
    amount_units,
    fee_asset_id,
    fee_units,
    sender_wallet_id,
    recipient_wallet_id,
    quote_id,
    mock_hash,
    note,
    confirmed_at
  )
  values (
    v_transaction_id,
    'transfer',
    'confirmed',
    v_quote.asset_id,
    v_quote.amount_units,
    v_quote.fee_asset_id,
    v_quote.fee_units,
    v_quote.from_wallet_id,
    v_quote.recipient_wallet_id,
    v_quote.id,
    v_mock_hash,
    v_note,
    pg_catalog.now()
  );

  insert into demo_ledger.transaction_participants (
    transaction_id,
    user_id,
    wallet_id,
    direction
  )
  values
    (v_transaction_id, v_user_id, v_quote.from_wallet_id, 'outgoing'),
    (v_transaction_id, v_recipient_user_id, v_quote.recipient_wallet_id, 'incoming');

  insert into demo_ledger.transaction_status_events (
    transaction_id,
    event_index,
    status
  )
  values
    (v_transaction_id, 1, 'submitted'),
    (v_transaction_id, 2, 'pending'),
    (v_transaction_id, 3, 'confirmed');

  -- The hold lifecycle is durable even though initial settlement is immediate.
  insert into demo_ledger.account_holds (
    transaction_id,
    account_id,
    asset_id,
    amount_units,
    status,
    expires_at
  )
  values (
    v_transaction_id,
    v_sender_account_id,
    v_quote.asset_id,
    v_quote.amount_units,
    'open',
    pg_catalog.now() + interval '10 minutes'
  );

  update demo_ledger.account_balances b
  set held_units = b.held_units + v_quote.amount_units,
      updated_at = pg_catalog.now()
  where b.account_id = v_sender_account_id;

  update demo_ledger.account_holds h
  set status = 'captured',
      resolved_at = pg_catalog.now()
  where h.transaction_id = v_transaction_id
    and h.account_id = v_sender_account_id
    and h.status = 'open';

  update demo_ledger.account_balances b
  set held_units = b.held_units - v_quote.amount_units,
      updated_at = pg_catalog.now()
  where b.account_id = v_sender_account_id;

  insert into demo_ledger.journal_entries (
    transaction_id,
    account_id,
    asset_id,
    amount_units,
    entry_kind
  )
  values
    (v_transaction_id, v_sender_account_id, v_quote.asset_id, -v_quote.amount_units, 'transfer'),
    (v_transaction_id, v_recipient_account_id, v_quote.asset_id, v_quote.amount_units, 'transfer');

  perform demo_ledger.apply_projection(
    v_sender_account_id,
    v_quote.asset_id,
    -v_quote.amount_units
  );
  perform demo_ledger.apply_projection(
    v_recipient_account_id,
    v_quote.asset_id,
    v_quote.amount_units
  );

  update demo_ledger.transfer_quotes q
  set used_transaction_id = v_transaction_id
  where q.id = v_quote.id
    and q.used_transaction_id is null;

  insert into demo_ledger.outbox_events (
    user_id,
    event_type,
    transaction_id
  )
  values
    (v_user_id, 'transfer_confirmed', v_transaction_id),
    (v_recipient_user_id, 'transfer_confirmed', v_transaction_id);

  insert into demo_ledger.audit_events (
    actor_id,
    event_type,
    entity_type,
    entity_id
  )
  values (v_user_id, 'demo_transfer_confirmed', 'transaction', v_transaction_id);

  v_transaction := demo_ledger.transaction_json(v_transaction_id, v_user_id);
  v_response := pg_catalog.jsonb_build_object(
    'replayed', false,
    'transaction', v_transaction,
    'portfolio', demo_ledger.portfolio_json(v_user_id)
  );

  perform demo_ledger.complete_idempotency(
    v_user_id,
    'submit_transfer',
    p_idempotency_key,
    v_transaction_id,
    v_response
  );
  return v_response;
end;
$function$;

comment on function public.submit_transfer(uuid, text, text) is
  'Returns {replayed,transaction,portfolio}; atomically holds, posts, confirms, and publishes safe invalidations.';

create function public.get_activity(
  p_cursor text default null,
  p_limit integer default 30
)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 100);
  v_items jsonb;
  v_has_more boolean;
  v_cursor_value jsonb;
  v_cursor_created_at timestamptz;
  v_cursor_id uuid;
  v_last_created_at timestamptz;
  v_last_id uuid;
  v_next_cursor text;
begin
  if nullif(pg_catalog.btrim(p_cursor), '') is not null then
    begin
      v_cursor_value := p_cursor::jsonb;
      v_cursor_created_at := (v_cursor_value ->> 'createdAt')::timestamptz;
      v_cursor_id := (v_cursor_value ->> 'id')::uuid;
      if v_cursor_created_at is null or v_cursor_id is null then
        raise exception 'missing cursor component';
      end if;
    exception when others then
      raise exception 'Invalid activity cursor'
        using errcode = '22023';
    end;
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(r.item order by r.created_at desc, r.id desc),
    '[]'::jsonb
  )
  into v_items
  from (
    select
      t.id,
      t.created_at,
      demo_ledger.transaction_json(t.id, v_user_id) as item
    from demo_ledger.transaction_participants tp
    join demo_ledger.transactions t on t.id = tp.transaction_id
    where tp.user_id = v_user_id
      and (
        v_cursor_created_at is null
        or (t.created_at, t.id) < (v_cursor_created_at, v_cursor_id)
      )
    order by t.created_at desc, t.id desc
    limit v_limit
  ) r;

  select exists (
    select 1
    from demo_ledger.transaction_participants tp
    join demo_ledger.transactions t on t.id = tp.transaction_id
    where tp.user_id = v_user_id
      and (
        v_cursor_created_at is null
        or (t.created_at, t.id) < (v_cursor_created_at, v_cursor_id)
      )
    order by t.created_at desc, t.id desc
    offset v_limit
    limit 1
  )
  into v_has_more;

  if v_has_more then
    select t.created_at, t.id
    into v_last_created_at, v_last_id
    from demo_ledger.transaction_participants tp
    join demo_ledger.transactions t on t.id = tp.transaction_id
    where tp.user_id = v_user_id
      and (
        v_cursor_created_at is null
        or (t.created_at, t.id) < (v_cursor_created_at, v_cursor_id)
      )
    order by t.created_at desc, t.id desc
    offset (v_limit - 1)
    limit 1;

    v_next_cursor := pg_catalog.jsonb_build_object(
      'createdAt', v_last_created_at,
      'id', v_last_id
    )::text;
  end if;

  return pg_catalog.jsonb_build_object(
    'items', v_items,
    'nextCursor', v_next_cursor
  );
end;
$function$;

comment on function public.get_activity(text, integer) is
  'Returns {items,nextCursor}; opaque (created_at,id) cursor prevents equal-timestamp skips.';

create function public.get_transaction(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_transaction jsonb;
  v_entries jsonb;
  v_status_events jsonb;
begin
  v_transaction := demo_ledger.transaction_json(p_transaction_id, v_user_id);
  if v_transaction is null then
    raise exception 'Demo transaction not found'
      using errcode = 'P0002';
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', je.id,
        'assetCode', a.asset_code,
        'accountKind', la.account_kind,
        'ownerId', case when la.owner_id = v_user_id then la.owner_id else null end,
        'amountUnits', je.amount_units::text,
        'entryKind', je.entry_kind,
        'createdAt', je.created_at
      )
      order by je.created_at, je.id
    ),
    '[]'::jsonb
  )
  into v_entries
  from demo_ledger.journal_entries je
  join demo_ledger.ledger_accounts la on la.id = je.account_id
  join demo_ledger.assets a on a.id = je.asset_id
  where je.transaction_id = p_transaction_id;

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'status', se.status,
        'reason', se.reason,
        'createdAt', se.created_at
      )
      order by se.event_index
    ),
    '[]'::jsonb
  )
  into v_status_events
  from demo_ledger.transaction_status_events se
  where se.transaction_id = p_transaction_id;

  return pg_catalog.jsonb_build_object(
    'transaction', v_transaction,
    'entries', v_entries,
    'statusEvents', v_status_events
  );
end;
$function$;

comment on function public.get_transaction(uuid) is
  'Returns {transaction,entries,statusEvents}; participant-authorized receipt detail.';

-- Internal functions are never executable by browser roles.
revoke all privileges on all functions in schema demo_ledger
  from public, anon, authenticated;
grant execute on all functions in schema demo_ledger to service_role;

-- Revoke every public SECURITY DEFINER endpoint, including pre-existing ones,
-- before explicitly allowlisting the nine authenticated Expo wrappers.
do $revoke_public_security_definers$
declare
  v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute pg_catalog.format(
      'revoke all privileges on function %s from public, anon, authenticated, service_role',
      v_function
    );
  end loop;
end;
$revoke_public_security_definers$;

revoke all privileges on function public.bootstrap_demo_account(text, text, text, text)
  from public, anon;
revoke all privileges on function public.create_demo_wallet(text, text)
  from public, anon;
revoke all privileges on function public.get_portfolio()
  from public, anon;
revoke all privileges on function public.resolve_recipient(text, text)
  from public, anon;
revoke all privileges on function public.add_demo_funds(uuid, text, text, text)
  from public, anon;
revoke all privileges on function public.create_transfer_quote(uuid, uuid, text, text)
  from public, anon;
revoke all privileges on function public.submit_transfer(uuid, text, text)
  from public, anon;
revoke all privileges on function public.get_activity(text, integer)
  from public, anon;
revoke all privileges on function public.get_transaction(uuid)
  from public, anon;

grant execute on function public.bootstrap_demo_account(text, text, text, text)
  to authenticated, service_role;
grant execute on function public.create_demo_wallet(text, text)
  to authenticated, service_role;
grant execute on function public.get_portfolio()
  to authenticated, service_role;
grant execute on function public.resolve_recipient(text, text)
  to authenticated, service_role;
grant execute on function public.add_demo_funds(uuid, text, text, text)
  to authenticated, service_role;
grant execute on function public.create_transfer_quote(uuid, uuid, text, text)
  to authenticated, service_role;
grant execute on function public.submit_transfer(uuid, text, text)
  to authenticated, service_role;
grant execute on function public.get_activity(text, integer)
  to authenticated, service_role;
grant execute on function public.get_transaction(uuid)
  to authenticated, service_role;

notify pgrst, 'reload schema';
