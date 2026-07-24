import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import {
  currencyOptions,
  dappCategories,
  marketFilters,
  networkOptions,
  rewardRedeemItems,
  rewardsCampaigns,
  socialLinks,
  trustAlphaCampaigns,
  type AddressBookEntry,
  type CurrencyOption,
  type TrendingToken,
} from "@/data/trust-wallet";
import { sanitizeStoredWalletPreferences } from "@/lib/wallet-preferences";
import {
  fetchLiveMarkets,
  isMarketsResponse,
  probeMarketStreamAvailability,
  subscribeToMarketStream,
  toLegacyMarketLists,
} from "@/services/market-prices";
import { useAuth } from "@/context/auth-context";
import {
  archiveWallet as archiveWalletService,
  bootstrapDemoAccount,
  clearTransferRecoveryIntent,
  fundDemoWallet as fundDemoWalletService,
  getPortfolio,
  ledgerMode,
  listTransfers,
  renameWallet as renameWalletService,
  resolveRecipient as resolveRecipientService,
  sendDemoTransfer as sendDemoTransferService,
  subscribeToLedgerInvalidations,
} from "@/services/wallet-ledger";
import { colors, darkColors, type ThemeColors } from "@/theme/colors";
import type {
  DemoProfile,
  DemoTransactionReceipt,
  FundDemoWalletInput,
  LedgerMode,
  LedgerStatus,
  MockAsset,
  MockTransfer,
  ResolvedRecipient,
  SendDemoTransferInput,
  WalletWithBalances,
} from "@/types/wallet";
import type { MarketCurrency, MarketQuote, MarketStatus, MarketsResponse } from "@/types/market";
import { getAssetBySymbol } from "@/data/asset-registry";

type ThemeMode = "light" | "dark";
type LayoutMode = 1 | 2 | 3;
type HomeTab = "crypto" | "nfts" | "watchlist" | "history";
type RewardsTab = "campaigns" | "trust-alpha";
type AutoLockTimer = "Immediately" | "1 minute" | "5 minutes" | "1 hour" | "5 hours";

type PersistedState = {
  themeMode: ThemeMode;
  currencyCode: MarketCurrency;
  hideBalance: boolean;
  layoutMode: LayoutMode;
  hideSmallBalances: boolean;
  hideNfts: boolean;
  hidePredictions: boolean;
  backupBannerDismissed: boolean;
  selectedWalletId: string | null;
  watchlist: string[];
  favoriteDapps: string[];
  language: string;
  dappBrowserEnabled: boolean;
  customRpcUrl: string;
  scannerAlerts: boolean;
  transactionSigning: boolean;
  appLockEnabled: boolean;
  biometricsEnabled: boolean;
  autoLockTimer: AutoLockTimer;
  pushIncoming: boolean;
  pushOutgoing: boolean;
  pushPromotions: boolean;
  addressBook: AddressBookEntry[];
  activeHomeTab: HomeTab;
  activeRewardsTab: RewardsTab;
};

type AppContextValue = {
  themeMode: ThemeMode;
  theme: ThemeColors;
  currency: CurrencyOption;
  ledgerMode: LedgerMode;
  ledgerStatus: LedgerStatus;
  ledgerError: string | null;
  profile: DemoProfile | null;
  assets: MockAsset[];
  wallets: WalletWithBalances[];
  transfers: MockTransfer[];
  loadingWallets: boolean;
  loadingTransfers: boolean;
  selectedWalletId: string | null;
  selectedWallet: WalletWithBalances | null;
  totalBalance: number;
  visibleBalance: string;
  layoutMode: LayoutMode;
  hideBalance: boolean;
  hideSmallBalances: boolean;
  hideNfts: boolean;
  hidePredictions: boolean;
  backupBannerDismissed: boolean;
  watchlist: string[];
  favoriteDapps: string[];
  language: string;
  dappBrowserEnabled: boolean;
  customRpcUrl: string;
  scannerAlerts: boolean;
  transactionSigning: boolean;
  appLockEnabled: boolean;
  biometricsEnabled: boolean;
  autoLockTimer: AutoLockTimer;
  pushIncoming: boolean;
  pushOutgoing: boolean;
  pushPromotions: boolean;
  addressBook: AddressBookEntry[];
  activeHomeTab: HomeTab;
  activeRewardsTab: RewardsTab;
  marketFilters: string[];
  marketFilter: string;
  trendingTokens: TrendingToken[];
  topTradedTokens: TrendingToken[];
  marketByAssetId: Record<string, MarketQuote>;
  marketStatus: MarketStatus;
  marketUpdatedAt: string | null;
  marketError: string | null;
  rewardsCampaigns: typeof rewardsCampaigns;
  trustAlphaCampaigns: typeof trustAlphaCampaigns;
  rewardRedeemItems: typeof rewardRedeemItems;
  dappCategories: typeof dappCategories;
  socialLinks: typeof socialLinks;
  networkOptions: typeof networkOptions;
  refreshLedger: () => Promise<void>;
  fundDemoWallet: (input: FundDemoWalletInput) => Promise<DemoTransactionReceipt>;
  resolveRecipient: (query: string, assetId?: string) => Promise<ResolvedRecipient>;
  sendDemoTransfer: (input: SendDemoTransferInput) => Promise<DemoTransactionReceipt>;
  refreshWallets: () => Promise<void>;
  refreshTransfers: () => Promise<void>;
  renameWallet: (walletId: string, name: string) => Promise<void>;
  archiveWallet: (walletId: string) => Promise<void>;
  refreshMarkets: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setCurrencyCode: (code: MarketCurrency) => void;
  setSelectedWalletId: (walletId: string | null) => void;
  toggleHideBalance: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleHideSmallBalances: () => void;
  toggleHideNfts: () => void;
  toggleHidePredictions: () => void;
  dismissBackupBanner: () => void;
  resetBackupBanner: () => void;
  toggleWatchlistToken: (symbol: string) => void;
  toggleFavoriteDapp: (name: string) => void;
  setLanguage: (value: string) => void;
  setDappBrowserEnabled: (value: boolean) => void;
  clearBrowserCache: () => void;
  setCustomRpcUrl: (value: string) => void;
  setScannerAlerts: (value: boolean) => void;
  setTransactionSigning: (value: boolean) => void;
  setAppLockEnabled: (value: boolean) => void;
  setBiometricsEnabled: (value: boolean) => void;
  setAutoLockTimer: (value: AutoLockTimer) => void;
  setPushIncoming: (value: boolean) => void;
  setPushOutgoing: (value: boolean) => void;
  setPushPromotions: (value: boolean) => void;
  addAddressBookEntry: (entry: Omit<AddressBookEntry, "id">) => void;
  removeAddressBookEntry: (id: string) => void;
  setActiveHomeTab: (tab: HomeTab) => void;
  setActiveRewardsTab: (tab: RewardsTab) => void;
  setMarketFilter: (filter: string) => void;
};

const STORAGE_KEY = "trust-wallet-app-context-v4";
const MARKET_CACHE_KEY = "trust-wallet-market-snapshot-v1";
const DEFAULT_MARKET_POLL_INTERVAL_MS = 60_000;

type MarketCacheEnvelope = {
  snapshot: MarketsResponse;
  fxRate: number | null;
};

function readMarketCache(value: unknown, currency: MarketCurrency): MarketCacheEnvelope | null {
  if (isMarketsResponse(value)) {
    return value.currency === currency ? { snapshot: value, fxRate: currency === "USD" ? 1 : null } : null;
  }
  if (!value || typeof value !== "object" || !("snapshot" in value) || !("fxRate" in value)) return null;
  const envelope = value as { snapshot: unknown; fxRate: unknown };
  if (!isMarketsResponse(envelope.snapshot) || envelope.snapshot.currency !== currency) return null;
  const fxRate = envelope.fxRate === null || (typeof envelope.fxRate === "number" && Number.isFinite(envelope.fxRate) && envelope.fxRate > 0)
    ? envelope.fxRate
    : null;
  return { snapshot: envelope.snapshot, fxRate: currency === "USD" ? 1 : fxRate };
}

const defaultState: PersistedState = {
  themeMode: "light",
  currencyCode: "USD",
  hideBalance: false,
  layoutMode: 2,
  hideSmallBalances: false,
  hideNfts: false,
  hidePredictions: false,
  backupBannerDismissed: false,
  selectedWalletId: null,
  watchlist: ["BTC", "ETH", "SOL", "TWT"],
  favoriteDapps: ["Aave", "Raydium"],
  language: "English",
  dappBrowserEnabled: true,
  customRpcUrl: "https://rpc.trustwallet.example/eth",
  scannerAlerts: true,
  transactionSigning: true,
  appLockEnabled: true,
  biometricsEnabled: true,
  autoLockTimer: "5 minutes",
  pushIncoming: true,
  pushOutgoing: true,
  pushPromotions: false,
  addressBook: [],
  activeHomeTab: "crypto",
  activeRewardsTab: "campaigns",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [persisted, setPersisted] = useState<PersistedState>(defaultState);
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [assets, setAssets] = useState<MockAsset[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalances[]>([]);
  const [transfers, setTransfers] = useState<MockTransfer[]>([]);
  const [ledgerDataIdentity, setLedgerDataIdentity] = useState<string | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);
  const [ledgerStatus, setLedgerStatus] = useState<LedgerStatus>("idle");
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<string>("hot");
  const [liveTopTradedTokens, setLiveTopTradedTokens] = useState<TrendingToken[]>([]);
  const [liveTrendingTokens, setLiveTrendingTokens] = useState<TrendingToken[]>([]);
  const [marketByAssetId, setMarketByAssetId] = useState<Record<string, MarketQuote>>({});
  const [marketStatus, setMarketStatus] = useState<MarketStatus>("idle");
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketFxRate, setMarketFxRate] = useState<number | null>(1);
  const [marketPollAfterMs, setMarketPollAfterMs] = useState(DEFAULT_MARKET_POLL_INTERVAL_MS);
  const [marketVisible, setMarketVisible] = useState(true);
  const marketRequestRef = useRef<Promise<void> | null>(null);
  const marketAbortRef = useRef<AbortController | null>(null);
  const marketVisibleRef = useRef(true);
  const marketHasDataRef = useRef(false);
  const marketSnapshotRef = useRef<MarketsResponse | null>(null);
  const marketStreamUnavailableRef = useRef(false);
  const ledgerRequestRef = useRef<Promise<void> | null>(null);
  const ledgerRequestTokenRef = useRef<symbol | null>(null);
  const ledgerHasLoadedRef = useRef(false);
  const cacheIdentity = ledgerMode === "visual-demo" ? "visual-demo" : user && !user.is_anonymous ? user.id : null;
  const ledgerIdentityRef = useRef<string | null>(cacheIdentity);
  ledgerIdentityRef.current = cacheIdentity;
  const storageKey = cacheIdentity ? `${STORAGE_KEY}:${cacheIdentity}` : null;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setLoadedStorageKey(null);
    setPersisted(defaultState);
    if (!storageKey) return () => { cancelled = true; };
    void AsyncStorage.getItem(storageKey)
      .then((stored: string | null) => {
        if (!cancelled && stored) {
          setPersisted({ ...defaultState, ...sanitizeStoredWalletPreferences(JSON.parse(stored)) } as PersistedState);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setLoadedStorageKey(storageKey);
          setReady(true);
        }
      });
    return () => { cancelled = true; };
  }, [storageKey]);

  useEffect(() => {
    if (!ready || !storageKey || loadedStorageKey !== storageKey) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify(persisted));
  }, [loadedStorageKey, persisted, ready, storageKey]);

  const refreshLedger = useCallback(() => {
    if (ledgerRequestRef.current) return ledgerRequestRef.current;
    if (!cacheIdentity) {
      setProfile(null);
      setAssets([]);
      setWallets([]);
      setTransfers([]);
      setLedgerDataIdentity(null);
      setLoadingWallets(false);
      setLoadingTransfers(false);
      setLedgerStatus("idle");
      setLedgerError(null);
      return Promise.resolve();
    }

    setLedgerStatus(ledgerHasLoadedRef.current ? "refreshing" : "loading");
    setLedgerError(null);
    setLoadingWallets(true);
    setLoadingTransfers(true);
    const requestIdentity = cacheIdentity;
    const requestToken = Symbol(requestIdentity);
    ledgerRequestTokenRef.current = requestToken;
    const request = (async () => {
      try {
        const portfolio = ledgerMode === "visual-demo" ? await getPortfolio() : await bootstrapDemoAccount();
        const activity = await listTransfers();
        if (ledgerIdentityRef.current !== requestIdentity) return;
        setProfile(portfolio.profile);
        setAssets(portfolio.assets);
        setWallets(portfolio.wallets);
        setTransfers(activity);
        setLedgerDataIdentity(requestIdentity);
        setPersisted((current) => ({
          ...current,
          selectedWalletId: current.selectedWalletId && portfolio.wallets.some((wallet) => wallet.id === current.selectedWalletId)
            ? current.selectedWalletId
            : portfolio.wallets[0]?.id ?? null,
        }));
        ledgerHasLoadedRef.current = true;
        setLedgerStatus("ready");
      } catch (error) {
        if (ledgerIdentityRef.current !== requestIdentity) return;
        const message = error instanceof Error ? error.message : "Unable to load the wallet ledger.";
        setLedgerError(message);
        setLedgerStatus("error");
        throw error;
      } finally {
        if (ledgerIdentityRef.current === requestIdentity) {
          setLoadingWallets(false);
          setLoadingTransfers(false);
        }
        if (ledgerRequestTokenRef.current === requestToken) {
          ledgerRequestTokenRef.current = null;
          ledgerRequestRef.current = null;
        }
      }
    })();
    ledgerRequestRef.current = request;
    return request;
  }, [cacheIdentity]);

  const refreshWallets = useCallback(() => refreshLedger(), [refreshLedger]);
  const refreshTransfers = useCallback(() => refreshLedger(), [refreshLedger]);

  useEffect(() => {
    ledgerHasLoadedRef.current = false;
    ledgerRequestRef.current = null;
    ledgerRequestTokenRef.current = null;
    setProfile(null);
    setAssets([]);
    setWallets([]);
    setTransfers([]);
    setLedgerDataIdentity(null);
    void refreshLedger().catch(() => undefined);
  }, [cacheIdentity, refreshLedger]);

  useEffect(() => {
    if (ledgerMode !== "connected" || !user?.id || user.is_anonymous) return undefined;
    return subscribeToLedgerInvalidations({
      userId: user.id,
      onInvalidate: () => {
        void refreshLedger().catch(() => undefined);
      },
      onError: (error) => setLedgerError(`Live updates are temporarily unavailable: ${error.message}`),
    });
  }, [refreshLedger, user?.id]);

  const runLedgerMutation = useCallback(async <T,>(operation: () => Promise<T>) => {
    setLedgerStatus("mutating");
    setLedgerError(null);
    try {
      const result = await operation();
      const inFlightRefresh = ledgerRequestRef.current;
      if (inFlightRefresh) await inFlightRefresh.catch(() => undefined);
      await refreshLedger();
      return result;
    } catch (error) {
      setLedgerError(error instanceof Error ? error.message : "The wallet ledger operation failed.");
      setLedgerStatus("error");
      throw error;
    }
  }, [refreshLedger]);

  const fundDemoWallet = useCallback(
    (input: FundDemoWalletInput) => runLedgerMutation(() => fundDemoWalletService(input)),
    [runLedgerMutation],
  );

  const resolveRecipient = useCallback(
    (query: string, assetId?: string) => resolveRecipientService(query, assetId),
    [],
  );

  const sendDemoTransfer = useCallback(async (input: SendDemoTransferInput) => {
    const receipt = await runLedgerMutation(() => sendDemoTransferService(input));
    if (input.idempotencyKey) {
      await clearTransferRecoveryIntent(input.idempotencyKey).catch(() => undefined);
    }
    return receipt;
  }, [runLedgerMutation]);

  const renameWallet = useCallback(
    async (walletId: string, name: string) => {
      await runLedgerMutation(() => renameWalletService(walletId, name));
    },
    [runLedgerMutation],
  );

  const archiveWallet = useCallback(
    async (walletId: string) => {
      await runLedgerMutation(() => archiveWalletService(walletId));
    },
    [runLedgerMutation],
  );

  const applyMarketSnapshot = useCallback((snapshot: MarketsResponse) => {
    const legacy = toLegacyMarketLists(snapshot);
    const updatedAtMs = Date.parse(snapshot.asOf);
    const providerPollAfterMs = Math.min(60_000, Math.max(15_000, snapshot.pollAfterMs));
    const pollAfterMs = marketStreamUnavailableRef.current
      ? DEFAULT_MARKET_POLL_INTERVAL_MS
      : providerPollAfterMs;
    const stale = snapshot.stale || !Number.isFinite(updatedAtMs) || Date.now() - updatedAtMs > 2 * pollAfterMs;
    marketHasDataRef.current = Object.values(legacy.quoteByAssetId).some((quote) => quote.price !== null);
    marketSnapshotRef.current = snapshot;
    setMarketPollAfterMs(pollAfterMs);
    setMarketByAssetId(legacy.quoteByAssetId);
    setLiveTopTradedTokens(legacy.top);
    setLiveTrendingTokens(legacy.trending);
    setMarketUpdatedAt(snapshot.asOf);
    setMarketStatus(stale ? "stale" : "live");
  }, []);

  const refreshMarkets = useCallback(() => {
    if (marketRequestRef.current) return marketRequestRef.current;
    const controller = new AbortController();
    marketAbortRef.current = controller;
    if (!marketHasDataRef.current) setMarketStatus("loading");
    setMarketError(null);

    const request = (async () => {
      try {
        const currencyCode = persisted.currencyCode;
        const [next, usd] = await Promise.all([
          fetchLiveMarkets(currencyCode, controller.signal),
          currencyCode === "USD" ? Promise.resolve(null) : fetchLiveMarkets("USD", controller.signal),
        ]);
        if (controller.signal.aborted) return;
        let nextFxRate: number | null = 1;
        if (currencyCode !== "USD") {
          const usdByAssetId = usd?.quoteByAssetId ?? {};
          const sharedQuote = next.snapshot.quotes.find((quote) => {
            const usdQuote = usdByAssetId[quote.assetId];
            return quote.price !== null && usdQuote?.price != null && Number.isFinite(quote.price / usdQuote.price);
          });
          const usdPrice = sharedQuote ? usdByAssetId[sharedQuote.assetId]?.price : null;
          nextFxRate = sharedQuote?.price != null && usdPrice ? sharedQuote.price / usdPrice : null;
        }
        setMarketFxRate(nextFxRate);
        applyMarketSnapshot(next.snapshot);
        const cache: MarketCacheEnvelope = { snapshot: next.snapshot, fxRate: nextFxRate };
        void AsyncStorage.setItem(`${MARKET_CACHE_KEY}:${currencyCode}`, JSON.stringify(cache)).catch(() => undefined);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMarketPollAfterMs(DEFAULT_MARKET_POLL_INTERVAL_MS);
        setMarketError(error instanceof Error ? error.message : "Unable to refresh market prices");
        setMarketStatus(marketHasDataRef.current ? "stale" : "error");
      } finally {
        if (marketAbortRef.current === controller) {
          marketAbortRef.current = null;
          marketRequestRef.current = null;
        }
      }
    })();
    marketRequestRef.current = request;
    return request;
  }, [applyMarketSnapshot, persisted.currencyCode]);

  useEffect(() => {
    let cancelled = false;
    const currencyCode = persisted.currencyCode;
    marketStreamUnavailableRef.current = false;
    marketHasDataRef.current = false;
    marketSnapshotRef.current = null;
    setMarketByAssetId({});
    setLiveTopTradedTokens([]);
    setLiveTrendingTokens([]);
    setMarketUpdatedAt(null);
    setMarketError(null);
    setMarketFxRate(currencyCode === "USD" ? 1 : null);
    setMarketPollAfterMs(DEFAULT_MARKET_POLL_INTERVAL_MS);
    setMarketStatus("loading");
    void AsyncStorage.getItem(`${MARKET_CACHE_KEY}:${currencyCode}`)
      .then((stored) => {
        if (cancelled || !stored) return;
        const parsed = JSON.parse(stored) as unknown;
        const cached = readMarketCache(parsed, currencyCode);
        if (!cached) return;
        setMarketFxRate(cached.fxRate);
        applyMarketSnapshot(cached.snapshot);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) void refreshMarkets();
      });
    return () => {
      cancelled = true;
      marketAbortRef.current?.abort();
      marketAbortRef.current = null;
      marketRequestRef.current = null;
    };
  }, [applyMarketSnapshot, persisted.currencyCode, refreshMarkets]);

  useEffect(() => {
    if (!marketVisible || persisted.currencyCode !== "USD") return undefined;
    return subscribeToMarketStream({
      onQuote: (quote) => {
        marketStreamUnavailableRef.current = false;
        const current = marketSnapshotRef.current;
        if (!current) return;
        const quoteIndex = current.quotes.findIndex((candidate) => candidate.assetId === quote.assetId);
        const quotes = [...current.quotes];
        if (quoteIndex >= 0) quotes[quoteIndex] = quote;
        else quotes.push(quote);
        applyMarketSnapshot({ ...current, asOf: quote.lastUpdated, stale: false, quotes });
      },
      onError: (error) => {
        if (!marketHasDataRef.current) setMarketError(error.message);
      },
      onUnavailable: (reason) => {
        marketStreamUnavailableRef.current = true;
        setMarketPollAfterMs(DEFAULT_MARKET_POLL_INTERVAL_MS);
        if (!marketHasDataRef.current) setMarketError(reason);
      },
    });
  }, [applyMarketSnapshot, marketVisible, persisted.currencyCode]);

  useEffect(() => {
    if (!marketVisible || (Platform.OS === "web" && persisted.currencyCode === "USD")) return undefined;
    const controller = new AbortController();
    void probeMarketStreamAvailability(controller.signal)
      .then(({ available, pollAfterMs }) => {
        marketStreamUnavailableRef.current = !available;
        setMarketPollAfterMs(pollAfterMs);
      })
      .catch(() => {
        marketStreamUnavailableRef.current = true;
        setMarketPollAfterMs(DEFAULT_MARKET_POLL_INTERVAL_MS);
      });
    return () => controller.abort();
  }, [marketVisible, persisted.currencyCode]);

  useEffect(() => {
    const id = setInterval(() => {
      if (marketVisibleRef.current) void refreshMarkets();
    }, marketPollAfterMs);
    return () => clearInterval(id);
  }, [marketPollAfterMs, refreshMarkets]);

  useEffect(() => {
    const onVisibilityChange = (active: boolean) => {
      const wasVisible = marketVisibleRef.current;
      marketVisibleRef.current = active;
      setMarketVisible(active);
      if (active && !wasVisible) void refreshMarkets();
    };
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      onVisibilityChange(state === "active");
    });
    const webVisibilityHandler = () => onVisibilityChange(document.visibilityState !== "hidden");
    if (Platform.OS === "web" && typeof document !== "undefined") {
      marketVisibleRef.current = document.visibilityState !== "hidden";
      document.addEventListener("visibilitychange", webVisibilityHandler);
    }
    return () => {
      appStateSubscription.remove();
      if (Platform.OS === "web" && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", webVisibilityHandler);
      }
    };
  }, [refreshMarkets]);

  useEffect(() => () => {
    marketAbortRef.current?.abort();
  }, []);

  const currency = useMemo(
    () => currencyOptions.find((item) => item.code === persisted.currencyCode) ?? currencyOptions[0],
    [persisted.currencyCode],
  );

  const theme = persisted.themeMode === "dark" ? darkColors : colors;

  const ledgerIdentityMatches = ledgerDataIdentity === cacheIdentity;
  const visibleProfile = ledgerIdentityMatches ? profile : null;
  const visibleAssets = useMemo(() => ledgerIdentityMatches ? assets : [], [assets, ledgerIdentityMatches]);
  const visibleWallets = useMemo(() => ledgerIdentityMatches ? wallets : [], [ledgerIdentityMatches, wallets]);
  const visibleTransfers = useMemo(() => ledgerIdentityMatches ? transfers : [], [ledgerIdentityMatches, transfers]);

  const selectedWallet = useMemo(
    () => visibleWallets.find((wallet) => wallet.id === persisted.selectedWalletId) ?? visibleWallets[0] ?? null,
    [persisted.selectedWalletId, visibleWallets],
  );

  const totalBalance = useMemo(() => {
    if (!selectedWallet) return 0;
    return selectedWallet.balances.reduce((sum, balance) => {
      const amount = Number(balance.display_amount);
      if (!Number.isFinite(amount)) return sum;
      if (["USD", "USDT", "USDC"].includes(balance.asset.symbol)) return sum + amount;
      const marketAsset = getAssetBySymbol(balance.asset.symbol);
      const price = marketAsset ? marketByAssetId[marketAsset.assetId]?.price : null;
      return typeof price === "number" && Number.isFinite(price) ? sum + amount * price : sum;
    }, 0);
  }, [marketByAssetId, selectedWallet]);

  const visibleBalance = persisted.hideBalance
    ? "*****"
    : marketFxRate === null
      ? "Unavailable"
      : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.code,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 2,
      }).format(totalBalance * marketFxRate);

  const setCurrencyCode = useCallback((code: MarketCurrency) => {
    marketAbortRef.current?.abort();
    marketAbortRef.current = null;
    marketRequestRef.current = null;
    marketHasDataRef.current = false;
    marketSnapshotRef.current = null;
    setMarketByAssetId({});
    setLiveTopTradedTokens([]);
    setLiveTrendingTokens([]);
    setMarketUpdatedAt(null);
    setMarketError(null);
    setMarketFxRate(code === "USD" ? 1 : null);
    setMarketPollAfterMs(DEFAULT_MARKET_POLL_INTERVAL_MS);
    setMarketStatus("loading");
    setPersisted((current) => ({ ...current, currencyCode: code }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setPersisted((current) => ({ ...current, themeMode: mode }));
  }, []);

  const toggleThemeMode = useCallback(() => {
    setPersisted((current) => ({ ...current, themeMode: current.themeMode === "light" ? "dark" : "light" }));
  }, []);

  const toggleHideBalance = useCallback(() => {
    setPersisted((current) => ({ ...current, hideBalance: !current.hideBalance }));
  }, []);

  const setSelectedWalletId = useCallback((walletId: string | null) => {
    setPersisted((current) => ({ ...current, selectedWalletId: walletId }));
  }, []);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setPersisted((current) => ({ ...current, layoutMode: mode }));
  }, []);

  const toggleHideSmallBalances = useCallback(() => {
    setPersisted((current) => ({ ...current, hideSmallBalances: !current.hideSmallBalances }));
  }, []);

  const toggleHideNfts = useCallback(() => {
    setPersisted((current) => ({ ...current, hideNfts: !current.hideNfts }));
  }, []);

  const toggleHidePredictions = useCallback(() => {
    setPersisted((current) => ({ ...current, hidePredictions: !current.hidePredictions }));
  }, []);

  const dismissBackupBanner = useCallback(() => {
    setPersisted((current) => ({ ...current, backupBannerDismissed: true }));
  }, []);

  const resetBackupBanner = useCallback(() => {
    setPersisted((current) => ({ ...current, backupBannerDismissed: false }));
  }, []);

  const toggleWatchlistToken = useCallback((symbol: string) => {
    setPersisted((current) => ({
      ...current,
      watchlist: current.watchlist.includes(symbol)
        ? current.watchlist.filter((item) => item !== symbol)
        : [...current.watchlist, symbol],
    }));
  }, []);

  const toggleFavoriteDapp = useCallback((name: string) => {
    setPersisted((current) => ({
      ...current,
      favoriteDapps: current.favoriteDapps.includes(name)
        ? current.favoriteDapps.filter((item) => item !== name)
        : [...current.favoriteDapps, name],
    }));
  }, []);

  const clearBrowserCache = useCallback(() => {
    setMarketFilter("hot");
  }, []);

  const addAddressBookEntry = useCallback((entry: Omit<AddressBookEntry, "id">) => {
    setPersisted((current) => ({
      ...current,
      addressBook: [{ id: `addr-${Date.now()}`, ...entry }, ...current.addressBook],
    }));
  }, []);

  const removeAddressBookEntry = useCallback((id: string) => {
    setPersisted((current) => ({
      ...current,
      addressBook: current.addressBook.filter((entry) => entry.id !== id),
    }));
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    themeMode: persisted.themeMode,
    theme,
    currency,
    ledgerMode,
    ledgerStatus,
    ledgerError,
    profile: visibleProfile,
    assets: visibleAssets,
    wallets: visibleWallets,
    transfers: visibleTransfers,
    loadingWallets: !ledgerIdentityMatches || loadingWallets,
    loadingTransfers: !ledgerIdentityMatches || loadingTransfers,
    selectedWalletId: selectedWallet?.id ?? null,
    selectedWallet,
    totalBalance,
    visibleBalance,
    layoutMode: persisted.layoutMode,
    hideBalance: persisted.hideBalance,
    hideSmallBalances: persisted.hideSmallBalances,
    hideNfts: persisted.hideNfts,
    hidePredictions: persisted.hidePredictions,
    backupBannerDismissed: persisted.backupBannerDismissed,
    watchlist: persisted.watchlist,
    favoriteDapps: persisted.favoriteDapps,
    language: persisted.language,
    dappBrowserEnabled: persisted.dappBrowserEnabled,
    customRpcUrl: persisted.customRpcUrl,
    scannerAlerts: persisted.scannerAlerts,
    transactionSigning: persisted.transactionSigning,
    appLockEnabled: persisted.appLockEnabled,
    biometricsEnabled: persisted.biometricsEnabled,
    autoLockTimer: persisted.autoLockTimer,
    pushIncoming: persisted.pushIncoming,
    pushOutgoing: persisted.pushOutgoing,
    pushPromotions: persisted.pushPromotions,
    addressBook: persisted.addressBook,
    activeHomeTab: persisted.activeHomeTab,
    activeRewardsTab: persisted.activeRewardsTab,
    marketFilters,
    marketFilter,
    trendingTokens: marketFilter === "gainers"
      ? [...liveTrendingTokens].sort((left, right) => right.change - left.change)
      : liveTrendingTokens.filter((token) => token.categories.includes(marketFilter) || marketFilter === "hot"),
    topTradedTokens: liveTopTradedTokens,
    marketByAssetId,
    marketStatus,
    marketUpdatedAt,
    marketError,
    rewardsCampaigns,
    trustAlphaCampaigns,
    rewardRedeemItems,
    dappCategories,
    socialLinks,
    networkOptions,
    refreshLedger,
    fundDemoWallet,
    resolveRecipient,
    sendDemoTransfer,
    refreshWallets,
    refreshTransfers,
    renameWallet,
    archiveWallet,
    refreshMarkets,
    setThemeMode,
    toggleThemeMode,
    setCurrencyCode,
    setSelectedWalletId,
    toggleHideBalance,
    setLayoutMode,
    toggleHideSmallBalances,
    toggleHideNfts,
    toggleHidePredictions,
    dismissBackupBanner,
    resetBackupBanner,
    toggleWatchlistToken,
    toggleFavoriteDapp,
    setLanguage: (value) => setPersisted((current) => ({ ...current, language: value })),
    setDappBrowserEnabled: (value) => setPersisted((current) => ({ ...current, dappBrowserEnabled: value })),
    clearBrowserCache,
    setCustomRpcUrl: (value) => setPersisted((current) => ({ ...current, customRpcUrl: value })),
    setScannerAlerts: (value) => setPersisted((current) => ({ ...current, scannerAlerts: value })),
    setTransactionSigning: (value) => setPersisted((current) => ({ ...current, transactionSigning: value })),
    setAppLockEnabled: (value) => setPersisted((current) => ({ ...current, appLockEnabled: value })),
    setBiometricsEnabled: (value) => setPersisted((current) => ({ ...current, biometricsEnabled: value })),
    setAutoLockTimer: (value) => setPersisted((current) => ({ ...current, autoLockTimer: value })),
    setPushIncoming: (value) => setPersisted((current) => ({ ...current, pushIncoming: value })),
    setPushOutgoing: (value) => setPersisted((current) => ({ ...current, pushOutgoing: value })),
    setPushPromotions: (value) => setPersisted((current) => ({ ...current, pushPromotions: value })),
    addAddressBookEntry,
    removeAddressBookEntry,
    setActiveHomeTab: (tab) => setPersisted((current) => ({ ...current, activeHomeTab: tab })),
    setActiveRewardsTab: (tab) => setPersisted((current) => ({ ...current, activeRewardsTab: tab })),
    setMarketFilter,
  }), [
    addAddressBookEntry,
    archiveWallet,
    clearBrowserCache,
    currency,
    dismissBackupBanner,
    fundDemoWallet,
    ledgerError,
    ledgerIdentityMatches,
    ledgerStatus,
    loadingTransfers,
    loadingWallets,
    liveTopTradedTokens,
    liveTrendingTokens,
    marketByAssetId,
    marketError,
    marketFilter,
    marketStatus,
    marketUpdatedAt,
    persisted,
    refreshLedger,
    refreshMarkets,
    refreshTransfers,
    refreshWallets,
    renameWallet,
    resetBackupBanner,
    resolveRecipient,
    selectedWallet,
    sendDemoTransfer,
    setCurrencyCode,
    setLayoutMode,
    setSelectedWalletId,
    setThemeMode,
    theme,
    toggleFavoriteDapp,
    toggleHideBalance,
    toggleHideNfts,
    toggleHidePredictions,
    toggleHideSmallBalances,
    toggleThemeMode,
    toggleWatchlistToken,
    totalBalance,
    visibleAssets,
    visibleProfile,
    visibleTransfers,
    visibleWallets,
    visibleBalance,
  ]);

  return createElement(AppContext.Provider, { value }, children);
}

export function useAppContext() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return value;
}
