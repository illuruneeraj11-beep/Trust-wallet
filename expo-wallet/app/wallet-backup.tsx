import { AppScreen, Card, SettingRow } from "@/components/trust-ui";

export default function WalletBackupScreen() {
  return (
    <AppScreen title="Secret phrase backups" subtitle="Choose how you want to secure your recovery phrase">
      <Card muted>
        <SettingRow icon="☁" title="Google Drive" subtitle="Encrypted cloud backup for your secret phrase" value="Enable" />
        <SettingRow icon="✎" title="Manual" subtitle="Write down your phrase and store it offline" value="Open" />
      </Card>
    </AppScreen>
  );
}
