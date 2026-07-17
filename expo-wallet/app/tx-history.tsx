import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Pill } from "@/components/trust-ui";

const tabs = ["Transaction History", "Orders", "Order History"];

export default function TxHistoryScreen() {
  const { loadingTransfers, transfers, theme } = useAppContext();
  const [active, setActive] = useState(tabs[0]);
  const rows = useMemo(() => transfers.map((transfer) => ({
    id: transfer.id,
    title: transfer.note || "Wallet transfer",
    amount: Number(transfer.amount || 0).toFixed(2),
    date: new Date(transfer.created_at).toLocaleString(),
  })), [transfers]);

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <View style={{ height: 60, alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" }}>
            <Text style={{ color: theme.secondary, fontSize: 34 }}>‹</Text>
          </Pressable>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>History</Text>
        </View>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: theme.border }}>
          {tabs.map((tab) => (
            <Pressable key={tab} onPress={() => setActive(tab)} style={{ flex: 1, paddingBottom: 10, borderBottomWidth: 3, borderBottomColor: active === tab ? theme.blue : "transparent" }}>
              <Text numberOfLines={1} style={{ color: active === tab ? theme.text : theme.secondary, fontSize: 13, fontWeight: "900", textAlign: "center" }}>{tab}</Text>
            </Pressable>
          ))}
        </View>
        {loadingTransfers ? (
          <View style={{ flex: 1, minHeight: 520, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={theme.blue} />
          </View>
        ) : active !== "Transaction History" ? (
          <View style={{ gap: 24 }}>
            <View style={{ alignSelf: "flex-start" }}>
              <Pill label="All networks ▼" active={false} onPress={() => undefined} />
            </View>
            <View style={{ flex: 1, minHeight: 460, alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Text style={{ color: theme.secondary, fontSize: 16 }}>No orders yet</Text>
            </View>
          </View>
        ) : rows.length ? (
          rows.map((row) => (
            <View key={row.id} style={{ minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 28 }}>↓</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{row.title}</Text>
                <Text style={{ color: theme.secondary, fontSize: 13 }}>{row.date}</Text>
              </View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>${row.amount}</Text>
            </View>
          ))
        ) : (
          <View style={{ flex: 1, minHeight: 520, alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Text style={{ color: theme.secondary, fontSize: 16 }}>No transactions yet</Text>
          </View>
        )}
      </View>
    </AppScreen>
  );
}
