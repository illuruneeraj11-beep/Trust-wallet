import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SettingRow, SheetModal, ToggleRow } from "@/components/trust-ui";
import { currencyOptions, languageOptions } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";

export default function PreferencesScreen() {
  const { currency, dappBrowserEnabled, language, setCurrencyCode, setDappBrowserEnabled, setLanguage, theme } = useAppContext();
  const [sheet, setSheet] = useState<"currency" | "language" | null>(null);
  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <FlowHeader title="Preferences" />
          <SettingRow icon="cash-multiple" title="Currency" subtitle="Fiat values throughout the app" value={currency.code} onPress={() => setSheet("currency")} />
          <SettingRow icon="translate" title="App language" subtitle="Language used by the wallet interface" value={language} onPress={() => setSheet("language")} />
          <ToggleRow icon="compass-outline" title="dApp Browser" subtitle="Show Discover and the embedded browser" valueEnabled={dappBrowserEnabled} onValueChange={setDappBrowserEnabled} />
        </View>
      </AppScreen>

      <SheetModal visible={sheet === "currency"} title="Currency" onClose={() => setSheet(null)}>
        {currencyOptions.map((item) => <Choice key={item.code} active={currency.code === item.code} label={`${item.code} - ${item.label}`} onPress={() => { setCurrencyCode(item.code); setSheet(null); }} />)}
      </SheetModal>
      <SheetModal visible={sheet === "language"} title="App language" onClose={() => setSheet(null)}>
        {languageOptions.map((item) => <Choice key={item} active={language === item} label={item} onPress={() => { setLanguage(item); setSheet(null); }} />)}
      </SheetModal>
    </>
  );
}

function FlowHeader({ title }: { title: string }) {
  const { theme } = useAppContext();
  return <View style={{ height: 55, alignItems: "center", justifyContent: "center" }}><Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 42, height: 42, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={24} /></Pressable><Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{title}</Text></View>;
}

function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return <Pressable onPress={onPress} style={{ minHeight: 54, borderRadius: 15, backgroundColor: theme.cardSecondary, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 }}><Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "800" }}>{label}</Text><View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? theme.blue : theme.secondary, alignItems: "center", justifyContent: "center" }}>{active ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.blue }} /> : null}</View></Pressable>;
}
