drop index if exists demo_ledger.activity_samples_wallet_created_idx;

create index activity_samples_wallet_owner_created_idx
  on demo_ledger.activity_samples (
    wallet_id,
    owner_id,
    created_at desc,
    id desc
  );

create index activity_samples_asset_idx
  on demo_ledger.activity_samples (asset_id);
