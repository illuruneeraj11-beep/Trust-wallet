import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SettingRow, ToggleRow } from "@/components/trust-ui";

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
    transactionSigning,
  } = useAppContext();

  return (
    <AppScreen title="Security" subtitle="Protect transactions, recovery flow, and local access">
      <Card>
        <ToggleRow icon="🔒" title="App Lock" subtitle="Require your passcode when reopening the app" valueEnabled={appLockEnabled} onValueChange={setAppLockEnabled} />
        <ToggleRow icon="🧬" title="Biometrics" subtitle="Face ID or fingerprint for app unlock" valueEnabled={biometricsEnabled} onValueChange={setBiometricsEnabled} />
        <ToggleRow icon="✍" title="Transaction Signing" subtitle="Prompt for PIN or biometrics on every transaction" valueEnabled={transactionSigning} onValueChange={setTransactionSigning} />
        <ToggleRow icon="🚨" title="Security Scanner Alerts" subtitle="Red, yellow, and green contract warnings" valueEnabled={scannerAlerts} onValueChange={setScannerAlerts} />
      </Card>

      <Card muted>
        {timers.map((timer) => (
          <SettingRow key={timer} icon="⏱" title={timer} subtitle="Auto-lock after inactivity" value={autoLockTimer === timer ? "✓" : "Select"} onPress={() => setAutoLockTimer(timer)} />
        ))}
      </Card>
    </AppScreen>
  );
}
