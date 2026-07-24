-- Support confirmed simulated transfers to valid, unregistered network
-- addresses while preserving the ledger's double-entry invariant.
--
-- The destination is intentionally an internal settlement account. No
-- blockchain signing, broadcast, or real-asset movement occurs.

alter table demo_ledger.ledger_accounts
  drop constraint ledger_accounts_kind_check;

alter table demo_ledger.ledger_accounts
  add constraint ledger_accounts_kind_check check (
    (
      account_kind = 'user_asset'
      and wallet_id is not null
      and owner_id is not null
      and system_key is null
    )
    or (
      account_kind in ('demo_issuer', 'fee_collector', 'opening_equity', 'external_sink')
      and wallet_id is null
      and owner_id is null
      and system_key is not null
    )
  );

alter table demo_ledger.transactions
  add column external_recipient_address text;

alter table demo_ledger.transactions
  add constraint transactions_external_recipient_length_check check (
    external_recipient_address is null
    or pg_catalog.char_length(external_recipient_address) between 10 and 128
  );

alter table demo_ledger.transactions
  drop constraint transactions_shape;

alter table demo_ledger.transactions
  add constraint transactions_shape check (
    (
      kind in ('funding', 'opening_balance')
      and sender_wallet_id is null
      and recipient_wallet_id is not null
      and external_recipient_address is null
    )
    or (
      kind = 'transfer'
      and sender_wallet_id is not null
      and (
        (
          recipient_wallet_id is not null
          and external_recipient_address is null
          and sender_wallet_id <> recipient_wallet_id
        )
        or (
          recipient_wallet_id is null
          and external_recipient_address is not null
        )
      )
    )
    or (
      kind = 'reversal'
      and reverses_transaction_id is not null
      and external_recipient_address is null
    )
  );

create or replace function demo_ledger.ensure_system_accounts()
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

  insert into demo_ledger.ledger_accounts (
    asset_id,
    account_kind,
    system_key
  )
  select a.id, 'external_sink', 'external_sink'
  from demo_ledger.assets a
  where a.is_active
  on conflict do nothing;

  insert into demo_ledger.account_balances (account_id, asset_id)
  select la.id, la.asset_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id is null
  on conflict (account_id) do nothing;
end;
$function$;

select demo_ledger.ensure_system_accounts();

create or replace function demo_ledger.transaction_json(
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
    'feeAssetCode', fee_asset.asset_code,
    'feeSymbol', fee_asset.symbol,
    'feeDecimals', fee_asset.decimals,
    'feeUnits', t.fee_units::text,
    'createdAt', t.created_at,
    'confirmedAt', t.confirmed_at,
    'direction', case
      when t.sender_wallet_id is not null
        and t.recipient_wallet_id is not null
        and sender_wallet.owner_id = recipient_wallet.owner_id then 'self'
      else mine.direction
    end,
    'fromWalletId', t.sender_wallet_id,
    'toWalletId', t.recipient_wallet_id,
    'externalRecipientAddress', t.external_recipient_address,
    'fromWalletName', case when sender_wallet.owner_id = p_user_id then sender_wallet.name end,
    'toWalletName', case when recipient_wallet.owner_id = p_user_id then recipient_wallet.name end,
    'note', t.note,
    'counterparty', case
      when t.kind in ('funding', 'opening_balance') then
        pg_catalog.jsonb_build_object(
          'handle', 'testnet-faucet',
          'displayName', 'Testnet Faucet'
        )
      when t.external_recipient_address is not null then
        pg_catalog.jsonb_build_object(
          'handle', null,
          'displayName', 'External wallet',
          'address', t.external_recipient_address
        )
      when t.sender_wallet_id is not null
        and t.recipient_wallet_id is not null
        and sender_wallet.owner_id = recipient_wallet.owner_id then
        pg_catalog.jsonb_build_object(
          'handle', null,
          'displayName', recipient_wallet.name
        )
      else pg_catalog.jsonb_build_object(
        'handle', other_profile.handle,
        'displayName', other_profile.display_name
      )
    end
  )
  from demo_ledger.transactions t
  join demo_ledger.assets a on a.id = t.asset_id
  left join demo_ledger.assets fee_asset on fee_asset.id = t.fee_asset_id
  join demo_ledger.transaction_participants mine
    on mine.transaction_id = t.id
   and mine.user_id = p_user_id
  left join demo_ledger.wallets sender_wallet on sender_wallet.id = t.sender_wallet_id
  left join demo_ledger.wallets recipient_wallet on recipient_wallet.id = t.recipient_wallet_id
  left join demo_ledger.transaction_participants other_participant
    on other_participant.transaction_id = t.id
   and other_participant.user_id <> p_user_id
  left join demo_ledger.profiles other_profile
    on other_profile.user_id = other_participant.user_id
  where t.id = p_transaction_id
$function$;

create function public.send_to_external_address(
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

  if not (
    (v_network_slug in ('ethereum', 'bsc') and v_recipient_address ~* '^0x[0-9a-f]{40}$')
    or (v_network_slug = 'bitcoin' and v_recipient_address ~ '^(bc1[ac-hj-np-z02-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$')
    or (v_network_slug = 'solana' and v_recipient_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
    or (v_network_slug = 'tron' and v_recipient_address ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$')
    or (
      v_network_slug = 'demo'
      and (
        v_recipient_address ~* '^demo_[a-z0-9_]{8,}$'
        or v_recipient_address ~* '^demo:demo:[0-9a-f]{24}$'
      )
    )
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

comment on function public.send_to_external_address(uuid, text, text, text, text, text) is
  'Confirms a simulated transfer to a format-valid external address, debits the sender, and credits an internal settlement account without broadcasting to a blockchain.';

create function public.get_wallet_activity(
  p_wallet_id uuid,
  p_cursor text default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 100);
  v_items jsonb;
  v_has_more boolean;
  v_cursor_value jsonb;
  v_cursor_created_at timestamptz;
  v_cursor_id uuid;
  v_last_created_at timestamptz;
  v_last_id uuid;
  v_next_cursor text;
begin
  if not exists (
    select 1
    from demo_ledger.wallets w
    where w.id = p_wallet_id
      and w.owner_id = v_user_id
      and not w.is_archived
  ) then
    raise exception 'Wallet not found'
      using errcode = 'P0002';
  end if;

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
      and (t.sender_wallet_id = p_wallet_id or t.recipient_wallet_id = p_wallet_id)
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
      and (t.sender_wallet_id = p_wallet_id or t.recipient_wallet_id = p_wallet_id)
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
      and (t.sender_wallet_id = p_wallet_id or t.recipient_wallet_id = p_wallet_id)
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

comment on function public.get_wallet_activity(uuid, text, integer) is
  'Returns the latest persisted activity for one owned wallet with an opaque cursor and a maximum page size of 100.';

revoke all privileges on function public.send_to_external_address(uuid, text, text, text, text, text)
  from public, anon, authenticated;
revoke all privileges on function public.get_wallet_activity(uuid, text, integer)
  from public, anon, authenticated;

grant execute on function public.send_to_external_address(uuid, text, text, text, text, text)
  to authenticated, service_role;
grant execute on function public.get_wallet_activity(uuid, text, integer)
  to authenticated, service_role;

select pg_catalog.pg_notify('pgrst', 'reload schema');
