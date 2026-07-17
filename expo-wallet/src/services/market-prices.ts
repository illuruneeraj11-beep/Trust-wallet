import { topTradedTokens, trendingTokens, type PerpsMarket, type TrendingToken } from "@/data/trust-wallet";
import { Platform } from "react-native";

type CoinGeckoRow = {
  usd?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
  usd_24h_change?: number;
};

const COIN_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  WSTETH: "wrapped-steth",
  AETHWETH: "ethereum",
  XAUT: "tether-gold",
  PAXG: "pax-gold",
  DEXE: "dexe",
  TRUMP: "official-trump",
  PUMP: "pump-fun",
  AERO: "aerodrome-finance",
};

function compactUsd(value?: number) {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value ?? 0);
  if (abs >= 1_000_000_000_000) return `$${((value ?? 0) / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `$${((value ?? 0) / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${((value ?? 0) / 1_000_000).toFixed(2)}M`;
  return `$${(value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function applyLive(token: TrendingToken, rows: Record<string, CoinGeckoRow>) {
  const id = COIN_IDS[token.symbol];
  const row = id ? rows[id] : undefined;
  if (!row?.usd) return token;

  return {
    ...token,
    price: row.usd,
    change: Number(row.usd_24h_change ?? token.change),
    marketCap: compactUsd(row.usd_market_cap),
    volume: compactUsd(row.usd_24h_vol),
  };
}

export async function fetchLiveMarkets() {
  const ids = Array.from(new Set(Object.values(COIN_IDS))).join(",");
  const url = Platform.OS === "web"
    ? `/api/markets?ids=${encodeURIComponent(ids)}`
    : `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CoinGecko responded ${response.status}`);
  const rows = await response.json() as Record<string, CoinGeckoRow>;
  const top = topTradedTokens.map((token) => applyLive(token, rows));
  const trending = trendingTokens.map((token) => applyLive(token, rows));
  return { top, trending };
}

export function applyLivePerps(perps: PerpsMarket[], top: TrendingToken[]) {
  return perps.map((market) => {
    const token = top.find((item) => item.symbol === market.symbol);
    if (!token) return market;
    return {
      ...market,
      price: compactUsd(token.price),
      change: `${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`,
      volume: token.volume,
    };
  });
}
