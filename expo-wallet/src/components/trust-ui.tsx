import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "@/context/app-context";
import { font } from "@/theme/colors";
import { TrustIcon, type TrustIconName } from "@/components/trust-icon";

type ScreenProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  withTabBar?: boolean;
};

type PillProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

type SheetModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

type RowProps = {
  icon: TrustIconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

type ToggleRowProps = RowProps & {
  valueEnabled: boolean;
  onValueChange: (next: boolean) => void;
};

type ActionProps = {
  icon: TrustIconName;
  label: string;
  onPress: () => void;
};

type TokenRowProps = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  meta: string;
  network?: string;
  onPress?: () => void;
  trailing?: ReactNode;
};

export function AppScreen({ title, subtitle, right, children, scrollable = true, padded = true, withTabBar = false }: ScreenProps) {
  const { theme } = useAppContext();
  const insets = useSafeAreaInsets();
  const bottomPadding = withTabBar ? 88 + insets.bottom : 24 + insets.bottom;

  const content = (
    <View style={{ flex: scrollable ? undefined : 1, gap: 18, paddingHorizontal: padded ? 16 : 0, paddingBottom: bottomPadding }}>
      {title ? (
        <View style={{ paddingTop: 8, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>{title}</Text>
            {right}
          </View>
          {subtitle ? <Text style={{ color: theme.secondary, fontSize: 15 }}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, paddingTop: Platform.OS === "web" ? 18 : 0 }} edges={["top"]}>
      {scrollable ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8 }}>
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: 8 }}>{content}</View>
      )}
    </SafeAreaView>
  );
}

export function GradientBanner({ title, subtitle, buttonLabel, onPress }: { title: string; subtitle: string; buttonLabel: string; onPress: () => void }) {
  const { theme } = useAppContext();

  return (
    <LinearGradient colors={["#11085a", "#0500e8", "#6c3dff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: "rgba(255,255,255,0.84)", fontSize: 14, lineHeight: 19 }}>{subtitle}</Text>
      </View>
      <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
        <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}>
          <TrustIcon color="#ffffff" name="drama-masks" size={28} />
        </View>
        <Pressable onPress={onPress} style={{ minHeight: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.blue, fontSize: 12, fontWeight: "900" }}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

export function HeaderIcon({ icon, onPress }: { icon: TrustIconName; onPress: () => void }) {
  const { theme } = useAppContext();
  const accessibilityLabel = icon === "arrow-left" || icon === "back" || icon === "back-compact"
    ? "Back"
    : icon === "close"
      ? "Close"
      : icon === "magnify"
        ? "Search"
        : "Open action";

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }}>
      <TrustIcon color={theme.secondary} name={icon} size={26} />
    </Pressable>
  );
}

export function Card({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  const { theme } = useAppContext();

  return <View style={{ borderRadius: 20, backgroundColor: muted ? theme.cardSecondary : theme.surface, padding: 16, gap: 12 }}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onPress }: { title: string; actionLabel?: string; onPress?: () => void }) {
  const { theme } = useAppContext();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.text, fontSize: font.section, fontWeight: "900" }}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onPress}>
          <Text style={{ color: theme.secondary, fontSize: 28, fontWeight: "900" }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Pill({ label, active, onPress }: PillProps) {
  const { theme } = useAppContext();

  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 34,
        paddingHorizontal: 13,
        borderRadius: 999,
        backgroundColor: active ? "#dedee2" : theme.surface,
        borderWidth: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700", textTransform: "capitalize" }}>{label}</Text>
    </Pressable>
  );
}

export function ActionCircle({ icon, label, onPress }: ActionProps) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", gap: 10 }}>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color="#ffffff" name={icon} size={26} />
      </View>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

export function EmptyStateCard({ icon, title, subtitle, linkLabel, onPress }: { icon: TrustIconName; title: string; subtitle: string; linkLabel?: string; onPress?: () => void }) {
  const { theme } = useAppContext();

  return (
    <Card muted>
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 10 }}>
        <View style={{ width: 86, height: 86, borderRadius: 28, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
          <TrustIcon color={theme.secondary} name={icon} size={38} />
        </View>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", textAlign: "center" }}>{title}</Text>
        <Text style={{ color: theme.secondary, fontSize: 14, textAlign: "center", lineHeight: 20 }}>{subtitle}</Text>
        {linkLabel ? (
          <Pressable onPress={onPress}>
            <Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>{linkLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const { theme } = useAppContext();

  return (
      <View style={{ flex: 1, borderRadius: 18, backgroundColor: "transparent", padding: 18, gap: 10, borderWidth: 1, borderColor: theme.border }}>
      <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: accent ?? theme.text, fontSize: 22, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

export function SheetModal({ visible, title, subtitle, onClose, children }: SheetModalProps) {
  const { theme } = useAppContext();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" }}>
        <Pressable style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.surface, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 20 + insets.bottom, gap: 16 }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 52, height: 5, borderRadius: 999, backgroundColor: theme.secondary }} />
          </View>
          <View style={{ gap: 4, alignItems: "center" }}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>{title}</Text>
            {subtitle ? <Text style={{ color: theme.secondary, fontSize: 14 }}>{subtitle}</Text> : null}
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SettingRow({ icon, title, subtitle, value, onPress, destructive }: RowProps) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 72, borderRadius: 20, backgroundColor: theme.surface, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={{ width: 42, height: 42, borderRadius: 16, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color={destructive ? theme.negative : theme.secondary} name={icon} size={22} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: destructive ? theme.negative : theme.text, fontSize: 17, fontWeight: "900" }}>{title}</Text>
        {subtitle ? <Text style={{ color: theme.secondary, fontSize: 13 }}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800" }}>{value}</Text> : <TrustIcon color={theme.secondary} name="chevron-right" size={22} />}
    </Pressable>
  );
}

export function ToggleRow({ icon, title, subtitle, valueEnabled, onValueChange, onPress }: ToggleRowProps) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 72, borderRadius: 20, backgroundColor: theme.surface, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={{ width: 42, height: 42, borderRadius: 16, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color={theme.secondary} name={icon} size={22} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{title}</Text>
        {subtitle ? <Text style={{ color: theme.secondary, fontSize: 13 }}>{subtitle}</Text> : null}
      </View>
      <Switch value={valueEnabled} onValueChange={onValueChange} thumbColor="#fff" trackColor={{ false: theme.border, true: theme.blue }} />
    </Pressable>
  );
}

export function TokenRow({ symbol, name, price, change, meta, network, onPress, trailing }: TokenRowProps) {
  const { theme } = useAppContext();
  const positive = change.startsWith("+");

  return (
    <Pressable onPress={onPress} style={{ minHeight: 70, borderRadius: 0, backgroundColor: "transparent", paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <TokenAvatar symbol={symbol} network={network} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{name}</Text>
        <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 14, fontWeight: "700" }}>{meta}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{price}</Text>
        <Text style={{ color: positive ? theme.positive : theme.negative, fontSize: 14, fontWeight: "800" }}>{change}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

export function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  const { theme } = useAppContext();

  return (
    <View style={{ minHeight: 42, borderRadius: 21, backgroundColor: theme.input, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
      <TrustIcon color={theme.secondary} name="magnify" size={19} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondary}
        style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "600", paddingVertical: 0 }}
      />
    </View>
  );
}

export function WalletPill({ title, subtitle, selected, onPress }: { title: string; subtitle: string; selected?: boolean; onPress?: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 74, borderRadius: 22, backgroundColor: selected ? theme.blueSoft : theme.surface, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: selected ? theme.blue : theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
          <TrustIcon color={selected ? "#ffffff" : theme.text} name={selected ? "shield-check" : "shield-outline"} size={22} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: selected ? theme.blue : theme.text, fontSize: 17, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: theme.secondary, fontSize: 13 }}>{subtitle}</Text>
        </View>
      </View>
      <TrustIcon color={selected ? theme.blue : theme.secondary} name={selected ? "check-circle" : "dots-horizontal"} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 120,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    gap: 14,
  },
});

export function TokenAvatar({ symbol, network, size = 48 }: { symbol: string; network?: string; size?: number }) {
  const palette = tokenPalette(symbol);
  const asset = tokenAssets[symbol.toUpperCase()];
  const networkAsset = network ? tokenAssets[network.toUpperCase()] : undefined;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center", overflow: "visible" }}>
      {asset ? <Image source={asset} resizeMode="contain" style={{ width: size, height: size, borderRadius: size / 2 }} /> : <TrustIcon color={palette.fg} name="currency-usd" size={Math.max(18, size * 0.58)} />}
      {network ? (
        <View style={{ position: "absolute", right: -3, bottom: -3, width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19, backgroundColor: tokenPalette(network).bg, borderWidth: 2, borderColor: "#181818", alignItems: "center", justifyContent: "center" }}>
          {networkAsset ? <Image source={networkAsset} resizeMode="contain" style={{ width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17 }} /> : <TrustIcon color={tokenPalette(network).fg} name="web" size={Math.max(9, size * 0.2)} />}
        </View>
      ) : null}
    </View>
  );
}
const tokenAssets: Record<string, number> = {
  AETHWETH: require("../../assets/tokens/AETHWETH.png"),
  ASTER: require("../../assets/tokens/ASTER.png"),
  AAVE: require("../../assets/tokens/AAVE.png"),
  BNB: require("../../assets/tokens/BNB.png"),
  BTC: require("../../assets/tokens/BTC.png"),
  DEXE: require("../../assets/tokens/DEXE.png"),
  ETH: require("../../assets/tokens/ETH.png"),
  HYPE: require("../../assets/tokens/HYPE.png"),
  LINK: require("../../assets/tokens/LINK.png"),
  PAXG: require("../../assets/tokens/PAXG.png"),
  RIVER: require("../../assets/tokens/RIVER.png"),
  SOL: require("../../assets/tokens/SOL.png"),
  TWT: require("../../assets/tokens/TWT_BADGE_BNB.png"),
  XAUT: require("../../assets/tokens/XAUT.png"),
  XRP: require("../../assets/tokens/XRP.png"),
};

function tokenPalette(symbol: string) {
  const upper = symbol.toUpperCase();
  const map: Record<string, { bg: string; fg: string }> = {
    BTC: { bg: "#f59f25", fg: "#ffffff" },
    ETH: { bg: "#f6f7f8", fg: "#34383f" },
    SOL: { bg: "#050505", fg: "#61f5d4" },
    BNB: { bg: "#111315", fg: "#f3ba2f" },
    TRX: { bg: "#ed1b2f", fg: "#ffffff" },
    TWT: { bg: "#ffffff", fg: "#083cff" },
    USDT: { bg: "#2aa986", fg: "#ffffff" },
    USDC: { bg: "#2775ca", fg: "#ffffff" },
    ARB: { bg: "#213147", fg: "#8ab7ff" },
    BASE: { bg: "#f4f7ff", fg: "#235cff" },
    LINK: { bg: "#2a5ada", fg: "#ffffff" },
    AAVE: { bg: "#8f82ff", fg: "#ffffff" },
    ASTER: { bg: "#080808", fg: "#f2c98c" },
    XAUT: { bg: "#8f7a44", fg: "#ffffff" },
    DEXE: { bg: "#050505", fg: "#ffffff" },
    STARS: { bg: "#050505", fg: "#f6d552" },
    JUNO: { bg: "#1d1d22", fg: "#ff808b" },
    KSM: { bg: "#050505", fg: "#ffffff" },
  };

  return map[upper] ?? { bg: "#303034", fg: "#f4f4f5" };
}
