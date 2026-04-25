import { useMemo, useState } from "react";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SearchInput, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function DappBrowserScreen() {
  const { dappCategories, favoriteDapps } = useAppContext();
  const [query, setQuery] = useState("");
  const flattened = useMemo(() => Object.values(dappCategories).flat(), [dappCategories]);
  const visible = flattened.filter((item) => {
    const haystack = `${item.name} ${item.description} ${item.network}`.toLowerCase();
    return query ? haystack.includes(query.toLowerCase()) : true;
  });

  return (
    <AppScreen title="DApp Browser" subtitle="Search connected apps, sync sessions, and launch favorites">
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search dApps" />
      <Card muted>
        <SettingRow icon="♥" title="Favorites" subtitle={`${favoriteDapps.length} saved dApps`} value="Open" />
        <SettingRow icon="🔄" title="Sync to Extension" subtitle="Pair your mobile wallet with the browser extension" value="QR" />
      </Card>

      <SectionHeader title="Results" />
      <Card>
        {visible.map((item) => (
          <SettingRow key={`${item.category}-${item.name}`} icon="◈" title={item.name} subtitle={`${item.description} · ${item.network}`} value={item.category} />
        ))}
      </Card>
    </AppScreen>
  );
}
