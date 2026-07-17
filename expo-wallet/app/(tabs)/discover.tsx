import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const categories = ["Featured", "DEX", "Lending", "Yield", "Staking", "Predictions", "NFTs", "Games", "AI and Bots", "Misc"];
const dapps = [
  { name: "B.AI", description: "B.AI is a financial infrastructure built for the AI Agent economy.", tone: ["#ffffff", "#eeeeef"] as const },
  { name: "Lido", description: "Liquid staking for Ethereum and Polygon. Daily staking rewards.", tone: ["#9de9ff", "#ffc78f"] as const },
  { name: "Aave", description: "Aave is an Open Source and Non-Custodial protocol for lending.", tone: ["#8f86ff", "#a6a0ff"] as const },
  { name: "Uniswap", description: "Swap, earn, and build on the leading decentralized exchange.", tone: ["#ff0a8c", "#ff4aa8"] as const },
  { name: "PancakeSwap", description: "Trade. Earn. Win. NFT.", tone: ["#40d9e5", "#8af2ff"] as const },
  { name: "Pendle", description: "Trade future yield and discover fixed-rate opportunities.", tone: ["#1ee7b7", "#a7f3d0"] as const },
];

export default function DiscoverScreen() {
  const { theme } = useAppContext();
  const [activeCategory, setActiveCategory] = useState("Featured");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<string | null>(null);
  const visibleDapps = useMemo(() => {
    const source = activeCategory === "Featured" ? dapps : dapps.filter((item) => item.name.toLowerCase().includes(activeCategory.toLowerCase().slice(0, 3))).length
      ? dapps.filter((item) => item.name.toLowerCase().includes(activeCategory.toLowerCase().slice(0, 3)))
      : dapps.slice(0, 3);
    const term = query.trim().toLowerCase();
    return term ? source.filter((item) => item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term)) : source;
  }, [activeCategory, query]);

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <View style={{ height: 46, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Discover</Text>
          </View>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Search or enter dApp URL" />

          <View style={{ gap: 10 }}>
            <Pressable onPress={() => setSheet("Explore dApps")} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>Explore dApps</Text>
              <Text style={{ color: theme.secondary, fontSize: 32 }}>›</Text>
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {categories.map((category) => {
                const active = category === activeCategory;
                return (
                  <Pressable key={category} onPress={() => setActiveCategory(category)} style={{ minHeight: 40, borderRadius: 20, backgroundColor: active ? "#ffffff" : theme.surface, borderWidth: active ? 3 : 0, borderColor: theme.blue, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: active ? theme.blue : theme.secondary, fontSize: 17, fontWeight: "900" }}>{category}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ gap: 8 }}>
              {visibleDapps.map((item) => (
                <DappRow key={item.name} {...item} onPress={() => setSheet(item.name)} />
              ))}
            </View>
            <Pressable onPress={() => setSheet("All dApps")} style={{ alignSelf: "center", minHeight: 44, borderRadius: 22, backgroundColor: theme.surface, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>View all</Text>
              <Text style={{ color: theme.text, fontSize: 26 }}>›</Text>
            </Pressable>
          </View>

          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900", marginTop: 8 }}>Quick links</Text>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <QuickCard eyebrow="Earn" title="Staking" action="Deposit now" icon="♧" onPress={() => router.push("/perps")} />
            <QuickCard eyebrow="Rewards" title="Level up" action="Begin" icon="◒" onPress={() => router.push("/settings")} />
          </View>
          {["Trust Wallet website", "Help Center", "Use dApp securely for your apps", "What is DeFi?", "What is Token Approval?"].map((item, index) => (
            <Pressable key={item} onPress={() => setSheet(item)} style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 18 }}>
              <Text style={{ width: 30, color: theme.secondary, fontSize: 24 }}>{index < 2 ? (index === 0 ? "◎" : "☊") : "?"}</Text>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </AppScreen>

      <SheetModal visible={!!sheet} title={sheet ?? ""} subtitle="This option is connected in the demo flow." onClose={() => setSheet(null)}>
        <Pressable onPress={() => setSheet(null)} style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Done</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function DappRow({ name, description, tone, onPress }: { name: string; description: string; tone: readonly [string, string]; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <LinearGradient colors={tone} style={{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 8, borderColor: "#eeeeef" }}>
        <Text style={{ color: "#202124", fontSize: 24, fontWeight: "900" }}>{name.slice(0, 1)}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#202124", fontSize: 18, fontWeight: "900" }}>{name}</Text>
        <Text numberOfLines={1} style={{ color: "#6d6d72", fontSize: 16 }}>{description}</Text>
      </View>
    </Pressable>
  );
}

function QuickCard({ eyebrow, title, action, icon, onPress }: { eyebrow: string; title: string; action: string; icon: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, minHeight: 132, borderRadius: 16, backgroundColor: "#f4f4f7", padding: 18, gap: 8 }}>
      <Text style={{ color: "#6d6d72", fontSize: 15, fontWeight: "800" }}>{eyebrow}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: "#202124", fontSize: 22, fontWeight: "900" }}>{title}</Text>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#d9f5e2", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#0aa84f", fontSize: 28 }}>{icon}</Text>
        </View>
      </View>
      <Text style={{ color: "#0500ff", fontSize: 16, fontWeight: "900" }}>{action}</Text>
    </Pressable>
  );
}
