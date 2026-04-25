import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SearchInput, SectionHeader } from "@/components/trust-ui";

export default function DiscoverScreen() {
  const { dappCategories, favoriteDapps, toggleFavoriteDapp, theme } = useAppContext();
  const categories = Object.keys(dappCategories);
  const [category, setCategory] = useState(categories[0] || "Featured");
  const [query, setQuery] = useState("");

  const visibleDapps = useMemo(() => {
    return (dappCategories[category] || []).filter((item) => {
      const haystack = `${item.name} ${item.description}`.toLowerCase();
      return query ? haystack.includes(query.toLowerCase()) : true;
    });
  }, [category, dappCategories, query]);

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 18, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 28, height: 34, borderRadius: 12, backgroundColor: "#e4dbcb", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontSize: 16 }}>🛡</Text>
            </View>
            <View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Premium</Text>
              <Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>Level up</Text>
            </View>
          </View>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>Discover</Text>
          <Pressable onPress={() => router.push("/dapp-browser")}>
            <Text style={{ color: theme.secondary, fontSize: 26 }}>⋮</Text>
          </Pressable>
        </View>

        <SearchInput value={query} onChangeText={setQuery} placeholder="Search or enter dApp URL" />

        <LinearGradient colors={["#dfe7ff", "#f8fbff", "#f7f0ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 16, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: theme.blue, fontSize: 22, fontWeight: "900" }}>Trust Premium</Text>
            <Text style={{ color: theme.text, fontSize: 15, lineHeight: 20, fontWeight: "700" }}>Earn XP and lock TWT for exclusive rewards & benefits</Text>
            <Pressable onPress={() => router.push("/rewards")} style={{ marginTop: 6, alignSelf: "flex-start", minHeight: 30, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#7fd3ff", borderWidth: 1, borderColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: theme.blue, fontSize: 12, fontWeight: "900" }}>EARN NOW</Text>
            </Pressable>
          </View>
          <PremiumCrystalArt />
        </LinearGradient>

        <View style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View style={{ width: 22, height: 4, borderRadius: 999, backgroundColor: "#17191f" }} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#d3d5da" }} />
          </View>
        </View>

        <SectionHeader title="Earn" actionLabel="›" onPress={() => router.push("/rewards")} />
        <Card muted>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>My earn portfolio</Text>
          <Text style={{ color: theme.text, fontSize: 34, fontWeight: "900" }}>$0.00</Text>
        </Card>

        <SectionHeader title="Explore dApps" />
        <Card muted>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 24, paddingBottom: 8 }}>
            {categories.slice(0, 6).map((item) => (
              <DiscoverCategoryTab key={item} label={item} active={item === category} onPress={() => setCategory(item)} />
            ))}
          </ScrollView>

          <View style={{ gap: 2 }}>
            {visibleDapps.slice(0, 3).map((item, index) => (
              <Pressable key={item.name} onPress={() => toggleFavoriteDapp(item.name)} style={{ minHeight: 78, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, borderBottomWidth: index === 2 ? 0 : 1, borderBottomColor: theme.border }}>
                <Text style={{ width: 16, color: theme.text, fontSize: 16 }}>{index + 1}</Text>
                <DappLogo name={item.name} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{item.name}</Text>
                  <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 14 }}>{item.description}</Text>
                </View>
                <Text style={{ color: favoriteDapps.includes(item.name) ? theme.blue : theme.secondary, fontSize: 18 }}>{favoriteDapps.includes(item.name) ? "♥" : "♡"}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => router.push("/dapp-browser")} style={{ minHeight: 44, alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderTopColor: theme.border, marginTop: 8 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>View all ›</Text>
          </Pressable>
        </Card>

        <SectionHeader title="Latest" />
        <View style={{ gap: 12 }}>
          {visibleDapps.slice(0, 2).map((item) => (
            <Card key={`${item.category}-${item.name}`}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <DappLogo name={item.name} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{item.name}</Text>
                  <Text style={{ color: theme.secondary, fontSize: 14 }}>{item.network} · {item.category}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

function DiscoverCategoryTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingBottom: 8, borderBottomWidth: 4, borderBottomColor: active ? "#0500e8" : "transparent" }}>
      <Text style={{ color: active ? "#16181f" : "#70757f", fontSize: 17, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function PremiumCrystalArt() {
  return (
    <View style={{ width: 102, height: 86, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient colors={["#1a1a1f", "#f2ca55", "#fff4a8"]} style={{ width: 22, height: 52, borderRadius: 6, transform: [{ rotate: "14deg" }], position: "absolute", right: 30, bottom: 12 }} />
      <LinearGradient colors={["#0d0e14", "#f5d65a", "#fff1ad"]} style={{ width: 34, height: 62, borderRadius: 8, transform: [{ rotate: "-18deg" }], position: "absolute", right: 6, bottom: 8 }} />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#111", position: "absolute", left: 10, top: 22 }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#5741ff", position: "absolute", left: 30, top: 12 }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#111", position: "absolute", left: 44, top: 28 }} />
    </View>
  );
}

function DappLogo({ name }: { name: string }) {
  const palettes: Record<string, [string, string]> = {
    Aave: ["#a95fff", "#5fd5dd"],
    Aster: ["#111", "#f0cd8b"],
    Four: ["#0a0d12", "#63ffb8"],
    Raydium: ["#4736ff", "#5be3d4"],
    Jito: ["#111", "#8df0ff"],
    "Pump.Fun": ["#0a0d12", "#8fff66"],
  };
  const [start, end] = palettes[name] || ["#d9dcff", "#8ec9ff"];

  return (
    <LinearGradient colors={[start, end]} style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>{name.slice(0, 1)}</Text>
    </LinearGradient>
  );
}
