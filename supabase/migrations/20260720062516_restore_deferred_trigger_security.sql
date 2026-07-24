-- A later CREATE OR REPLACE in wallet_native_workflows reset
-- validate_posted_transaction() to PostgreSQL's default SECURITY INVOKER.
-- Because its constraint trigger is DEFERRABLE INITIALLY DEFERRED, it fires
-- after a public RPC's SECURITY DEFINER context has returned. Restore the
-- trusted owner context without exposing the private ledger schema.

alter function demo_ledger.validate_posted_transaction()
  owner to postgres;
alter function demo_ledger.validate_posted_transaction()
  security definer;
alter function demo_ledger.validate_posted_transaction()
  set search_path = '';

alter function demo_ledger.validate_entry_balance()
  owner to postgres;
alter function demo_ledger.validate_entry_balance()
  security definer;
alter function demo_ledger.validate_entry_balance()
  set search_path = '';

revoke all privileges on function demo_ledger.validate_posted_transaction()
  from public, anon, authenticated;
revoke all privileges on function demo_ledger.validate_entry_balance()
  from public, anon, authenticated;

grant execute on function demo_ledger.validate_posted_transaction()
  to postgres, service_role;
grant execute on function demo_ledger.validate_entry_balance()
  to postgres, service_role;

comment on function demo_ledger.validate_posted_transaction() is
  'Deferred transaction invariant trigger. Runs as postgres because it fires after public RPC definer scope ends.';
comment on function demo_ledger.validate_entry_balance() is
  'Deferred journal invariant trigger. Runs as postgres because it fires after public RPC definer scope ends.';
