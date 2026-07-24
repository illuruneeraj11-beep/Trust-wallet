import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { AppScreen, SheetModal } from "@/components/trust-ui";
import {
  AssetChoiceRow,
  DemoFlowHeader,
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
import { NetworkLogo, TokenLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { getAssetBySymbol } from "@/data/asset-registry";
import { decimalToBaseUnits } from "@/lib/wallet-amounts";
import { isRegisteredWalletHandle, looksLikeRegisteredWalletAddress, looksLikeWalletAddress, recipientFormatMessage } from "@/lib/wallet-addresses";
import { assetNetworkName, assetNetworkSlug, findAssetVariant, walletNetworkName, walletNetworksMatch } from "@/lib/wallet-networks";

type UiAsset = { id: string; symbol: string; name: string; network?: string; network_code?: string; network_slug?: string; network_name?: string; decimals: number };
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
    currency,
    marketByAssetId,
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
  const initialAsset = findAssetVariant(assets, params.asset, params.network)
    ?? (params.asset ? findAssetVariant(assets, params.asset) : undefined)
    ?? assets[0];
  const [assetId, setAssetId] = useState(initialAsset?.id ?? "");
  const [recipient, setRecipient] = useState(params.recipient ?? "");
  const [amount, setAmount] = useState(params.amount && Number(params.amount) > 0 ? params.amount : "");
  const [note, setNote] = useState(params.note ?? "");
  const [step, setStep] = useState<"details" | "review" | "result">("details");
  const [assetSheet, setAssetSheet] = useState(false);
  const [networkSheet, setNetworkSheet] = useState(false);
  const [resolved, setResolved] = useState<ResolvedRecipient | null>(null);
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => newIdempotencyKey("send"));
  const restoredTransferStorageKey = useRef<string | null>(null);
  const appliedAssetRouteKey = useRef<string | null>(null);
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
  const amountValid = Boolean(amountValidation.units) && BigInt(amountValidation.units ?? "0") > 0n;
  const availableUnits = balance?.available_units && /^\d+$/.test(balance.available_units) ? balance.available_units : "0";
  const enoughBalance = Boolean(amountValidation.units) && BigInt(amountValidation.units ?? "0") <= BigInt(availableUnits);
  const network = assetNetworkSlug(asset);
  const networkName = assetNetworkName(asset);
  const networkVariants = assets
    .filter((item) => item.symbol.toLowerCase() === asset?.symbol.toLowerCase())
    .sort((left, right) => networkSortIndex(assetNetworkSlug(left)) - networkSortIndex(assetNetworkSlug(right)));
  const assetChoices = uniqueSymbolAssets(assets, wallet, asset?.id);
  const compatibleRecipients = addressBook.filter((entry) => !entry.address.includes("...") && walletNetworksMatch(entry.network, network));
  const walletTargets = otherWallets.flatMap((item) => {
    const address = addressForNetwork(item, network);
    return address ? [{ wallet: item, address }] : [];
  });
  const trimmedRecipient = recipient.trim();
  const knownRecipient = walletTargets.some((item) => sameAddress(item.address, trimmedRecipient))
    || compatibleRecipients.some((item) => sameAddress(item.address, trimmedRecipient));
  const recipientValid = Boolean(trimmedRecipient)
    && (
      knownRecipient
      || isRegisteredWalletHandle(trimmedRecipient)
      || looksLikeRegisteredWalletAddress(trimmedRecipient, network)
      || looksLikeWalletAddress(trimmedRecipient, network)
    );
  const recipientError = recipientFormatMessage(trimmedRecipient, network);
  const marketAsset = asset ? getAssetBySymbol(asset.symbol) : undefined;
  const marketPrice = marketAsset ? marketByAssetId[marketAsset.assetId]?.price : null;
  const stablePrice = currency.code === "USD" && asset && ["USD", "USDC", "USDT"].includes(asset.symbol) ? 1 : null;
  const fiatPrice = typeof marketPrice === "number" && Number.isFinite(marketPrice) ? marketPrice : stablePrice;
  const fiatEstimate = Number.isFinite(Number(amount)) && fiatPrice !== null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency.code, maximumFractionDigits: 2 }).format(Number(amount || 0) * fiatPrice)
    : null;
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
    if (!assets.length || !params.asset) return;
    const routeKey = `${params.asset.toLowerCase()}::${(params.network ?? "").toLowerCase()}`;
    if (appliedAssetRouteKey.current === routeKey) return;
    appliedAssetRouteKey.current = routeKey;
    const requested = findAssetVariant(assets, params.asset, params.network);
    if (requested) {
      setAssetId(requested.id);
      return;
    }
    const sameAsset = findAssetVariant(assets, params.asset);
    if (sameAsset) setAssetId(sameAsset.id);
    if (!params.network) return;
    const requestedAsset = findAssetVariant(assets, params.asset);
    const requestedLabel = requestedAsset?.symbol ?? params.asset.toUpperCase();
    setError(`${requestedLabel} is not available on ${walletNetworkName(params.network)}. Choose another asset or network.`);
  }, [assets, params.asset, params.network]);

  useEffect(() => {
    if (params.selectAsset === "1" && assets.length) setAssetSheet(true);
  }, [assets.length, params.selectAsset]);

  useEffect(() => {
    if (
      !pendingTransferStorageKey
      || !wallet
      || restoredTransferStorageKey.current === pendingTransferStorageKey
    ) return undefined;
    restoredTransferStorageKey.current = pendingTransferStorageKey;
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

  function selectAssetVariant(nextAsset: UiAsset, openNetworkAfter = false) {
    const changed = nextAsset.id !== asset?.id;
    const changedSymbol = nextAsset.symbol.toLowerCase() !== asset?.symbol.toLowerCase();
    setAssetId(nextAsset.id);
    setAssetSheet(false);
    setNetworkSheet(openNetworkAfter);
    if (!changed) return;
    setRecipient("");
    if (changedSymbol) setAmount("");
    setResolved(null);
    setResult(null);
    setError(null);
    setIdempotencyKey(newIdempotencyKey("send"));
  }

  function updateRecipient(value: string) {
    setRecipient(value);
    setResolved(null);
    setError(null);
    setIdempotencyKey(newIdempotencyKey("send"));
  }

  async function pasteRecipient() {
    const value = (await Clipboard.getStringAsync()).trim();
    if (value) updateRecipient(value);
  }

  async function validateAndReview() {
    if (!asset || !recipientValid || !amountValid || !enoughBalance) return;
    setResolving(true);
    setError(null);
    try {
      const recipientInput = recipient.trim();
      const ownAddress = otherWallets.flatMap((item) => (item.addresses ?? []).map((address) => ({ wallet: item, address })))
        .find((item) => item.address.address === recipientInput || item.address.address.toLowerCase() === recipientInput.toLowerCase());
      const ownAddressNetwork = ownAddress?.address.network_slug ?? ownAddress?.address.network_code ?? ownAddress?.address.network ?? "";
      if (ownAddress && !walletNetworksMatch(ownAddressNetwork, network)) {
        throw new Error(`That address belongs to ${walletNetworkName(ownAddressNetwork)}. Select a ${networkName} address for ${asset.symbol}.`);
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
      setError(formatRecipientError(caught, networkName));
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
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, gap: 14 }}>
          <DemoFlowHeader title={step === "result" ? "Transfer receipt" : asset ? `Send ${asset.symbol}` : "Send"} subtitle={wallet?.name ?? "Wallet"} onBack={step === "review" ? () => setStep("details") : undefined} />
          {step === "review" ? <StepDots count={3} step={1} /> : null}

          {step === "details" ? (
            <View style={{ flex: 1, gap: 10 }}>
              <ScrollView
                contentContainerStyle={{ gap: 17, paddingBottom: 6 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
              >
                <SimulationNotice />
                <View style={{ gap: 7 }}>
                  <FlowLabel>Asset</FlowLabel>
                  {asset ? <AssetChoiceRow balance={`${available} ${asset.symbol}`} name={asset.name} network={network} networkLabel={networkVariants.length > 1 ? `${networkVariants.length} networks available` : networkName} onPress={() => setAssetSheet(true)} symbol={asset.symbol} /> : null}
                </View>

                <View style={{ gap: 7 }}>
                  <FlowLabel>Address or domain name</FlowLabel>
                  <View style={{ minHeight: 58, borderRadius: 12, borderWidth: 1.5, borderColor: recipient && recipientError && !knownRecipient ? theme.negative : theme.blue, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={updateRecipient}
                      placeholder="@handle or wallet address"
                      placeholderTextColor={theme.secondary}
                      style={{ flex: 1, minWidth: 72, color: theme.text, fontSize: 14, fontWeight: "700", paddingVertical: 0 }}
                      value={recipient}
                    />
                    {recipient ? <IconAction accessibilityLabel="Clear recipient" icon="close-circle" onPress={() => updateRecipient("")} /> : null}
                    <Pressable accessibilityLabel="Paste recipient" onPress={() => void pasteRecipient()} style={{ minHeight: 36, justifyContent: "center", paddingHorizontal: 1 }}>
                      <Text style={{ color: theme.blue, fontSize: 12, fontWeight: "900" }}>Paste</Text>
                    </Pressable>
                    <IconAction accessibilityLabel="Open address book" icon="address-book" onPress={() => router.push({ pathname: "/address-book", params: { mode: "select", asset: asset?.id ?? "", network, amount, note } })} />
                    <IconAction accessibilityLabel="Scan recipient QR" icon="scan-qr" onPress={() => router.push({ pathname: "/qr-scanner", params: { asset: asset?.symbol ?? "", network, amount, note } })} />
                  </View>
                  <Text style={{ color: recipient && recipientError && !knownRecipient ? theme.negative : theme.secondary, fontSize: 11 }}>
                    {recipient && recipientError && !knownRecipient ? recipientError : `Use a registered @handle or a valid ${networkName} address.`}
                  </Text>
                </View>

                <View style={{ gap: 5 }}>
                  <FlowLabel>Destination network</FlowLabel>
                  <Pressable
                    accessibilityLabel={`Destination network, ${networkName}`}
                    accessibilityRole="button"
                    onPress={() => setNetworkSheet(true)}
                    style={{ alignSelf: "flex-start", minHeight: 48, borderRadius: 24, backgroundColor: theme.surface, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9 }}
                  >
                    <NetworkLogo network={network} size={32} />
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>{networkName}</Text>
                    <TrustIcon color={theme.secondary} name="chevron-down" size={18} />
                  </Pressable>
                </View>

                {!recipient && walletTargets.length ? (
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

                {!recipient && compatibleRecipients.length ? (
                  <View style={{ gap: 7 }}>
                    <FlowLabel>Recent recipients</FlowLabel>
                    <View style={{ flexDirection: "row", gap: 9 }}>
                      {compatibleRecipients.slice(0, 3).map((contact) => (
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
                  <View style={{ minHeight: 58, borderRadius: 12, borderWidth: 1, borderColor: theme.secondary, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TextInput
                      keyboardType="decimal-pad"
                      onChangeText={(value) => { setAmount(normalizeDecimalInput(value)); setError(null); setIdempotencyKey(newIdempotencyKey("send")); }}
                      placeholder="0"
                      placeholderTextColor={theme.secondary}
                      style={{ flex: 1, minWidth: 0, color: theme.text, fontSize: 18, fontWeight: "800", paddingVertical: 0 }}
                      value={amount}
                    />
                    {amount ? <IconAction accessibilityLabel="Clear amount" icon="close-circle" onPress={() => setAmount("")} /> : null}
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>{asset?.symbol}</Text>
                    <Pressable onPress={() => { setAmount(available); setIdempotencyKey(newIdempotencyKey("send")); }} style={{ width: 28, minHeight: 36, alignItems: "flex-end", justifyContent: "center" }}>
                      <Text style={{ color: theme.blue, fontSize: 12, fontWeight: "900" }}>Max</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: amount && (!amountValid || !enoughBalance) ? theme.negative : theme.secondary, fontSize: 11 }}>{amount && !amountValid ? amountValidation.message : amountValid && !enoughBalance ? "Insufficient balance" : `Available ${available} ${asset?.symbol ?? ""}`}</Text>
                    <Text style={{ color: theme.secondary, fontSize: 11 }}>{fiatEstimate ? `≈ ${fiatEstimate}` : "Price unavailable"}</Text>
                  </View>
                </View>

                <View style={{ gap: 7 }}>
                  <FlowLabel>Note (optional)</FlowLabel>
                  <FlowTextInput autoCapitalize="sentences" maxLength={280} onChangeText={(value) => { setNote(value); setIdempotencyKey(newIdempotencyKey("send")); }} placeholder="What is this for?" value={note} />
                </View>
                {error ? <ErrorNotice message={error} /> : null}
              </ScrollView>
              <FlowButton disabled={!recipientValid || !amountValid || !enoughBalance || !asset} label="Next" loading={resolving} onPress={() => void validateAndReview()} />
            </View>
          ) : null}

          {step === "review" ? (
            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 4 }} showsVerticalScrollIndicator={false}>
              <SimulationNotice />
              <View style={{ alignItems: "center", gap: 8, paddingVertical: 14 }}>
                <TokenLogo network={network} symbol={asset?.symbol ?? "USD"} size={54} />
                <Text style={{ color: theme.text, fontSize: 36, fontWeight: "900" }}>-{amount} {asset?.symbol}</Text>
                <Text style={{ color: theme.secondary, fontSize: 12 }}>To {displayRecipient}</Text>
              </View>
              <FlowCard>
                <ReviewRow label="From" value={wallet?.name ?? "—"} />
                <ReviewRow label="Recipient" value={displayRecipient} />
                {resolved?.handle ? <ReviewRow label="Handle" value={resolved.handle} /> : null}
                <ReviewRow label="Network" value={networkName} />
                <ReviewRow label="Network fee" value="Calculated at confirmation" />
                <ReviewRow label="Transfer amount" value={`${amount} ${asset?.symbol ?? ""}`} last />
              </FlowCard>
              {note.trim() ? <FlowCard muted><FlowLabel>Note</FlowLabel><Text style={{ color: theme.text, fontSize: 13, marginTop: 6 }}>{note.trim()}</Text></FlowCard> : null}
              {error ? <ErrorNotice message={error} /> : null}
              <FlowButton label="Confirm transfer" loading={submitting} onPress={() => void submit()} />
              <FlowButton label="Edit transfer" onPress={() => setStep("details")} secondary />
            </ScrollView>
          ) : null}

          {step === "result" ? (
            <>
              <ResultPanel
                success
                title="Delivered"
                message={`${amount} ${asset?.symbol ?? ""} was sent to ${displayRecipient}. Your balance and activity were updated.`}
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
          {assetChoices.map((item) => {
            const itemBalance = wallet?.balances?.find((candidate) => candidate.asset_id === item.id);
            const display = itemBalance?.available_amount ?? itemBalance?.display_amount ?? String(itemBalance?.amount ?? "0");
            const variants = assets.filter((candidate) => candidate.symbol.toLowerCase() === item.symbol.toLowerCase());
            return <AssetChoiceRow active={item.symbol.toLowerCase() === asset?.symbol.toLowerCase()} balance={`${display} ${item.symbol}`} key={item.symbol} name={item.name} network={assetNetworkSlug(item)} networkLabel={variants.length > 1 ? `${variants.length} networks` : assetNetworkName(item)} onPress={() => selectAssetVariant(item, variants.length > 1)} symbol={item.symbol} />;
          })}
        </ScrollView>
      </SheetModal>

      <SheetModal visible={networkSheet} title="Select network" subtitle={asset ? `Send ${asset.symbol} on the receiver's network` : "Choose a compatible network"} onClose={() => setNetworkSheet(false)}>
        <ScrollView
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: Math.max(300, Math.min(620, windowHeight - 210)) }}
        >
          {networkVariants.map((item) => {
            const itemBalance = wallet?.balances?.find((candidate) => candidate.asset_id === item.id);
            const display = itemBalance?.available_amount ?? itemBalance?.display_amount ?? String(itemBalance?.amount ?? "0");
            const itemNetwork = assetNetworkSlug(item);
            const itemNetworkName = assetNetworkName(item);
            const active = item.id === asset?.id;
            return (
              <Pressable
                accessibilityLabel={`${itemNetworkName}, available ${display} ${item.symbol}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                key={item.id}
                onPress={() => selectAssetVariant(item)}
                style={{ minHeight: 66, borderRadius: 16, backgroundColor: active ? theme.blueSoft : theme.cardSecondary, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 11 }}
              >
                <NetworkLogo network={itemNetwork} size={38} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{itemNetworkName}</Text>
                  <Text style={{ color: theme.secondary, fontSize: 11 }}>Available {display} {item.symbol}</Text>
                </View>
                <TrustIcon color={active ? theme.blue : theme.secondary} name={active ? "check-circle" : "chevron-right"} size={20} />
              </Pressable>
            );
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

function SimulationNotice() {
  const { theme } = useAppContext();
  return (
    <View style={{ alignSelf: "center", borderRadius: 999, backgroundColor: "#f1efff", paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 6 }}>
      <TrustIcon color={theme.blue} name="shield-check-outline" size={14} />
      <Text style={{ color: theme.secondary, fontSize: 10, fontWeight: "800" }}>Simulated transfer</Text>
    </View>
  );
}

function IconAction({ accessibilityLabel, icon, onPress }: { accessibilityLabel: string; icon: "address-book" | "close-circle" | "scan-qr"; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress} style={{ width: 26, height: 38, alignItems: "center", justifyContent: "center" }}>
      <TrustIcon color={icon === "close-circle" ? theme.secondary : theme.blue} name={icon} size={icon === "close-circle" ? 19 : 21} />
    </Pressable>
  );
}

function uniqueSymbolAssets(assets: UiAsset[], wallet: UiWallet | null, selectedAssetId?: string) {
  const groups = new Map<string, UiAsset[]>();
  for (const item of assets) {
    const key = item.symbol.toUpperCase();
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return Array.from(groups.values()).map((variants) => variants.find((item) => item.id === selectedAssetId)
    ?? variants.find((item) => balanceUnitsForAsset(wallet, item.id) > 0n)
    ?? variants[0]);
}

function balanceUnitsForAsset(wallet: UiWallet | null, assetId: string) {
  const units = wallet?.balances?.find((item) => item.asset_id === assetId)?.available_units;
  return units && /^\d+$/.test(units) ? BigInt(units) : 0n;
}

function formatRecipientError(caught: unknown, networkName: string) {
  const message = caught instanceof Error ? caught.message : "Recipient could not be resolved.";
  if (/recipient not found on this network/i.test(message)) {
    return `Enter a valid ${networkName} address, Receive QR, or registered @handle.`;
  }
  if (/unsupported demo network/i.test(message)) return `${networkName} is not available for transfers.`;
  if (/different demo account/i.test(message)) return "Choose a different account as the recipient.";
  return message;
}

function addressForNetwork(wallet: UiWallet, network: string) {
  return wallet.addresses?.find((item) => walletNetworksMatch(item.network_slug ?? item.network_code ?? item.network, network))?.address ?? null;
}

function sameAddress(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

const preferredNetworkOrder = ["ethereum", "arbitrum", "base", "optimism", "polygon", "avalanchec", "bsc", "solana", "tron", "bitcoin", "demo"];

function networkSortIndex(network: string) {
  const index = preferredNetworkOrder.indexOf(network);
  return index < 0 ? preferredNetworkOrder.length : index;
}
