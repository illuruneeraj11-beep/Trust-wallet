-- Add the common destination networks shown by the mobile send flow.
-- USDC variants use Circle's published mainnet contracts. The application
-- remains a simulated ledger and does not sign or broadcast transactions.

set lock_timeout = '5s';
set statement_timeout = '60s';

insert into demo_ledger.networks (
  id,
  slug,
  name,
  address_prefix,
  display_order
)
values
  (pg_catalog.gen_random_uuid(), 'arbitrum', 'Arbitrum One', 'demo:arbitrum:', 21),
  (pg_catalog.gen_random_uuid(), 'base', 'Base', 'demo:base:', 22),
  (pg_catalog.gen_random_uuid(), 'optimism', 'OP Mainnet', 'demo:optimism:', 23),
  (pg_catalog.gen_random_uuid(), 'polygon', 'Polygon', 'demo:polygon:', 24),
  (pg_catalog.gen_random_uuid(), 'avalanchec', 'Avalanche C-Chain', 'demo:avalanchec:', 25)
on conflict (slug) do update
set name = excluded.name,
    address_prefix = excluded.address_prefix,
    is_active = true,
    display_order = excluded.display_order;

update demo_ledger.networks
set name = 'Wallet'
where slug = 'demo';

with requested_assets (
  network_slug,
  asset_code,
  symbol,
  name,
  decimals,
  contract_identifier,
  display_order
) as (
  values
    ('arbitrum', 'ARB_USDC', 'USDC', 'USD Coin', 6, 'erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 81),
    ('avalanchec', 'AVAX_USDC', 'USDC', 'USD Coin', 6, 'erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 82),
    ('base', 'BASE_USDC', 'USDC', 'USD Coin', 6, 'erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 83),
    ('optimism', 'OP_USDC', 'USDC', 'USD Coin', 6, 'erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', 84),
    ('polygon', 'POLYGON_USDC', 'USDC', 'USD Coin', 6, 'erc20:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 85)
)
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
select
  pg_catalog.gen_random_uuid(),
  n.id,
  requested.asset_code,
  requested.symbol,
  requested.name,
  requested.decimals,
  false,
  requested.contract_identifier,
  'usdc',
  requested.display_order
from requested_assets requested
join demo_ledger.networks n on n.slug = requested.network_slug
on conflict (asset_code) do update
set network_id = excluded.network_id,
    symbol = excluded.symbol,
    name = excluded.name,
    decimals = excluded.decimals,
    is_native = false,
    contract_identifier = excluded.contract_identifier,
    icon_key = excluded.icon_key,
    is_active = true,
    display_order = excluded.display_order;

update demo_ledger.assets
set name = case
  when symbol = 'USD' then 'US Dollar'
  when symbol = 'USDC' then 'USD Coin'
  when symbol = 'USDT' then 'Tether USD'
  else name
end
where symbol in ('USD', 'USDC', 'USDT');

insert into demo_ledger.wallet_addresses (
  wallet_id,
  network_id,
  address
)
select
  w.id,
  n.id,
  n.address_prefix
    || pg_catalog.substr(
      pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
      1,
      24
    )
from demo_ledger.wallets w
cross join demo_ledger.networks n
where n.slug in ('arbitrum', 'avalanchec', 'base', 'optimism', 'polygon')
  and n.is_active
on conflict (wallet_id, network_id) do nothing;

insert into demo_ledger.ledger_accounts (
  wallet_id,
  owner_id,
  asset_id,
  account_kind
)
select
  w.id,
  w.owner_id,
  a.id,
  'user_asset'
from demo_ledger.wallets w
cross join demo_ledger.assets a
where a.asset_code in ('ARB_USDC', 'AVAX_USDC', 'BASE_USDC', 'OP_USDC', 'POLYGON_USDC')
  and a.is_active
on conflict do nothing;

insert into demo_ledger.account_balances (
  account_id,
  asset_id
)
select
  la.id,
  la.asset_id
from demo_ledger.ledger_accounts la
join demo_ledger.assets a on a.id = la.asset_id
where a.asset_code in ('ARB_USDC', 'AVAX_USDC', 'BASE_USDC', 'OP_USDC', 'POLYGON_USDC')
on conflict (account_id) do nothing;

select demo_ledger.ensure_system_accounts();

create or replace function demo_ledger.is_valid_destination_address(
  p_network_slug text,
  p_address text
)
returns boolean
language sql
immutable
strict
set search_path = ''
as $function$
  select case
    when pg_catalog.lower(p_network_slug) in (
      'arbitrum',
      'avalanchec',
      'base',
      'bsc',
      'ethereum',
      'optimism',
      'polygon'
    ) then p_address ~* '^0x[0-9a-f]{40}$'
    when pg_catalog.lower(p_network_slug) = 'bitcoin' then
      p_address ~ '^(bc1[ac-hj-np-z02-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$'
    when pg_catalog.lower(p_network_slug) = 'solana' then
      p_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'
    when pg_catalog.lower(p_network_slug) = 'tron' then
      p_address ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$'
    when pg_catalog.lower(p_network_slug) = 'demo' then
      p_address ~* '^demo_[a-z0-9_]{8,}$'
      or p_address ~* '^demo:demo:[0-9a-f]{24}$'
    else false
  end
$function$;

create or replace function public.send_to_external_address(
  p_from_wallet_id uuid,
  p_recipient_address text,
  p_asset_code text,
  p_amount_units text,
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
  v_recipient_address text := pg_catalog.btrim(coalesce(p_recipient_address, ''));
  v_asset_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_asset_code, '')));
  v_amount_units numeric(78, 0) := demo_ledger.parse_positive_units(p_amount_units);
  v_note text := nullif(pg_catalog.btrim(p_note), '');
  v_request_hash text;
  v_replay jsonb;
  v_asset_id uuid;
  v_network_slug text;
  v_sender_account_id uuid;
  v_external_account_id uuid;
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

  select a.id, n.slug
  into v_asset_id, v_network_slug
  from demo_ledger.assets a
  join demo_ledger.networks n on n.id = a.network_id
  where a.asset_code = v_asset_code
    and a.is_active
    and n.is_active;

  if v_asset_id is null then
    raise exception 'Asset not found'
      using errcode = 'P0002';
  end if;

  if not demo_ledger.is_valid_destination_address(
    v_network_slug,
    v_recipient_address
  ) then
    raise exception 'Enter a valid % address', v_network_slug
      using errcode = '22023';
  end if;

  v_request_hash := demo_ledger.sha256_text(
    'external_transfer|' || p_from_wallet_id::text || '|'
      || v_recipient_address || '|' || v_asset_code || '|'
      || v_amount_units::text || '|' || coalesce(v_note, '')
  );
  v_replay := demo_ledger.claim_idempotency(
    v_user_id,
    'send_to_external_address',
    p_idempotency_key,
    v_request_hash
  );
  if v_replay is not null then
    return pg_catalog.jsonb_set(v_replay, '{replayed}', 'true'::jsonb, true);
  end if;

  perform 1
  from demo_ledger.profiles p
  where p.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Account is not initialized'
      using errcode = 'P0002';
  end if;

  perform 1
  from demo_ledger.wallets w
  where w.id = p_from_wallet_id
    and w.owner_id = v_user_id
    and not w.is_archived
  for update;

  if not found then
    raise exception 'Wallet not found'
      using errcode = 'P0002';
  end if;

  perform demo_ledger.ensure_system_accounts();

  select la.id
  into v_sender_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id = p_from_wallet_id
    and la.owner_id = v_user_id
    and la.asset_id = v_asset_id
    and la.account_kind = 'user_asset';

  select la.id
  into v_external_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id is null
    and la.asset_id = v_asset_id
    and la.account_kind = 'external_sink'
    and la.system_key = 'external_sink';

  if v_sender_account_id is null or v_external_account_id is null then
    raise exception 'Ledger account is missing'
      using errcode = '55000';
  end if;

  for v_lock_id in
    select la.id
    from demo_ledger.ledger_accounts la
    where la.id in (v_sender_account_id, v_external_account_id)
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

  if coalesce(v_available_units, 0) < v_amount_units then
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
    sender_wallet_id,
    recipient_wallet_id,
    external_recipient_address,
    mock_hash,
    note,
    confirmed_at
  )
  values (
    v_transaction_id,
    'transfer',
    'confirmed',
    v_asset_id,
    v_amount_units,
    p_from_wallet_id,
    null,
    v_recipient_address,
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
  values (v_transaction_id, v_user_id, p_from_wallet_id, 'outgoing');

  insert into demo_ledger.transaction_status_events (
    transaction_id,
    event_index,
    status
  )
  values
    (v_transaction_id, 1, 'submitted'),
    (v_transaction_id, 2, 'pending'),
    (v_transaction_id, 3, 'confirmed');

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
    v_asset_id,
    v_amount_units,
    'open',
    pg_catalog.now() + interval '10 minutes'
  );

  update demo_ledger.account_balances b
  set held_units = b.held_units + v_amount_units,
      updated_at = pg_catalog.now()
  where b.account_id = v_sender_account_id;

  update demo_ledger.account_holds h
  set status = 'captured',
      resolved_at = pg_catalog.now()
  where h.transaction_id = v_transaction_id
    and h.status = 'open';

  update demo_ledger.account_balances b
  set held_units = b.held_units - v_amount_units,
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
    (v_transaction_id, v_sender_account_id, v_asset_id, -v_amount_units, 'transfer'),
    (v_transaction_id, v_external_account_id, v_asset_id, v_amount_units, 'transfer');

  perform demo_ledger.apply_projection(
    v_sender_account_id,
    v_asset_id,
    -v_amount_units
  );
  perform demo_ledger.apply_projection(
    v_external_account_id,
    v_asset_id,
    v_amount_units
  );

  insert into demo_ledger.outbox_events (
    user_id,
    event_type,
    transaction_id
  )
  values (v_user_id, 'transfer_confirmed', v_transaction_id);

  insert into demo_ledger.audit_events (
    actor_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_user_id,
    'external_transfer_confirmed',
    'transaction',
    v_transaction_id,
    pg_catalog.jsonb_build_object(
      'assetCode', v_asset_code,
      'network', v_network_slug,
      'recipientAddress', v_recipient_address
    )
  );

  v_transaction := demo_ledger.transaction_json(v_transaction_id, v_user_id);
  v_response := pg_catalog.jsonb_build_object(
    'replayed', false,
    'transaction', v_transaction,
    'portfolio', demo_ledger.portfolio_json(v_user_id)
  );

  perform demo_ledger.complete_idempotency(
    v_user_id,
    'send_to_external_address',
    p_idempotency_key,
    v_transaction_id,
    v_response
  );
  return v_response;
end;
$function$;

comment on function demo_ledger.is_valid_destination_address(text, text) is
  'Validates the public address shape for each simulated destination network.';

comment on function public.send_to_external_address(uuid, text, text, text, text, text) is
  'Confirms a simulated transfer to a format-valid external address, debits the sender, and credits an internal settlement account without broadcasting to a blockchain.';
