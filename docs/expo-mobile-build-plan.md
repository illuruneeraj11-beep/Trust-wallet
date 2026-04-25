# Expo Mobile Build Plan

## Decision

Build the Android/iOS app directly in Expo/React Native.

The existing `ui_preview` HTML app should stay as a visual reference for matching the video frame-by-frame. It should not be the production mobile runtime. The existing Flutter app can also stay untouched while the Expo app is built in `expo-wallet/`.

## Why Expo Directly

- Native app layout, safe areas, tabs, modals, keyboard handling, and gestures are cleaner when built in React Native from the start.
- Expo Go gives fast iteration while matching mobile dimensions.
- The Supabase JavaScript client works directly in Expo.
- The mock wallet ledger can use real database transactions while still being fake money.
- Later Android/iOS store builds can use EAS without rewriting the app.

## Data Model

Migration:

`supabase/migrations/20260425030500_mock_wallet_ledger.sql`

Core tables:

- `mock_wallet_assets`: supported demo assets such as USD, TWT, BNB, ETH, SOL.
- `mock_wallets`: user-owned mock wallet accounts.
- `mock_wallet_balances`: per-wallet per-asset balances.
- `mock_wallet_funding_events`: dummy-card top-up records.
- `mock_wallet_transfers`: wallet-to-wallet transfer history.

RPC functions:

- `create_mock_wallet(name)`
- `fund_mock_wallet(wallet_id, asset_symbol, amount, dummy_card_last4, dummy_card_brand)`
- `transfer_between_mock_wallets(from_wallet_id, to_wallet_id, asset_symbol, amount, note)`

Transfers are atomic: the source balance is checked and deducted in the same database function that credits the destination wallet.

## Expo App

Folder:

`expo-wallet/`

Current screens:

- `app/(tabs)/index.tsx`: Home, total balance, wallet list.
- `app/wallets.tsx`: Create unlimited wallets.
- `app/fund.tsx`: Add mock balance with dummy card last four.
- `app/send.tsx`: Transfer between wallets.
- `app/(tabs)/trending.tsx`, `rewards.tsx`, `discover.tsx`, `trade.tsx`: placeholders for visual migration.

## Next Work

1. Point Supabase MCP or CLI at the intended `bgw...` project and apply the migration.
2. Copy `.env.example` to `.env` inside `expo-wallet/` and set the Supabase URL/anon key.
3. Install Expo dependencies and start in Expo Go.
4. Migrate the exact Trust Wallet UI from `ui_preview` into native screens one screen at a time.
5. Replace placeholder icons with packaged image assets extracted from the supplied screenshots/video.
6. Add automated checks for balance changes after funding and transfer.
