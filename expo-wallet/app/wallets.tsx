import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/trust-assets";
import { TrustIcon, type SemanticTrustIconName } from "@/components/trust-icon";
import { SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

export default function WalletsScreen() {
  const { ledgerError, loadingWallets, selectedWalletId, setSelectedWalletId, theme, wallets } = useAppContext();
  const [sheet, setSheet] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const visibleWallets = wallets.map((wallet) => ({ id: wallet.id, name: wallet.name }));

  return (
    <>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.screen, Platform.OS === "web" && styles.webTopInset]}>
          <Header />
          <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Multi-coin wallets</Text>

          <ScrollView
            contentContainerStyle={styles.walletList}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
          >
            {visibleWallets.map((wallet, index) => (
              <WalletRow
                key={wallet.id}
                name={wallet.name}
                onMenu={() => router.push({ pathname: "/wallet-backup", params: { walletId: wallet.id, name: wallet.name } })}
                onPress={() => {
                  setSelectedWalletId(wallet.id);
                  router.back();
                }}
                selected={wallet.id === selectedWalletId || (!selectedWalletId && index === 0)}
              />
            ))}
            {!visibleWallets.length ? (
              <View style={{ minHeight: 110, alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Text style={{ color: ledgerError ? theme.negative : theme.secondary, fontSize: 13, textAlign: "center" }}>
                  {ledgerError ?? (loadingWallets ? "Loading wallets…" : "No wallets yet.")}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { borderColor: theme.border }]}>
            <Pressable
              accessibilityLabel="Add wallet"
              onPress={() => setSheet(true)}
              style={({ pressed }) => [styles.footerButton, { backgroundColor: theme.surface }, pressed && styles.pressed]}
            >
              <Text style={[styles.footerLabel, { color: theme.text }]}>Add wallet</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Sync to Extension"
              onPress={() => setMessage("Sync to Extension")}
              style={({ pressed }) => [styles.footerButton, { backgroundColor: theme.surface }, pressed && styles.pressed]}
            >
              <TrustIcon color={theme.secondary} name="sync-extension" size={22} />
              <Text style={[styles.footerLabel, { color: theme.text }]}>Sync to Extension</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <SheetModal onClose={() => setSheet(false)} title="" visible={sheet}>
        <View style={styles.sheetCloseRow}>
          <Pressable accessibilityLabel="Close" hitSlop={10} onPress={() => setSheet(false)}>
            <TrustIcon color={theme.text} name="close" size={28} />
          </Pressable>
        </View>
        <View style={styles.sheetHero}>
          <View style={[styles.sheetHeroCircle, { backgroundColor: theme.blueSoft }]}>
            <TrustIcon color={theme.blue} name="add-wallet" size={64} />
          </View>
        </View>
        <View style={styles.sheetRows}>
          <SheetRow
            icon="add-wallet"
            onPress={() => {
              setSheet(false);
              router.push({ pathname: "/add-wallet", params: { mode: "create" } });
            }}
            subtitle="Simulation wallet"
            title="Create new wallet"
          />
          <SheetRow
            icon="import-wallet"
            onPress={() => {
              setSheet(false);
              router.push({ pathname: "/add-wallet", params: { mode: "existing" } });
            }}
            subtitle="Import, restore or view-only"
            title="Add existing wallet"
          />
        </View>
      </SheetModal>

      <SheetModal
        onClose={() => setMessage(null)}
        subtitle="Pair this wallet with the Trust Wallet browser extension."
        title={message ?? ""}
        visible={Boolean(message)}
      >
        <View style={{ alignItems: "center", gap: 10, paddingVertical: 6 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.text} name="sync-extension" size={42} /></View>
          <Text style={{ color: theme.secondary, textAlign: "center", fontSize: 14, lineHeight: 20 }}>Open the extension and scan its pairing QR. This build never transfers a recovery phrase.</Text>
        </View>
        <Pressable onPress={() => { setMessage(null); router.push("/qr-scanner"); }} style={[styles.doneButton, { backgroundColor: theme.blue }]}><Text style={styles.doneLabel}>Scan pairing QR</Text></Pressable>
      </SheetModal>
    </>
  );
}

function Header() {
  const { theme } = useAppContext();

  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={styles.headerSide}>
        <TrustIcon color={theme.secondary} name="back" size={29} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Wallets</Text>
      <Pressable accessibilityLabel="Settings" hitSlop={8} onPress={() => router.push("/settings")} style={[styles.headerSide, styles.headerRight]}>
        <TrustIcon color={theme.secondary} name="settings" size={31} />
      </Pressable>
    </View>
  );
}

function WalletRow({
  name,
  selected,
  onPress,
  onMenu,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
  onMenu: () => void;
}) {
  const { theme } = useAppContext();

  return (
    <Pressable
      accessibilityLabel={`${name}${selected ? ", selected" : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.walletRow, { backgroundColor: theme.mutedSurface }, pressed && styles.pressed]}
    >
      <View style={styles.walletLogoWrap}>
        <View style={[styles.walletLogoCircle, { borderColor: theme.text, backgroundColor: theme.background }]}>
          <BrandLogo brand="trust-wallet" size={34} />
        </View>
        {selected ? (
          <View style={[styles.selectedBadge, { backgroundColor: theme.blue, borderColor: theme.background }]}>
            <TrustIcon color="#ffffff" name="selected" size={12} />
          </View>
        ) : null}
      </View>

      <Text style={[styles.walletName, { color: theme.text }]}>{name}</Text>

      <Pressable
        accessibilityLabel={`${name} options`}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          onMenu();
        }}
        style={styles.walletMenu}
      >
        <TrustIcon color={theme.secondary} name="wallet-menu" size={28} />
      </Pressable>
    </Pressable>
  );
}

function SheetRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: SemanticTrustIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { theme } = useAppContext();
  const primary = title.startsWith("Create");

  return (
    <Pressable
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.sheetRow, { backgroundColor: theme.mutedSurface }, pressed && styles.pressed]}
    >
      <View style={[styles.sheetRowIcon, { backgroundColor: primary ? theme.blue : theme.blueSoft }]}>
        <TrustIcon color={primary ? "#ffffff" : theme.blue} name={icon} size={27} />
      </View>
      <View style={styles.sheetRowCopy}>
        <Text style={[styles.sheetRowTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.sheetRowSubtitle, { color: theme.secondary }]}>{subtitle}</Text>
      </View>
      <TrustIcon color={theme.secondary} name="next" size={25} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  webTopInset: {
    paddingTop: 18,
  },
  header: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSide: {
    width: 48,
    height: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "800",
  },
  sectionTitle: {
    paddingHorizontal: 32,
    marginTop: 20,
    marginBottom: 14,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  walletList: {
    paddingHorizontal: 18,
    gap: 12,
    paddingBottom: 20,
  },
  walletRow: {
    minHeight: 60,
    borderRadius: 12,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  walletLogoWrap: {
    width: 42,
    height: 42,
  },
  walletLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  selectedBadge: {
    position: "absolute",
    right: 0,
    top: -3,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  walletName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  walletMenu: {
    width: 42,
    height: 46,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  footerButton: {
    height: 54,
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  footerLabel: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.62,
  },
  sheetCloseRow: {
    minHeight: 28,
    marginTop: -40,
    alignItems: "flex-end",
  },
  sheetHero: {
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeroCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRows: {
    gap: 12,
  },
  sheetRow: {
    minHeight: 68,
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  sheetRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRowCopy: {
    flex: 1,
    gap: 2,
  },
  sheetRowTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  sheetRowSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  doneButton: {
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  doneLabel: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
});
