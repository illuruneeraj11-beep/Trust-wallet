-- Follow-up for hardening DDL authored after the base ledger migration was
-- already applied. Keep this migration independently replayable.

create index if not exists ledger_accounts_asset_idx
  on demo_ledger.ledger_accounts (asset_id);

create index if not exists recipient_tokens_recipient_wallet_idx
  on demo_ledger.recipient_tokens (recipient_wallet_id);

create index if not exists recipient_tokens_wallet_address_idx
  on demo_ledger.recipient_tokens (wallet_address_id);

create index if not exists recipient_tokens_network_idx
  on demo_ledger.recipient_tokens (network_id);

create index if not exists transfer_quotes_from_wallet_idx
  on demo_ledger.transfer_quotes (from_wallet_id);

create index if not exists transfer_quotes_recipient_wallet_idx
  on demo_ledger.transfer_quotes (recipient_wallet_id);

create index if not exists transfer_quotes_wallet_address_idx
  on demo_ledger.transfer_quotes (wallet_address_id);

create index if not exists transfer_quotes_asset_idx
  on demo_ledger.transfer_quotes (asset_id);

create index if not exists transfer_quotes_fee_asset_idx
  on demo_ledger.transfer_quotes (fee_asset_id)
  where fee_asset_id is not null;

create index if not exists transfer_quotes_used_transaction_idx
  on demo_ledger.transfer_quotes (used_transaction_id)
  where used_transaction_id is not null;

create index if not exists transactions_asset_idx
  on demo_ledger.transactions (asset_id);

create index if not exists transactions_fee_asset_idx
  on demo_ledger.transactions (fee_asset_id)
  where fee_asset_id is not null;

create index if not exists transaction_participants_wallet_idx
  on demo_ledger.transaction_participants (wallet_id, user_id);

create index if not exists account_holds_account_asset_idx
  on demo_ledger.account_holds (account_id, asset_id);

create index if not exists outbox_events_transaction_idx
  on demo_ledger.outbox_events (transaction_id)
  where transaction_id is not null;

create index if not exists idempotency_requests_transaction_idx
  on demo_ledger.idempotency_requests (transaction_id)
  where transaction_id is not null;

create index if not exists audit_events_actor_idx
  on demo_ledger.audit_events (actor_id, created_at desc)
  where actor_id is not null;

create index if not exists address_book_entries_wallet_address_idx
  on demo_ledger.address_book_entries (wallet_address_id);

create index if not exists demo_wallet_notifications_transaction_idx
  on public.demo_wallet_notifications (transaction_id)
  where transaction_id is not null;

drop trigger if exists outbox_events_are_immutable
  on demo_ledger.outbox_events;

create trigger outbox_events_are_immutable
before update or delete on demo_ledger.outbox_events
for each row execute function demo_ledger.reject_immutable_mutation();
