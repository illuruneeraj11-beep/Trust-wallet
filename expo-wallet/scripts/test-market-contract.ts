import assert from "node:assert/strict";
import { GET as handleMarketStreamRequest } from "../api/market-stream";
import { assetRegistry, getAssetBySymbol, isCoreLiveAsset } from "../src/data/asset-registry";
import { handleMarketHistoryRequest, handleMarketsRequest, handlePerpsRequest } from "../src/server/market-api";
import type { MarketsResponse, PerpsResponse } from "../src/types/market";

async function main() {
const assetIds = assetRegistry.map((asset) => asset.assetId);
assert.equal(new Set(assetIds).size, assetIds.length, "assetId values must be unique");

const cmcIds = assetRegistry.flatMap((asset) => asset.cmcId === null ? [] : [asset.cmcId]);
assert.equal(new Set(cmcIds).size, cmcIds.length, "CMC IDs must not be reused across canonical assets");
assert.equal(getAssetBySymbol("AETHWETH")?.cmcId, 36458);
assert.equal(getAssetBySymbol("AETHWETH")?.name, "Aave Ethereum WETH");
assert.equal(getAssetBySymbol("SKR")?.cmcId, 39377);
assert.equal(getAssetBySymbol("SKR")?.chain, "Solana");
assert.equal(getAssetBySymbol("OPENAI")?.cmcId, 37671);
assert.equal(getAssetBySymbol("NEURALINK")?.cmcId, null);
assert.equal(getAssetBySymbol("NEURALINK")?.availability, "unavailable");

const marketResponse = await handleMarketsRequest(new Request("https://wallet.test/api/markets?currency=USD"));
assert.equal(marketResponse.status, 200);
assert.match(marketResponse.headers.get("content-type") ?? "", /^application\/json/);
const markets = await marketResponse.json() as MarketsResponse;
assert.equal(markets.source, "coinmarketcap");
assert.equal(markets.currency, "USD");
assert.ok(markets.quotes.length >= 15);
assert.ok((markets.quotes.find((quote) => quote.assetId === "bitcoin:native")?.price ?? 0) > 0);
assert.equal(markets.quotes.find((quote) => quote.assetId === "solana:unverified:neuralink")?.price, null);
const coreAssets = assetRegistry.filter((asset) => isCoreLiveAsset(asset.assetId));
assert.equal(coreAssets.length, 20, "the frequent verified market tier must contain exactly 20 assets");
for (const asset of coreAssets) {
  const quote = markets.quotes.find((candidate) => candidate.assetId === asset.assetId);
  assert.ok((quote?.price ?? 0) > 0, `${asset.symbol} must have a provider-backed price`);
  const ageMs = Date.now() - Date.parse(quote?.lastUpdated ?? "");
  assert.ok(Number.isFinite(ageMs) && ageMs >= 0 && ageMs < 15 * 60_000, `${asset.symbol} quote must be fresh`);
}

const invalidCurrency = await handleMarketsRequest(new Request("https://wallet.test/api/markets?currency=NOPE"));
assert.equal(invalidCurrency.status, 400);

const streamProbeResponse = await handleMarketStreamRequest(new Request("https://wallet.test/api/market-stream?probe=1"));
assert.equal(streamProbeResponse.status, 200);
const streamProbe = await streamProbeResponse.json() as { available: boolean; pollAfterMs: number };
assert.equal(typeof streamProbe.available, "boolean");
assert.ok([15_000, 60_000].includes(streamProbe.pollAfterMs));

const perpsResponse = await handlePerpsRequest(new Request("https://wallet.test/api/perps?symbols=BTC,ETH,SOL,XRP,ASTER"));
assert.equal(perpsResponse.status, 200);
const perps = await perpsResponse.json() as PerpsResponse;
assert.equal(perps.source, "provider-apis");
assert.ok(perps.providers.includes("hyperliquid"));
assert.ok(perps.providers.includes("aster"));
assert.ok(perps.markets.some((market) => market.symbol === "BTC" && market.markPrice > 0));
assert.ok(perps.markets.every((market) => market.volume24h >= 0));
assert.ok(perps.markets.every((market) => market.chartPoints.length >= 2));

const historyResponse = await handleMarketHistoryRequest(new Request(
  "https://wallet.test/api/market-history?assetId=bitcoin:native&range=1W&currency=USD",
));
assert.ok([200, 503].includes(historyResponse.status), "history must return real points or the explicit missing-key state");

console.log(`Market contract OK: ${markets.quotes.length} CMC quotes, ${perps.markets.length} Aster/Hyperliquid markets.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
