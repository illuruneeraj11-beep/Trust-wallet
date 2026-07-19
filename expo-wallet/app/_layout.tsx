import "react-native-url-polyfill/auto";
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StatusBar, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useAppContext } from "@/context/app-context";
import { AuthProvider, useAuth } from "@/context/auth-context";

if (Platform.OS !== "web") {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
    ...FontAwesome6.font,
  });
  const fontsSettled = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontsSettled && Platform.OS !== "web") void SplashScreen.hideAsync();
  }, [fontsSettled]);

  if (!fontsSettled) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.stage}>
        <View style={[styles.appFrame, Platform.OS === "web" && width >= 768 ? styles.desktopFrame : null]}>
          <AuthProvider>
          <AppProvider>
              <ThemedAppShell />
          </AppProvider>
          </AuthProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

function ThemedAppShell() {
  const { theme, themeMode } = useAppContext();
  return (
    <>
      <StatusBar backgroundColor={theme.background} barStyle={themeMode === "dark" ? "light-content" : "dark-content"} />
      <SessionLayout />
    </>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Platform.OS === "web" ? "#f2f2f4" : "#ffffff",
  },
  appFrame: {
    flex: 1,
    width: "100%",
    minHeight: Platform.OS === "web" ? "100%" : undefined,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  desktopFrame: {
    maxWidth: 430,
  },
});

function SessionLayout() {
  const { initializing, session, visualDemo } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator color="#0500ff" />
      </View>
    );
  }

  const walletAccess = visualDemo || Boolean(session && !session.user.is_anonymous);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Stack.Protected guard={!walletAccess}>
        <Stack.Screen name="auth" />
      </Stack.Protected>
      <Stack.Protected guard={walletAccess}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="wallets" options={{ presentation: "card" }} />
        <Stack.Screen name="add-wallet" options={{ presentation: "card" }} />
        <Stack.Screen name="buy" options={{ presentation: "card" }} />
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
        <Stack.Screen name="global-search" options={{ presentation: "card" }} />
        <Stack.Screen name="deposit-binance" options={{ presentation: "card" }} />
        <Stack.Screen name="qr-scanner" options={{ presentation: "card" }} />
      </Stack.Protected>
    </Stack>
  );
}
