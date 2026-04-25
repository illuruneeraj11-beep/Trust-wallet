import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "@/context/app-context";
import { font } from "@/theme/colors";

type ScreenProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
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
  icon: string;
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
  icon: string;
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

export function AppScreen({ title, subtitle, right, children, scrollable = true, padded = true }: ScreenProps) {
  const { theme } = useAppContext();

  const content = (
    <View style={{ gap: 18, paddingHorizontal: padded ? 18 : 0, paddingBottom: 120 }}>
      {title ? (
        <View style={{ paddingTop: 8, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: "900" }}>{title}</Text>
            {right}
          </View>
          {subtitle ? <Text style={{ color: theme.secondary, fontSize: 15 }}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
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
          <Text style={{ fontSize: 26 }}>🎭</Text>
        </View>
        <Pressable onPress={onPress} style={{ minHeight: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.blue, fontSize: 12, fontWeight: "900" }}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

export function HeaderIcon({ icon, onPress }: { icon: string; onPress: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>{icon}</Text>
    </Pressable>
  );
}

export function Card({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  const { theme } = useAppContext();

  return <View style={{ borderRadius: 24, backgroundColor: muted ? theme.cardSecondary : theme.surface, padding: 18, gap: 12 }}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onPress }: { title: string; actionLabel?: string; onPress?: () => void }) {
  const { theme } = useAppContext();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.text, fontSize: font.section, fontWeight: "900" }}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onPress}>
          <Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>{actionLabel}</Text>
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
        minHeight: 42,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundColor: active ? theme.blueSoft : theme.surface,
        borderWidth: active ? 0 : 1,
        borderColor: theme.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: active ? theme.blue : theme.secondary, fontSize: 14, fontWeight: "900", textTransform: "capitalize" }}>{label}</Text>
    </Pressable>
  );
}

export function ActionCircle({ icon, label, onPress }: ActionProps) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", gap: 10 }}>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{icon}</Text>
      </View>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

export function EmptyStateCard({ icon, title, subtitle, linkLabel, onPress }: { icon: string; title: string; subtitle: string; linkLabel?: string; onPress?: () => void }) {
  const { theme } = useAppContext();

  return (
    <Card muted>
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 10 }}>
        <View style={{ width: 86, height: 86, borderRadius: 28, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 36 }}>{icon}</Text>
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
    <View style={{ flex: 1, borderRadius: 22, backgroundColor: theme.surface, padding: 18, gap: 10, borderWidth: 1, borderColor: theme.border }}>
      <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: accent ?? theme.text, fontSize: 22, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

export function SheetModal({ visible, title, subtitle, onClose, children }: SheetModalProps) {
  const { theme } = useAppContext();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" }}>
        <Pressable style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.surface, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28, gap: 16 }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 52, height: 5, borderRadius: 999, backgroundColor: theme.border }} />
          </View>
          <View style={{ gap: 4 }}>
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
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: destructive ? theme.negative : theme.text, fontSize: 17, fontWeight: "900" }}>{title}</Text>
        {subtitle ? <Text style={{ color: theme.secondary, fontSize: 13 }}>{subtitle}</Text> : null}
      </View>
      <Text style={{ color: value ? theme.text : theme.secondary, fontSize: 14, fontWeight: "800" }}>{value ?? "›"}</Text>
    </Pressable>
  );
}

export function ToggleRow({ icon, title, subtitle, valueEnabled, onValueChange, onPress }: ToggleRowProps) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 72, borderRadius: 20, backgroundColor: theme.surface, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={{ width: 42, height: 42, borderRadius: 16, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
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
    <Pressable onPress={onPress} style={{ minHeight: 78, borderRadius: 22, backgroundColor: theme.surface, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{symbol.slice(0, 3)}</Text>
        {network ? (
          <View style={{ position: "absolute", right: -2, bottom: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
            <Text style={{ color: theme.blue, fontSize: 9, fontWeight: "900" }}>{network.slice(0, 2)}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{name}</Text>
        <Text style={{ color: theme.secondary, fontSize: 13 }}>{meta}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{price}</Text>
        <Text style={{ color: positive ? theme.positive : theme.negative, fontSize: 13, fontWeight: "900" }}>{change}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

export function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  const { theme } = useAppContext();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.secondary}
      style={{ minHeight: 52, borderRadius: 26, backgroundColor: theme.input, paddingHorizontal: 18, color: theme.text, fontSize: 16, fontWeight: "700" }}
    />
  );
}

export function WalletPill({ title, subtitle, selected, onPress }: { title: string; subtitle: string; selected?: boolean; onPress?: () => void }) {
  const { theme } = useAppContext();

  return (
    <Pressable onPress={onPress} style={{ minHeight: 74, borderRadius: 22, backgroundColor: selected ? theme.blueSoft : theme.surface, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: selected ? theme.blue : theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: selected ? "#fff" : theme.text, fontSize: 16, fontWeight: "900" }}>🛡</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: selected ? theme.blue : theme.text, fontSize: 17, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: theme.secondary, fontSize: 13 }}>{subtitle}</Text>
        </View>
      </View>
      <Text style={{ color: selected ? theme.blue : theme.secondary, fontSize: 16, fontWeight: "900" }}>{selected ? "✓" : "⋯"}</Text>
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
