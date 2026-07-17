import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppScreen, SearchInput, TokenAvatar } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const rows = ["BTC", "ETH", "USDT", "USDC", "XRP", "SOL", "BNB", "SUI", "WBTC", "LTC", "AAVE", "ADA"];

export default function DepositBinanceScreen() {
  const { theme } = useAppContext();
  const [query, setQuery] = useState("");
  const visible = rows.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <View style={{ height: 70, alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0 }}><Text style={{ color: theme.secondary, fontSize: 38 }}>‹</Text></Pressable>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>Deposit from Binance</Text>
        </View>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search" />
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {["BTC", "ETH", "BNB", "USDT", "USDC", "SOL"].map((symbol) => (
            <TokenAvatar key={symbol} symbol={symbol} size={34} />
          ))}
        </View>
        <View style={{ gap: 8 }}>
          {visible.map((symbol) => (
            <Pressable key={symbol} onPress={() => router.push("/receive")} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <TokenAvatar symbol={symbol} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{symbol}</Text>
                <Text style={{ color: theme.secondary, fontSize: 14 }}>{symbol === "BTC" ? "Bitcoin" : symbol === "ETH" ? "Ethereum" : "Binance transfer supported"}</Text>
              </View>
              <Text style={{ color: theme.secondary, fontSize: 24 }}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}
