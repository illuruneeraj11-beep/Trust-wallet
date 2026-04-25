import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { formatCurrencyValue } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, Pill, SectionHeader, TokenRow } from "@/components/trust-ui";

export default function TrendingScreen() {
  const { currency, marketFilter, marketFilters, setMarketFilter, theme, topTradedTokens, trendingTokens } = useAppContext();

  return (
    <AppScreen title="Trending" subtitle="Track markets, narratives, and fast movers">
      <SectionHeader title="Top traded" actionLabel="History" onPress={() => router.push("/tx-history")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {topTradedTokens.map((token) => (
          <Card key={token.symbol} muted>
            <View style={{ width: 182, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{token.symbol.slice(0, 3)}</Text>
                </View>
                <Text style={{ color: token.change >= 0 ? theme.positive : theme.negative, fontSize: 13, fontWeight: "900" }}>{`${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{token.name}</Text>
                <Text style={{ color: theme.secondary, fontSize: 13 }}>{formatCurrencyValue(token.price, currency)}</Text>
              </View>
              <View style={{ height: 40, borderRadius: 16, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.secondary, fontSize: 12 }}>{token.change >= 0 ? "╱╲╱" : "╲╱╲"}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      <SectionHeader title="Market filters" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {marketFilters.map((filter) => (
          <Pill key={filter} label={filter} active={filter === marketFilter} onPress={() => setMarketFilter(filter)} />
        ))}
      </ScrollView>

      <View style={{ gap: 12 }}>
        {trendingTokens.map((token) => (
          <TokenRow
            key={token.symbol}
            symbol={token.symbol}
            name={token.name}
            price={formatCurrencyValue(token.price, currency)}
            change={`${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`}
            meta={`${token.marketCap} MCap · ${token.volume} Vol`}
            network={token.network}
            onPress={() => router.push({ pathname: "/token-detail", params: { symbol: token.symbol, name: token.name, price: formatCurrencyValue(token.price, currency), change: `${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%` } })}
          />
        ))}
      </View>
    </AppScreen>
  );
}
