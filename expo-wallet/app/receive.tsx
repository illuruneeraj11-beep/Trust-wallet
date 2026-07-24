import { router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, ScrollView, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { assetRegistry, type AssetDefinition } from "@/data/asset-registry";

type UiAddress = { address: string; network?: string; network_code?: string; network_slug?: string; asset_id?: string | null };
type UiWallet = { id: string; name: string; addresses?: UiAddress[]; handle?: string | null };
type ReceiveSelection = { asset: AssetDefinition; address: string };
const popularIds = ["bitcoin:native", "ethereum:native", "solana:native", "bsc:native", "bsc:bep20:0x4b0f1812e5df2a09796481ff14017e6005508003"];

export default function ReceiveScreen() {
  const params = useLocalSearchParams<{ assetId?: string }>();
  const { selectedWallet, theme } = useAppContext();
  const wallet = selectedWallet as unknown as UiWallet | null;
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState("All Networks");
  const [selected, setSelected] = useState<ReceiveSelection | null>(null);
  const [unavailable, setUnavailable] = useState<AssetDefinition | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const assets = useMemo(() => assetRegistry.filter((asset) => asset.availability !== "unavailable"), []);
  const popular = useMemo(() => popularIds.map((id) => assets.find((asset) => asset.assetId === id)).filter((asset): asset is AssetDefinition => Boolean(asset)), [assets]);
  const networks = useMemo(() => ["All Networks", ...Array.from(new Set(assets.map((asset) => asset.chain))).slice(0, 7)], [assets]);
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assets.filter((asset) => (network === "All Networks" || asset.chain === network)
      && (!term || `${asset.symbol} ${asset.name} ${asset.chain} ${asset.contract ?? ""}`.toLowerCase().includes(term)));
  }, [assets, network, query]);

  function openAsset(asset: AssetDefinition) {
    const expectedNetwork = networkSlugForAsset(asset);
    const address = wallet?.addresses?.find((item) => {
      const addressNetwork = (item.network_slug ?? item.network_code ?? item.network ?? "").toLowerCase();
      return addressNetwork === expectedNetwork;
    })?.address;
    if (!address) {
      setUnavailable(asset);
      return;
    }
    setSelected({ asset, address });
  }

  useEffect(() => {
    if (!params.assetId || selected || unavailable) return;
    const requested = assets.find((asset) => asset.assetId === params.assetId);
    if (requested) openAsset(requested);
  }, [assets, params.assetId, selected, unavailable]);

  useEffect(() => {
    if (!selected && !unavailable && !message) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (message) setMessage(null);
      else if (unavailable) setUnavailable(null);
      else setSelected(null);
      return true;
    });
    return () => subscription.remove();
  }, [message, selected, unavailable]);

  if (selected) {
    return (
      <>
        <ReceiveDetail selection={selected} wallet={wallet} onBack={() => setSelected(null)} onMessage={setMessage} />
        <SheetModal visible={Boolean(message)} title={message ?? ""} onClose={() => setMessage(null)}>
          <PrimaryButton label="Done" onPress={() => setMessage(null)} />
        </SheetModal>
      </>
    );
  }

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 15 }}>
          <View style={{ height: 62, alignItems: "center", justifyContent: "center" }}>
            <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ position: "absolute", left: 0, width: 44, height: 44, justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={27} /></Pressable>
            <Text style={{ color: theme.text, fontSize: 21, fontWeight: "900" }}>Receive</Text>
          </View>

          <SearchInput onChangeText={setQuery} placeholder="Search crypto" value={query} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12 }}>
            {networks.map((item) => (
              <Pressable key={item} onPress={() => setNetwork(item)} style={{ minHeight: 38, borderRadius: 19, backgroundColor: network === item ? "#d3d3d9" : theme.surface, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: network === item ? theme.text : theme.secondary, fontSize: 13, fontWeight: "800" }}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {!query && network === "All Networks" ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: theme.text, fontSize: 19, fontWeight: "900" }}>Popular</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }}>
                {popular.map((asset) => (
                  <Pressable key={asset.assetId} onPress={() => openAsset(asset)} style={{ width: "23.5%", minHeight: 92, borderRadius: 17, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={40} />
                    <Text numberOfLines={1} style={{ maxWidth: "90%", color: theme.text, fontSize: 12, fontWeight: "900" }}>{asset.symbol}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: 3 }}>
            <Text style={{ color: theme.text, fontSize: 19, fontWeight: "900", marginTop: 3 }}>All crypto</Text>
            {rows.map((asset) => (
              <Pressable key={asset.assetId} onPress={() => openAsset(asset)} style={{ minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={43} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text numberOfLines={1} style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{asset.name}</Text>
                  <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 12 }}>{asset.symbol} · {asset.chain}</Text>
                </View>
                <TrustIcon color={theme.secondary} name="chevron-right" size={21} />
              </Pressable>
            ))}
          </View>

          {!rows.length ? <View style={{ minHeight: 250, alignItems: "center", justifyContent: "center", gap: 9 }}><TrustIcon color={theme.secondary} name="magnify" size={38} /><Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>No crypto found</Text></View> : null}
        </View>
      </AppScreen>

      <SheetModal visible={Boolean(unavailable)} title={unavailable ? `Receive ${unavailable.symbol}` : "Receive"} subtitle="Address unavailable for this simulated asset" onClose={() => setUnavailable(null)}>
        <View style={{ borderRadius: 18, backgroundColor: theme.background, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          {unavailable ? <TokenLogo network={unavailable.networkSymbol} symbol={unavailable.symbol} uri={unavailable.logo} size={42} /> : null}
          <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>A receive QR appears only when this wallet has an address for the selected network.</Text>
        </View>
        <PrimaryButton label="Close" onPress={() => setUnavailable(null)} />
      </SheetModal>
    </>
  );
}

function ReceiveDetail({ selection, wallet, onBack, onMessage }: { selection: ReceiveSelection; wallet: UiWallet | null; onBack: () => void; onMessage: (message: string) => void }) {
  const { theme } = useAppContext();
  const { asset, address } = selection;
  const qrPayload = `trust-testnet://receive?address=${encodeURIComponent(address)}&network=${encodeURIComponent(networkSlugForAsset(asset))}&asset=${encodeURIComponent(asset.symbol)}`;

  async function copy(value: string) {
    try {
      await Clipboard.setStringAsync(value);
      onMessage("Address copied");
    } catch {
      onMessage("Copy is unavailable on this device");
    }
  }

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <View style={{ height: 62, alignItems: "center", justifyContent: "center" }}>
          <Pressable accessibilityLabel="Back to asset selection" accessibilityRole="button" onPress={onBack} style={{ position: "absolute", left: 0, width: 44, height: 44, justifyContent: "center" }}><TrustIcon color={theme.secondary} name="arrow-left" size={27} /></Pressable>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>Receive {asset.symbol}</Text>
        </View>
        <View style={{ borderRadius: 16, backgroundColor: "#fff7dd", padding: 13, flexDirection: "row", gap: 9 }}><TrustIcon color="#9a6800" name="information-outline" size={19} /><Text style={{ flex: 1, color: theme.text, fontSize: 12, lineHeight: 17 }}>Simulation address. Do not send assets from a public blockchain.</Text></View>
        <View style={{ alignItems: "center", gap: 15, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><TokenLogo network={asset.networkSymbol} symbol={asset.symbol} uri={asset.logo} size={34} /><Text style={{ color: theme.text, fontSize: 19, fontWeight: "900" }}>{asset.name}</Text></View>
          <View style={{ width: 238, height: 238, backgroundColor: "#ffffff", borderRadius: 12, padding: 10, alignItems: "center", justifyContent: "center" }}>
            <QRCode backgroundColor="#ffffff" color="#101010" quietZone={0} size={218} value={qrPayload} />
            <View style={{ position: "absolute", width: 43, height: 43, borderRadius: 22, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}><TokenLogo symbol={asset.symbol} uri={asset.logo} size={34} /></View>
          </View>
          <Pressable onPress={() => void copy(address)}><Text selectable style={{ maxWidth: 310, color: theme.secondary, fontSize: 12, fontWeight: "700", textAlign: "center", lineHeight: 18 }}>{address}</Text></Pressable>
          <Text style={{ color: theme.secondary, fontSize: 12 }}>{wallet?.name ?? "Wallet"} · {asset.chain}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <DetailAction icon="content-copy" label="Copy" onPress={() => void copy(address)} />
          <DetailAction icon="share-variant-outline" label="Share" onPress={() => void Share.share({ message: address })} />
        </View>
      </View>
    </AppScreen>
  );
}

function DetailAction({ icon, label, onPress }: { icon: "content-copy" | "share-variant-outline"; label: string; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={{ flex: 1, minHeight: 62, borderRadius: 16, backgroundColor: "#f1f1f3", alignItems: "center", justifyContent: "center", gap: 6 }}><TrustIcon color="#202124" name={icon} size={21} /><Text style={{ color: "#202124", fontSize: 12, fontWeight: "900" }}>{label}</Text></Pressable>;
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ height: 54, borderRadius: 27, backgroundColor: "#0500ff", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>{label}</Text></Pressable>;
}

function networkSlugForAsset(asset: AssetDefinition) {
  const aliases: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    BNB: "bsc",
    SOL: "solana",
    TRX: "tron",
  };
  return aliases[asset.networkSymbol] ?? asset.chain.toLowerCase().replace(/\s+/g, "-");
}
