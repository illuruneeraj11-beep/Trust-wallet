-- Harden the connected wallet ledger after the native-wallet workflow release.
--
-- Lock order used by every balance writer in this migration:
--   owner profile (only when a per-owner quota requires it)
--   -> active wallet rows ordered by UUID
--   -> ledger account rows ordered by UUID
--   -> account balance rows ordered by account UUID.
-- This matches archive_wallet's profile -> wallet order and prevents a wallet
-- from being archived between validation and posting.

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
    'fromWalletName', case when sender_wallet.owner_id = p_user_id then sender_wallet.name end,
    'toWalletName', case when recipient_wallet.owner_id = p_user_id then recipient_wallet.name end,
    'note', t.note,
    'counterparty', case
      when t.kind in ('funding', 'opening_balance') then
        pg_catalog.jsonb_build_object(
          'handle', 'testnet-faucet',
          'displayName', 'Testnet Faucet'
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

create or replace function public.submit_transfer(
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
  v_fee_sender_account_id uuid;
  v_fee_collector_account_id uuid;
  v_lock_id uuid;
  v_wallet_count integer;
  v_balance record;
  v_transfer_available_units numeric(78, 0);
  v_fee_available_units numeric(78, 0);
  v_transfer_hold_units numeric(78, 0);
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

  -- Lock both participant wallets in UUID order, then evaluate ownership and
  -- archive state under those locks. This is the same wallet-before-account
  -- order used by native wallet transfers.
  select pg_catalog.count(*)::integer
  into v_wallet_count
  from (
    select w.id
    from demo_ledger.wallets w
    where w.id in (v_quote.from_wallet_id, v_quote.recipient_wallet_id)
      and not w.is_archived
      and (
        w.id = v_quote.recipient_wallet_id
        or (w.id = v_quote.from_wallet_id and w.owner_id = v_user_id)
      )
    order by w.id
    for update
  ) locked_wallets;

  if v_wallet_count <> 2 then
    raise exception 'Transfer wallet not found'
      using errcode = 'P0002';
  end if;

  select w.owner_id
  into v_recipient_user_id
  from demo_ledger.wallets w
  where w.id = v_quote.recipient_wallet_id;

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

  if v_quote.fee_units > 0 then
    perform demo_ledger.ensure_system_accounts();

    select la.id
    into v_fee_sender_account_id
    from demo_ledger.ledger_accounts la
    where la.wallet_id = v_quote.from_wallet_id
      and la.owner_id = v_user_id
      and la.asset_id = v_quote.fee_asset_id
      and la.account_kind = 'user_asset';

    select la.id
    into v_fee_collector_account_id
    from demo_ledger.ledger_accounts la
    where la.wallet_id is null
      and la.asset_id = v_quote.fee_asset_id
      and la.account_kind = 'fee_collector'
      and la.system_key = 'fee_collector';

    if v_fee_sender_account_id is null or v_fee_collector_account_id is null then
      raise exception 'Fee ledger account is missing'
        using errcode = '55000';
    end if;
  end if;

  -- Every affected account, including fee accounts, is locked in one stable
  -- order before any balance row is inspected or changed.
  for v_lock_id in
    select la.id
    from demo_ledger.ledger_accounts la
    where la.id in (
      v_sender_account_id,
      v_recipient_account_id,
      v_fee_sender_account_id,
      v_fee_collector_account_id
    )
    order by la.id
    for update
  loop
    null;
  end loop;

  for v_balance in
    select b.account_id, b.posted_units - b.held_units as available_units
    from demo_ledger.account_balances b
    where b.account_id in (v_sender_account_id, v_fee_sender_account_id)
    order by b.account_id
    for update
  loop
    if v_balance.account_id = v_sender_account_id then
      v_transfer_available_units := v_balance.available_units;
    end if;
    if v_balance.account_id = v_fee_sender_account_id then
      v_fee_available_units := v_balance.available_units;
    end if;
  end loop;

  if v_quote.fee_units > 0 and v_quote.fee_asset_id = v_quote.asset_id then
    if coalesce(v_transfer_available_units, 0) < v_quote.amount_units + v_quote.fee_units then
      raise exception 'Insufficient available balance'
        using errcode = '22003';
    end if;
  else
    if coalesce(v_transfer_available_units, 0) < v_quote.amount_units then
      raise exception 'Insufficient available balance'
        using errcode = '22003';
    end if;
    if v_quote.fee_units > 0
      and coalesce(v_fee_available_units, 0) < v_quote.fee_units then
      raise exception 'Insufficient fee balance'
        using errcode = '22003';
    end if;
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

  v_transfer_hold_units := v_quote.amount_units;
  if v_quote.fee_units > 0 and v_quote.fee_asset_id = v_quote.asset_id then
    v_transfer_hold_units := v_transfer_hold_units + v_quote.fee_units;
  end if;

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
    v_transfer_hold_units,
    'open',
    pg_catalog.now() + interval '10 minutes'
  );

  update demo_ledger.account_balances b
  set held_units = b.held_units + v_transfer_hold_units,
      updated_at = pg_catalog.now()
  where b.account_id = v_sender_account_id;

  if v_quote.fee_units > 0 and v_quote.fee_asset_id <> v_quote.asset_id then
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
      v_fee_sender_account_id,
      v_quote.fee_asset_id,
      v_quote.fee_units,
      'open',
      pg_catalog.now() + interval '10 minutes'
    );

    update demo_ledger.account_balances b
    set held_units = b.held_units + v_quote.fee_units,
        updated_at = pg_catalog.now()
    where b.account_id = v_fee_sender_account_id;
  end if;

  update demo_ledger.account_holds h
  set status = 'captured',
      resolved_at = pg_catalog.now()
  where h.transaction_id = v_transaction_id
    and h.status = 'open';

  update demo_ledger.account_balances b
  set held_units = b.held_units - v_transfer_hold_units,
      updated_at = pg_catalog.now()
  where b.account_id = v_sender_account_id;

  if v_quote.fee_units > 0 and v_quote.fee_asset_id <> v_quote.asset_id then
    update demo_ledger.account_balances b
    set held_units = b.held_units - v_quote.fee_units,
        updated_at = pg_catalog.now()
    where b.account_id = v_fee_sender_account_id;
  end if;

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

  if v_quote.fee_units > 0 then
    insert into demo_ledger.journal_entries (
      transaction_id,
      account_id,
      asset_id,
      amount_units,
      entry_kind
    )
    values
      (v_transaction_id, v_fee_sender_account_id, v_quote.fee_asset_id, -v_quote.fee_units, 'fee'),
      (v_transaction_id, v_fee_collector_account_id, v_quote.fee_asset_id, v_quote.fee_units, 'fee');
  end if;

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

  if v_quote.fee_units > 0 then
    perform demo_ledger.apply_projection(
      v_fee_sender_account_id,
      v_quote.fee_asset_id,
      -v_quote.fee_units
    );
    perform demo_ledger.apply_projection(
      v_fee_collector_account_id,
      v_quote.fee_asset_id,
      v_quote.fee_units
    );
  end if;

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
    entity_id,
    metadata
  )
  values (
    v_user_id,
    'demo_transfer_confirmed',
    'transaction',
    v_transaction_id,
    pg_catalog.jsonb_build_object(
      'feeAssetId', v_quote.fee_asset_id,
      'feeUnits', v_quote.fee_units::text
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
    'submit_transfer',
    p_idempotency_key,
    v_transaction_id,
    v_response
  );
  return v_response;
end;
$function$;

create or replace function public.add_demo_funds(
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

  -- Funding quotas and wallet archival serialize on the owner profile first.
  perform 1
  from demo_ledger.profiles p
  where p.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Demo account is not initialized'
      using errcode = 'P0002';
  end if;

  -- Revalidate the active destination while holding the same wallet lock used
  -- by archive_wallet. No funding can post after this wallet is archived.
  perform 1
  from demo_ledger.wallets w
  where w.id = p_wallet_id
    and w.owner_id = v_user_id
    and not w.is_archived
  for update;

  if not found then
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

revoke all privileges on function public.add_demo_funds(uuid, text, text, text)
  from public, anon, authenticated;
revoke all privileges on function public.submit_transfer(uuid, text, text)
  from public, anon, authenticated;
revoke all privileges on function demo_ledger.transaction_json(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.add_demo_funds(uuid, text, text, text)
  to authenticated;
grant execute on function public.submit_transfer(uuid, text, text)
  to authenticated;
grant execute on function demo_ledger.transaction_json(uuid, uuid)
  to service_role;
