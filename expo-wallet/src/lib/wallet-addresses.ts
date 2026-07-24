import { canonicalWalletNetwork, walletNetworkName } from "@/lib/wallet-networks";

const evmNetworks = new Set([
  "arbitrum",
  "avalanchec",
  "base",
  "bsc",
  "ethereum",
  "optimism",
  "polygon",
]);

export function isEvmWalletNetwork(network: string | null | undefined) {
  return evmNetworks.has(canonicalWalletNetwork(network));
}

export function isRegisteredWalletHandle(value: string) {
  return /^@[a-z0-9][a-z0-9._-]{1,63}$/i.test(value.trim());
}

export function looksLikeRegisteredWalletAddress(value: string, network: string | null | undefined) {
  const address = value.trim();
  const networkSlug = canonicalWalletNetwork(network);
  return Boolean(networkSlug)
    && new RegExp(`^demo:${networkSlug}:[0-9a-f]{24}$`, "i").test(address);
}

export function looksLikeWalletAddress(value: string, network: string | null | undefined) {
  const address = value.trim();
  const networkSlug = canonicalWalletNetwork(network);

  if (evmNetworks.has(networkSlug)) {
    return /^0x[a-f0-9]{40}$/i.test(address);
  }

  switch (networkSlug) {
    case "bitcoin":
      return /^(?:bc1[ac-hj-np-z02-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address);
    case "solana":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    case "tron":
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
    case "demo":
      return /^demo_(?:usd|demo|external)_[a-z0-9_]{8,}$/i.test(address);
    default:
      return false;
  }
}

export function recipientFormatMessage(value: string, network: string | null | undefined) {
  if (
    !value.trim()
    || isRegisteredWalletHandle(value)
    || looksLikeRegisteredWalletAddress(value, network)
    || looksLikeWalletAddress(value, network)
  ) return null;
  return `Invalid ${walletNetworkName(network)} address`;
}
