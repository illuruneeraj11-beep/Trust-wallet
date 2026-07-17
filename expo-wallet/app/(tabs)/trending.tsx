import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { formatCurrencyValue } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Pill, TokenAvatar } from "@/components/trust-ui";

export default function MarketsScreen() {
  const { currency, marketFilter, marketFilters, setMarketFilter, theme, topTradedTokens, trendingTokens } = useAppContext();

  return (
    <View style={{ flex: 1 }}>
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <View style={{ height: 52, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Markets</Text>
          <Pressable onPress={() => router.push("/tx-history")} style={{ position: "absolute", right: 0 }}>
            <Text style={{ color: theme.secondary, fontSize: 34 }}>⌕</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <MarketShortcut label="Predictions" icon="▣" onPress={() => router.push("/predictions")} />
          <MarketShortcut label="Meme Rush" icon="🚀" onPress={() => router.push("/meme-rush")} />
        </View>

        <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>Top traded (24h)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {topTradedTokens.map((token) => (
            <View key={token.symbol} style={{ width: 150, height: 150, borderRadius: 16, backgroundColor: theme.surface, padding: 16, gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text numberOfLines={1} style={{ flex: 1, color: theme.secondary, fontSize: 14, fontWeight: "800" }}>{token.name}</Text>
                <TokenAvatar symbol={token.symbol} size={30} />
              </View>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>{formatCurrencyValue(token.price, currency)}</Text>
              <Text style={{ color: token.change >= 0 ? theme.positive : theme.negative, fontSize: 16, fontWeight: "900" }}>{`${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`}</Text>
            </View>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          <Pressable onPress={() => setMarketFilter("hot")} style={{ width: 48, height: 42, borderRadius: 21, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.secondary, fontSize: 24 }}>★</Text>
          </Pressable>
          {marketFilters.map((filter) => (
            <Pill key={filter} label={filterLabel(filter)} active={filter === marketFilter} onPress={() => setMarketFilter(filter)} />
          ))}
        </ScrollView>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pill label="Network⌄" onPress={() => router.push("/network-selector")} />
          <View style={{ flex: 1 }} />
          <Pill label="Market cap ↓" onPress={() => setMarketFilter("hot")} />
          <Pill label="24h⌄" onPress={() => setMarketFilter("gainers")} />
        </View>

        <View style={{ gap: 14 }}>
          {trendingTokens.map((token) => (
            <MarketRow key={token.symbol} symbol={token.symbol} name={token.name} meta={`${token.marketCap} MCap · ${token.volume} Vol`} price={formatCurrencyValue(token.price, currency)} change={`${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`} network={token.network} onPress={() => router.push("/token-detail")} />
          ))}
        </View>
      </View>
    </AppScreen>
    <Pressable onPress={() => router.push("/swap")} style={{ position: "absolute", right: 20, bottom: 114, width: 54, height: 54, borderRadius: 27, backgroundColor: "#0500ff", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(5, 0, 255, 0.25)" }}>
      <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }}>⇄</Text>
    </Pressable>
    </View>
  );
}

function filterLabel(filter: string) {
  const labels: Record<string, string> = {
    hot: "Hot tokens",
    ondo: "Ondo",
    preipo: "Pre-IPO",
    gainers: "Top Gainers",
    rwa: "RWA",
    meme: "Meme",
    defi: "DeFi",
    ai: "AI",
  };
  return labels[filter] ?? filter;
}

function MarketShortcut({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, minHeight: 74, borderRadius: 16, backgroundColor: "#f0f0f3", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Text style={{ color: "#202124", fontSize: 24 }}>{icon}</Text>
      <Text style={{ color: "#202124", fontSize: 18, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function MarketRow({ symbol, name, meta, price, change, network, onPress }: { symbol: string; name: string; meta: string; price: string; change: string; network: string; onPress: () => void }) {
  const positive = change.startsWith("+");
  return (
    <Pressable onPress={onPress} style={{ minHeight: 76, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <TokenAvatar symbol={symbol} network={network} size={54} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#202124", fontSize: 20, fontWeight: "900" }}>{symbol.length > 8 ? name : symbol}</Text>
        <Text numberOfLines={1} style={{ color: "#6d6d72", fontSize: 15 }}>{meta}</Text>
      </View>
      <Sparkline positive={positive} />
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: "#202124", fontSize: 20, fontWeight: "900" }}>{price}</Text>
        <Text style={{ color: positive ? "#0aa84f" : "#cf3030", fontSize: 16, fontWeight: "800" }}>{change}</Text>
      </View>
    </Pressable>
  );
}

function Sparkline({ positive }: { positive: boolean }) {
  const bars = positive ? [8, 12, 9, 16, 20, 18, 28] : [28, 24, 20, 21, 15, 12, 8];
  return (
    <View style={{ width: 62, height: 34, flexDirection: "row", alignItems: "flex-end", gap: 2, overflow: "hidden" }}>
      {bars.map((height, index) => (
        <View key={`${height}-${index}`} style={{ width: 7, height, borderRadius: 4, backgroundColor: positive ? "rgba(10, 168, 79, 0.24)" : "rgba(207, 48, 48, 0.22)" }} />
      ))}
      <View style={{ position: "absolute", right: 0, bottom: bars[bars.length - 1] - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: positive ? "#0aa84f" : "#cf3030" }} />
    </View>
  );
}
