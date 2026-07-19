import * as SecureStore from "expo-secure-store";
import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

export type WalletRuntimeMode = "connected" | "visual-demo";

const configuredMode = process.env.EXPO_PUBLIC_WALLET_MODE?.trim().toLowerCase();

export const walletRuntimeMode: WalletRuntimeMode = configuredMode === "visual-demo" ? "visual-demo" : "connected";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const secureChunkSize = 1800;

// SecureStore keys only allow [A-Za-z0-9._-]; Supabase keys like
// "sb-<ref>-auth-token" are safe, but our chunk suffixes must use "." not ":".
function safeKey(key: string) {
  return key.replace(/[^A-Za-z0-9._-]/g, ".");
}

const secureSessionStorage = {
  async getItem(key: string) {
    const base = safeKey(key);
    const countValue = await SecureStore.getItemAsync(`${base}.chunks`);
    const count = Number(countValue);
    if (!Number.isInteger(count) || count < 1) return SecureStore.getItemAsync(base);
    const chunks = await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${base}.chunk.${index}`)));
    return chunks.every((chunk): chunk is string => typeof chunk === "string") ? chunks.join("") : null;
  },
  async setItem(key: string, value: string) {
    const base = safeKey(key);
    const oldCount = Number(await SecureStore.getItemAsync(`${base}.chunks`)) || 0;
    const chunks = Array.from({ length: Math.max(1, Math.ceil(value.length / secureChunkSize)) }, (_, index) => value.slice(index * secureChunkSize, (index + 1) * secureChunkSize));
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(`${base}.chunk.${index}`, chunk)));
    await SecureStore.setItemAsync(`${base}.chunks`, String(chunks.length));
    await SecureStore.deleteItemAsync(base);
    await Promise.all(Array.from({ length: Math.max(0, oldCount - chunks.length) }, (_, index) => SecureStore.deleteItemAsync(`${base}.chunk.${chunks.length + index}`)));
  },
  async removeItem(key: string) {
    const base = safeKey(key);
    const count = Number(await SecureStore.getItemAsync(`${base}.chunks`)) || 0;
    await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(`${base}.chunk.${index}`)));
    await Promise.all([SecureStore.deleteItemAsync(`${base}.chunks`), SecureStore.deleteItemAsync(base)]);
  },
};

function getConfigurationError() {
  if (configuredMode && configuredMode !== "connected" && configuredMode !== "visual-demo") {
    return "EXPO_PUBLIC_WALLET_MODE must be connected or visual-demo.";
  }
  if (walletRuntimeMode === "visual-demo") return null;
  if (!supabaseUrl || !supabasePublishableKey) {
    return "Connected mode requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";
  }
  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.endsWith(".supabase.co")) {
    return "EXPO_PUBLIC_SUPABASE_URL must be an HTTPS Supabase project URL.";
  }
  if (!supabasePublishableKey.startsWith("sb_publishable_")) {
    return "Use a modern sb_publishable_ Supabase key in the Expo client. Secret and service-role keys are forbidden.";
  }
  return null;
}

export const supabaseConfigurationError = getConfigurationError();
export const isSupabaseConfigured = walletRuntimeMode === "connected"
  && supabaseConfigurationError === null
  && Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        ...(Platform.OS !== "web" ? { storage: secureSessionStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

export function requireSupabase(): SupabaseClient {
  if (walletRuntimeMode === "visual-demo") {
    throw new Error("Supabase is unavailable while EXPO_PUBLIC_WALLET_MODE=visual-demo.");
  }
  if (!supabase) {
    throw new Error(supabaseConfigurationError ?? "Supabase is not configured for this build.");
  }
  return supabase;
}
