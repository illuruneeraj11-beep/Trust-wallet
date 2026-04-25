import { useState } from "react";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, Pill, SearchInput, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function NetworkSelectorScreen() {
  const { networkOptions } = useAppContext();
  const [query, setQuery] = useState("");
  const visible = networkOptions.filter((network) => {
    const haystack = `${network.name} ${network.symbol}`.toLowerCase();
    return query ? haystack.includes(query.toLowerCase()) : true;
  });

  return (
    <AppScreen title="Networks" subtitle="Switch chains and choose the network for each flow">
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search networks" />

      <SectionHeader title="Popular" />
      <Card muted>
        {networkOptions.filter((network) => network.popular).map((network) => (
          <Pill key={network.id} label={network.name} active={false} onPress={() => undefined} />
        ))}
      </Card>

      <SectionHeader title="All networks" />
      <Card>
        {visible.map((network) => (
          <SettingRow key={network.id} icon="⛓" title={network.name} subtitle="Available for send, receive, and swaps" value={network.symbol} />
        ))}
      </Card>
    </AppScreen>
  );
}
