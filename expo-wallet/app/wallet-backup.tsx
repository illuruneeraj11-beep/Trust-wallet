import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { BrandLogo } from "@/components/trust-assets";
import { TrustIcon, type TrustIconName } from "@/components/trust-icon";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

type BackupSheet = "backup" | "delete" | null;

export default function WalletBackupScreen() {
  const params = useLocalSearchParams<{ walletId?: string; name?: string }>();
  const { archiveWallet, renameWallet, theme, wallets } = useAppContext();
  const [name, setName] = useState(params.name ?? "Main Wallet 1");
  const [sheet, setSheet] = useState<BackupSheet>(null);
  const [backupMethod, setBackupMethod] = useState("Manual");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const walletId = params.walletId ?? wallets.find((wallet) => wallet.name === params.name)?.id ?? "";

  async function saveName() {
    const nextName = name.trim();
    if (!walletId || !nextName || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await renameWallet(walletId, nextName);
      setName(nextName);
      setMessage("Wallet name updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wallet name could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting || !walletId) return;
    setDeleting(true);
    setMessage(null);
    try {
      await archiveWallet(walletId);
      setSheet(null);
      router.replace({ pathname: "/(tabs)", params: { walletDeleted: "1" } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wallet could not be removed.");
      setSheet(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ height: 66, alignItems: "center", justifyContent: "center" }}>
            <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 46, height: 46, justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={27} /></Pressable>
            <Text numberOfLines={1} style={{ maxWidth: "70%", color: theme.text, fontSize: 20, fontWeight: "900" }}>{name || "Wallet"}</Text>
            <Pressable accessibilityLabel="Delete wallet" onPress={() => setSheet("delete")} style={{ position: "absolute", right: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="delete-outline" size={25} /></Pressable>
          </View>

          <Text style={{ color: theme.secondary, fontSize: 15, fontWeight: "800", marginTop: 12, marginBottom: 12 }}>Name</Text>
          <View style={{ minHeight: 58, borderRadius: 9, borderWidth: 1.3, borderColor: "#b6b6b7", paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }}>
            <TextInput editable={!saving} onBlur={() => void saveName()} onChangeText={setName} onSubmitEditing={() => void saveName()} returnKeyType="done" value={name} style={{ flex: 1, color: theme.text, fontSize: 17, fontWeight: "800", paddingVertical: 0 }} />
            {name ? <Pressable accessibilityLabel="Clear wallet name" onPress={() => setName("")} style={{ width: 38, height: 44, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="close-circle" size={21} /></Pressable> : null}
          </View>
          {message ? <Text style={{ color: message === "Wallet name updated" ? theme.positive : theme.negative, fontSize: 12, fontWeight: "800", marginTop: 8 }}>{message}</Text> : null}

          <Text style={{ color: theme.secondary, fontSize: 15, fontWeight: "800", marginTop: 38, marginBottom: 12 }}>Secret phrase backups</Text>
          <BackupRow icon="google-drive" title="Google Drive" onPress={() => { setBackupMethod("Google Drive"); setSheet("backup"); }} />
          <BackupRow icon="gesture-tap" title="Manual" onPress={() => { setBackupMethod("Manual"); setSheet("backup"); }} />
        </View>
      </AppScreen>

      <SheetModal visible={sheet === "backup"} title="Back up your wallet" subtitle="Choose how you want to protect this wallet." onClose={() => setSheet(null)}>
        <View style={{ minHeight: 132, alignItems: "center", justifyContent: "center", gap: 10 }}><BrandLogo brand="trust-wallet" size={72} /><Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{backupMethod}</Text></View>
        <View style={{ borderRadius: 16, backgroundColor: "#fff7dd", padding: 14, flexDirection: "row", gap: 10 }}><TrustIcon color="#9a6800" name="shield-alert-outline" size={23} /><Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>Recovery phrase backup is unavailable for Testnet wallets. This app will never ask you to enter an existing recovery phrase.</Text></View>
        <PrimaryButton label="Close" onPress={() => setSheet(null)} />
      </SheetModal>

      <SheetModal visible={sheet === "delete"} title="Delete wallet?" subtitle="This wallet will be removed from your wallet list." onClose={() => setSheet(null)}>
        <View style={{ borderRadius: 16, backgroundColor: "#fdecec", padding: 14, flexDirection: "row", gap: 10 }}><TrustIcon color={theme.negative} name="alert-circle-outline" size={24} /><Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>Testnet balances will no longer appear in this wallet. Transaction history is retained for account integrity.</Text></View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable disabled={deleting} onPress={() => setSheet(null)} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Cancel</Text></Pressable>
          <Pressable disabled={deleting} onPress={confirmDelete} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: theme.negative, alignItems: "center", justifyContent: "center" }}>{deleting ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>Delete</Text>}</Pressable>
        </View>
      </SheetModal>
    </>
  );
}

function BackupRow({ icon, title, onPress }: { icon: TrustIconName; title: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return <Pressable onPress={onPress} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14 }}><View style={{ width: 34, alignItems: "center" }}><TrustIcon color={theme.secondary} name={icon} size={24} /></View><Text style={{ flex: 1, color: theme.text, fontSize: 17, fontWeight: "900" }}>{title}</Text><Text style={{ color: "#c70f0f", fontSize: 15, fontWeight: "900" }}>Back up now</Text></Pressable>;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ height: 54, borderRadius: 27, backgroundColor: "#0500ff", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>{label}</Text></Pressable>;
}
