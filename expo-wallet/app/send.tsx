import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { AppScreen, SheetModal } from "@/components/trust-ui";
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
import { TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { decimalToBaseUnits } from "@/lib/wallet-amounts";

type UiAsset = { id: string; symbol: string; name: string; network?: string; network_code?: string; network_slug?: string; decimals: number };
type UiBalance = { asset_id: string; amount?: number | string; display_amount?: string; available_amount?: string; available_units?: string };
type UiAddress = { address: string; network?: string; network_code?: string; network_slug?: string };
type UiWallet = { id: string; name: string; balances?: UiBalance[]; addresses?: UiAddress[] };
type ResolvedRecipient = {
  walletId?: string;
  wallet_id?: string;
  displayName?: string;
  display_name?: string;
  handle?: string | null;
  address?: string;
  network?: string;
};
type TransferResult = { id?: string; transactionId?: string; transaction_id?: string; hash?: string; mock_hash?: string | null; status?: string };
type PendingTransfer = {
  fromWalletId: string;
  recipient: string;
  assetId: string;
  amount: string;
  note: string;
  idempotencyKey: string;
  createdAt: number;
};
const pendingTransferStoragePrefix = "trust-wallet:pending-transfer:v2";

export default function SendScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ recipient?: string; asset?: string; network?: string; amount?: string; note?: string; selectAsset?: string }>();
  const { user, visualDemo } = useAuth();
  const {
    addressBook,
    assets: contextAssets,
    resolveRecipient,
    selectedWallet,
    sendDemoTransfer,
    theme,
    wallets: contextWallets,
  } = useAppContext();
  const assets = contextAssets as unknown as UiAsset[];
  const wallet = selectedWallet as unknown as UiWallet | null;
  const wallets = contextWallets as unknown as UiWallet[];
  const otherWallets = wallets.filter((item) => item.id !== wallet?.id);
  const storageIdentity = visualDemo ? "visual-demo" : user && !user.is_anonymous ? user.id : null;
  const pendingTransferStorageKey = storageIdentity ? `${pendingTransferStoragePrefix}:${storageIdentity}` : null;
  const initialAsset = assets.find((item) => (item.id === params.asset || item.symbol.toLowerCase() === params.asset?.toLowerCase())
    && (!params.network || (item.network_slug ?? item.network_code ?? item.network)?.toLowerCase() === params.network.toLowerCase())) ?? assets[0];
  const [assetId, setAssetId] = useState(initialAsset?.id ?? "");
  const [recipient, setRecipient] = useState(params.recipient ?? "");
  const [amount, setAmount] = useState(params.amount && Number(params.amount) > 0 ? params.amount : "");
  const [note, setNote] = useState(params.note ?? "");
  const [step, setStep] = useState<"details" | "review" | "result">("details");
  const [assetSheet, setAssetSheet] = useState(false);
  const [resolved, setResolved] = useState<ResolvedRecipient | null>(null);
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => newIdempotencyKey("send"));
  const asset = assets.find((item) => item.id === assetId) ?? assets[0];
  const balance = wallet?.balances?.find((item) => item.asset_id === asset?.id);
  const available = balance?.available_amount ?? balance?.display_amount ?? String(balance?.amount ?? "0");
  const amountValidation = useMemo(() => {
    if (!asset || !amount) return { units: null, message: "Enter an amount." };
    try {
      return { units: decimalToBaseUnits(amount, asset.decimals), message: null };
    } catch (caught) {
      return { units: null, message: caught instanceof Error ? caught.message : "Enter a valid amount." };
    }
  }, [amount, asset]);
  const amountValid = Boolean(amountValidation.units);
  const availableUnits = balance?.available_units && /^\d+$/.test(balance.available_units) ? balance.available_units : "0";
  const enoughBalance = Boolean(amountValidation.units) && BigInt(amountValidation.units ?? "0") <= BigInt(availableUnits);
  const recipientValid = Boolean(recipient.trim());
  const network = asset?.network_slug ?? asset?.network_code ?? asset?.network ?? "Testnet";
  const walletTargets = otherWallets.flatMap((item) => {
    const address = addressForNetwork(item, network);
    return address ? [{ wallet: item, address }] : [];
  });
  const displayRecipient = resolved?.displayName ?? resolved?.display_name ?? resolved?.handle ?? shortDemoId(resolved?.address ?? recipient, 12, 8);
  const transferId = result?.transactionId ?? result?.transaction_id ?? result?.id ?? result?.mock_hash ?? result?.hash;

  useEffect(() => {
    if (params.recipient) {
      setRecipient(params.recipient);
      setAmount(params.amount && Number(params.amount) > 0 ? params.amount : "");
      setNote(params.note ?? "");
      setResolved(null);
      setError(null);
      setIdempotencyKey(newIdempotencyKey("send"));
    }
  }, [params.amount, params.note, params.recipient]);

  useEffect(() => {
    if (assetId || !assets.length) return;
    const requested = assets.find((item) => (item.id === params.asset || item.symbol.toLowerCase() === params.asset?.toLowerCase())
      && (!params.network || (item.network_slug ?? item.network_code ?? item.network)?.toLowerCase() === params.network.toLowerCase()));
    setAssetId((requested ?? assets[0]).id);
  }, [assetId, assets, params.asset, params.network]);

  useEffect(() => {
    if (params.selectAsset === "1" && assets.length) setAssetSheet(true);
  }, [assets.length, params.selectAsset]);

  useEffect(() => {
    if (!pendingTransferStorageKey || !wallet) return undefined;
    let active = true;
    void AsyncStorage.getItem(pendingTransferStorageKey).then((raw) => {
      if (!active || !raw) return;
      try {
        const pending = JSON.parse(raw) as Partial<PendingTransfer>;
        const valid = typeof pending.createdAt === "number"
          && Date.now() - pending.createdAt < 24 * 60 * 60 * 1000
          && typeof pending.fromWalletId === "string"
          && typeof pending.recipient === "string"
          && typeof pending.assetId === "string"
          && typeof pending.amount === "string"
          && typeof pending.note === "string"
          && typeof pending.idempotencyKey === "string";
        if (!valid) {
          void AsyncStorage.removeItem(pendingTransferStorageKey);
          return;
        }
        if (pending.fromWalletId !== wallet.id) return;
        setRecipient(pending.recipient!);
        setAssetId(pending.assetId!);
        setAmount(pending.amount!);
        setNote(pending.note!);
        setIdempotencyKey(pending.idempotencyKey!);
        setError("A pending transfer was restored. Review and confirm it to recover the final receipt.");
      } catch {
        void AsyncStorage.removeItem(pendingTransferStorageKey);
      }
    });
    return () => { active = false; };
  }, [pendingTransferStorageKey, wallet]);

  async function validateAndReview() {
    if (!asset || !recipientValid || !amountValid || !enoughBalance) return;
    setResolving(true);
    setError(null);
    try {
      const recipientInput = recipient.trim();
      const ownAddress = otherWallets.flatMap((item) => (item.addresses ?? []).map((address) => ({ wallet: item, address })))
        .find((item) => item.address.address === recipientInput || item.address.address.toLowerCase() === recipientInput.toLowerCase());
      const ownAddressNetwork = ownAddress?.address.network_slug ?? ownAddress?.address.network_code ?? ownAddress?.address.network ?? "";
      if (ownAddress && ownAddressNetwork.toLowerCase() !== network.toLowerCase()) {
        throw new Error(`That address belongs to ${ownAddressNetwork}. Select a ${network} address for ${asset.symbol}.`);
      }
      const ownWallet = walletTargets.find((item) => item.wallet.id === recipientInput || item.address === recipientInput || item.address.toLowerCase() === recipientInput.toLowerCase());
      if (ownWallet) {
        setResolved({ walletId: ownWallet.wallet.id, wallet_id: ownWallet.wallet.id, displayName: ownWallet.wallet.name, display_name: ownWallet.wallet.name, address: ownWallet.address, network });
        setStep("review");
        return;
      }
      const match = await resolveRecipient(recipientInput, asset.id);
      if (!match) throw new Error("No wallet matches that handle or address.");
      setResolved(match as ResolvedRecipient);
      setStep("review");
    } catch (caught) {
      setResolved(null);
      setError(caught instanceof Error ? caught.message : "Recipient could not be resolved on testnet.");
    } finally {
      setResolving(false);
    }
  }

  async function submit() {
    if (!wallet || !asset || !resolved || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const pending: PendingTransfer = {
        fromWalletId: wallet.id,
        recipient: recipient.trim(),
        assetId: asset.id,
        amount,
        note: note.trim(),
        idempotencyKey,
        createdAt: Date.now(),
      };
      if (pendingTransferStorageKey) await AsyncStorage.setItem(pendingTransferStorageKey, JSON.stringify(pending));
      const response = await sendDemoTransfer({
        fromWalletId: wallet.id,
        recipient: recipient.trim(),
        assetId: asset.id,
        amount,
        note: note.trim() || undefined,
        idempotencyKey,
      });
      setResult((response ?? {}) as TransferResult);
      if (pendingTransferStorageKey) await AsyncStorage.removeItem(pendingTransferStorageKey);
      setIdempotencyKey(newIdempotencyKey("send"));
      setStep("result");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The transfer could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    if (pendingTransferStorageKey) void AsyncStorage.removeItem(pendingTransferStorageKey);
    setRecipient("");
    setAmount("");
    setNote("");
    setResolved(null);
    setResult(null);
    setError(null);
    setIdempotencyKey(newIdempotencyKey("send"));
    setStep("details");
  }

  return (
    <>
      <AppScreen scrollable={step !== "result"} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, gap: 14 }}>
          <DemoFlowHeader title={step === "result" ? "Transfer receipt" : "Send"} subtitle={wallet?.name ?? "Wallet"} onBack={step === "review" ? () => setStep("details") : undefined} />
          <StepDots count={3} step={step === "details" ? 0 : step === "review" ? 1 : 2} />

          {step === "details" ? (
            <>
              <DemoModeBanner compact />
              <View style={{ gap: 7 }}>
                <FlowLabel>Asset</FlowLabel>
                {asset ? <AssetChoiceRow balance={`${available} ${asset.symbol}`} name={asset.name} network={network} onPress={() => setAssetSheet(true)} symbol={asset.symbol} /> : null}
              </View>

              <View style={{ gap: 7 }}>
                <FlowLabel>Recipient</FlowLabel>
                <FlowTextInput
                  onChangeText={(value) => { setRecipient(value); setResolved(null); setError(null); setIdempotencyKey(newIdempotencyKey("send")); }}
                  placeholder="@handle or wallet address"
                  value={recipient}
                  right={<Pressable accessibilityLabel="Scan recipient QR" onPress={() => router.push({ pathname: "/qr-scanner", params: { asset: asset?.id ?? "", network, amount, note } })}><TrustIcon color={theme.blue} name="qrcode-scan" size={22} /></Pressable>}
                />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: theme.secondary, fontSize: 10, flex: 1 }}>Use a registered @handle or wallet address.</Text>
                  <Pressable onPress={() => router.push({ pathname: "/address-book", params: { mode: "select", asset: asset?.id ?? "", amount, note } })}>
                    <Text style={{ color: theme.blue, fontSize: 11, fontWeight: "900" }}>Address book</Text>
                  </Pressable>
                </View>
              </View>

              {walletTargets.length ? (
                <View style={{ gap: 7 }}>
                  <FlowLabel>My wallets</FlowLabel>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingRight: 8 }}>
                    {walletTargets.map(({ wallet: item, address }) => (
                      <Pressable key={item.id} onPress={() => { setRecipient(address); setResolved({ walletId: item.id, wallet_id: item.id, displayName: item.name, display_name: item.name, address, network }); setError(null); setIdempotencyKey(newIdempotencyKey("send")); }} style={{ width: 104, minHeight: 66, borderRadius: 15, backgroundColor: recipient === address ? theme.blueSoft : theme.surface, padding: 9, alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.blue} name="wallet-outline" size={17} /></View>
                        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 10, fontWeight: "800", maxWidth: "100%" }}>{item.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {addressBook.length ? (
                <View style={{ gap: 7 }}>
                  <FlowLabel>Recent recipients</FlowLabel>
                  <View style={{ flexDirection: "row", gap: 9 }}>
                    {addressBook.slice(0, 3).map((contact) => (
                      <Pressable key={contact.id} onPress={() => { setRecipient(contact.address); setResolved(null); setError(null); setIdempotencyKey(newIdempotencyKey("send")); }} style={{ flex: 1, minHeight: 66, borderRadius: 15, backgroundColor: theme.surface, padding: 9, alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.blue} name="account-outline" size={17} /></View>
                        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 10, fontWeight: "800", maxWidth: "100%" }}>{contact.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={{ gap: 7 }}>
                <FlowLabel>Amount</FlowLabel>
                <FlowTextInput keyboardType="decimal-pad" onChangeText={(value) => { setAmount(normalizeDecimalInput(value)); setIdempotencyKey(newIdempotencyKey("send")); }} placeholder="0.00" value={amount} right={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{asset?.symbol}</Text>} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: amount && (!amountValid || !enoughBalance) ? theme.negative : theme.secondary, fontSize: 10 }}>{amount && !amountValid ? amountValidation.message : amountValid && !enoughBalance ? "Insufficient balance" : `Available ${available} ${asset?.symbol ?? ""}`}</Text>
                  <Pressable onPress={() => { setAmount(available); setIdempotencyKey(newIdempotencyKey("send")); }}><Text style={{ color: theme.blue, fontSize: 10, fontWeight: "900" }}>MAX</Text></Pressable>
                </View>
              </View>

              <View style={{ gap: 7 }}>
                <FlowLabel>Note (optional)</FlowLabel>
                <FlowTextInput autoCapitalize="sentences" maxLength={280} onChangeText={(value) => { setNote(value); setIdempotencyKey(newIdempotencyKey("send")); }} placeholder="What is this for?" value={note} />
              </View>
              {error ? <ErrorNotice message={error} /> : null}
              <FlowButton disabled={!recipientValid || !amountValid || !enoughBalance || !asset} label="Review transfer" loading={resolving} onPress={() => void validateAndReview()} />
            </>
          ) : null}

          {step === "review" ? (
            <>
              <DemoModeBanner compact />
              <View style={{ alignItems: "center", gap: 8, paddingVertical: 14 }}>
                <TokenLogo network={network} symbol={asset?.symbol ?? "USD"} size={54} />
                <Text style={{ color: theme.text, fontSize: 36, fontWeight: "900" }}>-{amount} {asset?.symbol}</Text>
                <Text style={{ color: theme.secondary, fontSize: 12 }}>To {displayRecipient}</Text>
              </View>
              <FlowCard>
                <ReviewRow label="From" value={wallet?.name ?? "—"} />
                <ReviewRow label="Recipient" value={displayRecipient} />
                {resolved?.handle ? <ReviewRow label="Handle" value={resolved.handle} /> : null}
                <ReviewRow label="Network" value={network} />
                <ReviewRow label="Network fee" value="Calculated at confirmation" />
                <ReviewRow label="Transfer amount" value={`${amount} ${asset?.symbol ?? ""}`} last />
              </FlowCard>
              {note.trim() ? <FlowCard muted><FlowLabel>Note</FlowLabel><Text style={{ color: theme.text, fontSize: 13, marginTop: 6 }}>{note.trim()}</Text></FlowCard> : null}
              {error ? <ErrorNotice message={error} /> : null}
              <FlowButton label="Confirm transfer" loading={submitting} onPress={() => void submit()} />
              <FlowButton label="Edit transfer" onPress={() => setStep("details")} secondary />
            </>
          ) : null}

          {step === "result" ? (
            <>
              <ResultPanel
                success
                title="Transfer complete"
                message={`${amount} ${asset?.symbol ?? ""} was sent to ${displayRecipient}. Both participant balances and activity were updated.`}
                detail={transferId ? <Text selectable style={{ color: theme.secondary, fontSize: 11 }}>Transaction ID {shortDemoId(transferId, 13, 9)}</Text> : undefined}
              />
              <FlowButton label="View transaction" onPress={() => router.replace({ pathname: "/tx-history", params: { transactionId: transferId ?? "" } })} />
              <FlowButton label="Make another transfer" onPress={reset} secondary />
            </>
          ) : null}
        </View>
      </AppScreen>

      <SheetModal visible={assetSheet} title="Select asset" subtitle="Balances in this wallet" onClose={() => setAssetSheet(false)}>
        <ScrollView
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: Math.max(280, Math.min(620, windowHeight - 210)) }}
        >
          {assets.map((item) => {
            const itemBalance = wallet?.balances?.find((candidate) => candidate.asset_id === item.id);
            const display = itemBalance?.available_amount ?? itemBalance?.display_amount ?? String(itemBalance?.amount ?? "0");
            return <AssetChoiceRow active={item.id === asset?.id} balance={`${display} ${item.symbol}`} key={item.id} name={item.name} network={item.network_code ?? item.network} onPress={() => { setAssetId(item.id); setAmount(""); setIdempotencyKey(newIdempotencyKey("send")); setAssetSheet(false); }} symbol={item.symbol} />;
          })}
        </ScrollView>
      </SheetModal>
    </>
  );
}

function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { theme } = useAppContext();
  return (
    <View style={{ minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.border }}>
      <Text style={{ color: theme.secondary, fontSize: 12 }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: theme.text, fontSize: 12, fontWeight: "900", textAlign: "right", maxWidth: "65%" }}>{value}</Text>
    </View>
  );
}

function ErrorNotice({ message }: { message: string }) {
  const { theme } = useAppContext();
  return (
    <View style={{ borderRadius: 14, backgroundColor: "#fdecec", padding: 12, flexDirection: "row", gap: 9 }}>
      <TrustIcon color={theme.negative} name="alert-circle-outline" size={19} />
      <Text style={{ flex: 1, color: theme.negative, fontSize: 12, lineHeight: 17 }}>{message}</Text>
    </View>
  );
}

function addressForNetwork(wallet: UiWallet, network: string) {
  const expected = network.toLowerCase();
  return wallet.addresses?.find((item) => (item.network_slug ?? item.network_code ?? item.network ?? "").toLowerCase() === expected)?.address ?? null;
}
