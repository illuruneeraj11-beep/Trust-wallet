import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { currencyOptions } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, Pill, SearchInput, WalletPill } from "@/components/trust-ui";
import { fundWallet, listWallets } from "@/services/wallet-ledger";
import type { WalletWithBalances } from "@/types/wallet";

export default function FundScreen() {
  const { currency, setCurrencyCode, theme } = useAppContext();
  const [wallets, setWallets] = useState<WalletWithBalances[]>([]);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [last4, setLast4] = useState("4242");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listWallets().then((rows) => {
        if (!active) return;
        setWallets(rows);
        setWalletId((current) => current || rows[0]?.id || null);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  async function submit() {
    if (!walletId) return;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Enter an amount greater than zero");
      return;
    }
    if (!/^[0-9]{4}$/.test(last4)) {
      Alert.alert("Use any four digits for the dummy card");
      return;
    }

    try {
      setSaving(true);
      await fundWallet({
        walletId,
        assetSymbol: "USD",
        amount: parsedAmount,
        dummyCardLast4: last4,
        dummyCardBrand: "Demo Visa",
      });
      router.back();
    } catch (err) {
      Alert.alert("Funding failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Buy Crypto" subtitle="Top up your mock wallet with a Trust-style funding flow">
      <Card muted>
        <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "800" }}>Amount</Text>
        <Text style={{ color: theme.text, fontSize: 40, fontWeight: "900" }}>{currency.symbol || currency.code} {amount}</Text>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {currencyOptions.slice(0, 5).map((option) => (
            <Pill key={option.code} label={option.code} active={currency.code === option.code} onPress={() => setCurrencyCode(option.code)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={labelStyle}>Wallet</Text>
        {wallets.map((wallet) => (
          <WalletPill key={wallet.id} title={wallet.name} subtitle="Receive purchased funds" selected={walletId === wallet.id} onPress={() => setWalletId(wallet.id)} />
        ))}
      </Card>

      <Card muted>
        <Text style={labelStyle}>Buy amount</Text>
        <SearchInput value={amount} onChangeText={setAmount} placeholder="100.00" />
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {["50", "100", "250", "500", "1000"].map((preset) => (
            <Pill key={preset} label={preset} active={amount === preset} onPress={() => setAmount(preset)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={labelStyle}>Dummy card last 4</Text>
        <TextInput value={last4} onChangeText={setLast4} keyboardType="number-pad" maxLength={4} style={inputStyle(theme)} />
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
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>{saving ? "Adding..." : "Continue"}</Text>
      </Pressable>
    </AppScreen>
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
