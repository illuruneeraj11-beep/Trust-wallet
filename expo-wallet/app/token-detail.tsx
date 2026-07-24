import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { formatMarketChange, formatUsd, useMarketHistoryPoints } from "@/components/live-market-ui";
import { MarketChart } from "@/components/market-chart";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { getAssetById, getAssetBySymbol } from "@/data/asset-registry";

const periods = ["1D", "1W", "1M", "3M", "1Y"] as const;

export default function TokenDetailScreen() {
  const params = useLocalSearchParams<{ assetId?: string; symbol?: string; name?: string; ai?: string }>();
  const { currency, marketByAssetId, selectedWallet, theme, toggleWatchlistToken, transfers, watchlist } = useAppContext();
  const { width } = useWindowDimensions();
  const asset = (params.assetId ? getAssetById(params.assetId) : undefined) ?? getAssetBySymbol(params.symbol ?? "ETH") ?? getAssetBySymbol("ETH")!;
  const quote = marketByAssetId[asset.assetId];
  const [period, setPeriod] = useState<(typeof periods)[number]>("1M");
  const [aiOpen, setAiOpen] = useState(params.ai === "1");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const historyRange = period;
  const { error: historyError, loading: historyLoading, points } = useMarketHistoryPoints(asset.assetId, historyRange);
  const positive = Number(quote?.percentChange24h) >= 0;
  const isFavorite = watchlist.includes(asset.symbol);
  const chartWidth = Math.max(280, Math.min(width - 32, 398));
  const walletBalance = selectedWallet?.balances.find((balance) => balance.asset.symbol === asset.symbol);
  const tokenBalance = Number(walletBalance?.display_amount ?? 0);
  const balanceFiat = Number.isFinite(tokenBalance) && typeof quote?.price === "number" ? tokenBalance * quote.price : null;
  const recentTransfers = transfers.filter((transfer) => transfer.asset.symbol === asset.symbol
    && (!selectedWallet || transfer.from_wallet_id === selectedWallet.id || transfer.to_wallet_id === selectedWallet.id || transfer.type === "funding")).slice(0, 3);

  useEffect(() => {
    if (!aiOpen) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setAiOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [aiOpen]);

  if (aiOpen) return <AiChat assetName={asset.name} onClose={() => setAiOpen(false)} price={quote?.price ?? null} />;

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 12, gap: 13 }}>
        <View style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 9 }}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
            <TrustIcon color={theme.secondary} name="back-compact" size={26} />
          </Pressable>
          <TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{asset.symbol}</Text>
            <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 10 }}>{asset.name}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 1 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{formatUsd(quote?.price, false, currency.code)}</Text>
            <Text style={{ color: positive ? theme.positive : theme.negative, fontSize: 10, fontWeight: "800" }}>{formatMarketChange(quote?.percentChange24h)}</Text>
          </View>
          <Pressable accessibilityLabel={isFavorite ? `Remove ${asset.name} from watchlist` : `Add ${asset.name} to watchlist`} accessibilityRole="button" onPress={() => toggleWatchlistToken(asset.symbol)} style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}>
            <TrustIcon color={isFavorite ? theme.blue : theme.secondary} name={isFavorite ? "star" : "star-outline"} size={22} />
          </Pressable>
        </View>

        <View style={{ minHeight: 174, alignItems: "center", justifyContent: "center" }}>
          {historyLoading ? <ActivityIndicator color={theme.blue} /> : points.length > 1 ? (
            <MarketChart color={positive ? theme.positive : theme.negative} fill={false} height={160} points={points} showEndPoint={false} strokeWidth={2} width={chartWidth} />
          ) : (
            <View style={{ alignItems: "center", gap: 8 }}>
              <TrustIcon color={theme.secondary} name="chart-line-variant" size={36} />
              <Text style={{ color: theme.secondary, fontSize: 11 }}>Price history is temporarily unavailable.</Text>
            </View>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", alignItems: "center" }}>
          {periods.map((item) => (
            <Pressable key={item} hitSlop={4} onPress={() => setPeriod(item)} style={{ minWidth: 38, minHeight: 38, borderRadius: 19, backgroundColor: period === item ? theme.surface : "transparent", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: period === item ? theme.text : theme.secondary, fontSize: 10, fontWeight: "800" }}>{item}</Text>
            </Pressable>
          ))}
          <TrustIcon color={theme.secondary} name="candlestick-chart" size={18} />
        </ScrollView>

        <View style={{ gap: 7 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: "800" }}>Your balance</Text>
            <Pressable onPress={() => setBalanceVisible((current) => !current)}>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900", letterSpacing: balanceVisible ? 0 : 2 }}>{balanceVisible ? formatTokenBalance(tokenBalance) : "*****"} {balanceVisible ? asset.symbol : ""}</Text>
            </Pressable>
          </View>
          <Text style={{ alignSelf: "flex-end", color: theme.secondary, fontSize: 9 }}>{balanceVisible ? formatUsd(balanceFiat, false, currency.code) : "*****"}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <MiniAction icon="arrow-up-right" label="Send" onPress={() => router.push({ pathname: "/send", params: { asset: asset.symbol } })} />
            <MiniAction icon="qrcode" label="Receive" onPress={() => router.push({ pathname: "/receive", params: { assetId: asset.assetId } })} />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <TrustIcon color={theme.text} name="creation" size={17} />
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>AI Summary</Text>
          </View>
          <Text numberOfLines={4} style={{ color: theme.text, fontSize: 10, lineHeight: 15 }}>{summaryForAsset(asset.name)}</Text>
          <Pressable onPress={() => setAiOpen(true)} style={{ height: 35, borderRadius: 18, backgroundColor: theme.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Text style={{ color: theme.text, fontSize: 11, fontWeight: "800" }}>Ask AI</Text>
            <TrustIcon color={theme.text} name="chevron-right" size={15} />
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>Recent history</Text>
          {recentTransfers.map((transfer) => {
            const incoming = transfer.type === "funding" || transfer.to_wallet_id === selectedWallet?.id;
            return (
              <Pressable key={transfer.id} onPress={() => router.push({ pathname: "/tx-history", params: { transactionId: transfer.id } })} style={{ minHeight: 42, flexDirection: "row", alignItems: "center", gap: 9 }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={incoming ? theme.positive : theme.secondary} name={incoming ? "arrow-down-left" : "arrow-up-right"} size={16} /></View>
                <Text style={{ flex: 1, color: theme.text, fontSize: 11, fontWeight: "800" }}>{transfer.type === "funding" ? "Received" : transfer.direction === "self" ? "Moved between wallets" : incoming ? "Received" : "Sent"}</Text>
                <Text style={{ color: incoming ? theme.positive : theme.text, fontSize: 11, fontWeight: "900" }}>{incoming ? "+" : "−"}{transfer.display_amount} {asset.symbol}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => router.push("/tx-history")} style={{ minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: theme.secondary, fontSize: 10 }}>{recentTransfers.length ? "View all activity" : "No recent wallet activity"}</Text>
            <TrustIcon color={theme.blue} name="chevron-right" size={16} />
          </Pressable>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>Stats</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 12 }}>
            <Stat label="Market Cap" value={formatUsd(quote?.marketCap, true, currency.code)} />
            <Stat label="24h Volume" value={formatUsd(quote?.volume24h, true, currency.code)} />
            <Stat label="Holders" value="Unavailable" />
            <Stat label="Created" value="Unavailable" />
            <Stat label="Circulating Supply %" value="Unavailable" />
            <Stat label="Security Risk" value="Not verified" />
            <Stat label="Liquidity (USD)" value="Unavailable" />
            <Stat label="Top 10 holders %" value="Unavailable" />
          </View>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>About</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <AboutChip icon="web" label="Website" />
            <AboutChip icon="alpha-x-circle-outline" label="X" />
            <AboutChip icon="reddit" label="Reddit" />
            <AboutChip icon="file-document-outline" label="Whitepaper" />
          </ScrollView>
        </View>

        <Pressable onPress={() => router.push("/swap")} style={{ height: 48, borderRadius: 24, backgroundColor: theme.blue, marginTop: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <TrustIcon color="#ffffff" name="sync" size={20} />
          <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>{asset.categories.includes("preipo") ? "Swap" : "Trade"}</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

function AiChat({ assetName, onClose, price }: { assetName: string; onClose: () => void; price: number | null }) {
  const { currency, theme } = useAppContext();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const liveContext = useMemo(() => price ? `${assetName} is currently quoted at ${formatUsd(price, false, currency.code)}.` : `A current ${assetName} quote is unavailable.`, [assetName, currency.code, price]);

  function send() {
    if (!draft.trim()) return;
    setMessages((current) => [...current, draft.trim()]);
    setDraft("");
  }

  return (
    <AppScreen scrollable={false} padded={false}>
      <View style={{ flex: 1, paddingHorizontal: 12 }}>
        <View style={{ height: 58, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onClose} style={{ position: "absolute", left: 0, width: 38, height: 38, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={22} /></Pressable>
          <TrustIcon color={theme.blue} name="shield-half-full" size={18} />
          <Text style={{ marginLeft: 6, color: theme.text, fontSize: 15, fontWeight: "900" }}>New Chat</Text>
          <Pressable accessibilityLabel="Close Trust AI" accessibilityRole="button" onPress={onClose} style={{ position: "absolute", right: 0, width: 38, height: 38, borderRadius: 19, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.text} name="close" size={20} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 14, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <TrustIcon color={theme.blue} name="shield-half-full" size={15} />
            <Text style={{ color: theme.secondary, fontSize: 11, fontWeight: "700" }}>AI Summary</Text>
          </View>
          <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20 }}>{liveContext} Its 24-hour movement and historical chart come only from the configured market provider. Market prices can change quickly, so verify any decision independently.</Text>
          {messages.map((message, index) => (
            <View key={`${message}-${index}`} style={{ gap: 8 }}>
              <View style={{ alignSelf: "flex-end", maxWidth: "82%", borderRadius: 16, backgroundColor: theme.blue, paddingHorizontal: 13, paddingVertical: 9 }}><Text style={{ color: "#ffffff", fontSize: 12 }}>{message}</Text></View>
              <View style={{ alignSelf: "flex-start", maxWidth: "88%", borderRadius: 16, backgroundColor: theme.surface, paddingHorizontal: 13, paddingVertical: 9 }}><Text style={{ color: theme.text, fontSize: 12, lineHeight: 18 }}>I can explain the asset and the verified market fields shown here. This information is not personalized financial advice.</Text></View>
            </View>
          ))}
        </ScrollView>

        <View style={{ minHeight: 48, borderRadius: 24, backgroundColor: theme.surface, paddingLeft: 14, paddingRight: 5, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 17 }}>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={send} placeholder="Ask anything..." placeholderTextColor={theme.secondary} style={{ flex: 1, color: theme.text, fontSize: 12 }} />
          <Pressable accessibilityLabel="Send message" accessibilityRole="button" accessibilityState={{ disabled: !draft.trim() }} disabled={!draft.trim()} onPress={send} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: draft.trim() ? theme.blue : theme.cardSecondary, alignItems: "center", justifyContent: "center" }}><TrustIcon color={draft.trim() ? "#ffffff" : theme.secondary} name="arrow-up" size={18} /></Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

function MiniAction({ icon, label, onPress }: { icon: "arrow-up-right" | "qrcode"; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return <Pressable onPress={onPress} style={{ flex: 1, height: 34, borderRadius: 17, backgroundColor: theme.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}><TrustIcon color={theme.text} name={icon} size={14} /><Text style={{ color: theme.text, fontSize: 10, fontWeight: "800" }}>{label}</Text></Pressable>;
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useAppContext();
  return <View style={{ width: "50%", gap: 2 }}><Text style={{ color: theme.secondary, fontSize: 8 }}>{label}</Text><Text numberOfLines={1} style={{ color: theme.text, fontSize: 10, fontWeight: "800" }}>{value}</Text></View>;
}

function AboutChip({ icon, label }: { icon: "web" | "alpha-x-circle-outline" | "reddit" | "file-document-outline"; label: string }) {
  const { theme } = useAppContext();
  return <Pressable onPress={() => router.push({ pathname: "/dapp-browser", params: { url: `https://trustwallet.com/${label.toLowerCase()}` } })} style={{ minHeight: 25, borderRadius: 13, backgroundColor: theme.surface, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 }}><TrustIcon color={theme.secondary} name={icon} size={12} /><Text style={{ color: theme.text, fontSize: 8, fontWeight: "700" }}>{label}</Text></Pressable>;
}

function summaryForAsset(name: string) {
  if (name === "Ethereum") return "Ethereum is a decentralized, open-source blockchain platform that enables the creation and execution of smart contracts and decentralized applications (dApps).";
  return `${name} is a digital asset shown with verified identity and provider-backed market fields. Review its network, liquidity, and security details before interacting.`;
}

function formatTokenBalance(value: number) {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("en-US", { maximumFractionDigits: value >= 1 ? 6 : 10 });
}
