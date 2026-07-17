# Trust Wallet Expo Mock

This is the native Expo foundation for the Trust Wallet-style mock app.

Use this folder for the real Android/iOS app. The existing `ui_preview` folder remains a visual reference, not the production mobile runtime.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the intended Supabase project. `EXPO_PUBLIC_SUPABASE_ANON_KEY` is still supported for legacy projects.
3. Apply `../supabase/migrations/20260425030500_mock_wallet_ledger.sql` to that Supabase project.
4. Install and run:

```bash
npm install
npm run start
```

Start with Expo Go. Move to EAS/native builds only when native-only modules or store builds are needed.
