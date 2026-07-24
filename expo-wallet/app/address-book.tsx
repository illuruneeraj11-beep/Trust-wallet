import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppScreen, SearchInput, SheetModal } from "@/components/trust-ui";
import { DemoFlowHeader, DemoModeBanner, FlowButton, FlowLabel, FlowTextInput, shortDemoId } from "@/components/demo-wallet-flow-ui";
import { NetworkLogo } from "@/components/trust-assets";
import { TrustIcon } from "@/components/trust-icon";
import { useAppContext } from "@/context/app-context";
import { assetNetworkName, assetNetworkSlug, canonicalWalletNetwork, walletNetworkName, walletNetworksMatch } from "@/lib/wallet-networks";

type UiAsset = { id: string; symbol: string; network?: string; network_code?: string; network_slug?: string; network_name?: string };
type NetworkChoice = { slug: string; name: string };

export default function AddressBookScreen() {
  const params = useLocalSearchParams<{ mode?: string; asset?: string; network?: string; amount?: string; note?: string }>();
  const { addAddressBookEntry, addressBook, assets: contextAssets, removeAddressBookEntry, theme } = useAppContext();
  const selecting = params.mode === "select";
  const assets = contextAssets as unknown as UiAsset[];
  const networks = useMemo(() => uniqueNetworks(assets), [assets]);
  const requestedAsset = assets.find((asset) => asset.id === params.asset);
  const requestedNetwork = canonicalWalletNetwork(params.network || assetNetworkSlug(requestedAsset));
  const allowedNetworks = useMemo(() => selecting && requestedNetwork
    ? networks.filter((item) => item.slug === requestedNetwork)
    : networks, [networks, requestedNetwork, selecting]);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [network, setNetwork] = useState(requestedNetwork || allowedNetworks[0]?.slug || "");
  const [networkSheet, setNetworkSheet] = useState(false);
  const selectedNetwork = allowedNetworks.find((item) => item.slug === network) ?? allowedNetworks[0] ?? { slug: requestedNetwork || "demo", name: requestedNetwork ? walletNetworkName(requestedNetwork) : "Testnet" };
  const rows = useMemo(() => addressBook.filter((entry) => `${entry.name} ${entry.address} ${entry.network}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((entry) => !selecting || !requestedNetwork || walletNetworksMatch(entry.network, requestedNetwork)), [addressBook, query, requestedNetwork, selecting]);

  useEffect(() => {
    if (!network && allowedNetworks[0]) setNetwork(allowedNetworks[0].slug);
  }, [allowedNetworks, network]);

  function save() {
    if (!name.trim() || !recipient.trim()) return;
    addAddressBookEntry({ name: name.trim(), network: selectedNetwork.name, address: recipient.trim() });
    setName("");
    setRecipient("");
    setAddOpen(false);
  }

  function selectRecipient(value: string) {
    if (!selecting) return;
    router.replace({ pathname: "/send", params: { recipient: value, asset: params.asset ?? "", network: requestedNetwork, amount: params.amount ?? "", note: params.note ?? "" } });
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
          <Pressable accessibilityLabel={`Network, ${selectedNetwork.name}`} accessibilityRole="button" onPress={() => setNetworkSheet(true)} style={{ minHeight: 52, borderRadius: 15, backgroundColor: theme.cardSecondary, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <NetworkLogo network={selectedNetwork.slug} size={30} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "900" }}>{selectedNetwork.name}</Text>
            <TrustIcon color={theme.secondary} name="menu-down" size={18} />
          </Pressable>
        </View>
        <FlowButton disabled={!name.trim() || !recipient.trim()} label="Save recipient" onPress={save} />
      </SheetModal>

      <SheetModal onClose={() => setNetworkSheet(false)} title="Select network" visible={networkSheet}>
        {(allowedNetworks.length ? allowedNetworks : [{ slug: requestedNetwork || "demo", name: requestedNetwork ? walletNetworkName(requestedNetwork) : "Testnet" }]).map((item) => (
          <Pressable accessibilityLabel={item.name} accessibilityRole="radio" accessibilityState={{ checked: item.slug === network }} key={item.slug} onPress={() => { setNetwork(item.slug); setNetworkSheet(false); }} style={{ minHeight: 54, borderRadius: 15, backgroundColor: item.slug === network ? theme.blueSoft : theme.cardSecondary, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <NetworkLogo network={item.slug} size={30} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "900" }}>{item.name}</Text>
            {item.slug === network ? <TrustIcon color={theme.blue} name="check" size={19} /> : null}
          </Pressable>
        ))}
      </SheetModal>
    </>
  );
}

function uniqueNetworks(assets: UiAsset[]): NetworkChoice[] {
  const choices = new Map<string, NetworkChoice>();
  for (const asset of assets) {
    const slug = assetNetworkSlug(asset);
    if (slug && !choices.has(slug)) choices.set(slug, { slug, name: assetNetworkName(asset) });
  }
  return Array.from(choices.values());
}
