# Trust Wallet Clone — Full Project Context

> **Version:** UI Preview v4 / App Logic v5  
> **Last Updated:** April 2026  
> **Status:** Production-ready frontend UI — backend integration pending

---

## 📁 Project Structure

```
trust wallet/
├── PROJECT_CONTEXT.md            ← This file
├── README.md                     ← Original Flutter/Dart README
├── analysis_options.yaml         ← Dart analysis config (legacy)
├── pubspec.yaml                  ← Flutter dependencies (legacy)
├── lib/                          ← Legacy Flutter source (unused)
└── ui_preview/
    ├── index.html                ← Main app (85 KB, 1456 lines) — all screens
    ├── app.js                    ← App logic (55 KB, 1265 lines) — all functions
    ├── data_generation.js        ← Data helper scripts
    └── networks.json             ← Network metadata JSON
```

> **The entire app lives in `ui_preview/index.html` + `ui_preview/app.js`.**  
> It is a single-page HTML app that mimics a native Trust Wallet Android/iOS app inside a CSS phone shell (390 × 844 px). No build step required — open `index.html` in any browser.

---

## 🏗️ Architecture Overview

| Layer | Technology |
|---|---|
| Structure | Vanilla HTML5 |
| Styling | Vanilla CSS (inline `<style>` in `index.html`) |
| Logic | Vanilla JavaScript (ES2022, `app.js`) |
| Market Data | CoinGecko Public API (REST, polled every 60 s) |
| Font | Google Fonts — Inter (400/500/600/700/800/900) |
| No framework | No React, no Vue, no build tools |

### Screen Architecture

There are two types of navigable views:

1. **`.screen`** — The five main tab screens (absolute-positioned, shown/hidden via `display:flex / display:none`).
2. **`.push-screen`** — Overlay screens that slide in from the right (like a native push navigation stack, `transform: translateX(100%→0)`).

Navigation is handled by `show()`, `pushScreen()`, and `popScreen()` in `app.js`.

---

## 📱 All Screens & Features

### 🔵 Main Screens (Bottom Tab Bar)

| Tab | Screen ID | Description |
|---|---|---|
| Home | `#home` | Wallet dashboard |
| Trending | `#trending` | Live market token list |
| Trade (FAB) | Trade menu overlay | Buy/Sell/Swap/Send sheet |
| Rewards | `#rewards` | XP system, campaigns |
| Discover | `#discover` | dApps browser, Trust Premium |

---

### HOME Screen (`#home`)

**Header Row:**
- Settings icon → `pushScreen('settings-screen')`
- Search bar → `pushScreen('search-screen')`
- QR Scanner icon → `haptic()` (UI-only)

**Wallet Row:**
- Wallet name label (e.g. "Main Wallet 1") → `openBottomSheet('wallet-sheet')`
- Copy icon next to wallet name

**Balance Row:**
- `id="home-balance"` — hidden by default (`display:none`) when balance is `$0.00`
- Shows total portfolio USD value when populated

**Action Buttons (4):**

| Button | Action |
|---|---|
| Send | `pushScreen('send-asset-select-screen')` |
| Receive | `pushScreen('receive-screen')` |
| Swap | `pushScreen('trade-screen')` |
| Buy | `pushScreen('buy-screen')` |

**Home Tab Bar (3 tabs):**

| Tab | Panel ID | Content |
|---|---|---|
| Crypto | `#home-panel-crypto` | Fund card, Prediction, Perps, Earn, History |
| Watchlist | `#home-panel-watchlist` | ETH, SOL, BNB, BTC static watchlist rows |
| NFTs | `#home-panel-nfts` | Empty state placeholder |

**Crypto Panel Sections:**

1. **Fund Card** — "Fund your wallet to start trading" with Fund / Receive Crypto buttons. Hidden once balance > $0 (manual update needed).

2. **Prediction** → `#prediction-list` — Horizontal scroll of Polymarket-style prediction cards with Yes/No buttons and live countdown timers. Currently 2 static predictions.

3. **Perps** → `#perps-list` — Horizontal scroll of perpetual futures cards (ETH 200x, SOL 100x, BTC 200x).

4. **Earn** → `#earn-list` — Horizontal scroll of staking yield cards (STARS 31.15%, JUNO 27.16%, KSM 15.28%).

5. **History** → `#history-list` — Recent transactions, rendered from `HISTORY_MOCK` in `app.js`. **This is the section that must be updated manually from the backend.**

---

### TRENDING Screen (`#trending`)

- **Top Traded (24h)** → `#top-traded-scroll` — Horizontal cards for ETH, BNB, SOL with sparkline charts. Live price from CoinGecko.
- **Filter Pills:** Hot tokens | Top Gainers | Pre-IPO | RWA
- **Dropdown Filters:** Network ▼, Market Cap ▼, 24h ▼ (UI-only)
- **Token List** → `#trending-list` — Dynamically rendered from live market data. Default 12 tokens: LINK, XAUt, AAVE, DEXE, SOL, ETH, BNB, BTC, XRP, AVAX, MATIC, ARB, TWT

Each token row shows: Logo + network badge, name, MCap, Vol, Price, 24h change (green/red).  
Clicking a token → `openDetail(sym, price, chg, up)` → Token Detail push screen.

---

### REWARDS Screen (`#rewards`)

- XP Level card (currently "100 XP to Bronze")  
- XP Balance card (currently "0 XP")
- Campaign cards: "New campaigns coming soon" + X/Twitter handle button
- **Trust Alpha** section with active/past toggle pills

---

### DISCOVER Screen (`#discover`)

- **Trust Premium banner** with "EARN NOW" button
- **Earn portfolio** → "My earn portfolio: $0.00"
- **dApps section** with Featured/DEX/Lending/Yield tabs
  - Listed dApps: Four (FOUR.meme), Aster (perps), Aave (lending)
  - "View all ›" button
- **Latest section** → `#discover-latest-list` (currently empty)
- Search bar → `pushScreen('search-screen')`

---

## 🔀 Push Screens (Slide-in Navigation)

### 1. Token Detail (`#detail-screen`)

Opened via `openDetail(sym, price, chg, up)` from Trending/Search/Watchlist.

| Element | Details |
|---|---|
| Token logo | SVG generated by `logoAsset(sym, 64)` |
| Live price | From `liveMarketData[sym]` if available |
| 24h change | Green `+%` / Red `-%` |
| Price chart | Generated sparkline SVG |
| Timeframes | 1H / 24H (default) / 7D / 30D / 1Y / All |
| Holdings card | Balance: 0, Value: $0.00 |
| Market stats | Market Cap, 24h Volume |
| Detail tabs | Overview / Transactions / About |
| Bottom CTA bar | Send · Receive · Swap (primary) · Buy |

---

### 2. Send Flow

**Step 1 — Asset Select (`#send-asset-select-screen`)**
- Search input: `#send-asset-search-input`
- Network filter pills: All, BTC, ETH, SOL, BNB, TRX, ARB, BASE, + "112 ▾"
- Token list: `#send-asset-results` (20 tokens: BTC, ETH, USDT, USDC, SOL, BNB, TWT, TRX, XRP, AVAX, MATIC, LINK, AAVE, DOGE, ADA, DOT, ATOM, INJ, SUI, APT)
- Empty state: `#send-empty-state`
- Each row shows: Logo + parent network badge, name, symbol, network, live price

Clicking a token → `openSendScreen(sym, name, network)` → Send screen

**Step 2 — Send Screen (`#send-screen`)**
- Token display (pre-filled with selected token)
- `id="send-token-sym"` — Token symbol
- `id="send-token-net"` — Network name
- `id="send-token-price"` — Live price display (e.g. "1 ETH = $2,349")
- **Address field** with paste/QR button (`id="send-addr-input"`)
- **Amount field** with MAX button (`id="send-amount-input"`)
- Balance/price hint row
- "Review" button → `validateAndSend()` → Success screen if valid

**Step 3 — Send Success (`#send-success-screen`)**
- Checkmark animation, title, subtitle
- "View Transaction" button → `pushScreen('tx-history-screen')`
- "Done" button → home

---

### 3. Receive Screen (`#receive-screen`)

- Search input for filtering receive assets
- Network filter pills (same as send): `#receive-net-filters`
- Supported receive assets: BTC, ETH, SOL, BNB, TWT, USDT, USDC
- Each row: Logo, token name, network, truncated address
- Action buttons per row: QR Code icon | Copy icon (`copyAddress()`)
- Addresses are hardcoded in `WALLET_ADDRESSES` object:
  - BTC: `bc1q7x2...rpg34e`
  - ETH / BNB: `0x93d7E...087A15`
  - SOL: `7zwDZqJ...TCjtGS`

---

### 4. Buy Screen (`#buy-screen`)

- Large keypad for amount entry (default: `3705`)
- Currency selector: `#buy-cur-btn` → `openBottomSheet('currency-sheet')` — 12 currencies (INR, USD, EUR, GBP, JPY, AUD, CAD, CHF, AED, SGD, BRL, CNY)
- Crypto selector: `#buy-crypto-btn` → `openBottomSheet('crypto-sheet')` — USDT x3 networks, ETH, BTC, SOL, BNB
- Live crypto conversion: uses `getLivePrice(sym)` for real conversion rate
- "Pay with card" row (UI-only)
- Continue button

---

### 5. Swap / Trade Screen (`#trade-screen`)

- From: ETH (input amount — `#from-amount`)
- To: USDT (calculated via `calcSwap()` using live ETH price)
- Flip button to swap direction
- Live rate display: `#swap-rate-display`
- "Preview Swap" → Success screen (demo flow)

---

### 6. Search Screen (`#search-screen`)

- Search input with real-time filtering
- Network filter chips: All | ETH | SOL | BNB | BTC
- Results: `#search-results` — 20 tokens, shows live price + 24h change color
- Clicking result → `openDetail()` + `popScreen()`

---

### 7. Select Network Screen (`#select-network-screen`)

- Search input: `#network-search-input` → `filterNetworksList()`
- Popular networks (7): BTC, ETH, SOL, BNB, TRX, ARB, BASE
- A to Z networks (all others sorted alphabetically)
- 50+ networks total in `ALL_NETWORKS_DATA`
- Selecting a network: `selectNetworkOption(name)` → shows toast + closes screen

---

### 8. Transaction History (`#tx-history-screen`)

- Filter chips: All | Crypto | NFTs
- Transaction list: `#tx-list`
- Each row: Icon, type (Sent/Received/Swap), amount, date/time, status
- **This is the primary backend integration point** (see Backend section below)

---

### 9. Settings Screen (`#settings-screen`)

Sections:

| Section | Items |
|---|---|
| Trust Premium | Banner card with "BEGIN" button |
| Wallet | Manage Wallets, Address Book, Sync to Extension, Trust Handles, WalletConnect |
| Preferences | Dark Mode toggle, Preferences, Notifications toggle |
| Security | Security (with red dot alert), Security Scanner |
| Advanced | Networks, Manage Crypto |
| Support | Help Center, About (v14.2.0 2026) |
| Danger Zone | Delete Wallet (red), Reset Demo Data |

---

### 10. Wallet Switcher (`#wallet-switcher-screen`)

- Lists wallets: Main Wallet 1 (active checkmark), DeFi Vault
- "Add new wallet" button (dashed green circle +)
- Clicking a wallet → `selectWallet(idx)` → updates wallet name in header

---

### 11. Trade Menu Overlay

A bottom-sheet style overlay with trading options:
- Swap — Exchange between tokens
- Buy — Purchase crypto with fiat
- Sell — Sell crypto for fiat
- Receive — Show receive QR/address

---

## 💰 Wallet Balance & Portfolio

### Current State

The wallet is designed to show `$0.00` by default (empty wallet state):
- `#home-balance` is hidden via `style="display:none"` when balance is `$0.00`
- The "Fund Card" is shown in the Crypto tab when empty
- Each token row in Send shows `0 [SYM]` balance

### How to Update Wallet Balance (Backend Manual Update)

The wallet balance and token holdings must be updated by directly modifying the JavaScript state in `app.js`. The relevant data structures are:

```js
// In app.js — WALLETS array
const WALLETS = [
  {name:'Main Wallet 1', bal:'$12,450.00'},  // Update this value
];

// In populateSendAssetScreens() — SEND_TOKENS array
const SEND_TOKENS = [
  {sym:'ETH',  name:'Ethereum', network:'Ethereum', bal: 2.5},  // Set real bal
  {sym:'BTC',  name:'Bitcoin',  network:'Bitcoin',  bal: 0.05},
  // ... etc
];
```

To show the balance on the home screen, also:
1. Set `style="display:flex"` on `#home-bal-row` in `index.html`
2. Remove or hide the fund-section card

---

## 📜 Transaction History — Backend Integration

### Current Data Source

Transactions are hardcoded in `app.js`:

```js
const HISTORY_MOCK = [
  {type:'Received', sym:'USDT',       amt:'+1,250', time:'14m ago', status:'Confirmed', icon:'↙', color:'#00FFA3'},
  {type:'Swap',     sym:'ETH → USDT', amt:'0.5 ETH', time:'1h ago', status:'Confirmed', icon:'⇄', color:'#627EEA'},
  {type:'Sent',     sym:'USDC',       amt:'-120',   time:'2h ago',  status:'Pending',   icon:'↗', color:'#EA3943'},
];
```

### How to Add/Update Transactions Manually

**Method 1: Edit `HISTORY_MOCK` in `app.js`**

Add or modify entries in the array. Each entry shape:

```js
{
  type:   'Received' | 'Sent' | 'Swap' | 'Buy',   // Transaction type label
  sym:    'USDT',                                   // Token symbol (or "ETH → USDT" for swaps)
  amt:    '+1,250',                                 // Amount string (use + for received, - for sent)
  time:   '2h ago',                                 // Relative time display string
  status: 'Confirmed' | 'Pending' | 'Failed',       // Status label
  icon:   '↙' | '↗' | '⇄' | '💳',                // Icon character
  color:  '#00FFA3' | '#EA3943' | '#627EEA',        // Icon accent color
}
```

After editing, call `renderDashModules()` or reload the page.

**Method 2: Browser Console injection (live, no file edit needed)**

Open DevTools → Console and paste:

```js
// Prepend a new transaction
HISTORY_MOCK.unshift({
  type: 'Received',
  sym: 'ETH',
  amt: '+0.5',
  time: 'just now',
  status: 'Confirmed',
  icon: '↙',
  color: '#00FFA3'
});

// Re-render history section
renderDashModules();
```

**Method 3: Inject directly into the Transaction History screen**

```js
// Add a row to the full tx-history-screen list
document.getElementById('tx-list').insertAdjacentHTML('afterbegin', `
  <div class="tx-row">
    <div class="tx-icon" style="background:#001A0F;color:#00FFA3;">↙</div>
    <div class="tx-meta">
      <div class="title">Received USDT</div>
      <div class="sub">From: 0x93d7...ABC · BNB Smart Chain</div>
    </div>
    <div class="tx-amt">
      <div class="val green">+1,000 USDT</div>
      <div class="time">Apr 21 · 2:14 PM</div>
    </div>
  </div>
`);
```

### Transaction Status Colors

| Status | Color |
|---|---|
| Confirmed | `#00FFA3` (green) |
| Pending | `#EA3943` (red/orange) |
| Failed | `#EA3943` (red) |

### Transaction Icon Characters

| Type | Icon | Color |
|---|---|---|
| Received | `↙` | `#00FFA3` |
| Sent | `↗` | `#EA3943` |
| Swap | `⇄` | `#627EEA` |
| Buy | `💳` | `#8E8E93` |

---

## 🌐 Real-Time Market Data

### CoinGecko API Integration

**Endpoint:**
```
GET https://api.coingecko.com/api/v3/coins/markets
  ?vs_currency=usd
  &ids={comma-separated coin IDs}
  &order=market_cap_desc
  &per_page=50
  &page=1
  &sparkline=false
  &price_change_percentage=24h
```

**Polling:** Every 60 seconds via `startPolling(60000)` on `DOMContentLoaded`.

**Tracked Symbols (44):**
```
BTC, ETH, SOL, BNB, TRX, MATIC, ARB, LINK, AAVE, DEXE,
USDT, USDC, XRP, ADA, DOGE, LTC, AVAX, OP, BASE, TWT,
DOT, ATOM, FTM, NEAR, INJ, SUI, APT, TIA, SEI, OSMO,
ALGO, XLM, VET, HBAR, ICP, FIL, DASH, ZEC, ETC, BCH,
XAUt, KSM, JUNO, STARS
```

**Live Data Shape (stored in `liveMarketData` object):**
```js
liveMarketData[sym] = {
  price:     number,   // Current USD price
  change24h: number,   // 24h % change (e.g. -3.51)
  mcap:      number,   // Market cap in USD
  vol24h:    number,   // 24h trading volume in USD
  name:      string    // Full coin name from API
}
```

**Fallback:** If API fails, `FALLBACK_HOT_TOKENS` and `FALLBACK_TOP_TRADED` are used — no UI crash.

### UI Elements Updated on Each Poll

| Function | Updates |
|---|---|
| `updateTrendingListLive()` | Re-renders entire `#trending-list` with fresh prices |
| `updateTopTradedLive()` | Re-renders `#top-traded-scroll` cards |
| `updateWatchlistLive()` | Updates price + change on `[data-sym]` watchlist rows |
| `updateSendAssetsLive()` | Updates `live-price` text in send asset list |
| `updateSearchResultsLive()` | Updates `live-price` text in search results |

### Multi-Currency Support

12 fiat currencies supported in Buy screen and price formatting:

| Code | Currency | Rate vs USD (static) |
|---|---|---|
| INR | Indian Rupee | 83.50 |
| USD | US Dollar | 1.00 (default) |
| EUR | Euro | 0.92 |
| GBP | British Pound | 0.79 |
| JPY | Japanese Yen | 154.2 |
| AUD | Australian Dollar | 1.53 |
| CAD | Canadian Dollar | 1.37 |
| CHF | Swiss Franc | 0.90 |
| AED | UAE Dirham | 3.67 |
| SGD | Singapore Dollar | 1.34 |
| BRL | Brazilian Real | 5.05 |
| CNY | Chinese Yuan | 7.24 |

> Note: Currency rates are **static**. They are not fetched live. Update in the `CURRENCIES` array in `app.js` if needed.

---

## 🌍 Supported Networks

The app supports **50+ blockchain networks** defined in `ALL_NETWORKS_DATA`.

**Popular Networks (shown as filter pills):**

BTC, ETH, SOL, BNB, TRX, ARB, BASE

**All Networks:**

OP, MATIC, ZKSYNC, LTC, DOGE, XRP, ADA, DOT, AVAX, LINK, ATOM, ALGO, XLM, BCH, FIL, HBAR, ICP, VET, NEAR, FTM, THETA, XTZ, EOS, AAVE, MKR, KAVA, CELO, ONE, ZEC, ETC, RON, SEI, SUI, APT, INJ, OSMO, TIA, DASH, CRO, BERA, KSM, JUNO, STARS, MANTA, MANTLE, SCROLL, LINEA, BLAST

The "112 ▾" button opens `#select-network-screen` which lets the user filter and select any network. The number 112 is cosmetically accurate to the real Trust Wallet app.

---

## 🎨 Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Background Primary | `#000000` | Screen backgrounds |
| Background Secondary | `#0D0D0D` | Dark card backgrounds |
| Background Card | `#1A1A1A` | Card surfaces |
| Background Elevated | `#1C1C1E` | Input fields, pills |
| Accent Green | `#00FFA3` | Primary CTA, active states |
| Accent Red | `#EA3943` | Negative changes, errors |
| Text Primary | `#FFFFFF` | Main text |
| Text Secondary | `#8E8E93` | Subtitles, labels |
| Text Tertiary | `#636366` | Hints, placeholders |
| Border | `#1C1C1C` | Dividers |
| Ethereum Blue | `#627EEA` | ETH brand usage |

### Typography

- **Font:** Inter — 400, 500, 600, 700, 800, 900 from Google Fonts
- **Large balance:** 32px, weight 800
- **Screen headings:** 24–28px, weight 800
- **Section titles:** 20px, weight 800
- **Token names:** 16px, weight 700
- **Body / prices:** 15–16px, weight 600–700
- **Labels / captions:** 12–13px, weight 600

### Phone Shell Dimensions

```css
.phone {
  width: min(390px, 100%);
  height: 844px;
  border-radius: 44px;
  background: #000;
  border: 1px solid #222;
  box-shadow: 0 30px 80px rgba(0,0,0,0.8);
}
```

### Animations

| Animation | CSS Details |
|---|---|
| Push screen slide in/out | `transform: translateX(100% to 0)` · 280ms cubic-bezier(.4,0,.2,1) |
| Trade menu slide up | `transform: translateY(100% to 0)` · 280ms |
| Bottom sheet slide up | `transform: translateY(100% to 0)` · 280ms |
| Action button press | `transform: scale(0.92)` · 150ms |
| Buy cursor blink | `@keyframes blink` · 1s infinite |
| Toast notification | `@keyframes toastFade` · 2200ms |
| Trade FAB press | `transform: scale(0.93)` · 150ms |
| Tab panel switch | Instant (display: none / flex) |

---

## 🛠️ Key JavaScript Functions Reference

### Navigation Functions

| Function | Description |
|---|---|
| `show(id, btn, navId)` | Switch the active main tab screen |
| `pushScreen(id)` | Slide in a push screen |
| `popScreen()` | Pop the top-most push screen |
| `toggleTradeMenu(forceOpen)` | Open or close the trade FAB menu |
| `openBottomSheet(id)` | Open a specific bottom sheet |
| `closeBottomSheets()` | Close all bottom sheets |

### Market Data Functions

| Function | Description |
|---|---|
| `fetchMarketData()` | Fetch live prices from CoinGecko API |
| `startPolling(ms)` | Start the recurring 60-second market data fetch |
| `getLivePrice(sym)` | Get current USD price for a coin symbol |
| `formatPrice(usdPrice, cur)` | Format price in selected fiat currency |
| `formatUSD(val)` | Format large numbers ($1.2B, $5.3M) |
| `formatChg(pct)` | Format % change with sign (+3.21%) |
| `updateAllLiveUI()` | Trigger all live UI update functions |

### Render Functions

| Function | Description |
|---|---|
| `renderDashModules()` | Render predictions, perps, earn, history sections |
| `renderTrending(tokens)` | Returns HTML string for trending token list |
| `renderTopTraded(tokens)` | Returns HTML string for top-traded scroll cards |
| `renderReceiveFilters()` | Renders network filter pills for receive/send |
| `renderReceiveAssets()` | Renders receive asset list |
| `renderPopularNetworks()` | Renders select-network screen lists |
| `renderCurrencies()` | Renders currency selection list in buy sheet |
| `renderBuyCryptos()` | Renders crypto selection list in buy sheet |
| `renderSendAssetsList(tokens)` | Renders filtered send token list |
| `logoAsset(sym, size)` | Generate inline SVG logo for a coin symbol |
| `netBadgeSmall(sym, size)` | Small network badge overlay SVG |
| `spark(up, w, h, color)` | Generate SVG sparkline price chart |

### User Action Functions

| Function | Description |
|---|---|
| `setHomeTab(tabId, el)` | Switch Crypto / Watchlist / NFTs home tab |
| `setTrendingFilter(btn, filter)` | Switch Hot tokens / Top Gainers filter |
| `openDetail(sym, price, chg, up)` | Open token detail push screen |
| `openSendScreen(sym, name, net)` | Pre-fill and open the send screen |
| `validateAndSend()` | Validate send form → navigate to success or show toast |
| `calcSwap()` | Calculate swap output amount from ETH input |
| `keypadInput(key)` | Handle buy screen number keypad presses |
| `setBuyCurrency(code)` | Update selected fiat currency for buying |
| `setBuyCrypto(index)` | Update selected crypto for buying |
| `copyAddress(addr)` | Copy wallet address to clipboard |
| `showToast(msg, duration)` | Show notification toast in phone shell |
| `filterSendAssets()` | Filter send asset list by query + network |
| `filterSendByNet(net, el)` | Filter send assets by selected network pill |
| `doSearch(query)` | Filter search screen token results |
| `filterNetworksList()` | Filter select-network screen |
| `selectNetworkOption(name)` | Select a network, show toast, close screen |
| `selectWallet(idx)` | Switch active wallet |
| `haptic()` | Trigger device vibration (mobile browsers) |
| `pulseTap(el)` | Visual tap feedback (opacity pulse) |

---

## 💡 What Needs Backend Integration

The following features are UI-complete but data-static. They need manual data updates or a real backend to become fully realistic:

| Feature | Current State | What Needs to Change |
|---|---|---|
| **Wallet Balance** | Always `$0.00` | Update `WALLETS[0].bal` and show `#home-bal-row` |
| **Token Holdings** | All `0 [SYM]` | Set `bal` field in `SEND_TOKENS`, render balances |
| **Transaction History (Home)** | 3 hardcoded entries | Prepend to `HISTORY_MOCK`, call `renderDashModules()` |
| **Transaction History Screen** | Empty `#tx-list` | Inject `.tx-row` HTML elements per new transaction |
| **Watchlist live prices** | Static HTML (ETH $2378, etc.) | Add `data-sym` attribute; live API handles updates |
| **Receive Addresses** | Truncated dummy values | Update `WALLET_ADDRESSES` object with real addrs |
| **Fiat Currency Rates** | Static hardcoded rates | Fetch from an exchange rate API and update `CURRENCIES` |
| **Holdings in Token Detail** | Always `0` balance + `$0.00` | Update holdings card values when opening detail |
| **Earn portfolio value** | `$0.00` | Update Discover screen earn portfolio display |

### Recommended Manual Backend Update Steps

```
1. Open app.js in any editor
2. Find HISTORY_MOCK and prepend new transaction objects
3. Find WALLETS array and update bal to real balance string
4. Find WALLET_ADDRESSES and set real blockchain addresses
5. Find SEND_TOKENS in populateSendAssetScreens() and set bal fields
6. Save file and reload index.html in browser
7. For live updates during a session, use browser console injection
```

---

## 🔐 Wallet Addresses (Current Demo Values)

```js
const WALLET_ADDRESSES = {
  'BTC':     'bc1q7x2...rpg34e',
  'ETH':     '0x93d7E...087A15',
  'SOL':     '7zwDZqJ...TCjtGS',
  'BNB':     '0x93d7E...087A15',
  'default': '0x93d7E...087A15'
};
```

> The app does NOT sign real transactions — it is a high-fidelity UI demo. Replace addresses above with real ones for a convincing receive flow.

---

## 🚀 How to Run

```bash
# Option 1: Open directly in browser (simplest)
open "/Users/apple/Downloads/trust wallet/ui_preview/index.html"

# Option 2: Serve with Python (avoids CORS issues for API calls)
cd "/Users/apple/Downloads/trust wallet/ui_preview"
python3 -m http.server 8080
# Navigate to http://localhost:8080

# Option 3: Use VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

**Best viewing setup:** Chrome or Safari → DevTools → Device Toolbar → iPhone 14 Pro (390 × 844 px).

---

## ⚙️ Settings & Toggles (UI-Only)

| Setting | Current State | Notes |
|---|---|---|
| Dark Mode toggle | ON | Visual only — app is always dark |
| Notifications toggle | ON | Visual only |
| Security red dot | Visible | Cosmetic alert indicator |
| Trust Premium | Not activated | "BEGIN" button is UI-only |
| WalletConnect | No sessions | UI-only listing |
| Cloud Backup | Not configured | Menu entry only |
| Wallet count | 2 (Main + DeFi Vault) | Hardcoded in HTML |

---

## 📊 SVG Logo Asset Coverage

The `logoAsset(sym, size)` function covers 32+ tokens with authentic brand-colored SVG icons:

```
BTC, ETH, SOL, USDT, BNB, TRX, XRP, LINK, AAVE, DEXE,
ARB, BASE, OP, MATIC, AVAX, USDC, TWT, XAUt, U, JLP,
DOT, ATOM, DOGE, LTC, ADA, INJ, SUI, APT, NEAR, KSM,
JUNO, STARS
```

Unknown tokens fall back to a dark circle with the first 4 characters of the symbol in white text.

Network badge overlays are rendered via `netBadgeSmall(sym, size=14)` — a small circular logo positioned at the bottom-right of the parent token icon.

---

## 📝 Changelog Summary

| Version | Key Changes |
|---|---|
| v5 (current) | CoinGecko real-time API, 60s polling, 44 tracked tokens, multi-currency buy, full send validation flow |
| v4 | Token Detail screen, Swap with live rate, Search with network filter chips, sparkline charts |
| v3 | Send Asset Select screen, Select Network screen (112 networks), network filter pills |
| v2 | Buy keypad, currency bottom sheet, crypto bottom sheet, buy conversion logic |
| v1 | 5-tab layout, Trade FAB menu overlay, Settings screen, Wallet Switcher |

---

*This document represents the full state of the project as of April 21, 2026. Update the HISTORY_MOCK, WALLETS, and WALLET_ADDRESSES sections in app.js whenever backend data changes.*
