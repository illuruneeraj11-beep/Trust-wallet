-- Native wallet workflow completion: owner-scoped wallet settings and
-- atomic transfers between two active wallets owned by the same user.

-- The original invariant rejected any transfer whose two wallets shared an
-- owner. Native wallet-to-wallet moves deliberately share an owner, so retain
-- the important same-wallet, journal, balance, and participant checks while
-- permitting two distinct wallets belonging to that owner.
create or replace function demo_ledger.validate_posted_transaction()
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
      where t.id = v_transaction_id
        and t.kind = 'transfer'
        and t.sender_wallet_id = t.recipient_wallet_id
    ) then
      raise exception 'Choose a different destination wallet'
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

-- Prevent every ledger writer (including the pre-existing funding and
-- cross-user transfer RPCs) from posting into a wallet after it is archived.
-- The key-share lock makes archive and balance projection mutually exclusive;
-- PostgreSQL may retry one participant in a rare opposing lock-order race, but
-- it cannot commit funds into a hidden wallet.
create function demo_ledger.reject_archived_wallet_projection()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_is_archived boolean;
begin
  select w.is_archived
  into v_is_archived
  from demo_ledger.ledger_accounts la
  join demo_ledger.wallets w on w.id = la.wallet_id
  where la.id = new.account_id
  for key share of w;

  if coalesce(v_is_archived, false) then
    raise exception 'Wallet is no longer active'
      using errcode = '55000';
  end if;

  return new;
end;
$function$;

create trigger active_wallet_projection_guard
before insert or update of posted_units, held_units on demo_ledger.account_balances
for each row execute function demo_ledger.reject_archived_wallet_projection();

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

create function public.rename_wallet(
  p_wallet_id uuid,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_name text := pg_catalog.btrim(coalesce(p_name, ''));
begin
  if pg_catalog.char_length(v_name) not between 1 and 80 then
    raise exception 'Wallet name must be between 1 and 80 characters'
      using errcode = '22023';
  end if;

  update demo_ledger.wallets w
  set name = v_name
  where w.id = p_wallet_id
    and w.owner_id = v_user_id
    and not w.is_archived;

  if not found then
    raise exception 'Wallet not found'
      using errcode = 'P0002';
  end if;

  insert into demo_ledger.audit_events (
    actor_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_user_id,
    'wallet_renamed',
    'wallet',
    p_wallet_id,
    pg_catalog.jsonb_build_object('name', v_name)
  );

  return demo_ledger.portfolio_json(v_user_id);
end;
$function$;

comment on function public.rename_wallet(uuid, text) is
  'Renames one active wallet owned by the authenticated user and returns the refreshed portfolio.';

create function public.archive_wallet(
  p_wallet_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := demo_ledger.require_user();
  v_active_wallets integer;
begin
  perform 1
  from demo_ledger.profiles p
  where p.user_id = v_user_id
  for update;

  perform 1
  from demo_ledger.wallets w
  where w.id = p_wallet_id
    and w.owner_id = v_user_id
    and not w.is_archived
  for update;

  if not found then
    raise exception 'Wallet not found'
      using errcode = 'P0002';
  end if;

  select pg_catalog.count(*)::integer
  into v_active_wallets
  from demo_ledger.wallets w
  where w.owner_id = v_user_id
    and not w.is_archived;

  if v_active_wallets <= 1 then
    raise exception 'Keep at least one active wallet'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from demo_ledger.ledger_accounts la
    join demo_ledger.account_balances b on b.account_id = la.id
    where la.wallet_id = p_wallet_id
      and (b.posted_units <> 0 or b.held_units <> 0)
  ) then
    raise exception 'Move all balances out before removing this wallet'
      using errcode = '22023';
  end if;

  update demo_ledger.wallets w
  set is_archived = true,
      archived_at = pg_catalog.now()
  where w.id = p_wallet_id
    and w.owner_id = v_user_id
    and not w.is_archived;

  insert into demo_ledger.audit_events (
    actor_id,
    event_type,
    entity_type,
    entity_id
  )
  values (v_user_id, 'wallet_archived', 'wallet', p_wallet_id);

  return demo_ledger.portfolio_json(v_user_id);
end;
$function$;

comment on function public.archive_wallet(uuid) is
  'Archives one active wallet owned by the authenticated user, while preserving its ledger history.';

create function public.transfer_between_wallets(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
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
  v_asset_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_asset_code, '')));
  v_amount_units numeric(78, 0) := demo_ledger.parse_positive_units(p_amount_units);
  v_note text := nullif(pg_catalog.btrim(p_note), '');
  v_request_hash text;
  v_replay jsonb;
  v_asset_id uuid;
  v_sender_account_id uuid;
  v_recipient_account_id uuid;
  v_lock_id uuid;
  v_available_units numeric(78, 0);
  v_transaction_id uuid := pg_catalog.gen_random_uuid();
  v_transaction jsonb;
  v_response jsonb;
  v_wallet_count integer;
begin
  if p_from_wallet_id = p_to_wallet_id then
    raise exception 'Choose a different destination wallet'
      using errcode = '22023';
  end if;
  if v_note is not null and pg_catalog.char_length(v_note) > 280 then
    raise exception 'Transfer note is too long'
      using errcode = '22023';
  end if;

  v_request_hash := demo_ledger.sha256_text(
    'wallet_transfer|' || p_from_wallet_id::text || '|' || p_to_wallet_id::text
      || '|' || v_asset_code || '|' || v_amount_units::text || '|'
      || coalesce(v_note, '')
  );
  v_replay := demo_ledger.claim_idempotency(
    v_user_id,
    'transfer_between_wallets',
    p_idempotency_key,
    v_request_hash
  );
  if v_replay is not null then
    return pg_catalog.jsonb_set(v_replay, '{replayed}', 'true'::jsonb, true);
  end if;

  select pg_catalog.count(*)::integer
  into v_wallet_count
  from (
    select w.id
    from demo_ledger.wallets w
    where w.id in (p_from_wallet_id, p_to_wallet_id)
      and w.owner_id = v_user_id
      and not w.is_archived
    order by w.id
    for update
  ) locked_wallets;

  if v_wallet_count <> 2 then
    raise exception 'Wallet not found'
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
    raise exception 'Asset not found'
      using errcode = 'P0002';
  end if;

  select la.id
  into v_sender_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id = p_from_wallet_id
    and la.owner_id = v_user_id
    and la.asset_id = v_asset_id
    and la.account_kind = 'user_asset';

  select la.id
  into v_recipient_account_id
  from demo_ledger.ledger_accounts la
  where la.wallet_id = p_to_wallet_id
    and la.owner_id = v_user_id
    and la.asset_id = v_asset_id
    and la.account_kind = 'user_asset';

  if v_sender_account_id is null or v_recipient_account_id is null then
    raise exception 'Asset account is missing for a wallet'
      using errcode = '55000';
  end if;

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

  if coalesce(v_available_units, 0) < v_amount_units then
    raise exception 'Insufficient available balance'
      using errcode = '22003';
  end if;

  insert into demo_ledger.transactions (
    id,
    kind,
    status,
    asset_id,
    amount_units,
    sender_wallet_id,
    recipient_wallet_id,
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
    p_to_wallet_id,
    'demo_' || demo_ledger.sha256_text('transaction|' || v_transaction_id::text),
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
    and h.account_id = v_sender_account_id
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
    (v_transaction_id, v_recipient_account_id, v_asset_id, v_amount_units, 'transfer');

  perform demo_ledger.apply_projection(
    v_sender_account_id,
    v_asset_id,
    -v_amount_units
  );
  perform demo_ledger.apply_projection(
    v_recipient_account_id,
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
    'wallet_transfer_confirmed',
    'transaction',
    v_transaction_id,
    pg_catalog.jsonb_build_object(
      'fromWalletId', p_from_wallet_id,
      'toWalletId', p_to_wallet_id,
      'assetCode', v_asset_code
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
    'transfer_between_wallets',
    p_idempotency_key,
    v_transaction_id,
    v_response
  );
  return v_response;
end;
$function$;

comment on function public.transfer_between_wallets(uuid, uuid, text, text, text, text) is
  'Atomically transfers one testnet asset between two active wallets owned by the authenticated user.';

revoke all privileges on function public.rename_wallet(uuid, text) from public, anon, authenticated;
revoke all privileges on function public.archive_wallet(uuid) from public, anon, authenticated;
revoke all privileges on function public.transfer_between_wallets(uuid, uuid, text, text, text, text) from public, anon, authenticated;

grant execute on function public.rename_wallet(uuid, text) to authenticated;
grant execute on function public.archive_wallet(uuid) to authenticated;
grant execute on function public.transfer_between_wallets(uuid, uuid, text, text, text, text) to authenticated;
