-- The professional ledger no longer exposes these legacy tables to browser
-- roles, but their retained rows still deserve complete FK coverage.

do $migration$
begin
  if pg_catalog.to_regclass('public.assets') is not null then
    execute 'create index if not exists assets_network_id_fk_idx on public.assets (network_id)';
  end if;
  if pg_catalog.to_regclass('public.mock_wallet_balances') is not null then
    execute 'create index if not exists mock_wallet_balances_asset_id_fk_idx on public.mock_wallet_balances (asset_id)';
  end if;
  if pg_catalog.to_regclass('public.mock_wallet_funding_events') is not null then
    execute 'create index if not exists mock_wallet_funding_events_asset_id_fk_idx on public.mock_wallet_funding_events (asset_id)';
    execute 'create index if not exists mock_wallet_funding_events_wallet_id_fk_idx on public.mock_wallet_funding_events (wallet_id)';
  end if;
  if pg_catalog.to_regclass('public.mock_wallet_transfers') is not null then
    execute 'create index if not exists mock_wallet_transfers_asset_id_fk_idx on public.mock_wallet_transfers (asset_id)';
    execute 'create index if not exists mock_wallet_transfers_from_wallet_id_fk_idx on public.mock_wallet_transfers (from_wallet_id)';
    execute 'create index if not exists mock_wallet_transfers_to_wallet_id_fk_idx on public.mock_wallet_transfers (to_wallet_id)';
  end if;
  if pg_catalog.to_regclass('public.transactions') is not null then
    execute 'create index if not exists transactions_wallet_id_fk_idx on public.transactions (wallet_id)';
  end if;
  if pg_catalog.to_regclass('public.user_balances') is not null then
    execute 'create index if not exists user_balances_asset_id_fk_idx on public.user_balances (asset_id)';
  end if;
  if pg_catalog.to_regclass('public.user_wallets') is not null then
    execute 'create index if not exists user_wallets_asset_id_fk_idx on public.user_wallets (asset_id)';
    execute 'create index if not exists user_wallets_wallet_id_fk_idx on public.user_wallets (wallet_id)';
  end if;
  if pg_catalog.to_regclass('public.wallet_transactions') is not null then
    execute 'create index if not exists wallet_transactions_asset_id_fk_idx on public.wallet_transactions (asset_id)';
  end if;
end;
$migration$;
