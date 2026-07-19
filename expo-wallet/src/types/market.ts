export type MarketCurrency = "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "INR";

export type MarketQuote = {
  assetId: string;
  price: number | null;
  percentChange24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  lastUpdated: string;
};

export type MarketsResponse = {
  currency: MarketCurrency;
  asOf: string;
  stale: boolean;
  source: "coinmarketcap";
  pollAfterMs: number;
  quotes: MarketQuote[];
};

export type MarketStatus = "idle" | "loading" | "live" | "stale" | "error";

export type MarketHistoryRange = "1D" | "1W" | "1M" | "3M" | "1Y";

export type MarketHistoryPoint = {
  timestamp: string;
  price: number;
};

export type MarketHistoryResponse = {
  assetId: string;
  currency: MarketCurrency;
  range: MarketHistoryRange;
  asOf: string;
  source: "coinmarketcap";
  points: MarketHistoryPoint[];
};

export type PerpQuote = {
  assetId: string;
  provider: "hyperliquid" | "aster";
  symbol: string;
  pair: string;
  maxLeverage: number | null;
  markPrice: number;
  previousDayPrice: number | null;
  percentChange24h: number | null;
  volume24h: number;
  openInterest: number | null;
  fundingRate: number | null;
  chartPoints: MarketHistoryPoint[];
};

export type PerpsResponse = {
  asOf: string;
  stale: boolean;
  source: "provider-apis";
  providers: Array<"hyperliquid" | "aster">;
  pollAfterMs: number;
  markets: PerpQuote[];
};
