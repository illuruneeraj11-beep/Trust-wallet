import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppScreen, SearchInput, TokenAvatar } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const filterTokens = ["BTC", "ETH", "SOL", "BNB", "TRX", "ARB", "TWT"];

export default function SendScreen() {
  const { theme } = useAppContext();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <AppScreen scrollable={false} padded={false}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <FlowHeader title="Send" />
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingTop: 22, paddingBottom: 6 }}>
          <NetworkChip label="All" active={activeFilter === "All"} onPress={() => setActiveFilter("All")} />
          {filterTokens.map((symbol) => (
            <SquareToken key={symbol} symbol={symbol} active={activeFilter === symbol} onPress={() => setActiveFilter(symbol)} />
          ))}
        </ScrollView>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 96, gap: 16 }}>
          <View style={{ width: 132, height: 118, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#e4e7eb", fontSize: 84, lineHeight: 90 }}>▧</Text>
            <Text style={{ position: "absolute", left: 4, bottom: 20, color: "#9ba1aa", fontSize: 58 }}>⌕</Text>
          </View>
          <Text style={{ color: theme.secondary, fontSize: 17, fontWeight: "800" }}>No results found</Text>
          <Pressable onPress={() => router.push("/fund")}>
            <Text style={{ color: theme.blue, fontSize: 18, fontWeight: "900" }}>Buy Cryptocurrency</Text>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

function FlowHeader({ title }: { title: string }) {
  const { theme } = useAppContext();

  return (
    <View style={{ height: 74, alignItems: "center", justifyContent: "center" }}>
      <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 48, height: 48, alignItems: "flex-start", justifyContent: "center" }}>
        <Text style={{ color: theme.secondary, fontSize: 38 }}>‹</Text>
      </Pressable>
      <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>{title}</Text>
    </View>
  );
}

function NetworkChip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ width: 52, height: 52, borderRadius: 7, borderWidth: active ? 3 : 0, borderColor: theme.blue, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function SquareToken({ symbol, active, onPress }: { symbol: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 52, height: 52, borderRadius: 7, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: active ? 3 : 0, borderColor: "#0500ff" }}>
      <TokenAvatar symbol={symbol} size={52} />
    </Pressable>
  );
}
