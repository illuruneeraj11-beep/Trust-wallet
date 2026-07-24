import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { TrustIcon } from "@/components/trust-icon";
import { ProviderBadge } from "@/components/secondary-flow-ui";
import { predictionDirectory, type PredictionDefinition, type PredictionProvider } from "@/data/secondary-flows";
import { useAppContext } from "@/context/app-context";

const categories = ["Trending", "Crypto", "Sports", "Politics"] as const;
type PredictionCategory = (typeof categories)[number];

export default function PredictionsScreen() {
  const { theme } = useAppContext();
  const [category, setCategory] = useState<PredictionCategory>("Trending");
  const [provider, setProvider] = useState<PredictionProvider | "All">("All");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [providerSheet, setProviderSheet] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selected, setSelected] = useState<PredictionDefinition | null>(null);
  const [restricted, setRestricted] = useState(true);
  const [restrictionSheet, setRestrictionSheet] = useState(true);

  const markets = useMemo(() => {
    const term = query.trim().toLowerCase();
    return predictionDirectory.filter((market) => {
      const categoryMatches = category === "Trending" ? true : market.category === category;
      const providerMatches = provider === "All" || market.provider === provider;
      const queryMatches = !term || `${market.title} ${market.provider} ${market.network}`.toLowerCase().includes(term);
      return categoryMatches && providerMatches && queryMatches;
    });
  }, [category, provider, query]);

  if (restricted) {
    return (
      <>
        <AppScreen scrollable={false} padded={false}>
          <View style={{ flex: 1, paddingHorizontal: 16, gap: 13 }}>
            <View style={{ height: 58, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute", left: 0, flexDirection: "row", gap: 8 }}>
                <HeaderButton icon="arrow-left" onPress={() => router.back()} />
                <HeaderButton icon="account-outline" onPress={() => setRestrictionSheet(true)} />
              </View>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800" }}>Predictions</Text>
              <View style={{ position: "absolute", right: 0 }}><HeaderButton icon="information-outline" onPress={() => setRestrictionSheet(true)} /></View>
            </View>
            <Pressable onPress={() => setRestrictionSheet(true)} style={{ minHeight: 42, borderRadius: 15, backgroundColor: "#fff1bd", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TrustIcon color={theme.secondary} name="information-outline" size={17} />
              <Text style={{ flex: 1, color: theme.text, fontSize: 13 }}>Predictions are not available in your country</Text>
            </Pressable>
            <View style={{ flex: 1, backgroundColor: "#f4f4f5", marginHorizontal: -16 }} />
          </View>
        </AppScreen>
        <SheetModal visible={restrictionSheet} title="Access restricted" subtitle="Prediction markets are unavailable in this recorded regional state." onClose={() => setRestrictionSheet(false)}>
          <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 11 }}>
            <TrustIcon color="#a56d00" name="map-marker-alert-outline" size={24} />
            <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>Availability is determined by each provider and local regulations. This simulation never bypasses regional eligibility.</Text>
          </View>
          <Pressable onPress={() => router.push({ pathname: "/dapp-browser", params: { name: "Unsupported regions", url: "https://trustwallet.com/blog/announcements/hyperliquid-hip-4-outcome-contracts-now-live-on-trust-wallet" } })} style={{ minHeight: 46, alignItems: "center", justifyContent: "center" }}><Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>View unsupported regions information</Text></Pressable>
          <Pressable onPress={() => setRestrictionSheet(false)} style={{ height: 54, borderRadius: 27, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>Ok, got it</Text></Pressable>
          <Pressable onPress={() => { setRestrictionSheet(false); setRestricted(false); }} style={{ height: 48, alignItems: "center", justifyContent: "center" }}><Text style={{ color: theme.secondary, fontSize: 13, fontWeight: "800" }}>View provider directory</Text></Pressable>
        </SheetModal>
      </>
    );
  }

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 15 }}>
          {searchOpen ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}><SearchInput value={query} onChangeText={setQuery} placeholder="Search prediction markets" /></View>
              <HeaderButton icon="close" onPress={() => { setSearchOpen(false); setQuery(""); }} />
            </View>
          ) : (
            <View style={{ height: 48, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute", left: 0 }}><HeaderButton icon="arrow-left" onPress={() => router.back()} /></View>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800" }}>Predictions</Text>
              <View style={{ position: "absolute", right: 0, flexDirection: "row", gap: 7 }}>
                <HeaderButton icon="magnify" onPress={() => setSearchOpen(true)} />
                <HeaderButton icon="information-outline" onPress={() => setInfoOpen(true)} />
              </View>
            </View>
          )}

          <View style={{ borderRadius: 17, backgroundColor: "#f3f3f6", padding: 13, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TrustIcon color={theme.blue} name="eye-outline" size={22} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800" }}>Market information</Text>
              <Text style={{ color: theme.secondary, fontSize: 12, lineHeight: 17 }}>Market access varies by provider and region.</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingRight: 10 }}>
            {categories.map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={{ minHeight: 39, borderRadius: 20, backgroundColor: category === item ? "#d2d2d8" : theme.surface, paddingHorizontal: 17, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: category === item ? theme.text : theme.secondary, fontSize: 15, fontWeight: "800" }}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable onPress={() => setProviderSheet(true)} style={{ minHeight: 36, borderRadius: 18, backgroundColor: theme.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 }}>
              {provider === "All" ? <TrustIcon color={theme.secondary} name="layers-outline" size={18} /> : <ProviderBadge compact provider={provider} />}
              <Text style={{ color: theme.secondary, fontSize: 13, fontWeight: "700" }}>{provider === "All" ? "All providers" : provider}</Text>
              <TrustIcon color={theme.secondary} name="menu-down" size={18} />
            </Pressable>
            <Text style={{ color: theme.secondary, fontSize: 12 }}>{markets.length} markets</Text>
          </View>

          <View style={{ gap: 12 }}>
            {markets.map((market) => <PredictionCard key={market.id} market={market} onPress={() => setSelected(market)} />)}
          </View>

          {!markets.length ? (
            <View style={{ paddingVertical: 70, alignItems: "center", gap: 10 }}>
              <TrustIcon color={theme.secondary} name="chart-timeline-variant" size={40} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>No matching markets</Text>
              <Text style={{ color: theme.secondary, fontSize: 14 }}>Try another category or provider.</Text>
            </View>
          ) : null}

          <Text style={{ color: theme.secondary, fontSize: 11, lineHeight: 17, textAlign: "center", paddingHorizontal: 10 }}>
            Outcome markets are speculative and can lose their full value. Providers operate market pricing and resolution.
          </Text>
        </View>
      </AppScreen>

      <SheetModal visible={providerSheet} title="Prediction providers" subtitle="Availability is determined by each provider" onClose={() => setProviderSheet(false)}>
        {(["All", "Hyperliquid", "Polymarket", "Predict.fun", "Myriad"] as const).map((item) => (
          <Pressable key={item} onPress={() => { setProvider(item); setProviderSheet(false); }} style={{ minHeight: 55, flexDirection: "row", alignItems: "center", gap: 12 }}>
            {item === "All" ? <View style={{ width: 28, alignItems: "center" }}><TrustIcon color={theme.secondary} name="layers-outline" size={22} /></View> : <ProviderBadge provider={item} />}
            <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "700" }}>{item === "All" ? "All providers" : item}</Text>
            <TrustIcon color={provider === item ? theme.blue : theme.secondary} name={provider === item ? "radiobox-marked" : "radiobox-blank"} size={24} />
          </Pressable>
        ))}
      </SheetModal>

      <SheetModal visible={infoOpen} title="About Predictions" subtitle="External providers operate every market" onClose={() => setInfoOpen(false)}>
        <InfoRow icon="chart-box-outline" text="Binary and multi-outcome markets can be priced from $0 to $1." />
        <InfoRow icon="shield-account-outline" text="Trust Wallet does not operate pricing, resolution, or regional eligibility." />
        <InfoRow icon="alert-circle-outline" text="An outcome position can lose its full value and is not available in every region." />
        <Pressable onPress={() => setInfoOpen(false)} style={{ height: 52, borderRadius: 26, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>Got it</Text>
        </Pressable>
      </SheetModal>

      <SheetModal visible={!!selected} title={selected?.title ?? "Prediction market"} subtitle="Provider market information" onClose={() => setSelected(null)}>
        {selected ? (
          <View style={{ gap: 12 }}>
            <View style={{ borderRadius: 17, backgroundColor: theme.background, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <ProviderBadge provider={selected.provider} />
              <Text style={{ color: theme.secondary, fontSize: 13 }}>{selected.network}</Text>
            </View>
            <UnavailableMarketData />
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 9 }}>
              <TrustIcon color={theme.secondary} name="map-marker-alert-outline" size={20} />
              <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 18 }}>Trading and wallet signatures are unavailable in this simulation. Regional eligibility is determined by the selected provider.</Text>
            </View>
            <Pressable onPress={() => setSelected(null)} style={{ height: 52, borderRadius: 26, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>Close</Text>
            </Pressable>
          </View>
        ) : null}
      </SheetModal>
    </>
  );
}

function HeaderButton({ icon, onPress }: { icon: "arrow-left" | "magnify" | "close" | "information-outline" | "account-outline"; onPress: () => void }) {
  const accessibilityLabel = icon === "arrow-left" ? "Back"
    : icon === "magnify" ? "Search predictions"
      : icon === "close" ? "Close search"
        : icon === "information-outline" ? "Prediction information"
          : "Regional availability";
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#f2f2f4", alignItems: "center", justifyContent: "center" }}>
      <TrustIcon color="#202124" name={icon} size={23} />
    </Pressable>
  );
}

function PredictionCard({ market, onPress }: { market: PredictionDefinition; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 20, backgroundColor: "#f4f4f7", padding: 15, gap: 13 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <ProviderBadge provider={market.provider} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <TrustIcon color="#6d6d72" name="clock-outline" size={16} />
          <Text style={{ color: "#6d6d72", fontSize: 12, fontWeight: "700" }}>Live close unavailable</Text>
        </View>
      </View>
      <Text style={{ color: "#202124", fontSize: 18, lineHeight: 24, fontWeight: "800" }}>{market.title}</Text>
      <UnavailableMarketData />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: "#6d6d72", fontSize: 12 }}>Live volume unavailable</Text>
        <Text style={{ color: "#6d6d72", fontSize: 12 }}>{market.network}</Text>
      </View>
    </Pressable>
  );
}

function UnavailableMarketData() {
  return (
    <View style={{ minHeight: 42, borderRadius: 21, backgroundColor: "#e9e9ed", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
      <TrustIcon color="#6d6d72" name="chart-timeline-variant" size={18} />
      <Text style={{ color: "#6d6d72", fontSize: 13, fontWeight: "800" }}>Provider quote unavailable</Text>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: "chart-box-outline" | "shield-account-outline" | "alert-circle-outline"; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 11 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0f0f3", alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color="#202124" name={icon} size={21} />
      </View>
      <Text style={{ flex: 1, color: "#6d6d72", fontSize: 13, lineHeight: 19 }}>{text}</Text>
    </View>
  );
}
