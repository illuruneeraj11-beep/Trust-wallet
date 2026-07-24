-- Run after a fresh `supabase db reset` with:
--   supabase test db supabase/tests/professional_demo_wallet_ledger_test.sql
-- The whole acceptance flow rolls back; it never leaves test users or balances.

begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(56);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'alice-ledger-test@example.invalid',
    extensions.crypt('demo-password', extensions.gen_salt('bf')),
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'bob-ledger-test@example.invalid',
    extensions.crypt('demo-password', extensions.gen_salt('bf')),
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  );

create temporary table ledger_test_results (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select, insert, update, delete on ledger_test_results to authenticated;

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":false}';

insert into ledger_test_results (name, payload)
values (
  'alice_bootstrap',
  public.bootstrap_demo_account(
    'alice',
    'Alice Demo',
    'Alice Main',
    'test-bootstrap-alice-001'
  )
);

select extensions.is(
  public.get_portfolio() -> 'profile' ->> 'handle',
  'alice',
  'Alice bootstrap returns the expected profile'
);

select extensions.is(
  pg_catalog.jsonb_array_length(public.get_portfolio() -> 'wallets'),
  1,
  'Alice bootstrap creates exactly one wallet'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.jsonb_array_elements(public.get_portfolio() -> 'assets') asset
    where asset ->> 'assetCode' = 'USD'
      and (asset ->> 'decimals')::integer = 2
  ),
  'Portfolio exposes the two-decimal Demo USD asset'
);

reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated","is_anonymous":false}';

insert into ledger_test_results (name, payload)
values (
  'bob_bootstrap',
  public.bootstrap_demo_account(
    'bob',
    'Bob Demo',
    'Bob Main',
    'test-bootstrap-bob-0001'
  )
);

select extensions.is(
  public.get_portfolio() -> 'profile' ->> 'handle',
  'bob',
  'Bob bootstrap returns the expected profile'
);

reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":false}';

insert into ledger_test_results (name, payload)
select
  'alice_funding',
  public.add_demo_funds(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    'ETH_USDT',
    '100000000',
    'test-fund-alice-0001'
  );

select extensions.is(
  (select payload -> 'transaction' ->> 'status' from ledger_test_results where name = 'alice_funding'),
  'confirmed',
  'Funding posts as confirmed'
);

insert into ledger_test_results (name, payload)
select
  'alice_funding_retry',
  public.add_demo_funds(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    'ETH_USDT',
    '100000000',
    'test-fund-alice-0001'
  );

select extensions.ok(
  (select (payload ->> 'replayed')::boolean from ledger_test_results where name = 'alice_funding_retry'),
  'Funding retry replays the original response'
);

select extensions.throws_ok(
  $test$
    select public.add_demo_funds(
      (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
      'ETH_USDT',
      '99999999',
      'test-fund-alice-0001'
    )
  $test$,
  '22023',
  'Idempotency key was already used with a different request',
  'Changed funding payload cannot reuse an idempotency key'
);

select extensions.throws_ok(
  $test$select public.resolve_recipient('@alice', 'ethereum')$test$,
  '22023',
  'Choose a different demo account as the recipient',
  'Self-recipient resolution is rejected'
);

insert into ledger_test_results (name, payload)
with alice_portfolio as (
  select public.get_portfolio() as payload
), recipient as (
  select public.resolve_recipient('@bob', 'ethereum') as payload
), quote as (
  select public.create_transfer_quote(
    (alice_portfolio.payload -> 'wallets' -> 0 ->> 'id')::uuid,
    (recipient.payload ->> 'recipientToken')::uuid,
    'ETH_USDT',
    '25000000'
  ) as payload
  from alice_portfolio, recipient
)
select
  'alice_transfer',
  pg_catalog.jsonb_build_object(
    'quote', quote.payload,
    'result', public.submit_transfer(
      (quote.payload ->> 'quoteId')::uuid,
      'test-transfer-alice-01',
      'Dinner demo'
    )
  )
from quote;

select extensions.is(
  (select payload -> 'result' -> 'transaction' ->> 'status' from ledger_test_results where name = 'alice_transfer'),
  'confirmed',
  'Cross-user transfer posts as confirmed'
);

insert into ledger_test_results (name, payload)
select
  'alice_transfer_retry',
  public.submit_transfer(
    (
      select (payload -> 'quote' ->> 'quoteId')::uuid
      from ledger_test_results
      where name = 'alice_transfer'
    ),
    'test-transfer-alice-01',
    'Dinner demo'
  );

select extensions.ok(
  (select (payload ->> 'replayed')::boolean from ledger_test_results where name = 'alice_transfer_retry'),
  'Transfer retry replays without posting twice'
);

insert into ledger_test_results (name, payload)
values ('alice_activity_page_1', public.get_activity(null, 1));

insert into ledger_test_results (name, payload)
select
  'alice_activity_page_2',
  public.get_activity(
    (select payload ->> 'nextCursor' from ledger_test_results where name = 'alice_activity_page_1'),
    1
  );

select extensions.ok(
  (select payload ->> 'nextCursor' is not null from ledger_test_results where name = 'alice_activity_page_1'),
  'First one-row activity page returns an opaque cursor'
);

select extensions.isnt(
  (select payload -> 'items' -> 0 ->> 'id' from ledger_test_results where name = 'alice_activity_page_1'),
  (select payload -> 'items' -> 0 ->> 'id' from ledger_test_results where name = 'alice_activity_page_2'),
  'Tuple cursor returns the next distinct transaction'
);

insert into ledger_test_results (name, payload)
select
  'alice_receipt',
  public.get_transaction(
    (
      select (payload -> 'result' -> 'transaction' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_transfer'
    )
  );

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.jsonb_array_elements(
      (select payload -> 'entries' from ledger_test_results where name = 'alice_receipt')
    ) entry
    where entry ->> 'ownerId' is null
  ),
  1,
  'Receipt redacts the counterparty Auth UUID'
);

reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated","is_anonymous":false}';

insert into ledger_test_results (name, payload)
select
  'bob_receipt',
  public.get_transaction(
    (
      select (payload -> 'result' -> 'transaction' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_transfer'
    )
  );

select extensions.is(
  (select payload -> 'transaction' ->> 'direction' from ledger_test_results where name = 'bob_receipt'),
  'incoming',
  'Bob sees the same transfer as incoming'
);

reset role;

select extensions.is(
  (
    select b.posted_units::text
    from demo_ledger.account_balances b
    join demo_ledger.ledger_accounts la on la.id = b.account_id
    join demo_ledger.assets a on a.id = la.asset_id
    where la.owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and a.asset_code = 'ETH_USDT'
  ),
  '75000000',
  'Alice has 75 USDT after sending 25 from 100'
);

select extensions.is(
  (
    select b.posted_units::text
    from demo_ledger.account_balances b
    join demo_ledger.ledger_accounts la on la.id = b.account_id
    join demo_ledger.assets a on a.id = la.asset_id
    where la.owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      and a.asset_code = 'ETH_USDT'
  ),
  '25000000',
  'Bob receives 25 USDT'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from demo_ledger.transaction_participants tp
    where tp.transaction_id = (
      select (payload -> 'result' -> 'transaction' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_transfer'
    )
  ),
  2,
  'Transfer has exactly two distinct participants'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from (
      select je.transaction_id, je.asset_id
      from demo_ledger.journal_entries je
      group by je.transaction_id, je.asset_id
      having pg_catalog.sum(je.amount_units) <> 0
    ) unbalanced
  ),
  0,
  'Every transaction balances to zero per asset'
);

select extensions.is(
  (demo_ledger.verify_ledger() ->> 'projectionMismatches')::integer,
  0,
  'Balance projection reconciles to the immutable journal'
);

select extensions.is(
  (demo_ledger.verify_ledger() ->> 'negativeAvailableUserAccounts')::integer,
  0,
  'No user account has a negative available balance'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from demo_ledger.transactions t
    join demo_ledger.wallets sender_wallet on sender_wallet.id = t.sender_wallet_id
    where t.kind = 'transfer'
      and sender_wallet.owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  1,
  'Idempotent retry created only one transfer'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from demo_ledger.idempotency_requests ir
    where ir.user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and ir.operation = 'submit_transfer'
  ),
  1,
  'Transfer has one completed idempotency record'
);

select extensions.is(
  (
    select h.status
    from demo_ledger.account_holds h
    where h.transaction_id = (
      select (payload -> 'result' -> 'transaction' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_transfer'
    )
  ),
  'captured',
  'Immediate settlement preserves a captured hold record'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from demo_ledger.account_holds h
    where h.status = 'open'
  ),
  0,
  'No open hold remains after immediate confirmation'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from demo_ledger.transaction_status_events se
    where se.transaction_id = (
      select (payload -> 'result' -> 'transaction' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_transfer'
    )
  ),
  3,
  'Transfer records submitted, pending, and confirmed status events'
);

select extensions.ok(
  not pg_catalog.has_table_privilege('authenticated', 'demo_ledger.wallets', 'select'),
  'Authenticated clients cannot select ledger tables directly'
);

select extensions.ok(
  not pg_catalog.has_function_privilege('anon', 'public.get_portfolio()', 'execute'),
  'Anon cannot execute portfolio RPC'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and pg_catalog.has_function_privilege('authenticated', p.oid, 'execute')
  ),
  14,
  'Exactly fourteen public SECURITY DEFINER functions are authenticated APIs'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'demo_ledger'
      and p.proname in ('validate_entry_balance', 'validate_posted_transaction')
      and p.prosecdef
      and p.proconfig @> array['search_path=""']::text[]
      and not pg_catalog.has_function_privilege('authenticated', p.oid, 'execute')
  ),
  2,
  'Deferred integrity triggers retain trusted private-schema execution'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_publication_tables pt
    where pt.pubname = 'supabase_realtime'
      and pt.schemaname = 'public'
      and pt.tablename = 'demo_wallet_notifications'
  ),
  1,
  'Only the safe notification mirror is added to Supabase Realtime'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'demo_wallet_notifications'
      and p.policyname = 'users can read their own demo wallet notifications'
  ),
  1,
  'Notification mirror has an owner-only SELECT policy'
);

select extensions.ok(
  pg_catalog.has_table_privilege('authenticated', 'public.demo_wallet_notifications', 'select')
  and not pg_catalog.has_table_privilege('authenticated', 'public.demo_wallet_notifications', 'insert')
  and not pg_catalog.has_table_privilege('authenticated', 'public.demo_wallet_notifications', 'update')
  and not pg_catalog.has_table_privilege('authenticated', 'public.demo_wallet_notifications', 'delete'),
  'Authenticated clients can read own notifications but cannot mutate them'
);

select extensions.is(
  (select pg_catalog.count(*)::integer from public.demo_wallet_notifications),
  (select pg_catalog.count(*)::integer from demo_ledger.outbox_events),
  'Every durable outbox event creates one safe notification row'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":false}';

select extensions.is(
  (select pg_catalog.count(*)::integer from public.demo_wallet_notifications),
  3,
  'Notification RLS lets Alice see only her three invalidations'
);

reset role;

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename in (
        'wallets', 'transactions', 'networks', 'assets', 'user_balances',
        'wallet_transactions', 'user_wallets', 'app_config',
        'mock_wallet_assets', 'mock_wallets', 'mock_wallet_balances',
        'mock_wallet_funding_events', 'mock_wallet_transfers'
      )
  ),
  0,
  'Legacy broad policies are removed without dropping legacy rows'
);

select extensions.throws_ok(
  $test$update demo_ledger.journal_entries set amount_units = amount_units + 1$test$,
  '55000',
  'journal_entries is append-only',
  'Posted journal entries cannot be edited'
);

select extensions.is(
  (
    select a.decimals
    from demo_ledger.assets a
    where a.asset_code = 'USD'
  ),
  2,
  'Demo USD is exactly two decimal places'
);

select extensions.is(
  (
    select data_type
    from information_schema.columns
    where table_schema = 'demo_ledger'
      and table_name = 'journal_entries'
      and column_name = 'amount_units'
  ),
  'numeric',
  'Journal uses exact numeric base units'
);

select extensions.is(
  (
    select numeric_precision::integer
    from information_schema.columns
    where table_schema = 'demo_ledger'
      and table_name = 'journal_entries'
      and column_name = 'amount_units'
  ),
  78::integer,
  'Journal numeric precision is 78 digits'
);

select extensions.is(
  (
    select numeric_scale::integer
    from information_schema.columns
    where table_schema = 'demo_ledger'
      and table_name = 'journal_entries'
      and column_name = 'amount_units'
  ),
  0::integer,
  'Journal numeric scale is zero'
);

-- Native same-owner transfers, archive guards, and real fee settlement.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":false}';

insert into ledger_test_results (name, payload)
values (
  'alice_second_wallet',
  public.create_demo_wallet('Alice Vault', 'test-wallet-alice-0002')
);

insert into ledger_test_results (name, payload)
select
  'alice_native_transfer',
  public.transfer_between_wallets(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    (
      select (payload -> 'wallet' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_second_wallet'
    ),
    'ETH_USDT',
    '10000000',
    'test-native-alice-001',
    'Move to vault'
  );

insert into ledger_test_results (name, payload)
select
  'alice_native_transfer_retry',
  public.transfer_between_wallets(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    (
      select (payload -> 'wallet' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_second_wallet'
    ),
    'ETH_USDT',
    '10000000',
    'test-native-alice-001',
    'Move to vault'
  );

select extensions.is(
  (select payload -> 'transaction' ->> 'direction' from ledger_test_results where name = 'alice_native_transfer'),
  'self',
  'A transfer between two wallets owned by Alice is reported as self'
);

select extensions.ok(
  (select (payload ->> 'replayed')::boolean from ledger_test_results where name = 'alice_native_transfer_retry')
  and (
    select payload -> 'transaction' ->> 'id'
    from ledger_test_results
    where name = 'alice_native_transfer_retry'
  ) = (
    select payload -> 'transaction' ->> 'id'
    from ledger_test_results
    where name = 'alice_native_transfer'
  ),
  'Native wallet transfer retry returns the original transaction'
);

reset role;

select extensions.is(
  (
    select b.posted_units::text
    from demo_ledger.account_balances b
    join demo_ledger.ledger_accounts la on la.id = b.account_id
    join demo_ledger.assets a on a.id = la.asset_id
    where la.wallet_id = (
      select (payload -> 'portfolio' -> 'wallets' -> 0 ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_funding'
    )
      and a.asset_code = 'ETH_USDT'
  ),
  '65000000',
  'Native transfer debits Alice main wallet exactly once'
);

select extensions.is(
  (
    select b.posted_units::text
    from demo_ledger.account_balances b
    join demo_ledger.ledger_accounts la on la.id = b.account_id
    join demo_ledger.assets a on a.id = la.asset_id
    where la.wallet_id = (
      select (payload -> 'wallet' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_second_wallet'
    )
      and a.asset_code = 'ETH_USDT'
  ),
  '10000000',
  'Native transfer credits Alice vault exactly once'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":false}';

select extensions.throws_ok(
  pg_catalog.format(
    'select public.archive_wallet(%L::uuid)',
    (
      select payload -> 'wallet' ->> 'id'
      from ledger_test_results
      where name = 'alice_second_wallet'
    )
  ),
  '22023',
  'Move all balances out before removing this wallet',
  'A wallet with posted value cannot be archived'
);

insert into ledger_test_results (name, payload)
values (
  'alice_empty_wallet',
  public.create_demo_wallet('Alice Empty', 'test-wallet-alice-0003')
);

insert into ledger_test_results (name, payload)
select
  'alice_empty_wallet_archive',
  public.archive_wallet(
    (
      select (payload -> 'wallet' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_empty_wallet'
    )
  );

select extensions.is(
  (
    select pg_catalog.jsonb_array_length(payload -> 'wallets')
    from ledger_test_results
    where name = 'alice_empty_wallet_archive'
  ),
  2,
  'An empty wallet is archived and omitted from the active portfolio'
);

select extensions.throws_ok(
  pg_catalog.format(
    'select public.transfer_between_wallets(%L::uuid,%L::uuid,%L,%L,%L,null)',
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id'),
    (
      select payload -> 'wallet' ->> 'id'
      from ledger_test_results
      where name = 'alice_empty_wallet'
    ),
    'ETH_USDT',
    '1',
    'test-native-archived-001'
  ),
  'P0002',
  'Wallet not found',
  'Native transfer rejects an archived destination wallet'
);

select extensions.throws_ok(
  pg_catalog.format(
    'select public.add_demo_funds(%L::uuid,%L,%L,%L)',
    (
      select payload -> 'wallet' ->> 'id'
      from ledger_test_results
      where name = 'alice_empty_wallet'
    ),
    'ETH_USDT',
    '1',
    'test-fund-archived-001'
  ),
  'P0002',
  'Demo wallet not found',
  'Funding rejects an archived destination wallet'
);

insert into ledger_test_results (name, payload)
values (
  'alice_fee_funding',
  public.add_demo_funds(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    'ETH',
    '10000000000000000000',
    'test-fund-fee-alice-001'
  )
);

insert into ledger_test_results (name, payload)
values (
  'alice_fee_recipient',
  public.resolve_recipient('@bob', 'ethereum')
);

insert into ledger_test_results (name, payload)
select
  'alice_fee_quote',
  public.create_transfer_quote(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    (
      select (payload ->> 'recipientToken')::uuid
      from ledger_test_results
      where name = 'alice_fee_recipient'
    ),
    'ETH_USDT',
    '1000000'
  );

reset role;

update demo_ledger.transfer_quotes q
set fee_asset_id = (
      select a.id from demo_ledger.assets a where a.asset_code = 'ETH'
    ),
    fee_units = 10000000000000000
where q.id = (
  select (payload ->> 'quoteId')::uuid
  from ledger_test_results
  where name = 'alice_fee_quote'
);

insert into ledger_test_results (name, payload)
select
  'fee_balances_before',
  pg_catalog.jsonb_build_object(
    'senderTransfer', (
      select b.posted_units::text
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.wallet_id = (
        select (payload -> 'portfolio' -> 'wallets' -> 0 ->> 'id')::uuid
        from ledger_test_results
        where name = 'alice_fee_funding'
      )
        and a.asset_code = 'ETH_USDT'
    ),
    'senderFee', (
      select b.posted_units::text
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.wallet_id = (
        select (payload -> 'portfolio' -> 'wallets' -> 0 ->> 'id')::uuid
        from ledger_test_results
        where name = 'alice_fee_funding'
      )
        and a.asset_code = 'ETH'
    ),
    'recipientTransfer', (
      select b.posted_units::text
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
        and a.asset_code = 'ETH_USDT'
    ),
    'collector', (
      select b.posted_units::text
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.account_kind = 'fee_collector'
        and la.system_key = 'fee_collector'
        and a.asset_code = 'ETH'
    )
  );

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":false}';

insert into ledger_test_results (name, payload)
select
  'alice_fee_transfer',
  public.submit_transfer(
    (
      select (payload ->> 'quoteId')::uuid
      from ledger_test_results
      where name = 'alice_fee_quote'
    ),
    'test-transfer-fee-alice-001',
    'Fee settlement'
  );

insert into ledger_test_results (name, payload)
select
  'alice_fee_receipt',
  public.get_transaction(
    (
      select (payload -> 'transaction' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_fee_transfer'
    )
  );

reset role;

select extensions.ok(
  (select payload -> 'transaction' ->> 'feeAssetCode' from ledger_test_results where name = 'alice_fee_transfer') = 'ETH'
  and (select payload -> 'transaction' ->> 'feeUnits' from ledger_test_results where name = 'alice_fee_transfer') = '10000000000000000',
  'Transfer receipt exposes the charged fee asset and exact fee units'
);

select extensions.is(
  (
    (
      select (payload ->> 'senderTransfer')::numeric
      from ledger_test_results
      where name = 'fee_balances_before'
    ) - (
      select b.posted_units
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.wallet_id = (
        select (payload -> 'portfolio' -> 'wallets' -> 0 ->> 'id')::uuid
        from ledger_test_results
        where name = 'alice_fee_funding'
      )
        and a.asset_code = 'ETH_USDT'
    )
  )::text,
  '1000000',
  'Sender transfer asset is debited by the transfer amount'
);

select extensions.is(
  (
    (
      select (payload ->> 'senderFee')::numeric
      from ledger_test_results
      where name = 'fee_balances_before'
    ) - (
      select b.posted_units
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.wallet_id = (
        select (payload -> 'portfolio' -> 'wallets' -> 0 ->> 'id')::uuid
        from ledger_test_results
        where name = 'alice_fee_funding'
      )
        and a.asset_code = 'ETH'
    )
  )::text,
  '10000000000000000',
  'Sender fee asset is debited by the exact fee'
);

select extensions.is(
  (
    (
      select b.posted_units
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
        and a.asset_code = 'ETH_USDT'
    ) - (
      select (payload ->> 'recipientTransfer')::numeric
      from ledger_test_results
      where name = 'fee_balances_before'
    )
  )::text,
  '1000000',
  'Recipient is credited by the transfer amount only'
);

select extensions.is(
  (
    (
      select b.posted_units
      from demo_ledger.account_balances b
      join demo_ledger.ledger_accounts la on la.id = b.account_id
      join demo_ledger.assets a on a.id = la.asset_id
      where la.account_kind = 'fee_collector'
        and la.system_key = 'fee_collector'
        and a.asset_code = 'ETH'
    ) - (
      select (payload ->> 'collector')::numeric
      from ledger_test_results
      where name = 'fee_balances_before'
    )
  )::text,
  '10000000000000000',
  'Fee collector is credited by the exact fee'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from demo_ledger.journal_entries je
    where je.transaction_id = (
      select (payload -> 'transaction' ->> 'id')::uuid
      from ledger_test_results
      where name = 'alice_fee_transfer'
    )
  ),
  4,
  'Fee-bearing transfer posts two transfer and two fee journal entries'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from (
      select je.asset_id
      from demo_ledger.journal_entries je
      where je.transaction_id = (
        select (payload -> 'transaction' ->> 'id')::uuid
        from ledger_test_results
        where name = 'alice_fee_transfer'
      )
      group by je.asset_id
      having pg_catalog.sum(je.amount_units) <> 0
    ) unbalanced_fee_assets
  ),
  0,
  'Fee-bearing transfer balances to zero for every journal asset'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.jsonb_array_elements(
      (select payload -> 'entries' from ledger_test_results where name = 'alice_fee_receipt')
    ) entry
    where entry ->> 'entryKind' = 'fee'
  ),
  2,
  'Detailed receipt exposes both fee journal entries'
);

select extensions.finish();

rollback;
