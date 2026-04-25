import { supabase } from "@/lib/supabase";
import type { MockAsset, MockTransfer, MockWallet, MockWalletBalance, WalletWithBalances } from "@/types/wallet";

type BalanceRow = MockWalletBalance & {
  mock_wallet_assets: MockAsset | MockAsset[] | null;
};

export async function listAssets() {
  const { data, error } = await supabase
    .from("mock_wallet_assets")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data as MockAsset[];
}

export async function listWallets(): Promise<WalletWithBalances[]> {
  const { data: wallets, error: walletsError } = await supabase
    .from("mock_wallets")
    .select("*")
    .order("sort_order", { ascending: true });

  if (walletsError) throw walletsError;
  if (!wallets?.length) return [];

  const walletIds = (wallets as MockWallet[]).map((wallet: MockWallet) => wallet.id);
  const { data: balances, error: balancesError } = await supabase
    .from("mock_wallet_balances")
    .select("wallet_id, asset_id, amount, updated_at, mock_wallet_assets(*)")
    .in("wallet_id", walletIds);

  if (balancesError) throw balancesError;

  const normalizedBalances = ((balances || []) as unknown as BalanceRow[]).map((balance) => ({
    ...balance,
    mock_wallet_assets: Array.isArray(balance.mock_wallet_assets)
      ? balance.mock_wallet_assets[0] ?? null
      : balance.mock_wallet_assets,
  })) as (MockWalletBalance & { mock_wallet_assets: MockAsset | null })[];

  return (wallets as MockWallet[]).map((wallet) => ({
    ...wallet,
    balances: normalizedBalances.filter((balance) => balance.wallet_id === wallet.id),
  }));
}

export async function createWallet(name: string) {
  const { data, error } = await supabase.rpc("create_mock_wallet", { p_name: name });
  if (error) throw error;
  return data as MockWallet;
}

export async function ensureStarterWallets() {
  const wallets = await listWallets();
  if (wallets.length) return wallets;

  await createWallet("Main Wallet 1");
  await createWallet("Savings Wallet");
  return listWallets();
}

export async function listTransfers() {
  const { data, error } = await supabase
    .from("mock_wallet_transfers")
    .select("id, owner_id, from_wallet_id, to_wallet_id, asset_id, amount, note, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as MockTransfer[];
}

export async function fundWallet(params: {
  walletId: string;
  assetSymbol: string;
  amount: number;
  dummyCardLast4: string;
  dummyCardBrand?: string;
}) {
  const { data, error } = await supabase.rpc("fund_mock_wallet", {
    p_wallet_id: params.walletId,
    p_asset_symbol: params.assetSymbol,
    p_amount: params.amount,
    p_dummy_card_last4: params.dummyCardLast4,
    p_dummy_card_brand: params.dummyCardBrand || "Demo Card",
  });

  if (error) throw error;
  return data;
}

export async function transferBetweenWallets(params: {
  fromWalletId: string;
  toWalletId: string;
  assetSymbol: string;
  amount: number;
  note?: string;
}) {
  const { data, error } = await supabase.rpc("transfer_between_mock_wallets", {
    p_from_wallet_id: params.fromWalletId,
    p_to_wallet_id: params.toWalletId,
    p_asset_symbol: params.assetSymbol,
    p_amount: params.amount,
    p_note: params.note || null,
  });

  if (error) throw error;
  return data as MockTransfer;
}

export function primaryBalance(wallet: WalletWithBalances, symbol = "USD") {
  const row = wallet.balances.find((balance) => balance.mock_wallet_assets?.symbol === symbol);
  return Number(row?.amount || 0);
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
