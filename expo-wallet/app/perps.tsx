import { perpsMarkets } from "@/data/trust-wallet";
import { AppScreen, Card, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function PerpsScreen() {
  return (
    <AppScreen title="Perps" subtitle="High conviction markets with leverage and volume snapshots">
      <SectionHeader title="Markets" />
      <Card>
        {perpsMarkets.map((market) => (
          <SettingRow key={market.pair} icon="📈" title={market.pair} subtitle={`${market.leverage} · ${market.volume} volume`} value={`${market.price} ${market.change}`} />
        ))}
      </Card>
    </AppScreen>
  );
}
