export type ParsedWalletQr = {
  recipient: string;
  asset?: string;
  amount?: string;
  network?: string;
  kind?: "send" | "wallet-connect";
};

export function parseWalletQr(raw: string): ParsedWalletQr {
  const value = raw.trim();
  if (!value) throw new Error("Enter a QR payload first.");
  if (value.startsWith("@")) {
    if (!/^@[a-z0-9][a-z0-9._-]{1,63}$/i.test(value)) throw new Error("Enter a valid @handle.");
    return { recipient: value };
  }
  if (/^wc:/i.test(value)) return { recipient: value, network: "walletconnect", kind: "wallet-connect" };
  const paymentUri = value.match(/^(bitcoin|ethereum|solana|tron):(?:\/\/)?(.+)$/i);
  if (paymentUri) {
    const network = paymentUri[1].toLowerCase();
    const [targetPath, query = ""] = paymentUri[2].split("?", 2);
    const params = new URLSearchParams(query);
    const target = targetPath.replace(/^pay-/i, "").split("@")[0].split("/")[0];
    const recipient = params.get("address")?.trim() || target.trim();
    if (!recipient) throw new Error("This payment URI does not contain a recipient address.");
    return {
      recipient,
      asset: network === "bitcoin" ? "BTC" : network === "ethereum" ? "ETH" : network === "solana" ? "SOL" : "TRX",
      amount: params.get("amount") ?? params.get("value") ?? undefined,
      network,
      kind: "send",
    };
  }
  if (/^(?:trust-(?:testnet|demo)|trustdemo):\/\/receive\?/i.test(value)) {
    const query = value.slice(value.indexOf("?") + 1);
    const params = new URLSearchParams(query);
    const recipient = params.get("address")?.trim();
    if (!recipient) throw new Error("This QR does not contain a recipient address.");
    return {
      recipient,
      asset: params.get("asset") ?? undefined,
      amount: params.get("amount") ?? undefined,
      network: params.get("network") ?? undefined,
      kind: "send",
    };
  }
  if (/^trust:/i.test(value)) throw new Error("This Trust URI is not supported on Testnet. Ask the recipient to generate a new receive QR.");
  if (!/\s/.test(value) && value.length >= 10) return { recipient: value };
  throw new Error("Use a Trust Wallet receive QR, registered @handle, or wallet address.");
}
