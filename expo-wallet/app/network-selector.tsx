import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { NetworkLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SearchInput } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const networks = [
  "Ethereum",
  "Tron",
  "Bitcoin",
  "BNB Smart Chain",
  "Solana",
  "Base",
  "Robinhood Chain",
  "Polygon",
  "Hyperliquid",
  "Scroll",
  "Blast",
  "Celo",
  "Avalanche C-Chain",
  "OP Mainnet",
  "Arbitrum",
  "Linea",
  "Fantom",
  "TON",
  "zkSync Era",
  "XRP",
  "Aurora",
  "Bitcoin Cash",
  "THORChain",
  "Cosmos",
  "Litecoin",
  "Dogecoin",
  "Sui",
  "Sonic",
  "Plasma",
  "Monad",
  "Zcash",
  "MegaETH",
];

export default function NetworkSelectorScreen() {
  const { theme } = useAppContext();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("All Networks");

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return networks.filter((network) => !term || network.toLowerCase().includes(term));
  }, [query]);

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <View style={{ height: 55, alignItems: "center", justifyContent: "center" }}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 42, height: 42, alignItems: "center", justifyContent: "center" }}>
            <TrustIcon color={theme.secondary} name="arrow-left" size={24} />
          </Pressable>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>Networks</Text>
        </View>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search networks" />

        {!query ? <NetworkRow name="All Networks" selected={selected === "All Networks"} onPress={() => setSelected("All Networks")} /> : null}
        <View style={{ height: 1, width: 36, marginLeft: 16, backgroundColor: theme.border }} />

        <View style={{ gap: 1 }}>
          {rows.map((network) => (
            <NetworkRow key={network} name={network} selected={selected === network} onPress={() => setSelected(network)} />
          ))}
        </View>

        {!rows.length ? (
          <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 9 }}>
            <TrustIcon color={theme.secondary} name="magnify-close" size={34} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>No network found</Text>
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

function NetworkRow({ name, selected, onPress }: { name: string; selected: boolean; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 61, flexDirection: "row", alignItems: "center", gap: 13 }}>
      {name === "All Networks" ? (
        <View style={{ width: 39, height: 39, borderRadius: 10, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
          <TrustIcon color={theme.secondary} name="web" size={21} />
        </View>
      ) : <NetworkLogo network={name} size={39} />}
      <Text numberOfLines={1} style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" }}>{name}</Text>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? theme.blue : theme.secondary, alignItems: "center", justifyContent: "center" }}>
        {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.blue }} /> : null}
      </View>
    </Pressable>
  );
}
