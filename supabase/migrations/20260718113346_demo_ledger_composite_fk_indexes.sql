-- Cover the remaining composite foreign keys reported by the hosted
-- Supabase performance advisor. These are read-path and delete/update
-- support indexes only; they do not change ledger behavior.

create index if not exists account_balances_account_asset_fk_idx
  on demo_ledger.account_balances (account_id, asset_id);

create index if not exists journal_entries_account_asset_fk_idx
  on demo_ledger.journal_entries (account_id, asset_id);

create index if not exists ledger_accounts_wallet_owner_fk_idx
  on demo_ledger.ledger_accounts (wallet_id, owner_id);
