import type { MarketCurrency } from "@/types/market";

export type CurrencyOption = {
  code: MarketCurrency;
  label: string;
  symbol: string;
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
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
];

export const languageOptions = ["English", "Español", "Français", "Deutsch", "日本語", "हिन्दी"];

export const marketFilters = ["hot", "ondo", "preipo", "gainers", "meme", "defi", "ai", "rwa"];

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
  { id: "terra", name: "Terra Classic", symbol: "LUNC" },
  { id: "tez", name: "Tezos", symbol: "XTZ" },
  { id: "theta", name: "Theta", symbol: "THETA" },
  { id: "tt", name: "ThunderCore", symbol: "TT" },
  { id: "vet", name: "VeChain", symbol: "VET" },
  { id: "via", name: "Viacoin", symbol: "VIA" },
  { id: "vic", name: "Viction", symbol: "VIC" },
  { id: "wan", name: "Wanchain", symbol: "WAN" },
  { id: "waves", name: "Waves", symbol: "WAVES" },
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
