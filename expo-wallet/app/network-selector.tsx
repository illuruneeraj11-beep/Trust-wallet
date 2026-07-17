import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppScreen, SearchInput, TokenAvatar } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const popular = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "BNB", name: "BNB Smart Chain" },
  { symbol: "TRX", name: "Tron" },
  { symbol: "ARB", name: "Arbitrum", network: "ARB" },
  { symbol: "BASE", name: "Base", network: "BASE" },
];
const alphabetic = [
  { symbol: "ACA", name: "Acala" },
  { symbol: "APT", name: "Aptos" },
  { symbol: "AVAX", name: "Avalanche" },
];

export default function NetworkSelectorScreen() {
  const { theme } = useAppContext();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("ALL");

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <FlowHeader title="Select network" />
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search for network" />

        <NetworkRow symbol="ALL" name="All networks" selected={selected === "ALL"} onPress={() => setSelected("ALL")} />
        <Text style={{ color: theme.secondary, fontSize: 17, fontWeight: "900" }}>Popular networks</Text>
        <View style={{ gap: 22 }}>
          {popular.map((network) => (
            <NetworkRow key={network.name} {...network} selected={selected === network.symbol} onPress={() => setSelected(network.symbol)} />
          ))}
        </View>
        <Text style={{ color: theme.secondary, fontSize: 17, fontWeight: "900", marginTop: 8 }}>A-Z networks</Text>
        <View style={{ gap: 22 }}>
          {alphabetic.map((network) => (
            <NetworkRow key={network.name} {...network} selected={selected === network.symbol} onPress={() => setSelected(network.symbol)} />
          ))}
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
        <Text style={{ color: theme.secondary, fontSize: 36 }}>‹</Text>
      </Pressable>
      <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>{title}</Text>
    </View>
  );
}

function NetworkRow({ symbol, name, network, selected, onPress }: { symbol: string; name: string; network?: string; selected?: boolean; onPress: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 18 }}>
      {symbol === "ALL" ? (
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: "#3a3a3e", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.secondary, fontSize: 26 }}>◎</Text>
        </View>
      ) : (
        <TokenAvatar symbol={symbol} network={network} size={54} />
      )}
      <Text style={{ flex: 1, color: theme.text, fontSize: 21, fontWeight: "900" }}>{name}</Text>
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: selected ? 4 : 3, borderColor: selected ? theme.blue : theme.secondary, alignItems: "center", justifyContent: "center" }}>
        {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.blue }} /> : null}
      </View>
    </Pressable>
  );
}
