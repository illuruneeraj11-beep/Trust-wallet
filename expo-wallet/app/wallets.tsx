import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SearchInput, SettingRow, WalletPill } from "@/components/trust-ui";
import { createWallet, formatMoney, listWallets, primaryBalance } from "@/services/wallet-ledger";
import type { WalletWithBalances } from "@/types/wallet";

export default function WalletsScreen() {
  const { currency, setSelectedWalletId, theme } = useAppContext();
  const [wallets, setWallets] = useState<WalletWithBalances[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setWallets(await listWallets());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function addWallet() {
    try {
      setSaving(true);
      await createWallet(name || `Wallet ${wallets.length + 1}`);
      setName("");
      await load();
    } catch (err) {
      Alert.alert("Could not create wallet", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Wallets" subtitle="Manage multi-coin wallets, backups, and imports">
      <Card muted>
        <SettingRow icon="☁" title="Back up wallet" subtitle="Secure the selected wallet to Google Drive or manually" value="Open" onPress={() => router.push("/wallet-backup")} />
        <SettingRow icon="⇪" title="Import wallet" subtitle="Bring an existing recovery phrase or private key" value="Soon" />
      </Card>

      <Card>
        {wallets.map((wallet) => (
          <WalletPill
            key={wallet.id}
            title={wallet.name}
            subtitle={formatMoney(primaryBalance(wallet), currency.code)}
            onPress={() => {
              setSelectedWalletId(wallet.id);
              router.back();
            }}
          />
        ))}
      </Card>

      <Card muted>
        <SearchInput value={name} onChangeText={setName} placeholder={`Wallet ${wallets.length + 1}`} />
        <Pressable
          disabled={saving}
          onPress={addWallet}
          style={{
            height: 58,
            borderRadius: 29,
            backgroundColor: theme.blue,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>{saving ? "Adding..." : "Add wallet"}</Text>
        </Pressable>
      </Card>
    </AppScreen>
  );
}
