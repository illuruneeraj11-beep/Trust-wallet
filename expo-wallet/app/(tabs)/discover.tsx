import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, View } from "react-native";
import { DappLogo } from "@/components/secondary-flow-ui";
import { TrustIcon, type TrustIconName } from "@/components/trust-icon";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { dappCategoryNames, dappDirectory, type DappCategory, type DappDefinition } from "@/data/secondary-flows";

const landingNames = ["Lido", "Aave", "Uniswap", "PancakeSwap", "Pendle"];

export default function DiscoverScreen() {
  const { theme } = useAppContext();
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DappCategory>("Featured");
  const [query, setQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const uniqueDapps = useMemo(() => dappDirectory.filter((item, index, all) => all.findIndex((candidate) => candidate.name === item.name) === index), []);
  const featured = useMemo(() => landingNames.map((name) => uniqueDapps.find((item) => item.name === name)).filter((item): item is DappDefinition => Boolean(item)), [uniqueDapps]);
  const visibleDapps = useMemo(() => {
    const term = query.trim().toLowerCase();
    return uniqueDapps.filter((item) => {
      const categoryMatch = activeCategory === "Featured" || item.category === activeCategory;
      const queryMatch = !term || `${item.name} ${item.description} ${item.network}`.toLowerCase().includes(term);
      return (term || categoryMatch) && queryMatch;
    });
  }, [activeCategory, query, uniqueDapps]);

  useEffect(() => {
    if (!directoryOpen && !infoOpen) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (infoOpen) setInfoOpen(false);
      else {
        setDirectoryOpen(false);
        setQuery("");
      }
      return true;
    });
    return () => subscription.remove();
  }, [directoryOpen, infoOpen]);

  function openDapp(item: DappDefinition) {
    router.push({ pathname: "/dapp-browser", params: { dappId: item.id, name: item.name, url: item.url } });
  }

  if (directoryOpen) {
    return (
      <AppScreen padded={false} withTabBar>
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <View style={{ height: 52, alignItems: "center", justifyContent: "center" }}>
            <Pressable accessibilityLabel="Back to Discover" accessibilityRole="button" onPress={() => { setDirectoryOpen(false); setQuery(""); }} style={{ position: "absolute", left: 0, width: 44, height: 44, justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={27} /></Pressable>
            <Text style={{ color: theme.text, fontSize: 21, fontWeight: "900" }}>Explore dApps</Text>
          </View>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Search dApps" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12 }}>
            {dappCategoryNames.map((category) => (
              <Pressable key={category} onPress={() => { setActiveCategory(category); setQuery(""); }} style={{ minHeight: 39, borderRadius: 20, borderWidth: activeCategory === category && !query ? 2 : 0, borderColor: theme.blue, backgroundColor: theme.surface, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: activeCategory === category && !query ? theme.blue : theme.secondary, fontSize: 14, fontWeight: "900" }}>{category}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ gap: 2 }}>{visibleDapps.map((item) => <DappRow key={item.id} item={item} onPress={() => openDapp(item)} />)}</View>
        </View>
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen padded={false} withTabBar>
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <View style={{ height: 52, alignItems: "center", justifyContent: "center" }}><Text style={{ color: theme.text, fontSize: 21, fontWeight: "900" }}>Discover</Text></View>
          <Pressable onPress={() => setDirectoryOpen(true)} style={{ minHeight: 44, borderRadius: 22, backgroundColor: theme.input, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}><TrustIcon color={theme.secondary} name="magnify" size={19} /><Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "600" }}>Search or enter dApp URL</Text></Pressable>

          <Pressable onPress={() => setInfoOpen(true)} style={{ minHeight: 86, borderRadius: 19, backgroundColor: "#f0efff", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 13 }}>
            <View style={{ width: 49, height: 49, borderRadius: 16, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}><TrustIcon color="#ffffff" name="trophy-outline" size={27} /></View>
            <View style={{ flex: 1, gap: 3 }}><Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Explore Web3 safely</Text><Text style={{ color: theme.secondary, fontSize: 12, lineHeight: 17 }}>Browse featured dApps without connecting a wallet.</Text></View>
            <TrustIcon color={theme.blue} name="chevron-right" size={23} />
          </Pressable>

          <View style={{ gap: 11 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>Explore dApps</Text>
              <Pressable onPress={() => setDirectoryOpen(true)}><Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>View all</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12 }}>
              {dappCategoryNames.map((category) => <Pressable key={category} onPress={() => { setActiveCategory(category); setDirectoryOpen(true); }} style={{ minHeight: 37, borderRadius: 19, backgroundColor: theme.surface, paddingHorizontal: 15, alignItems: "center", justifyContent: "center" }}><Text style={{ color: theme.secondary, fontSize: 13, fontWeight: "800" }}>{category}</Text></Pressable>)}
            </ScrollView>
            <View style={{ gap: 2 }}>{featured.map((item) => <DappRow key={item.id} item={item} onPress={() => openDapp(item)} />)}</View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickCard eyebrow="Earn" title="Staking" action="Deposit now" icon="sprout-outline" onPress={() => { setActiveCategory("Staking"); setDirectoryOpen(true); }} />
            <QuickCard eyebrow="Rewards" title="Level up" action="Begin" icon="medal-outline" onPress={() => router.push("/settings")} />
          </View>

          <View style={{ gap: 1 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900", marginBottom: 4 }}>Quick links</Text>
            <QuickLink icon="web" label="Trust Wallet website" onPress={() => setInfoOpen(true)} />
            <QuickLink icon="headset" label="Help Center" onPress={() => setInfoOpen(true)} />
            <QuickLink icon="shield-check-outline" label="Use dApps securely" onPress={() => setInfoOpen(true)} />
            <QuickLink icon="help-circle-outline" label="What is DeFi?" onPress={() => setInfoOpen(true)} />
            <QuickLink icon="help-circle-outline" label="What is Token Approval?" onPress={() => setInfoOpen(true)} />
          </View>
        </View>
      </AppScreen>

      <SheetModal visible={infoOpen} title="Browse safely" subtitle="Verify the URL and requested permissions before connecting a wallet." onClose={() => setInfoOpen(false)}>
        <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}><TrustIcon color={theme.blue} name="shield-check-outline" size={30} /><Text style={{ flex: 1, color: theme.secondary, fontSize: 14, lineHeight: 20 }}>Reviewed dApps open in read-only mode. This simulation never requests a signature, payment, or recovery phrase.</Text></View>
        <Pressable onPress={() => setInfoOpen(false)} style={{ height: 54, borderRadius: 27, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>Got it</Text></Pressable>
      </SheetModal>
    </>
  );
}

function DappRow({ item, onPress }: { item: DappDefinition; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12 }}><DappLogo name={item.name} uri={item.logoUrl} size={48} /><View style={{ flex: 1, gap: 2 }}><Text style={{ color: "#202124", fontSize: 16, fontWeight: "900" }}>{item.name}</Text><Text numberOfLines={1} style={{ color: "#6d6d72", fontSize: 12 }}>{item.description}</Text></View><TrustIcon color="#a0a0a4" name="chevron-right" size={21} /></Pressable>;
}

function QuickCard({ eyebrow, title, action, icon, onPress }: { eyebrow: string; title: string; action: string; icon: TrustIconName; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ flex: 1, minHeight: 120, borderRadius: 18, backgroundColor: "#f4f4f7", padding: 14, gap: 8 }}><Text style={{ color: "#6d6d72", fontSize: 12, fontWeight: "700" }}>{eyebrow}</Text><View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}><Text style={{ color: "#202124", fontSize: 18, fontWeight: "900" }}>{title}</Text><TrustIcon color="#0aa84f" name={icon} size={25} /></View><Text style={{ color: "#0500ff", fontSize: 13, fontWeight: "900" }}>{action}</Text></Pressable>;
}

function QuickLink({ icon, label, onPress }: { icon: TrustIconName; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 15 }}><TrustIcon color="#6d6d72" name={icon} size={22} /><Text style={{ flex: 1, color: "#202124", fontSize: 15, fontWeight: "800" }}>{label}</Text><TrustIcon color="#a0a0a4" name="chevron-right" size={20} /></Pressable>;
}
