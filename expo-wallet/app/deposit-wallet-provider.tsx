import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { BrandLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

export default function DepositWalletProviderScreen() {
  const { theme } = useAppContext();

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 30 }}>
        <View style={{ height: 56, alignItems: "center", justifyContent: "center" }}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={{ position: "absolute", left: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <TrustIcon color={theme.secondary} name="arrow-left" size={25} />
          </Pressable>
          <Text style={{ color: theme.text, fontSize: 19, fontWeight: "900" }}>Fund your wallet</Text>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: theme.secondary, fontSize: 14 }}>Select a method</Text>
          <View style={{ borderRadius: 18, backgroundColor: theme.cardSecondary, overflow: "hidden" }}>
            <ProviderRow
              icon={<BrandLogo brand="binance" size={40} />}
              label="Deposit from Binance"
              onPress={() => router.push("/deposit-binance")}
            />
            <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 68 }} />
            <ProviderRow
              icon={<BrandLogo brand="coinbase" size={40} />}
              label="Deposit from Coinbase"
              onPress={() => router.push("/receive")}
            />
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function ProviderRow({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={{ minHeight: 72, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      {icon}
      <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" }}>{label}</Text>
      <TrustIcon color={theme.secondary} name="chevron-right" size={22} />
    </Pressable>
  );
}
