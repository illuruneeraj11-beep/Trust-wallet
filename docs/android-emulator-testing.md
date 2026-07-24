# Android Emulator Testing Process (for AI agents and humans)

Repeatable process to build the Trust Wallet Testnet APK, run it in an Android
emulator on Windows, drive it like a human, capture evidence, and debug crashes.
Written so Codex/Claude/any agent can follow it verbatim in a shell.

Paths below assume Windows + Git Bash (`bash`) with the shell already opened at
the repository root. PowerShell equivalents are noted where it matters.

---

## 0. One-time prerequisites

- **Java 17** must be installed (check: `java -version`). Temurin JDK 17 works.
- **Android SDK** (~3 GB total). Install without Android Studio:

```bash
SDK="$LOCALAPPDATA/Android/Sdk"
mkdir -p "$SDK"
curl -sL -o /tmp/cmdtools.zip https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
unzip -q /tmp/cmdtools.zip -d "$SDK/cmdline-tools-tmp"
mkdir -p "$SDK/cmdline-tools"
mv "$SDK/cmdline-tools-tmp/cmdline-tools" "$SDK/cmdline-tools/latest"
```

- **Accept licenses by writing hash files** (stdin piping to sdkmanager fails in
  non-interactive shells — this is the reliable way):

```bash
mkdir -p "$SDK/licenses"
printf '8933bad161af4178b1185d1a37fbf41ea5269c55\nd56f5187479451eabf01fb78af6dfcb131a6481e\n24333f8a63b6825ea9c5514f83c2829b004d1fee\n' > "$SDK/licenses/android-sdk-license"
printf '84831b9409646a918e30573bab4c9c91346d8abd\n' > "$SDK/licenses/android-sdk-preview-license"
```

- **Install packages** (~2 GB download, run in background, takes 5–15 min):

```bash
"$SDK/cmdline-tools/latest/bin/sdkmanager.bat" platform-tools emulator "platforms;android-35" "system-images;android-35;google_apis;x86_64"
```

- **Create the virtual phone** (Pixel 7, Android 15):

```bash
echo no | "$SDK/cmdline-tools/latest/bin/avdmanager.bat" create avd -n test_phone -k "system-images;android-35;google_apis;x86_64" -d pixel_7 --force
```

## 1. Boot the emulator

```bash
"$SDK/emulator/emulator.exe" -avd test_phone -no-snapshot -no-boot-anim -gpu swiftshader_indirect -no-audio &
```

**Pitfalls learned the hard way:**
- Do NOT pipe emulator output through anything that truncates (`Select-Object -First N`,
  `head`) — closing the pipe **kills the emulator**. Redirect to a file or `/dev/null`.
- Wait for full boot before doing anything:

```bash
ADB="$SDK/platform-tools/adb.exe"
"$ADB" wait-for-device
until "$ADB" shell getprop sys.boot_completed 2>/dev/null | grep -q 1; do sleep 5; done
```

- If installs fail with "Broken pipe", the emulator is wedged: `taskkill //IM qemu-system-x86_64.exe //F`,
  then cold boot with `-wipe-data`.

## 2. Get the APK

Built by EAS under Expo account `tommy7s-team`, project `trust-wallet-testnet`
(preview profile = installable APK). Set `EXPO_TOKEN` env var first (owner provides a robot token).

```bash
cd expo-wallet
npx eas-cli build --platform android --profile preview --non-interactive --wait   # ~15 min in Expo's cloud
npx eas-cli build:list --platform android --limit 1 --json --non-interactive      # get build id + status
npx eas-cli build:view <BUILD_ID> --json                                          # applicationArchiveUrl = APK download URL
curl -sL -o /tmp/app.apk "<applicationArchiveUrl>"
```

Build fails? `build:view` gives a `logFiles` URL — fetch it with `curl --compressed`
and grep for `ERROR|What went wrong`.

## 3. Install and launch

```bash
"$ADB" install -r /tmp/app.apk
"$ADB" logcat -c                                   # clear logs so crashes are fresh
"$ADB" shell monkey -p com.tommy7s.trustwallet.testnet -c android.intent.category.LAUNCHER 1
```

## 4. Drive the app like a human

Screen is 1080×2400. Core commands:

```bash
"$ADB" shell input tap X Y                  # tap at pixel coords
"$ADB" shell input text "hello"             # type into the FOCUSED field (no spaces; %s = space)
"$ADB" shell input keyevent 67              # backspace (repeat to delete)
"$ADB" shell input keyevent 123             # move cursor to end of field (do before deleting!)
"$ADB" shell input keyevent 111             # dismiss keyboard (ESC)
"$ADB" shell input keyevent 4               # Android back button
"$ADB" shell input swipe X1 Y1 X2 Y2 300    # scroll/swipe over 300ms
```

**Screenshot after every action** (this is your "eyes" — read the PNG to decide the next step):

```bash
"$ADB" exec-out screencap -p > step.png
```

⚠ In PowerShell `>` corrupts binary output — take screenshots from bash/cmd only,
or use `"$ADB" shell screencap /sdcard/s.png && "$ADB" pull /sdcard/s.png`.

**Field-clearing recipe** (input text appends, it does not replace):
tap the field → `keyevent 123` (jump to end) → `keyevent 67` × 60 → type new text →
screenshot to VERIFY the field contains exactly what you expect before submitting.

## 5. Read logs when something breaks

```bash
"$ADB" logcat -d -b crash | head -50                 # native crashes (SIGSEGV/SIGBUS + stack)
"$ADB" logcat -d ReactNativeJS:V '*:S' | tail -30    # JS console errors from the app
"$ADB" logcat -d -t 200 '*:E'                        # everything at error level
```

- Native crash? `adb root` then `adb shell cat /data/tombstones/tombstone_00`
  names the exact faulting file/library.
- App hangs silently? It's usually a promise that never settles — check
  ReactNativeJS for repeated errors (e.g. storage failures every 30 s).

## 6. Fix → rebuild → retest loop

1. Fix the code, run `npm run typecheck` and `npm run test:wallet` locally.
2. Commit + push, rebuild via step 2 (each EAS build ≈ 15 min).
3. `adb install -r` the new APK (upgrades in place; add `-d` if versionCode unchanged).
4. Repeat from step 3 until the full checklist passes.

## 7. Test accounts (Supabase email confirmation is ON)

- Use plus-aliases of a real inbox you can read: `you+test1@gmail.com`, `you+test2@gmail.com` —
  confirmation emails land in the real inbox; open the link to activate.
- Supabase's built-in mailer only sends **~2–4 emails per hour** — the app shows
  "email rate limit exceeded" after that. Don't waste sends on throwaway addresses.
- Project owner can instead confirm users in the Supabase dashboard
  (Auth → Users → … → Confirm email), or configure custom SMTP to remove the limit.

## 8. Acceptance checklist (what "tested like a human" means)

- [ ] Fresh install boots past splash to the sign-in screen (no Metro/dev machine)
- [ ] Create account → confirmation email flow → sign in works
- [ ] Wrong password / unconfirmed email show clear errors (no infinite spinner — ever)
- [ ] Create/rename/switch wallets; addresses display
- [ ] Fund testnet balances; only the selected wallet changes
- [ ] Send by address: sender debited amount+fee once, recipient credited once
- [ ] Double-tap send / offline submit cannot duplicate a transfer
- [ ] Markets, token detail, swap, discover, settings all render live data and don't dead-end
- [ ] Airplane mode → truthful offline states → reconnect recovers
- [ ] Sign out → session cleared; relaunch → session restored when signed in
- [ ] Screenshot every step; save logcat output for any anomaly

## OPEN issue — for the next agent (backend, not app)

**`add_demo_funds` (and likely `submit_transfer`) fail via the REST API with
`42501 permission denied for schema demo_ledger` — but only through PostgREST.**
Facts established (2026-07-20):
- Same call succeeds when run in SQL as `role authenticated` with jwt claims set.
- All ledger RPCs are `SECURITY DEFINER`, owner `postgres`, identical ACLs; live
  definition matches the local migration; all 9 migrations applied remotely.
- Other RPCs work fine via REST from the installed app: `bootstrap_demo_account`,
  `get_portfolio`, `get_activity`, `rename_wallet`, `create_demo_wallet`,
  `create_transfer_quote` (reaches its own validation).
- Only the two functions redefined by `20260719092636_wallet_ledger_fee_archive_hardening.sql`
  fail. Suspect something in that redefinition interacts badly with PostgREST's
  execution context (e.g. a nested call or notification insert path).
- Repro: sign in via password grant, `POST /rest/v1/rpc/add_demo_funds` with
  `{p_wallet_id, p_asset_code: "ETH_USDT", p_amount_units, p_idempotency_key}`.
- Effect in app: Fund flow ("Deposit cash" → Testnet Faucet) shows the error with
  a Retry button. Everything else in the app works.

## Known bugs already found & fixed by this process (regression watch)

| Symptom | Root cause | Fix (commit) |
|---|---|---|
| Stuck on splash forever (real device + emulator) | SIGBUS native crash loading `FontAwesome6_Regular.ttf` at runtime | Fonts embedded natively via expo-font plugin; splash no longer waits forever (`0f62970`) |
| Stuck on blue spinner after splash | SecureStore rejects `:` in keys → session storage threw → `getSession()` never settled | Keys sanitized to `.`; `finally` clears the spinner (`cfd345f`) |
| EAS build fails in AAPT | Two dApp icons were JPEGs renamed `.png` | Converted to real PNGs (`7257dc7`) |
| 499 MB build uploads | Videos + QA artifacts not excluded | Root `.easignore` (anchor root-only entries with leading `/` — a bare `assets/` pattern also kills `expo-wallet/assets/`!) |
