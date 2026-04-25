import { useState } from "react";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SearchInput, SettingRow } from "@/components/trust-ui";

export default function AddressBookScreen() {
  const { addAddressBookEntry, addressBook, removeAddressBookEntry } = useAppContext();
  const [draft, setDraft] = useState("");

  return (
    <AppScreen title="Address Book" subtitle="Save wallet addresses for fast and accurate sending">
      <Card muted>
        <SearchInput value={draft} onChangeText={setDraft} placeholder="Contact name or address" />
        <SettingRow icon="＋" title="Add current draft" subtitle="Adds a quick Ethereum contact using the draft text" value="Save" onPress={() => {
          if (!draft.trim()) return;
          addAddressBookEntry({ name: draft.trim(), network: "Ethereum", address: `0x${draft.trim().replace(/\s+/g, "").slice(0, 8)}...saved` });
          setDraft("");
        }} />
      </Card>

      <Card>
        {addressBook.map((entry) => (
          <SettingRow key={entry.id} icon="⌘" title={entry.name} subtitle={`${entry.network} · ${entry.address}`} value="Delete" onPress={() => removeAddressBookEntry(entry.id)} />
        ))}
      </Card>
    </AppScreen>
  );
}
