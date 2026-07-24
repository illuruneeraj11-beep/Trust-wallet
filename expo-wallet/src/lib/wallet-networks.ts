export type NetworkAwareAsset = {
  id: string;
  symbol: string;
  network?: string;
  network_code?: string;
  network_slug?: string;
  network_name?: string;
};

const networkAliases: Record<string, string> = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  arb: "arbitrum",
  arbitrum: "arbitrum",
  arbitrumone: "arbitrum",
  avax: "avalanchec",
  avalanche: "avalanchec",
  avalanchec: "avalanchec",
  avalanchecchain: "avalanchec",
  base: "base",
  bnb: "bsc",
  bsc: "bsc",
  binance: "bsc",
  binancesmartchain: "bsc",
  bnbchain: "bsc",
  bnbsmartchain: "bsc",
  matic: "polygon",
  polygon: "polygon",
  op: "optimism",
  opmainnet: "optimism",
  optimism: "optimism",
  sol: "solana",
  solana: "solana",
  trx: "tron",
  tron: "tron",
  demo: "demo",
  testnet: "demo",
};

const networkDisplayNames: Record<string, string> = {
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  arbitrum: "Arbitrum One",
  avalanchec: "Avalanche C-Chain",
  base: "Base",
  bsc: "BNB Smart Chain",
  optimism: "OP Mainnet",
  polygon: "Polygon",
  solana: "Solana",
  tron: "Tron",
  demo: "Wallet",
};

export function canonicalWalletNetwork(value: string | null | undefined) {
  const key = (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return networkAliases[key] ?? key;
}

export function assetNetworkSlug(asset: NetworkAwareAsset | null | undefined) {
  return canonicalWalletNetwork(asset?.network_slug ?? asset?.network_code ?? asset?.network);
}

export function assetNetworkName(asset: NetworkAwareAsset | null | undefined) {
  const explicit = asset?.network_name?.trim();
  if (explicit) return explicit;
  return walletNetworkName(assetNetworkSlug(asset));
}

export function walletNetworkName(value: string | null | undefined) {
  const slug = canonicalWalletNetwork(value);
  return networkDisplayNames[slug] ?? slug.replace(/(^|[-_])([a-z])/g, (_, separator: string, letter: string) => `${separator ? " " : ""}${letter.toUpperCase()}`);
}

export function walletNetworksMatch(left: string | null | undefined, right: string | null | undefined) {
  const leftSlug = canonicalWalletNetwork(left);
  const rightSlug = canonicalWalletNetwork(right);
  return Boolean(leftSlug && rightSlug && leftSlug === rightSlug);
}

export function findAssetVariant<T extends NetworkAwareAsset>(assets: T[], assetOrSymbol: string | null | undefined, network?: string | null) {
  const requested = (assetOrSymbol ?? "").trim().toLowerCase();
  const requestedNetwork = canonicalWalletNetwork(network);
  return assets.find((asset) => (asset.id.toLowerCase() === requested || asset.symbol.toLowerCase() === requested)
    && (!requestedNetwork || assetNetworkSlug(asset) === requestedNetwork));
}
