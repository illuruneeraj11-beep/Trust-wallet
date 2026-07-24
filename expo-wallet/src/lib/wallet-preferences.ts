import type { AddressBookEntry } from "@/data/trust-wallet";

const legacyPlaceholderContactIds = new Set(["addr-1", "addr-2", "addr-3"]);

function isAddressBookEntry(value: unknown): value is AddressBookEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<AddressBookEntry>;
  return typeof entry.id === "string"
    && typeof entry.name === "string"
    && typeof entry.network === "string"
    && typeof entry.address === "string";
}

function isLegacyPlaceholderContact(entry: AddressBookEntry) {
  return legacyPlaceholderContactIds.has(entry.id) && entry.address.includes("...");
}

export function sanitizeStoredWalletPreferences(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = { ...(value as Record<string, unknown>) };
  delete source.trustedHandle;
  source.addressBook = Array.isArray(source.addressBook)
    ? source.addressBook.filter(isAddressBookEntry).filter((entry) => !isLegacyPlaceholderContact(entry))
    : [];
  return source;
}
