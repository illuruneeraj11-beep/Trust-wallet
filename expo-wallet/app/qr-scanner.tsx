import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { AppScreen } from "@/components/trust-ui";
import { DemoModeBanner, FlowButton, FlowTextInput } from "@/components/demo-wallet-flow-ui";
import { TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";
import { parseWalletQr, type ParsedWalletQr } from "@/lib/wallet-qr";

export default function QrScannerScreen() {
  const params = useLocalSearchParams<{ asset?: string; network?: string; amount?: string; note?: string }>();
  const { theme } = useAppContext();
  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedWalletQr | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  function acceptPayload(value: string) {
    try {
      const next = parseWalletQr(value);
      setPayload(value);
      setParsed(next);
      setError(null);
      setScanned(true);
    } catch (caught) {
      setParsed(null);
      setError(caught instanceof Error ? caught.message : "This QR payload is not supported.");
      setScanned(false);
    }
  }

  function handleBarcode(result: BarcodeScanningResult) {
    if (scanned || !result.data) return;
    acceptPayload(result.data);
  }

  function parse() {
    try {
      const value = parseWalletQr(payload);
      setParsed(value);
      setError(null);
    } catch (caught) {
      setParsed(null);
      setError(caught instanceof Error ? caught.message : "This QR payload is not supported.");
    }
  }

  function continueToSend(value = parsed) {
    if (!value) return;
    if (value.kind === "wallet-connect") {
      router.replace({ pathname: "/settings", params: { open: "WalletConnect" } });
      return;
    }
    const asset = value.asset ?? params.asset ?? "";
    router.replace({ pathname: "/send", params: { recipient: value.recipient, asset, network: value.network ?? params.network ?? "", amount: value.amount ?? params.amount ?? "", note: params.note ?? "", selectAsset: asset ? "" : "1" } });
  }

  return (
    <AppScreen scrollable={false} padded={false}>
      <View style={{ flex: 1, backgroundColor: "#101012", paddingHorizontal: 16 }}>
        <View style={{ height: 58, alignItems: "center", justifyContent: "center" }}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 42, height: 42, alignItems: "center", justifyContent: "center" }}><TrustIcon color="#ffffff" name="arrow-left" size={24} /></Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }}>Scan QR code</Text>
            <Text style={{ color: "#aaaab1", fontSize: 9, fontWeight: "700" }}>Tommy</Text>
          </View>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
          <View style={{ width: 268, height: 268, borderRadius: 28, overflow: "hidden", backgroundColor: "#1b1b1e", alignItems: "center", justifyContent: "center" }}>
            {permission?.granted ? (
              <CameraView
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                enableTorch={torch}
                onBarcodeScanned={scanned ? undefined : handleBarcode}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <View style={{ alignItems: "center", gap: 12, paddingHorizontal: 24 }}>
                <TrustIcon color="#d5d5da" name="scanner" size={72} />
                <Pressable onPress={() => void (permission && !permission.canAskAgain ? Linking.openSettings() : requestPermission())} style={{ minHeight: 46, borderRadius: 23, backgroundColor: theme.blue, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>{permission && !permission.canAskAgain ? "Open Settings" : permission ? "Allow camera" : "Enable camera"}</Text></Pressable>
              </View>
            )}
            {permission?.granted ? <View style={{ position: "absolute", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><TrustIcon color="rgba(255,255,255,0.9)" name="scanner" size={224} /></View> : null}
            {permission?.granted ? <Pressable accessibilityLabel={torch ? "Turn flash off" : "Turn flash on"} onPress={() => setTorch((value) => !value)} style={{ position: "absolute", right: 12, top: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(16,16,18,0.72)", alignItems: "center", justifyContent: "center" }}><TrustIcon color="#ffffff" name={torch ? "flash" : "flash-off"} size={22} /></Pressable> : null}
          </View>
          <Text style={{ color: "#d5d5da", fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 290 }}>{scanned ? "QR code recognized. Review the recipient below." : "Position a Tommy receive QR inside the frame."}</Text>
          {scanned ? <Pressable onPress={() => { setScanned(false); setParsed(null); setPayload(""); setError(null); }}><Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>Scan another code</Text></Pressable> : null}
        </View>

        <View style={{ borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: "#ffffff", marginHorizontal: -16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === "web" ? 24 : 34, gap: 12 }}>
          <DemoModeBanner compact />
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>Paste or enter QR contents</Text>
          <FlowTextInput onChangeText={(value) => { setPayload(value); setParsed(null); setError(null); setScanned(false); }} placeholder="Wallet address, payment URI, or @handle" value={payload} />
          {error ? <View style={{ flexDirection: "row", gap: 7 }}><TrustIcon color={theme.negative} name="alert-circle-outline" size={17} /><Text style={{ flex: 1, color: theme.negative, fontSize: 11, lineHeight: 16 }}>{error}</Text></View> : null}
          {parsed ? (
            <View style={{ borderRadius: 14, backgroundColor: "#e9f8ef", padding: 11, gap: 3 }}>
              <Text style={{ color: theme.positive, fontSize: 12, fontWeight: "900" }}>Valid recipient</Text>
              <Text numberOfLines={1} style={{ color: theme.text, fontSize: 11 }}>{parsed.recipient}{parsed.asset ? ` · ${parsed.asset}` : ""}{parsed.amount ? ` · ${parsed.amount}` : ""}</Text>
            </View>
          ) : null}
          <FlowButton disabled={!payload.trim()} label={parsed ? "Continue to Send" : "Read QR contents"} onPress={parsed ? () => continueToSend() : parse} />
        </View>
      </View>
    </AppScreen>
  );
}

/** Backward-compatible export used by older tests and saved links. */
export { parseWalletQr, parseWalletQr as parseDemoQr } from "@/lib/wallet-qr";
