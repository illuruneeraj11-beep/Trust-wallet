import { View } from "react-native";
import { useState } from "react";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, Pill, SearchInput, SectionHeader, SettingRow } from "@/components/trust-ui";

export default function SwapScreen() {
  const { currency, selectedWallet } = useAppContext();
  const [fromAmount, setFromAmount] = useState("0.5");
  const [fromToken, setFromToken] = useState("BNB");
  const [toToken, setToToken] = useState("TWT");

  return (
    <AppScreen title="Swap" subtitle="Exchange any crypto instantly on the same chain">
      <Card muted>
        <SectionHeader title="From" />
        <SearchInput value={fromAmount} onChangeText={setFromAmount} placeholder="0.00" />
        <SettingRow icon="◌" title={fromToken} subtitle={selectedWallet?.name || "Main Wallet 1"} value={`${currency.code} 312.55`} onPress={() => setFromToken(fromToken === "BNB" ? "ETH" : "BNB")} />
      </Card>

      <Card>
        <SectionHeader title="To" />
        <SettingRow icon="◍" title={toToken} subtitle="Choose the token to receive" value="Select" onPress={() => setToToken(toToken === "TWT" ? "USDT" : "TWT")} />
        <SettingRow icon="↕" title="Estimated rate" subtitle="1 BNB ≈ 1,224.23 TWT" value="Market" />
      </Card>

      <Card muted>
        <SectionHeader title="Trade settings" />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pill label="0.5%" active />
          <Pill label="1.0%" />
          <Pill label="MAX" onPress={() => setFromAmount("2.00")} />
        </View>
        <SettingRow icon="⚙" title="Slippage" subtitle="Adjust swap execution tolerance" value="0.5%" />
        <SettingRow icon="⛽" title="Routing" subtitle="Aggregator chooses the best route" value="Auto" />
      </Card>
    </AppScreen>
  );
}
