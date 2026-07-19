import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SettingRow, SheetModal, ToggleRow } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const timers = ["Immediately", "1 minute", "5 minutes", "1 hour", "5 hours"] as const;

export default function SecurityScreen() {
  const {
    appLockEnabled,
    autoLockTimer,
    biometricsEnabled,
    scannerAlerts,
    setAppLockEnabled,
    setAutoLockTimer,
    setBiometricsEnabled,
    setScannerAlerts,
    setTransactionSigning,
    theme,
    transactionSigning,
  } = useAppContext();
  const [timerSheet, setTimerSheet] = useState(false);

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <FlowHeader title="Security" />
          <ToggleRow icon="lock-outline" title="App Lock" subtitle="Require your passcode when reopening the app" valueEnabled={appLockEnabled} onValueChange={setAppLockEnabled} />
          <ToggleRow icon="fingerprint" title="Biometrics" subtitle="Use fingerprint or face unlock" valueEnabled={biometricsEnabled} onValueChange={setBiometricsEnabled} />
          <ToggleRow icon="pencil-lock-outline" title="Transaction Signing" subtitle="Confirm every transaction locally" valueEnabled={transactionSigning} onValueChange={setTransactionSigning} />
          <ToggleRow icon="shield-search" title="Security Scanner Alerts" subtitle="Warn about risky contracts and addresses" valueEnabled={scannerAlerts} onValueChange={setScannerAlerts} />
          <SettingRow icon="timer-outline" title="Auto-lock" subtitle="Lock after a period of inactivity" value={autoLockTimer} onPress={() => setTimerSheet(true)} />
        </View>
      </AppScreen>

      <SheetModal visible={timerSheet} title="Auto-lock" onClose={() => setTimerSheet(false)}>
        {timers.map((timer) => <Choice key={timer} active={autoLockTimer === timer} label={timer} onPress={() => { setAutoLockTimer(timer); setTimerSheet(false); }} />)}
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
