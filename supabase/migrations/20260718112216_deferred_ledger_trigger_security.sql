-- Deferred constraint triggers fire after an RPC's SECURITY DEFINER context
-- has returned. Keep their private-table validation in the trusted owner
-- context while retaining an empty search_path.

alter function demo_ledger.validate_posted_transaction()
  security definer;
alter function demo_ledger.validate_posted_transaction()
  set search_path = '';

alter function demo_ledger.validate_entry_balance()
  security definer;
alter function demo_ledger.validate_entry_balance()
  set search_path = '';

-- These remain internal trigger functions, never browser-callable APIs.
revoke all privileges on function demo_ledger.validate_posted_transaction()
  from public, anon, authenticated;
revoke all privileges on function demo_ledger.validate_entry_balance()
  from public, anon, authenticated;
grant execute on function demo_ledger.validate_posted_transaction()
  to service_role;
grant execute on function demo_ledger.validate_entry_balance()
  to service_role;

comment on function demo_ledger.validate_posted_transaction() is
  'Deferred integrity trigger; runs as the trusted owner because it fires after the public RPC definer context exits.';
comment on function demo_ledger.validate_entry_balance() is
  'Deferred journal balance trigger; runs as the trusted owner because it fires after the public RPC definer context exits.';
