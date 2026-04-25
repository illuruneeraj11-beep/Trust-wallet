import { memeRushEntries } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function MemeRushScreen() {
  const { theme } = useAppContext();

  return (
    <AppScreen title="Meme Rush" subtitle="Monitor holders, age, momentum, and fast trade entries">
      <SectionHeader title="Leaderboard" />
      <Card>
        {memeRushEntries.map((entry) => (
          <Card key={entry.symbol} muted>
            <SettingRow icon="⚡" title={entry.symbol} subtitle={`${entry.age} · Holders ${entry.holders} · ${entry.price}`} value={entry.trend} />
            <Card>
              <SettingRow icon="▤" title="Momentum score" subtitle={`Score ${entry.score}/100`} value="Trade" />
              <Card muted>
                <SettingRow icon="◼" title="Score bar" subtitle={`${entry.score}% filled`} value={entry.score > 60 ? "Hot" : "Warm"} />
              </Card>
            </Card>
          </Card>
        ))}
      </Card>
    </AppScreen>
  );
}
