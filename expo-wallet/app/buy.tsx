import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BrandLogo, TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { getAssetById, getAssetBySymbol } from "@/data/asset-registry";
import { currencyOptions } from "@/data/trust-wallet";

type BuyTab = "Buy" | "Sell";
type BuySheet = "more" | "asset" | "currency" | "preview" | null;
const buyAssetIds = ["bitcoin:native", "ethereum:native", "bsc:native", "solana:native"];
const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"] as const;

export default function BuyScreen() {
  const { currency, marketByAssetId, setCurrencyCode, theme } = useAppContext();
  const [tab, setTab] = useState<BuyTab>("Buy");
  const [amount, setAmount] = useState("250");
  const [assetId, setAssetId] = useState("bitcoin:native");
  const [sheet, setSheet] = useState<BuySheet>(null);
  const asset = getAssetById(assetId) ?? getAssetBySymbol("BTC")!;
  const quote = marketByAssetId[asset.assetId];
  const numericAmount = Number(amount || 0);
  const cryptoAmount = quote?.price && numericAmount > 0 ? numericAmount / quote.price : null;
  const canContinue = tab === "Buy" && numericAmount > 0 && Boolean(quote?.price);

  const cryptoFundingAmount = useMemo(() => {
    if (cryptoAmount === null || !Number.isFinite(cryptoAmount) || cryptoAmount <= 0) return null;
    return cryptoAmount.toFixed(8).replace(/\.?0+$/, "");
  }, [cryptoAmount]);

  const cryptoLabel = useMemo(() => {
    if (cryptoAmount === null) return "Live quote unavailable";
    if (cryptoAmount >= 1) return cryptoAmount.toLocaleString("en-US", { maximumFractionDigits: 6 });
    return cryptoAmount.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  }, [cryptoAmount]);

  function typeKey(key: (typeof keys)[number]) {
    if (key === "backspace") {
      setAmount((value) => value.slice(0, -1));
      return;
    }
    setAmount((value) => {
      if (key === "." && value.includes(".")) return value;
      if (value === "0" && key !== ".") return key;
      if (value.length >= 15) return value;
      return `${value}${key}`;
    });
  }

  function openTestFunding() {
    setSheet(null);
    router.push({
      pathname: "/fund",
      params: cryptoFundingAmount
        ? { amount: cryptoFundingAmount, symbol: asset.symbol }
        : { symbol: asset.symbol },
    });
  }

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ height: 66, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <CircleButton icon="arrow-left" onPress={() => router.back()} />
            <View style={{ flex: 1, height: 44, borderRadius: 23, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardSecondary, padding: 3, flexDirection: "row" }}>
              {(["Buy", "Sell"] as BuyTab[]).map((item) => (
                <Pressable key={item} onPress={() => setTab(item)} style={{ flex: 1, borderRadius: 20, backgroundColor: tab === item ? "#ffffff" : "transparent", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: tab === item ? theme.text : theme.secondary, fontSize: 16, fontWeight: "900" }}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <CircleButton icon="dots-horizontal" onPress={() => setSheet("more")} />
          </View>

          {tab === "Buy" ? (
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, minHeight: 290, alignItems: "center", justifyContent: "center", gap: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ maxWidth: 190, color: theme.text, fontSize: 54, fontWeight: "500", letterSpacing: 1 }}>{amount || "0"}</Text>
                  <View style={{ width: 1, height: 58, backgroundColor: "#bfc0ff" }} />
                  <Pill onPress={() => setSheet("currency")}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#e8ecff", alignItems: "center", justifyContent: "center" }}><TrustIcon color="#3158d7" name="cash-multiple" size={16} /></View>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{currency.code}</Text>
                    <TrustIcon color={theme.secondary} name="chevron-right" size={18} />
                  </Pill>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Text style={{ color: theme.secondary, fontSize: 18, fontWeight: "700" }}>{cryptoLabel}</Text>
                  <Pill onPress={() => setSheet("asset")}>
                    <TokenLogo symbol={asset.symbol} uri={asset.logo} size={24} />
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{asset.symbol}</Text>
                    <TrustIcon color={theme.secondary} name="chevron-right" size={18} />
                  </Pill>
                </View>
              </View>

              <Pressable onPress={() => setSheet("preview")} style={{ minHeight: 64, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffffff", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                  <BrandLogo brand="visa" size={23} />
                  <View style={{ marginLeft: -8 }}><BrandLogo brand="mastercard" size={23} /></View>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: theme.secondary, fontSize: 12 }}>Pay with</Text>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Card</Text>
                </View>
                <TrustIcon color={theme.secondary} name="chevron-right" size={23} />
              </Pressable>

              <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap" }}>
                {keys.map((key) => (
                  <Pressable key={key} onPress={() => typeKey(key)} style={{ width: "33.333%", height: 61, alignItems: "center", justifyContent: "center" }}>
                    {key === "backspace" ? <TrustIcon color={theme.text} name="backspace-outline" size={25} /> : <Text style={{ color: theme.text, fontSize: 23, fontWeight: "800" }}>{key}</Text>}
                  </Pressable>
                ))}
              </View>

              <Pressable disabled={!canContinue} onPress={() => setSheet("preview")} style={{ height: 55, borderRadius: 28, backgroundColor: canContinue ? theme.blue : theme.cardSecondary, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Text style={{ color: canContinue ? "#ffffff" : theme.secondary, fontSize: 17, fontWeight: "900" }}>Continue</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1, paddingBottom: 14 }}>
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 17 }}>
                <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900", textAlign: "center" }}>You don&apos;t have crypto to sell</Text>
                <Text style={{ color: theme.secondary, fontSize: 14, textAlign: "center" }}>Add crypto to this wallet before selling.</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pill onPress={() => setSheet("asset")}><TokenLogo symbol={asset.symbol} uri={asset.logo} size={24} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{asset.symbol}</Text><TrustIcon color={theme.secondary} name="chevron-right" size={18} /></Pill>
                  <Pill onPress={() => setSheet("currency")}><TrustIcon color="#3158d7" name="cash-multiple" size={21} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{currency.code}</Text><TrustIcon color={theme.secondary} name="chevron-right" size={18} /></Pill>
                </View>
                <View style={{ width: "100%", gap: 12 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.cardSecondary }}><View style={{ width: 10, height: 10, marginTop: -2, borderRadius: 5, backgroundColor: theme.secondary }} /></View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: theme.secondary, fontSize: 12 }}>Min</Text><Text style={{ color: theme.secondary, fontSize: 12 }}>Max</Text></View>
                </View>
              </View>
              <Pressable disabled style={{ height: 55, borderRadius: 28, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}><Text style={{ color: theme.secondary, fontSize: 17, fontWeight: "900" }}>Buy crypto first</Text></Pressable>
            </View>
          )}
        </View>
      </AppScreen>

      <SheetModal visible={sheet === "more"} title="Buy options" onClose={() => setSheet(null)}>
        <OptionRow icon="account-multiple-outline" label="Buy with P2P" onPress={() => setSheet("preview")} />
        <OptionRow icon="cash-plus" label="Deposit cash" onPress={() => setSheet("preview")} />
      </SheetModal>
      <SheetModal visible={sheet === "asset"} title="Select crypto" subtitle="Quotes update from the live market provider" onClose={() => setSheet(null)}>
        {buyAssetIds.map((id) => getAssetById(id)).filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => (
          <Pressable key={item.assetId} onPress={() => { setAssetId(item.assetId); setSheet(null); }} style={{ minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TokenLogo symbol={item.symbol} uri={item.logo} size={38} />
            <View style={{ flex: 1 }}><Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{item.name}</Text><Text style={{ color: theme.secondary, fontSize: 12 }}>{item.chain}</Text></View>
            <TrustIcon color={item.assetId === asset.assetId ? theme.blue : theme.secondary} name={item.assetId === asset.assetId ? "radiobox-marked" : "radiobox-blank"} size={23} />
          </Pressable>
        ))}
      </SheetModal>
      <SheetModal visible={sheet === "currency"} title="Select currency" onClose={() => setSheet(null)}>
        {currencyOptions.map((item) => (
          <CurrencyChoice
            key={item.code}
            active={item.code === currency.code}
            label={`${item.label} (${item.code})`}
            onPress={() => {
              setCurrencyCode(item.code);
              setSheet(null);
            }}
          />
        ))}
      </SheetModal>
      <SheetModal visible={sheet === "preview"} title="Payments unavailable" subtitle="Buying, selling, P2P, and cash deposits are unavailable in this simulation." onClose={() => setSheet(null)}>
        <View style={{ minHeight: 82, borderRadius: 18, backgroundColor: theme.background, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TrustIcon color={theme.blue} name="shield-check-outline" size={29} />
          <Text style={{ flex: 1, color: theme.secondary, fontSize: 13, lineHeight: 19 }}>No card details, payment, deposit, wallet signature, or seed phrase is requested.</Text>
        </View>
        <Pressable
          accessibilityLabel={`Add test funds for ${asset.symbol}`}
          accessibilityRole="button"
          onPress={openTestFunding}
          style={{ height: 54, borderRadius: 27, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>Add test funds</Text>
        </Pressable>
        <Pressable accessibilityLabel="Close payment options" accessibilityRole="button" onPress={() => setSheet(null)} style={{ height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Close</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function CircleButton({ icon, onPress }: { icon: "arrow-left" | "dots-horizontal"; onPress: () => void }) {
  return <Pressable accessibilityLabel={icon === "arrow-left" ? "Back" : "More options"} accessibilityRole="button" onPress={onPress} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#f1f1f3", alignItems: "center", justifyContent: "center" }}><TrustIcon color="#202124" name={icon} size={24} /></Pressable>;
}

function Pill({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 46, borderRadius: 24, backgroundColor: "#f1f1f3", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 7 }}>{children}</Pressable>;
}

function OptionRow({ icon, label, onPress }: { icon: "account-multiple-outline" | "cash-plus"; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 58, flexDirection: "row", alignItems: "center", gap: 13 }}><View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#f1f1f3", alignItems: "center", justifyContent: "center" }}><TrustIcon color="#0500ff" name={icon} size={22} /></View><Text style={{ flex: 1, color: "#202124", fontSize: 16, fontWeight: "900" }}>{label}</Text><TrustIcon color="#6d6d72" name="chevron-right" size={21} /></Pressable>;
}

function CurrencyChoice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 13 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.blue} name="cash-multiple" size={22} /></View>
      <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "900" }}>{label}</Text>
      <TrustIcon color={active ? theme.blue : theme.secondary} name={active ? "radiobox-marked" : "radiobox-blank"} size={23} />
    </Pressable>
  );
}
