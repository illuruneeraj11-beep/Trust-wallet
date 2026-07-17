import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addressBookSeed,
  currencyOptions,
  dappCategories,
  formatCurrencyValue,
  getFilteredTrendingTokens,
  marketFilters,
  networkOptions,
  predictionMarkets,
  rewardRedeemItems,
  rewardsCampaigns,
  socialLinks,
  topTradedTokens as fallbackTopTradedTokens,
  trustAlphaCampaigns,
  type AddressBookEntry,
  type CurrencyOption,
  type TrendingToken,
} from "@/data/trust-wallet";
import { fetchLiveMarkets } from "@/services/market-prices";
import { ensureStarterWallets, listTransfers, primaryBalance } from "@/services/wallet-ledger";
import { colors, darkColors, type ThemeColors } from "@/theme/colors";
import type { MockTransfer, WalletWithBalances } from "@/types/wallet";

type ThemeMode = "light" | "dark";
type LayoutMode = 1 | 2 | 3;
type HomeTab = "crypto" | "nfts" | "watchlist" | "history";
type RewardsTab = "campaigns" | "trust-alpha";
type AutoLockTimer = "Immediately" | "1 minute" | "5 minutes" | "1 hour" | "5 hours";

type PersistedState = {
  themeMode: ThemeMode;
  currencyCode: string;
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
  trustedHandle: string;
  addressBook: AddressBookEntry[];
  activeHomeTab: HomeTab;
  activeRewardsTab: RewardsTab;
};

type AppContextValue = {
  themeMode: ThemeMode;
  theme: ThemeColors;
  currency: CurrencyOption;
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
  trustedHandle: string;
  addressBook: AddressBookEntry[];
  activeHomeTab: HomeTab;
  activeRewardsTab: RewardsTab;
  marketFilters: string[];
  marketFilter: string;
  trendingTokens: ReturnType<typeof getFilteredTrendingTokens>;
  topTradedTokens: typeof fallbackTopTradedTokens;
  rewardsCampaigns: typeof rewardsCampaigns;
  trustAlphaCampaigns: typeof trustAlphaCampaigns;
  rewardRedeemItems: typeof rewardRedeemItems;
  predictionMarkets: typeof predictionMarkets;
  dappCategories: typeof dappCategories;
  socialLinks: typeof socialLinks;
  networkOptions: typeof networkOptions;
  refreshWallets: () => Promise<void>;
  refreshTransfers: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setCurrencyCode: (code: string) => void;
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
  setTrustedHandle: (value: string) => void;
  addAddressBookEntry: (entry: Omit<AddressBookEntry, "id">) => void;
  removeAddressBookEntry: (id: string) => void;
  setActiveHomeTab: (tab: HomeTab) => void;
  setActiveRewardsTab: (tab: RewardsTab) => void;
  setMarketFilter: (filter: string) => void;
};

const STORAGE_KEY = "trust-wallet-app-context-v3";

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
  trustedHandle: "arun.trust",
  addressBook: addressBookSeed,
  activeHomeTab: "crypto",
  activeRewardsTab: "campaigns",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedState>(defaultState);
  const [wallets, setWallets] = useState<WalletWithBalances[]>([]);
  const [transfers, setTransfers] = useState<MockTransfer[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);
  const [ready, setReady] = useState(false);
  const [marketFilter, setMarketFilter] = useState<string>("hot");
  const [liveTopTradedTokens, setLiveTopTradedTokens] = useState<TrendingToken[] | null>(null);
  const [liveTrendingTokens, setLiveTrendingTokens] = useState<TrendingToken[] | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored: string | null) => {
        if (stored) {
          setPersisted({ ...defaultState, ...JSON.parse(stored) as PersistedState });
        }
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [persisted, ready]);

  const refreshWallets = useCallback(async () => {
    setLoadingWallets(true);
    try {
      const rows = await ensureStarterWallets();
      setWallets(rows);
      setPersisted((current) => ({
        ...current,
        selectedWalletId: current.selectedWalletId && rows.some((wallet) => wallet.id === current.selectedWalletId)
          ? current.selectedWalletId
          : rows[0]?.id ?? null,
      }));
    } finally {
      setLoadingWallets(false);
    }
  }, []);

  const refreshTransfers = useCallback(async () => {
    setLoadingTransfers(true);
    try {
      const rows = await listTransfers();
      setTransfers(rows);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    void refreshWallets();
    void refreshTransfers();
  }, [refreshTransfers, refreshWallets]);

  useEffect(() => {
    let cancelled = false;
    async function refreshMarkets() {
      try {
        const next = await fetchLiveMarkets();
        if (!cancelled) {
          setLiveTopTradedTokens(next.top);
          setLiveTrendingTokens(next.trending);
        }
      } catch {
        // Static market data remains the offline fallback.
      }
    }
    void refreshMarkets();
    const id = setInterval(refreshMarkets, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const currency = useMemo(
    () => currencyOptions.find((item) => item.code === persisted.currencyCode) ?? currencyOptions[0],
    [persisted.currencyCode],
  );

  const theme = persisted.themeMode === "dark" ? darkColors : colors;

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === persisted.selectedWalletId) ?? wallets[0] ?? null,
    [persisted.selectedWalletId, wallets],
  );

  const totalBalance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + primaryBalance(wallet), 0),
    [wallets],
  );

  const visibleBalance = persisted.hideBalance ? "*****" : formatCurrencyValue(totalBalance, currency);

  const setCurrencyCode = useCallback((code: string) => {
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
    wallets,
    transfers,
    loadingWallets,
    loadingTransfers,
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
    trustedHandle: persisted.trustedHandle,
    addressBook: persisted.addressBook,
    activeHomeTab: persisted.activeHomeTab,
    activeRewardsTab: persisted.activeRewardsTab,
    marketFilters,
    marketFilter,
    trendingTokens: liveTrendingTokens
      ? (marketFilter === "gainers"
        ? [...liveTrendingTokens].sort((left, right) => right.change - left.change)
        : liveTrendingTokens.filter((token) => token.categories.includes(marketFilter) || marketFilter === "hot"))
      : getFilteredTrendingTokens(marketFilter),
    topTradedTokens: liveTopTradedTokens ?? fallbackTopTradedTokens,
    rewardsCampaigns,
    trustAlphaCampaigns,
    rewardRedeemItems,
    predictionMarkets,
    dappCategories,
    socialLinks,
    networkOptions,
    refreshWallets,
    refreshTransfers,
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
    setTrustedHandle: (value) => setPersisted((current) => ({ ...current, trustedHandle: value })),
    addAddressBookEntry,
    removeAddressBookEntry,
    setActiveHomeTab: (tab) => setPersisted((current) => ({ ...current, activeHomeTab: tab })),
    setActiveRewardsTab: (tab) => setPersisted((current) => ({ ...current, activeRewardsTab: tab })),
    setMarketFilter,
  }), [
    addAddressBookEntry,
    clearBrowserCache,
    currency,
    dismissBackupBanner,
    loadingTransfers,
    loadingWallets,
    liveTopTradedTokens,
    liveTrendingTokens,
    marketFilter,
    persisted,
    refreshTransfers,
    refreshWallets,
    resetBackupBanner,
    selectedWallet,
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
    transfers,
    visibleBalance,
    wallets,
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
