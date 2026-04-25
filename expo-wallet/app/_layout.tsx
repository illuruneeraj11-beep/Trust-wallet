import { Stack } from "expo-router";
import { AppProvider } from "@/context/app-context";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f4f4f7" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="wallets" options={{ presentation: "card" }} />
        <Stack.Screen name="fund" options={{ presentation: "modal" }} />
        <Stack.Screen name="send" options={{ presentation: "modal" }} />
        <Stack.Screen name="receive" options={{ presentation: "modal" }} />
        <Stack.Screen name="swap" options={{ presentation: "card" }} />
        <Stack.Screen name="perps" options={{ presentation: "card" }} />
        <Stack.Screen name="predictions" options={{ presentation: "card" }} />
        <Stack.Screen name="meme-rush" options={{ presentation: "card" }} />
        <Stack.Screen name="settings" options={{ presentation: "card" }} />
        <Stack.Screen name="security" options={{ presentation: "card" }} />
        <Stack.Screen name="preferences" options={{ presentation: "card" }} />
        <Stack.Screen name="address-book" options={{ presentation: "card" }} />
        <Stack.Screen name="network-selector" options={{ presentation: "card" }} />
        <Stack.Screen name="tx-history" options={{ presentation: "card" }} />
        <Stack.Screen name="wallet-backup" options={{ presentation: "modal" }} />
        <Stack.Screen name="token-detail" options={{ presentation: "card" }} />
        <Stack.Screen name="dapp-browser" options={{ presentation: "card" }} />
      </Stack>
    </AppProvider>
  );
}
