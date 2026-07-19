create or replace function demo_ledger.enforce_funding_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_recent_funding_count integer;
begin
  if new.kind <> 'funding' then
    return new;
  end if;

  if new.recipient_wallet_id is null then
    raise exception 'Funding requires a destination wallet'
      using errcode = '22023';
  end if;

  if new.amount_units > 1000000000000000000000000::numeric then
    raise exception 'Funding amount exceeds the Testnet limit'
      using errcode = '22003';
  end if;

  select w.owner_id
  into v_user_id
  from demo_ledger.wallets w
  where w.id = new.recipient_wallet_id
    and not w.is_archived;

  if v_user_id is null then
    raise exception 'Funding destination wallet not found'
      using errcode = 'P0002';
  end if;

  -- Serialize the rolling quota across every wallet owned by the same user.
  perform 1
  from demo_ledger.profiles p
  where p.user_id = v_user_id
  for update;

  select pg_catalog.count(*)::integer
  into v_recent_funding_count
  from demo_ledger.transactions t
  join demo_ledger.wallets w on w.id = t.recipient_wallet_id
  where t.kind = 'funding'
    and w.owner_id = v_user_id
    and t.created_at >= pg_catalog.now() - interval '24 hours';

  if v_recent_funding_count >= 25 then
    raise exception 'Testnet funding daily limit reached'
      using errcode = '54000';
  end if;

  return new;
end;
$function$;

revoke all privileges on function demo_ledger.enforce_funding_limits() from public, anon, authenticated;

drop trigger if exists enforce_funding_limits_before_insert
on demo_ledger.transactions;

create trigger enforce_funding_limits_before_insert
before insert on demo_ledger.transactions
for each row execute function demo_ledger.enforce_funding_limits();

comment on function demo_ledger.enforce_funding_limits() is
  'Caps Testnet funding size and enforces a serialized per-user rolling 24-hour request quota.';
