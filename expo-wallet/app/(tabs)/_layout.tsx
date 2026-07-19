import type { ComponentProps } from "react";
import { router } from "expo-router";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrustIcon, type SemanticTrustIconName } from "@/components/trust-icon";

type RouterTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const visibleTabs: {
  routeName: "index" | "trending" | "rewards" | "discover";
  label: string;
  icon: SemanticTrustIconName;
}[] = [
  { routeName: "index", label: "Home", icon: "nav-home" },
  { routeName: "trending", label: "Markets", icon: "nav-markets" },
  { routeName: "rewards", label: "Perps", icon: "nav-perps" },
  { routeName: "discover", label: "Discover", icon: "nav-discover" },
];

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <WalletTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="trending" options={{ title: "Markets" }} />
      <Tabs.Screen name="trade" options={{ href: null, title: "Swap" }} />
      <Tabs.Screen name="rewards" options={{ title: "Perps" }} />
      <Tabs.Screen name="discover" options={{ title: "Discover" }} />
    </Tabs>
  );
}

function WalletTabBar({ state, navigation }: RouterTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarRow,
        { bottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View style={styles.primaryPill}>
        {visibleTabs.map((item) => {
          const route = state.routes.find((candidate) => candidate.name === item.routeName);
          if (!route) return null;

          const focused = state.routes[state.index]?.key === route.key;

          return (
            <Pressable
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              key={item.routeName}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
            >
              <View style={[styles.selectedCircle, focused && styles.selectedCircleActive]}>
                <TrustIcon color={focused ? "#252529" : "#5f6065"} name={item.icon} size={item.icon === "nav-perps" ? 28 : 27} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityLabel="Search"
        accessibilityRole="button"
        onPress={() => router.push("/global-search")}
        style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
      >
        <TrustIcon color="#5f6065" name="nav-search" size={30} />
      </Pressable>
    </View>
  );
}

const elevatedSurface = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 8,
  boxShadow: "0 5px 16px rgba(0, 0, 0, 0.10)",
} as const;

const styles = StyleSheet.create({
  tabBarRow: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  primaryPill: {
    ...elevatedSurface,
    flex: 1,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "#e5e5e7",
    backgroundColor: "#ffffff",
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircleActive: {
    backgroundColor: "#f1f1f3",
  },
  searchButton: {
    ...elevatedSurface,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "#e5e5e7",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
