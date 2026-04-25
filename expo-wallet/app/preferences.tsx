import { useMemo } from "react";
import { currencyOptions, languageOptions, networkOptions } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SearchInput, SettingRow, ToggleRow } from "@/components/trust-ui";

export default function PreferencesScreen() {
  const {
    currency,
    customRpcUrl,
    dappBrowserEnabled,
    language,
    setCurrencyCode,
    clearBrowserCache,
    setCustomRpcUrl,
    setDappBrowserEnabled,
    setLanguage,
  } = useAppContext();

  const popularNetworks = useMemo(() => networkOptions.filter((item) => item.popular), []);

  return (
    <AppScreen title="Preferences" subtitle="Local appearance, language, dApp browser, and custom nodes">
      <Card>
        {currencyOptions.map((item) => (
          <SettingRow key={item.code} icon="💱" title={`${item.code} · ${item.label}`} subtitle="Global fiat display" value={currency.code === item.code ? "✓" : "Select"} onPress={() => setCurrencyCode(item.code)} />
        ))}
      </Card>

      <Card muted>
        {languageOptions.map((item) => (
          <SettingRow key={item} icon="🌐" title={item} subtitle="Change the wallet interface language" value={language === item ? "✓" : "Select"} onPress={() => setLanguage(item)} />
        ))}
      </Card>

      <Card>
        <ToggleRow icon="◇" title="Enable dApp Browser" subtitle="Show Discover and embedded browser tooling" valueEnabled={dappBrowserEnabled} onValueChange={setDappBrowserEnabled} />
        <SettingRow icon="⌫" title="Clear browser cache" subtitle="Remove cookies and session storage for connected dApps" value="Run" onPress={clearBrowserCache} />
      </Card>

      <Card muted>
        <SearchInput value={customRpcUrl} onChangeText={setCustomRpcUrl} placeholder="Custom RPC URL" />
        {popularNetworks.map((network) => (
          <SettingRow key={network.id} icon="⛓" title={network.name} subtitle="Use a faster RPC endpoint when a chain is congested" value={network.symbol} onPress={() => setCustomRpcUrl(`https://rpc.trustwallet.example/${network.symbol.toLowerCase()}`)} />
        ))}
      </Card>
    </AppScreen>
  );
}
