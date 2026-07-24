import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { formatUsd } from "@/components/live-market-ui";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { assetRegistry, getAssetBySymbol, type AssetDefinition } from "@/data/asset-registry";

const networkChips = ["All", "ETH", "TRX", "BTC", "BNB"];

export default function SwapScreen() {
  const { currency, marketByAssetId, theme } = useAppContext();
  const [payAsset, setPayAsset] = useState<AssetDefinition | null>(null);
  const [receiveAsset, setReceiveAsset] = useState<AssetDefinition | null>(getAssetBySymbol("ETH") ?? null);
  const [payAmount, setPayAmount] = useState("0");
  const [selectorSide, setSelectorSide] = useState<"pay" | "receive" | null>(null);
  const [orderSheet, setOrderSheet] = useState(false);
  const [previewSheet, setPreviewSheet] = useState(false);

  useEffect(() => {
    if (!selectorSide && !orderSheet && !previewSheet) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (previewSheet) setPreviewSheet(false);
      else if (orderSheet) setOrderSheet(false);
      else setSelectorSide(null);
      return true;
    });
    return () => subscription.remove();
  }, [orderSheet, previewSheet, selectorSide]);

  if (selectorSide) {
    return (
      <TokenSelector
        side={selectorSide}
        onClose={() => setSelectorSide(null)}
        onSelect={(asset) => {
          selectorSide === "pay" ? setPayAsset(asset) : setReceiveAsset(asset);
          setSelectorSide(null);
        }}
      />
    );
  }

  const payQuote = payAsset ? marketByAssetId[payAsset.assetId] : undefined;
  const receiveQuote = receiveAsset ? marketByAssetId[receiveAsset.assetId] : undefined;
  const numericPayAmount = Number(payAmount);
  const payFiatValue = numericPayAmount > 0 && payQuote?.price ? numericPayAmount * payQuote.price : null;
  const numericReceiveAmount = payFiatValue && receiveQuote?.price ? payFiatValue / receiveQuote.price : null;
  const receiveAmount = numericReceiveAmount
    ? numericReceiveAmount.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 8 })
    : "--";
  const canSwap = Boolean(numericReceiveAmount && payAsset && receiveAsset && payQuote?.price && receiveQuote?.price);

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 12, gap: 7 }}>
          <View style={{ height: 56, alignItems: "center", justifyContent: "center" }}>
            <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 42, height: 42, alignItems: "center", justifyContent: "center" }}>
              <TrustIcon color={theme.secondary} name="arrow-left" size={24} />
            </Pressable>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "800" }}>Swap</Text>
            <View style={{ position: "absolute", right: 0, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Pressable onPress={() => setOrderSheet(true)} style={{ minHeight: 36, borderRadius: 18, backgroundColor: theme.surface, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: "800" }}>Market</Text>
                <TrustIcon color={theme.text} name="menu-down" size={14} />
              </Pressable>
              <Pressable accessibilityLabel="Order settings" accessibilityRole="button" onPress={() => setOrderSheet(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
                <TrustIcon color={theme.text} name="tune-variant" size={18} />
              </Pressable>
            </View>
          </View>

          <SwapAssetPanel
            amount={payAmount}
            asset={payAsset}
            fiatValue={payFiatValue === null ? "Enter an amount" : formatUsd(payFiatValue, false, currency.code)}
            label="You pay"
            onAmountChange={setPayAmount}
            onAssetPress={() => setSelectorSide("pay")}
            trailing={
              <Pressable onPress={() => router.push("/fund")} style={{ minHeight: 32, borderRadius: 16, backgroundColor: "#ffffff", paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <TrustIcon color={theme.text} name="plus" size={15} />
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: "800" }}>Fund</Text>
              </Pressable>
            }
          />

          <View style={{ height: 0, zIndex: 2, alignItems: "center", justifyContent: "center" }}>
            <Pressable
              accessibilityLabel="Reverse swap assets"
              onPress={() => {
                const previousPay = payAsset;
                setPayAsset(receiveAsset);
                setReceiveAsset(previousPay);
              }}
              style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: "#ffffff", borderWidth: 2, borderColor: theme.surface, alignItems: "center", justifyContent: "center" }}
            >
              <TrustIcon color={theme.secondary} name="arrow-down" size={15} />
            </Pressable>
          </View>

          <SwapAssetPanel
            amount={receiveAmount}
            asset={receiveAsset}
            fiatValue={payFiatValue === null
              ? "Waiting for amount"
              : numericReceiveAmount
                ? formatUsd(numericReceiveAmount * Number(receiveQuote?.price), false, currency.code)
                : "Live quote unavailable"}
            label="You receive"
            onAmountChange={() => undefined}
            onAssetPress={() => setSelectorSide("receive")}
          />

          <View style={{ flex: 1 }} />
          <Pressable disabled={!canSwap} onPress={() => setPreviewSheet(true)} style={{ height: 54, borderRadius: 27, backgroundColor: canSwap ? theme.blue : theme.surface, marginBottom: 20, padding: 5, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: canSwap ? "#ffffff" : "#e0e0e3", alignItems: "center", justifyContent: "center" }}>
              <TrustIcon color={canSwap ? theme.blue : "#b1b1b5"} name="arrow-right" size={20} />
            </View>
            <Text style={{ flex: 1, marginRight: 44, color: canSwap ? "#ffffff" : "#b1b1b5", fontSize: 14, fontWeight: "800", textAlign: "center" }}>Review Swap</Text>
          </Pressable>
        </View>
      </AppScreen>

      <SheetModal visible={orderSheet} title="Options" onClose={() => setOrderSheet(false)}>
        <SheetOption active description="Indicative CoinMarketCap spot cross-rate" label="Market rate" onPress={() => setOrderSheet(false)} />
        <SheetOption description="Unavailable on Testnet" label="Limit" onPress={() => setOrderSheet(false)} />
        <SheetOption description="DEX routing and slippage are not calculated" label="Swap settings" onPress={() => setOrderSheet(false)} />
      </SheetModal>
      <SheetModal visible={previewSheet} title="Review swap" subtitle="Indicative CoinMarketCap spot estimate" onClose={() => setPreviewSheet(false)}>
        <View style={{ borderRadius: 17, backgroundColor: theme.background, padding: 15, gap: 8 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{payAmount} {payAsset?.symbol ?? "--"} → {receiveAmount} {receiveAsset?.symbol ?? "--"}</Text>
          <Text style={{ color: theme.secondary, fontSize: 13, lineHeight: 19 }}>This Testnet cross-rate uses current CMC spot prices. It is not an executable DEX quote and includes no fees, spread, price impact, or slippage.</Text>
        </View>
        <View style={{ borderRadius: 17, backgroundColor: "#fff7dd", padding: 14, flexDirection: "row", gap: 10 }}>
          <TrustIcon color="#9a6800" name="shield-alert-outline" size={22} />
          <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>Swaps are unavailable on Testnet.</Text>
        </View>
        <Pressable onPress={() => setPreviewSheet(false)} style={{ height: 52, borderRadius: 26, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>Close</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function SwapAssetPanel({
  amount,
  asset,
  fiatValue,
  label,
  onAmountChange,
  onAssetPress,
  trailing,
}: {
  amount: string;
  asset: AssetDefinition | null;
  fiatValue: string;
  label: string;
  onAmountChange: (value: string) => void;
  onAssetPress: () => void;
  trailing?: React.ReactNode;
}) {
  const { theme } = useAppContext();
  return (
    <View style={{ minHeight: 97, borderRadius: 11, backgroundColor: theme.surface, padding: 12, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          accessibilityLabel={`${label} amount`}
          keyboardType="decimal-pad"
          onChangeText={(value) => onAmountChange(value.replace(/[^0-9.]/g, ""))}
          value={amount}
          style={{ flex: 1, color: theme.text, fontSize: 22, fontWeight: "800", padding: 0 }}
        />
        {trailing}
        <Pressable onPress={onAssetPress} style={{ minHeight: 34, borderRadius: 18, backgroundColor: "#ffffff", paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 6 }}>
          {asset ? <TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={24} /> : <TrustIcon color={theme.secondary} name="plus-circle-outline" size={23} />}
          <Text style={{ color: theme.text, fontSize: 12, fontWeight: "900" }}>{asset?.symbol ?? "Select"}</Text>
          <TrustIcon color={theme.secondary} name="menu-down" size={14} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: theme.secondary, fontSize: 10 }}>{fiatValue}</Text>
        <Text style={{ color: theme.secondary, fontSize: 10 }}>Balance 0</Text>
      </View>
    </View>
  );
}

function TokenSelector({ side, onClose, onSelect }: { side: "pay" | "receive"; onClose: () => void; onSelect: (asset: AssetDefinition) => void }) {
  const { currency, marketByAssetId, theme } = useAppContext();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assetRegistry.filter((asset) => {
      const filterMatch = filter === "All" || asset.networkSymbol === filter;
      const queryMatch = !term || asset.name.toLowerCase().includes(term) || asset.symbol.toLowerCase().includes(term) || asset.contract?.toLowerCase().includes(term);
      const favoriteMatch = !favoritesOnly || ["BTC", "ETH", "BNB", "SOL"].includes(asset.symbol);
      return filterMatch && queryMatch && favoriteMatch;
    });
  }, [favoritesOnly, filter, query]);

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <View style={{ height: 55, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>{side === "receive" ? "You receive" : "You pay"}</Text>
          <Pressable onPress={onClose} style={{ position: "absolute", right: 0, width: 42, height: 42, borderRadius: 21, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
            <TrustIcon color={theme.text} name="close" size={24} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}><SearchInput value={query} onChangeText={setQuery} placeholder="Search token or CA" /></View>
          <Pressable accessibilityLabel="Favorite tokens" onPress={() => setFavoritesOnly((current) => !current)} style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center" }}>
            <TrustIcon color={favoritesOnly ? theme.blue : theme.secondary} name={favoritesOnly ? "star" : "star-outline"} size={24} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, alignItems: "center" }}>
          {networkChips.map((network) => (
            <Pressable key={network} onPress={() => setFilter(network)} style={{ width: 38, height: 38, borderRadius: 9, borderWidth: filter === network ? 2 : 0, borderColor: theme.blue, backgroundColor: network === "All" ? "#ffffff" : theme.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {network === "All" ? <Text style={{ color: theme.text, fontSize: 12, fontWeight: "800" }}>All</Text> : <TokenLogo symbol={network} size={36} />}
            </Pressable>
          ))}
          <Pressable onPress={() => router.push("/network-selector")} style={{ minHeight: 38, borderRadius: 19, backgroundColor: theme.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text style={{ color: theme.secondary, fontSize: 12, fontWeight: "800" }}>28+</Text>
            <TrustIcon color={theme.secondary} name="menu-down" size={17} />
          </Pressable>
        </ScrollView>

        <View style={{ gap: 1 }}>
          {rows.map((asset) => {
            const quote = marketByAssetId[asset.assetId];
            return (
              <Pressable key={asset.assetId} onPress={() => onSelect(asset)} style={{ minHeight: 61, flexDirection: "row", alignItems: "center", gap: 11 }}>
                <TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={39} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>{asset.symbol}</Text>
                  <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 10 }}>{asset.name}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>{formatUsd(quote?.price, false, currency.code)}</Text>
                  <Text style={{ color: theme.secondary, fontSize: 10 }}>MCap: {formatUsd(quote?.marketCap, true, currency.code)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </AppScreen>
  );
}

function SheetOption({ active, description, label, onPress }: { active?: boolean; description: string; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 66, borderRadius: 16, backgroundColor: theme.cardSecondary, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{label}</Text>
        <Text style={{ color: theme.secondary, fontSize: 11 }}>{description}</Text>
      </View>
      <View style={{ width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: active ? theme.blue : theme.secondary, alignItems: "center", justifyContent: "center" }}>
        {active ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.blue }} /> : null}
      </View>
    </Pressable>
  );
}
