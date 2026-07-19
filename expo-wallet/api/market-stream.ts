import WebSocket from "ws";
import { getStreamConfiguration } from "../src/server/market-api";

const STREAM_URL = "wss://pro-stream.coinmarketcap.com/v1";
const STREAM_LIFETIME_MS = 50_000;
const STREAM_PROBE_TIMEOUT_MS = 9_000;
const STREAM_PROBE_CACHE_MS = 5 * 60_000;

let streamProbeCache: { available: boolean; checkedAt: number } | null = null;

type StreamMessage = {
  type?: string;
  channel?: string;
  ping_interval_ms?: number;
  ts?: number;
  data?: {
    cid?: number;
    p?: number | null;
    p24h?: number | null;
    mc?: number | null;
    vu?: number | null;
  };
};

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function probeStreamCapability(apiKey: string, cmcIds: number[]) {
  if (streamProbeCache && Date.now() - streamProbeCache.checkedAt < STREAM_PROBE_CACHE_MS) {
    return streamProbeCache.available;
  }

  const available = await new Promise<boolean>((resolve) => {
    const upstream = new WebSocket(STREAM_URL, { headers: { "X-CMC_PRO_API_KEY": apiKey } });
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) upstream.close();
      resolve(result);
    };
    const timeout = setTimeout(() => finish(false), STREAM_PROBE_TIMEOUT_MS);
    upstream.on("open", () => {
      upstream.send(JSON.stringify({
        id: 1,
        method: "subscribe",
        channel: "market@crypto_latest_price",
        params: { crypto_ids: cmcIds.slice(0, 1) },
      }));
    });
    upstream.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as StreamMessage;
        if (message.type === "data" && message.channel === "market@crypto_latest_price") finish(true);
        if (message.type === "error") finish(false);
      } catch {
        // Wait for a valid capability response or the bounded timeout.
      }
    });
    upstream.on("error", () => finish(false));
    upstream.on("close", () => finish(false));
  });
  streamProbeCache = { available, checkedAt: Date.now() };
  return available;
}

export async function GET(request: Request) {
  const { apiKey, cmcIds, assetIdByCmcId } = getStreamConfiguration();
  const probe = new URL(request.url).searchParams.get("probe") === "1";
  if (!apiKey) {
    if (probe) {
      return Response.json({ available: false, pollAfterMs: 60_000 }, {
        headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
      });
    }
    return Response.json({
      error: "Real-time streaming requires COINMARKETCAP_API_KEY on a Startup or higher plan; REST polling remains active",
      code: "CMC_STREAM_KEY_REQUIRED",
    }, { status: 503, headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
  }
  if (probe) {
    const available = await probeStreamCapability(apiKey, cmcIds);
    return Response.json({ available, pollAfterMs: available ? 15_000 : 60_000 }, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    });
  }

  const encoder = new TextEncoder();
  let upstream: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let lifetimeTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enqueue = (value: string) => {
        if (!closed) controller.enqueue(encoder.encode(value));
      };
      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (pingTimer) clearInterval(pingTimer);
        if (lifetimeTimer) clearTimeout(lifetimeTimer);
        if (upstream?.readyState === WebSocket.OPEN || upstream?.readyState === WebSocket.CONNECTING) upstream.close();
        try {
          controller.close();
        } catch {
          // The HTTP client may have already closed the stream.
        }
      };

      enqueue(": trust-wallet-market-stream\n\n");
      upstream = new WebSocket(STREAM_URL, { headers: { "X-CMC_PRO_API_KEY": apiKey } });
      upstream.on("open", () => {
        upstream?.send(JSON.stringify({
          id: 1,
          method: "subscribe",
          channel: "market@crypto_latest_price",
          params: { crypto_ids: cmcIds },
        }));
      });
      upstream.on("message", (raw) => {
        let message: StreamMessage;
        try {
          message = JSON.parse(raw.toString()) as StreamMessage;
        } catch {
          return;
        }

        if (message.type === "welcome" && message.ping_interval_ms && !pingTimer) {
          pingTimer = setInterval(() => {
            if (upstream?.readyState === WebSocket.OPEN) {
              upstream.send(JSON.stringify({ id: Date.now(), method: "ping" }));
            }
          }, message.ping_interval_ms);
        }

        if (message.type === "error") {
          enqueue(`data: ${JSON.stringify({
            type: "unavailable",
            reason: "CoinMarketCap rejected the real-time subscription; confirm the key uses a Startup or higher plan",
          })}\n\n`);
          cleanup();
          return;
        }

        if (message.type !== "data" || message.channel !== "market@crypto_latest_price" || !message.data?.cid) return;
        const assetId = assetIdByCmcId[message.data.cid];
        if (!assetId) return;
        const lastUpdated = new Date(message.ts ?? Date.now()).toISOString();
        enqueue(`data: ${JSON.stringify({
          type: "quote",
          quote: {
            assetId,
            price: message.data.p ?? null,
            percentChange24h: message.data.p24h ?? null,
            marketCap: message.data.mc ?? null,
            volume24h: message.data.vu ?? null,
            lastUpdated,
          },
        })}\n\n`);
      });
      upstream.on("error", () => cleanup());
      upstream.on("close", (code) => {
        if ([4004, 4100, 4101, 4102].includes(code)) {
          enqueue(`data: ${JSON.stringify({
            type: "unavailable",
            reason: "CoinMarketCap streaming is unavailable for the configured key; REST polling remains active",
          })}\n\n`);
        }
        cleanup();
      });
      lifetimeTimer = setTimeout(cleanup, STREAM_LIFETIME_MS);
    },
    cancel() {
      closed = true;
      if (pingTimer) clearInterval(pingTimer);
      if (lifetimeTimer) clearTimeout(lifetimeTimer);
      if (upstream?.readyState === WebSocket.OPEN || upstream?.readyState === WebSocket.CONNECTING) upstream.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
