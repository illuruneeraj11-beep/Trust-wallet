import { router } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon, type TrustIconName } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";

export function DemoFlowHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const { theme } = useAppContext();
  return (
    <View style={{ minHeight: subtitle ? 68 : 55, alignItems: "center", justifyContent: "center", paddingHorizontal: 48 }}>
      <Pressable
        accessibilityLabel="Go back"
        onPress={onBack ?? (() => router.back())}
        style={{ position: "absolute", left: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <TrustIcon color={theme.secondary} name="arrow-left" size={24} />
      </Pressable>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", textAlign: "center" }}>{title}</Text>
      {subtitle ? <Text style={{ color: theme.secondary, fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 3 }}>{subtitle}</Text> : null}
      {right ? <View style={{ position: "absolute", right: 0 }}>{right}</View> : null}
    </View>
  );
}

export function DemoModeBanner({ compact = false }: { compact?: boolean }) {
  const { theme } = useAppContext();
  return (
    <View style={{ minHeight: compact ? 34 : 48, borderRadius: 14, backgroundColor: "#f1efff", paddingHorizontal: 12, paddingVertical: compact ? 7 : 10, flexDirection: "row", alignItems: "center", gap: 9 }}>
      <View style={{ width: compact ? 20 : 28, height: compact ? 20 : 28, borderRadius: compact ? 10 : 14, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color="#ffffff" name="flask-outline" size={compact ? 12 : 16} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: compact ? 11 : 13, fontWeight: "900" }}>Testnet</Text>
        {!compact ? <Text style={{ color: theme.secondary, fontSize: 10, lineHeight: 15 }}>Test balances are isolated from public blockchains and cannot be withdrawn.</Text> : null}
      </View>
    </View>
  );
}

export function FlowCard({ children, onPress, muted = false }: { children: ReactNode; onPress?: () => void; muted?: boolean }) {
  const { theme } = useAppContext();
  const style = { borderRadius: 17, backgroundColor: muted ? theme.mutedSurface : theme.surface, paddingHorizontal: 15, paddingVertical: 14 };
  return onPress ? <Pressable onPress={onPress} style={style}>{children}</Pressable> : <View style={style}>{children}</View>;
}

export function FlowLabel({ children }: { children: ReactNode }) {
  const { theme } = useAppContext();
  return <Text style={{ color: theme.secondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 }}>{children}</Text>;
}

export function FlowTextInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  maxLength,
  autoCapitalize = "none",
  right,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  right?: ReactNode;
}) {
  const { theme } = useAppContext();
  return (
    <View style={{ minHeight: multiline ? 84 : 54, borderRadius: 16, backgroundColor: theme.input, paddingHorizontal: 15, flexDirection: "row", alignItems: multiline ? "flex-start" : "center", gap: 8 }}>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondary}
        style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: "700", paddingVertical: multiline ? 14 : 0 }}
        value={value}
      />
      {right}
    </View>
  );
}

export function FlowButton({ label, onPress, disabled, loading, secondary, icon }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; secondary?: boolean; icon?: TrustIconName }) {
  const { theme } = useAppContext();
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={{ height: 54, borderRadius: 27, backgroundColor: secondary ? theme.surface : inactive ? theme.blueSoft : theme.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
    >
      {loading ? <ActivityIndicator color={secondary ? theme.blue : "#ffffff"} /> : icon ? <TrustIcon color={secondary ? theme.blue : "#ffffff"} name={icon} size={19} /> : null}
      <Text style={{ color: secondary ? theme.blue : inactive ? "#9691af" : "#ffffff", fontSize: 15, fontWeight: "900" }}>{loading ? "Processing..." : label}</Text>
    </Pressable>
  );
}

export function AssetChoiceRow({ symbol, name, network, balance, active, onPress }: { symbol: string; name: string; network?: string; balance?: string; active?: boolean; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 64, borderRadius: 16, backgroundColor: active ? theme.blueSoft : theme.cardSecondary, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 11 }}>
      <TokenLogo network={network} symbol={symbol} size={38} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{symbol}</Text>
        <Text style={{ color: theme.secondary, fontSize: 11 }}>{name}{network ? ` · ${network}` : ""}</Text>
      </View>
      {balance ? <Text style={{ color: theme.text, fontSize: 13, fontWeight: "800" }}>{balance}</Text> : null}
      <TrustIcon color={active ? theme.blue : theme.secondary} name={active ? "check-circle" : "chevron-right"} size={20} />
    </Pressable>
  );
}

export function StepDots({ step, count }: { step: number; count: number }) {
  const { theme } = useAppContext();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
      {Array.from({ length: count }, (_, index) => <View key={index} style={{ width: index === step ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: index <= step ? theme.blue : theme.border }} />)}
    </View>
  );
}

export function ResultPanel({ success, title, message, detail }: { success: boolean; title: string; message: string; detail?: ReactNode }) {
  const { theme } = useAppContext();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 24 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: success ? "#e5f8ec" : "#fdecec", alignItems: "center", justifyContent: "center" }}>
        <TrustIcon color={success ? theme.positive : theme.negative} name={success ? "check" : "alert-circle-outline"} size={44} />
      </View>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900", textAlign: "center" }}>{title}</Text>
      <Text style={{ color: theme.secondary, fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 300 }}>{message}</Text>
      {detail}
    </View>
  );
}

export function shortDemoId(value: string | null | undefined, head = 9, tail = 6) {
  if (!value) return "—";
  const displayValue = value.replace(/^demo(?::|_|-)+/i, "").replace(/^visual-/i, "");
  return displayValue.length <= head + tail + 3 ? displayValue : `${displayValue.slice(0, head)}...${displayValue.slice(-tail)}`;
}

export function newIdempotencyKey(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

export function normalizeDecimalInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...fractionParts] = cleaned.split(".");
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "");
  return fractionParts.length ? `${normalizedWhole || "0"}.${fractionParts.join("")}` : normalizedWhole;
}
