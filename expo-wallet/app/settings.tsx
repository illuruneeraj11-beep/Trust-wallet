import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useAppContext } from "@/context/app-context";
import { AppScreen, SheetModal } from "@/components/trust-ui";

const primaryRows = [
  { icon: "▤", title: "Address Book", route: "/address-book" },
  { icon: "⌘", title: "Sync to Extension", route: "/dapp-browser" },
  { icon: "@", title: "Trust handles", route: "/preferences" },
  { icon: "⌗", title: "Scan QR code", route: "/receive" },
  { icon: "⌁", title: "WalletConnect", route: "/dapp-browser" },
];

const securityRows = [
  { icon: "⚙", title: "Preferences", route: "/preferences" },
  { icon: "▣", title: "Security", route: "/security" },
  { icon: "♧", title: "Notifications" },
];

const socialRows = [
  { icon: "𝕏", title: "X" },
  { icon: "✈", title: "Telegram" },
  { icon: "f", title: "Facebook" },
  { icon: "☻", title: "Reddit" },
  { icon: "▶", title: "Youtube" },
  { icon: "◎", title: "Instagram" },
  { icon: "♪", title: "TikTok" },
];

export default function SettingsScreen() {
  const { theme, themeMode, toggleThemeMode } = useAppContext();
  const [sheet, setSheet] = useState<string | null>(null);

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ height: 74, alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 48, height: 48, justifyContent: "center" }}>
              <Text style={{ color: theme.secondary, fontSize: 38 }}>‹</Text>
            </Pressable>
            <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Settings</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 42 }}>
          <View style={{ paddingHorizontal: 16, gap: 20 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>Trust Premium</Text>
            <View style={{ minHeight: 118, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Text style={{ fontSize: 58 }}>◻</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>Bronze</Text>
                <Text style={{ color: theme.secondary, fontSize: 16 }}>Unlock exclusive rewards</Text>
              </View>
              <View style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>Begin</Text>
              </View>
            </View>

            <View style={{ minHeight: 76, flexDirection: "row", alignItems: "center", gap: 18 }}>
              <Text style={{ width: 44, color: theme.secondary, fontSize: 34 }}>☾</Text>
              <Text style={{ flex: 1, color: theme.text, fontSize: 21, fontWeight: "900" }}>Dark Mode</Text>
              <Switch value={themeMode === "dark"} onValueChange={toggleThemeMode} thumbColor="#fff" trackColor={{ false: "#b9b9ba", true: theme.blue }} />
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 14 }} />
          <View style={{ paddingHorizontal: 16 }}>
            {primaryRows.map((row) => <SettingLine key={row.title} {...row} onFallback={setSheet} />)}
          </View>
          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 14 }} />
          <View style={{ paddingHorizontal: 16 }}>
            {securityRows.map((row) => <SettingLine key={row.title} {...row} onFallback={setSheet} />)}
          </View>
          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 14 }} />
          <View style={{ paddingHorizontal: 16 }}>
            <SettingLine icon="☏" title="Support" route="/dapp-browser" onFallback={setSheet} />
            <SettingLine icon="⬟" title="About" onFallback={setSheet} />
          </View>
          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 14 }} />
          <View style={{ paddingHorizontal: 16 }}>
            {socialRows.map((row) => <SettingLine key={row.title} {...row} onFallback={setSheet} />)}
          </View>
        </ScrollView>
        </View>
      </AppScreen>
      <SheetModal visible={!!sheet} title={sheet ?? ""} subtitle="This settings option is connected." onClose={() => setSheet(null)}>
        <Pressable onPress={() => setSheet(null)} style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Done</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function SettingLine({ icon, title, route, onFallback }: { icon: string; title: string; route?: string; onFallback: (title: string) => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={() => route ? router.push(route as never) : onFallback(title)} style={{ minHeight: 74, flexDirection: "row", alignItems: "center", gap: 18 }}>
      <Text style={{ width: 44, color: theme.secondary, fontSize: 30, textAlign: "center" }}>{icon}</Text>
      <Text style={{ flex: 1, color: theme.text, fontSize: 21, fontWeight: "900" }}>{title}</Text>
    </Pressable>
  );
}
