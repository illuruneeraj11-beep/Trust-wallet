import { useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, Pill, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function ReceiveScreen() {
  const { networkOptions, selectedWallet } = useAppContext();
  const topNetworks = useMemo(() => networkOptions.filter((item) => item.popular).slice(0, 4), [networkOptions]);

  return (
    <AppScreen title="Receive" subtitle="Choose a network and share your wallet address">
      <Card muted>
        <SectionHeader title={selectedWallet?.name || "Main wallet"} />
        <SettingRow icon="⌘" title="Wallet address" subtitle="0x93d7E8F4c2...087A15" value="Copy" />
        <SettingRow icon="▣" title="QR code" subtitle="Show your address for scans" value="Display" />
      </Card>

      <Card>
        {topNetworks.map((network) => (
          <Pill key={network.id} label={`${network.name}`} active={false} onPress={() => undefined} />
        ))}
      </Card>

      <Card muted>
        <SectionHeader title="Share options" />
        <SettingRow icon="📋" title="Copy address" subtitle="Copy the address to clipboard" value="Copy" />
        <SettingRow icon="⇪" title="Share" subtitle="Send your address using any installed app" value="Open" />
      </Card>
    </AppScreen>
  );
}
