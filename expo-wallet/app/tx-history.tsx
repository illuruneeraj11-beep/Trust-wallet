import { useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, EmptyStateCard, SettingRow, ToggleRow } from "@/components/trust-ui";

export default function TxHistoryScreen() {
  const { currency, loadingTransfers, theme, transfers } = useAppContext();
  const rows = useMemo(() => transfers.map((transfer) => ({
    id: transfer.id,
    amount: Number(transfer.amount || 0),
    date: new Date(transfer.created_at).toLocaleString(),
    note: transfer.note || "Wallet transfer",
    status: transfer.status,
  })), [transfers]);

  return (
    <AppScreen title="Transaction History" subtitle="Ledger of sends, receives, swaps, and funding events">
      <Card muted>
        <ToggleRow icon="⛃" title="Hide transfers < $0.01" subtitle="Reduce micro-transfer noise from your local history view" valueEnabled={false} onValueChange={() => undefined} />
      </Card>

      <Card>
        {loadingTransfers ? (
          <SettingRow icon="…" title="Loading history" subtitle="Syncing your mock transfer ledger" value="Wait" />
        ) : rows.length ? (
          rows.map((row) => (
            <SettingRow key={row.id} icon={row.status === "completed" ? "↓" : "↺"} title={row.note} subtitle={`${row.date} · ${currency.code} ${row.amount.toFixed(2)}`} value={row.status} />
          ))
        ) : (
          <EmptyStateCard icon="🎮" title="No transactions yet" subtitle="Check explorer after your first send, receive, or swap." linkLabel="Check explorer" />
        )}
      </Card>
    </AppScreen>
  );
}
