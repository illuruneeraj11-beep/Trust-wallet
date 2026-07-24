import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { createWallet, makeIdempotencyKey } from "@/services/wallet-ledger";

export default function AddWalletScreen() {
  const { mode = "create" } = useLocalSearchParams<{ mode?: "create" | "existing" }>();
  const { refreshWallets, setSelectedWalletId, theme, wallets } = useAppContext();
  const idempotencyKey = useRef(makeIdempotencyKey("wallet"));
  const [ready, setReady] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(`Main Wallet ${wallets.length + 1}`);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (creating || !name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const createdWallet = await createWallet(name.trim(), idempotencyKey.current);
      await refreshWallets();
      setSelectedWalletId(createdWallet.id);
      setReady(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The wallet could not be created.");
    } finally {
      setCreating(false);
    }
  }

  if (mode === "existing") {
    return (
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <View style={{ height: 55, alignItems: "center", justifyContent: "center" }}>
            <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 42, height: 42, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={24} /></Pressable>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>Add existing wallet</Text>
          </View>
          <Text style={{ color: theme.secondary, fontSize: 12, lineHeight: 18 }}>This simulation never asks for a recovery phrase or private key.</Text>
          <SafeOption icon="eye-outline" label="View-only address" subtitle="Track a public address without signing" onPress={() => router.push("/address-book")} />
          <SafeOption icon="wallet-connect" label="WalletConnect" subtitle="Open the documented connection entry state" onPress={() => router.push("/settings")} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable={false} padded={false}>
      <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <Image source={require("../assets/artwork/wallet-ready.png")} resizeMode="cover" style={{ position: "absolute", top: 0, left: 0, right: 0, width: "100%", height: "76%" }} />
        <Pressable accessibilityLabel={ready ? "Skip funding" : "Go back"} onPress={() => ready ? router.replace("/(tabs)") : router.back()} style={{ position: "absolute", right: 15, top: 8, minHeight: 34, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.secondary, fontSize: 12, fontWeight: "800" }}>{ready ? "Skip" : "Back"}</Text>
        </Pressable>
        <View style={{ position: "absolute", left: 24, right: 24, bottom: 102, alignItems: "center", gap: 10 }}>
          <Text style={{ color: error ? theme.negative : theme.text, fontSize: 22, fontWeight: "900", textAlign: "center" }}>
            {error ? "Wallet creation needs attention" : ready ? "Brilliant, your wallet is ready!" : creating ? "Creating your wallet..." : "Create a new wallet"}
          </Text>
          <Text style={{ color: error ? theme.negative : theme.secondary, fontSize: 12, textAlign: "center" }}>
            {error ?? (ready ? "Add funds to get started" : "Choose a name for this wallet")}
          </Text>
          {!ready ? <TextInput autoCapitalize="words" editable={!creating} maxLength={80} onChangeText={setName} placeholder="Wallet name" placeholderTextColor={theme.secondary} style={{ width: "100%", height: 48, borderRadius: 15, backgroundColor: theme.surface, color: theme.text, fontSize: 15, fontWeight: "800", paddingHorizontal: 15, textAlign: "center" }} value={name} /> : null}
        </View>
        <Pressable disabled={creating || (!ready && !name.trim())} onPress={() => ready ? router.replace("/fund") : void create()} style={{ position: "absolute", left: 16, right: 16, bottom: 24, height: 52, borderRadius: 26, backgroundColor: creating || (!ready && !name.trim()) ? theme.blueSoft : theme.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <TrustIcon color={creating || (!ready && !name.trim()) ? theme.secondary : "#ffffff"} name="wallet-plus-outline" size={20} />
          <Text style={{ color: creating || (!ready && !name.trim()) ? theme.secondary : "#ffffff", fontSize: 14, fontWeight: "900" }}>{ready ? "Fund your wallet" : creating ? "Creating..." : error ? "Try again" : "Create wallet"}</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

function SafeOption({ icon, label, subtitle, onPress }: { icon: "eye-outline" | "wallet-connect"; label: string; subtitle: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return <Pressable onPress={onPress} style={{ minHeight: 76, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.blue} name={icon} size={22} /></View><View style={{ flex: 1, gap: 2 }}><Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{label}</Text><Text style={{ color: theme.secondary, fontSize: 11 }}>{subtitle}</Text></View><TrustIcon color={theme.secondary} name="chevron-right" size={20} /></Pressable>;
}
