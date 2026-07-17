import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppScreen } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

export default function QrScannerScreen() {
  const { theme } = useAppContext();
  return (
    <AppScreen scrollable={false} padded={false}>
      <View style={{ flex: 1, backgroundColor: "#111", paddingHorizontal: 16 }}>
        <View style={{ height: 72, alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0 }}><Text style={{ color: "#fff", fontSize: 36 }}>‹</Text></Pressable>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>Scan QR code</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28 }}>
          <View style={{ width: 250, height: 250, borderRadius: 24, borderWidth: 3, borderColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 70 }}>⌗</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 16, textAlign: "center", lineHeight: 22 }}>Point your camera at a wallet QR code to receive, send, or connect.</Text>
          <Pressable onPress={() => router.push("/receive")} style={{ minHeight: 52, borderRadius: 26, backgroundColor: theme.blue, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>Open receive QR</Text>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}
