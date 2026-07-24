import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SheetModal } from "@/components/trust-ui";
import { BrandLogo } from "@/components/trust-assets";
import {
  TrustBrandIcon,
  type TrustBrandIconName,
  TrustIcon,
  type SemanticTrustIconName,
} from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";

type SettingItem = {
  icon: SemanticTrustIconName;
  title: string;
  route?: string;
  url?: string;
};

const primaryRows: SettingItem[] = [
  { icon: "address-book", title: "Address Book", route: "/address-book" },
  { icon: "sync-extension", title: "Sync to Extension" },
  { icon: "trust-handle", title: "Trust handles", route: "/preferences" },
  { icon: "scan-qr", title: "Scan QR code", route: "/qr-scanner" },
  { icon: "wallet-connect", title: "WalletConnect" },
];

const securityRows: SettingItem[] = [
  { icon: "preferences", title: "Preferences", route: "/preferences" },
  { icon: "security", title: "Security", route: "/security" },
  { icon: "notifications", title: "Notifications" },
];

const informationRows: SettingItem[] = [
  { icon: "support", title: "Support", url: "https://support.trustwallet.com/en/support/home" },
  { icon: "about", title: "About" },
];

const socialRows: { icon: TrustBrandIconName; title: string; url: string }[] = [
  { icon: "x", title: "X", url: "https://x.com/TrustWallet" },
  { icon: "telegram", title: "Telegram", url: "https://t.me/trustwallet" },
  { icon: "facebook", title: "Facebook", url: "https://www.facebook.com/trustwalletapp" },
  { icon: "reddit", title: "Reddit", url: "https://www.reddit.com/r/trustapp" },
  { icon: "youtube", title: "Youtube", url: "https://www.youtube.com/@TrustWallet" },
  { icon: "instagram", title: "Instagram", url: "https://www.instagram.com/trustwallet" },
  { icon: "tiktok", title: "TikTok", url: "https://www.tiktok.com/@trustwallet" },
];

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ open?: string }>();
  const { theme, themeMode, toggleThemeMode } = useAppContext();
  const { authLoading, signOut, user, visualDemo } = useAuth();
  const [sheet, setSheet] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (params.open === "WalletConnect") setSheet("WalletConnect");
  }, [params.open]);

  async function handleSetting(item: SettingItem) {
    if (item.route) {
      router.push(item.route as never);
      return;
    }
    if (item.url) {
      try {
        await Linking.openURL(item.url);
      } catch {
        setSheet(item.title);
      }
      return;
    }
    setSheet(item.title);
  }

  async function openSocial(title: string, url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setSheet(title);
    }
  }

  return (
    <>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.screen, Platform.OS === "web" && styles.webTopInset]}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={styles.headerSide}>
              <TrustIcon color={theme.secondary} name="back" size={29} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
            <View style={styles.headerSide} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Trust Premium</Text>
              <Pressable
                accessibilityLabel="Begin Trust Premium"
                onPress={() => setSheet("Trust Premium")}
                style={({ pressed }) => [
                  styles.premiumCard,
                  { backgroundColor: theme.mutedSurface, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <PremiumTierArt />
                <View style={styles.premiumCopy}>
                  <Text style={[styles.premiumTitle, { color: theme.text }]}>Bronze</Text>
                  <Text style={[styles.premiumSubtitle, { color: theme.secondary }]}>Unlock exclusive rewards</Text>
                </View>
                <View style={[styles.beginButton, { backgroundColor: theme.blue }]}>
                  <Text style={styles.beginLabel}>Begin</Text>
                </View>
              </Pressable>

              <View style={styles.darkModeRow}>
                <View style={styles.settingIconSlot}>
                  <TrustIcon color={theme.secondary} name="dark-mode" size={29} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                <Switch
                  accessibilityLabel="Dark Mode"
                  onValueChange={toggleThemeMode}
                  style={styles.switch}
                  thumbColor="#ffffff"
                  trackColor={{ false: "#b4b4b6", true: theme.blue }}
                  value={themeMode === "dark"}
                />
              </View>
            </View>

            <Divider color={theme.border} />
            <View style={styles.rowsBlock}>
              {primaryRows.map((row) => (
                <SettingLine key={row.title} icon={row.icon} title={row.title} onPress={() => void handleSetting(row)} />
              ))}
            </View>

            <Divider color={theme.border} />
            <View style={styles.rowsBlock}>
              {securityRows.map((row) => (
                <SettingLine key={row.title} icon={row.icon} title={row.title} onPress={() => void handleSetting(row)} />
              ))}
            </View>

            <Divider color={theme.border} />
            <View style={styles.rowsBlock}>
              {informationRows.map((row) => (
                <SettingLine key={row.title} icon={row.icon} title={row.title} onPress={() => void handleSetting(row)} />
              ))}
            </View>

            {!visualDemo && user ? (
              <>
                <Divider color={theme.border} />
                <View style={styles.rowsBlock}>
                  <View style={styles.accountSummary}>
                    <View style={[styles.accountAvatar, { backgroundColor: theme.blueSoft }]}>
                      <TrustIcon color={theme.blue} name="account-circle-outline" size={25} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.accountTitle, { color: theme.text }]}>Wallet account</Text>
                      <Text numberOfLines={1} style={[styles.accountEmail, { color: theme.secondary }]}>{user.email}</Text>
                    </View>
                  </View>
                  <SettingLine
                    icon="sign-out"
                    title={authLoading ? "Signing out…" : "Sign out"}
                    onPress={() => { if (!authLoading) void signOut(); }}
                  />
                </View>
              </>
            ) : null}

            <Divider color={theme.border} />
            <View style={styles.rowsBlock}>
              {socialRows.map((row) => (
                <SocialLine key={row.title} icon={row.icon} title={row.title} onPress={() => void openSocial(row.title, row.url)} />
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      <SheetModal
        onClose={() => setSheet(null)}
        subtitle={sheet === "Trust Premium" ? "Unlock exclusive rewards with Trust Premium." : undefined}
        title={sheet ?? ""}
        visible={Boolean(sheet)}
      >
        <SettingsSheetContent
          notificationsEnabled={notificationsEnabled}
          onClose={() => setSheet(null)}
          onNotificationsChange={setNotificationsEnabled}
          sheet={sheet}
        />
      </SheetModal>
    </>
  );
}

function SettingsSheetContent({
  sheet,
  notificationsEnabled,
  onNotificationsChange,
  onClose,
}: {
  sheet: string | null;
  notificationsEnabled: boolean;
  onNotificationsChange: (value: boolean) => void;
  onClose: () => void;
}) {
  const { theme } = useAppContext();

  if (sheet === "Sync to Extension") {
    return <>
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.text} name="sync-extension" size={42} /></View>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>Pair with Trust Wallet Extension</Text>
        <Text style={{ color: theme.secondary, textAlign: "center", fontSize: 14, lineHeight: 20 }}>Open the browser extension and scan its pairing QR code. Wallet secrets never leave this device.</Text>
      </View>
      <Pressable onPress={() => { onClose(); router.push("/qr-scanner"); }} style={[styles.doneButton, { backgroundColor: theme.blue }]}><Text style={styles.doneLabel}>Scan pairing QR</Text></Pressable>
    </>;
  }

  if (sheet === "WalletConnect") {
    return <>
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
        <BrandLogo brand="walletconnect" size={64} />
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>No active connections</Text>
        <Text style={{ color: theme.secondary, textAlign: "center", fontSize: 14, lineHeight: 20 }}>Review and disconnect sessions here. New connection signing is unavailable on testnet.</Text>
      </View>
      <Pressable onPress={() => { onClose(); router.push("/qr-scanner"); }} style={[styles.doneButton, { backgroundColor: theme.blue }]}><Text style={styles.doneLabel}>Scan connection QR</Text></Pressable>
    </>;
  }

  if (sheet === "Notifications") {
    return <>
      <View style={{ minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TrustIcon color={theme.secondary} name="notifications" size={24} />
        <View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Push notifications</Text><Text style={{ color: theme.secondary, fontSize: 13 }}>Notification preference</Text></View>
        <Switch value={notificationsEnabled} onValueChange={onNotificationsChange} thumbColor="#ffffff" trackColor={{ false: "#b4b4b6", true: theme.blue }} />
      </View>
      <Pressable onPress={onClose} style={[styles.doneButton, { backgroundColor: theme.blue }]}><Text style={styles.doneLabel}>Done</Text></Pressable>
    </>;
  }

  if (sheet === "About") {
    return <>
      <View style={{ alignItems: "center", gap: 9, paddingVertical: 8 }}>
        <BrandLogo brand="trust-wallet" size={68} />
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>Trust Wallet</Text>
        <Text style={{ color: theme.secondary, textAlign: "center", fontSize: 13, lineHeight: 19 }}>Testnet environment. It never requests a recovery phrase or moves assets on a public blockchain.</Text>
      </View>
      <Pressable onPress={onClose} style={[styles.doneButton, { backgroundColor: theme.blue }]}><Text style={styles.doneLabel}>Done</Text></Pressable>
    </>;
  }

  return <Pressable onPress={onClose} style={[styles.doneButton, { backgroundColor: theme.blue }]}><Text style={styles.doneLabel}>Done</Text></Pressable>;
}

function PremiumTierArt() {
  return (
    <View accessibilityLabel="Bronze tier" style={styles.premiumArt}>
      <Image source={require("../assets/artwork/bronze-fedora.png")} resizeMode="contain" style={{ width: 54, height: 50 }} />
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

function SettingLine({
  icon,
  title,
  onPress,
}: {
  icon: SemanticTrustIconName;
  title: string;
  onPress: () => void;
}) {
  const { theme } = useAppContext();

  return (
    <Pressable
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
    >
      <View style={styles.settingIconSlot}>
        <TrustIcon color={theme.secondary} name={icon} size={22} />
      </View>
      <Text style={[styles.settingLabel, { color: theme.text }]}>{title}</Text>
    </Pressable>
  );
}

function SocialLine({
  icon,
  title,
  onPress,
}: {
  icon: TrustBrandIconName;
  title: string;
  onPress: () => void;
}) {
  const { theme } = useAppContext();

  return (
    <Pressable
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
    >
      <View style={styles.settingIconSlot}>
        <View style={[styles.socialIconFrame, { borderColor: theme.border }]}>
          <TrustBrandIcon color={theme.secondary} name={icon} size={16} />
        </View>
      </View>
      <Text style={[styles.settingLabel, { color: theme.text }]}>{title}</Text>
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
  headerTitle: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 34,
  },
  sectionBlock: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  premiumCard: {
    minHeight: 76,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  premiumArt: {
    width: 50,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumCopy: {
    flex: 1,
    gap: 2,
  },
  premiumTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  premiumSubtitle: {
    maxWidth: 128,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  beginButton: {
    minWidth: 78,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  beginLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  darkModeRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
  },
  rowsBlock: {
    paddingHorizontal: 18,
  },
  settingRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIconSlot: {
    width: 38,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  socialIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  accountSummary: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  accountTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  accountEmail: {
    fontSize: 12,
    lineHeight: 16,
  },
  switch: {
    transform: [{ scale: 0.92 }],
  },
  divider: {
    height: 1,
  },
  pressed: {
    opacity: 0.62,
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
