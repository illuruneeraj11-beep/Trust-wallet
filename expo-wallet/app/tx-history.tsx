import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { DemoFlowHeader, DemoModeBanner, FlowButton, FlowCard, shortDemoId } from "@/components/demo-wallet-flow-ui";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";

type UiAsset = { id: string; symbol: string; name: string; network?: string; network_code?: string };
type UiTransfer = {
  id: string;
  transaction_id?: string;
  hash?: string | null;
  type?: string;
  kind?: string;
  direction?: "incoming" | "outgoing" | "funding" | "self";
  from_wallet_id?: string | null;
  to_wallet_id?: string | null;
  asset_id?: string;
  amount?: string | number;
  display_amount?: string;
  fee_units?: string;
  display_fee?: string;
  fee_symbol?: string | null;
  note?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  mock_hash?: string | null;
  counterparty_display_name?: string | null;
  counterparty_name?: string | null;
  counterparty_handle?: string | null;
  counterparty_address?: string | null;
  sender_name?: string | null;
  recipient_name?: string | null;
  asset?: UiAsset;
  mock_wallet_assets?: UiAsset;
};
type UiRow = UiTransfer & { displayDirection: "incoming" | "outgoing" | "funding" | "self"; assetInfo?: UiAsset; displayAmount: string; counterparty: string; createdAt: string };
const filters = ["All", "Received", "Sent"] as const;

export default function TxHistoryScreen() {
  const params = useLocalSearchParams<{ transactionId?: string }>();
  const { assets: contextAssets, ledgerError, loadingTransfers, refreshLedger, selectedWallet, theme, transfers: contextTransfers, wallets } = useAppContext();
  const assets = contextAssets as unknown as UiAsset[];
  const transfers = contextTransfers as unknown as UiTransfer[];
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selected, setSelected] = useState<UiRow | null>(null);
  const [dismissedTransactionId, setDismissedTransactionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo<UiRow[]>(() => transfers.filter((transfer) => {
    if (!selectedWallet || (!transfer.from_wallet_id && !transfer.to_wallet_id)) return false;
    return transfer.from_wallet_id === selectedWallet.id || transfer.to_wallet_id === selectedWallet.id;
  }).map((transfer) => {
    const kind = (transfer.type ?? transfer.kind ?? "").toLowerCase();
    const isFunding = kind.includes("fund") || kind.includes("issue") || transfer.direction === "funding";
    const isFrom = transfer.from_wallet_id === selectedWallet?.id;
    const isTo = transfer.to_wallet_id === selectedWallet?.id;
    const displayDirection: UiRow["displayDirection"] = isFunding
      ? "funding"
      : isFrom && isTo
        ? "self"
        : isFrom
          ? "outgoing"
          : isTo
            ? "incoming"
            : transfer.direction ?? "self";
    const assetInfo = transfer.asset ?? transfer.mock_wallet_assets ?? assets.find((asset) => asset.id === transfer.asset_id);
    const counterpartyAddress = transfer.counterparty_address ? shortDemoId(transfer.counterparty_address, 11, 7) : null;
    const otherWalletId = transfer.from_wallet_id === selectedWallet?.id ? transfer.to_wallet_id : transfer.from_wallet_id;
    const otherWalletName = wallets.find((wallet) => wallet.id === otherWalletId)?.name;
    const counterparty = (transfer.direction === "self" ? otherWalletName : null)
      ?? transfer.counterparty_display_name
      ?? transfer.counterparty_name
      ?? transfer.counterparty_handle
      ?? (displayDirection === "outgoing" ? transfer.recipient_name : transfer.sender_name)
      ?? counterpartyAddress
      ?? (displayDirection === "funding" ? "Testnet Faucet" : "Wallet");
    return {
      ...transfer,
      displayDirection,
      assetInfo,
      displayAmount: transfer.display_amount ?? String(transfer.amount ?? "0"),
      counterparty,
      createdAt: transfer.created_at ?? transfer.updated_at ?? new Date().toISOString(),
    };
  }).filter((row) => filter === "All" || (filter === "Received" ? row.displayDirection === "incoming" || row.displayDirection === "funding" : row.displayDirection === "outgoing")), [assets, filter, selectedWallet, transfers, wallets]);

  useEffect(() => {
    if (!params.transactionId || selected || dismissedTransactionId === params.transactionId) return;
    const match = rows.find((row) => row.id === params.transactionId || row.transaction_id === params.transactionId || row.hash === params.transactionId);
    if (match) setSelected(match);
  }, [dismissedTransactionId, params.transactionId, rows, selected]);

  function closeDetails() {
    setDismissedTransactionId(params.transactionId ?? selected?.transaction_id ?? selected?.id ?? null);
    setSelected(null);
  }

  async function refresh() {
    setRefreshing(true);
    try { await refreshLedger(); } finally { setRefreshing(false); }
  }

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, gap: 12 }}>
          <DemoFlowHeader title="Activity" subtitle={selectedWallet?.name ?? "Wallet"} />
          <DemoModeBanner compact />
          <View style={{ flexDirection: "row", padding: 4, borderRadius: 18, backgroundColor: theme.surface, gap: 4 }}>
            {filters.map((item) => (
              <Pressable key={item} onPress={() => setFilter(item)} style={{ flex: 1, minHeight: 36, borderRadius: 14, backgroundColor: filter === item ? "#ffffff" : "transparent", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: filter === item ? theme.text : theme.secondary, fontSize: 12, fontWeight: "900" }}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl colors={[theme.blue]} onRefresh={() => void refresh()} refreshing={refreshing} tintColor={theme.blue} />}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 30, gap: 4 }}
          >
            {loadingTransfers && !transfers.length ? <View style={{ flex: 1, minHeight: 430, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={theme.blue} /></View> : null}
            {!loadingTransfers && rows.map((row) => <ActivityRow key={row.id} onPress={() => setSelected(row)} row={row} />)}
            {!loadingTransfers && !rows.length ? (
              <View style={{ flex: 1, minHeight: 430, alignItems: "center", justifyContent: "center", gap: 11, paddingHorizontal: 24 }}>
                <View style={{ width: 76, height: 76, borderRadius: 28, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="history" size={36} /></View>
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{ledgerError ? "Activity unavailable" : filter === "All" ? "No transactions yet" : `No ${filter.toLowerCase()} transactions`}</Text>
                <Text style={{ color: ledgerError ? theme.negative : theme.secondary, fontSize: 12, textAlign: "center", lineHeight: 18 }}>{ledgerError ?? "Add funds or send to a wallet address. Confirmed activity will appear here."}</Text>
                <View style={{ width: "100%" }}><FlowButton label={ledgerError ? "Try again" : "Add funds"} onPress={() => ledgerError ? void refresh() : router.push("/fund")} secondary /></View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </AppScreen>

      <SheetModal onClose={closeDetails} subtitle={selected ? formatDate(selected.createdAt) : undefined} title="Transaction details" visible={Boolean(selected)}>
        {selected ? <TransactionDetail onDone={closeDetails} row={selected} /> : null}
      </SheetModal>
    </>
  );
}

function ActivityRow({ row, onPress }: { row: UiRow; onPress: () => void }) {
  const { theme } = useAppContext();
  const incoming = row.displayDirection === "incoming" || row.displayDirection === "funding";
  const self = row.displayDirection === "self";
  const title = self ? `Moved to ${row.counterparty}` : row.displayDirection === "funding" ? "Funds added" : incoming ? `Received from ${row.counterparty}` : `Sent to ${row.counterparty}`;
  const network = row.assetInfo?.network_code ?? row.assetInfo?.network;
  return (
    <Pressable onPress={onPress} style={{ minHeight: 76, borderRadius: 17, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 11 }}>
      <View>
        <TokenLogo network={network} symbol={row.assetInfo?.symbol ?? "USD"} size={42} />
        <View style={{ position: "absolute", right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: incoming ? "#e5f8ec" : "#f1efff", borderWidth: 2, borderColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
          <TrustIcon color={incoming ? theme.positive : theme.blue} name={self ? "swap-horizontal" : incoming ? "arrow-down" : "arrow-up"} size={11} />
        </View>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: theme.secondary, fontSize: 10 }}>{formatDate(row.createdAt)} · {capitalize(row.status ?? "completed")}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 3 }}>
        <Text style={{ color: incoming ? theme.positive : theme.text, fontSize: 14, fontWeight: "900" }}>{self ? "" : incoming ? "+" : "-"}{row.displayAmount} {row.assetInfo?.symbol ?? ""}</Text>
        <Text style={{ color: theme.secondary, fontSize: 10 }}>{network ?? "Testnet"}</Text>
      </View>
    </Pressable>
  );
}

function TransactionDetail({ row, onDone }: { row: UiRow; onDone: () => void }) {
  const { theme } = useAppContext();
  const incoming = row.displayDirection === "incoming" || row.displayDirection === "funding";
  const self = row.displayDirection === "self";
  const reference = row.mock_hash ?? row.hash ?? row.transaction_id ?? row.id;
  const network = row.assetInfo?.network_code ?? row.assetInfo?.network ?? "Testnet";
  return (
    <>
      <View style={{ alignItems: "center", gap: 8, paddingVertical: 8 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: incoming ? "#e5f8ec" : "#f1efff", alignItems: "center", justifyContent: "center" }}><TrustIcon color={incoming ? theme.positive : theme.blue} name={self ? "swap-horizontal" : incoming ? "arrow-down" : "arrow-up"} size={30} /></View>
        <Text style={{ color: theme.text, fontSize: 27, fontWeight: "900" }}>{self ? "" : incoming ? "+" : "-"}{row.displayAmount} {row.assetInfo?.symbol ?? ""}</Text>
        <View style={{ minHeight: 24, borderRadius: 12, backgroundColor: row.status === "failed" ? "#fdecec" : "#e5f8ec", paddingHorizontal: 10, justifyContent: "center" }}><Text style={{ color: row.status === "failed" ? theme.negative : theme.positive, fontSize: 10, fontWeight: "900" }}>{capitalize(row.status ?? "completed")}</Text></View>
      </View>
      <FlowCard>
        <DetailRow label={row.displayDirection === "outgoing" || self ? "To" : "From"} value={row.counterparty} />
        {row.counterparty_address ? <DetailRow label="Recipient address" value={row.counterparty_address} /> : null}
        <DetailRow label="Direction" value={capitalize(row.displayDirection)} />
        <DetailRow label="Network" value={network} />
        <DetailRow label="Network fee" value={row.fee_units && BigInt(row.fee_units) > 0n ? `${row.display_fee ?? row.fee_units} ${row.fee_symbol ?? ""}`.trim() : "No fee"} />
        {row.note ? <DetailRow label="Note" value={row.note} /> : null}
        <DetailRow label="Reference" value={shortDemoId(reference, 13, 9)} last />
      </FlowCard>
      <DemoModeBanner compact />
      <FlowButton label="Done" onPress={onDone} secondary />
    </>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { theme } = useAppContext();
  return <View style={{ minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.border }}><Text style={{ color: theme.secondary, fontSize: 11 }}>{label}</Text><Text numberOfLines={2} style={{ maxWidth: "68%", color: theme.text, fontSize: 11, fontWeight: "900", textAlign: "right" }}>{value}</Text></View>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function capitalize(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}
