import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useAppContext } from "@/context/app-context";

export default function TabsLayout() {
  const { theme } = useAppContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.blue,
        tabBarInactiveTintColor: theme.tabIcon,
        tabBarStyle: {
          height: 86,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 0,
          backgroundColor: theme.surface,
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 18,
          borderRadius: 32,
          shadowColor: theme.shadow,
          shadowOpacity: 1,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
        tabBarItemStyle: {
          borderRadius: 24,
          marginHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="⌂" /> }} />
      <Tabs.Screen name="trending" options={{ title: "Trending", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="◔" /> }} />
      <Tabs.Screen name="trade" options={{ title: "Trade", tabBarIcon: () => <TradeTabIcon /> }} />
      <Tabs.Screen name="rewards" options={{ title: "Rewards", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="◎" /> }} />
      <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="◇" /> }} />
    </Tabs>
  );
}

function TabIcon({ color, focused, label }: { color: string; focused: boolean; label: string }) {
  return (
    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: focused ? "#ded9ff" : "transparent", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: 19 }}>{label}</Text>
    </View>
  );
}

function TradeTabIcon() {
  return (
    <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: "#0500e8", alignItems: "center", justifyContent: "center", marginTop: -18, shadowColor: "rgba(17, 23, 36, 0.22)", shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12 }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>⇄</Text>
    </View>
  );
}
