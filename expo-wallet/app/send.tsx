import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SearchInput, SettingRow, WalletPill } from "@/components/trust-ui";
import { formatMoney, listWallets, primaryBalance, transferBetweenWallets } from "@/services/wallet-ledger";
import type { WalletWithBalances } from "@/types/wallet";

export default function SendScreen() {
  const { addressBook, currency, theme } = useAppContext();
  const [wallets, setWallets] = useState<WalletWithBalances[]>([]);
  const [fromWalletId, setFromWalletId] = useState<string | null>(null);
  const [toWalletId, setToWalletId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("10");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listWallets().then((rows) => {
        if (!active) return;
        setWallets(rows);
        setFromWalletId((current) => current || rows[0]?.id || null);
        setToWalletId((current) => current || rows.find((row) => row.id !== rows[0]?.id)?.id || null);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const fromWallet = useMemo(() => wallets.find((wallet) => wallet.id === fromWalletId), [fromWalletId, wallets]);

  async function submit() {
    if (!fromWalletId || !toWalletId) return;
    const parsedAmount = Number(amount);
    if (fromWalletId === toWalletId) {
      Alert.alert("Choose two different wallets");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Enter an amount greater than zero");
      return;
    }

    try {
      setSaving(true);
      await transferBetweenWallets({
        fromWalletId,
        toWalletId,
        assetSymbol: "USD",
        amount: parsedAmount,
        note: "Mock wallet transfer",
      });
      router.back();
    } catch (err) {
      Alert.alert("Transfer failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Send" subtitle="Transfer mock funds between wallets or saved recipients">
      <Card muted>
        <SettingRow icon="⛓" title="Network" subtitle="Choose the network for this transfer" value="Select" onPress={() => router.push("/network-selector")} />
        <SearchInput value={recipient} onChangeText={setRecipient} placeholder="Paste address or pick saved contact" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {addressBook.map((entry) => (
            <Pressable key={entry.id} onPress={() => setRecipient(entry.address)} style={{ minHeight: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>{entry.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      <WalletPicker title="From wallet" wallets={wallets} selectedId={fromWalletId} onSelect={setFromWalletId} />
      <WalletPicker title="To wallet" wallets={wallets} selectedId={toWalletId} onSelect={setToWalletId} />

      <Card>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>Amount</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={inputStyle(theme)} />
        {fromWallet ? <Text style={{ color: theme.secondary }}>Available: {formatMoney(primaryBalance(fromWallet), currency.code)}</Text> : null}
      </Card>

      <Pressable
        disabled={saving}
        onPress={submit}
        style={{
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: saving ? "#9ca3af" : theme.blue,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>{saving ? "Sending..." : "Send amount"}</Text>
      </Pressable>
    </AppScreen>
  );
}

function WalletPicker(props: {
  title: string;
  wallets: WalletWithBalances[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { currency } = useAppContext();

  return (
    <View style={{ gap: 10 }}>
      <Text style={labelStyle}>{props.title}</Text>
      {props.wallets.map((wallet) => (
        <WalletPill
          key={wallet.id}
          title={wallet.name}
          subtitle={formatMoney(primaryBalance(wallet), currency.code)}
          selected={props.selectedId === wallet.id}
          onPress={() => props.onSelect(wallet.id)}
        />
      ))}
    </View>
  );
}

const labelStyle = {
  color: "#15171d",
  fontSize: 17,
  fontWeight: "900" as const,
};

const inputStyle = (theme: { surface: string; text: string }) => ({
  minHeight: 56,
  borderRadius: 14,
  backgroundColor: theme.surface,
  paddingHorizontal: 16,
  color: theme.text,
  fontSize: 18,
  fontWeight: "800" as const,
});
