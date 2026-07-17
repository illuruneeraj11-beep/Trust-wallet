import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { perpsMarkets } from "@/data/trust-wallet";
import { AppScreen, Pill, SearchInput, SheetModal, TokenAvatar } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const filters = ["Popular", "Crypto", "Stocks", "Commodities"];

export default function PerpsTabScreen() {
  const { theme } = useAppContext();
  const [activeFilter, setActiveFilter] = useState("Popular");
  const [sheet, setSheet] = useState<string | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 18 }}>
          <View style={{ height: 52, alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={() => router.push("/tx-history")} style={{ position: "absolute", left: 0 }}><Text style={{ color: theme.text, fontSize: 34 }}>◷</Text></Pressable>
            <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Perps</Text>
            <View style={{ position: "absolute", right: 0, flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => setSheet("Search market")}><Text style={{ color: theme.text, fontSize: 30 }}>⌕</Text></Pressable>
              <Pressable onPress={() => setSheet("Perps settings")}><Text style={{ color: theme.text, fontSize: 30 }}>⚙</Text></Pressable>
            </View>
          </View>

          <View style={{ borderRadius: 18, backgroundColor: theme.surface, padding: 24, alignItems: "center", gap: 18 }}>
            <LinearGradient colors={["#1500ff", "#6be7ff"]} style={{ width: 124, height: 70, borderRadius: 36, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#ffffff", fontSize: 58, fontWeight: "900", lineHeight: 62 }}>∞</Text>
            </LinearGradient>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>Trade Perps</Text>
            <Pressable onPress={() => setSheet("Deposit to Perps")} style={{ alignSelf: "stretch", height: 58, borderRadius: 29, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>Deposit</Text>
            </Pressable>
          </View>

          <SearchInput value="" onChangeText={() => undefined} placeholder="Search market" />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            <Pressable onPress={() => setSheet("Favorites")} style={{ width: 48, height: 42, borderRadius: 21, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: theme.secondary, fontSize: 24 }}>☆</Text>
            </Pressable>
            {filters.map((filter) => (
              <Pill key={filter} label={filter} active={filter === activeFilter} onPress={() => setActiveFilter(filter)} />
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Pill label="All providers ▼" onPress={() => setSheet("All providers")} />
            <Pill label="Volume (24h) ↓" onPress={() => setSheet("Sort by volume")} />
          </View>

          <View style={{ borderRadius: 18, backgroundColor: theme.surface, padding: 16, gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 19, fontWeight: "900" }}>Deposit to fund your first position</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pressable onPress={() => setSheet("Decrease leverage")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>−</Text>
              </Pressable>
              <Pressable onPress={() => setSheet("Deposit to Perps")} style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>Deposit</Text>
              </Pressable>
              <Pressable onPress={() => setSheet("Increase leverage")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 14 }}>
            {perpsMarkets.map((market) => (
              <PerpsRow key={market.pair} symbol={market.symbol} pair={market.symbol} meta={`${market.volume} Vol · ${market.leverage.replace("x", "")}x`} price={market.price} change={market.change.replace("-", "+")} onPress={() => setSheet(`${market.pair} trade ticket`)} />
            ))}
            {["HYPE", "ZEC", "DRAM", "GME"].map((symbol, index) => (
              <PerpsRow key={symbol} symbol={symbol} pair={symbol} meta={`$${(568 - index * 92).toFixed(2)}M Vol · ${index === 1 ? "10" : "20"}x`} price={["$58.652", "$400.23", "$56.813", "$22.554"][index]} change={["+0.10%", "+8.29%", "+5.32%", "+3.14%"][index]} onPress={() => setSheet(`${symbol} trade ticket`)} />
            ))}
          </View>
        </View>
      </AppScreen>
      <View style={{ position: "absolute", left: 18, right: 18, bottom: 112, flexDirection: "row", gap: 12 }}>
        <Pressable onPress={() => setSheet("Long order ticket")} style={{ flex: 1, height: 50, borderRadius: 25, backgroundColor: "#0aa84f", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }}>Long ↗</Text>
        </Pressable>
        <Pressable onPress={() => setSheet("Short order ticket")} style={{ flex: 1, height: 50, borderRadius: 25, backgroundColor: "#c8122f", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }}>Short ↘</Text>
        </Pressable>
      </View>
      <SheetModal visible={!!sheet} title={sheet ?? ""} subtitle="Perps action is connected." onClose={() => setSheet(null)}>
        <Pressable onPress={() => setSheet(null)} style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Done</Text>
        </Pressable>
      </SheetModal>
    </View>
  );
}

function PerpsRow({ symbol, pair, meta, price, change, onPress }: { symbol: string; pair: string; meta: string; price: string; change: string; onPress: () => void }) {
  return (
    <View style={{ minHeight: 112, gap: 10 }}>
      <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <TokenAvatar symbol={symbol} network="PERP" size={54} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#202124", fontSize: 20, fontWeight: "900" }}>{pair}</Text>
          <Text numberOfLines={1} style={{ color: "#6d6d72", fontSize: 15 }}>{meta}</Text>
        </View>
        <Text style={{ color: "#18a957", fontSize: 34, width: 70 }}>⌁</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#202124", fontSize: 20, fontWeight: "900" }}>{price}</Text>
          <Text style={{ color: "#0aa84f", fontSize: 16, fontWeight: "800" }}>{change}</Text>
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: 12, paddingLeft: 68 }}>
        <Pressable onPress={onPress} style={{ flex: 1, height: 38, borderRadius: 19, backgroundColor: "#0aa84f", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>Long ↑</Text>
        </Pressable>
        <Pressable onPress={onPress} style={{ flex: 1, height: 38, borderRadius: 19, backgroundColor: "#cf3030", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>Short ↓</Text>
        </Pressable>
      </View>
    </View>
  );
}
