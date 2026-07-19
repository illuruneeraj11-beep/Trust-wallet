import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { MarketChart } from "@/components/market-chart";
import { useAppContext } from "@/context/app-context";
import { fetchMarketHistory } from "@/services/market-prices";
import type { MarketCurrency, MarketHistoryRange } from "@/types/market";

export function useMarketHistoryPoints(assetId: string, range: MarketHistoryRange = "1D") {
  const { currency } = useAppContext();
  const [points, setPoints] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchMarketHistory(assetId, range, currency.code, controller.signal);
        const realPoints = (payload.points ?? []).map((point) => point.price).filter(Number.isFinite);
        if (active) setPoints(realPoints);
      } catch (caught) {
        if (active) {
          setPoints([]);
          setError(caught instanceof Error ? caught.message : "History unavailable");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [assetId, currency.code, range]);

  return { points, loading, error };
}

export function formatUsd(value: number | null | undefined, compact = false, currency: MarketCurrency = "USD") {
  if (!Number.isFinite(value)) return "Unavailable";
  const amount = Number(value);
  const maximumFractionDigits = Math.abs(amount) < 1 ? 6 : Math.abs(amount) < 100 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: compact ? "compact" : "standard",
    compactDisplay: compact ? "short" : undefined,
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 2 : maximumFractionDigits,
  }).format(amount);
}

export function formatMarketChange(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "--";
  const amount = Number(value);
  return `${amount >= 0 ? "+" : ""}${amount.toFixed(2)}%`;
}

export function MarketStateLabel({ compact = false }: { compact?: boolean }) {
  const { marketStatus, marketUpdatedAt, theme } = useAppContext();
  const label = useMemo(() => {
    if (marketStatus === "loading") return "Updating prices";
    if (marketStatus === "stale") return "Last known prices";
    if (marketStatus === "error") return "Prices unavailable";
    if (marketStatus !== "live" || !marketUpdatedAt) return "Market data pending";
    const updated = new Date(marketUpdatedAt);
    return Number.isNaN(updated.getTime()) ? "Live prices" : `Updated ${updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }, [marketStatus, marketUpdatedAt]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: marketStatus === "live" ? theme.positive : marketStatus === "stale" ? theme.warning : theme.secondary }} />
      <Text style={{ color: theme.secondary, fontSize: compact ? 10 : 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function LiveSparkline({
  assetId,
  positive = true,
  width = 82,
  height = 38,
}: {
  assetId: string;
  positive?: boolean;
  width?: number;
  height?: number;
}) {
  const { theme } = useAppContext();
  const { loading, points } = useMarketHistoryPoints(assetId, "1D");

  if (loading) {
    return (
      <View style={{ width, height, alignItems: "center", justifyContent: "center", backgroundColor: theme.mutedSurface, borderRadius: 8 }}>
        <ActivityIndicator color={theme.secondary} size="small" />
      </View>
    );
  }

  if (points.length < 2) {
    return (
      <View accessibilityLabel="Historical chart unavailable" style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: Math.max(24, width * 0.5), height: 1, backgroundColor: theme.border }} />
      </View>
    );
  }

  return <MarketChart color={positive ? theme.positive : theme.negative} height={height} points={points} width={width} />;
}
