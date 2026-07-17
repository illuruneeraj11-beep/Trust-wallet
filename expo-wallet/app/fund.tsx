import { router } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppScreen, SheetModal, TokenAvatar } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

const fiatRows = [
  { code: "INR", label: "Indian Rupee", flag: "🇮🇳" },
  { code: "USD", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", label: "British Pound", flag: "🇬🇧" },
];

export default function FundScreen() {
  const { theme } = useAppContext();
  const [amount, setAmount] = useState("0");
  const [currencySheet, setCurrencySheet] = useState(false);
  const [cryptoSheet, setCryptoSheet] = useState(false);
  const [paymentSheet, setPaymentSheet] = useState(false);
  const [selectedFiat, setSelectedFiat] = useState(fiatRows[0]);
  const [selectedCrypto, setSelectedCrypto] = useState({ symbol: "USDT", label: "Tether USD" });
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  function pressKey(key: string) {
    setAmount((current) => {
      if (key === "⌫") return current.length > 1 ? current.slice(0, -1) : "0";
      if (key === "." && current.includes(".")) return current;
      if (current === "0" && key !== ".") return key;
      return `${current}${key}`;
    });
  }

  const canContinue = Number(amount) > 0;

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ height: 72, alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0 }}><Text style={{ color: theme.text, fontSize: 36 }}>‹</Text></Pressable>
            <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Buy</Text>
            <Text style={{ position: "absolute", right: 0, color: theme.text, fontSize: 28, fontWeight: "900" }}>...</Text>
          </View>

          <View style={{ height: 380, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28 }}>
              <View style={{ alignItems: "flex-end", minWidth: 210 }}>
                <Text style={{ color: theme.text, fontSize: 68, fontWeight: "900" }}>{amount}</Text>
                <Text style={{ color: theme.secondary, fontSize: 34, fontWeight: "800" }}>_</Text>
              </View>
              <View style={{ gap: 20 }}>
                <Selector label={selectedFiat.code} icon={selectedFiat.flag} onPress={() => setCurrencySheet(true)} />
                <Selector label={selectedCrypto.symbol} icon={<TokenAvatar symbol={selectedCrypto.symbol} size={30} />} onPress={() => setCryptoSheet(true)} />
              </View>
            </View>
          </View>

          <Pressable onPress={() => setPaymentSheet(true)} style={{ minHeight: 86, borderRadius: 18, backgroundColor: theme.surface, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ color: "#333", fontSize: 15, fontWeight: "900" }}>{paymentMethod}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.secondary, fontSize: 15 }}>Pay with</Text>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{paymentMethod}</Text>
            </View>
            <Text style={{ color: theme.secondary, fontSize: 34 }}>›</Text>
          </Pressable>

          <Keypad onKeyPress={pressKey} />
          <Pressable disabled={!canContinue} onPress={() => setPaymentSheet(true)} style={{ height: 62, borderRadius: 31, backgroundColor: canContinue ? theme.blue : theme.blueSoft, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Text style={{ color: canContinue ? "#fff" : "#9691af", fontSize: 18, fontWeight: "900" }}>Continue</Text>
          </Pressable>
        </View>
      </AppScreen>

      <SheetModal visible={currencySheet} title="Select currency" onClose={() => setCurrencySheet(false)}>
        <View style={{ backgroundColor: theme.cardSecondary, borderRadius: 18, overflow: "hidden" }}>
          {fiatRows.map((row) => (
            <Pressable key={row.code} onPress={() => { setSelectedFiat(row); setCurrencySheet(false); }} style={{ minHeight: 82, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Text style={{ fontSize: 38 }}>{row.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{row.code}</Text>
                <Text style={{ color: theme.secondary, fontSize: 17 }}>{row.label}</Text>
              </View>
              <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: row.code === selectedFiat.code ? theme.blue : theme.secondary }} />
            </Pressable>
          ))}
        </View>
      </SheetModal>

      <SheetModal visible={cryptoSheet} title="Select crypto" onClose={() => setCryptoSheet(false)}>
        <View style={{ backgroundColor: theme.cardSecondary, borderRadius: 18, overflow: "hidden" }}>
          {[
            { symbol: "USDT", label: "Tether USD" },
            { symbol: "BTC", label: "Bitcoin" },
            { symbol: "ETH", label: "Ethereum" },
            { symbol: "SOL", label: "Solana" },
          ].map((row) => (
            <Pressable key={`${row.symbol}-${row.label}`} onPress={() => { setSelectedCrypto(row); setCryptoSheet(false); }} style={{ minHeight: 82, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
              <TokenAvatar symbol={row.symbol} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{row.symbol}</Text>
                <Text style={{ color: theme.secondary, fontSize: 17 }}>{row.label}</Text>
              </View>
              <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: row.symbol === selectedCrypto.symbol ? theme.blue : theme.secondary }} />
            </Pressable>
          ))}
        </View>
      </SheetModal>

      <SheetModal visible={paymentSheet} title="Payment method" subtitle={canContinue ? `Ready to buy ${selectedCrypto.symbol} with ${selectedFiat.code} ${amount}` : "Select an amount to continue"} onClose={() => setPaymentSheet(false)}>
        {["UPI", "Card", "Bank"].map((method) => (
          <Pressable key={method} onPress={() => { setPaymentMethod(method); setPaymentSheet(false); }} style={{ minHeight: 62, borderRadius: 18, backgroundColor: theme.cardSecondary, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{method}</Text>
            <Text style={{ color: method === paymentMethod ? theme.blue : theme.secondary, fontSize: 22 }}>{method === paymentMethod ? "✓" : "›"}</Text>
          </Pressable>
        ))}
      </SheetModal>
    </>
  );
}

function Selector({ label, icon, onPress }: { label: string; icon: string | ReactNode; onPress: () => void }) {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 56, minWidth: 150, borderRadius: 28, backgroundColor: theme.surface, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
      {typeof icon === "string" ? <Text style={{ fontSize: 20 }}>{icon}</Text> : icon}
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{label}</Text>
      <Text style={{ color: theme.secondary, fontSize: 26 }}>›</Text>
    </Pressable>
  );
}

function Keypad({ onKeyPress }: { onKeyPress: (key: string) => void }) {
  return (
    <View style={{ gap: 20, paddingVertical: 26 }}>
      {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], [".", "0", "⌫"]].map((row) => (
        <View key={row.join("")} style={{ flexDirection: "row", justifyContent: "space-around" }}>
          {row.map((key) => (
            <Pressable key={key} onPress={() => onKeyPress(key)} style={{ width: 80, minHeight: 42, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ textAlign: "center", color: "#202124", fontSize: 28, fontWeight: "900" }}>{key}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
