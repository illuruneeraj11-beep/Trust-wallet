export type AssetDefinition = {
  assetId: string;
  cmcId: number | null;
  name: string;
  symbol: string;
  chain: string;
  networkSymbol: string;
  contract?: string;
  logo: string;
  networkLogo?: string;
  categories: readonly string[];
  availability?: "verified" | "unavailable";
};

const tokenLogo = (symbol: string) => `/assets/tokens/${symbol}.png`;

export const assetRegistry: readonly AssetDefinition[] = [
  { assetId: "bitcoin:native", cmcId: 1, name: "Bitcoin", symbol: "BTC", chain: "Bitcoin", networkSymbol: "BTC", logo: tokenLogo("BTC"), categories: ["hot", "rwa"] },
  { assetId: "ethereum:native", cmcId: 1027, name: "Ethereum", symbol: "ETH", chain: "Ethereum", networkSymbol: "ETH", logo: tokenLogo("ETH"), categories: ["hot", "defi"] },
  { assetId: "bsc:native", cmcId: 1839, name: "BNB Smart Chain", symbol: "BNB", chain: "BNB Smart Chain", networkSymbol: "BNB", logo: tokenLogo("BNB"), categories: ["hot", "defi"] },
  { assetId: "solana:native", cmcId: 5426, name: "Solana", symbol: "SOL", chain: "Solana", networkSymbol: "SOL", logo: tokenLogo("SOL"), categories: ["hot", "gainers", "ai"] },
  {
    assetId: "ethereum:erc20:0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
    cmcId: 12409,
    name: "Lido wstETH",
    symbol: "WSTETH",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
    logo: tokenLogo("WSTETH"),
    networkLogo: tokenLogo("ETH"),
    categories: ["hot", "defi"],
  },
  {
    assetId: "ethereum:erc20:0x4d5f47fa6a74757f35c14fd3a6ef8e3c9bc514e8",
    cmcId: 36458,
    name: "Aave Ethereum WETH",
    symbol: "AETHWETH",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8",
    logo: tokenLogo("AETHWETH"),
    networkLogo: tokenLogo("ETH"),
    categories: ["hot", "defi"],
  },
  {
    assetId: "ethereum:erc20:0x68749665ff8d2d112fa859aa293f07a622782f38",
    cmcId: 5176,
    name: "Tether Gold",
    symbol: "XAUT",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
    logo: tokenLogo("XAUT"),
    networkLogo: tokenLogo("ETH"),
    categories: ["rwa"],
  },
  {
    assetId: "ethereum:erc20:0x45804880de22913dafe09f4980848ece6ecbaf78",
    cmcId: 4705,
    name: "PAX Gold",
    symbol: "PAXG",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x45804880De22913Dafe09f4980848ECE6EcbAf78",
    logo: tokenLogo("PAXG"),
    networkLogo: tokenLogo("ETH"),
    categories: ["rwa"],
  },
  {
    assetId: "ethereum:erc20:0xde4ee8057785a7e8e800db58f9784845a5c2cbd6",
    cmcId: 7326,
    name: "DeXe",
    symbol: "DEXE",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0xde4EE8057785A7e8e800Db58F9784845A5C2Cbd6",
    logo: tokenLogo("DEXE"),
    networkLogo: tokenLogo("ETH"),
    categories: ["defi", "hot"],
  },
  {
    assetId: "solana:spl:6p6xghyf7aee6tzksmfsko444wqop15icusqi2jfgipn",
    cmcId: 35336,
    name: "OFFICIAL TRUMP",
    symbol: "TRUMP",
    chain: "Solana",
    networkSymbol: "SOL",
    contract: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    logo: tokenLogo("TRUMP"),
    networkLogo: tokenLogo("SOL"),
    categories: ["meme"],
  },
  {
    assetId: "solana:spl:pumpcmxqmfrsakq5r49wcjnrayyrqmxz6ae8h7h9dfn",
    cmcId: 36507,
    name: "Pump.fun",
    symbol: "PUMP",
    chain: "Solana",
    networkSymbol: "SOL",
    contract: "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn",
    logo: tokenLogo("PUMP"),
    networkLogo: tokenLogo("SOL"),
    categories: ["meme"],
  },
  {
    assetId: "base:erc20:0x940181a94a35a4569e4529a3cdfb74e38fd98631",
    cmcId: 29270,
    name: "Aerodrome Finance",
    symbol: "AERO",
    chain: "Base",
    networkSymbol: "BASE",
    contract: "0x940181a94A35A4569e4529A3CDfB74e38FD98631",
    logo: tokenLogo("AERO"),
    categories: ["defi"],
  },
  {
    assetId: "ethereum:erc20:0xda7ad9dea9397cffddae2f8a052b82f1484252b3",
    cmcId: 38417,
    name: "River",
    symbol: "RIVER",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0xdA7AD9dea9397cffdDAE2F8a052B82f1484252B3",
    logo: tokenLogo("RIVER"),
    networkLogo: tokenLogo("ETH"),
    categories: ["gainers", "defi"],
  },
  {
    assetId: "solana:spl:skrbvo6gf7gondit3bbtfurdpqlwei4j2qy2npgzhw3",
    cmcId: 39377,
    name: "Seeker",
    symbol: "SKR",
    chain: "Solana",
    networkSymbol: "SOL",
    contract: "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3",
    logo: tokenLogo("SKR"),
    networkLogo: tokenLogo("SOL"),
    categories: ["gainers"],
  },
  {
    assetId: "solana:spl:prewejyecqtwbtpxhl171nl2k6umo692gtm7q3rpgf",
    cmcId: 37671,
    name: "OpenAI tokenized stock (PreStocks)",
    symbol: "OPENAI",
    chain: "Solana",
    networkSymbol: "SOL",
    contract: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
    logo: tokenLogo("OPENAI"),
    networkLogo: tokenLogo("SOL"),
    categories: ["ai", "preipo"],
  },
  {
    assetId: "solana:unverified:neuralink",
    cmcId: null,
    name: "Neuralink",
    symbol: "NEURALINK",
    chain: "Solana",
    networkSymbol: "SOL",
    logo: "",
    networkLogo: tokenLogo("SOL"),
    categories: ["ai", "preipo"],
    availability: "unavailable",
  },
  {
    assetId: "bsc:bep20:0x4b0f1812e5df2a09796481ff14017e6005508003",
    cmcId: 5964,
    name: "Trust Wallet Token",
    symbol: "TWT",
    chain: "BNB Smart Chain",
    networkSymbol: "BNB",
    contract: "0x4B0F1812e5Df2A09796481Ff14017e6005508003",
    logo: tokenLogo("TWT"),
    networkLogo: tokenLogo("BNB"),
    categories: ["hot"],
  },
  { assetId: "hyperliquid:native", cmcId: 32196, name: "Hyperliquid", symbol: "HYPE", chain: "Hyperliquid", networkSymbol: "HYPE", logo: tokenLogo("HYPE"), categories: ["defi", "perps"] },
  {
    assetId: "bsc:bep20:0x000ae314e2a2172a039b26378814c252734f556a",
    cmcId: 36341,
    name: "Aster",
    symbol: "ASTER",
    chain: "BNB Smart Chain",
    networkSymbol: "BNB",
    contract: "0x000Ae314E2A2172a039B26378814C252734f556A",
    logo: tokenLogo("ASTER"),
    networkLogo: tokenLogo("BNB"),
    categories: ["defi", "perps"],
  },
  { assetId: "xrp:native", cmcId: 52, name: "XRP", symbol: "XRP", chain: "XRP Ledger", networkSymbol: "XRP", logo: tokenLogo("XRP"), categories: ["hot", "perps"] },
  {
    assetId: "ethereum:erc20:0x514910771af9ca656af840dff83e8264ecf986ca",
    cmcId: 1975,
    name: "Chainlink",
    symbol: "LINK",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    logo: tokenLogo("LINK"),
    networkLogo: tokenLogo("ETH"),
    categories: ["defi"],
  },
  {
    assetId: "ethereum:erc20:0xdac17f958d2ee523a2206206994597c13d831ec7",
    cmcId: 825,
    name: "Tether USDt",
    symbol: "USDT",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    logo: tokenLogo("USDT"),
    networkLogo: tokenLogo("ETH"),
    categories: ["hot", "defi"],
  },
  {
    assetId: "ethereum:erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    cmcId: 3408,
    name: "USDC",
    symbol: "USDC",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0xA0b86991c6218b36c1d19d4a2e9Eb0cE3606eB48",
    logo: tokenLogo("USDC"),
    networkLogo: tokenLogo("ETH"),
    categories: ["hot", "defi"],
  },
  {
    assetId: "bsc:bep20:0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
    cmcId: 7186,
    name: "PancakeSwap",
    symbol: "CAKE",
    chain: "BNB Smart Chain",
    networkSymbol: "BNB",
    contract: "0x0E09Fabb73Bd3Ade0a17ECC321fD13a19e81cE82",
    logo: tokenLogo("CAKE"),
    networkLogo: tokenLogo("BNB"),
    categories: ["hot", "defi"],
  },
  {
    assetId: "ethereum:erc20:0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3",
    cmcId: 21159,
    name: "Ondo",
    symbol: "ONDO",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3",
    logo: tokenLogo("ONDO"),
    networkLogo: tokenLogo("ETH"),
    categories: ["ondo", "rwa", "defi"],
  },
  {
    assetId: "ethereum:erc20:0x232ce3bd40fcd6f80f3d55a522d03f25df784ee2",
    cmcId: 39125,
    name: "Lighter",
    symbol: "LIT",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x232CE3BD40FCD6f80F3D55a522D03F25Df784eE2",
    logo: tokenLogo("LIT"),
    networkLogo: tokenLogo("ETH"),
    categories: ["hot", "defi"],
  },
  {
    assetId: "ethereum:erc20:0x28d4e499c4cde621e1cea7c9cbf9d43bf75a9525",
    cmcId: 40587,
    name: "Helix AI",
    symbol: "HLX",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x28D4e499C4CdE621e1Cea7c9CBf9D43bf75a9525",
    logo: tokenLogo("HLX"),
    networkLogo: tokenLogo("ETH"),
    categories: ["ai", "gainers"],
  },
  {
    assetId: "base:erc20:0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf",
    cmcId: 35509,
    name: "Venice Token",
    symbol: "VVV",
    chain: "Base",
    networkSymbol: "BASE",
    contract: "0xacFE6019Ed1A7DC6f7b508C02D1b04ec88cC21bf",
    logo: tokenLogo("VVV"),
    categories: ["ai", "gainers"],
  },
  {
    assetId: "ethereum:erc20:0x6982508145454ce325ddbe47a25d4ec3d2311933",
    cmcId: 24478,
    name: "Pepe",
    symbol: "PEPE",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    logo: tokenLogo("PEPE"),
    networkLogo: tokenLogo("ETH"),
    categories: ["meme", "hot"],
  },
  {
    assetId: "ethereum:erc20:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
    cmcId: 7278,
    name: "Aave",
    symbol: "AAVE",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    logo: tokenLogo("AAVE"),
    networkLogo: tokenLogo("ETH"),
    categories: ["defi"],
  },
  {
    assetId: "ethereum:erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    cmcId: 7083,
    name: "Uniswap",
    symbol: "UNI",
    chain: "Ethereum",
    networkSymbol: "ETH",
    contract: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    logo: tokenLogo("UNI"),
    networkLogo: tokenLogo("ETH"),
    categories: ["defi"],
  },
  { assetId: "cardano:native", cmcId: 2010, name: "Cardano", symbol: "ADA", chain: "Cardano", networkSymbol: "ADA", logo: tokenLogo("ADA"), categories: ["hot"] },
  { assetId: "dogecoin:native", cmcId: 74, name: "Dogecoin", symbol: "DOGE", chain: "Dogecoin", networkSymbol: "DOGE", logo: tokenLogo("DOGE"), categories: ["meme", "hot"] },
  { assetId: "litecoin:native", cmcId: 2, name: "Litecoin", symbol: "LTC", chain: "Litecoin", networkSymbol: "LTC", logo: tokenLogo("LTC"), categories: ["hot"] },
  { assetId: "zcash:native", cmcId: 1437, name: "Zcash", symbol: "ZEC", chain: "Zcash", networkSymbol: "ZEC", logo: tokenLogo("ZEC"), categories: ["hot"] },
  { assetId: "avalanche:native", cmcId: 5805, name: "Avalanche", symbol: "AVAX", chain: "Avalanche C-Chain", networkSymbol: "AVAX", logo: tokenLogo("AVAX"), categories: ["defi"] },
  { assetId: "sui:native", cmcId: 20947, name: "Sui", symbol: "SUI", chain: "Sui", networkSymbol: "SUI", logo: tokenLogo("SUI"), categories: ["hot", "defi"] },
  { assetId: "tron:native", cmcId: 1958, name: "TRON", symbol: "TRX", chain: "Tron", networkSymbol: "TRX", logo: tokenLogo("TRX"), categories: ["hot"] },
];

const assetsById: Map<string, AssetDefinition> = new Map(assetRegistry.map((asset) => [asset.assetId, asset]));
const assetsByCmcId: Map<number, AssetDefinition> = new Map(
  assetRegistry.flatMap((asset) => asset.cmcId === null ? [] : [[asset.cmcId, asset] as const]),
);
const assetsBySymbol: Map<string, AssetDefinition> = new Map(assetRegistry.map((asset) => [asset.symbol.toUpperCase(), asset]));

export function getAssetById(assetId: string) {
  return assetsById.get(assetId);
}

export function getAssetByCmcId(cmcId: number) {
  return assetsByCmcId.get(cmcId);
}

export function getAssetBySymbol(symbol: string) {
  return assetsBySymbol.get(symbol.toUpperCase());
}

export function getMarketAssetIds() {
  return assetRegistry.flatMap((asset) => asset.cmcId === null ? [] : [asset.cmcId]);
}

const coreLiveSymbols = new Set([
  "BTC", "ETH", "USDT", "BNB", "XRP", "USDC", "SOL", "TRX", "DOGE", "ADA",
  "HYPE", "LINK", "AVAX", "SUI", "LTC", "TWT", "CAKE", "AAVE", "UNI", "ONDO",
]);

export function getCoreMarketAssetIds() {
  return assetRegistry.flatMap((asset) => asset.cmcId !== null && coreLiveSymbols.has(asset.symbol) ? [asset.cmcId] : []);
}

export function getSecondaryMarketAssetIds() {
  return assetRegistry.flatMap((asset) => asset.cmcId !== null && !coreLiveSymbols.has(asset.symbol) ? [asset.cmcId] : []);
}

export function isCoreLiveAsset(assetId: string) {
  const asset = getAssetById(assetId);
  return Boolean(asset && coreLiveSymbols.has(asset.symbol));
}
