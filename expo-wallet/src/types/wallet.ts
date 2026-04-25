export type MockAsset = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  icon_key: string | null;
};

export type MockWallet = {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MockWalletBalance = {
  wallet_id: string;
  asset_id: string;
  amount: number;
  mock_wallet_assets?: MockAsset;
};

export type WalletWithBalances = MockWallet & {
  balances: MockWalletBalance[];
};

export type MockTransfer = {
  id: string;
  owner_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  asset_id: string;
  amount: number;
  note: string | null;
  status: "completed" | "failed";
  created_at: string;
};
