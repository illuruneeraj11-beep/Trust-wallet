import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppScreen, SheetModal, TokenAvatar } from "@/components/trust-ui";
import { useAppContext } from "@/context/app-context";

export default function SwapScreen() {
  const { theme } = useAppContext();
  const [amount, setAmount] = useState("0");
  const [fromToken, setFromToken] = useState("HYPE");
  const [toToken, setToToken] = useState("BOSS");
  const [tokenSide, setTokenSide] = useState<"from" | "to" | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);

  function pressKey(key: string) {
    setAmount((current) => {
      if (key === "⌫") return current.length > 1 ? current.slice(0, -1) : "0";
      if (key === "." && current.includes(".")) return current;
      if (current === "0" && key !== ".") return key;
      return `${current}${key}`;
    });
  }

  const canSwap = Number(amount) > 0;

  return (
    <>
      <AppScreen scrollable={false} padded={false}>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ height: 72, alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={() => router.back()} style={{ position: "absolute", left: 0 }}><Text style={{ fontSize: 36, color: theme.secondary }}>‹</Text></Pressable>
            <Text style={{ color: theme.text, fontSize: 23, fontWeight: "900" }}>Swap</Text>
            <View style={{ position: "absolute", right: 0, flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Pressable onPress={() => setSheet("Market order selected")} style={{ minHeight: 44, borderRadius: 22, backgroundColor: theme.surface, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Market⌄</Text>
              </Pressable>
              <Pressable onPress={() => setSheet("Swap settings")}><Text style={{ color: theme.secondary, fontSize: 28 }}>☷</Text></Pressable>
            </View>
          </View>

          <SwapPanel amount={amount} token={fromToken} symbol={fromToken} value="$0.00 ↻" onTokenPress={() => setTokenSide("from")} />
          <View style={{ alignItems: "center", marginVertical: -16, zIndex: 2 }}>
            <Pressable onPress={() => { setFromToken(toToken); setToToken(fromToken); }} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: theme.secondary, fontSize: 32 }}>↓</Text>
            </Pressable>
          </View>
          <SwapPanel amount={canSwap ? (Number(amount) * 0.98).toFixed(4) : "0"} token={toToken} symbol={toToken} value="$0.00" onTokenPress={() => setTokenSide("to")} />

          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 8 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>Min</Text>
            <Pressable onPress={() => setSheet("Amount set to 25%")} style={{ flex: 1, height: 16, borderRadius: 8, backgroundColor: theme.surface }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffffff", boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)", marginTop: -14 }} />
            </Pressable>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>Max</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-around", paddingBottom: 22 }}>
            {["25%", "50%", "75%"].map((mark) => <Pressable key={mark} onPress={() => setSheet(`Amount set to ${mark}`)}><Text style={{ color: theme.secondary, fontSize: 14 }}>{mark}</Text></Pressable>)}
          </View>
          <Keypad onKeyPress={pressKey} />
          <Pressable disabled={!canSwap} onPress={() => setSheet(`Swap ${amount} ${fromToken} to ${toToken}`)} style={{ height: 62, borderRadius: 31, backgroundColor: canSwap ? theme.blue : theme.blueSoft, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Text style={{ color: canSwap ? "#fff" : "#9b96b8", fontSize: 18, fontWeight: "900" }}>Tap to Swap</Text>
          </Pressable>
        </View>
      </AppScreen>

      <SheetModal visible={!!tokenSide} title="Select token" onClose={() => setTokenSide(null)}>
        <View style={{ gap: 10 }}>
          {["HYPE", "BOSS", "BTC", "ETH", "SOL", "USDT"].map((token) => (
            <Pressable key={token} onPress={() => { tokenSide === "from" ? setFromToken(token) : setToToken(token); setTokenSide(null); }} style={{ minHeight: 64, borderRadius: 18, backgroundColor: theme.cardSecondary, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <TokenAvatar symbol={token} size={42} />
              <Text style={{ flex: 1, color: theme.text, fontSize: 18, fontWeight: "900" }}>{token}</Text>
              <Text style={{ color: (tokenSide === "from" ? fromToken : toToken) === token ? theme.blue : theme.secondary, fontSize: 22 }}>{(tokenSide === "from" ? fromToken : toToken) === token ? "✓" : "›"}</Text>
            </Pressable>
          ))}
        </View>
      </SheetModal>

      <SheetModal visible={!!sheet} title={sheet ?? ""} subtitle="Swap control is connected." onClose={() => setSheet(null)}>
        <Pressable onPress={() => setSheet(null)} style={{ height: 56, borderRadius: 28, backgroundColor: theme.blue, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Done</Text>
        </Pressable>
      </SheetModal>
    </>
  );
}

function SwapPanel({ amount, token, symbol, value, onTokenPress }: { amount: string; token: string; symbol: string; value: string; onTokenPress: () => void }) {
  return (
    <View style={{ minHeight: 136, borderRadius: 18, backgroundColor: "#f0f0f3", padding: 18, flexDirection: "row", alignItems: "center" }}>
      <View style={{ flex: 1, gap: 26 }}>
        <Text style={{ color: "#202124", fontSize: 42, fontWeight: "900" }}>{amount}</Text>
        <Text style={{ color: "#202124", fontSize: 18 }}>{value}</Text>
      </View>
      <Pressable onPress={onTokenPress} style={{ minHeight: 62, borderRadius: 31, backgroundColor: "#ffffff", paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TokenAvatar symbol={symbol} size={42} />
        <Text style={{ color: "#202124", fontSize: 20, fontWeight: "900" }}>{token}</Text>
      </Pressable>
    </View>
  );
}

function Keypad({ onKeyPress }: { onKeyPress: (key: string) => void }) {
  return (
    <View style={{ gap: 20, paddingBottom: 18 }}>
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
