import { useLocalSearchParams } from "expo-router";
import { AppScreen, Card, Pill, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function TokenDetailScreen() {
  const params = useLocalSearchParams<{ symbol?: string; name?: string; price?: string; change?: string }>();
  const title = params.name || params.symbol || "Token";
  const price = params.price || "$0.00";
  const change = params.change || "+0.00%";

  return (
    <AppScreen title={title} subtitle={`${params.symbol || "Asset"} market detail`}>
      <Card muted>
        <SettingRow icon="◉" title={price} subtitle="Current portfolio valuation" value={change} />
        <SectionHeader title="Chart" />
        <Card>
          <Pill label="1H" active />
          <Pill label="1D" />
          <Pill label="1W" />
          <Pill label="1M" />
          <Pill label="1Y" />
          <Pill label="All" />
        </Card>
      </Card>

      <Card>
        <SectionHeader title="Overview" />
        <SettingRow icon="▥" title="Holdings" subtitle="Asset balance in your selected wallet" value="Open" />
        <SettingRow icon="⇄" title="Swap" subtitle="Exchange this token for another asset" value="Start" />
        <SettingRow icon="↑" title="Send" subtitle="Transfer this token to another address" value="Send" />
      </Card>
    </AppScreen>
  );
}
