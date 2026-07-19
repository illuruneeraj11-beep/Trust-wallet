import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiveSparkline, formatMarketChange, formatUsd, MarketStateLabel } from "@/components/live-market-ui";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { assetRegistry, isCoreLiveAsset } from "@/data/asset-registry";

const categories = [
  { label: "Hot tokens", value: "hot" },
  { label: "bStocks", value: "bstocks" },
  { label: "Ondo", value: "rwa" },
  { label: "Top Gainers", value: "gainers" },
  { label: "Stocks", value: "preipo" },
  { label: "Meme", value: "meme" },
  { label: "DeFi", value: "defi" },
  { label: "AI", value: "ai" },
];

const featuredSymbols = ["ETH", "BNB", "XRP"];
export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const { currency, marketByAssetId, marketError, marketStatus, refreshMarkets, theme } = useAppContext();
  const [category, setCategory] = useState("hot");
  const [query, setQuery] = useState("");
  const [filterSheet, setFilterSheet] = useState<"network" | "sort" | "period" | null>(null);
  const [network, setNetwork] = useState("All networks");
  const [sort, setSort] = useState("Volume (24h)");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [period, setPeriod] = useState("24h");

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = assetRegistry.filter((asset) => {
      const categoryMatch = category === "hot"
        ? isCoreLiveAsset(asset.assetId)
        : category === "bstocks"
          ? asset.categories.includes("preipo")
          : asset.categories.includes(category);
      const networkMatch = network === "All networks" || asset.chain === network;
      const queryMatch = !term || asset.name.toLowerCase().includes(term) || asset.symbol.toLowerCase().includes(term);
      return categoryMatch && networkMatch && queryMatch;
    });

    return [...filtered].sort((left, right) => {
      const leftQuote = marketByAssetId[left.assetId];
      const rightQuote = marketByAssetId[right.assetId];
      const leftValue = sort === "Price change" ? leftQuote?.percentChange24h : sort === "Volume (24h)" ? leftQuote?.volume24h : leftQuote?.marketCap;
      const rightValue = sort === "Price change" ? rightQuote?.percentChange24h : sort === "Volume (24h)" ? rightQuote?.volume24h : rightQuote?.marketCap;
      const result = Number(rightValue ?? Number.NEGATIVE_INFINITY) - Number(leftValue ?? Number.NEGATIVE_INFINITY);
      return sortDirection === "desc" ? result : -result;
    });
  }, [category, marketByAssetId, network, query, sort, sortDirection]);

  return (
    <>
      <AppScreen padded={false} withTabBar>
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <View style={{ height: 62, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "700" }}>Markets</Text>
            <Pressable accessibilityLabel="Search markets" onPress={() => router.push("/global-search")} style={{ position: "absolute", right: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
              <TrustIcon color={theme.text} name="magnify" size={25} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: -14 }}>
            <RouteCard icon="chart-box-outline" label="Predictions" onPress={() => router.push("/predictions")} />
            <RouteCard icon="rocket-launch-outline" label="Meme Rush" onPress={() => router.push("/meme-rush")} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}>Top traded (24h)</Text>
            {marketStatus === "live" ? null : <MarketStateLabel compact />}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
            {featuredSymbols.map((symbol) => {
              const asset = assetRegistry.find((item) => item.symbol === symbol);
              if (!asset) return null;
              const quote = marketByAssetId[asset.assetId];
              const positive = Number(quote?.percentChange24h) >= 0;
              return (
                <Pressable
                  key={asset.assetId}
                  onPress={() => router.push({ pathname: "/token-detail", params: { assetId: asset.assetId, symbol: asset.symbol, name: asset.name } })}
                  style={{ width: 122, minHeight: 128, borderRadius: 16, backgroundColor: theme.surface, padding: 12, gap: 4, overflow: "hidden" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: theme.secondary, fontSize: 12, fontWeight: "600" }}>{asset.name}</Text>
                    <TokenLogo symbol={asset.symbol} uri={asset.logo} size={20} />
                  </View>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.text, fontSize: 17, fontWeight: "700" }}>{formatUsd(quote?.price, false, currency.code)}</Text>
                  <Text style={{ color: positive ? theme.positive : theme.negative, fontSize: 13, fontWeight: "600" }}>{formatMarketChange(quote?.percentChange24h)}</Text>
                  <LiveSparkline assetId={asset.assetId} height={44} positive={positive} width={98} />
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#d7d7dc", alignItems: "center", justifyContent: "center" }}>
              <TrustIcon color={theme.secondary} name="star" size={22} />
            </View>
            {categories.map((item) => (
              <Pressable key={item.value} onPress={() => setCategory(item.value)} style={{ minHeight: 36, borderRadius: 18, backgroundColor: category === item.value ? "#dedee2" : theme.surface, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: "600" }}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <FilterChip label={network} onPress={() => setFilterSheet("network")} />
            <FilterChip label={sort} onPress={() => setFilterSheet("sort")} />
            <FilterChip label={period} onPress={() => setFilterSheet("period")} />
          </View>

          {query ? <SearchInput value={query} onChangeText={setQuery} placeholder="Search tokens" /> : null}

          <View>
            {rows.map((asset) => {
              const quote = marketByAssetId[asset.assetId];
              const positive = Number(quote?.percentChange24h) >= 0;
              return (
                <Pressable
                  key={asset.assetId}
                  onPress={() => router.push({ pathname: "/token-detail", params: { assetId: asset.assetId, symbol: asset.symbol, name: asset.name } })}
                  style={{ minHeight: 70, flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={40} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text numberOfLines={1} style={{ color: theme.text, fontSize: 17, fontWeight: "700" }}>{asset.symbol}</Text>
                    <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 12 }}>{formatUsd(quote?.marketCap, true, currency.code)} MCap · {formatUsd(quote?.volume24h, true, currency.code)} Vol</Text>
                  </View>
                  <LiveSparkline assetId={asset.assetId} height={34} positive={positive} width={52} />
                  <View style={{ width: 78, alignItems: "flex-end", gap: 3 }}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.text, fontSize: 17, fontWeight: "700" }}>{formatUsd(quote?.price, false, currency.code)}</Text>
                    <Text style={{ color: positive ? theme.positive : theme.negative, fontSize: 13, fontWeight: "600" }}>{formatMarketChange(quote?.percentChange24h)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {!rows.length ? (
            <View style={{ minHeight: 260, alignItems: "center", justifyContent: "center", gap: 10 }}>
              <TrustIcon color={theme.secondary} name="chart-line-variant" size={34} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>No verified assets in this view</Text>
              <Text style={{ maxWidth: 270, color: theme.secondary, fontSize: 12, lineHeight: 18, textAlign: "center" }}>Only verified identities and real provider quotes are shown.</Text>
            </View>
          ) : null}

          {marketError ? (
            <Pressable onPress={() => void refreshMarkets()} style={{ minHeight: 48, borderRadius: 14, backgroundColor: theme.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TrustIcon color={theme.warning} name="alert-circle-outline" size={20} />
              <Text numberOfLines={1} style={{ flex: 1, color: theme.secondary, fontSize: 11 }}>{marketError}</Text>
              <Text style={{ color: theme.blue, fontSize: 12, fontWeight: "800" }}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      </AppScreen>

      <Pressable accessibilityLabel="Open Swap" onPress={() => router.push("/swap")} style={{ position: "absolute", right: 20, bottom: 96 + insets.bottom, width: 62, height: 62, borderRadius: 31, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}>
        <TrustIcon color="#ffffff" name="swap" size={28} />
      </Pressable>

      <SheetModal visible={filterSheet === "network"} title="Network" onClose={() => setFilterSheet(null)}>
        {["All networks", "BNB Smart Chain", "Solana", "Ethereum", "Base", "Robinhood Chain", "Bitcoin"].map((item) => (
          <SheetChoice key={item} active={network === item} label={item} onPress={() => { setNetwork(item); setFilterSheet(null); }} />
        ))}
      </SheetModal>
      <SheetModal visible={filterSheet === "sort"} title="Sort by" onClose={() => setFilterSheet(null)}>
        {["Price change", "Market cap", "Volume (24h)"].map((item) => (
          <SheetChoice key={item} active={sort === item} label={item} onPress={() => setSort(item)} />
        ))}
        <View style={{ flexDirection: "row", borderRadius: 26, backgroundColor: theme.background, padding: 4 }}>
          <DirectionButton active={sortDirection === "desc"} icon="arrow-down" label="High to low" onPress={() => { setSortDirection("desc"); setFilterSheet(null); }} />
          <DirectionButton active={sortDirection === "asc"} icon="arrow-up" label="Low to high" onPress={() => { setSortDirection("asc"); setFilterSheet(null); }} />
        </View>
      </SheetModal>
      <SheetModal visible={filterSheet === "period"} title="Change period" onClose={() => setFilterSheet(null)}>
        {["1h", "24h", "7d"].map((item) => (
          <SheetChoice key={item} active={period === item} label={item} onPress={() => { setPeriod(item); setFilterSheet(null); }} />
        ))}
      </SheetModal>
    </>
  );
}

function RouteCard({ icon, label, onPress }: { icon: "chart-box-outline" | "rocket-launch-outline"; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ flex: 1, minHeight: 56, borderRadius: 16, backgroundColor: theme.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <TrustIcon color={theme.text} name={icon} size={25} />
      <Text numberOfLines={1} style={{ color: theme.text, fontSize: 16, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function FilterChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable hitSlop={7} onPress={onPress} style={{ minHeight: 36, maxWidth: 126, borderRadius: 18, backgroundColor: theme.surface, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 9, fontWeight: "700" }}>{label}</Text>
      <TrustIcon color={theme.secondary} name="menu-down" size={14} />
    </Pressable>
  );
}

function DirectionButton({ active, icon, label, onPress }: { active: boolean; icon: "arrow-down" | "arrow-up"; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return <Pressable onPress={onPress} style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: active ? "#ffffff" : "transparent", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}><TrustIcon color={active ? theme.text : theme.secondary} name={icon} size={20} /><Text style={{ color: active ? theme.text : theme.secondary, fontSize: 14, fontWeight: "900" }}>{label}</Text></Pressable>;
}

function SheetChoice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 54, borderRadius: 15, backgroundColor: theme.cardSecondary, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: "800" }}>{label}</Text>
      <View style={{ width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: active ? theme.blue : theme.secondary, alignItems: "center", justifyContent: "center" }}>
        {active ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.blue }} /> : null}
      </View>
    </Pressable>
  );
}
