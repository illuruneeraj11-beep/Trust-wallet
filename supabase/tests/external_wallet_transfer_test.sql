-- Run after a fresh `supabase db reset` with:
--   supabase test db supabase/tests/external_wallet_transfer_test.sql
-- The test transaction rolls back all users, balances, and activity.

begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(15);

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
values (
  '00000000-0000-0000-0000-000000000000',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'authenticated',
  'authenticated',
  'external-transfer-test@example.invalid',
  extensions.crypt('test-password', extensions.gen_salt('bf')),
  pg_catalog.now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  pg_catalog.now(),
  pg_catalog.now()
);

create temporary table external_transfer_results (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select, insert, update, delete on external_transfer_results to authenticated;

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated","is_anonymous":false}';

insert into external_transfer_results (name, payload)
values (
  'bootstrap',
  public.bootstrap_demo_account(
    'external_sender',
    'External Sender',
    'Main Wallet 1',
    'external-bootstrap-0001'
  )
);

insert into external_transfer_results (name, payload)
select
  'fund',
  public.add_demo_funds(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    'ETH_USDT',
    '100000000',
    'external-fund-000001'
  );

insert into external_transfer_results (name, payload)
select
  'send',
  public.send_to_external_address(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    '0x1111111111111111111111111111111111111111',
    'ETH_USDT',
    '25000000',
    'external-send-000001',
    'External address test'
  );

select extensions.is(
  (select payload -> 'transaction' ->> 'status' from external_transfer_results where name = 'send'),
  'confirmed',
  'External transfer is confirmed'
);

select extensions.is(
  (select payload -> 'transaction' ->> 'direction' from external_transfer_results where name = 'send'),
  'outgoing',
  'External transfer is outgoing for the sender'
);

select extensions.is(
  (select payload -> 'transaction' -> 'counterparty' ->> 'displayName' from external_transfer_results where name = 'send'),
  'External wallet',
  'External transfer has a clear counterparty label'
);

select extensions.is(
  (select payload -> 'transaction' -> 'counterparty' ->> 'address' from external_transfer_results where name = 'send'),
  '0x1111111111111111111111111111111111111111',
  'External transfer preserves the exact recipient address'
);

select extensions.ok(
  (select payload -> 'transaction' ->> 'toWalletId' is null from external_transfer_results where name = 'send'),
  'External transfer does not invent a recipient wallet'
);

select extensions.is(
  (
    select account ->> 'availableUnits'
    from pg_catalog.jsonb_array_elements(
      public.get_portfolio() -> 'wallets' -> 0 -> 'accounts'
    ) account
    where account ->> 'assetCode' = 'ETH_USDT'
  ),
  '75000000',
  'Sender balance is debited once'
);

reset role;

select extensions.is(
  (
    select b.posted_units::text
    from demo_ledger.account_balances b
    join demo_ledger.ledger_accounts la on la.id = b.account_id
    join demo_ledger.assets a on a.id = la.asset_id
    where la.account_kind = 'external_sink'
      and la.system_key = 'external_sink'
      and a.asset_code = 'ETH_USDT'
  ),
  '25000000',
  'External settlement account receives the matching credit'
);

select extensions.is(
  (
    select coalesce(pg_catalog.sum(je.amount_units), 0)::text
    from demo_ledger.journal_entries je
    where je.transaction_id = (
      select (payload -> 'transaction' ->> 'id')::uuid
      from external_transfer_results
      where name = 'send'
    )
  ),
  '0',
  'External transfer journal entries conserve value exactly'
);

select extensions.is(
  (
    select pg_catalog.count(*)::text
    from demo_ledger.journal_entries je
    where je.transaction_id = (
      select (payload -> 'transaction' ->> 'id')::uuid
      from external_transfer_results
      where name = 'send'
    )
  ),
  '2',
  'External transfer posts exactly one debit and one credit'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated","is_anonymous":false}';

insert into external_transfer_results (name, payload)
select
  'retry',
  public.send_to_external_address(
    (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
    '0x1111111111111111111111111111111111111111',
    'ETH_USDT',
    '25000000',
    'external-send-000001',
    'External address test'
  );

select extensions.ok(
  (select (payload ->> 'replayed')::boolean from external_transfer_results where name = 'retry'),
  'Identical retry returns the stored response'
);

select extensions.is(
  (select payload -> 'transaction' ->> 'id' from external_transfer_results where name = 'retry'),
  (select payload -> 'transaction' ->> 'id' from external_transfer_results where name = 'send'),
  'Identical retry returns the original transaction'
);

select extensions.is(
  (
    select account ->> 'availableUnits'
    from pg_catalog.jsonb_array_elements(
      public.get_portfolio() -> 'wallets' -> 0 -> 'accounts'
    ) account
    where account ->> 'assetCode' = 'ETH_USDT'
  ),
  '75000000',
  'Identical retry does not debit the sender again'
);

select extensions.throws_ok(
  $test$
    select public.send_to_external_address(
      (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
      'not-an-ethereum-address',
      'ETH_USDT',
      '1000000',
      'external-send-invalid',
      null
    )
  $test$,
  '22023',
  'Enter a valid ethereum address',
  'Malformed network address is rejected'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.jsonb_array_elements(public.get_activity(null, 100) -> 'items') item
    where item ->> 'id' = (
      select payload -> 'transaction' ->> 'id'
      from external_transfer_results
      where name = 'send'
    )
      and item -> 'counterparty' ->> 'address' = '0x1111111111111111111111111111111111111111'
  ),
  'External transfer appears in persisted activity'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.jsonb_array_elements(
      public.get_wallet_activity(
        (public.get_portfolio() -> 'wallets' -> 0 ->> 'id')::uuid,
        null,
        100
      ) -> 'items'
    ) item
    where item ->> 'id' = (
      select payload -> 'transaction' ->> 'id'
      from external_transfer_results
      where name = 'send'
    )
  ),
  'Owned-wallet activity exposes the external transfer'
);

select * from extensions.finish();

rollback;
