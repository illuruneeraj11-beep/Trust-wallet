import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { AppProvider } from "@/context/app-context";
import { AuthProvider, useAuth } from "@/context/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <AppProvider>
        <SessionLayout />
      </AppProvider>
    </AuthProvider>
  );
}

function SessionLayout() {
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator color="#0500ff" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Stack.Screen name="auth" />
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
  );
}
