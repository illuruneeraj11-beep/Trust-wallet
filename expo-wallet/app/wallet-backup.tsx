import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppScreen } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

export default function WalletBackupScreen() {
  const { theme } = useAppContext();

  return (
    <AppScreen scrollable={false} padded={false}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <View style={{ height: 74, alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 48, height: 48, justifyContent: "center" }}>
            <Text style={{ color: theme.secondary, fontSize: 38 }}>‹</Text>
          </Pressable>
          <Text style={{ color: theme.text, fontSize: 25, fontWeight: "900" }}>Main Wallet 1</Text>
          <Text style={{ position: "absolute", right: 0, color: theme.secondary, fontSize: 30 }}>🗑</Text>
        </View>

        <Text style={{ color: theme.secondary, fontSize: 21, fontWeight: "900", marginTop: 12, marginBottom: 18 }}>Name</Text>
        <View style={{ minHeight: 78, borderRadius: 10, borderWidth: 1.5, borderColor: "#b6b6b7", paddingHorizontal: 18, flexDirection: "row", alignItems: "center" }}>
          <TextInput value="Main Wallet 1" editable={false} style={{ flex: 1, color: theme.text, fontSize: 24, fontWeight: "900" }} />
          <Text style={{ color: theme.secondary, fontSize: 30 }}>×</Text>
        </View>

        <Text style={{ color: theme.secondary, fontSize: 21, fontWeight: "900", marginTop: 66, marginBottom: 24 }}>Secret phrase backups</Text>
        <BackupRow icon="◢" title="Google Drive" value="Back up now" valueColor="#c70f0f" />
        <BackupRow icon="☝" title="Manual" value="Active" valueColor="#009c34" />
      </View>
    </AppScreen>
  );
}

function BackupRow({ icon, title, value, valueColor }: { icon: string; title: string; value: string; valueColor: string }) {
  const { theme } = useAppContext();

  return (
    <View style={{ minHeight: 92, flexDirection: "row", alignItems: "center", gap: 22 }}>
      <Text style={{ width: 44, color: theme.secondary, fontSize: 32, textAlign: "center" }}>{icon}</Text>
      <Text style={{ flex: 1, color: theme.text, fontSize: 24, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: valueColor, fontSize: 22, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}
