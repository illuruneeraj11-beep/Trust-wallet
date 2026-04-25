import { router } from "expo-router";
import { View } from "react-native";
import { memeRushEntries, perpsMarkets, predictionMarkets } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function TradeScreen() {
  const { theme } = useAppContext();

  return (
    <AppScreen title="Trade" subtitle="Swap, trade perps, predictions, and meme rush from one place">
      <Card muted>
        <View style={{ gap: 12 }}>
          <SettingRow icon="⇄" title="Swap" subtitle="Exchange any crypto instantly" onPress={() => router.push("/swap")} />
          <SettingRow icon="📈" title="Perps" subtitle="Trade the market either up or down" onPress={() => router.push("/perps")} />
          <SettingRow icon="🗳" title="Predictions" subtitle="Trade on real-world events" onPress={() => router.push("/predictions")} />
          <SettingRow icon="⚡" title="Meme Rush" subtitle="Trade memes as fast as possible" onPress={() => router.push("/meme-rush")} />
        </View>
      </Card>

      <SectionHeader title="Perps snapshot" actionLabel="Open" onPress={() => router.push("/perps")} />
      <Card>
        <View style={{ gap: 12 }}>
          {perpsMarkets.slice(0, 3).map((market) => (
            <View key={market.pair} style={{ minHeight: 62, borderRadius: 18, backgroundColor: theme.cardSecondary, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ gap: 4 }}>
                <SettingRow icon="◌" title={market.pair} subtitle={`${market.leverage} · ${market.volume} vol`} value={market.price} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Predictions" actionLabel="View all" onPress={() => router.push("/predictions")} />
      <Card>
        <View style={{ gap: 12 }}>
          {predictionMarkets.slice(0, 2).map((market) => (
            <View key={market.id} style={{ borderRadius: 20, backgroundColor: theme.cardSecondary, padding: 16, gap: 12 }}>
              <View style={{ gap: 4 }}>
                <SettingRow icon="🧠" title={market.title} subtitle={`${market.volume} · ${market.provider}`} value={market.endsIn} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Meme Rush" actionLabel="Leaderboard" onPress={() => router.push("/meme-rush")} />
      <Card>
        <View style={{ gap: 12 }}>
          {memeRushEntries.slice(0, 3).map((entry) => (
            <View key={entry.symbol} style={{ borderRadius: 20, backgroundColor: theme.cardSecondary, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <View style={{ gap: 4 }}>
                <SettingRow icon="⚡" title={entry.symbol} subtitle={`${entry.age} · Holders ${entry.holders}`} value={entry.trend} />
              </View>
            </View>
          ))}
        </View>
      </Card>
    </AppScreen>
  );
}
