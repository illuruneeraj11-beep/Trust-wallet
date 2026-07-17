import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth-context";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const { authError, authLoading, clearAuthError, configured, signInWithPassword, signUpWithPassword } = useAuth();

  const submitDisabled = authLoading || !email.trim() || password.length < 6 || !configured;

  async function handleSignIn() {
    setNotice(null);
    await signInWithPassword(email.trim(), password);
  }

  async function handleSignUp() {
    setNotice(null);
    const hasSession = await signUpWithPassword(email.trim(), password);
    if (!hasSession) {
      setNotice("Check your inbox to confirm your email before signing in.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.container}>
          <View style={styles.brandMark}>
            <Text style={styles.brandText}>TW</Text>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Trust Wallet</Text>
            <Text style={styles.subtitle}>Sign in to sync your demo wallets, balances, transfers, and protected Supabase data.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={(value) => {
                  clearAuthError();
                  setNotice(null);
                  setEmail(value);
                }}
                placeholder="you@example.com"
                placeholderTextColor="#8a90a1"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                onChangeText={(value) => {
                  clearAuthError();
                  setNotice(null);
                  setPassword(value);
                }}
                placeholder="At least 6 characters"
                placeholderTextColor="#8a90a1"
                secureTextEntry
                style={styles.input}
                textContentType="password"
                value={password}
              />
            </View>

            {authError ? <Text style={styles.error}>{authError}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {!configured ? <Text style={styles.error}>Add your Supabase URL and publishable key to the Expo environment before signing in.</Text> : null}

            <Pressable disabled={submitDisabled} onPress={handleSignIn} style={[styles.primaryButton, submitDisabled && styles.disabled]}>
              {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sign in</Text>}
            </Pressable>

            <Pressable disabled={submitDisabled} onPress={handleSignUp} style={[styles.secondaryButton, submitDisabled && styles.disabled]}>
              <Text style={styles.secondaryText}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f7",
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
    gap: 24,
  },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0500e8",
  },
  brandText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  header: {
    gap: 8,
  },
  title: {
    color: "#111724",
    fontSize: 36,
    fontWeight: "900",
  },
  subtitle: {
    color: "#657084",
    fontSize: 16,
    lineHeight: 22,
  },
  form: {
    gap: 14,
  },
  field: {
    gap: 7,
  },
  label: {
    color: "#111724",
    fontSize: 14,
    fontWeight: "900",
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe3ed",
    color: "#111724",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  error: {
    color: "#d91524",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  notice: {
    color: "#287a52",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0500e8",
  },
  primaryText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d8d4ff",
  },
  secondaryText: {
    color: "#0500e8",
    fontSize: 17,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.52,
  },
});
