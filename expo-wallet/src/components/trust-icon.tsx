import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type BrandGlyphName = ComponentProps<typeof FontAwesome6>["name"];
type MaterialGlyphName = ComponentProps<typeof MaterialIcons>["name"];

export const semanticIconMap = {
  "nav-home": "wallet",
  "nav-markets": "trending-up",
  "nav-perps": "infinity",
  "nav-discover": "compass-outline",
  "nav-search": "magnify",
  back: "arrow-left",
  "back-compact": "chevron-left",
  close: "close",
  history: "history",
  scanner: "scan-helper",
  receive: "qrcode",
  copy: "content-copy",
  swap: "swap-horizontal",
  filter: "tune",
  favorite: "star",
  "favorite-filled": "star",
  settings: "cog",
  "dark-mode": "moon-waning-crescent",
  "address-book": "notebook-outline",
  "sync-extension": "qrcode",
  "trust-handle": "at",
  "scan-qr": "scan-helper",
  "wallet-connect": "power-plug-outline",
  preferences: "cog-outline",
  security: "lock-outline",
  notifications: "bell-outline",
  "sign-out": "logout-variant",
  support: "headset",
  about: "shield-check-outline",
  "wallet-menu": "dots-vertical",
  selected: "check",
  next: "chevron-right",
  "add-wallet": "wallet-plus-outline",
  "import-wallet": "tray-arrow-down",
  unavailable: "image-off-outline",
} as const satisfies Record<string, MaterialIconName>;

export type SemanticTrustIconName = keyof typeof semanticIconMap;
export type TrustIconName = MaterialIconName | MaterialGlyphName | SemanticTrustIconName;

type TrustIconProps = {
  name: TrustIconName;
  size?: number;
  color?: string;
};

export function TrustIcon({ name, size = 24, color = "#202124" }: TrustIconProps) {
  const resolvedName = name in semanticIconMap
    ? semanticIconMap[name as SemanticTrustIconName]
    : name as MaterialIconName;

  if (name === "candlestick-chart") {
    return <MaterialIcons color={color} name="candlestick-chart" size={size} />;
  }

  return <MaterialCommunityIcons color={color} name={resolvedName} size={size} />;
}

const brandIconMap = {
  x: "x-twitter",
  telegram: "telegram",
  facebook: "facebook-f",
  reddit: "reddit-alien",
  youtube: "youtube",
  instagram: "instagram",
  tiktok: "tiktok",
  visa: "cc-visa",
  mastercard: "cc-mastercard",
  "google-pay": "google-pay",
  coinbase: "coinbase",
} as const satisfies Record<string, BrandGlyphName>;

export type TrustBrandIconName = keyof typeof brandIconMap;

export function TrustBrandIcon({
  name,
  size = 24,
  color = "#202124",
}: {
  name: TrustBrandIconName;
  size?: number;
  color?: string;
}) {
  return <FontAwesome6 color={color} name={brandIconMap[name]} size={size} />;
}
