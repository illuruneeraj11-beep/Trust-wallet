export type CurrencyOption = {
  code: string;
  label: string;
  symbol: string;
  rate: number;
};

export type TrendingToken = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: string;
  volume: string;
  categories: string[];
  network: string;
  holdings?: number;
};

export type DappItem = {
  name: string;
  description: string;
  category: string;
  network: string;
};

export type RewardCampaign = {
  id: string;
  title: string;
  subtitle: string;
  reward: string;
};

export type RewardRedeemItem = {
  id: string;
  title: string;
  partner: string;
  cost: number;
};

export type PerpsMarket = {
  symbol: string;
  pair: string;
  leverage: string;
  volume: string;
  price: string;
  change: string;
};

export type PredictionMarket = {
  id: string;
  title: string;
  volume: string;
  endsIn: string;
  provider: string;
};

export type MemeRushEntry = {
  symbol: string;
  age: string;
  holders: string;
  score: number;
  price: string;
  trend: string;
};

export type EarnOpportunity = {
  symbol: string;
  name: string;
  apy: string;
};

export type AddressBookEntry = {
  id: string;
  name: string;
  network: string;
  address: string;
};

export type NetworkItem = {
  id: string;
  name: string;
  symbol: string;
  popular?: boolean;
};

export type SocialLink = {
  label: string;
  url: string;
};

export const currencyOptions: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", symbol: "$", rate: 1 },
  { code: "EUR", label: "Euro", symbol: "€", rate: 0.92 },
  { code: "GBP", label: "British Pound", symbol: "£", rate: 0.79 },
  { code: "JPY", label: "Japanese Yen", symbol: "¥", rate: 154.2 },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", rate: 1.53 },
  { code: "INR", label: "Indian Rupee", symbol: "₹", rate: 83.5 },
];

export const languageOptions = ["English", "Español", "Français", "Deutsch", "日本語", "हिन्दी"];

export const marketFilters = ["hot", "gainers", "rwa", "meme", "defi", "ai"];

export const topTradedTokens: TrendingToken[] = [
  { symbol: "ETH", name: "Ethereum", price: 2312.56, change: -1, marketCap: "$282B", volume: "$14.2B", categories: ["hot", "defi"], network: "ETH", holdings: 0.25 },
  { symbol: "BNB", name: "BNB Smart Chain", price: 636.28, change: -0.48, marketCap: "$91.5B", volume: "$1.8B", categories: ["hot", "defi"], network: "BNB", holdings: 0.61 },
  { symbol: "BTC", name: "Bitcoin", price: 63842.1, change: 1.42, marketCap: "$1.26T", volume: "$33.4B", categories: ["hot", "rwa"], network: "BTC", holdings: 0.03 },
  { symbol: "SOL", name: "Solana", price: 146.38, change: 3.12, marketCap: "$68.2B", volume: "$4.3B", categories: ["gainers", "ai"], network: "SOL", holdings: 1.8 },
];

export const trendingTokens: TrendingToken[] = [
  { symbol: "WSTETH", name: "Wrapped Staked Ether", price: 2846.35, change: -0.73, marketCap: "$9.98B", volume: "$27.10M", categories: ["hot", "defi"], network: "ETH" },
  { symbol: "AETHWETH", name: "Aethir Wrapped ETH", price: 2315.6, change: -0.67, marketCap: "$5.18B", volume: "$21.90M", categories: ["hot", "ai"], network: "ETH" },
  { symbol: "XAUT", name: "Tether Gold", price: 4692.15, change: 0.13, marketCap: "$2.63B", volume: "$181.69M", categories: ["rwa"], network: "ETH" },
  { symbol: "PAXG", name: "PAX Gold", price: 4699.22, change: 0.27, marketCap: "$2.26B", volume: "$158.29M", categories: ["rwa"], network: "ETH" },
  { symbol: "DEXE", name: "DeXe", price: 12.92, change: 1.52, marketCap: "$1.08B", volume: "$36.02M", categories: ["defi", "hot"], network: "BNB" },
  { symbol: "TRUMP", name: "Trump", price: 2.86, change: -0.49, marketCap: "$664.59M", volume: "$273.0M", categories: ["meme"], network: "SOL" },
  { symbol: "PUMP", name: "Pump", price: 0.001778, change: -1.3, marketCap: "$590.31M", volume: "$43.07M", categories: ["meme"], network: "SOL" },
  { symbol: "AERO", name: "Aerodrome", price: 0.4226, change: -2.78, marketCap: "$391.40M", volume: "$15.70M", categories: ["defi"], network: "BASE" },
  { symbol: "RIVER", name: "River", price: 6.6, change: 11.32, marketCap: "$129.26M", volume: "$54.52M", categories: ["gainers", "ai"], network: "ETH" },
  { symbol: "SKR", name: "SKR", price: 0.0198, change: 29.95, marketCap: "$104.70M", volume: "$150.4M", categories: ["gainers", "meme"], network: "ETH" },
  { symbol: "OPENAI", name: "OpenAI", price: 1431.1, change: -0.09, marketCap: "$2.24M", volume: "$3.89M", categories: ["ai"], network: "BASE" },
  { symbol: "NEURALINK", name: "Neuralink", price: 346.47, change: 0, marketCap: "$1.73M", volume: "$6.77M", categories: ["ai"], network: "SOL" },
];

export const dappCategories: Record<string, DappItem[]> = {
  Featured: [
    { name: "Aave", description: "Open source liquidity protocol for lending and borrowing.", category: "Featured", network: "ETH" },
    { name: "Aster", description: "Perpetuals venue with deep liquidity and pro tooling.", category: "Featured", network: "BNB" },
    { name: "Four", description: "Launch memes and communities with lightweight tooling.", category: "Featured", network: "BNB" },
  ],
  DEX: [
    { name: "Raydium", description: "Solana swaps, pools, and concentrated liquidity.", category: "DEX", network: "SOL" },
    { name: "Aerodrome", description: "Base liquidity hub for swaps and governance.", category: "DEX", network: "BASE" },
    { name: "1inch", description: "DEX aggregator for the best execution routes.", category: "DEX", network: "ETH" },
  ],
  Lending: [
    { name: "Compound", description: "Supply and borrow assets with algorithmic rates.", category: "Lending", network: "ETH" },
    { name: "Venus", description: "Lend and borrow on BNB Chain.", category: "Lending", network: "BNB" },
    { name: "Kamino", description: "Automated lending and leverage on Solana.", category: "Lending", network: "SOL" },
  ],
  Yield: [
    { name: "Beefy", description: "Vaults that auto-compound DeFi yield.", category: "Yield", network: "BNB" },
    { name: "Ethena", description: "Synthetic dollar strategies and yield vaults.", category: "Yield", network: "ETH" },
    { name: "Yearn", description: "Curated onchain strategies for stable yield.", category: "Yield", network: "ETH" },
  ],
  BSC: [
    { name: "PancakeSwap", description: "BNB Chain swaps, staking, and predictions.", category: "BSC", network: "BNB" },
    { name: "Venus", description: "Borrow against your BNB chain portfolio.", category: "BSC", network: "BNB" },
    { name: "Alpaca", description: "Leveraged yield products and vaults.", category: "BSC", network: "BNB" },
  ],
  Solana: [
    { name: "Jito", description: "Liquid staking and MEV-boosted rewards.", category: "Solana", network: "SOL" },
    { name: "Orca", description: "Simple and fast token swaps on Solana.", category: "Solana", network: "SOL" },
    { name: "Pump.Fun", description: "Launch and discover Solana meme coins.", category: "Solana", network: "SOL" },
  ],
  Sonic: [
    { name: "Pendle", description: "Trade tokenized yield and fixed APY products.", category: "Sonic", network: "S" },
    { name: "Silo", description: "Permissionless lending markets on Sonic.", category: "Sonic", network: "S" },
    { name: "Beets", description: "Liquidity hub focused on Sonic assets.", category: "Sonic", network: "S" },
  ],
  "Liquid Staking": [
    { name: "Lido", description: "Liquid staking for ETH and multichain assets.", category: "Liquid Staking", network: "ETH" },
    { name: "Rocket Pool", description: "Decentralized ETH staking and node operation.", category: "Liquid Staking", network: "ETH" },
    { name: "Marinade", description: "Liquid staking and native staking for Solana.", category: "Liquid Staking", network: "SOL" },
  ],
  Marketplaces: [
    { name: "OpenSea", description: "NFT marketplace for multichain collections.", category: "Marketplaces", network: "ETH" },
    { name: "Magic Eden", description: "Marketplace for Solana, Bitcoin, and EVM NFTs.", category: "Marketplaces", network: "SOL" },
    { name: "Blur", description: "Pro NFT trading experience and portfolio tools.", category: "Marketplaces", network: "ETH" },
  ],
  Social: [
    { name: "Galxe", description: "Campaigns, loyalty, and quest infrastructure.", category: "Social", network: "ETH" },
    { name: "Lens", description: "Social graph for creators and communities.", category: "Social", network: "ETH" },
    { name: "Phi", description: "Onchain social profile and city builder.", category: "Social", network: "BASE" },
  ],
  Games: [
    { name: "Axie Infinity", description: "Battle, earn, and collect digital creatures.", category: "Games", network: "RON" },
    { name: "Alien Worlds", description: "Metaverse mining and competition game.", category: "Games", network: "WAX" },
    { name: "CARV", description: "Identity and progression layer for web3 games.", category: "Games", network: "ETH" },
  ],
};

export const rewardsCampaigns: RewardCampaign[] = [
  { id: "campaign-1", title: "Complete your backup", subtitle: "Secure your wallet and unlock onboarding XP.", reward: "+100 XP" },
  { id: "campaign-2", title: "Swap your first asset", subtitle: "Exchange any crypto instantly with Trust Trade.", reward: "+75 XP" },
  { id: "campaign-3", title: "Explore Trust Alpha", subtitle: "Join new ecosystem campaigns and early features.", reward: "+50 XP" },
];

export const trustAlphaCampaigns: RewardCampaign[] = [
  { id: "alpha-1", title: "ZK Summer Access", subtitle: "Explore zk ecosystems and mint your access badge.", reward: "Priority Access" },
  { id: "alpha-2", title: "Solana Meme Rush", subtitle: "Trade fast movers and climb the community board.", reward: "XP Multiplier" },
];

export const rewardRedeemItems: RewardRedeemItem[] = [
  { id: "redeem-1", title: "$50 hotel coupon", partner: "Umy", cost: 800 },
  { id: "redeem-2", title: "40% off eSIM", partner: "TonMobile", cost: 400 },
  { id: "redeem-3", title: "Exclusive Trust merch drop", partner: "Trust Wallet", cost: 1200 },
];

export const perpsMarkets: PerpsMarket[] = [
  { symbol: "ASTER", pair: "ASTERUSDT", leverage: "x200", volume: "$28.7M", price: "$0.6694", change: "-0.14%" },
  { symbol: "BTC", pair: "BTCUSDT", leverage: "x200", volume: "$938.2M", price: "$78,232.5", change: "+0.64%" },
  { symbol: "ETH", pair: "ETHUSDT", leverage: "x200", volume: "$374.9M", price: "$2,329.22", change: "-0.04%" },
  { symbol: "SOL", pair: "SOLUSDT", leverage: "x100", volume: "$52.9M", price: "$86.53", change: "+0.67%" },
  { symbol: "XRP", pair: "XRPUSDT", leverage: "x100", volume: "$15.2M", price: "$1.4399", change: "+1.65%" },
];

export const predictionMarkets: PredictionMarket[] = [
  { id: "pred-1", title: "Bitcoin closes above $70k this week?", volume: "$6.1M", endsIn: "2D 4H", provider: "Polymarket" },
  { id: "pred-2", title: "Ethereum ETF inflows stay positive tomorrow?", volume: "$1.8M", endsIn: "19H 20M", provider: "Polymarket" },
  { id: "pred-3", title: "Will Solana daily fees beat Ethereum this weekend?", volume: "$3.4M", endsIn: "3D 12H", provider: "Polymarket" },
];

export const memeRushEntries: MemeRushEntry[] = [
  { symbol: "BONKX", age: "3m age", holders: "1/5", score: 72, price: "$0.00038", trend: "+18.2%" },
  { symbol: "WEN2", age: "9m age", holders: "3/5", score: 61, price: "$0.0029", trend: "+6.4%" },
  { symbol: "PEPPER", age: "14m age", holders: "5/5", score: 87, price: "$0.019", trend: "+22.1%" },
  { symbol: "FROGX", age: "18m age", holders: "2/5", score: 44, price: "$0.00011", trend: "-4.1%" },
];

export const earnOpportunities: EarnOpportunity[] = [
  { symbol: "STARS", name: "STARS", apy: "31.15%" },
  { symbol: "JUNO", name: "JUNO", apy: "27.16%" },
  { symbol: "KSM", name: "KSM", apy: "15.28%" },
];

export const addressBookSeed: AddressBookEntry[] = [
  { id: "addr-1", name: "Binance Hot Wallet", network: "BNB Smart Chain", address: "0x93d7E8F4...087A15" },
  { id: "addr-2", name: "Arun Savings", network: "Ethereum", address: "0x1245A7c1...A87109" },
  { id: "addr-3", name: "Solana Laptop", network: "Solana", address: "7zwDZqJj3...TCjtGS" },
];

export const networkOptions: NetworkItem[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", popular: true },
  { id: "eth", name: "Ethereum", symbol: "ETH", popular: true },
  { id: "sol", name: "Solana", symbol: "SOL", popular: true },
  { id: "bnb", name: "BNB Smart Chain", symbol: "BNB", popular: true },
  { id: "arb", name: "Arbitrum", symbol: "ARB" },
  { id: "base", name: "Base", symbol: "BASE" },
  { id: "op", name: "Optimism", symbol: "OP" },
  { id: "matic", name: "Polygon", symbol: "MATIC" },
  { id: "avax", name: "Avalanche", symbol: "AVAX" },
  { id: "sui", name: "Sui", symbol: "SUI" },
  { id: "apt", name: "Aptos", symbol: "APT" },
  { id: "tron", name: "Tron", symbol: "TRX" },
];

export const socialLinks: SocialLink[] = [
  { label: "X", url: "https://x.com/trustwallet" },
  { label: "Telegram", url: "https://t.me/trust_announcements" },
  { label: "Facebook", url: "https://facebook.com/trustwalletapp" },
  { label: "Reddit", url: "https://reddit.com/r/trustapp" },
  { label: "YouTube", url: "https://youtube.com/@TrustWallet" },
  { label: "Instagram", url: "https://instagram.com/trustwallet" },
  { label: "Discord", url: "https://discord.gg/trustwallet" },
];

export function getFilteredTrendingTokens(filter: string) {
  if (filter === "gainers") {
    return [...trendingTokens].sort((left, right) => right.change - left.change);
  }

  return trendingTokens.filter((token) => token.categories.includes(filter) || filter === "hot");
}

export function formatCurrencyValue(amount: number, currency: CurrencyOption) {
  const converted = amount * currency.rate;
  const prefix = currency.symbol || `${currency.code} `;

  if (converted >= 1000) {
    return `${prefix}${converted.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  return `${prefix}${converted.toFixed(2)}`;
}
