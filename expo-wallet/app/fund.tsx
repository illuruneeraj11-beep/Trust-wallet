import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import {
  AssetChoiceRow,
  DemoFlowHeader,
  DemoModeBanner,
  FlowButton,
  FlowCard,
  FlowLabel,
  FlowTextInput,
  ResultPanel,
  StepDots,
  newIdempotencyKey,
  normalizeDecimalInput,
  shortDemoId,
} from "@/components/demo-wallet-flow-ui";
import { BrandLogo } from "@/components/trust-assets";
import { TrustIcon, type TrustIconName } from "@/components/trust-icon";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { baseUnitsToDecimal, decimalToBaseUnits } from "@/lib/wallet-amounts";

type Step = "methods" | "details" | "review" | "result";
type PendingFunding = { walletId: string; assetId: string; amount: string; idempotencyKey: string; createdAt: number };
const pendingFundingStoragePrefix = "trust-wallet:pending-funding:v2";
const maxFundingUnits = 10n ** 24n;

function firstRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function FundScreen() {
  const routeParams = useLocalSearchParams<{ amount?: string | string[]; symbol?: string | string[] }>();
  const requestedAmount = firstRouteParam(routeParams.amount);
  const requestedSymbol = firstRouteParam(routeParams.symbol)?.trim().toUpperCase();
  const { height: windowHeight } = useWindowDimensions();
  const { user, visualDemo } = useAuth();
  const {
    assets,
    fundDemoWallet,
    ledgerError,
    ledgerMode,
    ledgerStatus,
    refreshLedger,
    selectedWallet,
    setSelectedWalletId,
    theme,
    wallets,
  } = useAppContext();
  const [walletId, setWalletId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [amount, setAmount] = useState(() => normalizeDecimalInput(requestedAmount ?? "") || "100");
  const [step, setStep] = useState<Step>(() => requestedSymbol ? "details" : "methods");
  const [sheet, setSheet] = useState<"wallet" | "asset" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ transaction_id: string; mock_hash: string | null } | null>(null);
  const [intentKey, setIntentKey] = useState(() => newIdempotencyKey("fund"));
  const restoredFundingStorageKey = useRef<string | null>(null);
  const storageIdentity = visualDemo ? "visual-demo" : user && !user.is_anonymous ? user.id : null;
  const pendingFundingStorageKey = storageIdentity ? `${pendingFundingStoragePrefix}:${storageIdentity}` : null;

  useEffect(() => {
    if (!walletId && selectedWallet) setWalletId(selectedWallet.id);
  }, [selectedWallet, walletId]);

  useEffect(() => {
    if (!assetId && assets.length) {
      setAssetId((assets.find((item) => item.symbol.toUpperCase() === requestedSymbol) ?? assets.find((item) => item.symbol === "USDT") ?? assets[0]).id);
    }
  }, [assetId, assets, requestedSymbol]);

  useEffect(() => {
    if (
      !pendingFundingStorageKey
      || ledgerStatus !== "ready"
      || !wallets.length
      || !assets.length
      || restoredFundingStorageKey.current === pendingFundingStorageKey
    ) return undefined;
    restoredFundingStorageKey.current = pendingFundingStorageKey;
    let active = true;
    void AsyncStorage.getItem(pendingFundingStorageKey).then((raw) => {
      if (!active || !raw) return;
      try {
        const pending = JSON.parse(raw) as Partial<PendingFunding>;
        const valid = typeof pending.createdAt === "number"
          && Date.now() - pending.createdAt < 24 * 60 * 60 * 1000
          && typeof pending.walletId === "string"
          && typeof pending.assetId === "string"
          && typeof pending.amount === "string"
          && typeof pending.idempotencyKey === "string";
        if (!valid) {
          void AsyncStorage.removeItem(pendingFundingStorageKey);
          return;
        }
        if (!wallets.some((item) => item.id === pending.walletId) || !assets.some((item) => item.id === pending.assetId)) {
          void AsyncStorage.removeItem(pendingFundingStorageKey);
          return;
        }
        setWalletId(pending.walletId!);
        setAssetId(pending.assetId!);
        setAmount(pending.amount!);
        setIntentKey(pending.idempotencyKey!);
        setStep("details");
        setLocalError("A pending funding request was restored. Review and confirm it to recover the final receipt.");
      } catch {
        void AsyncStorage.removeItem(pendingFundingStorageKey);
      }
    });
    return () => { active = false; };
  }, [assets, ledgerStatus, pendingFundingStorageKey, wallets]);

  const wallet = wallets.find((item) => item.id === walletId) ?? selectedWallet ?? wallets[0] ?? null;
  const asset = assets.find((item) => item.id === assetId) ?? assets[0] ?? null;
  const validation = useMemo(() => {
    if (!asset || !amount) return { valid: false, message: "Enter an amount." };
    try {
      const units = decimalToBaseUnits(amount, asset.decimals);
      if (BigInt(units) > maxFundingUnits) {
        return { valid: false, message: `Maximum per request is ${baseUnitsToDecimal(maxFundingUnits.toString(), asset.decimals)} ${asset.symbol}.` };
      }
      return { valid: true, message: `You will receive ${amount} ${asset.symbol}.` };
    } catch (error) {
      return { valid: false, message: error instanceof Error ? error.message : "Enter a valid amount." };
    }
  }, [amount, asset]);
  const displayedError = localError ?? ledgerError;
  const loading = ledgerStatus === "loading" || ledgerStatus === "refreshing";
  const stepIndex = step === "details" ? 0 : step === "review" ? 1 : 2;

  function rotateIntent() {
    setIntentKey(newIdempotencyKey("fund"));
    setLocalError(null);
  }

  async function submit() {
    if (!wallet || !asset || !validation.valid || submitting) return;
    setSubmitting(true);
    setLocalError(null);
    try {
      const pending: PendingFunding = { walletId: wallet.id, assetId: asset.id, amount, idempotencyKey: intentKey, createdAt: Date.now() };
      if (pendingFundingStorageKey) await AsyncStorage.setItem(pendingFundingStorageKey, JSON.stringify(pending));
      const result = await fundDemoWallet({
        walletId: wallet.id,
        assetId: asset.id,
        amount,
        idempotencyKey: intentKey,
      });
      setSelectedWalletId(wallet.id);
      setReceipt({ transaction_id: result.transaction_id, mock_hash: result.mock_hash });
      if (pendingFundingStorageKey) await AsyncStorage.removeItem(pendingFundingStorageKey);
      setIntentKey(newIdempotencyKey("fund"));
      setStep("result");
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "The funding request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    if (pendingFundingStorageKey) void AsyncStorage.removeItem(pendingFundingStorageKey);
    setAmount("100");
    setReceipt(null);
    setLocalError(null);
    setIntentKey(newIdempotencyKey("fund"));
    setStep("details");
  }

  return (
    <>
      <AppScreen scrollable={step !== "result"} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, gap: 14 }}>
          <DemoFlowHeader
            onBack={step === "review" ? () => setStep("details") : step === "details" ? () => setStep("methods") : undefined}
            subtitle={step === "methods" ? undefined : wallet?.name ?? "Wallet balance"}
            title={step === "result" ? "Funding receipt" : step === "methods" ? "Fund your wallet" : "Add funds"}
          />
          {step !== "methods" ? <StepDots count={3} step={stepIndex} /> : null}

          {step === "methods" ? (
            <View style={{ gap: 12, paddingTop: 10 }}>
              <FundingSectionLabel>Recommended for you</FundingSectionLabel>
              <View>
                <FundingMethodRow
                  detail="Express Pay up to $500"
                  logo={(
                    <View style={{ width: 46, height: 28, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
                      <BrandLogo brand="google-pay" size={34} />
                    </View>
                  )}
                  onPress={() => router.push("/buy?method=google-pay")}
                  title="Google Pay"
                />
              </View>
              <FundingSectionLabel spaced>All options</FundingSectionLabel>
              <View style={{ borderRadius: 17, backgroundColor: theme.cardSecondary, overflow: "hidden", paddingHorizontal: 14 }}>
                <FundingMethodRow grouped icon="credit-card-outline" onPress={() => router.push("/buy")} title="All payment methods" />
                <FundingMethodRow
                  grouped
                  icon="swap-horizontal"
                  onPress={() => router.push("/deposit-binance")}
                  title="Exchange"
                />
                <FundingMethodRow
                  grouped
                  icon="qrcode"
                  onPress={() => router.push("/deposit-wallet-provider" as never)}
                  title="Crypto wallet"
                />
                <FundingMethodRow
                  detail="Any supported asset · no payment required"
                  grouped
                  icon="cash-plus"
                  last
                  onPress={() => setStep("details")}
                  title="Test funds"
                />
              </View>
            </View>
          ) : null}

          {step === "details" ? (
            <>
              <DemoModeBanner />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: theme.secondary, fontSize: 10, fontWeight: "800" }}>{ledgerMode === "connected" ? "SECURE LEDGER" : "LOCAL SIMULATION"}</Text>
                {loading ? <Text style={{ color: theme.blue, fontSize: 10, fontWeight: "800" }}>Refreshing...</Text> : null}
              </View>
              {displayedError ? <ErrorNotice message={displayedError} onRetry={() => void refreshLedger()} /> : null}

              <View style={{ gap: 7 }}>
                <FlowLabel>Deposit to</FlowLabel>
                <FlowCard onPress={() => setSheet("wallet")}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center" }}>
                      <TrustIcon color={theme.blue} name="wallet-outline" size={20} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{wallet?.name ?? "No wallet available"}</Text>
                      <Text style={{ color: theme.secondary, fontSize: 10 }}>Destination wallet</Text>
                    </View>
                    <TrustIcon color={theme.secondary} name="menu-down" size={18} />
                  </View>
                </FlowCard>
              </View>

              <View style={{ gap: 7 }}>
                <FlowLabel>Asset</FlowLabel>
                {asset ? (
                  <AssetChoiceRow name={asset.name} network={asset.network_name} onPress={() => setSheet("asset")} symbol={asset.symbol} />
                ) : (
                  <FlowCard><Text style={{ color: theme.negative, fontSize: 12 }}>No ledger assets are available.</Text></FlowCard>
                )}
              </View>

              <View style={{ gap: 7 }}>
                <FlowLabel>Amount</FlowLabel>
                <FlowTextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => { setAmount(normalizeDecimalInput(value)); rotateIntent(); }}
                  placeholder="0.00"
                  right={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{asset?.symbol}</Text>}
                  value={amount}
                />
                <Text style={{ color: amount && !validation.valid ? theme.negative : theme.secondary, fontSize: 10 }}>{validation.message}</Text>
              </View>

              <FlowCard muted>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                  <TrustIcon color={theme.secondary} name="cash-plus" size={23} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>Wallet funding</Text>
                    <Text style={{ color: theme.secondary, fontSize: 10 }}>Creates simulated balance · no payment required</Text>
                  </View>
                  <TrustIcon color={theme.positive} name="shield-check-outline" size={20} />
                </View>
              </FlowCard>
              <FlowButton disabled={!wallet || !asset || !validation.valid || loading} label="Review funding" onPress={() => setStep("review")} />
            </>
          ) : null}

          {step === "review" ? (
            <>
              <DemoModeBanner compact />
              <View style={{ alignItems: "center", gap: 6, paddingVertical: 18 }}>
                <Text style={{ color: theme.secondary, fontSize: 12 }}>You are adding</Text>
                <Text style={{ color: theme.text, fontSize: 38, fontWeight: "900" }}>{amount} {asset?.symbol}</Text>
                <Text style={{ color: theme.secondary, fontSize: 11 }}>{asset?.network_name}</Text>
              </View>
              <FlowCard>
                <ReviewRow label="Wallet" value={wallet?.name ?? "—"} />
                <ReviewRow label="Asset" value={`${asset?.name ?? "—"} (${asset?.symbol ?? ""})`} />
                <ReviewRow label="Source" value="Wallet funding" />
                <ReviewRow label="Network fee" value="No fee" last />
              </FlowCard>
              {displayedError ? <ErrorNotice message={displayedError} onRetry={() => void submit()} /> : null}
              <FlowButton label="Add funds" loading={submitting} onPress={() => void submit()} />
              <FlowButton label="Edit details" onPress={() => setStep("details")} secondary />
            </>
          ) : null}

          {step === "result" ? (
            <>
              <ResultPanel
                detail={<Text selectable style={{ color: theme.secondary, fontSize: 10 }}>Reference {shortDemoId(receipt?.mock_hash ?? receipt?.transaction_id, 13, 9)}</Text>}
                message={`${amount} ${asset?.symbol ?? ""} is now recorded in ${wallet?.name ?? "your wallet"}.`}
                success
                title="Funds added"
              />
              <FlowButton label="View transaction history" onPress={() => router.replace("/tx-history")} />
              <FlowButton label="Add more funds" onPress={reset} secondary />
            </>
          ) : null}
        </View>
      </AppScreen>

      <SheetModal onClose={() => setSheet(null)} subtitle="Choose the authoritative destination wallet" title="Select wallet" visible={sheet === "wallet"}>
        {wallets.map((item) => (
          <Pressable key={item.id} onPress={() => { setWalletId(item.id); setSelectedWalletId(item.id); rotateIntent(); setSheet(null); }} style={{ minHeight: 58, borderRadius: 15, backgroundColor: item.id === wallet?.id ? theme.blueSoft : theme.cardSecondary, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TrustIcon color={item.id === wallet?.id ? theme.blue : theme.secondary} name="wallet-outline" size={21} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "900" }}>{item.name}</Text>
            {item.id === wallet?.id ? <TrustIcon color={theme.blue} name="check" size={19} /> : null}
          </Pressable>
        ))}
      </SheetModal>
      <SheetModal onClose={() => setSheet(null)} title="Select asset" visible={sheet === "asset"}>
        <ScrollView
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: Math.max(280, Math.min(620, windowHeight - 180)) }}
        >
          {assets.map((item) => (
            <AssetChoiceRow active={item.id === asset?.id} key={item.id} name={item.name} network={item.network_name} onPress={() => { setAssetId(item.id); rotateIntent(); setSheet(null); }} symbol={item.symbol} />
          ))}
        </ScrollView>
      </SheetModal>
    </>
  );
}

function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { theme } = useAppContext();
  return <View style={{ minHeight: 46, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 }}><Text style={{ color: theme.secondary, fontSize: 11 }}>{label}</Text><Text numberOfLines={2} style={{ maxWidth: "68%", color: theme.text, fontSize: 11, fontWeight: "900", textAlign: "right" }}>{value}</Text></View>;
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { theme } = useAppContext();
  return (
    <View style={{ borderRadius: 14, backgroundColor: "#fdecec", padding: 12, flexDirection: "row", alignItems: "center", gap: 9 }}>
      <TrustIcon color={theme.negative} name="alert-circle-outline" size={19} />
      <Text style={{ flex: 1, color: theme.negative, fontSize: 11, lineHeight: 16 }}>{message}</Text>
      <Pressable onPress={onRetry}><Text style={{ color: theme.negative, fontSize: 11, fontWeight: "900" }}>Retry</Text></Pressable>
    </View>
  );
}

function FundingSectionLabel({ children, spaced = false }: { children: ReactNode; spaced?: boolean }) {
  const { theme } = useAppContext();
  return <Text style={{ color: theme.secondary, fontSize: 15, fontWeight: "600", marginTop: spaced ? 16 : 0 }}>{children}</Text>;
}

function FundingMethodRow({ title, detail, icon, logo, grouped = false, last = false, onPress }: { title: string; detail?: string; icon?: TrustIconName; logo?: ReactNode; grouped?: boolean; last?: boolean; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable
      accessibilityLabel={detail ? `${title}. ${detail}` : title}
      accessibilityRole="button"
      onPress={onPress}
      style={{ minHeight: 80, borderRadius: grouped ? 0 : 17, borderBottomWidth: grouped && !last ? 1 : 0, borderBottomColor: theme.border, backgroundColor: grouped ? "transparent" : theme.cardSecondary, paddingHorizontal: grouped ? 0 : 14, flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      {logo ?? (
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center" }}>
          <TrustIcon color={theme.blue} name={icon ?? "wallet-outline"} size={21} />
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>{title}</Text>
        {detail ? <Text style={{ color: theme.secondary, fontSize: 12 }}>{detail}</Text> : null}
      </View>
      <TrustIcon color={theme.secondary} name="chevron-right" size={21} />
    </Pressable>
  );
}
