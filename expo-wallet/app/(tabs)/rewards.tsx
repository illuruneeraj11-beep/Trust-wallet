import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, BackHandler, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { TrustIcon } from "@/components/trust-icon";
import { MiniSparkline, ProviderBadge } from "@/components/secondary-flow-ui";
import { TokenLogo } from "@/components/trust-assets";
import {
  perpsCategories,
  perpsMarketDefinitions,
  type PerpsCategory,
  type PerpsMarketDefinition,
  type PerpsProvider,
} from "@/data/secondary-flows";
import { useAppContext } from "@/context/app-context";
import { fetchPerps } from "@/services/market-prices";

type SheetState = "providers" | "sort" | "settings" | "deposit" | "ticket" | null;
type SortMetric = "volume" | "change";
type SortDirection = "desc" | "asc";
type PerpsMarketItem = PerpsMarketDefinition & {
  leverage: number | null;
  volume: number;
  volumeLabel: string;
  price: number;
  priceLabel: string;
  change: number | null;
  points: number[];
};

export default function PerpsTabScreen() {
  const { theme } = useAppContext();
  const { markets, live, loading, error, refresh } = usePerpsFeed();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PerpsCategory>("Popular");
  const [provider, setProvider] = useState<PerpsProvider | "All">("All");
  const [sortMetric, setSortMetric] = useState<SortMetric>("volume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [selectedMarket, setSelectedMarket] = useState<PerpsMarketItem | null>(null);

  useEffect(() => {
    if (!sheet && !searchOpen) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (sheet) {
        setSheet(null);
        setSelectedMarket(null);
      } else {
        setSearchOpen(false);
        setQuery("");
      }
      return true;
    });
    return () => subscription.remove();
  }, [searchOpen, sheet]);

  const visibleMarkets = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = markets.filter((market) => {
      const categoryMatches = category === "Popular" || market.category === category;
      const providerMatches = provider === "All" || market.provider === provider;
      const queryMatches = !term || `${market.symbol} ${market.name}`.toLowerCase().includes(term);
      return categoryMatches && providerMatches && queryMatches;
    });
    return [...filtered].sort((left, right) => {
      const a = sortMetric === "volume" ? left.volume : left.change ?? Number.NEGATIVE_INFINITY;
      const b = sortMetric === "volume" ? right.volume : right.change ?? Number.NEGATIVE_INFINITY;
      return sortDirection === "desc" ? b - a : a - b;
    });
  }, [category, markets, provider, query, sortDirection, sortMetric]);

  const openCategory = (next: PerpsCategory) => {
    setCategory(next);
    setSearchOpen(true);
  };

  const openTicket = (market: PerpsMarketItem) => {
    setSelectedMarket(market);
    setSheet("ticket");
  };

  return (
    <>
      <AppScreen padded={false} withTabBar>
        <View style={{ paddingHorizontal: 18, gap: 20 }}>
          {searchOpen ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <SearchInput value={query} onChangeText={setQuery} placeholder="Search market" />
              </View>
              <CircleButton icon="close" onPress={() => { setSearchOpen(false); setQuery(""); }} />
            </View>
          ) : (
            <View style={{ height: 50, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute", left: 0, flexDirection: "row", gap: 8 }}>
                <CircleButton icon="history" onPress={() => router.push("/tx-history")} />
                <CircleButton icon="cog" onPress={() => setSheet("settings")} />
              </View>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800" }}>Perps</Text>
              <View style={{ position: "absolute", right: 0 }}>
                <CircleButton icon="magnify" onPress={() => setSearchOpen(true)} />
              </View>
            </View>
          )}

          {!searchOpen ? (
            <>
              {loading ? (
                <View style={{ gap: 10 }}>
                  <View style={{ width: "62%", height: 50, borderRadius: 6, backgroundColor: theme.surface }} />
                  <View style={{ width: "35%", height: 22, borderRadius: 5, backgroundColor: theme.surface }} />
                  <View style={{ minHeight: 72, borderRadius: 22, backgroundColor: theme.surface, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ flex: 1, gap: 7 }}>
                      <Text style={{ color: theme.secondary, fontSize: 13, fontWeight: "700" }}>Available balance</Text>
                      <View style={{ width: 110, height: 22, borderRadius: 5, backgroundColor: theme.border }} />
                    </View>
                    <CircleButton icon="minus" onPress={() => undefined} />
                    <CircleButton icon="plus" onPress={() => undefined} />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  <View style={{ minHeight: 84, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ flex: 1, color: theme.text, fontSize: 28, lineHeight: 35, fontWeight: "800" }}>Deposit to fund your first position</Text>
                    <View style={{ width: 84, height: 68, alignItems: "center", justifyContent: "center" }}>
                      <TrustIcon color="#1510f5" name="infinity" size={70} />
                    </View>
                  </View>
                  <Pressable onPress={() => setSheet("deposit")} style={{ height: 58, borderRadius: 29, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "800" }}>Deposit</Text>
                  </Pressable>
                </View>
              )}

              <View style={{ gap: 13 }}>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: "700" }}>Explore</Text>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <ExploreCard label="Popular" color="#ff9914" icon="fire" onPress={() => openCategory("Popular")} />
                    <ExploreCard label="Crypto" color="#20bdd8" icon="star-four-points-outline" onPress={() => openCategory("Crypto")} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <ExploreCard label="Stocks" color="#c00bff" icon="candlestick-chart" onPress={() => openCategory("Stocks")} />
                    <ExploreCard label="Commodities" color="#ec00dc" icon="diamond-stone" onPress={() => openCategory("Commodities")} />
                  </View>
                </View>
              </View>

              {!loading && error ? <ProviderState icon="cloud-alert" title="Provider data unavailable" detail={error} onPress={() => void refresh()} /> : null}
              {!loading && !error ? (
                <>
                  <MarketRail title="Popular" markets={markets.slice(0, 6)} onOpen={() => openCategory("Popular")} onPress={openTicket} />
                  <MarketRail title="Crypto" markets={markets.filter((market) => market.category === "Crypto").slice(0, 6)} onOpen={() => openCategory("Crypto")} onPress={openTicket} />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <DisabledTradeButton color="#0aa84f" label="Long" />
                    <DisabledTradeButton color="#cf3030" label="Short" />
                  </View>
                  <Text style={{ color: theme.secondary, textAlign: "center", fontSize: 12 }}>Market data only. Trading is unavailable on Testnet.</Text>
                </>
              ) : null}
            </>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
                <CategoryChip active={category === "Popular"} icon="star-outline" onPress={() => setCategory("Popular")} />
                {perpsCategories.map((item) => (
                  <CategoryChip key={item} active={category === item} label={item} onPress={() => setCategory(item)} />
                ))}
              </ScrollView>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <Pressable onPress={() => setSheet("providers")} style={{ minHeight: 34, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ flexDirection: "row" }}>
                    <ProviderBadge compact provider="Aster" />
                    <View style={{ marginLeft: -5 }}><ProviderBadge compact provider="Hyperliquid" /></View>
                  </View>
                  <Text style={{ color: theme.secondary, fontSize: 13, fontWeight: "700" }}>{provider === "All" ? "All providers" : provider}</Text>
                  <TrustIcon color={theme.secondary} name="menu-down" size={19} />
                </Pressable>
                <Pressable onPress={() => setSheet("sort")} style={{ minHeight: 34, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text style={{ color: theme.secondary, fontSize: 13, fontWeight: "700" }}>{sortMetric === "volume" ? "Volume (24h)" : "Price change"}</Text>
                  <TrustIcon color={theme.secondary} name={sortDirection === "desc" ? "arrow-down" : "arrow-up"} size={18} />
                </Pressable>
              </View>

              <View style={{ gap: 1 }}>
                {visibleMarkets.map((market) => <MarketRow key={`${market.provider}:${market.symbol}`} market={market} onPress={() => openTicket(market)} />)}
                {!loading && !visibleMarkets.length ? (
                  <View style={{ paddingVertical: 72, alignItems: "center", gap: 12 }}>
                    <TrustIcon color={theme.secondary} name="magnify" size={38} />
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: "800" }}>No markets found</Text>
                    <Text style={{ color: theme.secondary, fontSize: 14 }}>Try another category, provider, or search.</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: live ? theme.positive : theme.secondary }} />
                <Text style={{ color: theme.secondary, fontSize: 12 }}>{live ? "Live provider data" : "Last available provider snapshot"}</Text>
              </View>
            </>
          )}
        </View>
      </AppScreen>

      <SheetModal visible={sheet === "providers"} title="Providers" subtitle="Filter perpetual markets by venue" onClose={() => setSheet(null)}>
        {(["All", "Aster", "Hyperliquid"] as const).map((item) => (
          <SheetChoice key={item} label={item === "All" ? "All providers" : item} selected={provider === item} onPress={() => { setProvider(item); setSheet(null); }} />
        ))}
      </SheetModal>

      <SheetModal visible={sheet === "sort"} title="Sort markets" subtitle="Choose the metric and direction" onClose={() => setSheet(null)}>
        <SheetChoice label="Price change" selected={sortMetric === "change"} onPress={() => setSortMetric("change")} />
        <SheetChoice label="Volume (24h)" selected={sortMetric === "volume"} onPress={() => setSortMetric("volume")} />
        <View style={{ flexDirection: "row", borderRadius: 27, backgroundColor: theme.background, padding: 4 }}>
          <DirectionButton active={sortDirection === "desc"} icon="arrow-down" label="High to low" onPress={() => setSortDirection("desc")} />
          <DirectionButton active={sortDirection === "asc"} icon="arrow-up" label="Low to high" onPress={() => setSortDirection("asc")} />
        </View>
      </SheetModal>

      <SheetModal visible={sheet === "settings"} title="Perps settings" subtitle="Testnet display preferences" onClose={() => setSheet(null)}>
        <SheetChoice label="Show provider badges" selected onPress={() => undefined} />
        <SheetChoice label="Show 24h charts" selected onPress={() => undefined} />
        <PrimaryButton label="Done" onPress={() => setSheet(null)} />
      </SheetModal>

      <SheetModal visible={sheet === "deposit"} title="Deposit to Perps" subtitle="Perpetual deposits and wallet signatures are unavailable on Testnet." onClose={() => setSheet(null)}>
        <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TrustIcon color={theme.blue} name="shield-check-outline" size={28} />
          <Text style={{ flex: 1, color: theme.secondary, fontSize: 14, lineHeight: 20 }}>Testnet does not connect to a live trading account.</Text>
        </View>
        <PrimaryButton label="Close" onPress={() => setSheet(null)} />
      </SheetModal>

      <SheetModal visible={sheet === "ticket"} title={selectedMarket ? `${selectedMarket.symbol} Perps` : "Perps market"} subtitle="Testnet market details" onClose={() => setSheet(null)}>
        {selectedMarket ? (
          <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <MarketLogo market={selectedMarket} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>{selectedMarket.priceLabel}</Text>
              <Text style={{ color: selectedMarket.change === null ? theme.secondary : selectedMarket.change >= 0 ? theme.positive : theme.negative, fontSize: 14, fontWeight: "700" }}>{formatChange(selectedMarket.change)}</Text>
            </View>
            <ProviderBadge provider={selectedMarket.provider} />
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <DisabledTradeButton color="#0aa84f" label="Long" />
          <DisabledTradeButton color="#cf3030" label="Short" />
        </View>
        <Text style={{ color: theme.secondary, textAlign: "center", fontSize: 12 }}>Trading is unavailable on Testnet.</Text>
      </SheetModal>
    </>
  );
}

function CircleButton({ icon, onPress }: { icon: "history" | "cog" | "magnify" | "close" | "plus" | "minus"; onPress: () => void }) {
  const accessibilityLabel = icon === "history" ? "Perps activity"
    : icon === "cog" ? "Perps settings"
      : icon === "magnify" ? "Search markets"
        : icon === "close" ? "Close search"
          : icon === "plus" ? "Increase amount"
            : "Decrease amount";
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#f2f2f4", alignItems: "center", justifyContent: "center" }}>
      <TrustIcon color="#202124" name={icon} size={25} />
    </Pressable>
  );
}

function ExploreCard({ label, color, icon, onPress }: { label: string; color: string; icon: "fire" | "star-four-points-outline" | "candlestick-chart" | "diamond-stone"; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, height: 64, borderRadius: 16, backgroundColor: "#f1f1f3", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color="#ffffff" name={icon} size={19} />
      </View>
      <Text style={{ color: "#202124", fontSize: 17, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function MarketRail({ title, markets, onOpen, onPress }: { title: string; markets: PerpsMarketItem[]; onOpen: () => void; onPress: (market: PerpsMarketItem) => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(286, Math.min(width - 36, 394));
  return (
    <View style={{ gap: 12 }}>
      <Pressable onPress={onOpen} style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ color: "#202124", fontSize: 22, fontWeight: "800" }}>{title}</Text>
        <TrustIcon color="#202124" name="chevron-right" size={26} />
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 18 }}>
        {[0, 3].map((start) => (
          <View key={start} style={{ width: cardWidth, borderWidth: 1, borderColor: "#e6e6e8", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9 }}>
            {markets.slice(start, start + 3).map((market) => <CompactMarketRow key={`${market.provider}:${market.symbol}`} market={market} onPress={() => onPress(market)} />)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryChip({ label, icon, active, onPress }: { label?: string; icon?: "star-outline"; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minWidth: icon ? 44 : undefined, minHeight: 42, borderRadius: 21, backgroundColor: active ? "#d2d2d8" : "#f1f1f3", paddingHorizontal: icon ? 0 : 19, alignItems: "center", justifyContent: "center" }}>
      {icon ? <TrustIcon color="#5f6065" name={icon} size={25} /> : <Text style={{ color: active ? "#202124" : "#66676c", fontSize: 16, fontWeight: "800" }}>{label}</Text>}
    </Pressable>
  );
}

function MarketLogo({ market, size = 46 }: { market: PerpsMarketItem; size?: number }) {
  return (
    <View style={{ width: size + 3, height: size + 3 }}>
      <TokenLogo symbol={market.symbol} size={size} />
      <View style={{ position: "absolute", right: 0, bottom: 0, borderWidth: 2, borderColor: "#ffffff", borderRadius: 9 }}>
        <ProviderBadge compact provider={market.provider} />
      </View>
    </View>
  );
}

function MarketRow({ market, onPress }: { market: PerpsMarketItem; onPress: () => void }) {
  const positive = market.change !== null && market.change >= 0;
  return (
    <Pressable onPress={onPress} style={{ minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10 }}>
      <MarketLogo market={market} />
      <View style={{ width: 116, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text numberOfLines={1} style={{ maxWidth: 76, color: "#202124", fontSize: 17, fontWeight: "900" }}>{market.symbol}</Text>
          <View style={{ minHeight: 24, borderRadius: 12, backgroundColor: "#eeeeef", paddingHorizontal: 8, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#6d6d72", fontSize: 12, fontWeight: "700" }}>{market.leverage === null ? "N/A" : `${market.leverage}x`}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={{ color: "#77777b", fontSize: 13, fontWeight: "600" }}>{market.volumeLabel} Vol</Text>
      </View>
      <MiniSparkline points={market.points} positive={positive} />
      <View style={{ flex: 1, alignItems: "flex-end", gap: 2 }}>
        <Text numberOfLines={1} style={{ color: "#202124", fontSize: 17, fontWeight: "800" }}>{market.priceLabel}</Text>
        <Text style={{ color: market.change === null ? "#77777b" : positive ? "#0aa84f" : "#c8122f", fontSize: 14, fontWeight: "700" }}>{formatChange(market.change)}</Text>
      </View>
    </Pressable>
  );
}

function CompactMarketRow({ market, onPress }: { market: PerpsMarketItem; onPress: () => void }) {
  const positive = market.change !== null && market.change >= 0;
  return (
    <Pressable onPress={onPress} style={{ minHeight: 62, flexDirection: "row", alignItems: "center", gap: 9 }}>
      <MarketLogo market={market} size={40} />
      <View style={{ width: 82 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={{ color: "#202124", fontSize: 16, fontWeight: "900" }}>{market.symbol}</Text>
          <Text style={{ color: "#6d6d72", fontSize: 11, backgroundColor: "#eeeeef", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 }}>{market.leverage === null ? "N/A" : `${market.leverage}x`}</Text>
        </View>
        <Text numberOfLines={1} style={{ color: "#77777b", fontSize: 12 }}>{market.volumeLabel} Vol</Text>
      </View>
      <MiniSparkline points={market.points} positive={positive} width={58} height={32} />
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={{ color: "#202124", fontSize: 16, fontWeight: "800" }}>{market.priceLabel}</Text>
        <Text style={{ color: market.change === null ? "#77777b" : positive ? "#0aa84f" : "#c8122f", fontSize: 13, fontWeight: "700" }}>{formatChange(market.change)}</Text>
      </View>
    </Pressable>
  );
}

function SheetChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ color: "#202124", fontSize: 17, fontWeight: "700" }}>{label}</Text>
      <TrustIcon color={selected ? "#0500ff" : "#77777b"} name={selected ? "radiobox-marked" : "radiobox-blank"} size={25} />
    </Pressable>
  );
}

function DirectionButton({ active, icon, label, onPress }: { active: boolean; icon: "arrow-down" | "arrow-up"; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: active ? "#ffffff" : "transparent", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
      <TrustIcon color={active ? "#202124" : "#6d6d72"} name={icon} size={21} />
      <Text style={{ color: active ? "#202124" : "#6d6d72", fontSize: 15, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ height: 54, borderRadius: 27, backgroundColor: "#0500ff", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function DisabledTradeButton({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flex: 1, height: 50, borderRadius: 25, backgroundColor: color, opacity: 0.45, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

function ProviderState({ icon, title, detail, onPress }: { icon: "loading" | "cloud-alert"; title: string; detail: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={{ minHeight: 96, borderRadius: 20, backgroundColor: "#f2f2f4", padding: 16, flexDirection: "row", alignItems: "center", gap: 13 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color="#5f6065" name={icon} size={24} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: "#202124", fontSize: 16, fontWeight: "800" }}>{title}</Text>
        <Text style={{ color: "#6d6d72", fontSize: 12, lineHeight: 17 }}>{detail}</Text>
      </View>
      {onPress ? <TrustIcon color="#202124" name="refresh" size={22} /> : null}
    </Pressable>
  );
}

function formatChange(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function usePerpsFeed() {
  const [markets, setMarkets] = useState<PerpsMarketItem[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setError(null);
    try {
      const symbols = Array.from(new Set(perpsMarketDefinitions.map((market) => market.symbol)));
      const response = await fetchPerps(symbols);
      if (!response.markets.length) throw new Error("No matching perpetual markets are currently available");
      setMarkets(response.markets.flatMap((update) => {
        const provider: PerpsProvider = update.provider === "aster" ? "Aster" : "Hyperliquid";
        const definition = perpsMarketDefinitions.find((item) => item.symbol === update.symbol && item.provider === provider);
        if (!definition) return [];
        return {
          ...definition,
          leverage: update.maxLeverage,
          price: update.markPrice,
          priceLabel: formatPrice(update.markPrice),
          change: update.percentChange24h,
          volume: update.volume24h,
          volumeLabel: formatCompactCurrency(update.volume24h),
          points: update.chartPoints.map((point) => point.price),
        };
      }));
      setLive(!response.stale);
    } catch (caught) {
      setLive(false);
      setError(caught instanceof Error ? caught.message : "Unable to fetch provider markets");
    } finally {
      setLoading(false);
      requestInFlight.current = false;
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
    let timer = setInterval(() => void refresh(), 15_000);
    const subscription = AppState.addEventListener("change", (state) => {
      clearInterval(timer);
      if (state === "active") {
        void refresh();
        timer = setInterval(() => void refresh(), 15_000);
      }
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [refresh]));

  return { markets, live, loading, error, refresh };
}

function formatPrice(value: number) {
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  return `$${value.toLocaleString("en-US", { minimumSignificantDigits: 4, maximumSignificantDigits: 6 })}`;
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
