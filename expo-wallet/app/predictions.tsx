import { predictionMarkets } from "@/data/trust-wallet";
import { AppScreen, Card, Pill, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function PredictionsScreen() {
  return (
    <AppScreen title="Predictions" subtitle="Trade event outcomes with yes/no markets">
      <SectionHeader title="Live markets" />
      <Card>
        {predictionMarkets.map((market) => (
          <Card key={market.id} muted>
            <SectionHeader title={market.title} />
            <SettingRow icon="🕘" title={market.provider} subtitle={`${market.volume} total volume`} value={market.endsIn} />
            <Card>
              <Pill label="Yes" active />
              <Pill label="No" />
            </Card>
          </Card>
        ))}
      </Card>
    </AppScreen>
  );
}
