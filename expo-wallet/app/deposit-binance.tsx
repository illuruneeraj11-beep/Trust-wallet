import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppScreen, SearchInput } from "@/components/trust-ui";
import { BrandLogo, TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";

const rows = ["BTC", "ETH", "USDT", "USDC", "XRP", "SOL", "BNB", "SUI", "WBTC", "LTC", "AAVE", "ADA"];

export default function DepositBinanceScreen() {
  const { theme } = useAppContext();
  const [query, setQuery] = useState("");
  const visible = rows.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <View style={{ height: 55, alignItems: "center", justifyContent: "center" }}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 42, height: 42, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={24} /></Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}><BrandLogo brand="binance" size={24} /><Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>Deposit from Binance</Text></View>
        </View>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search" />
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {["BTC", "ETH", "BNB", "USDT", "USDC", "SOL"].map((symbol) => (
            <TokenLogo key={symbol} symbol={symbol} size={34} />
          ))}
        </View>
        <View style={{ gap: 8 }}>
          {visible.map((symbol) => (
            <Pressable key={symbol} onPress={() => router.push("/receive")} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <TokenLogo symbol={symbol} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{symbol}</Text>
                <Text style={{ color: theme.secondary, fontSize: 14 }}>{symbol === "BTC" ? "Bitcoin" : symbol === "ETH" ? "Ethereum" : "Binance transfer supported"}</Text>
              </View>
              <TrustIcon color={theme.secondary} name="chevron-right" size={21} />
            </Pressable>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}
