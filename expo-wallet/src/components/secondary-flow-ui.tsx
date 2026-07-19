import { useEffect, useMemo, useState } from "react";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { TrustIcon, type TrustIconName } from "@/components/trust-icon";
import { BrandLogo, DappLogo as TrustDappLogo } from "@/components/trust-assets";
import type { PredictionProvider } from "@/data/secondary-flows";

type RemoteLogoProps = {
  uri?: string;
  size?: number;
  radius?: number;
  fallbackIcon?: TrustIconName;
  fallbackColor?: string;
  backgroundColor?: string;
};

export function RemoteLogo({
  uri,
  size = 48,
  radius = size / 2,
  fallbackIcon = "chart-line-variant",
  fallbackColor = "#202124",
  backgroundColor = "#f0f0f3",
}: RemoteLogoProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [uri]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {uri && !failed ? (
        <Image
          accessibilityLabel="Market logo"
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <TrustIcon color={fallbackColor} name={fallbackIcon} size={Math.round(size * 0.53)} />
      )}
    </View>
  );
}

export function DappLogo({ name, uri, size = 52 }: { name: string; uri: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 15, backgroundColor: "#ededf0", padding: 4 }}>
      <TrustDappLogo name={name} size={size - 8} />
    </View>
  );
}

const dappFallbacks: Record<string, TrustIconName> = {
  Uniswap: "unicorn-variant",
  PancakeSwap: "rabbit",
  Raydium: "alpha-r-circle-outline",
  Aerodrome: "airplane",
  Aave: "ghost-outline",
  Lido: "water-outline",
  Balancer: "chart-donut",
  "STON.fi": "diamond-stone",
};

export function ProviderBadge({ provider, compact = false }: { provider: PredictionProvider | "Aster"; compact?: boolean }) {
  const size = compact ? 20 : 28;
  const logo = provider === "Hyperliquid" || provider === "Aster"
    ? <BrandLogo brand={provider === "Aster" ? "aster" : "hyperliquid"} size={size} />
    : <TrustDappLogo name={provider} size={size} />;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {logo}
      {compact ? null : <Text style={{ color: "#6d6d72", fontSize: 13, fontWeight: "700" }}>{provider}</Text>}
    </View>
  );
}

export function MiniSparkline({ points, positive, width = 74, height = 38 }: { points: number[]; positive: boolean; width?: number; height?: number }) {
  const chart = useMemo(() => points.length >= 2 ? buildPaths(points, width, height) : null, [height, points, width]);
  const color = positive ? "#12b95a" : "#c81e36";
  const fill = positive ? "rgba(18,185,90,0.14)" : "rgba(200,30,54,0.14)";

  if (!chart) {
    return (
      <View accessibilityLabel="Historical chart unavailable" style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: Math.max(24, width * 0.5), height: 1, backgroundColor: "#d9d9dd" }} />
      </View>
    );
  }

  return (
    <Svg accessibilityLabel={positive ? "Positive price chart" : "Negative price chart"} height={height} width={width}>
      <Path d={chart.area} fill={fill} />
      <Path d={chart.line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} />
      <Circle cx={chart.last.x} cy={chart.last.y} fill={color} r={2.7} />
    </Svg>
  );
}

function buildPaths(points: number[], width: number, height: number) {
  const safe = points.length > 1 ? points : [0, 0];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const span = Math.max(1, max - min);
  const plotted = safe.map((value, index) => ({
    x: (index / (safe.length - 1)) * (width - 5) + 2,
    y: height - 4 - ((value - min) / span) * (height - 9),
  }));
  const line = plotted.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${line} L${plotted[plotted.length - 1].x.toFixed(1)},${height} L${plotted[0].x.toFixed(1)},${height} Z`;
  return { line, area, last: plotted[plotted.length - 1] };
}
