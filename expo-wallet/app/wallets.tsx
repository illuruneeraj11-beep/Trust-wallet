import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { createWallet, listWallets } from "@/services/wallet-ledger";
import type { WalletWithBalances } from "@/types/wallet";

export default function WalletsScreen() {
  const { selectedWalletId, setSelectedWalletId, theme } = useAppContext();
  const [wallets, setWallets] = useState<WalletWithBalances[]>([]);
  const [adding, setAdding] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const visibleWallets = wallets.length
    ? wallets.slice(0, 2).map((wallet, index) => ({ id: wallet.id, name: index === 0 ? "Main Wallet 1" : "Main Wallet 2" }))
    : [
        { id: "wallet-main", name: "Main Wallet 1" },
        { id: "wallet-secondary", name: "Main Wallet 2" },
      ];

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
      setAdding(true);
      await createWallet(`Main Wallet ${wallets.length + 1}`);
      setSheet(false);
      await load();
    } catch (err) {
      Alert.alert("Could not create wallet", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Header />
          <Text style={{ color: theme.secondary, fontSize: 18, fontWeight: "900", marginBottom: 16 }}>Multi-coin wallets</Text>

          <View style={{ gap: 18 }}>
            {visibleWallets.map((wallet, index) => (
              <WalletRow
                key={wallet.id}
                name={wallet.name}
                selected={wallet.id === selectedWalletId || (!selectedWalletId && index === 0)}
                onPress={() => {
                  setSelectedWalletId(wallet.id);
                  router.back();
                }}
                onMenu={() => router.push("/wallet-backup")}
              />
            ))}
          </View>

          <View style={{ flex: 1 }} />
          <View style={{ borderTopWidth: 1, borderColor: theme.border, paddingTop: 22, gap: 18, paddingBottom: 24 }}>
            <Pressable onPress={() => setSheet(true)} style={{ height: 58, borderRadius: 29, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{adding ? "Adding..." : "Add wallet"}</Text>
            </Pressable>
            <Pressable onPress={() => setMessage("Sync to Extension")} style={{ height: 58, borderRadius: 29, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 }}>
              <Text style={{ color: theme.secondary, fontSize: 22 }}>⌘</Text>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>Sync to Extension</Text>
            </Pressable>
          </View>
        </View>
      </AppScreen>

      <SheetModal visible={sheet} title="" onClose={() => setSheet(false)}>
        <View style={{ alignItems: "flex-end", marginTop: -38 }}>
          <Pressable onPress={() => setSheet(false)}><Text style={{ color: theme.text, fontSize: 34 }}>×</Text></Pressable>
        </View>
        <View style={{ alignItems: "center", paddingVertical: 14 }}>
          <Text style={{ fontSize: 110, lineHeight: 126 }}>👝</Text>
        </View>
        <View style={{ gap: 18 }}>
          <SheetRow icon="✦" title="Create new wallet" subtitle="Secret phrase" onPress={addWallet} />
          <SheetRow icon="↓" title="Add existing wallet" subtitle="Import, restore or view-only" onPress={() => { setSheet(false); setMessage("Add existing wallet"); }} />
        </View>
      </SheetModal>
      <SheetModal visible={!!message} title={message ?? ""} subtitle="This wallet option is connected." onClose={() => setMessage(null)}>
        <Pressable onPress={() => setMessage(null)} style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Done</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function Header() {
  const { theme } = useAppContext();

  return (
    <View style={{ height: 82, alignItems: "center", justifyContent: "center" }}>
      <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 48, height: 48, justifyContent: "center" }}>
        <Text style={{ color: theme.secondary, fontSize: 38 }}>‹</Text>
      </Pressable>
      <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Wallets</Text>
      <Pressable onPress={() => router.push("/settings")} style={{ position: "absolute", right: 0 }}>
        <Text style={{ color: theme.secondary, fontSize: 30 }}>⚙</Text>
      </Pressable>
    </View>
  );
}

function WalletRow({ name, selected, onPress, onMenu }: { name: string; selected: boolean; onPress: () => void; onMenu: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 74, borderRadius: 6, backgroundColor: theme.surface, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 18 }}>
      <View>
        <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: theme.text, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.blue, fontSize: 28 }}>⬟</Text>
        </View>
        {selected ? (
          <View style={{ position: "absolute", right: -4, top: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>✓</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ flex: 1, color: theme.text, fontSize: 20, fontWeight: "900" }}>{name}</Text>
      <Pressable onPress={onMenu} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.secondary, fontSize: 28 }}>⋮</Text>
      </Pressable>
    </Pressable>
  );
}

function SheetRow({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 86, borderRadius: 14, backgroundColor: theme.mutedSurface, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: title.startsWith("Create") ? theme.blue : theme.blueSoft, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: title.startsWith("Create") ? "#fff" : theme.blue, fontSize: 26, fontWeight: "900" }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: theme.secondary, fontSize: 16 }}>{subtitle}</Text>
      </View>
      <Text style={{ color: theme.secondary, fontSize: 34 }}>›</Text>
    </Pressable>
  );
}
