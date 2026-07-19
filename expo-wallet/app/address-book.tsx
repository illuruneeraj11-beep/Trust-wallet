import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { DemoFlowHeader, DemoModeBanner, FlowButton, FlowLabel, FlowTextInput, shortDemoId } from "@/components/demo-wallet-flow-ui";
import { NetworkLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";

type UiAsset = { network?: string; network_code?: string };

export default function AddressBookScreen() {
  const params = useLocalSearchParams<{ mode?: string; asset?: string; amount?: string; note?: string }>();
  const { addAddressBookEntry, addressBook, assets: contextAssets, removeAddressBookEntry, theme } = useAppContext();
  const selecting = params.mode === "select";
  const networks = useMemo(() => Array.from(new Set((contextAssets as unknown as UiAsset[]).map((asset) => asset.network_code ?? asset.network).filter((value): value is string => Boolean(value)))), [contextAssets]);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [network, setNetwork] = useState(networks[0] ?? "Testnet");
  const [networkSheet, setNetworkSheet] = useState(false);
  const rows = useMemo(() => addressBook.filter((entry) => `${entry.name} ${entry.address} ${entry.network}`.toLowerCase().includes(query.trim().toLowerCase())), [addressBook, query]);

  function save() {
    if (!name.trim() || !recipient.trim()) return;
    addAddressBookEntry({ name: name.trim(), network, address: recipient.trim() });
    setName("");
    setRecipient("");
    setAddOpen(false);
  }

  function selectRecipient(value: string) {
    if (!selecting) return;
    router.replace({ pathname: "/send", params: { recipient: value, asset: params.asset ?? "", amount: params.amount ?? "", note: params.note ?? "" } });
  }

  return (
    <>
      <AppScreen padded={false}>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <DemoFlowHeader
            title={selecting ? "Choose recipient" : "Address Book"}
            subtitle={selecting ? "Return to Send" : "Saved recipients"}
            right={<Pressable accessibilityLabel="Add contact" onPress={() => setAddOpen(true)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.text} name="account-plus-outline" size={21} /></Pressable>}
          />
          {selecting ? <DemoModeBanner compact /> : null}
          <SearchInput onChangeText={setQuery} placeholder="Search contacts, handles or addresses" value={query} />
          <View style={{ gap: 7 }}>
            {rows.map((entry) => (
              <Pressable disabled={selecting && entry.address.includes("...")} key={entry.id} onPress={() => selectRecipient(entry.address)} style={{ minHeight: 72, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 11, opacity: selecting && entry.address.includes("...") ? 0.58 : 1 }}>
                <NetworkLogo network={entry.network} size={39} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>{entry.name}</Text>
                  <Text numberOfLines={1} style={{ color: theme.secondary, fontSize: 10 }}>{entry.network} · {entry.address.startsWith("@") ? entry.address : shortDemoId(entry.address, 12, 8)}</Text>
                </View>
                {selecting ? entry.address.includes("...") ? <Text style={{ color: theme.secondary, fontSize: 9, fontWeight: "800" }}>Needs full address</Text> : <TrustIcon color={theme.blue} name="arrow-right" size={20} /> : (
                  <Pressable accessibilityLabel={`Delete ${entry.name}`} onPress={() => removeAddressBookEntry(entry.id)} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}><TrustIcon color={theme.negative} name="delete-outline" size={20} /></Pressable>
                )}
              </Pressable>
            ))}
          </View>
          {!rows.length ? (
            <View style={{ minHeight: 360, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 24 }}>
              <TrustIcon color={theme.secondary} name="account-search-outline" size={44} />
              <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{query ? "No matching contacts" : "No saved recipients"}</Text>
              <Text style={{ color: theme.secondary, fontSize: 12, lineHeight: 18, textAlign: "center" }}>{query ? "Try another name, handle, or address." : "Save a registered @handle or wallet address for faster transfers."}</Text>
              {!query ? <FlowButton label="Add recipient" onPress={() => setAddOpen(true)} secondary /> : null}
            </View>
          ) : null}
        </View>
      </AppScreen>

      <SheetModal onClose={() => setAddOpen(false)} subtitle="Saved securely on this device." title="Add recipient" visible={addOpen}>
        <View style={{ gap: 7 }}><FlowLabel>Name</FlowLabel><FlowTextInput autoCapitalize="words" onChangeText={setName} placeholder="Contact name" value={name} /></View>
        <View style={{ gap: 7 }}><FlowLabel>Handle or wallet address</FlowLabel><FlowTextInput onChangeText={setRecipient} placeholder="@handle or wallet address" value={recipient} /></View>
        <View style={{ gap: 7 }}>
          <FlowLabel>Network</FlowLabel>
          <Pressable onPress={() => setNetworkSheet(true)} style={{ minHeight: 52, borderRadius: 15, backgroundColor: theme.cardSecondary, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <NetworkLogo network={network} size={30} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "900" }}>{network}</Text>
            <TrustIcon color={theme.secondary} name="menu-down" size={18} />
          </Pressable>
        </View>
        <FlowButton disabled={!name.trim() || !recipient.trim()} label="Save recipient" onPress={save} />
      </SheetModal>

      <SheetModal onClose={() => setNetworkSheet(false)} title="Select network" visible={networkSheet}>
        {(networks.length ? networks : ["Testnet"]).map((item) => (
          <Pressable key={item} onPress={() => { setNetwork(item); setNetworkSheet(false); }} style={{ minHeight: 54, borderRadius: 15, backgroundColor: item === network ? theme.blueSoft : theme.cardSecondary, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <NetworkLogo network={item} size={30} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "900" }}>{item}</Text>
            {item === network ? <TrustIcon color={theme.blue} name="check" size={19} /> : null}
          </Pressable>
        ))}
      </SheetModal>
    </>
  );
}
