import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BrandLogo, TokenLogo } from "@/components/trust-assets";
import { TrustIcon, type TrustIconName } from "@/components/trust-icon";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { formatMarketChange, formatUsd, MarketStateLabel } from "@/components/live-market-ui";
import { useAppContext } from "@/context/app-context";
import { getAssetBySymbol } from "@/data/asset-registry";

const exploreSymbols = ["BTC", "ETH", "BNB"];
const earnRows = [
  { symbol: "JUNO", apy: "APY unavailable", caption: "JUNO staking" },
  { symbol: "KSM", apy: "APY unavailable", caption: "KSM staking" },
];

export default function HomeScreen() {
  const params = useLocalSearchParams<{ walletDeleted?: string }>();
  const {
    currency,
    hideBalance,
    marketByAssetId,
    selectedWallet,
    theme,
    totalBalance,
    toggleHideBalance,
    visibleBalance,
    watchlist,
  } = useAppContext();
  const [promoVisible, setPromoVisible] = useState(true);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const [deletedToast, setDeletedToast] = useState(params.walletDeleted === "1");

  useEffect(() => {
    if (params.walletDeleted !== "1") return;
    setDeletedToast(true);
    const timer = setTimeout(() => setDeletedToast(false), 2600);
    return () => clearTimeout(timer);
  }, [params.walletDeleted]);

  const watchlistRows = useMemo(
    () => watchlist
      .map((symbol) => getAssetBySymbol(symbol))
      .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset))
      .slice(0, 5),
    [watchlist],
  );

  const walletHoldings = useMemo(
    () => (selectedWallet?.balances ?? [])
      .filter((balance) => {
        try { return BigInt(balance.available_units) > 0n; } catch { return Number(balance.display_amount) > 0; }
      })
      .sort((left, right) => Number(right.display_amount) - Number(left.display_amount)),
    [selectedWallet],
  );

  return (
    <>
      <AppScreen padded={false} withTabBar>
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable
              onPress={() => router.push("/wallets")}
              style={{ minHeight: 46, borderRadius: 24, backgroundColor: theme.surface, paddingLeft: 6, paddingRight: 16, flexDirection: "row", alignItems: "center", gap: 9 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#ff9f0a", alignItems: "center", justifyContent: "center" }}>
                <TrustIcon color="#ffffff" name="wallet-outline" size={21} />
              </View>
              <Text numberOfLines={1} style={{ color: theme.text, fontSize: 15, fontWeight: "800", maxWidth: 128 }}>
                {selectedWallet?.name ?? "Wallet"}
              </Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <RoundHeaderButton icon="history" onPress={() => router.push("/tx-history")} />
            <RoundHeaderButton icon="scanner" onPress={() => router.push("/qr-scanner")} />
          </View>

          {promoVisible ? (
            <Pressable onPress={() => router.push("/fund")} style={{ minHeight: 58, borderRadius: 16, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fff1df", alignItems: "center", justifyContent: "center" }}>
                <TrustIcon color="#ff9800" name="clock-outline" size={23} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text numberOfLines={1} style={{ color: theme.text, fontSize: 13, fontWeight: "800" }}>Fund your wallet</Text>
                <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 11 }}>Add crypto to start using Trust Wallet</Text>
              </View>
              <Pressable accessibilityLabel="Dismiss promotion" onPress={(event) => { event.stopPropagation(); setPromoVisible(false); }} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
                <TrustIcon color={theme.secondary} name="close" size={20} />
              </Pressable>
            </Pressable>
          ) : null}

          <Pressable onPress={() => router.push("/fund")} style={{ alignSelf: "flex-start", gap: 3, minHeight: 48, justifyContent: "center" }}>
            <Text style={{ color: theme.text, fontSize: hideBalance ? 31 : 24, fontWeight: "900", letterSpacing: hideBalance ? 3 : 0 }}>
              {hideBalance ? "*****" : totalBalance > 0 ? visibleBalance : "Get started by adding some crypto"}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <HomeAction label="Receive" onPress={() => router.push("/receive")}>
              <TrustIcon color={theme.text} name="receive" size={25} />
            </HomeAction>
            <HomeAction label="From Binance" onPress={() => router.push("/deposit-binance")}>
              <BrandLogo brand="binance" size={27} />
            </HomeAction>
            <HomeAction label="With Cards" onPress={() => router.push("/buy")}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <BrandLogo brand="visa" size={23} />
                <BrandLogo brand="mastercard" size={23} />
              </View>
            </HomeAction>
          </View>

          {walletHoldings.length ? (
            <>
              <SectionTitle label="Tokens" onPress={() => router.push("/tx-history")} />
              <View style={{ gap: 2 }}>
                {walletHoldings.map((balance) => (
                  <Pressable
                    key={`${balance.wallet_id}:${balance.asset_id}`}
                    onPress={() => {
                      const marketAsset = getAssetBySymbol(balance.asset.symbol);
                      if (marketAsset) router.push({ pathname: "/token-detail", params: { assetId: marketAsset.assetId, symbol: marketAsset.symbol, name: marketAsset.name } });
                      else router.push("/tx-history");
                    }}
                    style={{ minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <TokenLogo network={balance.asset.network_slug} symbol={balance.asset.symbol} size={40} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>{balance.asset.symbol}</Text>
                      <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 11 }}>{balance.asset.name}</Text>
                    </View>
                    <View style={{ maxWidth: "48%", alignItems: "flex-end", gap: 2 }}>
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>{formatTokenAmount(balance.display_amount)} {balance.asset.symbol}</Text>
                      <Text style={{ color: theme.secondary, fontSize: 11 }}>{balance.asset.network_name}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <SectionTitle label="Explore tokens" onPress={() => router.push("/(tabs)/trending")} />
          <View style={{ gap: 2 }}>
            {exploreSymbols.map((symbol) => {
              const asset = getAssetBySymbol(symbol);
              if (!asset) return null;
              const quote = marketByAssetId[asset.assetId];
              const change = quote?.percentChange24h;
              return (
                <Pressable
                  key={asset.assetId}
                  onPress={() => router.push({ pathname: "/token-detail", params: { assetId: asset.assetId, symbol: asset.symbol, name: asset.name } })}
                  style={{ minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <TokenLogo symbol={asset.symbol} uri={asset.logo} size={40} />
                  <Text numberOfLines={1} style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" }}>{asset.name}</Text>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>{formatUsd(quote?.price, false, currency.code)}</Text>
                    <Text style={{ color: Number(change) >= 0 ? theme.positive : theme.negative, fontSize: 12, fontWeight: "700" }}>{formatMarketChange(change)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable onPress={() => router.push("/(tabs)/trending")} style={{ minHeight: 36, borderRadius: 18, backgroundColor: theme.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: "800" }}>View all</Text>
              <TrustIcon color={theme.text} name="chevron-right" size={17} />
            </Pressable>
            <MarketStateLabel compact />
          </View>

          <SectionTitle label="Earn" onPress={() => router.push("/(tabs)/rewards")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {earnRows.map((row) => (
              <Pressable key={row.symbol} onPress={() => router.push("/(tabs)/rewards")} style={{ width: 153, minHeight: 126, borderRadius: 17, backgroundColor: theme.surface, padding: 16, justifyContent: "space-between" }}>
                <TokenLogo symbol={row.symbol} size={39} />
                <View style={{ gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{row.apy}</Text>
                  <Text style={{ color: theme.secondary, fontSize: 13 }}>{row.caption}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => router.push({ pathname: "/token-detail", params: { assetId: "ethereum:native", symbol: "ETH", name: "Ethereum", ai: "1" } })}
            style={{ minHeight: 72, borderRadius: 18, backgroundColor: theme.surface, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 9 }}
          >
            <TrustIcon color={theme.text} name="creation" size={23} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "900" }}>Trust Wallet AI</Text>
            <View style={{ minHeight: 42, borderRadius: 21, backgroundColor: "#dedee2", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: "800" }}>Ask anything</Text>
              <TrustIcon color={theme.text} name="chevron-right" size={16} />
            </View>
          </Pressable>

          <SectionTitle label="Watchlist" onPress={() => router.push("/(tabs)/trending")} />
          <View style={{ gap: 2 }}>
            {watchlistRows.map((asset) => {
              const quote = marketByAssetId[asset.assetId];
              return (
                <Pressable key={asset.assetId} onPress={() => router.push({ pathname: "/token-detail", params: { assetId: asset.assetId, symbol: asset.symbol, name: asset.name } })} style={{ minHeight: 58, flexDirection: "row", alignItems: "center", gap: 11 }}>
                  <TokenLogo symbol={asset.symbol} uri={asset.logo} size={38} />
                  <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: "800" }}>{asset.name}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800" }}>{formatUsd(quote?.price, false, currency.code)}</Text>
                    <Text style={{ color: Number(quote?.percentChange24h) >= 0 ? theme.positive : theme.negative, fontSize: 11, fontWeight: "700" }}>{formatMarketChange(quote?.percentChange24h)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => setCustomizeVisible(true)} style={{ alignSelf: "flex-end", minHeight: 34, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <TrustIcon color={theme.secondary} name="tune-variant" size={16} />
            <Text style={{ color: theme.secondary, fontSize: 12, fontWeight: "800" }}>Customize</Text>
          </Pressable>
        </View>
      </AppScreen>

      <SheetModal visible={customizeVisible} title="Customize Home" subtitle="Choose the sections you want to see." onClose={() => setCustomizeVisible(false)}>
        {["Explore tokens", "Earn", "Trust Wallet AI", "Watchlist"].map((label) => (
          <View key={label} style={{ minHeight: 54, borderRadius: 15, backgroundColor: theme.cardSecondary, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TrustIcon color={theme.secondary} name="drag-horizontal-variant" size={20} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: "800" }}>{label}</Text>
            <TrustIcon color={theme.blue} name="eye-outline" size={20} />
          </View>
        ))}
      </SheetModal>
      {deletedToast ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 94, alignItems: "center" }}>
          <View style={{ minHeight: 44, borderRadius: 22, backgroundColor: "#858589", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }}><BrandLogo brand="trust-wallet" size={25} /><Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "800" }}>Wallet Deleted</Text></View>
        </View>
      ) : null}
    </>
  );
}

function RoundHeaderButton({ icon, onPress }: { icon: TrustIconName; onPress: () => void }) {
  const { theme } = useAppContext();
  const accessibilityLabel = icon === "history" ? "Activity" : icon === "scanner" ? "Scan QR code" : "Open action";
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
      <TrustIcon color={theme.text} name={icon} size={22} />
    </Pressable>
  );
}

function HomeAction({ children, label, onPress }: { children: React.ReactNode; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", gap: 7 }}>
      <View style={{ width: "100%", minHeight: 62, borderRadius: 15, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>{children}</View>
      <Text numberOfLines={1} style={{ color: theme.text, fontSize: 11, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{label}</Text>
      <TrustIcon color={theme.text} name="chevron-right" size={19} />
    </Pressable>
  );
}

function formatTokenAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(amount);
}
