import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppScreen, SearchInput, SheetModal, TokenAvatar } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const chips = ["BTC", "ETH", "SOL", "BNB", "TRX", "ARB", "TWT"];
const popularRows = [
  { symbol: "BTC", name: "Bitcoin", network: "", address: "bc1q7×2...rpg34e" },
  { symbol: "ETH", name: "Ethereum", network: "", address: "0x93d7E...087A15" },
  { symbol: "SOL", name: "Solana", network: "", address: "7zwDZqJ...TCjtGS" },
  { symbol: "TWT", name: "BNB Smart Chain", network: "BNB", address: "0x93d7E...087A15" },
  { symbol: "BNB", name: "BNB Smart Chain", network: "", address: "0x93d7E...087A15" },
  { symbol: "USDT", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "USDC", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
];
const allRows = [
  { symbol: "CRCLon", name: "Solana", network: "SOL", address: "9Zq7k...56mR2" },
  { symbol: "WLFI", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "XRP", name: "BNB Smart Chain", network: "BNB", address: "0x93d7E...087A15" },
  { symbol: "PRL", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "QUQ", name: "Solana", network: "SOL", address: "7zwDZqJ...TCjtGS" },
  { symbol: "STABLE", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "KOGE", name: "BNB Smart Chain", network: "BNB", address: "0x93d7E...087A15" },
  { symbol: "RAVE", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "BBTC", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "FF", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "EURCV", name: "Ethereum", network: "ETH", address: "0x93d7E...087A15" },
  { symbol: "SOON", name: "BNB Smart Chain", network: "BNB", address: "0x93d7E...087A15" },
  { symbol: "SIREN", name: "BNB Smart Chain", network: "BNB", address: "0x93d7E...087A15" },
];

export default function ReceiveScreen() {
  const { theme } = useAppContext();
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [networkPanel, setNetworkPanel] = useState(false);
  const { networkOptions } = useAppContext();
  const filteredPopular = popularRows.filter((row) => matches(row, query, activeFilter));
  const filteredAll = allRows.filter((row) => matches(row, query, activeFilter));

  if (detail) {
    return <ReceiveDetail onBack={() => setDetail(false)} />;
  }

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <FlowHeader title="Receive" />
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingTop: 14, paddingBottom: 6 }}>
          <NetworkChip label="All" active={activeFilter === "All"} onPress={() => setActiveFilter("All")} />
          {chips.map((symbol) => (
            <SquareToken key={symbol} symbol={symbol} active={activeFilter === symbol} onPress={() => setActiveFilter(symbol)} />
          ))}
          <NetworkChip label="112" active={networkPanel} onPress={() => setNetworkPanel(true)} />
        </ScrollView>

        {filteredPopular.length ? <Text style={{ color: theme.secondary, fontSize: 17, fontWeight: "900", marginTop: 4 }}>Popular</Text> : null}
        <View style={{ gap: 10 }}>
          {filteredPopular.map((row) => (
            <ReceiveRow key={`${row.symbol}-${row.name}`} {...row} onPress={row.symbol === "BTC" ? () => setDetail(true) : undefined} onQr={() => setDetail(true)} onCopy={() => setSheet(`${row.symbol} address copied`)} />
          ))}
        </View>

        <Text style={{ color: theme.secondary, fontSize: 17, fontWeight: "900", marginTop: 10 }}>{query || activeFilter !== "All" ? "Results" : "All crypto"}</Text>
        <View style={{ gap: 10 }}>
          {filteredAll.map((row) => (
            <ReceiveRow key={`${row.symbol}-${row.name}`} {...row} onQr={() => setDetail(true)} onCopy={() => setSheet(`${row.symbol} address copied`)} />
          ))}
        </View>
        {!filteredPopular.length && !filteredAll.length ? (
          <View style={{ minHeight: 240, alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Text style={{ color: theme.secondary, fontSize: 18, fontWeight: "900" }}>No results found</Text>
            <Pressable onPress={() => router.push("/fund")}>
              <Text style={{ color: theme.blue, fontSize: 17, fontWeight: "900" }}>Buy Cryptocurrency</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      </AppScreen>
      {networkPanel ? (
        <Pressable onPress={() => setNetworkPanel(false)} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.18)", alignItems: "flex-end" }}>
          <Pressable style={{ width: 270, maxHeight: "100%", backgroundColor: "#ffffff", paddingTop: 78, paddingHorizontal: 16, gap: 14, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>Select network</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 28 }}>
              {networkOptions.map((network) => (
                <Pressable key={network.id} onPress={() => { setActiveFilter(network.symbol === "TRX" ? "TRX" : network.symbol); setNetworkPanel(false); }} style={{ minHeight: 46, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <TokenAvatar symbol={network.symbol} size={34} />
                  <Text numberOfLines={1} style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "900" }}>{network.name}</Text>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: activeFilter === network.symbol ? theme.blue : theme.secondary }}>
                    {activeFilter === network.symbol ? <View style={{ flex: 1, margin: 3, borderRadius: 6, backgroundColor: theme.blue }} /> : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      ) : null}
      <SheetModal visible={!!sheet} title={sheet ?? ""} subtitle="Receive action completed." onClose={() => setSheet(null)}>
        <Pressable onPress={() => setSheet(null)} style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Done</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function matches(row: { symbol: string; name: string; network?: string }, query: string, activeFilter: string) {
  const term = query.trim().toLowerCase();
  const inFilter = activeFilter === "All" || row.symbol === activeFilter || row.network === activeFilter;
  const inSearch = !term || row.symbol.toLowerCase().includes(term) || row.name.toLowerCase().includes(term);
  return inFilter && inSearch;
}

function ReceiveDetail({ onBack }: { onBack: () => void }) {
  const { theme } = useAppContext();

  return (
    <AppScreen scrollable={false} padded={false}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <View style={{ height: 74, alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={onBack} style={{ position: "absolute", left: 0, width: 48, height: 48, justifyContent: "center" }}>
            <Text style={{ color: theme.secondary, fontSize: 38 }}>‹</Text>
          </Pressable>
          <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Receive</Text>
          <Text style={{ position: "absolute", right: 6, color: theme.secondary, fontSize: 24, fontWeight: "900" }}>ⓘ</Text>
        </View>

        <View style={{ minHeight: 76, borderRadius: 12, backgroundColor: "#f6ecd7", padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <Text style={{ color: "#c8950d", fontSize: 17, fontWeight: "900" }}>ⓘ</Text>
          <Text style={{ flex: 1, color: theme.text, fontSize: 16, lineHeight: 23 }}>
            Only send <Text style={{ fontWeight: "900" }}>Bitcoin (BTC)</Text> assets to this address. Other assets will be lost forever.
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 34 }}>
            <TokenAvatar symbol="BTC" size={28} />
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>BTC</Text>
            <View style={{ borderRadius: 999, backgroundColor: "#b9b9ba", paddingHorizontal: 9, paddingVertical: 3 }}>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}>COIN</Text>
            </View>
          </View>
          <View style={{ width: 256, height: 256, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#000", fontSize: 210, lineHeight: 220 }}>▦</Text>
            <View style={{ position: "absolute", width: 36, height: 36, borderRadius: 18, backgroundColor: theme.text }} />
          </View>
          <Text style={{ color: theme.secondary, fontSize: 18, fontWeight: "900", textAlign: "center", marginTop: 18, lineHeight: 24 }}>
            bc1q7×2zxqde6ra96qqtalxvfmzgce{"\n"}m9hphsrpg34e
          </Text>

          <View style={{ flexDirection: "row", gap: 42, marginTop: 42 }}>
            <DetailAction icon="▣" label="Copy" />
            <DetailAction icon="#" label="Set Amount" />
            <DetailAction icon="↗" label="Share" />
          </View>
        </View>

        <View style={{ minHeight: 92, borderRadius: 16, backgroundColor: theme.surface, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 18, marginBottom: 24 }}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.blue, fontSize: 28 }}>↓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 21, fontWeight: "900" }}>Deposit from exchange</Text>
            <Text style={{ color: theme.secondary, fontSize: 16 }}>By direct transfer from your account</Text>
          </View>
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

function ReceiveRow({ symbol, name, network, address, onPress, onQr, onCopy }: { symbol: string; name: string; network?: string; address: string; onPress?: () => void; onQr: () => void; onCopy: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 76, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <TokenAvatar symbol={symbol} network={network} size={54} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{symbol}</Text>
          <View style={{ maxWidth: 142, borderRadius: 999, backgroundColor: theme.surface, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text numberOfLines={1} style={{ color: theme.text, fontSize: 12, fontWeight: "900" }}>{name}</Text>
          </View>
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={{ color: theme.secondary, fontSize: 17, fontWeight: "800" }}>{address}</Text>
      </View>
      <RoundAction label="⌘" onPress={onQr} />
      <RoundAction label="▣" onPress={onCopy} />
    </Pressable>
  );
}

function RoundAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#f7f7f9", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#66686d", fontSize: 26, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function DetailAction({ icon, label }: { icon: string; label: string }) {
  const { theme } = useAppContext();

  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: "900" }}>{icon}</Text>
      </View>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}
