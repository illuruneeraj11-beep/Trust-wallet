# Trust Wallet Video Flow Map

Visual source: `trustwalletworkflow.mp4` (2:02 portrait recording).

## Reference frame

- Captured app surface: approximately 405 × 900 logical pixels.
- Background: white (`#FFFFFF`).
- Primary text: near-black (`#202124`).
- Secondary text/icons: gray (`#6D6D72`).
- Primary action blue: `#0500FF`.
- Surface chips/cards: `#F3F3F6` to `#F7F7F9`.
- Typography: native Android/system sans, mostly 14–23 px, heavy headings.

## Recorded journey

| Approx. time | State | Primary interaction |
| --- | --- | --- |
| 00:00–00:12 | Home, top and product rails | Wallet selector, history, scanner, Receive, Binance deposit |
| 00:13–00:23 | History → Orders | Switch history tabs; filter by network |
| 00:24–00:34 | Receive and QR scanner | Pick a network/address, scan, copy |
| 00:35–00:45 | Select network | Search and choose a chain |
| 00:46–00:58 | Home, lower rails | Predictions, Earn, Watchlist |
| 00:59–01:13 | Markets | Category chips, sorting, token rows, swap action |
| 01:14–01:23 | Swap → Options | Enter amount, select token, Market/Limit order sheet |
| 01:24–01:40 | Discover and search | Browse dApps, category chips, open search keyboard |
| 01:41–01:50 | Home customization sheet | Toggle NFTs, Predictions, Perps, and Earn sections |
| 01:51–02:02 | Discover lower content → Home | Quick links, help links, return to wallet |

## Icon mapping

The implementation uses Material Community Icons for consistent stroke weight and real PNG assets for available token and dApp brands.

| UI role | Icon name or asset |
| --- | --- |
| Wallet selector | `wallet-outline` in orange circle |
| History | `history` |
| QR scanner | `line-scan` / `qrcode-scan` |
| Search | `magnify` |
| Notifications | `bell-outline` |
| Back | `arrow-left` |
| Forward disclosure | `chevron-right` |
| Receive address QR | `qrcode` |
| Copy address | `content-copy` |
| Share address | `share-variant-outline` |
| Portfolio filters | `tune-variant` |
| Home tab | `wallet-outline` / `wallet` |
| Markets tab | `chart-line-variant` |
| Center swap action | `swap-horizontal` |
| Perps tab | `infinity` |
| Discover tab | `compass-outline` / `compass` |
| Predictions | `chart-timeline-variant-shimmer` |
| Meme Rush | `rocket-launch-outline` |
| Watchlist | `star-outline` |
| Discover staking | `sprout-outline` |
| Rewards | `medal-outline` |
| Website/help | `web`, `headset`, `help-circle-outline` |
| BTC/ETH/SOL/BNB/HYPE and supported tokens | Source PNG assets under `expo-wallet/assets/tokens/` |
| Aave/PancakeSwap | Source PNG assets under `expo-wallet/assets/dapps/` |
