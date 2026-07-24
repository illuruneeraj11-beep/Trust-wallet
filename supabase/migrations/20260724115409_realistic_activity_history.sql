-- Display-only history gives every simulated wallet a deep, realistic activity
-- list without touching the double-entry ledger or wallet balances.
create table demo_ledger.activity_samples (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  wallet_id uuid not null,
  sample_index integer not null,
  direction text not null,
  asset_id uuid not null references demo_ledger.assets(id) on delete restrict,
  amount_units numeric(78, 0) not null,
  counterparty_display_name text not null,
  counterparty_handle text,
  counterparty_address text not null,
  created_at timestamptz not null,
  constraint activity_samples_wallet_owner_fk
    foreign key (wallet_id, owner_id)
    references demo_ledger.wallets(id, owner_id)
    on delete cascade,
  constraint activity_samples_index_range check (sample_index between 1 and 500),
  constraint activity_samples_direction check (direction in ('incoming', 'outgoing')),
  constraint activity_samples_amount_positive check (amount_units > 0),
  unique (wallet_id, sample_index)
);

create index activity_samples_wallet_created_idx
  on demo_ledger.activity_samples (wallet_id, created_at desc, id desc);

create index activity_samples_owner_wallet_idx
  on demo_ledger.activity_samples (owner_id, wallet_id);

alter table demo_ledger.activity_samples enable row level security;
revoke all privileges on table demo_ledger.activity_samples
  from public, anon, authenticated;

create function demo_ledger.seed_activity_samples(
  p_owner_id uuid,
  p_wallet_id uuid,
  p_target_count integer default 500
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_target_count integer := least(greatest(coalesce(p_target_count, 500), 0), 500);
  v_inserted integer;
begin
  if not exists (
    select 1
    from demo_ledger.wallets w
    where w.id = p_wallet_id
      and w.owner_id = p_owner_id
  ) then
    raise exception 'Wallet not found'
      using errcode = 'P0002';
  end if;

  with ranked_assets as (
    select
      a.id,
      a.asset_code,
      a.symbol,
      a.decimals,
      n.slug as network_slug,
      pg_catalog.row_number() over (order by a.display_order, a.asset_code) as asset_rank,
      pg_catalog.count(*) over () as asset_count
    from demo_ledger.assets a
    join demo_ledger.networks n on n.id = a.network_id
    where a.is_active
      and n.is_active
      and n.slug <> 'demo'
  ),
  generated as (
    select
      g.sample_index,
      case when g.sample_index % 2 = 0 then 'incoming' else 'outgoing' end as direction,
      a.id as asset_id,
      a.asset_code,
      a.symbol,
      a.decimals,
      a.network_slug,
      (
        array[
          'Alex Wallet',
          'Savings Wallet',
          'Trading Wallet',
          'Mobile Wallet',
          'Cold Storage',
          'Family Wallet',
          'Exchange Wallet',
          'Jordan Wallet',
          'Taylor Wallet',
          'Portfolio Wallet'
        ]::text[]
      )[((g.sample_index - 1) % 10) + 1] as counterparty_name
    from pg_catalog.generate_series(1, v_target_count) as g(sample_index)
    join ranked_assets a
      on a.asset_rank = ((g.sample_index - 1) % a.asset_count) + 1
  ),
  prepared as (
    select
      g.*,
      pg_catalog.round(
        (
          case g.symbol
            when 'BTC' then 0.0005::numeric + ((g.sample_index * 7919) % 100000)::numeric / 100000
            when 'ETH' then 0.01::numeric + ((g.sample_index * 7919) % 100000)::numeric / 50000
            when 'BNB' then 0.05::numeric + ((g.sample_index * 7919) % 100000)::numeric / 2000
            when 'SOL' then 0.25::numeric + ((g.sample_index * 7919) % 100000)::numeric / 1000
            when 'TRX' then 50::numeric + ((g.sample_index * 7919) % 50000)
            when 'TWT' then 5::numeric + ((g.sample_index * 7919) % 100000)::numeric / 25
            else 25::numeric + ((g.sample_index * 7919) % 100000)::numeric / 20
          end
        ) * pg_catalog.power(10::numeric, g.decimals)
      ) as amount_units,
      demo_ledger.sha256_text(
        p_wallet_id::text || '|' || g.network_slug || '|' || g.sample_index::text
      ) as address_hash
    from generated g
  )
  insert into demo_ledger.activity_samples (
    owner_id,
    wallet_id,
    sample_index,
    direction,
    asset_id,
    amount_units,
    counterparty_display_name,
    counterparty_handle,
    counterparty_address,
    created_at
  )
  select
    p_owner_id,
    p_wallet_id,
    p.sample_index,
    p.direction,
    p.asset_id,
    p.amount_units,
    p.counterparty_name,
    pg_catalog.replace(
      pg_catalog.lower(pg_catalog.replace(p.counterparty_name, ' Wallet', '')),
      ' ',
      '.'
    ),
    case
      when p.network_slug in ('ethereum', 'bsc', 'arbitrum', 'avalanchec', 'base', 'optimism', 'polygon')
        then '0x' || pg_catalog.substr(p.address_hash, 1, 40)
      when p.network_slug = 'bitcoin'
        then 'bc1q' || pg_catalog.substr(pg_catalog.translate(p.address_hash, '1b', '2c'), 1, 38)
      when p.network_slug = 'solana'
        then pg_catalog.substr(pg_catalog.translate(p.address_hash || p.address_hash, '01', '23'), 1, 44)
      when p.network_slug = 'tron'
        then 'T' || pg_catalog.substr(pg_catalog.translate(p.address_hash, '01', '23'), 1, 33)
      else 'demo:' || p.network_slug || ':' || pg_catalog.substr(p.address_hash, 1, 24)
    end,
    pg_catalog.now() - (p.sample_index * interval '13 hours')
  from prepared p
  on conflict (wallet_id, sample_index) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$function$;

comment on table demo_ledger.activity_samples is
  'Balance-neutral simulated activity used only to populate long wallet history lists.';
comment on function demo_ledger.seed_activity_samples(uuid, uuid, integer) is
  'Idempotently creates 250 incoming and 250 outgoing display-only history rows for one simulated wallet.';

revoke all privileges on function demo_ledger.seed_activity_samples(uuid, uuid, integer)
  from public, anon, authenticated;

create function demo_ledger.seed_wallet_activity_samples()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform demo_ledger.seed_activity_samples(new.owner_id, new.id, 500);
  return new;
end;
$function$;

revoke all privileges on function demo_ledger.seed_wallet_activity_samples()
  from public, anon, authenticated;

create trigger seed_wallet_activity_samples_after_insert
after insert on demo_ledger.wallets
for each row execute function demo_ledger.seed_wallet_activity_samples();

do $block$
declare
  v_wallet record;
begin
  for v_wallet in
    select w.owner_id, w.id
    from demo_ledger.wallets w
  loop
    perform demo_ledger.seed_activity_samples(v_wallet.owner_id, v_wallet.id, 500);
  end loop;
end;
$block$;

create or replace function public.get_wallet_activity(
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
  v_last_item jsonb;
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

  with activity as (
    select
      t.id,
      t.created_at,
      demo_ledger.transaction_json(t.id, v_user_id) as item
    from demo_ledger.transaction_participants tp
    join demo_ledger.transactions t on t.id = tp.transaction_id
    where tp.user_id = v_user_id
      and (t.sender_wallet_id = p_wallet_id or t.recipient_wallet_id = p_wallet_id)

    union all

    select
      s.id,
      s.created_at,
      pg_catalog.jsonb_build_object(
        'id', s.id,
        'kind', 'transfer',
        'status', 'confirmed',
        'mockHash', 'demo_' || demo_ledger.sha256_text(s.id::text),
        'assetCode', a.asset_code,
        'symbol', a.symbol,
        'decimals', a.decimals,
        'amountUnits', s.amount_units::text,
        'feeAssetCode', null,
        'feeSymbol', null,
        'feeDecimals', null,
        'feeUnits', '0',
        'createdAt', s.created_at,
        'confirmedAt', s.created_at,
        'direction', s.direction,
        'fromWalletId', case when s.direction = 'outgoing' then s.wallet_id end,
        'toWalletId', case when s.direction = 'incoming' then s.wallet_id end,
        'externalRecipientAddress', s.counterparty_address,
        'note', null,
        'counterparty', pg_catalog.jsonb_build_object(
          'handle', s.counterparty_handle,
          'displayName', s.counterparty_display_name,
          'address', s.counterparty_address
        ),
        'simulatedHistory', true
      ) as item
    from demo_ledger.activity_samples s
    join demo_ledger.assets a on a.id = s.asset_id
    where s.owner_id = v_user_id
      and s.wallet_id = p_wallet_id
  ),
  page as (
    select a.id, a.created_at, a.item
    from activity a
    where (
      v_cursor_created_at is null
      or (a.created_at, a.id) < (v_cursor_created_at, v_cursor_id)
    )
    order by a.created_at desc, a.id desc
    limit (v_limit + 1)
  )
  select
    coalesce(
      pg_catalog.jsonb_agg(p.item order by p.created_at desc, p.id desc),
      '[]'::jsonb
    ),
    pg_catalog.count(*) > v_limit
  into v_items, v_has_more
  from page p;

  if v_has_more then
    v_items := v_items - v_limit;
    v_last_item := v_items -> (v_limit - 1);
    v_next_cursor := pg_catalog.jsonb_build_object(
      'createdAt', v_last_item ->> 'createdAt',
      'id', v_last_item ->> 'id'
    )::text;
  end if;

  return pg_catalog.jsonb_build_object(
    'items', v_items,
    'nextCursor', v_next_cursor
  );
end;
$function$;

comment on function public.get_wallet_activity(uuid, text, integer) is
  'Returns real simulated-ledger activity plus balance-neutral sample history for one owned wallet, using an opaque cursor.';

revoke all privileges on function public.get_wallet_activity(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.get_wallet_activity(uuid, text, integer)
  to authenticated, service_role;

select pg_catalog.pg_notify('pgrst', 'reload schema');
