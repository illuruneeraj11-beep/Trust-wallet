import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { TrustIcon } from "@/components/trust-icon";
import { DappLogo } from "@/components/secondary-flow-ui";
import { dappDirectory, type DappDefinition } from "@/data/secondary-flows";
import { useAppContext } from "@/context/app-context";

export default function DappBrowserScreen() {
  const { theme } = useAppContext();
  const params = useLocalSearchParams<{ dappId?: string; name?: string; url?: string }>();
  const initial = useMemo(() => {
    return dappDirectory.find((item) => item.id === params.dappId)
      ?? dappDirectory.find((item) => item.url === params.url)
      ?? dappDirectory[0];
  }, [params.dappId, params.url]);
  const [current, setCurrent] = useState(initial);
  const [address, setAddress] = useState(initial.url);
  const [history, setHistory] = useState<DappDefinition[]>([initial]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [sheet, setSheet] = useState<"blocked" | "menu" | "connect" | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const navigate = (next: DappDefinition) => {
    const nextHistory = history.slice(0, historyIndex + 1).concat(next);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setCurrent(next);
    setAddress(next.url);
  };

  const submitAddress = () => {
    const normalized = address.trim().replace(/\/$/, "").toLowerCase();
    const match = dappDirectory.find((item) => item.url.replace(/\/$/, "").toLowerCase() === normalized || item.name.toLowerCase() === normalized);
    if (!match || !normalized.startsWith("https://")) {
      setAddress(current.url);
      setSheet("blocked");
      return;
    }
    navigate(match);
  };

  const moveHistory = (direction: -1 | 1) => {
    const nextIndex = historyIndex + direction;
    if (nextIndex < 0 || nextIndex >= history.length) return;
    const next = history[nextIndex];
    setHistoryIndex(nextIndex);
    setCurrent(next);
    setAddress(next.url);
  };

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 450);
  };

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 12, gap: 12 }}>
          <View style={{ height: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <BrowserButton icon="chevron-down" onPress={() => router.back()} />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>Browser</Text>
            <BrowserButton icon="dots-horizontal" onPress={() => setSheet("menu")} />
          </View>

          <View style={{ height: 46, borderRadius: 23, backgroundColor: theme.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TrustIcon color="#0aa84f" name="shield-check-outline" size={20} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setAddress}
              onSubmitEditing={submitAddress}
              returnKeyType="go"
              selectTextOnFocus
              style={{ flex: 1, color: theme.text, fontSize: 13, fontWeight: "600", paddingVertical: 0 }}
              value={address}
            />
            <Pressable accessibilityLabel="Refresh dApp" accessibilityRole="button" onPress={refresh} style={{ width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
              <TrustIcon color={theme.secondary} name={refreshing ? "loading" : "refresh"} size={20} />
            </Pressable>
          </View>

          <View style={{ minHeight: 490, borderRadius: 22, backgroundColor: "#f5f5f7", overflow: "hidden" }}>
            <View style={{ paddingHorizontal: 18, paddingVertical: 14, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <DappLogo name={current.name} uri={current.logoUrl} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>{current.name}</Text>
                <Text style={{ color: theme.secondary, fontSize: 12 }}>{safeHost(current.url)} | {current.network}</Text>
              </View>
              <View style={{ borderRadius: 12, backgroundColor: "#e4f6e9", paddingHorizontal: 9, paddingVertical: 5 }}>
                <Text style={{ color: "#08773d", fontSize: 10, fontWeight: "800" }}>Read only</Text>
              </View>
            </View>

            <View style={{ flex: 1, padding: 22, gap: 20, justifyContent: "center" }}>
              <View style={{ alignItems: "center", gap: 12 }}>
                <DappLogo name={current.name} uri={current.logoUrl} size={76} />
                <Text style={{ color: theme.text, fontSize: 26, fontWeight: "900", textAlign: "center" }}>{current.name}</Text>
                <Text style={{ color: theme.secondary, fontSize: 14, lineHeight: 20, textAlign: "center" }}>{current.description}</Text>
              </View>
              <View style={{ borderRadius: 17, backgroundColor: "#ffffff", padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <TrustIcon color={theme.blue} name="shield-lock-outline" size={24} />
                <Text style={{ flex: 1, color: theme.secondary, fontSize: 12, lineHeight: 18 }}>Testnet browser mode does not load third-party scripts, request permissions, or expose wallet data.</Text>
              </View>
              <Pressable onPress={() => setSheet("connect")} style={{ height: 52, borderRadius: 26, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>Connect wallet</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 58, borderRadius: 29, backgroundColor: "#ffffff", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
            <BottomButton disabled={historyIndex === 0} icon="arrow-left" onPress={() => moveHistory(-1)} />
            <BottomButton disabled={historyIndex >= history.length - 1} icon="arrow-right" onPress={() => moveHistory(1)} />
            <BottomButton icon="home-outline" onPress={() => navigate(dappDirectory[0])} />
            <BottomButton icon="tab" onPress={() => setSheet("menu")} />
            <BottomButton icon="dots-horizontal" onPress={() => setSheet("menu")} />
          </View>
        </View>
      </AppScreen>

      <SheetModal visible={sheet === "blocked"} title="Address blocked" subtitle="Testnet opens only reviewed dApps in its directory." onClose={() => setSheet(null)}>
        <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 15, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <TrustIcon color={theme.negative} name="shield-alert-outline" size={27} />
          <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 18 }}>Unknown URLs are never loaded. Only curated HTTPS entries can be opened.</Text>
        </View>
        <PrimaryButton label="Close" onPress={() => setSheet(null)} />
      </SheetModal>

      <SheetModal
        visible={disclaimerOpen}
        title="Before you continue"
        subtitle="Third-party dApps are not controlled by Trust Wallet."
        onClose={() => router.back()}
      >
        <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 15, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 11 }}>
            <TrustIcon color={theme.blue} name="shield-alert-outline" size={25} />
            <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>
              Check the domain and every permission. This comparison build keeps connections, signatures, and transactions disabled.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="I understand the risks"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: disclaimerAccepted }}
            onPress={() => setDisclaimerAccepted((value) => !value)}
            style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <TrustIcon color={disclaimerAccepted ? theme.blue : theme.secondary} name={disclaimerAccepted ? "checkbox-marked" : "checkbox-blank-outline"} size={25} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "700" }}>I understand the risks of third-party dApps.</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityState={{ disabled: !disclaimerAccepted }}
            disabled={!disclaimerAccepted}
            onPress={() => setDisclaimerOpen(false)}
            style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: theme.blue, opacity: disclaimerAccepted ? 1 : 0.35, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>Confirm</Text>
          </Pressable>
        </View>
      </SheetModal>

      <SheetModal visible={sheet === "connect"} title="Connection disabled" subtitle="Wallet data and signatures are unavailable on Testnet." onClose={() => setSheet(null)}>
        <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 15, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <TrustIcon color={theme.blue} name="shield-lock-outline" size={28} />
          <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 18 }}>Use the real Trust Wallet only after checking the dApp domain and every requested permission.</Text>
        </View>
        <PrimaryButton label="Got it" onPress={() => setSheet(null)} />
      </SheetModal>

      <SheetModal visible={sheet === "menu"} title="Browser menu" subtitle={safeHost(current.url)} onClose={() => setSheet(null)}>
        <MenuRow icon="star-outline" label="Add to favorites" onPress={() => setSheet(null)} />
        <MenuRow icon="share-variant-outline" label="Share address" onPress={() => setSheet(null)} />
        <MenuRow icon="shield-search" label="Security report" onPress={() => setSheet("connect")} />
        <MenuRow icon="open-in-new" label="Open externally" onPress={() => setSheet("blocked")} />
      </SheetModal>
    </>
  );
}

function BrowserButton({ icon, onPress }: { icon: "chevron-down" | "dots-horizontal"; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={icon === "chevron-down" ? "Close browser" : "Browser menu"} accessibilityRole="button" onPress={onPress} style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }}>
      <TrustIcon color="#202124" name={icon} size={24} />
    </Pressable>
  );
}

function BottomButton({ icon, disabled, onPress }: { icon: "arrow-left" | "arrow-right" | "home-outline" | "tab" | "dots-horizontal"; disabled?: boolean; onPress: () => void }) {
  const accessibilityLabel = icon === "arrow-left" ? "Browser back"
    : icon === "arrow-right" ? "Browser forward"
      : icon === "home-outline" ? "Browser home"
        : icon === "tab" ? "Browser tabs"
          : "Browser menu";
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={onPress} style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.3 : 1 }}>
      <TrustIcon color="#202124" name={icon} size={22} />
    </Pressable>
  );
}

function MenuRow({ icon, label, onPress }: { icon: "star-outline" | "share-variant-outline" | "shield-search" | "open-in-new"; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 54, flexDirection: "row", alignItems: "center", gap: 13 }}>
      <TrustIcon color="#6d6d72" name={icon} size={23} />
      <Text style={{ flex: 1, color: "#202124", fontSize: 16, fontWeight: "700" }}>{label}</Text>
      <TrustIcon color="#9a9a9f" name="chevron-right" size={22} />
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ height: 52, borderRadius: 26, backgroundColor: "#0500ff", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
