# Trust Wallet Testnet

An Expo/React Native wallet simulation with realistic demo funding, recipient resolution, QR addresses, transfers, receipts, balances, and private live updates. It never creates real keys, signs blockchain transactions, accepts real card data, or moves cryptocurrency.

## Run locally

```bash
npm install
Copy-Item .env.example .env
npm run web
```

The app defaults to connected mode. For isolated visual-only development, explicitly set:

```dotenv
EXPO_PUBLIC_WALLET_MODE=visual-demo
```

To use the authenticated shared demo ledger, keep connected mode and set the project values:

```dotenv
EXPO_PUBLIC_WALLET_MODE=connected
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Only the modern low-privilege `sb_publishable_` key belongs in the Expo app. Never put a Supabase secret or service-role key in an `EXPO_PUBLIC_` variable.

Connected mode requires an email/password session and fails closed if Supabase is missing or an RPC fails. It does not turn a failed remote transaction into a local success. Preferences are cached under the authenticated user ID, so two accounts on one device do not share wallet selection or settings.

For a standalone design preview, set `EXPO_PUBLIC_WALLET_MODE=visual-demo`. That mode uses isolated in-memory balances, bypasses Supabase entirely, does not sync across accounts or devices, and is visibly labeled in the UI.

## Ledger contract

The client reads and writes only through the 12 authenticated RPCs allowlisted for browser use:

- `bootstrap_demo_account`, `create_demo_wallet`, and `get_portfolio`
- `resolve_recipient`, `create_transfer_quote`, and `submit_transfer`
- `add_demo_funds`, `get_activity`, and `get_transaction`
- `rename_wallet`, `archive_wallet`, and `transfer_between_wallets`

All financial amounts cross the API as integer base-unit strings. UI decimal strings are validated and converted once without JavaScript floating-point arithmetic. The connected client listens for `INSERT` events on the RLS-protected `public.demo_wallet_notifications` table, filtered by `owner_id=eq.<auth-user-id>`. Notifications contain only safe invalidation fields and always cause an authoritative portfolio/activity refetch.

## Verification

```bash
npm run typecheck
npm run test:wallet
npm run test:markets
npx expo-doctor
npm run build
```

The connected end-to-end test also requires two confirmed Supabase Auth accounts and the ledger migration deployed to a non-production project. Do not test against production credentials or real payment data.

## Market data and deployment

The static Expo frontend calls same-origin Vercel Functions for market quotes, history, streaming, and Perps data. Without a key, the 20 verified core assets use CoinMarketCap's public endpoint and refresh every 60 seconds. Set `COINMARKETCAP_API_KEY` only in Vercel Preview and Production to enable provider history plus the faster 15-second/streaming cadence; never expose it through `EXPO_PUBLIC_`. Exa is a research/search API and is not used as the runtime price feed.

`vercel.json` builds `dist`, deploys the root `api` functions, excludes `/api/*` from the SPA rewrite, and adds `noindex, nofollow` headers.

## APK build

The Expo project has distinct Testnet identifiers for Android and iOS and an EAS `preview` profile that produces an installable APK:

```bash
npm run typecheck
npm run test:wallet
npm run test:markets
npx expo-doctor
eas build --platform android --profile preview
```

Use `eas build --platform android --profile production` only when an Android App Bundle is needed for a store. Native builds should set `EXPO_PUBLIC_MARKET_API_BASE_URL=https://expo-wallet.vercel.app` and the connected Supabase public variables in the EAS environment; server secrets remain on Vercel.
