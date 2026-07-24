import AsyncStorage from "@react-native-async-storage/async-storage";
import { looksLikeWalletAddress } from "@/lib/wallet-addresses";
import { requireSupabase, supabase, walletRuntimeMode } from "@/lib/supabase";
import { baseUnitsToDecimal, decimalToBaseUnits } from "@/lib/wallet-amounts";
import type {
  DemoActivityPage,
  DemoPortfolio,
  DemoProfile,
  DemoTransactionReceipt,
  DemoTransferQuote,
  FundDemoWalletInput,
  MockAsset,
  MockTransfer,
  MockWallet,
  MockWalletAddress,
  MockWalletBalance,
  ResolvedRecipient,
  SendDemoTransferInput,
  TransferDirection,
  TransferStatus,
  WalletWithBalances,
} from "@/types/wallet";

type JsonRecord = Record<string, unknown>;

export class WalletLedgerError extends Error {
  code: string;

  constructor(message: string, code = "LEDGER_ERROR") {
    super(message);
    this.name = "WalletLedgerError";
    this.code = code;
  }
}

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstDefined(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

function string(source: JsonRecord, keys: string[], fallback = "") {
  const value = firstDefined(source, keys);
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function nullableString(source: JsonRecord, keys: string[]) {
  const value = string(source, keys);
  return value || null;
}

function integer(source: JsonRecord, keys: string[], fallback = 0) {
  const value = Number(firstDefined(source, keys));
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function body(value: unknown, key?: string) {
  const root = record(value);
  if (key && root[key] !== undefined) return root[key];
  const data = record(root.data);
  if (key && data[key] !== undefined) return data[key];
  if (Object.keys(data).length) return data;
  return value;
}

function normalizeUnits(value: unknown, fallback = "0") {
  const candidate = typeof value === "string" || typeof value === "number" ? String(value) : fallback;
  if (!/^-?\d+$/.test(candidate)) return fallback;
  const negative = candidate.startsWith("-");
  const digits = (negative ? candidate.slice(1) : candidate).replace(/^0+(?=\d)/, "");
  return `${negative && digits !== "0" ? "-" : ""}${digits || "0"}`;
}

function positiveUnits(value: unknown) {
  const units = normalizeUnits(value);
  if (units === "0" || units.startsWith("-")) {
    throw new WalletLedgerError("Amount must be greater than zero.", "INVALID_AMOUNT");
  }
  return units;
}

function displayLedgerLabel(value: string) {
  return value
    .replace(/US Dollar Demo Balance/gi, "US Dollar")
    .replace(/Demo Dollar Network/gi, "Wallet")
    .replace(/Demo Network/gi, "Wallet")
    .replace(/\s*\((?:Ethereum|BNB|Solana|Tron) Demo\)/gi, "")
    .replace(/\bDemo Wallet\b/gi, "Wallet")
    .trim();
}

function displayLedgerError(value: string) {
  return value
    .replace(/\bshared demo ledger\b/gi, "wallet ledger")
    .replace(/\bdemo account\b/gi, "wallet account")
    .replace(/\bdemo wallet\b/gi, "wallet")
    .replace(/\bdemo transfer\b/gi, "transfer")
    .replace(/\bdemo transaction\b/gi, "transaction")
    .replace(/\bdemo balance\b/gi, "balance")
    .replace(/\bdemo network\b/gi, "wallet network")
    .replace(/\bdemo handle\b/gi, "wallet handle");
}

function displayTransactionHash(value: string | null) {
  return value?.startsWith("demo_") ? `0x${value.slice("demo_".length)}` : value;
}

export { baseUnitsToDecimal, decimalToBaseUnits } from "@/lib/wallet-amounts";

export function makeIdempotencyKey(prefix: string) {
  const random = Math.random().toString(36).slice(2, 12);
  return `${prefix}:${Date.now().toString(36)}:${random}`;
}

function normalizeAsset(value: unknown, fallback?: Partial<MockAsset>): MockAsset {
  const row = record(value);
  const networkValue = record(row.network);
  const networkSlug = string(row, ["networkSlug", "network_slug", "network"], string(networkValue, ["slug", "code"], fallback?.network_slug ?? "demo"));
  const symbol = string(row, ["symbol", "assetSymbol", "asset_symbol"], fallback?.symbol ?? "TOKEN").toUpperCase();
  const code = string(row, ["assetCode", "code", "asset_code"], fallback?.code ?? `${networkSlug}:${symbol}`);
  return {
    id: string(row, ["id", "assetId", "asset_id"], fallback?.id ?? code),
    code,
    symbol,
    name: displayLedgerLabel(string(row, ["name", "assetName", "asset_name"], fallback?.name ?? symbol)),
    network: networkSlug,
    network_slug: networkSlug,
    network_name: displayLedgerLabel(string(row, ["networkName", "network_name"], string(networkValue, ["name"], fallback?.network_name ?? networkSlug))),
    decimals: integer(row, ["decimals"], fallback?.decimals ?? 0),
    icon_key: nullableString(row, ["iconKey", "icon_key", "icon"]) ?? fallback?.icon_key ?? null,
  };
}

function normalizeAddress(value: unknown, walletId: string): MockWalletAddress {
  const row = record(value);
  const networkValue = record(row.network);
  const networkSlug = string(row, ["networkSlug", "network_slug", "network"], string(networkValue, ["slug", "code"], "demo"));
  const address = string(row, ["address", "demo_address"]);
  return {
    id: string(row, ["id"], `${walletId}:${networkSlug}:${address}`),
    wallet_id: string(row, ["walletId", "wallet_id"], walletId),
    network: networkSlug,
    network_slug: networkSlug,
    network_name: displayLedgerLabel(string(row, ["networkName", "network_name"], string(networkValue, ["name"], networkSlug))),
    address,
    qr_payload: string(row, ["qrPayload", "qr_payload"], address),
    asset_id: nullableString(row, ["assetId", "asset_id"]),
    asset_code: nullableString(row, ["assetCode", "asset_code", "code"]),
  };
}

function normalizeBalance(value: unknown, walletId: string, assets: MockAsset[]): MockWalletBalance {
  const row = record(value);
  const nestedAsset = firstDefined(row, ["asset", "mock_wallet_assets"]);
  const assetCode = string(row, ["assetCode", "asset_code", "code"]);
  const assetId = string(row, ["assetId", "asset_id"]);
  const knownAsset = assets.find((item) => item.id === assetId || item.code === assetCode);
  const asset = normalizeAsset(nestedAsset ?? row, knownAsset ?? { id: assetId || assetCode, code: assetCode || assetId });
  const amountUnits = normalizeUnits(firstDefined(row, ["availableUnits", "available_units", "amountUnits", "amount_units", "balance_units", "postedUnits", "posted_units"]));
  const displayAmount = string(row, ["displayAmount", "display_amount", "amount"], baseUnitsToDecimal(amountUnits, asset.decimals));
  return {
    wallet_id: string(row, ["walletId", "wallet_id"], walletId),
    account_id: string(row, ["accountId", "account_id", "id"], `${walletId}:${asset.code}`),
    asset_id: asset.id,
    asset_code: asset.code,
    amount: displayAmount,
    amount_units: amountUnits,
    posted_units: normalizeUnits(firstDefined(row, ["postedUnits", "posted_units", "balance_units", "amountUnits", "amount_units"]), amountUnits),
    held_units: normalizeUnits(firstDefined(row, ["heldUnits", "held_units", "pendingUnits", "pending_units"])),
    available_units: amountUnits,
    display_amount: displayAmount,
    updated_at: nullableString(row, ["updatedAt", "updated_at"]),
    asset,
    mock_wallet_assets: asset,
  };
}

function normalizeWallet(value: unknown, ownerId: string, assets: MockAsset[]): WalletWithBalances {
  const row = record(value);
  const id = string(row, ["id", "walletId", "wallet_id"]);
  const createdAt = string(row, ["createdAt", "created_at"], new Date(0).toISOString());
  return {
    id,
    owner_id: string(row, ["ownerId", "owner_id", "userId", "user_id"], ownerId),
    name: displayLedgerLabel(string(row, ["name"], "Wallet")),
    color: string(row, ["color"], "#0500e8"),
    sort_order: integer(row, ["sortOrder", "sort_order"], 0),
    created_at: createdAt,
    updated_at: string(row, ["updatedAt", "updated_at"], createdAt),
    addresses: array(firstDefined(row, ["addresses", "walletAddresses", "wallet_addresses"])).map((item) => normalizeAddress(item, id)),
    balances: array(firstDefined(row, ["balances", "accounts"])).map((item) => normalizeBalance(item, id, assets)),
  };
}

function normalizeProfile(value: unknown): DemoProfile | null {
  const row = record(value);
  const id = string(row, ["id", "userId", "user_id"]);
  if (!id) return null;
  return {
    id,
    handle: string(row, ["handle"]),
    display_name: displayLedgerLabel(string(row, ["displayName", "display_name", "name"], "Wallet user")),
  };
}

function deriveAssets(walletRows: unknown[]) {
  return walletRows.flatMap((wallet) => array(firstDefined(record(wallet), ["balances", "accounts"])))
    .map((balance) => normalizeAsset(firstDefined(record(balance), ["asset", "mock_wallet_assets"]) ?? balance));
}

function uniqueAssets(assets: MockAsset[]) {
  return assets.filter((asset, index) => assets.findIndex((candidate) => candidate.id === asset.id || candidate.code === asset.code) === index);
}

export function normalizePortfolio(value: unknown): DemoPortfolio {
  const source = record(body(value, "portfolio"));
  const walletRows = array(firstDefined(source, ["wallets"]));
  const assets = uniqueAssets([
    ...array(firstDefined(source, ["assets"])).map((item) => normalizeAsset(item)),
    ...deriveAssets(walletRows),
  ]);
  const profile = normalizeProfile(firstDefined(source, ["profile", "user"]));
  const ownerId = profile?.id ?? string(source, ["userId", "user_id", "ownerId", "owner_id"]);
  return {
    profile,
    assets,
    wallets: walletRows.map((item) => normalizeWallet(item, ownerId, assets)),
    as_of: string(source, ["updatedAt", "asOf", "as_of", "updated_at"], new Date().toISOString()),
  };
}

function normalizeDirection(value: string): TransferDirection {
  return ["incoming", "outgoing", "funding", "self"].includes(value) ? value as TransferDirection : "outgoing";
}

function normalizeStatus(value: string): TransferStatus {
  return ["pending", "confirmed", "completed", "failed", "reversed"].includes(value) ? value as TransferStatus : "pending";
}

function normalizeTransfer(value: unknown, assets: MockAsset[] = []): MockTransfer {
  const row = record(value);
  const assetCode = string(row, ["assetCode", "asset_code", "code"]);
  const assetId = string(row, ["assetId", "asset_id"]);
  const knownAsset = assets.find((item) => item.id === assetId || item.code === assetCode);
  const asset = normalizeAsset(firstDefined(row, ["asset"]) ?? row, knownAsset ?? { id: assetId || assetCode, code: assetCode || assetId });
  const amountUnits = normalizeUnits(firstDefined(row, ["amountUnits", "amount_units", "units"]));
  const displayAmount = string(row, ["displayAmount", "display_amount", "amount"], baseUnitsToDecimal(amountUnits, asset.decimals));
  const feeUnits = normalizeUnits(firstDefined(row, ["feeUnits", "fee_units"]));
  const feeAssetCode = nullableString(row, ["feeAssetCode", "fee_asset_code"]);
  const feeSymbol = nullableString(row, ["feeSymbol", "fee_symbol"]);
  const rawFeeDecimals = firstDefined(row, ["feeDecimals", "fee_decimals"]);
  const feeDecimals = typeof rawFeeDecimals === "number" && Number.isInteger(rawFeeDecimals) && rawFeeDecimals >= 0 ? rawFeeDecimals : null;
  const id = string(row, ["transactionId", "transaction_id", "id"]);
  const createdAt = string(row, ["createdAt", "created_at"], new Date(0).toISOString());
  const counterparty = record(firstDefined(row, ["counterparty"]));
  const kind = string(row, ["kind", "type", "transactionType", "transaction_type"], "transfer");
  const normalizedType: MockTransfer["type"] = kind === "opening_balance" ? "funding" : kind as MockTransfer["type"];
  return {
    id,
    transaction_id: id,
    owner_id: string(row, ["ownerId", "owner_id", "userId", "user_id"]),
    from_wallet_id: nullableString(row, ["fromWalletId", "from_wallet_id"]),
    to_wallet_id: nullableString(row, ["toWalletId", "to_wallet_id"]),
    asset_id: asset.id,
    asset_code: asset.code,
    amount: displayAmount,
    amount_units: amountUnits,
    display_amount: displayAmount,
    fee_asset_code: feeAssetCode,
    fee_symbol: feeSymbol,
    fee_decimals: feeDecimals,
    fee_units: feeUnits,
    display_fee: baseUnitsToDecimal(feeUnits, feeDecimals ?? 0),
    direction: normalizedType === "funding" ? "funding" : normalizeDirection(string(row, ["direction"], "outgoing")),
    type: normalizedType,
    note: nullableString(row, ["note", "memo"]),
    status: normalizeStatus(string(row, ["status"], "pending")),
    mock_hash: displayTransactionHash(nullableString(row, ["mockHash", "mock_hash", "transactionHash", "transaction_hash", "hash"])),
    counterparty_display_name: nullableString(row, ["counterpartyDisplayName", "counterparty_display_name", "counterparty_name"]) ?? nullableString(counterparty, ["displayName", "display_name", "name"]),
    counterparty_handle: nullableString(row, ["counterpartyHandle", "counterparty_handle", "handle"]) ?? nullableString(counterparty, ["handle"]),
    counterparty_address: nullableString(row, ["counterpartyAddress", "counterparty_address", "address"]) ?? nullableString(counterparty, ["address"]),
    simulated_history: firstDefined(row, ["simulatedHistory", "simulated_history"]) === true,
    created_at: createdAt,
    updated_at: string(row, ["confirmedAt", "confirmed_at", "updatedAt", "updated_at"], createdAt),
    asset,
  };
}

function normalizeActivity(value: unknown, assets: MockAsset[] = []): DemoActivityPage {
  const source = record(body(value, "activity"));
  const items = array(firstDefined(source, ["items", "transactions", "activity"]));
  return {
    items: items.map((item) => normalizeTransfer(item, assets)),
    next_cursor: nullableString(source, ["nextCursor", "next_cursor", "cursor"]),
  };
}

function normalizeRecipient(value: unknown, networkSlug: string): ResolvedRecipient {
  const source = record(body(value, "recipient"));
  return {
    recipient_token: string(source, ["recipientToken", "recipient_token", "token", "id"]),
    display_name: displayLedgerLabel(string(source, ["displayName", "display_name", "name"], "Recipient")),
    handle: nullableString(source, ["handle"]),
    address: nullableString(source, ["address", "masked_address"]),
    network_slug: string(source, ["networkSlug", "network_slug"], networkSlug),
    expires_at: nullableString(source, ["expiresAt", "expires_at"]),
  };
}

function normalizeQuote(value: unknown, recipient?: ResolvedRecipient, asset?: MockAsset, assets: MockAsset[] = []): DemoTransferQuote {
  const source = record(body(value, "quote"));
  const quoteAsset = normalizeAsset(firstDefined(source, ["asset"]) ?? source, asset);
  const amountUnits = normalizeUnits(firstDefined(source, ["amountUnits", "amount_units"]));
  const feeUnits = normalizeUnits(firstDefined(source, ["feeUnits", "fee_units"]));
  const feeAssetCode = nullableString(source, ["feeAssetCode", "fee_asset_code"]);
  const feeAsset = assets.find((item) => item.code === feeAssetCode) ?? (feeAssetCode === quoteAsset.code ? quoteAsset : null);
  const normalizedRecipient = normalizeRecipient(firstDefined(source, ["recipient"]), recipient?.network_slug ?? asset?.network_slug ?? "demo");
  return {
    quote_id: string(source, ["quoteId", "quote_id", "id"]),
    recipient: { ...normalizedRecipient, recipient_token: normalizedRecipient.recipient_token || recipient?.recipient_token || "" },
    asset: quoteAsset,
    amount_units: amountUnits,
    display_amount: string(source, ["displayAmount", "display_amount", "amount"], baseUnitsToDecimal(amountUnits, quoteAsset.decimals)),
    fee_asset_code: feeAssetCode,
    fee_asset: feeAsset,
    fee_units: feeUnits,
    display_fee: string(source, ["displayFee", "display_fee", "fee"], baseUnitsToDecimal(feeUnits, feeAsset?.decimals ?? quoteAsset.decimals)),
    expires_at: string(source, ["expiresAt", "expires_at"], new Date(Date.now() + 60_000).toISOString()),
  };
}

function normalizeReceipt(value: unknown, assets: MockAsset[] = []): DemoTransactionReceipt {
  const envelope = record(body(value));
  const portfolioValue = firstDefined(envelope, ["portfolio"]);
  const portfolio = portfolioValue ? normalizePortfolio(portfolioValue) : null;
  const transferValue = firstDefined(envelope, ["transaction", "transfer", "activityItem", "activity_item"]) ?? envelope;
  const source = record(transferValue);
  const normalizedTransfer = normalizeTransfer(source, portfolio?.assets ?? assets);
  const id = string(source, ["transactionId", "transaction_id", "id"], normalizedTransfer.id);
  const createdAt = string(source, ["createdAt", "created_at"], new Date().toISOString());
  return {
    transaction_id: id,
    status: normalizeStatus(string(source, ["status"], "pending")),
    mock_hash: displayTransactionHash(nullableString(source, ["mockHash", "mock_hash", "transactionHash", "transaction_hash", "hash"])),
    created_at: createdAt,
    transfer: normalizedTransfer,
    portfolio,
  };
}

async function rpc(name: string, parameters: JsonRecord = {}) {
  const client = requireSupabase();
  const { data, error } = await client.rpc(name, parameters);
  if (error) throw new WalletLedgerError(displayLedgerError(error.message), error.code || "SUPABASE_RPC_ERROR");
  return data;
}

async function currentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw new WalletLedgerError(error.message, "AUTH_ERROR");
  if (!data.user || data.user.is_anonymous) {
    throw new WalletLedgerError("Sign in with an email account to use the wallet ledger.", "AUTH_REQUIRED");
  }
  return data.user;
}

export async function bootstrapDemoAccount(input?: {
  handle?: string;
  displayName?: string;
  walletName?: string;
  idempotencyKey?: string;
}) {
  const user = await currentUser();
  const existing = await getDemoPortfolio();
  if (existing.profile && existing.wallets.length) return existing;
  const emailName = user.email?.split("@")[0] ?? "demo-user";
  const sanitizedEmailName = emailName.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "demo_user";
  const handleBase = /^[a-z]/.test(sanitizedEmailName) ? sanitizedEmailName : `u_${sanitizedEmailName}`;
  await rpc("bootstrap_demo_account", {
    p_handle: input?.handle ?? `${handleBase.slice(0, 20)}_${user.id.replace(/-/g, "").slice(0, 6)}`,
    p_display_name: input?.displayName ?? emailName,
    p_wallet_name: input?.walletName ?? "Main Wallet 1",
    p_idempotency_key: input?.idempotencyKey ?? `bootstrap:${user.id}`,
  });
  return getDemoPortfolio();
}

export async function getDemoPortfolio() {
  return normalizePortfolio(await rpc("get_portfolio"));
}

export async function createDemoWallet(name: string, idempotencyKey = makeIdempotencyKey("wallet")) {
  const response = await rpc("create_demo_wallet", { p_name: name.trim(), p_idempotency_key: idempotencyKey });
  const portfolio = normalizePortfolio(response);
  const source = record(body(response));
  const walletValue = firstDefined(source, ["wallet"]);
  const wallet = walletValue ? normalizeWallet(walletValue, portfolio.profile?.id ?? "", portfolio.assets) : null;
  return { portfolio, wallet };
}

export async function resolveDemoRecipient(recipient: string, networkSlug: string) {
  return normalizeRecipient(await rpc("resolve_recipient", {
    p_recipient: recipient.trim(),
    p_network_slug: networkSlug,
  }), networkSlug);
}

export async function addDemoFunds(params: {
  walletId: string;
  assetCode: string;
  amountUnits: string;
  idempotencyKey?: string;
}) {
  return normalizeReceipt(await rpc("add_demo_funds", {
    p_wallet_id: params.walletId,
    p_asset_code: params.assetCode,
    p_amount_units: positiveUnits(params.amountUnits),
    p_idempotency_key: params.idempotencyKey ?? makeIdempotencyKey("fund"),
  }));
}

export async function createDemoTransferQuote(params: {
  fromWalletId: string;
  recipient: ResolvedRecipient;
  asset: MockAsset;
  assets?: MockAsset[];
  amountUnits: string;
}) {
  return normalizeQuote(await rpc("create_transfer_quote", {
    p_from_wallet_id: params.fromWalletId,
    p_recipient_token: params.recipient.recipient_token,
    p_asset_code: params.asset.code,
    p_amount_units: positiveUnits(params.amountUnits),
  }), params.recipient, params.asset, params.assets);
}

export async function submitDemoTransfer(params: {
  quoteId: string;
  idempotencyKey?: string;
  note?: string;
}) {
  return normalizeReceipt(await rpc("submit_transfer", {
    p_quote_id: params.quoteId,
    p_idempotency_key: params.idempotencyKey ?? makeIdempotencyKey("transfer"),
    p_note: params.note?.trim() || null,
  }));
}

export async function getDemoActivity(cursor: string | null = null, limit = 30, assets: MockAsset[] = []) {
  return normalizeActivity(await rpc("get_activity", { p_cursor: cursor, p_limit: limit }), assets);
}

export async function getWalletActivity(walletId: string, cursor: string | null = null, limit = 100, assets: MockAsset[] = []) {
  return normalizeActivity(await rpc("get_wallet_activity", {
    p_wallet_id: walletId,
    p_cursor: cursor,
    p_limit: limit,
  }), assets);
}

export async function getDemoTransaction(transactionId: string, assets: MockAsset[] = []) {
  return normalizeReceipt(await rpc("get_transaction", { p_transaction_id: transactionId }), assets);
}

const demoAssets: MockAsset[] = [
  { id: "demo-usd", code: "demo:USD", symbol: "USD", name: "US Dollar", network: "demo", network_slug: "demo", network_name: "Wallet", decimals: 2, icon_key: null },
  { id: "ethereum-usdt", code: "ethereum:USDT", symbol: "USDT", name: "Tether USD", network: "ethereum", network_slug: "ethereum", network_name: "Ethereum", decimals: 6, icon_key: "usdt" },
  { id: "ethereum-eth", code: "ethereum:ETH", symbol: "ETH", name: "Ethereum", network: "ethereum", network_slug: "ethereum", network_name: "Ethereum", decimals: 18, icon_key: "eth" },
  { id: "bitcoin-btc", code: "bitcoin:BTC", symbol: "BTC", name: "Bitcoin", network: "bitcoin", network_slug: "bitcoin", network_name: "Bitcoin", decimals: 8, icon_key: "btc" },
  { id: "bsc-bnb", code: "bsc:BNB", symbol: "BNB", name: "BNB", network: "bsc", network_slug: "bsc", network_name: "BNB Smart Chain", decimals: 18, icon_key: "bnb" },
  { id: "solana-sol", code: "solana:SOL", symbol: "SOL", name: "Solana", network: "solana", network_slug: "solana", network_name: "Solana", decimals: 9, icon_key: "sol" },
  { id: "tron-trx", code: "tron:TRX", symbol: "TRX", name: "TRON", network: "tron", network_slug: "tron", network_name: "Tron", decimals: 6, icon_key: "trx" },
  { id: "bsc-twt", code: "bsc:TWT", symbol: "TWT", name: "Trust Wallet Token", network: "bsc", network_slug: "bsc", network_name: "BNB Smart Chain", decimals: 18, icon_key: "twt" },
  { id: "ethereum-usdc", code: "ethereum:USDC", symbol: "USDC", name: "USD Coin", network: "ethereum", network_slug: "ethereum", network_name: "Ethereum", decimals: 6, icon_key: "usdc" },
  { id: "bsc-usdt", code: "bsc:USDT", symbol: "USDT", name: "Tether USD", network: "bsc", network_slug: "bsc", network_name: "BNB Smart Chain", decimals: 18, icon_key: "usdt" },
  { id: "solana-usdc", code: "solana:USDC", symbol: "USDC", name: "USD Coin", network: "solana", network_slug: "solana", network_name: "Solana", decimals: 6, icon_key: "usdc" },
  { id: "tron-usdt", code: "tron:USDT", symbol: "USDT", name: "Tether USD", network: "tron", network_slug: "tron", network_name: "Tron", decimals: 6, icon_key: "usdt" },
  { id: "arbitrum-usdc", code: "arbitrum:USDC", symbol: "USDC", name: "USD Coin", network: "arbitrum", network_slug: "arbitrum", network_name: "Arbitrum One", decimals: 6, icon_key: "usdc" },
  { id: "avalanchec-usdc", code: "avalanchec:USDC", symbol: "USDC", name: "USD Coin", network: "avalanchec", network_slug: "avalanchec", network_name: "Avalanche C-Chain", decimals: 6, icon_key: "usdc" },
  { id: "base-usdc", code: "base:USDC", symbol: "USDC", name: "USD Coin", network: "base", network_slug: "base", network_name: "Base", decimals: 6, icon_key: "usdc" },
  { id: "optimism-usdc", code: "optimism:USDC", symbol: "USDC", name: "USD Coin", network: "optimism", network_slug: "optimism", network_name: "OP Mainnet", decimals: 6, icon_key: "usdc" },
  { id: "polygon-usdc", code: "polygon:USDC", symbol: "USDC", name: "USD Coin", network: "polygon", network_slug: "polygon", network_name: "Polygon", decimals: 6, icon_key: "usdc" },
];

const demoTimestamp = "2026-07-18T12:00:00.000Z";
const SIMULATED_HISTORY_ITEMS_PER_WALLET = 500;
export const MAX_ACTIVITY_ITEMS_PER_WALLET = 1000;
/** The existing contract stress-test size. The UI can retain up to 1,000 rows per wallet. */
export const MAX_ACTIVITY_ITEMS = 500;
const ACTIVITY_PAGE_SIZE = 100;

function demoBalance(walletId: string, asset: MockAsset, amount: string): MockWalletBalance {
  const units = /^0(?:\.0+)?$/.test(amount) ? "0" : decimalToBaseUnits(amount, asset.decimals);
  return {
    wallet_id: walletId,
    account_id: `${walletId}:${asset.code}`,
    asset_id: asset.id,
    asset_code: asset.code,
    amount,
    amount_units: units,
    posted_units: units,
    held_units: "0",
    available_units: units,
    display_amount: amount,
    updated_at: demoTimestamp,
    asset,
    mock_wallet_assets: asset,
  };
}

function demoAddress(walletId: string, network: string, value: string): MockWalletAddress {
  return { id: `${walletId}:${network}`, wallet_id: walletId, network, network_slug: network, network_name: network[0].toUpperCase() + network.slice(1), address: value, qr_payload: `trust-testnet://receive?network=${encodeURIComponent(network)}&address=${encodeURIComponent(value)}`, asset_id: null, asset_code: null };
}

const demoWallets: WalletWithBalances[] = [
  {
    id: "visual-main",
    owner_id: "visual-demo",
    name: "Main Wallet 1",
    color: "#0500e8",
    sort_order: 1,
    created_at: demoTimestamp,
    updated_at: demoTimestamp,
    addresses: [
      demoAddress("visual-main", "demo", "demo_usd_7c91a0f58b2d4e36"),
      demoAddress("visual-main", "ethereum", "demo_eth_7c91a0f58b2d4e36"),
      demoAddress("visual-main", "bitcoin", "demo_btc_4a638fcab5e24a10"),
      demoAddress("visual-main", "bsc", "demo_bsc_633b0bf4b23c42ca"),
      demoAddress("visual-main", "solana", "demo_sol_84f1595df02749b9"),
      demoAddress("visual-main", "tron", "demo_trx_74281e5bbc7d4c31"),
      demoAddress("visual-main", "arbitrum", "demo_arbitrum_3218723557e44e9f"),
      demoAddress("visual-main", "avalanchec", "demo_avalanchec_a6da39d09b534e8e"),
      demoAddress("visual-main", "base", "demo_base_3f9567d5bbd04878"),
      demoAddress("visual-main", "optimism", "demo_optimism_f85462f24271443b"),
      demoAddress("visual-main", "polygon", "demo_polygon_319b897cdd8947dd"),
    ],
    balances: [
      demoBalance("visual-main", demoAssets[0], "12840.72"),
      demoBalance("visual-main", demoAssets[1], "1000"),
      demoBalance("visual-main", demoAssets[2], "3.25"),
      demoBalance("visual-main", demoAssets[3], "0.285"),
    ],
  },
];

let demoTransfers: MockTransfer[] = [];
let demoMutationSequence = 0;
const demoExternalSettlementUnits = new Map<string, bigint>();
const demoReceiptsByIdempotencyKey = new Map<string, { request: string; receipt: DemoTransactionReceipt }>();
const demoWalletsByIdempotencyKey = new Map<string, { request: string; wallet: WalletWithBalances }>();
type ConnectedTransferIntent = { request: string; quoteId: string };
const connectedTransferIntents = new Map<string, ConnectedTransferIntent>();
const connectedIntentStoragePrefix = "trust-wallet:transfer-intent:v1:";

async function loadConnectedTransferIntent(key: string) {
  const inMemory = connectedTransferIntents.get(key);
  if (inMemory) return inMemory;
  try {
    const raw = await AsyncStorage.getItem(`${connectedIntentStoragePrefix}${key}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<ConnectedTransferIntent>;
    if (typeof parsed.request !== "string" || typeof parsed.quoteId !== "string") return undefined;
    const intent = { request: parsed.request, quoteId: parsed.quoteId };
    connectedTransferIntents.set(key, intent);
    return intent;
  } catch {
    return undefined;
  }
}

async function saveConnectedTransferIntent(key: string, intent: ConnectedTransferIntent) {
  connectedTransferIntents.set(key, intent);
  await AsyncStorage.setItem(`${connectedIntentStoragePrefix}${key}`, JSON.stringify(intent));
}

async function clearConnectedTransferIntent(key: string) {
  connectedTransferIntents.delete(key);
  await AsyncStorage.removeItem(`${connectedIntentStoragePrefix}${key}`);
}

function demoUniqueId(prefix: string) {
  demoMutationSequence += 1;
  return `${prefix}-${Date.now()}-${demoMutationSequence}`;
}

const visualHistoryNames = [
  "Alex Wallet",
  "Savings Wallet",
  "Trading Wallet",
  "Mobile Wallet",
  "Cold Storage",
  "Family Wallet",
  "Exchange Wallet",
  "Jordan Wallet",
  "Taylor Wallet",
  "Portfolio Wallet",
];

function deterministicHex(seed: number, length: number) {
  let state = (seed + 1) >>> 0;
  let value = "";
  while (value.length < length) {
    state = (Math.imul(state ^ (state >>> 15), 2246822519) + 3266489917) >>> 0;
    value += state.toString(16).padStart(8, "0");
  }
  return value.slice(0, length);
}

function visualHistoryAddress(network: string, index: number) {
  const hex = deterministicHex(index + network.length * 1009, 80);
  const base58 = hex.replaceAll("0", "2").replaceAll("1", "3");
  if (["ethereum", "bsc", "arbitrum", "avalanchec", "base", "optimism", "polygon"].includes(network)) {
    return `0x${hex.slice(0, 40)}`;
  }
  if (network === "bitcoin") return `bc1q${hex.replaceAll("1", "2").replaceAll("b", "c").slice(0, 38)}`;
  if (network === "solana") return base58.slice(0, 44);
  if (network === "tron") return `T${base58.slice(0, 33)}`;
  return `demo:${network}:${hex.slice(0, 24)}`;
}

function visualHistoryAmount(asset: MockAsset, index: number) {
  const cycle = (index * 7919) % 100000;
  if (asset.symbol === "BTC") return (0.0005 + cycle / 100000).toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  if (asset.symbol === "ETH") return (0.01 + cycle / 50000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  if (asset.symbol === "BNB") return (0.05 + cycle / 2000).toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
  if (asset.symbol === "SOL") return (0.25 + cycle / 1000).toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  if (asset.symbol === "TRX") return String(50 + (cycle % 50000));
  if (asset.symbol === "TWT") return (5 + cycle / 25).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return (25 + cycle / 20).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function ensureVisualActivityHistory(wallet: WalletWithBalances) {
  const existing = demoTransfers.filter((item) => item.simulated_history && (item.from_wallet_id === wallet.id || item.to_wallet_id === wallet.id)).length;
  if (existing >= SIMULATED_HISTORY_ITEMS_PER_WALLET) return;

  const assets = demoAssets.filter((asset) => asset.network_slug !== "demo");
  const anchor = Date.parse(demoTimestamp);
  const generated = Array.from({ length: SIMULATED_HISTORY_ITEMS_PER_WALLET }, (_, offset): MockTransfer => {
    const index = offset + 1;
    const incoming = index % 2 === 0;
    const asset = assets[offset % assets.length];
    const counterparty = visualHistoryNames[offset % visualHistoryNames.length];
    const amount = visualHistoryAmount(asset, index);
    const timestamp = new Date(anchor - index * 13 * 60 * 60 * 1000).toISOString();
    const hash = deterministicHex(index + wallet.id.length * 4093, 64);
    const id = `visual-history-${wallet.id}-${index.toString().padStart(3, "0")}`;
    return {
      id,
      transaction_id: id,
      owner_id: wallet.owner_id,
      from_wallet_id: incoming ? null : wallet.id,
      to_wallet_id: incoming ? wallet.id : null,
      asset_id: asset.id,
      asset_code: asset.code,
      amount,
      amount_units: decimalToBaseUnits(amount, asset.decimals),
      display_amount: amount,
      fee_asset_code: null,
      fee_symbol: null,
      fee_decimals: null,
      fee_units: "0",
      display_fee: "0",
      direction: incoming ? "incoming" : "outgoing",
      type: "transfer",
      note: null,
      status: "confirmed",
      mock_hash: `0x${hash}`,
      counterparty_display_name: counterparty,
      counterparty_handle: counterparty.toLowerCase().replaceAll(" wallet", "").replaceAll(" ", "."),
      counterparty_address: visualHistoryAddress(asset.network_slug, index),
      simulated_history: true,
      created_at: timestamp,
      updated_at: timestamp,
      asset,
    };
  });
  demoTransfers = [...demoTransfers, ...generated].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at) || right.id.localeCompare(left.id));
}

function replayVisualMutation(idempotencyKey: string, request: JsonRecord) {
  const requestHash = JSON.stringify(request);
  const existing = demoReceiptsByIdempotencyKey.get(idempotencyKey);
  if (!existing) return { requestHash, receipt: null };
  if (existing.request !== requestHash) {
    throw new WalletLedgerError("That retry key was already used for a different transaction.", "IDEMPOTENCY_CONFLICT");
  }
  return { requestHash, receipt: existing.receipt };
}

function cloneDemoPortfolio(): DemoPortfolio {
  return {
    profile: { id: "visual-demo", handle: "wallet.user", display_name: "Wallet User" },
    assets: demoAssets.map((asset) => ({ ...asset })),
    wallets: demoWallets.map((wallet) => ({
      ...wallet,
      addresses: wallet.addresses.map((address) => ({ ...address })),
      balances: wallet.balances.map((balance) => ({ ...balance, asset: { ...balance.asset }, mock_wallet_assets: { ...balance.mock_wallet_assets } })),
    })),
    as_of: new Date().toISOString(),
  };
}

function findAsset(portfolio: DemoPortfolio, assetId: string) {
  const asset = portfolio.assets.find((item) => item.id === assetId || item.code === assetId || item.symbol.toLowerCase() === assetId.toLowerCase());
  if (!asset) throw new WalletLedgerError("That asset is not available in this wallet.", "ASSET_NOT_FOUND");
  return asset;
}

function mutateDemoBalance(walletId: string, asset: MockAsset, deltaUnits: string) {
  const wallet = demoWallets.find((item) => item.id === walletId);
  if (!wallet) throw new WalletLedgerError("Wallet not found.", "WALLET_NOT_FOUND");
  let balance = wallet.balances.find((item) => item.asset_code === asset.code);
  if (!balance) {
    balance = demoBalance(wallet.id, asset, "0.0");
    wallet.balances.push(balance);
  }
  const next = BigInt(balance.available_units) + BigInt(deltaUnits);
  if (next < 0n) throw new WalletLedgerError("Insufficient balance.", "INSUFFICIENT_FUNDS");
  const units = next.toString();
  const display = baseUnitsToDecimal(units, asset.decimals);
  Object.assign(balance, { amount: display, amount_units: units, posted_units: units, available_units: units, display_amount: display, updated_at: new Date().toISOString() });
}

function demoReceipt(transfer: MockTransfer): DemoTransactionReceipt {
  return { transaction_id: transfer.id, status: transfer.status, mock_hash: transfer.mock_hash, created_at: transfer.created_at, transfer, portfolio: cloneDemoPortfolio() };
}

export async function getPortfolio(): Promise<DemoPortfolio> {
  return walletRuntimeMode === "visual-demo" ? cloneDemoPortfolio() : getDemoPortfolio();
}

export async function ensureStarterWallets() {
  return (walletRuntimeMode === "visual-demo" ? cloneDemoPortfolio() : await bootstrapDemoAccount()).wallets;
}

export async function listAssets() {
  return (await getPortfolio()).assets;
}

export async function listWallets() {
  return (await getPortfolio()).wallets;
}

export async function createWallet(name: string, idempotencyKey = makeIdempotencyKey("wallet")) {
  const nextName = name.trim();
  if (!nextName || nextName.length > 80) {
    throw new WalletLedgerError("Wallet name must be between 1 and 80 characters.", "INVALID_WALLET_NAME");
  }
  if (walletRuntimeMode === "visual-demo") {
    if (demoWallets.length >= 10) throw new WalletLedgerError("You can keep up to 10 active wallets.", "WALLET_LIMIT");
    const request = JSON.stringify({ operation: "create-wallet", name: nextName });
    const existing = demoWalletsByIdempotencyKey.get(idempotencyKey);
    if (existing) {
      if (existing.request !== request) {
        throw new WalletLedgerError("That retry key was already used for a different wallet.", "IDEMPOTENCY_CONFLICT");
      }
      return existing.wallet;
    }
    const id = demoUniqueId("visual-wallet");
    const networks = Array.from(new Set(demoAssets.map((asset) => asset.network_slug)));
    const wallet: WalletWithBalances = {
      id,
      owner_id: "visual-demo",
      name: nextName,
      color: "#0500e8",
      sort_order: demoWallets.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      addresses: networks.map((network) => demoAddress(id, network, `demo_${network}_${Math.random().toString(16).slice(2, 18)}`)),
      balances: [],
    };
    demoWallets.push(wallet);
    demoWalletsByIdempotencyKey.set(idempotencyKey, { request, wallet });
    return wallet;
  }
  const before = await getDemoPortfolio();
  const created = await createDemoWallet(nextName, idempotencyKey);
  if (created.wallet?.id) return created.wallet;
  return created.portfolio.wallets.find((wallet) => !before.wallets.some((old) => old.id === wallet.id)) ?? created.portfolio.wallets.at(-1) as MockWallet;
}

export async function renameWallet(walletId: string, name: string) {
  const nextName = name.trim();
  if (!nextName || nextName.length > 80) {
    throw new WalletLedgerError("Wallet name must be between 1 and 80 characters.", "INVALID_WALLET_NAME");
  }
  if (walletRuntimeMode === "visual-demo") {
    const wallet = demoWallets.find((item) => item.id === walletId);
    if (!wallet) throw new WalletLedgerError("Wallet not found.", "WALLET_NOT_FOUND");
    wallet.name = nextName;
    wallet.updated_at = new Date().toISOString();
    return cloneDemoPortfolio();
  }
  return normalizePortfolio(await rpc("rename_wallet", { p_wallet_id: walletId, p_name: nextName }));
}

export async function archiveWallet(walletId: string) {
  if (walletRuntimeMode === "visual-demo") {
    if (demoWallets.length <= 1) throw new WalletLedgerError("Keep at least one active wallet.", "LAST_WALLET");
    const index = demoWallets.findIndex((item) => item.id === walletId);
    if (index < 0) throw new WalletLedgerError("Wallet not found.", "WALLET_NOT_FOUND");
    if (demoWallets[index].balances.some((balance) => BigInt(balance.posted_units) !== 0n || BigInt(balance.held_units) !== 0n)) {
      throw new WalletLedgerError("Move all balances out of this wallet before removing it.", "WALLET_NOT_EMPTY");
    }
    demoWallets.splice(index, 1);
    return cloneDemoPortfolio();
  }
  return normalizePortfolio(await rpc("archive_wallet", { p_wallet_id: walletId }));
}

export async function listTransfers() {
  if (walletRuntimeMode === "visual-demo") {
    for (const wallet of demoWallets) ensureVisualActivityHistory(wallet);
    const visibleIds = new Set<string>();
    for (const wallet of demoWallets) {
      let count = 0;
      for (const transfer of demoTransfers) {
        if (transfer.from_wallet_id !== wallet.id && transfer.to_wallet_id !== wallet.id) continue;
        visibleIds.add(transfer.id);
        count += 1;
        if (count >= MAX_ACTIVITY_ITEMS_PER_WALLET) break;
      }
    }
    return demoTransfers.filter((item) => visibleIds.has(item.id)).map((item) => ({ ...item }));
  }
  const portfolio = await getDemoPortfolio();
  const perWallet = await Promise.all(portfolio.wallets.map(async (wallet) => {
    const transfers: MockTransfer[] = [];
    let cursor: string | null = null;
    while (transfers.length < MAX_ACTIVITY_ITEMS_PER_WALLET) {
      const page = await getWalletActivity(
        wallet.id,
        cursor,
        Math.min(ACTIVITY_PAGE_SIZE, MAX_ACTIVITY_ITEMS_PER_WALLET - transfers.length),
        portfolio.assets,
      );
      transfers.push(...page.items);
      if (!page.next_cursor || page.next_cursor === cursor || !page.items.length) break;
      cursor = page.next_cursor;
    }
    return transfers;
  }));
  const unique = new Map<string, MockTransfer>();
  for (const transfers of perWallet) {
    for (const transfer of transfers) {
      if (!unique.has(transfer.id)) {
        unique.set(transfer.id, transfer);
      }
    }
  }

  return Array.from(unique.values()).sort((left, right) => {
    const byTime = Date.parse(right.created_at) - Date.parse(left.created_at);
    return byTime || right.id.localeCompare(left.id);
  });
}

export async function fundDemoWallet(params: FundDemoWalletInput) {
  const portfolio = await getPortfolio();
  const asset = findAsset(portfolio, params.assetId);
  const amountUnits = decimalToBaseUnits(params.amount, asset.decimals);
  if (BigInt(amountUnits) > 10n ** 24n) {
    throw new WalletLedgerError("Amount exceeds the maximum allowed per funding request.", "AMOUNT_TOO_LARGE");
  }
  if (walletRuntimeMode === "visual-demo") {
    const idempotencyKey = params.idempotencyKey ?? makeIdempotencyKey("visual-fund");
    const replay = replayVisualMutation(idempotencyKey, {
      operation: "fund",
      walletId: params.walletId,
      assetCode: asset.code,
      amountUnits,
      cardLast4: params.cardLast4 ?? null,
      cardBrand: params.cardBrand ?? null,
    });
    if (replay.receipt) return replay.receipt;
    mutateDemoBalance(params.walletId, asset, amountUnits);
    const createdAt = new Date().toISOString();
    const id = demoUniqueId("visual-fund");
    const transfer: MockTransfer = {
      id,
      transaction_id: id,
      owner_id: "visual-demo",
      from_wallet_id: null,
      to_wallet_id: params.walletId,
      asset_id: asset.id,
      asset_code: asset.code,
      amount: params.amount,
      amount_units: amountUnits,
      display_amount: params.amount,
      fee_asset_code: null,
      fee_symbol: null,
      fee_decimals: null,
      fee_units: "0",
      display_fee: "0",
      direction: "funding",
      type: "funding",
      note: params.cardLast4 ? `Funds added •••• ${params.cardLast4}` : "Funds added",
      status: "confirmed",
      mock_hash: `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`,
      counterparty_display_name: "Wallet funding",
      counterparty_handle: null,
      counterparty_address: null,
      created_at: createdAt,
      updated_at: createdAt,
      asset,
    };
    demoTransfers = [transfer, ...demoTransfers];
    const receipt = demoReceipt(transfer);
    demoReceiptsByIdempotencyKey.set(idempotencyKey, { request: replay.requestHash, receipt });
    return receipt;
  }
  return addDemoFunds({ walletId: params.walletId, assetCode: asset.code, amountUnits, idempotencyKey: params.idempotencyKey });
}

export async function resolveRecipient(query: string, assetId?: string) {
  const portfolio = await getPortfolio();
  const asset = assetId ? findAsset(portfolio, assetId) : portfolio.assets[0];
  if (!asset) throw new WalletLedgerError("Choose an asset before resolving a recipient.", "ASSET_REQUIRED");
  if (walletRuntimeMode === "visual-demo") {
    const recipientInput = query.trim();
    const ownWallet = portfolio.wallets.find((wallet) => wallet.id === recipientInput || wallet.addresses.some((address) => address.network_slug === asset.network_slug && address.address.toLowerCase() === recipientInput.toLowerCase()));
    const handle = recipientInput.startsWith("@") && /^@[a-z0-9][a-z0-9._-]{1,63}$/i.test(recipientInput) ? recipientInput.slice(1) : null;
    if (!ownWallet && !handle && !looksLikeRecipientAddress(recipientInput, asset.network_slug)) {
      throw new WalletLedgerError(`Enter a valid ${asset.network_name} address or registered @handle.`, "INVALID_RECIPIENT");
    }
    return {
      recipient_token: "00000000-0000-4000-8000-000000000002",
      display_name: ownWallet?.name ?? handle ?? "External wallet",
      handle,
      address: handle ? null : ownWallet?.addresses.find((address) => address.network_slug === asset.network_slug)?.address ?? recipientInput,
      network_slug: asset.network_slug,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      is_external: !ownWallet && !handle,
    } satisfies ResolvedRecipient;
  }
  try {
    return await resolveDemoRecipient(query, asset.network_slug);
  } catch (error) {
    const recipientInput = query.trim();
    const message = error instanceof Error ? error.message : "";
    if (looksLikeRecipientAddress(recipientInput, asset.network_slug) && /recipient.*not found/i.test(message)) {
      return {
        recipient_token: "",
        display_name: "External wallet",
        handle: null,
        address: recipientInput,
        network_slug: asset.network_slug,
        expires_at: null,
        is_external: true,
      } satisfies ResolvedRecipient;
    }
    throw error;
  }
}

export function looksLikeRecipientAddress(value: string, networkSlug: string) {
  return looksLikeWalletAddress(value, networkSlug);
}

export async function sendDemoTransfer(params: SendDemoTransferInput): Promise<DemoTransactionReceipt> {
  const recipientInput = params.recipient.trim();
  if (!recipientInput) throw new WalletLedgerError("Enter a recipient address or handle.", "RECIPIENT_REQUIRED");
  if ((params.note?.trim().length ?? 0) > 280) throw new WalletLedgerError("Notes can be up to 280 characters.", "NOTE_TOO_LONG");
  const portfolio = await getPortfolio();
  const asset = findAsset(portfolio, params.assetId);
  const amountUnits = decimalToBaseUnits(params.amount, asset.decimals);
  if (walletRuntimeMode === "visual-demo") {
    const idempotencyKey = params.idempotencyKey ?? makeIdempotencyKey("visual-transfer");
    const replay = replayVisualMutation(idempotencyKey, {
      operation: "transfer",
      fromWalletId: params.fromWalletId,
      recipient: recipientInput,
      assetCode: asset.code,
      amountUnits,
      note: params.note?.trim() || null,
    });
    if (replay.receipt) return replay.receipt;
    const recipientValue = recipientInput;
    const recipient = await resolveRecipient(recipientValue, asset.id);
    const ownAddress = demoWallets.flatMap((wallet) => wallet.addresses.map((address) => ({ wallet, address })))
      .find((item) => item.address.address.toLowerCase() === recipientValue.toLowerCase());
    if (ownAddress && ownAddress.address.network_slug.toLowerCase() !== asset.network_slug.toLowerCase()) {
      throw new WalletLedgerError(`Choose a ${asset.network_name} address for this transfer.`, "RECIPIENT_NETWORK_MISMATCH");
    }
    const destination = demoWallets.find((wallet) => wallet.id === recipientValue || wallet.addresses.some((address) => address.network_slug.toLowerCase() === asset.network_slug.toLowerCase() && address.address.toLowerCase() === recipientValue.toLowerCase()));
    if (destination?.id === params.fromWalletId) {
      throw new WalletLedgerError("Choose a different destination wallet.", "SAME_WALLET");
    }
    mutateDemoBalance(params.fromWalletId, asset, `-${amountUnits}`);
    if (destination) {
      mutateDemoBalance(destination.id, asset, amountUnits);
    } else {
      demoExternalSettlementUnits.set(
        asset.id,
        (demoExternalSettlementUnits.get(asset.id) ?? 0n) + BigInt(amountUnits),
      );
    }
    const createdAt = new Date().toISOString();
    const id = demoUniqueId("visual-transfer");
    const transfer: MockTransfer = {
      id,
      transaction_id: id,
      owner_id: "visual-demo",
      from_wallet_id: params.fromWalletId,
      to_wallet_id: destination?.id ?? null,
      asset_id: asset.id,
      asset_code: asset.code,
      amount: params.amount,
      amount_units: amountUnits,
      display_amount: params.amount,
      fee_asset_code: null,
      fee_symbol: null,
      fee_decimals: null,
      fee_units: "0",
      display_fee: "0",
      direction: destination ? "self" : "outgoing",
      type: "transfer",
      note: params.note?.trim() || null,
      status: "confirmed",
      mock_hash: `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`,
      counterparty_display_name: recipient.display_name,
      counterparty_handle: recipient.handle,
      counterparty_address: recipient.address,
      created_at: createdAt,
      updated_at: createdAt,
      asset,
    };
    demoTransfers = [transfer, ...demoTransfers];
    const receipt = demoReceipt(transfer);
    demoReceiptsByIdempotencyKey.set(idempotencyKey, { request: replay.requestHash, receipt });
    return receipt;
  }
  const ownDestination = portfolio.wallets.find((wallet) => wallet.id === recipientInput
    || wallet.addresses.some((address) => address.network_slug.toLowerCase() === asset.network_slug.toLowerCase()
      && address.address.toLowerCase() === recipientInput.toLowerCase()));
  if (ownDestination) {
    if (ownDestination.id === params.fromWalletId) {
      throw new WalletLedgerError("Choose a different destination wallet.", "SAME_WALLET");
    }
    return transferBetweenWallets({
      fromWalletId: params.fromWalletId,
      toWalletId: ownDestination.id,
      assetSymbol: asset.id,
      amount: params.amount,
      note: params.note,
      idempotencyKey: params.idempotencyKey,
    });
  }
  const idempotencyKey = params.idempotencyKey ?? makeIdempotencyKey("transfer");
  const intentCacheKey = `${portfolio.profile?.id ?? "authenticated-user"}:${idempotencyKey}`;
  const request = JSON.stringify({
    operation: "transfer",
    fromWalletId: params.fromWalletId,
    recipient: recipientInput,
    assetCode: asset.code,
    amountUnits,
    note: params.note?.trim() || null,
  });
  let intent = await loadConnectedTransferIntent(intentCacheKey);
  if (intent && intent.request !== request) {
    throw new WalletLedgerError("That retry key was already used for a different transfer.", "IDEMPOTENCY_CONFLICT");
  }
  if (intent) {
    return submitDemoTransfer({ quoteId: intent.quoteId, idempotencyKey, note: params.note });
  }

  const resolvedRecipient = await resolveRecipient(recipientInput, asset.id);
  if (resolvedRecipient.is_external || !resolvedRecipient.recipient_token) {
    return normalizeReceipt(await rpc("send_to_external_address", {
      p_from_wallet_id: params.fromWalletId,
      p_recipient_address: recipientInput,
      p_asset_code: asset.code,
      p_amount_units: positiveUnits(amountUnits),
      p_idempotency_key: idempotencyKey,
      p_note: params.note?.trim() || null,
    }), portfolio.assets);
  }

  if (!intent) {
    const quote = await createDemoTransferQuote({ fromWalletId: params.fromWalletId, recipient: resolvedRecipient, asset, assets: portfolio.assets, amountUnits });
    intent = { request, quoteId: quote.quote_id };
    await saveConnectedTransferIntent(intentCacheKey, intent);
  }
  const receipt = await submitDemoTransfer({ quoteId: intent.quoteId, idempotencyKey, note: params.note });
  return receipt;
}

export function getVisualExternalSettlementUnits(assetId: string) {
  return (demoExternalSettlementUnits.get(assetId) ?? 0n).toString();
}

export async function clearTransferRecoveryIntent(idempotencyKey: string) {
  if (walletRuntimeMode === "visual-demo") return;
  const user = await currentUser();
  await clearConnectedTransferIntent(`${user.id}:${idempotencyKey}`);
}

export async function fundWallet(params: {
  walletId: string;
  assetSymbol: string;
  amount: number | string;
  dummyCardLast4: string;
  dummyCardBrand?: string;
}) {
  return fundDemoWallet({ walletId: params.walletId, assetId: params.assetSymbol, amount: String(params.amount), cardLast4: params.dummyCardLast4, cardBrand: params.dummyCardBrand });
}

export async function transferBetweenWallets(params: {
  fromWalletId: string;
  toWalletId: string;
  assetSymbol: string;
  amount: number | string;
  note?: string;
  idempotencyKey?: string;
}): Promise<DemoTransactionReceipt> {
  if (walletRuntimeMode === "visual-demo") {
    return sendDemoTransfer({
      fromWalletId: params.fromWalletId,
      recipient: params.toWalletId,
      assetId: params.assetSymbol,
      amount: String(params.amount),
      note: params.note,
      idempotencyKey: params.idempotencyKey,
    });
  }
  const portfolio = await getPortfolio();
  const asset = findAsset(portfolio, params.assetSymbol);
  const amountUnits = decimalToBaseUnits(String(params.amount), asset.decimals);
  return normalizeReceipt(await rpc("transfer_between_wallets", {
    p_from_wallet_id: params.fromWalletId,
    p_to_wallet_id: params.toWalletId,
    p_asset_code: asset.code,
    p_amount_units: positiveUnits(amountUnits),
    p_idempotency_key: params.idempotencyKey ?? makeIdempotencyKey("wallet-transfer"),
    p_note: params.note?.trim() || null,
  }), portfolio.assets);
}

export function subscribeToLedgerInvalidations(params: {
  userId: string;
  onInvalidate: (payload: { event_type?: string; transaction_id?: string }) => void;
  onError?: (error: Error) => void;
}) {
  if (walletRuntimeMode === "visual-demo") return () => undefined;
  const client = requireSupabase();
  const filter = `owner_id=eq.${params.userId}`;
  const channel = client
    .channel(`user:${params.userId}:wallet`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "demo_wallet_notifications",
        filter,
      },
      (payload) => {
        const notification = record(payload.new);
        if (string(notification, ["owner_id"]) !== params.userId) return;
        params.onInvalidate({
          event_type: string(notification, ["event_type"]) || undefined,
          transaction_id: string(notification, ["transaction_id"]) || undefined,
        });
      },
    )
    .subscribe((status, error) => {
      if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && params.onError) {
        params.onError(error ?? new Error(`Wallet live updates are ${status.toLowerCase().replace("_", " ")}.`));
      }
    });
  return () => {
    void client.removeChannel(channel);
  };
}

export function primaryBalance(wallet: WalletWithBalances, symbol = "USD") {
  const requestedSymbols = symbol === "USD" ? ["USD", "USDT", "USDC"] : [symbol];
  return wallet.balances
    .filter((balance) => requestedSymbols.includes(balance.asset.symbol) || balance.asset_code === symbol)
    .reduce((sum, balance) => sum + Number(balance.display_amount || "0"), 0);
}

export function formatMoney(amount: number | string, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export const ledgerMode = walletRuntimeMode;
export const hasConnectedLedger = walletRuntimeMode === "connected" && Boolean(supabase);
