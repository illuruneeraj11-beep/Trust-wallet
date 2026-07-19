import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

type MarketChartProps = {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
  showEndPoint?: boolean;
};

function buildCoordinates(points: number[], width: number, height: number, padding: number) {
  const values = points.filter(Number.isFinite);
  const safe = values.length > 1 ? values : [0, 0];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const spread = max - min || 1;
  const step = (width - padding * 2) / Math.max(safe.length - 1, 1);

  return safe.map((value, index) => ({
    x: padding + index * step,
    y: padding + (1 - (value - min) / spread) * (height - padding * 2),
  }));
}

export function MarketChart({
  points,
  width = 72,
  height = 38,
  color = "#0aa84f",
  fill = true,
  strokeWidth = 2,
  showEndPoint = true,
}: MarketChartProps) {
  const chart = useMemo(() => {
    const padding = Math.max(2, strokeWidth);
    const coordinates = buildCoordinates(points, width, height, padding);
    const line = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const area = `${line} L${last.x.toFixed(2)},${height} L${first.x.toFixed(2)},${height} Z`;
    return { line, area, last };
  }, [height, points, strokeWidth, width]);

  const gradientId = `market-${color.replace(/[^a-z0-9]/gi, "")}-${width}-${height}`;

  return (
    <View accessibilityLabel="Live price chart" style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.24} />
            <Stop offset="1" stopColor={color} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>
        {fill ? <Path d={chart.area} fill={`url(#${gradientId})`} /> : null}
        <Path d={chart.line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />
        {showEndPoint ? <Circle cx={chart.last.x} cy={chart.last.y} fill="#ffffff" r={2.4} stroke={color} strokeWidth={1.6} /> : null}
      </Svg>
    </View>
  );
}

