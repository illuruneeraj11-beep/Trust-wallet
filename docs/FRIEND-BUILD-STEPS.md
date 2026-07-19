# Build the Trust Wallet Testnet APK — Simple Steps

Everything is already coded, tested, and pushed to GitHub. You only need to
pull the latest code, log in to Expo, add 4 settings, and run one build command.
Copy-paste each block into your terminal, one at a time, and wait for it to finish.

---

## Step 1 — Get the latest code

```
cd path\to\Trust-wallet
git pull origin main
```

(Replace `path\to\Trust-wallet` with wherever the project folder is on your computer.
If you don't have the folder yet: `git clone https://github.com/illuruneeraj11-beep/Trust-wallet.git`)

## Step 2 — Go into the app folder and install packages

```
cd expo-wallet
npm ci
```

## Step 3 — Log in to Expo (YOUR account — the one that owns the project)

```
npx eas-cli logout
npx eas-cli login
```

Enter your Expo username and password (the account you used before, when you
built the APK the first time).

Then check it worked:

```
npx eas-cli whoami
npx eas-cli project:info
```

`project:info` must print project details WITHOUT an error.
If it says "Entity not authorized" you are on the wrong Expo account — log in with the other one.

## Step 4 — Add the 4 app settings (copy-paste exactly, one line at a time)

```
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_WALLET_MODE --value connected --visibility plaintext
```

```
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://bgwsoyfsyoecsuemckel.supabase.co --visibility plaintext
```

```
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_HX8YGOPXCZEh-hlTfrC10Q_IoPahOxz --visibility sensitive
```

```
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_MARKET_API_BASE_URL --value https://expo-wallet.vercel.app --visibility plaintext
```

Check they are all there:

```
npx eas-cli env:list --environment preview
```

You should see all 4 names listed.
(If a command says the variable already exists, that's fine — skip it.)

## Step 5 — Build the APK

```
npx eas-cli build --platform android --profile preview
```

- If it asks "Generate a new Android Keystore?" → answer **Yes**.
- The build runs in Expo's cloud and takes about 10–20 minutes.
- At the end it prints a link like `https://expo.dev/accounts/.../builds/...`

## Step 6 — Get the APK

Open that build link on an Android phone, tap **Install**, allow
"install from unknown sources" if the phone asks. That same link is what you
share with testers — send the link, don't email the file.

---

### Notes
- This is a testnet/mock app — no real money, no real crypto, ever.
- Don't share the link publicly; only with people testing it.
- If anything errors, copy the full error message and send it back to us.
