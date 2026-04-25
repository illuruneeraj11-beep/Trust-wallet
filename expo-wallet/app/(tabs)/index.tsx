import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { earnOpportunities, formatCurrencyValue, topTradedTokens } from "@/data/trust-wallet";
import { useAppContext } from "@/context/app-context";
import { formatMoney, primaryBalance } from "@/services/wallet-ledger";
import { AppScreen, Card, EmptyStateCard, HeaderIcon, SectionHeader, SheetModal, TokenRow, WalletPill } from "@/components/trust-ui";

export default function HomeScreen() {
  const [layoutVisible, setLayoutVisible] = useState(false);
  const [walletVisible, setWalletVisible] = useState(false);
  const {
    activeHomeTab,
    backupBannerDismissed,
    currency,
    dismissBackupBanner,
    hideBalance,
    hideNfts,
    hidePredictions,
    hideSmallBalances,
    layoutMode,
    loadingTransfers,
    loadingWallets,
    refreshTransfers,
    refreshWallets,
    selectedWallet,
    setActiveHomeTab,
    setLayoutMode,
    setSelectedWalletId,
    theme,
    toggleHideBalance,
    toggleHideNfts,
    toggleHidePredictions,
    toggleHideSmallBalances,
    totalBalance,
    transfers,
    trendingTokens,
    visibleBalance,
    wallets,
    watchlist,
  } = useAppContext();

  const cryptoBalances = useMemo(() => {
    if (!selectedWallet) {
      return [];
    }

    return selectedWallet.balances.filter((balance) => {
      const amount = Number(balance.amount || 0);
      return hideSmallBalances ? amount >= 0.01 : true;
    });
  }, [hideSmallBalances, selectedWallet]);

  const watchlistTokens = useMemo(() => {
    const merged = [...topTradedTokens, ...trendingTokens];
    return merged.filter((token, index) => watchlist.includes(token.symbol) && merged.findIndex((row) => row.symbol === token.symbol) === index);
  }, [trendingTokens, watchlist]);

  const historyRows = useMemo(() => {
    return transfers.slice(0, 6).map((transfer) => ({
      id: transfer.id,
      label: transfer.note || "Wallet transfer",
      amount: Number(transfer.amount || 0),
      createdAt: new Date(transfer.created_at).toLocaleString(),
      status: transfer.status,
    }));
  }, [transfers]);

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 18, gap: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <HeaderIcon icon="⚙" onPress={() => router.push("/settings")} />
            <Pressable style={{ flex: 1, minHeight: 54, borderRadius: 28, backgroundColor: theme.input, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ color: theme.secondary, fontSize: 20 }}>⌕</Text>
              <Text style={{ color: theme.secondary, fontSize: 18, fontWeight: "700" }}>Search</Text>
            </Pressable>
            <HeaderIcon icon="⌲" onPress={() => router.push("/receive")} />
          </View>

          <View style={{ alignItems: "center", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => setWalletVisible(true)} style={{ minHeight: 42, paddingHorizontal: 18, borderRadius: 999, backgroundColor: theme.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{selectedWallet?.name || "Main Wallet 1"}</Text>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>›</Text>
                <View style={{ position: "absolute", right: 8, top: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: "#d91524" }} />
              </Pressable>
              <Pressable onPress={toggleHideBalance} style={{ padding: 6 }}>
                <Text style={{ color: theme.text, fontSize: 22 }}>⧉</Text>
              </Pressable>
            </View>
            <Pressable onPress={toggleHideBalance}>
              <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "700" }}>{hideBalance ? "Balance hidden" : visibleBalance}</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <QuickAction label="Send" icon="↗" onPress={() => router.push("/send")} />
            <QuickAction label="Receive" icon="↓" onPress={() => router.push("/receive")} />
            <QuickAction label="Swap" icon="⟳" onPress={() => router.push("/swap")} />
            <QuickAction label="Buy" icon="＋" onPress={() => router.push("/fund")} />
          </View>

          {!backupBannerDismissed ? (
            <Pressable onPress={() => router.push("/wallet-backup")} style={{ borderRadius: 22, borderWidth: 1.5, borderColor: "#efc4f6", backgroundColor: theme.surface, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <MiniWalletArt />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>Back up to secure your assets</Text>
                <Text style={{ color: theme.blue, fontSize: 15, fontWeight: "900" }}>Back up wallet →</Text>
              </View>
              <Pressable onPress={dismissBackupBanner} hitSlop={10}>
                <Text style={{ color: theme.secondary, fontSize: 22 }}>×</Text>
              </Pressable>
            </Pressable>
          ) : null}

          <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 18 }}>
            <TopTab label="Crypto" active={activeHomeTab === "crypto"} onPress={() => setActiveHomeTab("crypto")} />
            <TopTab label="Watchlist" active={activeHomeTab === "watchlist"} onPress={() => setActiveHomeTab("watchlist")} />
            <TopTab label="NFT" active={activeHomeTab === "nfts"} onPress={() => setActiveHomeTab("nfts")} />
            <Pressable onPress={() => setActiveHomeTab("history")} style={{ marginLeft: "auto" }}>
              <Text style={{ color: activeHomeTab === "history" ? theme.text : theme.secondary, fontSize: 22 }}>◔</Text>
            </Pressable>
            <Pressable onPress={() => setLayoutVisible(true)}>
              <Text style={{ color: theme.secondary, fontSize: 22 }}>⚙</Text>
            </Pressable>
          </View>

          {loadingWallets ? <ActivityIndicator color={theme.blue} /> : null}

          {activeHomeTab === "crypto" ? (
            <View style={{ gap: 12 }}>
              {!selectedWallet || primaryBalance(selectedWallet) <= 0 ? (
                <Card muted>
                  <View style={{ alignItems: "center", gap: 18, paddingVertical: 6 }}>
                    <OpenWalletArt />
                    <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900", textAlign: "center", lineHeight: 30 }}>Fund your wallet to start trading and earning</Text>
                    <Pressable onPress={() => router.push("/fund")} style={{ minHeight: 58, borderRadius: 999, backgroundColor: theme.blue, alignSelf: "stretch", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Fund</Text>
                    </Pressable>
                    <Pressable onPress={() => router.push("/receive")} style={{ minHeight: 58, borderRadius: 999, backgroundColor: "#d8d4ff", alignSelf: "stretch", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: theme.blue, fontSize: 18, fontWeight: "900" }}>Receive crypto</Text>
                    </Pressable>
                  </View>
                </Card>
              ) : (
                cryptoBalances.map((balance, index) => {
                  const symbol = balance.mock_wallet_assets?.symbol || `A${index + 1}`;
                  const amount = Number(balance.amount || 0);
                  return (
                    <TokenRow
                      key={`${selectedWallet.id}-${symbol}`}
                      symbol={symbol}
                      name={balance.mock_wallet_assets?.name || symbol}
                      price={formatCurrencyValue(amount, currency)}
                      change={index % 2 === 0 ? "+2.40%" : "-0.81%"}
                      meta={`${selectedWallet.name} · ${amount.toFixed(2)} ${symbol}`}
                      onPress={() => router.push({ pathname: "/token-detail", params: { symbol, name: balance.mock_wallet_assets?.name || symbol, price: formatCurrencyValue(amount, currency), change: index % 2 === 0 ? "+2.40%" : "-0.81%" } })}
                    />
                  );
                })
              )}
            </View>
          ) : null}

          {activeHomeTab === "nfts" ? (
            hideNfts ? (
              <EmptyStateCard icon="🙈" title="NFTs are hidden" subtitle="Turn off Hide NFTs in layout settings to see your collectibles." />
            ) : (
              <EmptyStateCard icon="🖼" title="No NFTs yet" subtitle="Collectibles from Ethereum, Solana, and more will show up here." />
            )
          ) : null}

          {activeHomeTab === "watchlist" ? (
            <View style={{ gap: 12 }}>
              {watchlistTokens.length ? (
                watchlistTokens.map((token) => (
                  <TokenRow
                    key={token.symbol}
                    symbol={token.symbol}
                    name={token.name}
                    price={formatCurrencyValue(token.price, currency)}
                    change={`${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%`}
                    meta={`${token.marketCap} MCap · ${token.volume} Vol`}
                    network={token.network}
                    onPress={() => router.push({ pathname: "/token-detail", params: { symbol: token.symbol, name: token.name, price: formatCurrencyValue(token.price, currency), change: `${token.change >= 0 ? "+" : ""}${token.change.toFixed(2)}%` } })}
                  />
                ))
              ) : (
                <EmptyStateCard icon="📦" title="No results found" subtitle="Add tokens to your watchlist from Trending or Discover." />
              )}
            </View>
          ) : null}

          {activeHomeTab === "history" ? (
            <View style={{ gap: 12 }}>
              {loadingTransfers ? <ActivityIndicator color={theme.blue} /> : null}
              {historyRows.length ? (
                historyRows.map((row) => (
                  <TokenRow
                    key={row.id}
                    symbol={row.status === "completed" ? "TX" : "PND"}
                    name={row.label}
                    price={formatMoney(row.amount, currency.code)}
                    change={row.status === "completed" ? "+Confirmed" : "-Pending"}
                    meta={row.createdAt}
                    onPress={() => router.push("/tx-history")}
                  />
                ))
              ) : (
                <EmptyStateCard icon="🎮" title="No transactions yet" subtitle="Can't find your transaction? Open the explorer from your history screen." linkLabel="Check explorer" onPress={() => router.push("/tx-history")} />
              )}
            </View>
          ) : null}

          <SectionHeader title="Earn" actionLabel="View all" onPress={() => router.push("/rewards")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {earnOpportunities.map((item, index) => (
              <LinearGradient key={item.symbol} colors={index % 2 === 0 ? ["#ffffff", "#eef0ff"] : ["#f7fbff", "#fff6fb"]} style={{ width: 180, borderRadius: 28, padding: 18, gap: 24, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{item.symbol.slice(0, 3)}</Text>
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>Earn up to {item.apy}</Text>
                  <Text style={{ color: theme.secondary, fontSize: 14 }}>on {item.name}</Text>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>
      </AppScreen>

      <SheetModal visible={layoutVisible} title="Asset Layout" subtitle="Customize your dashboard locally" onClose={() => setLayoutVisible(false)}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[1, 2, 3].map((mode) => (
            <Pressable key={mode} onPress={() => setLayoutMode(mode as 1 | 2 | 3)} style={{ minHeight: 42, minWidth: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: layoutMode === mode ? theme.blueSoft : theme.surface, alignItems: "center", justifyContent: "center", borderWidth: layoutMode === mode ? 0 : 1, borderColor: theme.border }}>
              <Text style={{ color: layoutMode === mode ? theme.blue : theme.secondary, fontSize: 14, fontWeight: "900" }}>{mode}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => { toggleHideSmallBalances(); setLayoutVisible(false); }} style={{ minHeight: 54, borderRadius: 999, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>Dust cleaner</Text>
        </Pressable>
        <WalletPill title="Hide assets < $0.01" subtitle={hideSmallBalances ? "Enabled" : "Disabled"} selected={hideSmallBalances} onPress={toggleHideSmallBalances} />
        <WalletPill title="Hide NFTs" subtitle={hideNfts ? "Enabled" : "Disabled"} selected={hideNfts} onPress={toggleHideNfts} />
        <WalletPill title="Hide Predictions" subtitle={hidePredictions ? "Enabled" : "Disabled"} selected={hidePredictions} onPress={toggleHidePredictions} />
      </SheetModal>

      <SheetModal visible={walletVisible} title="Wallet Selector" subtitle="Switch, manage, or back up your wallet" onClose={() => setWalletVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 10 }}>
          {wallets.map((wallet) => (
            <WalletPill
              key={wallet.id}
              title={wallet.name}
              subtitle={formatMoney(primaryBalance(wallet), currency.code)}
              selected={wallet.id === selectedWallet?.id}
              onPress={() => {
                setSelectedWalletId(wallet.id);
                setWalletVisible(false);
              }}
            />
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => { setWalletVisible(false); router.push("/wallet-backup"); }} style={{ flex: 1, minHeight: 52, borderRadius: 999, backgroundColor: theme.blueSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.blue, fontSize: 15, fontWeight: "900" }}>Back up</Text>
          </Pressable>
          <Pressable onPress={() => { setWalletVisible(false); router.push("/wallets"); }} style={{ flex: 1, minHeight: 52, borderRadius: 999, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>Manage wallets</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => { void refreshWallets(); void refreshTransfers(); }} style={{ alignSelf: "center" }}>
          <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "800" }}>Refresh balances · {formatMoney(totalBalance, currency.code)}</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", gap: 10 }}>
      <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: "#f0f1f5", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#0f1115", fontSize: 26, fontWeight: "900" }}>{icon}</Text>
      </View>
      <Text style={{ color: "#17191f", fontSize: 13, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function TopTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingBottom: 8, borderBottomWidth: 4, borderBottomColor: active ? "#0500e8" : "transparent" }}>
      <Text style={{ color: active ? "#111318" : "#7b8089", fontSize: 18, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function MiniWalletArt() {
  return (
    <View style={{ width: 84, height: 64, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient colors={["#f8a6ff", "#fdf0a6", "#8affcf"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 32, borderRadius: 10, transform: [{ rotate: "-16deg" }] }} />
      <View style={{ position: "absolute", width: 28, height: 40, borderRadius: 14, borderWidth: 4, borderColor: "#181b21", borderTopColor: "transparent", top: 8, left: 16, transform: [{ rotate: "-18deg" }] }} />
      <View style={{ position: "absolute", width: 14, height: 10, borderRadius: 5, backgroundColor: "#111", top: 26, right: 16 }} />
    </View>
  );
}

function OpenWalletArt() {
  return (
    <View style={{ width: 120, height: 110, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient colors={["#79ffb7", "#c5ff64", "#6ae3ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 74, height: 54, borderRadius: 14, transform: [{ rotate: "-18deg" }], borderWidth: 2, borderColor: "#0f1115" }} />
      <View style={{ position: "absolute", width: 48, height: 36, backgroundColor: "#101217", borderRadius: 10, top: 14, left: 44, transform: [{ rotate: "18deg" }] }} />
      <View style={{ position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: "#0af", top: 26, right: 18 }} />
      <View style={{ position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#63f", bottom: 24, right: 30 }} />
      <View style={{ position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#57ff8b", top: 46, right: 12 }} />
    </View>
  );
}
