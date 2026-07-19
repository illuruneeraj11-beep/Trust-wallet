# Trust Wallet-Style Mobile App

An educational cryptocurrency wallet project focused on reproducing the polished mobile experience and interaction patterns of Trust Wallet. The repository contains a native Expo app, a browser-based visual reference, and an earlier Flutter prototype.

> This is an independent demo project. It is not affiliated with or endorsed by Trust Wallet. Do not use it to hold real funds or collect real recovery phrases.

## Primary app

The active upgrade target is [`expo-wallet/`](./expo-wallet/), built with Expo, React Native, TypeScript, Expo Router, and Supabase.

```bash
cd expo-wallet
npm install
npm run start
```

Before using Supabase, copy `expo-wallet/.env.example` to `expo-wallet/.env` and fill in the public project URL and publishable key. See [`expo-wallet/README.md`](./expo-wallet/README.md) for the complete setup.

## Repository map

| Path | Purpose | Status |
| --- | --- | --- |
| `expo-wallet/` | Android, iOS, and web app | Primary implementation |
| `ui_preview/` | Detailed browser mock and visual reference | Design/reference only |
| `supabase/` | Database migrations | Shared backend setup |
| `docs/` | Architecture and build notes | Project documentation |
| `lib/`, `pubspec.yaml` | Original Flutter prototype | Legacy reference |
| `assets/` | Assets used by the Flutter prototype | Legacy reference |

## Expo verification

```bash
cd expo-wallet
npm ci
npm run typecheck
npx expo-doctor
```

## Product direction

The Expo app should be treated as the single production-facing mobile implementation. The web and Flutter versions remain useful references while screens and behavior are brought into parity. New mobile features should normally be added under `expo-wallet/app/`, reusable UI under `expo-wallet/src/components/`, shared state under `expo-wallet/src/context/`, and integrations under `expo-wallet/src/services/` or `expo-wallet/src/lib/`.

## Safety

This project currently includes mock/demo wallet behavior. Any future real-wallet implementation requires a dedicated security review, secure key storage, audited transaction signing, strict secret handling, and clear protection against recovery-phrase collection.
