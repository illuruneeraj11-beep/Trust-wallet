import { Platform } from "react-native";
import { getAssetBySymbol } from "@/data/asset-registry";
import type { TrendingToken } from "@/data/trust-wallet";
import type {
  MarketCurrency,
  MarketHistoryRange,
  MarketHistoryResponse,
  MarketQuote,
  MarketsResponse,
  PerpsResponse,
} from "@/types/market";

export const MARKET_POLL_INTERVAL_MS = 60_000;
const DEFAULT_NATIVE_API_BASE_URL = "https://expo-wallet.vercel.app";
const TOP_TRADED_SYMBOLS = ["ETH", "BNB", "BTC", "SOL"];
const TRENDING_SYMBOLS = ["WSTETH", "AETHWETH", "XAUT", "PAXG", "DEXE", "TRUMP", "PUMP", "AERO", "RIVER", "SKR", "OPENAI", "NEURALINK"];

function apiUrl(path: string) {
  if (Platform.OS === "web") return path;
  const configuredBase = process.env.EXPO_PUBLIC_MARKET_API_BASE_URL?.trim().replace(/\/$/, "");
  return `${configuredBase || DEFAULT_NATIVE_API_BASE_URL}${path}`;
}

async function fetchJson(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : `Market API responded ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isMarketQuote(value: unknown): value is MarketQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as Partial<MarketQuote>;
  return typeof quote.assetId === "string"
    && isNullableNumber(quote.price)
    && isNullableNumber(quote.percentChange24h)
    && isNullableNumber(quote.marketCap)
    && isNullableNumber(quote.volume24h)
    && typeof quote.lastUpdated === "string";
}

export function isMarketsResponse(value: unknown): value is MarketsResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<MarketsResponse>;
  return typeof response.currency === "string"
    && typeof response.asOf === "string"
    && typeof response.stale === "boolean"
    && response.source === "coinmarketcap"
    && typeof response.pollAfterMs === "number"
    && Array.isArray(response.quotes)
    && response.quotes.every(isMarketQuote);
}

function compactUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function applyLive(symbol: string, quoteByAssetId: Record<string, MarketQuote>): TrendingToken | null {
  const asset = getAssetBySymbol(symbol);
  if (!asset) return null;
  const quote = quoteByAssetId[asset.assetId];
  if (!quote || quote.price === null || quote.percentChange24h === null) return null;

  return {
    symbol: asset.symbol,
    name: asset.name,
    network: asset.networkSymbol,
    categories: [...asset.categories],
    price: quote.price,
    change: quote.percentChange24h,
    marketCap: compactUsd(quote.marketCap),
    volume: compactUsd(quote.volume24h),
  };
}

export function toLegacyMarketLists(response: MarketsResponse) {
  const quoteByAssetId = Object.fromEntries(response.quotes.map((quote) => [quote.assetId, quote]));
  return {
    quoteByAssetId,
    top: TOP_TRADED_SYMBOLS.flatMap((symbol) => {
      const live = applyLive(symbol, quoteByAssetId);
      return live ? [live] : [];
    }),
    trending: TRENDING_SYMBOLS.flatMap((symbol) => {
      const live = applyLive(symbol, quoteByAssetId);
      return live ? [live] : [];
    }),
  };
}

export async function fetchMarketSnapshot(currency: MarketCurrency = "USD", signal?: AbortSignal) {
  const payload = await fetchJson(apiUrl(`/api/markets?currency=${encodeURIComponent(currency)}`), signal);
  if (!isMarketsResponse(payload)) throw new Error("Market API returned an invalid JSON contract");
  return payload;
}

export async function fetchLiveMarkets(currency: MarketCurrency = "USD", signal?: AbortSignal) {
  const snapshot = await fetchMarketSnapshot(currency, signal);
  return { ...toLegacyMarketLists(snapshot), snapshot };
}

export async function fetchMarketHistory(
  assetId: string,
  range: MarketHistoryRange,
  currency: MarketCurrency = "USD",
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ assetId, range, currency });
  const payload = await fetchJson(apiUrl(`/api/market-history?${params.toString()}`), signal);
  if (!payload || typeof payload !== "object") throw new Error("Market history API returned an invalid response");
  const response = payload as Partial<MarketHistoryResponse>;
  if (response.assetId !== assetId || response.range !== range || !Array.isArray(response.points)) {
    throw new Error("Market history API returned an invalid JSON contract");
  }
  return response as MarketHistoryResponse;
}

export async function fetchPerps(symbols?: string[], signal?: AbortSignal) {
  const params = symbols?.length ? `?symbols=${encodeURIComponent(symbols.join(","))}` : "";
  const payload = await fetchJson(apiUrl(`/api/perps${params}`), signal);
  if (!payload || typeof payload !== "object") throw new Error("Perps API returned an invalid response");
  const response = payload as Partial<PerpsResponse>;
  if (response.source !== "provider-apis" || !Array.isArray(response.providers) || !Array.isArray(response.markets)) {
    throw new Error("Perps API returned an invalid JSON contract");
  }
  return response as PerpsResponse;
}

export async function probeMarketStreamAvailability(signal?: AbortSignal) {
  const payload = await fetchJson(apiUrl("/api/market-stream?probe=1"), signal);
  if (!payload || typeof payload !== "object") throw new Error("Market stream capability API returned an invalid response");
  const response = payload as { available?: unknown; pollAfterMs?: unknown };
  if (typeof response.available !== "boolean" || typeof response.pollAfterMs !== "number") {
    throw new Error("Market stream capability API returned an invalid JSON contract");
  }
  return { available: response.available, pollAfterMs: response.available ? 15_000 : 60_000 };
}

type MarketStreamCallbacks = {
  onQuote: (quote: MarketQuote) => void;
  onError?: (error: Error) => void;
  onUnavailable?: (reason: string) => void;
};

export function subscribeToMarketStream({ onQuote, onError, onUnavailable }: MarketStreamCallbacks) {
  if (Platform.OS !== "web") return () => undefined;
  let stopped = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;
  let attempts = 0;

  const connect = async () => {
    controller = new AbortController();
    try {
      const response = await fetch(apiUrl("/api/market-stream"), {
        signal: controller.signal,
        headers: { Accept: "text/event-stream" },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string; code?: string } | null;
        if (response.status === 503 && payload?.code === "CMC_STREAM_KEY_REQUIRED") {
          onUnavailable?.(payload.error ?? "Real-time stream is not configured");
          return;
        }
        throw new Error(payload?.error || `Market stream responded ${response.status}`);
      }
      if (!response.body) throw new Error("Streaming is not supported by this browser");

      attempts = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const data = event.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
          if (!data) continue;
          const payload = JSON.parse(data) as { type?: string; quote?: unknown; reason?: string };
          if (payload.type === "quote" && isMarketQuote(payload.quote)) onQuote(payload.quote);
          if (payload.type === "unavailable") {
            onUnavailable?.(payload.reason ?? "Real-time market streaming is unavailable");
            stopped = true;
            controller?.abort();
            return;
          }
        }
      }
      if (!stopped) throw new Error("Market stream closed");
    } catch (error) {
      if (stopped || controller?.signal.aborted) return;
      const normalizedError = error instanceof Error ? error : new Error("Market stream failed");
      onError?.(normalizedError);
      const delay = Math.min(1_000 * (2 ** attempts), MARKET_POLL_INTERVAL_MS);
      attempts += 1;
      reconnectTimer = setTimeout(() => void connect(), delay);
    }
  };

  void connect();
  return () => {
    stopped = true;
    controller?.abort();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  };
}
