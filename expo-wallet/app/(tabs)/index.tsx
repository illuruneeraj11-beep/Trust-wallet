import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { earnOpportunities, perpsMarkets, predictionMarkets } from "@/data/trust-wallet";
import { formatCurrencyValue } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { AppScreen, SheetModal, TokenAvatar } from "@/components/trust-ui";
import { applyLivePerps } from "@/services/market-prices";

export default function HomeScreen() {
  const { activeHomeTab, currency, setActiveHomeTab, theme, topTradedTokens, trendingTokens, watchlist } = useAppContext();
  const [sheet, setSheet] = useState<string | null>(null);
  const livePerps = useMemo(() => applyLivePerps(perpsMarkets, topTradedTokens), [topTradedTokens]);
  const tokens = useMemo(() => [...topTradedTokens, ...trendingTokens].slice(0, 8), [topTradedTokens, trendingTokens]);

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <HeaderButton label="Main Wallet 1" onPress={() => router.push("/wallets")} />
            <View style={{ flex: 1 }} />
            <IconButton label="🔔" onPress={() => setSheet("Notifications")} />
            <IconButton label="⌕" onPress={() => setSheet("Search tokens and dApps")} />
            <IconButton label="⌗" onPress={() => router.push("/qr-scanner")} />
          </View>

          <Pressable onPress={() => setSheet("What’s New")} style={{ minHeight: 72, borderRadius: 18, borderWidth: 1, borderColor: "#eeeeef", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <LinearGradient colors={["#fff4c2", "#ff7a59"]} style={{ width: 42, height: 42, borderRadius: 21 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>bStocks are officially launched</Text>
              <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 13 }}>Buy tokenized stock market assets directly in wallet</Text>
            </View>
            <Text style={{ color: theme.secondary, fontSize: 28 }}>›</Text>
          </Pressable>

          <View style={{ alignItems: "center", gap: 18, paddingTop: 4 }}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>Get started by adding some crypto</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <ActionTile label="Receive" icon="⌘" onPress={() => router.push("/receive")} />
              <ActionTile label="From Binance" icon="₿" onPress={() => router.push("/deposit-binance")} />
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <TopTab label="Tokens" active={activeHomeTab === "crypto"} onPress={() => setActiveHomeTab("crypto")} />
            <TopTab label="Watchlist" active={activeHomeTab === "watchlist"} onPress={() => setActiveHomeTab("watchlist")} />
            <TopTab label="NFTs" active={activeHomeTab === "nfts"} onPress={() => setActiveHomeTab("nfts")} />
            <Pressable onPress={() => setSheet("Portfolio filters")} style={{ marginLeft: "auto" }}><Text style={{ color: theme.secondary, fontSize: 26 }}>☷</Text></Pressable>
          </View>

          {activeHomeTab === "crypto" ? (
            <View style={{ gap: 8 }}>
              {tokens.slice(0, 4).map((token) => (
                <AssetRow
                  key={token.symbol}
                  symbol={token.symbol}
                  name={token.name}
                  price={formatCurrencyValue(token.price, currency)}
                  change={`${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`}
                  onPress={() => router.push({ pathname: "/token-detail", params: { symbol: token.symbol, name: token.name, price: formatCurrencyValue(token.price, currency), change: `${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%` } })}
                />
              ))}
              <Pressable onPress={() => router.push("/trending")} style={{ alignSelf: "center", minHeight: 38, borderRadius: 19, backgroundColor: theme.surface, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>View all ›</Text>
              </Pressable>
            </View>
          ) : activeHomeTab === "watchlist" ? (
            <View style={{ gap: 8 }}>
              {tokens.filter((token) => watchlist.includes(token.symbol)).concat(tokens.filter((token) => !watchlist.includes(token.symbol))).slice(0, 4).map((token) => (
                <AssetRow
                  key={token.symbol}
                  symbol={token.symbol}
                  name={token.name}
                  price={formatCurrencyValue(token.price, currency)}
                  change={`${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`}
                  onPress={() => router.push({ pathname: "/token-detail", params: { symbol: token.symbol, name: token.name, price: formatCurrencyValue(token.price, currency), change: `${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%` } })}
                />
              ))}
              <Pressable onPress={() => setSheet("Customize watchlist")} style={{ alignSelf: "center", minHeight: 38, borderRadius: 19, backgroundColor: theme.blueSoft, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>Customize</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 14, paddingVertical: 44 }}>
              <Text style={{ fontSize: 64 }}>🖼</Text>
              <Text style={{ color: theme.secondary, fontSize: 17 }}>No NFTs yet</Text>
            </View>
          )}

          <SectionRail title="Predictions" onPress={() => router.push("/predictions")}>
            {predictionMarkets.map((item, index) => (
              <PredictionCard key={item.id} title={index === 0 ? "France vs. Morocco" : index === 1 ? "Norway vs. England" : item.title} meta={`${item.volume} · ${item.endsIn}`} />
            ))}
          </SectionRail>

          <SectionRail title="Perps" onPress={() => router.push("/perps")}>
            {livePerps.slice(1, 4).map((item) => (
              <MarketMiniCard key={item.pair} symbol={item.symbol} title={`Trade ${item.symbol} with up to ${item.leverage.replace("x", "")}x leverage`} subtitle={`${item.volume} Vol`} />
            ))}
          </SectionRail>

          <SectionRail title="Earn" onPress={() => setSheet("Earn")}>
            {earnOpportunities.map((item) => (
              <MarketMiniCard key={item.symbol} symbol={item.symbol} title={`Earn up to ${item.apy} APY`} subtitle={`on ${item.name}`} />
            ))}
          </SectionRail>

          <SectionRail title="Stocks" onPress={() => router.push("/perps")}>
            {["NVIDIA", "MRVL", "MU"].map((symbol, index) => (
              <MarketMiniCard key={symbol} symbol={symbol} title={symbol} subtitle={["$206.38  +1.55%", "$287.69  +7.58%", "$876.71  +1.62%"][index]} />
            ))}
          </SectionRail>
        </View>
      </AppScreen>

      <SheetModal visible={!!sheet} title={sheet ?? ""} subtitle={sheet === "What’s New" ? "bStocks has officially launched. Tokenized equities, ETFs, and market assets are now available in this demo flow." : "This action is connected."} onClose={() => setSheet(null)}>
        {sheet === "What’s New" ? (
          <View style={{ alignItems: "center", gap: 18 }}>
            <LinearGradient colors={["#6fffe6", "#fff05a", "#ff47a3"]} style={{ width: 150, height: 150, borderRadius: 32, transform: [{ rotate: "-8deg" }] }} />
            <Pressable onPress={() => { setSheet(null); router.push("/perps"); }} style={{ alignSelf: "stretch", height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Buy now</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setSheet(null)} style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Done</Text>
          </Pressable>
        )}
      </SheetModal>
    </>
  );
}

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 38, borderRadius: 19, backgroundColor: "#f3f3f6", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ color: "#f59e0b", fontSize: 16 }}>●</Text>
      <Text style={{ color: "#202124", fontSize: 15, fontWeight: "900" }}>{label}</Text>
      <Text style={{ color: "#202124", fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

function IconButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#6d6d72", fontSize: 24 }}>{label}</Text></Pressable>;
}

function ActionTile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 128, minHeight: 80, borderRadius: 18, backgroundColor: "#f4f4f7", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <Text style={{ color: "#202124", fontSize: 26, fontWeight: "900" }}>{icon}</Text>
      <Text style={{ color: "#202124", fontSize: 15, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function TopTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingBottom: 10, marginRight: 26, borderBottomWidth: 4, borderBottomColor: active ? "#0500ff" : "transparent" }}>
      <Text style={{ color: active ? "#202124" : "#6d6d72", fontSize: 20, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function AssetRow({ symbol, name, price, change, onPress }: { symbol: string; name: string; price: string; change: string; onPress: () => void }) {
  const positive = change.startsWith("+");
  return (
    <Pressable onPress={onPress} style={{ minHeight: 70, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <TokenAvatar symbol={symbol} size={50} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#202124", fontSize: 19, fontWeight: "900" }}>{name}</Text>
        <Text style={{ color: "#6d6d72", fontSize: 15 }}>0 {symbol}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: "#202124", fontSize: 18, fontWeight: "900" }}>{price}</Text>
        <Text style={{ color: positive ? "#0aa84f" : "#cf3030", fontSize: 14, fontWeight: "800" }}>{change}</Text>
      </View>
    </Pressable>
  );
}

function SectionRail({ title, onPress, children }: { title: string; onPress: () => void; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ color: "#202124", fontSize: 22, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: "#6d6d72", fontSize: 32 }}>›</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>{children}</ScrollView>
    </View>
  );
}

function MarketMiniCard({ symbol, title, subtitle }: { symbol: string; title: string; subtitle: string }) {
  return (
    <Pressable onPress={() => router.push("/perps")} style={{ width: 170, borderRadius: 18, backgroundColor: "#f4f4f7", padding: 16, gap: 12 }}>
      <TokenAvatar symbol={symbol} size={44} />
      <Text style={{ color: "#202124", fontSize: 16, fontWeight: "900", lineHeight: 22 }}>{title}</Text>
      <Text style={{ color: "#6d6d72", fontSize: 14 }}>{subtitle}</Text>
    </Pressable>
  );
}

function PredictionCard({ title, meta }: { title: string; meta: string }) {
  return (
    <Pressable onPress={() => router.push("/predictions")} style={{ width: 210, minHeight: 136, borderRadius: 18, backgroundColor: "#f4f4f7", padding: 14, justifyContent: "space-between" }}>
      <View style={{ width: 44, height: 34, borderRadius: 8, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 20 }}>▣</Text>
      </View>
      <Text numberOfLines={2} style={{ color: "#202124", fontSize: 17, fontWeight: "900", lineHeight: 23 }}>{title}</Text>
      <Text style={{ color: "#6d6d72", fontSize: 13, fontWeight: "800" }}>{meta}</Text>
    </Pressable>
  );
}
