import { router } from "expo-router";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SettingRow, ToggleRow } from "@/components/trust-ui";

export default function SettingsScreen() {
  const {
    appLockEnabled,
    biometricsEnabled,
    dappBrowserEnabled,
    pushIncoming,
    pushOutgoing,
    pushPromotions,
    scannerAlerts,
    themeMode,
    toggleThemeMode,
    setAppLockEnabled,
    setBiometricsEnabled,
    setDappBrowserEnabled,
    setPushIncoming,
    setPushOutgoing,
    setPushPromotions,
    setScannerAlerts,
  } = useAppContext();

  return (
    <AppScreen title="Settings" subtitle="Security, preferences, notifications, and support">
      <Card muted>
        <ToggleRow icon="☼" title="Dark Mode" subtitle={`Currently ${themeMode}`} valueEnabled={themeMode === "dark"} onValueChange={toggleThemeMode} />
        <SettingRow icon="📒" title="Address Book" subtitle="Saved recipients and exchange wallets" onPress={() => router.push("/address-book")} />
        <SettingRow icon="🧩" title="WalletConnect" subtitle="Connect to desktop dApps and browser sessions" value="Open" onPress={() => router.push("/dapp-browser")} />
        <SettingRow icon="🔐" title="Security" subtitle="PIN, biometrics, signing, and scanner alerts" onPress={() => router.push("/security")} />
        <SettingRow icon="⚙" title="Preferences" subtitle="Fiat, language, dApp browser, and RPCs" onPress={() => router.push("/preferences")} />
      </Card>

      <Card>
        <SettingRow icon="🔄" title="Sync to Extension" subtitle="Pair with desktop extension using QR sync" value="QR" onPress={() => router.push("/dapp-browser")} />
        <SettingRow icon="@" title="Trust Handles" subtitle="Claim and manage your web3 identity" value="Manage" onPress={() => router.push("/preferences")} />
        <SettingRow icon="⌁" title="Scan QR code" subtitle="Quickly send, receive, or connect to a dApp" value="Scan" onPress={() => router.push("/receive")} />
        <SettingRow icon="☏" title="Support & Feedback" subtitle="Help center, FAQ, and AI support hub" value="Open" onPress={() => router.push("/dapp-browser")} />
      </Card>

      <Card muted>
        <ToggleRow icon="⍰" title="App Lock" subtitle="Require a passcode after inactivity" valueEnabled={appLockEnabled} onValueChange={setAppLockEnabled} />
        <ToggleRow icon="◎" title="Biometrics" subtitle="Use Face ID or fingerprint when available" valueEnabled={biometricsEnabled} onValueChange={setBiometricsEnabled} />
        <ToggleRow icon="🌐" title="DApp Browser" subtitle="Show or hide the Discover browser tab locally" valueEnabled={dappBrowserEnabled} onValueChange={setDappBrowserEnabled} />
        <ToggleRow icon="🛡" title="Security Scanner Alerts" subtitle="Show proactive risk signals while transacting" valueEnabled={scannerAlerts} onValueChange={setScannerAlerts} />
      </Card>

      <Card>
        <ToggleRow icon="↓" title="Incoming notifications" subtitle="Incoming transfer push notifications" valueEnabled={pushIncoming} onValueChange={setPushIncoming} />
        <ToggleRow icon="↑" title="Outgoing notifications" subtitle="Outgoing transfer push notifications" valueEnabled={pushOutgoing} onValueChange={setPushOutgoing} />
        <ToggleRow icon="★" title="Promotional campaigns" subtitle="New quests, campaigns, and partner drops" valueEnabled={pushPromotions} onValueChange={setPushPromotions} />
      </Card>
    </AppScreen>
  );
}
