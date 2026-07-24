import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { memeRushDirectory, type MemeRushDefinition } from "@/data/secondary-flows";

type RushTab = "Graduated" | "Graduating" | "New";
const tabs: RushTab[] = ["Graduated", "Graduating", "New"];

export default function MemeRushScreen() {
  const { theme } = useAppContext();
  const [tab, setTab] = useState<RushTab>("Graduated");
  const [introOpen, setIntroOpen] = useState(true);
  const [selected, setSelected] = useState<MemeRushDefinition | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const entries = useMemo(() => memeRushDirectory.filter((item) => {
    if (!["tst", "broccoli", "why"].includes(item.id)) return false;
    if (tab === "Graduated") return item.stage === "Migrated";
    if (tab === "Graduating") return item.stage === "Finalizing" || item.stage === "Fair Mode";
    return item.stage === "New";
  }), [tab]);

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <View style={{ height: 54, alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={25} /></Pressable>
            <Text style={{ color: theme.text, fontSize: 21, fontWeight: "900" }}>Meme Rush</Text>
          </View>

          <View style={{ flexDirection: "row" }}>
            {tabs.map((item) => <Pressable key={item} onPress={() => setTab(item)} style={{ flex: 1, minHeight: 45, borderBottomWidth: tab === item ? 3 : 0, borderBottomColor: theme.blue, alignItems: "center", justifyContent: "center" }}><Text style={{ color: tab === item ? theme.text : theme.secondary, fontSize: 16, fontWeight: "900" }}>{item}</Text></Pressable>)}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12 }}>
            <FilterChip label="Launchpads" onPress={() => setFilterOpen(true)} />
            <FilterChip label="Market cap" icon="arrow-down" onPress={() => setFilterOpen(true)} />
            <FilterChip label="5 USD" icon="plus-circle-outline" onPress={() => setIntroOpen(true)} />
          </ScrollView>

          <View style={{ gap: 2 }}>
            {entries.map((entry) => <MemeRow key={entry.id} entry={entry} onPress={() => setSelected(entry)} />)}
          </View>

          {!entries.length ? <View style={{ minHeight: 260, alignItems: "center", justifyContent: "center", gap: 9 }}><TrustIcon color={theme.secondary} name="rocket-launch-outline" size={40} /><Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>No verified tokens in this stage</Text></View> : null}

          <View style={{ borderRadius: 17, backgroundColor: "#fff1bd", padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 }}><TrustIcon color="#9a6800" name="alert-circle-outline" size={21} /><Text style={{ flex: 1, color: "#7a4f00", fontSize: 12, lineHeight: 18 }}>Meme tokens can be fun but also volatile. Always do your own research and trade carefully.</Text></View>
        </View>
      </AppScreen>

      <SheetModal visible={introOpen} title="Default amount" subtitle="By proceeding, you accept the default 5.00 USD equivalent quick-buy amount." onClose={() => setIntroOpen(false)}>
        <View style={{ borderRadius: 17, backgroundColor: theme.background, padding: 15, flexDirection: "row", gap: 11 }}><TrustIcon color={theme.blue} name="information-outline" size={23} /><Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>Quick buying is unavailable on Testnet. Review current market information before continuing.</Text></View>
        <PrimaryButton label="Got it" onPress={() => setIntroOpen(false)} />
      </SheetModal>

      <SheetModal visible={filterOpen} title="Meme Rush filters" subtitle="Provider selection and sort controls" onClose={() => setFilterOpen(false)}>
        <Choice label="All launchpads" selected />
        <Choice label="Market cap: high to low" selected />
        <PrimaryButton label="Done" onPress={() => setFilterOpen(false)} />
      </SheetModal>

      <SheetModal visible={Boolean(selected)} title={selected ? `${selected.name} (${selected.symbol})` : "Meme token"} subtitle="Provider data unavailable" onClose={() => setSelected(null)}>
        {selected ? <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 15, flexDirection: "row", alignItems: "center", gap: 12 }}><TokenLogo network="BNB" symbol={selected.symbol} size={50} /><View style={{ flex: 1, gap: 4 }}><Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{selected.name}</Text><Text style={{ color: theme.secondary, fontSize: 13 }}>Price, change, holders, and market cap unavailable</Text></View></View> : null}
        <View style={{ borderRadius: 16, backgroundColor: "#fff7dd", padding: 14, flexDirection: "row", gap: 10 }}><TrustIcon color="#9a6800" name="shield-alert-outline" size={23} /><Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>No live Four.Meme market contract is configured, so this screen never presents recorded historical values as current.</Text></View>
        <PrimaryButton label="Close" onPress={() => setSelected(null)} />
      </SheetModal>
    </>
  );
}

function FilterChip({ label, icon = "menu-down", onPress }: { label: string; icon?: "menu-down" | "arrow-down" | "plus-circle-outline"; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 38, borderRadius: 19, backgroundColor: "#f1f1f3", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5 }}><Text style={{ color: "#5f6065", fontSize: 13, fontWeight: "800" }}>{label}</Text><TrustIcon color="#5f6065" name={icon} size={17} /></Pressable>;
}

function MemeRow({ entry, onPress }: { entry: MemeRushDefinition; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 74, flexDirection: "row", alignItems: "center", gap: 12 }}><TokenLogo network="BNB" symbol={entry.symbol} size={50} /><View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={{ color: "#202124", fontSize: 16, fontWeight: "900" }}>{entry.name}</Text><Text style={{ color: "#6d6d72", fontSize: 12 }}>{entry.symbol} on Four.Meme</Text></View><View style={{ alignItems: "flex-end", gap: 3 }}><Text style={{ color: "#202124", fontSize: 14, fontWeight: "800" }}>Unavailable</Text><Text style={{ color: "#77777b", fontSize: 12 }}>Live provider needed</Text></View></Pressable>;
}

function Choice({ label, selected }: { label: string; selected: boolean }) {
  return <View style={{ minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Text style={{ color: "#202124", fontSize: 16, fontWeight: "800" }}>{label}</Text><TrustIcon color={selected ? "#0500ff" : "#77777b"} name={selected ? "radiobox-marked" : "radiobox-blank"} size={24} /></View>;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ height: 54, borderRadius: 27, backgroundColor: "#0500ff", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>{label}</Text></Pressable>;
}
