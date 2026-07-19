import { assetRegistry, getAssetByCmcId, getAssetById, getAssetBySymbol, getCoreMarketAssetIds, getMarketAssetIds, getSecondaryMarketAssetIds } from "../data/asset-registry";
import type {
  MarketCurrency,
  MarketHistoryPoint,
  MarketHistoryRange,
  MarketHistoryResponse,
  MarketQuote,
  MarketsResponse,
  PerpQuote,
  PerpsResponse,
} from "../types/market";

const CMC_BASE_URL = "https://pro-api.coinmarketcap.com";
const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const ASTER_FUTURES_URL = "https://fapi.asterdex.com";
const MARKET_MAX_STALE_MS = 30 * 60_000;
const HISTORY_CACHE_MS = 5 * 60_000;
const PERPS_CACHE_MS = 10_000;
const PERPS_MAX_STALE_MS = 2 * 60_000;
const PERP_CHART_CACHE_MS = 5 * 60_000;
const REQUEST_TIMEOUT_MS = 9_000;
const SECONDARY_MARKET_CACHE_MS = 10 * 60_000;

function hasCmcRealtimeKey() {
  return Boolean(process.env.COINMARKETCAP_API_KEY?.trim());
}

function marketCadence() {
  return hasCmcRealtimeKey()
    ? { cacheMs: 10_000, cacheControl: "public, max-age=0, s-maxage=10, stale-while-revalidate=60", pollAfterMs: 15_000 }
    : { cacheMs: 25_000, cacheControl: "public, max-age=0, s-maxage=25, stale-while-revalidate=120", pollAfterMs: 60_000 };
}

const currencies = new Set<MarketCurrency>(["USD", "EUR", "GBP", "JPY", "AUD", "INR"]);
const historyRanges: Record<MarketHistoryRange, { count: number; interval: string }> = {
  "1D": { count: 96, interval: "15m" },
  "1W": { count: 168, interval: "hourly" },
  "1M": { count: 30, interval: "daily" },
  "3M": { count: 90, interval: "daily" },
  "1Y": { count: 365, interval: "daily" },
};

type CacheEntry<T> = { value: T; fetchedAt: number };

const marketCache = new Map<MarketCurrency, CacheEntry<MarketsResponse>>();
const secondaryMarketCache = new Map<MarketCurrency, CacheEntry<CmcEnvelope>>();
const historyCache = new Map<string, CacheEntry<MarketHistoryResponse>>();
const perpsCache = new Map<string, CacheEntry<PerpsResponse>>();
const perpChartCache = new Map<string, CacheEntry<MarketHistoryPoint[]>>();

type CmcQuote = {
  symbol?: string;
  price?: number | null;
  percent_change_24h?: number | null;
  market_cap?: number | null;
  volume_24h?: number | null;
  last_updated?: string;
};

type CmcRow = {
  id?: number | string;
  last_updated?: string;
  quote?: CmcQuote[] | Record<string, CmcQuote>;
};

type CmcEnvelope = {
  status?: { timestamp?: string; error_code?: number | string; error_message?: string | null };
  data?: CmcRow[] | Record<string, CmcRow | CmcRow[]>;
};

type HyperliquidMeta = {
  universe?: Array<{ name?: string; maxLeverage?: number; isDelisted?: boolean }>;
};

type HyperliquidContext = {
  markPx?: string;
  prevDayPx?: string;
  dayNtlVlm?: string;
  openInterest?: string;
  funding?: string;
};

type HyperliquidCandle = {
  t?: number;
  c?: string;
};

type AsterTicker = {
  symbol?: string;
  lastPrice?: string;
  openPrice?: string;
  priceChangePercent?: string;
  quoteVolume?: string;
  closeTime?: number;
};

type AsterSymbol = {
  symbol?: string;
  status?: string;
  requiredMarginPercent?: string;
};

type AsterExchangeInfo = {
  symbols?: AsterSymbol[];
};

type AsterKline = [number, string, string, string, string, ...unknown[]];

function corsHeaders(cacheControl = "no-store") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": cacheControl,
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(body: unknown, status = 200, cacheControl?: string) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(cacheControl) });
}

function parseCurrency(value: string | null): MarketCurrency | null {
  const normalized = (value ?? "USD").toUpperCase() as MarketCurrency;
  return currencies.has(normalized) ? normalized : null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function createTimedSignal(timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function fetchJson(url: string, init?: RequestInit) {
  const timer = createTimedSignal();
  try {
    const response = await fetch(url, { ...init, signal: timer.signal });
    const payload = await response.json().catch(() => null) as unknown;
    if (!response.ok) {
      const providerMessage = payload && typeof payload === "object" && "status" in payload
        ? (payload as CmcEnvelope).status?.error_message
        : null;
      throw new Error(providerMessage || `Provider responded ${response.status}`);
    }
    return payload;
  } finally {
    timer.clear();
  }
}

function normalizeCmcRows(data: CmcEnvelope["data"]): CmcRow[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]);
}

function findCurrencyQuote(row: CmcRow, currency: MarketCurrency) {
  if (Array.isArray(row.quote)) {
    return row.quote.find((quote) => quote.symbol?.toUpperCase() === currency) ?? row.quote[0];
  }
  return row.quote?.[currency];
}

function validateCmcEnvelope(payload: unknown): CmcEnvelope {
  if (!payload || typeof payload !== "object") throw new Error("CoinMarketCap returned an invalid response");
  const envelope = payload as CmcEnvelope;
  const errorCode = Number(envelope.status?.error_code ?? 0);
  if (Number.isFinite(errorCode) && errorCode !== 0) {
    throw new Error(envelope.status?.error_message || `CoinMarketCap error ${errorCode}`);
  }
  return envelope;
}

function normalizedMarketResponse(payload: unknown, currency: MarketCurrency): MarketsResponse {
  const envelope = validateCmcEnvelope(payload);
  const asOf = envelope.status?.timestamp ?? new Date().toISOString();
  const rowsById = new Map(
    normalizeCmcRows(envelope.data)
      .map((row) => [Number(row.id), row] as const)
      .filter(([id]) => Number.isFinite(id)),
  );

  const quotes: MarketQuote[] = assetRegistry.map((asset) => {
    const row = asset.cmcId === null ? undefined : rowsById.get(asset.cmcId);
    const providerQuote = row ? findCurrencyQuote(row, currency) : undefined;
    return {
      assetId: asset.assetId,
      price: asFiniteNumber(providerQuote?.price),
      percentChange24h: asFiniteNumber(providerQuote?.percent_change_24h),
      marketCap: asFiniteNumber(providerQuote?.market_cap),
      volume24h: asFiniteNumber(providerQuote?.volume_24h),
      lastUpdated: providerQuote?.last_updated ?? row?.last_updated ?? asOf,
    };
  });

  const newestProviderUpdate = quotes.reduce((newest, quote) => {
    const time = Date.parse(quote.lastUpdated);
    return Number.isFinite(time) ? Math.max(newest, time) : newest;
  }, 0);

  return {
    currency,
    asOf,
    stale: newestProviderUpdate > 0 && Date.now() - newestProviderUpdate > 3 * 60_000,
    source: "coinmarketcap",
    pollAfterMs: marketCadence().pollAfterMs,
    quotes,
  };
}

function cmcRequest(path: string, params: URLSearchParams, options: { useApiKey?: boolean } = {}) {
  const apiKey = process.env.COINMARKETCAP_API_KEY?.trim();
  const useApiKey = options.useApiKey !== false && Boolean(apiKey);
  const publicPrefix = useApiKey ? "" : "/public-api";
  return fetchJson(`${CMC_BASE_URL}${publicPrefix}${path}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      ...(useApiKey && apiKey ? { "X-CMC_PRO_API_KEY": apiKey } : {}),
    },
  });
}

async function loadSecondaryMarkets(currency: MarketCurrency) {
  const cached = secondaryMarketCache.get(currency);
  if (cached && Date.now() - cached.fetchedAt < SECONDARY_MARKET_CACHE_MS) return cached.value;
  const ids = getSecondaryMarketAssetIds();
  if (!ids.length) return { data: [], status: { timestamp: new Date().toISOString(), error_code: 0 } } satisfies CmcEnvelope;
  try {
    const params = new URLSearchParams({ id: ids.join(","), convert: currency, skip_invalid: "true", aux: "cmc_rank" });
    const envelope = validateCmcEnvelope(await cmcRequest("/v3/cryptocurrency/quotes/latest", params, { useApiKey: false }));
    secondaryMarketCache.set(currency, { value: envelope, fetchedAt: Date.now() });
    return envelope;
  } catch {
    return cached?.value ?? ({ data: [], status: { timestamp: new Date().toISOString(), error_code: 0 } } satisfies CmcEnvelope);
  }
}

async function loadMarkets(currency: MarketCurrency) {
  if (hasCmcRealtimeKey()) {
    const coreParams = new URLSearchParams({
      id: getCoreMarketAssetIds().join(","),
      convert: currency,
      skip_invalid: "true",
      aux: "cmc_rank",
    });
    const [core, secondary] = await Promise.all([
      cmcRequest("/v3/cryptocurrency/quotes/latest", coreParams).then(validateCmcEnvelope),
      loadSecondaryMarkets(currency),
    ]);
    return normalizedMarketResponse({
      status: core.status,
      data: [...normalizeCmcRows(core.data), ...normalizeCmcRows(secondary.data)],
    } satisfies CmcEnvelope, currency);
  }
  const params = new URLSearchParams({
    id: getMarketAssetIds().join(","),
    convert: currency,
    skip_invalid: "true",
    aux: "cmc_rank",
  });
  return normalizedMarketResponse(await cmcRequest("/v3/cryptocurrency/quotes/latest", params), currency);
}

export async function handleMarketsRequest(request: Request) {
  const currency = parseCurrency(new URL(request.url).searchParams.get("currency"));
  if (!currency) return json({ error: "Unsupported currency" }, 400);

  const cadence = marketCadence();
  const cached = marketCache.get(currency);
  if (cached && Date.now() - cached.fetchedAt < cadence.cacheMs) {
    return json(cached.value, 200, cadence.cacheControl);
  }

  try {
    const response = await loadMarkets(currency);
    marketCache.set(currency, { value: response, fetchedAt: Date.now() });
    return json(response, 200, cadence.cacheControl);
  } catch (error) {
    if (cached && Date.now() - cached.fetchedAt < MARKET_MAX_STALE_MS) {
      return json({ ...cached.value, stale: true }, 200, "public, max-age=0, s-maxage=10, stale-while-revalidate=60");
    }
    return json({ error: error instanceof Error ? error.message : "Unable to fetch market data" }, 502);
  }
}

function normalizeHistory(payload: unknown, assetId: string, currency: MarketCurrency, range: MarketHistoryRange): MarketHistoryResponse {
  const envelope = validateCmcEnvelope(payload);
  const records = normalizeCmcRows(envelope.data);
  const record = records[0] as CmcRow & { quotes?: Array<{ timestamp?: string; quote?: CmcQuote[] | Record<string, CmcQuote> }> };
  const points: MarketHistoryPoint[] = (record?.quotes ?? []).flatMap((item) => {
    const quote = Array.isArray(item.quote)
      ? item.quote.find((candidate) => candidate.symbol?.toUpperCase() === currency) ?? item.quote[0]
      : item.quote?.[currency];
    const price = asFiniteNumber(quote?.price);
    const timestamp = item.timestamp ?? quote?.last_updated;
    return price !== null && timestamp ? [{ timestamp, price }] : [];
  });

  if (points.length === 0) throw new Error("CoinMarketCap returned no historical points for this asset");
  return {
    assetId,
    currency,
    range,
    asOf: envelope.status?.timestamp ?? points.at(-1)?.timestamp ?? new Date().toISOString(),
    source: "coinmarketcap",
    points,
  };
}

export async function handleMarketHistoryRequest(request: Request) {
  const url = new URL(request.url);
  const assetId = url.searchParams.get("assetId") ?? "";
  const asset = getAssetById(assetId);
  if (!asset) return json({ error: "Unknown assetId" }, 400);
  if (asset.cmcId === null) return json({ error: "No verified CoinMarketCap identity is available for this asset" }, 404);

  const currency = parseCurrency(url.searchParams.get("currency"));
  if (!currency) return json({ error: "Unsupported currency" }, 400);
  const range = (url.searchParams.get("range") ?? "1W").toUpperCase() as MarketHistoryRange;
  const config = historyRanges[range];
  if (!config) return json({ error: "Unsupported range" }, 400);

  const cacheKey = `${assetId}:${currency}:${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_MS) {
    return json(cached.value, 200, "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  }

  if (!process.env.COINMARKETCAP_API_KEY?.trim()) {
    return json({
      error: "Historical charts require COINMARKETCAP_API_KEY; current quotes remain available through CMC's keyless API",
      code: "CMC_HISTORY_KEY_REQUIRED",
    }, 503);
  }

  try {
    const params = new URLSearchParams({
      id: String(asset.cmcId),
      count: String(config.count),
      interval: config.interval,
      convert: currency,
    });
    const response = normalizeHistory(
      await cmcRequest("/v3/cryptocurrency/quotes/historical", params),
      assetId,
      currency,
      range,
    );
    historyCache.set(cacheKey, { value: response, fetchedAt: Date.now() });
    return json(response, 200, "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  } catch (error) {
    if (cached) return json(cached.value, 200, "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    return json({ error: error instanceof Error ? error.message : "Unable to fetch market history" }, 502);
  }
}

async function cachedPerpChart(cacheKey: string, load: () => Promise<MarketHistoryPoint[]>) {
  const cached = perpChartCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < PERP_CHART_CACHE_MS) return cached.value;
  try {
    const points = (await load()).filter((point) => Number.isFinite(point.price) && !Number.isNaN(Date.parse(point.timestamp)));
    if (points.length >= 2) perpChartCache.set(cacheKey, { value: points, fetchedAt: Date.now() });
    return points;
  } catch {
    return cached?.value ?? [];
  }
}

async function loadHyperliquidChart(symbol: string) {
  const endTime = Date.now();
  const payload = await fetchJson(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: { coin: symbol, interval: "1h", startTime: endTime - 24 * 60 * 60_000, endTime },
    }),
  });
  if (!Array.isArray(payload)) return [];
  return (payload as HyperliquidCandle[]).flatMap((candle) => {
    const price = asFiniteNumber(candle.c);
    return price !== null && typeof candle.t === "number"
      ? [{ timestamp: new Date(candle.t).toISOString(), price }]
      : [];
  });
}

async function loadHyperliquidPerps(requestedSymbols: string[]) {
  const payloads = await Promise.all(["", "xyz"].map((dex) => fetchJson(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(dex ? { type: "metaAndAssetCtxs", dex } : { type: "metaAndAssetCtxs" }),
  })));

  const requestedOrder = new Map(requestedSymbols.map((symbol, index) => [symbol, index]));
  const candidates = new Map<string, PerpQuote & { chartSymbol: string }>();

  for (const payload of payloads) {
    if (!Array.isArray(payload) || payload.length < 2) continue;
    const meta = payload[0] as HyperliquidMeta;
    const contexts = payload[1] as HyperliquidContext[];
    if (!Array.isArray(meta?.universe) || !Array.isArray(contexts)) continue;

    meta.universe.forEach((definition, index) => {
      const chartSymbol = definition.name?.toUpperCase();
      const symbol = chartSymbol?.split(":").at(-1);
      const context = contexts[index];
      if (!symbol || !chartSymbol || definition.isDelisted || !context || !requestedOrder.has(symbol)) return;
      const markPrice = asFiniteNumber(context.markPx);
      const volume24h = asFiniteNumber(context.dayNtlVlm);
      if (markPrice === null || volume24h === null) return;
      const previousDayPrice = asFiniteNumber(context.prevDayPx);
      const registeredAsset = getAssetBySymbol(symbol);
      const candidate = {
        assetId: registeredAsset?.assetId ?? `hyperliquid:perp:${chartSymbol.toLowerCase()}`,
        provider: "hyperliquid" as const,
        symbol,
        pair: chartSymbol,
        maxLeverage: definition.maxLeverage ?? null,
        markPrice,
        previousDayPrice,
        percentChange24h: previousDayPrice && previousDayPrice !== 0
          ? ((markPrice - previousDayPrice) / previousDayPrice) * 100
          : null,
        volume24h,
        openInterest: asFiniteNumber(context.openInterest),
        fundingRate: asFiniteNumber(context.funding),
        chartPoints: [],
        chartSymbol,
      };
      const current = candidates.get(symbol);
      if (!current || candidate.volume24h > current.volume24h) candidates.set(symbol, candidate);
    });
  }

  const baseMarkets = [...candidates.values()];

  const withCharts = await Promise.all(baseMarkets.map(async (market) => {
    const chartPoints = await cachedPerpChart(`hyperliquid:${market.chartSymbol}:1D`, () => loadHyperliquidChart(market.chartSymbol));
    const { chartSymbol: _chartSymbol, ...quote } = market;
    return {
      ...quote,
      chartPoints,
    };
  }));
  return withCharts.sort((left, right) => (requestedOrder.get(left.symbol) ?? 999) - (requestedOrder.get(right.symbol) ?? 999));
}

async function loadAsterChart(symbol: string) {
  const params = new URLSearchParams({ symbol: `${symbol}USDT`, interval: "1h", limit: "25" });
  const payload = await fetchJson(`${ASTER_FUTURES_URL}/fapi/v1/klines?${params.toString()}`);
  if (!Array.isArray(payload)) return [];
  return (payload as AsterKline[]).flatMap((candle) => {
    const price = asFiniteNumber(candle[4]);
    return price !== null && typeof candle[0] === "number"
      ? [{ timestamp: new Date(candle[0]).toISOString(), price }]
      : [];
  });
}

async function loadAsterPerps(requestedSymbols: string[]) {
  const [tickersPayload, exchangePayload] = await Promise.all([
    fetchJson(`${ASTER_FUTURES_URL}/fapi/v1/ticker/24hr`),
    fetchJson(`${ASTER_FUTURES_URL}/fapi/v1/exchangeInfo`),
  ]);
  if (!Array.isArray(tickersPayload) || !exchangePayload || typeof exchangePayload !== "object") {
    throw new Error("Aster market metadata is unavailable");
  }
  const requestedOrder = new Map(requestedSymbols.map((symbol, index) => [symbol, index]));
  const symbolsByPair = new Map(
    ((exchangePayload as AsterExchangeInfo).symbols ?? []).map((definition) => [definition.symbol?.toUpperCase(), definition]),
  );
  const baseMarkets: PerpQuote[] = (tickersPayload as AsterTicker[]).flatMap((ticker) => {
    const pair = ticker.symbol?.toUpperCase() ?? "";
    if (!pair.endsWith("USDT")) return [];
    const symbol = pair.slice(0, -4);
    const definition = symbolsByPair.get(pair);
    if (!requestedOrder.has(symbol) || definition?.status !== "TRADING") return [];
    const markPrice = asFiniteNumber(ticker.lastPrice);
    const previousDayPrice = asFiniteNumber(ticker.openPrice);
    const volume24h = asFiniteNumber(ticker.quoteVolume);
    if (markPrice === null || volume24h === null) return [];
    const marginPercent = asFiniteNumber(definition.requiredMarginPercent);
    const registeredAsset = getAssetBySymbol(symbol);
    return [{
      assetId: registeredAsset?.assetId ?? `aster:perp:${symbol.toLowerCase()}`,
      provider: "aster" as const,
      symbol,
      pair,
      maxLeverage: marginPercent && marginPercent > 0 ? Math.max(1, Math.round(100 / marginPercent)) : null,
      markPrice,
      previousDayPrice,
      percentChange24h: asFiniteNumber(ticker.priceChangePercent),
      volume24h,
      openInterest: null,
      fundingRate: null,
      chartPoints: [],
    }];
  });

  const withCharts = await Promise.all(baseMarkets.map(async (market) => {
    const chartPoints = await cachedPerpChart(`aster:${market.symbol}:1D`, () => loadAsterChart(market.symbol));
    return {
      ...market,
      chartPoints,
    };
  }));
  return withCharts.sort((left, right) => (requestedOrder.get(left.symbol) ?? 999) - (requestedOrder.get(right.symbol) ?? 999));
}

export async function handlePerpsRequest(request: Request) {
  const requestedSymbols = (new URL(request.url).searchParams.get("symbols") ?? "ASTER,BTC,ETH,SOL,XRP")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 80);
  if (requestedSymbols.length === 0) return json({ error: "At least one symbol is required" }, 400);
  const cacheKey = [...requestedSymbols].sort().join(",");
  const cached = perpsCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < PERPS_CACHE_MS) {
    return json(cached.value, 200, "public, max-age=0, s-maxage=8, stale-while-revalidate=30");
  }

  try {
    const providerResults = await Promise.allSettled([
      loadHyperliquidPerps(requestedSymbols),
      loadAsterPerps(requestedSymbols),
    ]);
    const markets = providerResults.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    if (markets.length === 0) {
      const messages = providerResults.flatMap((result) => result.status === "rejected"
        ? [result.reason instanceof Error ? result.reason.message : "Provider unavailable"]
        : []);
      throw new Error(messages.join("; ") || "Perpetual providers returned no matching markets");
    }
    const providers = Array.from(new Set(markets.map((market) => market.provider)));
    const response: PerpsResponse = {
      asOf: new Date().toISOString(),
      stale: false,
      source: "provider-apis",
      providers,
      pollAfterMs: 15_000,
      markets,
    };
    perpsCache.set(cacheKey, { value: response, fetchedAt: Date.now() });
    return json(response, 200, "public, max-age=0, s-maxage=8, stale-while-revalidate=30");
  } catch (error) {
    if (cached && Date.now() - cached.fetchedAt < PERPS_MAX_STALE_MS) {
      return json({ ...cached.value, stale: true }, 200, "public, max-age=0, s-maxage=5, stale-while-revalidate=15");
    }
    return json({ error: error instanceof Error ? error.message : "Unable to fetch perpetual markets" }, 502);
  }
}

export function handleOptionsRequest() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function getStreamConfiguration() {
  const cmcIds = getCoreMarketAssetIds();
  return {
    apiKey: process.env.COINMARKETCAP_API_KEY?.trim() ?? "",
    cmcIds,
    assetIdByCmcId: Object.fromEntries(
      cmcIds.flatMap((cmcId) => {
        const asset = getAssetByCmcId(cmcId);
        return asset ? [[cmcId, asset.assetId]] : [];
      }),
    ),
  };
}
