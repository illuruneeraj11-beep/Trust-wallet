import { topTradedTokens } from "@/data/trust-wallet";
import { supabase } from "@/lib/supabase";
import type { MockAsset, MockTransfer, MockWallet, MockWalletBalance, WalletWithBalances } from "@/types/wallet";

type BalanceRow = MockWalletBalance & {
  mock_wallet_assets: MockAsset | MockAsset[] | null;
};

const now = new Date().toISOString();
const remoteLedgerEnabled = Boolean(supabase && process.env.EXPO_PUBLIC_ENABLE_SUPABASE_LEDGER === "true");

const localAssets: MockAsset[] = [
  { id: "asset-usd", symbol: "USD", name: "US Dollar", decimals: 2, icon_key: null },
  ...topTradedTokens.map((token) => ({
    id: `asset-${token.symbol.toLowerCase()}`,
    symbol: token.symbol,
    name: token.name,
    decimals: token.symbol === "BTC" ? 8 : 6,
    icon_key: null,
  })),
];

const localWallets: WalletWithBalances[] = [
  {
    id: "wallet-main",
    owner_id: "local-demo",
    name: "Main Wallet 1",
    color: "#0500e8",
    sort_order: 1,
    created_at: now,
    updated_at: now,
    balances: [
      { wallet_id: "wallet-main", asset_id: "asset-usd", amount: 12840.72, mock_wallet_assets: localAssets[0] },
      ...topTradedTokens.map((token) => ({
        wallet_id: "wallet-main",
        asset_id: `asset-${token.symbol.toLowerCase()}`,
        amount: token.holdings ?? 0,
        mock_wallet_assets: localAssets.find((asset) => asset.symbol === token.symbol),
      })),
    ],
  },
  {
    id: "wallet-savings",
    owner_id: "local-demo",
    name: "Savings Wallet",
    color: "#00b894",
    sort_order: 2,
    created_at: now,
    updated_at: now,
    balances: [
      { wallet_id: "wallet-savings", asset_id: "asset-usd", amount: 4200, mock_wallet_assets: localAssets[0] },
      { wallet_id: "wallet-savings", asset_id: "asset-btc", amount: 0.015, mock_wallet_assets: localAssets.find((asset) => asset.symbol === "BTC") },
      { wallet_id: "wallet-savings", asset_id: "asset-eth", amount: 0.4, mock_wallet_assets: localAssets.find((asset) => asset.symbol === "ETH") },
    ],
  },
];

let localTransfers: MockTransfer[] = [
  {
    id: "transfer-demo-1",
    owner_id: "local-demo",
    from_wallet_id: "wallet-savings",
    to_wallet_id: "wallet-main",
    asset_id: "asset-usd",
    amount: 250,
    note: "Demo transfer",
    status: "completed",
    created_at: now,
  },
];

function logSupabaseFallback(error: unknown) {
  console.warn("Using local demo wallet data because Supabase is unavailable:", error);
}

function cloneWallets() {
  return localWallets.map((wallet) => ({
    ...wallet,
    balances: wallet.balances.map((balance) => ({ ...balance })),
  }));
}

function findLocalAsset(symbol: string) {
  return localAssets.find((asset) => asset.symbol.toLowerCase() === symbol.toLowerCase()) ?? localAssets[0];
}

function createLocalWallet(name: string) {
  const wallet: WalletWithBalances = {
    id: `wallet-${Date.now()}`,
    owner_id: "local-demo",
    name,
    color: "#0500e8",
    sort_order: localWallets.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    balances: [{ wallet_id: "", asset_id: "asset-usd", amount: 0, mock_wallet_assets: localAssets[0] }],
  };
  wallet.balances[0].wallet_id = wallet.id;
  localWallets.push(wallet);
  return wallet;
}

function fundLocalWallet(params: {
  walletId: string;
  assetSymbol: string;
  amount: number;
}) {
  const wallet = localWallets.find((item) => item.id === params.walletId);
  const asset = findLocalAsset(params.assetSymbol);
  const balance = wallet?.balances.find((item) => item.asset_id === asset.id);
  if (balance) {
    balance.amount = Number(balance.amount) + params.amount;
  } else if (wallet) {
    wallet.balances.push({ wallet_id: wallet.id, asset_id: asset.id, amount: params.amount, mock_wallet_assets: asset });
  }
  return { id: `fund-${Date.now()}` };
}

function transferLocalWallets(params: {
  fromWalletId: string;
  toWalletId: string;
  assetSymbol: string;
  amount: number;
  note?: string;
}) {
  const fromWallet = localWallets.find((wallet) => wallet.id === params.fromWalletId);
  const toWallet = localWallets.find((wallet) => wallet.id === params.toWalletId);
  const asset = findLocalAsset(params.assetSymbol);
  const fromBalance = fromWallet?.balances.find((balance) => balance.asset_id === asset.id);
  if (!fromWallet || !toWallet || !fromBalance || Number(fromBalance.amount) < params.amount) {
    throw new Error("Insufficient demo balance");
  }

  fromBalance.amount = Number(fromBalance.amount) - params.amount;
  const toBalance = toWallet.balances.find((balance) => balance.asset_id === asset.id);
  if (toBalance) {
    toBalance.amount = Number(toBalance.amount) + params.amount;
  } else {
    toWallet.balances.push({ wallet_id: toWallet.id, asset_id: asset.id, amount: params.amount, mock_wallet_assets: asset });
  }

  const transfer: MockTransfer = {
    id: `transfer-${Date.now()}`,
    owner_id: "local-demo",
    from_wallet_id: params.fromWalletId,
    to_wallet_id: params.toWalletId,
    asset_id: asset.id,
    amount: params.amount,
    note: params.note || null,
    status: "completed",
    created_at: new Date().toISOString(),
  };
  localTransfers = [transfer, ...localTransfers];
  return transfer;
}

export async function listAssets() {
  if (!remoteLedgerEnabled || !supabase) return localAssets;

  try {
    const { data, error } = await supabase
      .from("mock_wallet_assets")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as MockAsset[];
  } catch (error) {
    logSupabaseFallback(error);
    return localAssets;
  }
}

export async function listWallets(): Promise<WalletWithBalances[]> {
  if (!remoteLedgerEnabled || !supabase) return cloneWallets();

  try {
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
  } catch (error) {
    logSupabaseFallback(error);
    return cloneWallets();
  }
}

export async function createWallet(name: string) {
  if (!remoteLedgerEnabled || !supabase) {
    return createLocalWallet(name);
  }

  try {
    const { data, error } = await supabase.rpc("create_mock_wallet", { p_name: name });
    if (error) throw error;
    return data as MockWallet;
  } catch (error) {
    logSupabaseFallback(error);
    return createLocalWallet(name);
  }
}

export async function ensureStarterWallets() {
  const wallets = await listWallets();
  if (wallets.length) return wallets;

  await createWallet("Main Wallet 1");
  await createWallet("Savings Wallet");
  return listWallets();
}

export async function listTransfers() {
  if (!remoteLedgerEnabled || !supabase) return localTransfers;

  try {
    const { data, error } = await supabase
      .from("mock_wallet_transfers")
      .select("id, owner_id, from_wallet_id, to_wallet_id, asset_id, amount, note, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as MockTransfer[];
  } catch (error) {
    logSupabaseFallback(error);
    return localTransfers;
  }
}

export async function fundWallet(params: {
  walletId: string;
  assetSymbol: string;
  amount: number;
  dummyCardLast4: string;
  dummyCardBrand?: string;
}) {
  if (!remoteLedgerEnabled || !supabase) {
    return fundLocalWallet(params);
  }

  try {
    const { data, error } = await supabase.rpc("fund_mock_wallet", {
      p_wallet_id: params.walletId,
      p_asset_symbol: params.assetSymbol,
      p_amount: params.amount,
      p_dummy_card_last4: params.dummyCardLast4,
      p_dummy_card_brand: params.dummyCardBrand || "Demo Card",
    });

    if (error) throw error;
    return data;
  } catch (error) {
    logSupabaseFallback(error);
    return fundLocalWallet(params);
  }
}

export async function transferBetweenWallets(params: {
  fromWalletId: string;
  toWalletId: string;
  assetSymbol: string;
  amount: number;
  note?: string;
}) {
  if (!remoteLedgerEnabled || !supabase) {
    return transferLocalWallets(params);
  }

  try {
    const { data, error } = await supabase.rpc("transfer_between_mock_wallets", {
      p_from_wallet_id: params.fromWalletId,
      p_to_wallet_id: params.toWalletId,
      p_asset_symbol: params.assetSymbol,
      p_amount: params.amount,
      p_note: params.note || null,
    });

    if (error) throw error;
    return data as MockTransfer;
  } catch (error) {
    logSupabaseFallback(error);
    return transferLocalWallets(params);
  }
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
