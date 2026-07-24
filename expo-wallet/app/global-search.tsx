import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { formatMarketChange, formatUsd } from "@/components/live-market-ui";
import { DappLogo } from "@/components/secondary-flow-ui";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { assetRegistry, getAssetById, type AssetDefinition } from "@/data/asset-registry";
import { dappDirectory } from "@/data/secondary-flows";

const RECENTS_KEY = "trust-wallet-comparison-search-recents";
const trendingSymbols = ["LINK", "CAKE", "ASTER", "HLX", "ONDO", "LIT", "TRUMP", "PUMP", "VVV", "PEPE"];

export default function GlobalSearchScreen() {
  const { marketByAssetId, theme, toggleWatchlistToken, watchlist } = useAppContext();
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const term = query.trim().toLowerCase();

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(RECENTS_KEY).then((raw) => {
      if (!mounted || !raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentIds(parsed.filter((item): item is string => typeof item === "string").slice(0, 6));
      } catch {
        setRecentIds([]);
      }
    });
    return () => { mounted = false; };
  }, []);

  const recents = useMemo(() => recentIds.map(getAssetById).filter((asset): asset is AssetDefinition => Boolean(asset)), [recentIds]);
  const trending = useMemo(() => trendingSymbols.map((symbol) => assetRegistry.find((asset) => asset.symbol === symbol)).filter((asset): asset is AssetDefinition => Boolean(asset)), []);
  const tokenResults = useMemo(() => assetRegistry.filter((asset) => asset.availability !== "unavailable" && (!term || `${asset.symbol} ${asset.name} ${asset.chain} ${asset.contract ?? ""}`.toLowerCase().includes(term))), [term]);
  const dappResults = useMemo(() => {
    if (!term) return [];
    return dappDirectory.filter((item, index, all) => all.findIndex((candidate) => candidate.name === item.name) === index && `${item.name} ${item.description} ${item.network}`.toLowerCase().includes(term));
  }, [term]);
  const addressLike = /^(0x[a-f0-9]{5,}|[1-9a-hj-np-z]{20,})$/i.test(query.trim());

  async function openAsset(asset: AssetDefinition) {
    const next = [asset.assetId, ...recentIds.filter((id) => id !== asset.assetId)].slice(0, 6);
    setRecentIds(next);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    router.push({ pathname: "/token-detail", params: { assetId: asset.assetId, symbol: asset.symbol, name: asset.name } });
  }

  async function clearRecents() {
    setRecentIds([]);
    await AsyncStorage.removeItem(RECENTS_KEY);
  }

  const visibleTokens = term ? tokenResults : trending;

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: theme.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9 }}>
            <TrustIcon color={theme.secondary} name="magnify" size={21} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              onChangeText={setQuery}
              placeholder="Tokens, stocks, dApps, addresses"
              placeholderTextColor={theme.secondary}
              returnKeyType="search"
              style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: "600", paddingVertical: 0 }}
              value={query}
            />
          </View>
          <Pressable accessibilityLabel="Close search" accessibilityRole="button" onPress={() => router.back()} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.text} name="close" size={25} /></Pressable>
        </View>

        {!term && recents.length ? (
          <View style={{ gap: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>Recents</Text>
              <Pressable onPress={() => void clearRecents()}><Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>Clear all</Text></Pressable>
            </View>
            {recents.map((asset) => <TokenResult key={asset.assetId} asset={asset} favorite={watchlist.includes(asset.symbol)} onFavorite={() => toggleWatchlistToken(asset.symbol)} onPress={() => void openAsset(asset)} />)}
          </View>
        ) : null}

        <View style={{ gap: 3 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{term ? "Tokens and stocks" : "Trending"}</Text>
          {visibleTokens.map((asset) => <TokenResult key={asset.assetId} asset={asset} favorite={watchlist.includes(asset.symbol)} onFavorite={() => toggleWatchlistToken(asset.symbol)} onPress={() => void openAsset(asset)} />)}
        </View>

        {dappResults.length ? (
          <View style={{ gap: 3 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>dApps</Text>
            {dappResults.map((item) => (
              <Pressable key={item.id} onPress={() => router.push({ pathname: "/dapp-browser", params: { dappId: item.id, name: item.name, url: item.url } })} style={{ minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <DappLogo name={item.name} uri={item.logoUrl} size={45} />
                <View style={{ flex: 1, gap: 2 }}><Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{item.name}</Text><Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 12 }}>{item.description}</Text></View>
                <TrustIcon color={theme.secondary} name="chevron-right" size={21} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {addressLike ? (
          <View style={{ borderRadius: 18, backgroundColor: theme.surface, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TrustIcon color={theme.blue} name="card-account-details-outline" size={25} />
            <View style={{ flex: 1, gap: 3 }}><Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>Address detected</Text><Text style={{ color: theme.secondary, fontSize: 12, lineHeight: 17 }}>External address lookup is unavailable in this simulation.</Text></View>
          </View>
        ) : null}

        {term && !visibleTokens.length && !dappResults.length && !addressLike ? (
          <View style={{ minHeight: 330, alignItems: "center", justifyContent: "center", gap: 10 }}><TrustIcon color={theme.secondary} name="magnify" size={42} /><Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>No results found</Text><Text style={{ color: theme.secondary, fontSize: 13 }}>Try another asset, symbol, dApp, or address.</Text></View>
        ) : null}
      </View>
    </AppScreen>
  );
}

function TokenResult({ asset, favorite, onFavorite, onPress }: { asset: AssetDefinition; favorite: boolean; onFavorite: () => void; onPress: () => void }) {
  const { currency, marketByAssetId, theme } = useAppContext();
  const quote = marketByAssetId[asset.assetId];
  const change = quote?.percentChange24h;
  return (
    <Pressable onPress={onPress} style={{ minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{asset.name}</Text>
        <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 12 }}>{asset.symbol} · {asset.chain}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{formatUsd(quote?.price, false, currency.code)}</Text>
        <Text style={{ color: change === null || change === undefined ? theme.secondary : change >= 0 ? theme.positive : theme.negative, fontSize: 12, fontWeight: "800" }}>{formatMarketChange(change)}</Text>
      </View>
      <Pressable accessibilityLabel={favorite ? `Remove ${asset.name} from watchlist` : `Add ${asset.name} to watchlist`} onPress={(event) => { event.stopPropagation(); onFavorite(); }} style={{ width: 30, height: 40, alignItems: "center", justifyContent: "center" }}><TrustIcon color={favorite ? theme.blue : theme.secondary} name={favorite ? "star" : "star-outline"} size={20} /></Pressable>
    </Pressable>
  );
}
