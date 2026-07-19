-- The professional ledger no longer exposes these legacy tables to browser
-- roles, but their retained rows still deserve complete FK coverage.

create index if not exists assets_network_id_fk_idx
  on public.assets (network_id);
create index if not exists mock_wallet_balances_asset_id_fk_idx
  on public.mock_wallet_balances (asset_id);
create index if not exists mock_wallet_funding_events_asset_id_fk_idx
  on public.mock_wallet_funding_events (asset_id);
create index if not exists mock_wallet_funding_events_wallet_id_fk_idx
  on public.mock_wallet_funding_events (wallet_id);
create index if not exists mock_wallet_transfers_asset_id_fk_idx
  on public.mock_wallet_transfers (asset_id);
create index if not exists mock_wallet_transfers_from_wallet_id_fk_idx
  on public.mock_wallet_transfers (from_wallet_id);
create index if not exists mock_wallet_transfers_to_wallet_id_fk_idx
  on public.mock_wallet_transfers (to_wallet_id);
create index if not exists transactions_wallet_id_fk_idx
  on public.transactions (wallet_id);
create index if not exists user_balances_asset_id_fk_idx
  on public.user_balances (asset_id);
create index if not exists user_wallets_asset_id_fk_idx
  on public.user_wallets (asset_id);
create index if not exists user_wallets_wallet_id_fk_idx
  on public.user_wallets (wallet_id);
create index if not exists wallet_transactions_asset_id_fk_idx
  on public.wallet_transactions (asset_id);
