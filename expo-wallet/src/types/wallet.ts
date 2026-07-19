export type LedgerMode = "connected" | "visual-demo";
export type LedgerStatus = "idle" | "loading" | "ready" | "refreshing" | "mutating" | "error";

export type DemoProfile = {
  id: string;
  handle: string;
  display_name: string;
};

export type MockAsset = {
  id: string;
  code: string;
  symbol: string;
  name: string;
  network: string;
  network_slug: string;
  network_name: string;
  decimals: number;
  icon_key: string | null;
};

export type MockWalletAddress = {
  id: string;
  wallet_id: string;
  network: string;
  network_slug: string;
  network_name: string;
  address: string;
  qr_payload: string;
  asset_id: string | null;
  asset_code: string | null;
};

export type MockWallet = {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  addresses: MockWalletAddress[];
};

export type MockWalletBalance = {
  wallet_id: string;
  account_id: string;
  asset_id: string;
  asset_code: string;
  amount: string;
  amount_units: string;
  posted_units: string;
  held_units: string;
  available_units: string;
  display_amount: string;
  updated_at: string | null;
  asset: MockAsset;
  /** Compatibility alias for the earlier prototype screens. */
  mock_wallet_assets: MockAsset;
};

export type WalletWithBalances = MockWallet & {
  balances: MockWalletBalance[];
};

export type TransferDirection = "incoming" | "outgoing" | "funding" | "self";
export type TransferStatus = "pending" | "confirmed" | "completed" | "failed" | "reversed";

export type MockTransfer = {
  id: string;
  transaction_id: string;
  owner_id: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  asset_id: string;
  asset_code: string;
  amount: string;
  amount_units: string;
  display_amount: string;
  fee_asset_code: string | null;
  fee_symbol: string | null;
  fee_decimals: number | null;
  fee_units: string;
  display_fee: string;
  direction: TransferDirection;
  type: "funding" | "transfer" | "reversal";
  note: string | null;
  status: TransferStatus;
  mock_hash: string | null;
  counterparty_display_name: string | null;
  counterparty_handle: string | null;
  counterparty_address: string | null;
  created_at: string;
  updated_at: string;
  asset: MockAsset;
};

export type DemoPortfolio = {
  profile: DemoProfile | null;
  assets: MockAsset[];
  wallets: WalletWithBalances[];
  as_of: string;
};

export type ResolvedRecipient = {
  recipient_token: string;
  display_name: string;
  handle: string | null;
  address: string | null;
  network_slug: string;
  expires_at: string | null;
};

export type DemoTransferQuote = {
  quote_id: string;
  recipient: ResolvedRecipient;
  asset: MockAsset;
  amount_units: string;
  display_amount: string;
  fee_asset_code: string | null;
  fee_asset: MockAsset | null;
  fee_units: string;
  display_fee: string;
  expires_at: string;
};

export type DemoTransactionReceipt = {
  transaction_id: string;
  status: TransferStatus;
  mock_hash: string | null;
  created_at: string;
  transfer: MockTransfer | null;
  portfolio: DemoPortfolio | null;
};

export type DemoActivityPage = {
  items: MockTransfer[];
  next_cursor: string | null;
};

export type FundDemoWalletInput = {
  walletId: string;
  assetId: string;
  amount: string;
  cardLast4?: string;
  cardBrand?: string;
  idempotencyKey?: string;
};

export type SendDemoTransferInput = {
  fromWalletId: string;
  recipient: string;
  assetId: string;
  amount: string;
  note?: string;
  idempotencyKey?: string;
};
