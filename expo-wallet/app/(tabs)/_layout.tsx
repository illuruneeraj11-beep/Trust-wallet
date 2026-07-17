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
          height: 88,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 0,
          backgroundColor: "#ffffff",
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 22,
          borderRadius: 34,
          boxShadow: "0 8px 22px rgba(0, 0, 0, 0.18)",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "900",
        },
        tabBarItemStyle: {
          borderRadius: 30,
          marginHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="⌂" /> }} />
      <Tabs.Screen name="trending" options={{ title: "Markets", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="↗" /> }} />
      <Tabs.Screen name="trade" options={{ title: "Swap", tabBarIcon: () => <TradeTabIcon /> }} />
      <Tabs.Screen name="rewards" options={{ title: "Perps", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="∞" /> }} />
      <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon color={color} focused={focused} label="◉" /> }} />
    </Tabs>
  );
}

function TabIcon({ color, focused, label }: { color: string; focused: boolean; label: string }) {
  return (
    <View style={{ width: 66, height: 56, borderRadius: 28, backgroundColor: focused ? "#ddd8ff" : "transparent", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: 27, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

function TradeTabIcon() {
  return (
    <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: "#0500ff", alignItems: "center", justifyContent: "center", marginTop: -26, boxShadow: "0 8px 18px rgba(0, 0, 0, 0.28)" }}>
      <Text style={{ color: "#ffffff", fontSize: 30, fontWeight: "900" }}>⇄</Text>
    </View>
  );
}
