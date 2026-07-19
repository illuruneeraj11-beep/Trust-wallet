export type PerpsCategory = "Popular" | "New" | "Crypto" | "Stocks" | "Commodities";

export type PerpsProvider = "Aster" | "Hyperliquid";

export type PerpsMarketDefinition = {
  symbol: string;
  name: string;
  category: PerpsCategory;
  provider: PerpsProvider;
  logoUrl?: string;
};

export const perpsCategories: PerpsCategory[] = ["Popular", "New", "Crypto", "Stocks", "Commodities"];

export const perpsMarketDefinitions: PerpsMarketDefinition[] = [
  { symbol: "BTC", name: "Bitcoin", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "ETH", name: "Ethereum", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "SNDK", name: "SanDisk", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "XYZ100", name: "XYZ 100 Index", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "SKHX", name: "SK hynix", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "MU", name: "Micron", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "SP500", name: "S&P 500", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "SKHY", name: "SK hynix 2x", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "HYPE", name: "Hyperliquid", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "CL", name: "Crude Oil (WTI)", category: "Commodities", provider: "Hyperliquid" },
  { symbol: "DRAM", name: "DRAM Memory Stocks ETF", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "CASHCAT", name: "Cash Cat", category: "New", provider: "Hyperliquid" },
  { symbol: "AKE", name: "AKEDO", category: "New", provider: "Aster" },
  { symbol: "ESPORTS", name: "Yooldo Games", category: "New", provider: "Aster" },
  { symbol: "ASTER", name: "Aster", category: "Crypto", provider: "Aster" },
  { symbol: "SOL", name: "Solana", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "XRP", name: "XRP", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "TRUMP", name: "Official Trump", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "DOGE", name: "Dogecoin", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "ZEC", name: "Zcash", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "WLD", name: "Worldcoin", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "ADA", name: "Cardano", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "SUI", name: "Sui", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "LINK", name: "Chainlink", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "AVAX", name: "Avalanche", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "BNB", name: "BNB", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "SYN", name: "Synapse", category: "Crypto", provider: "Aster" },
  { symbol: "KPEPE", name: "kPEPE", category: "Crypto", provider: "Hyperliquid" },
  { symbol: "SPCX", name: "SpaceX", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "META", name: "Meta", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "NBIS", name: "Nebius", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "INTC", name: "Intel", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "SMSN", name: "Samsung Electronics", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "MSTR", name: "MicroStrategy", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "CRCL", name: "Circle", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "NVDA", name: "NVIDIA", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "AMD", name: "AMD", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "EWY", name: "iShares MSCI South Korea", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "TSLA", name: "Tesla", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "MSFT", name: "Microsoft", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "MRVL", name: "Marvell", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "AAPL", name: "Apple", category: "Stocks", provider: "Hyperliquid" },
  { symbol: "RTX", name: "RTX", category: "Stocks", provider: "Aster" },
  { symbol: "V", name: "Visa", category: "Stocks", provider: "Aster" },
  { symbol: "AMZN", name: "Amazon", category: "Stocks", provider: "Aster" },
  { symbol: "GOOGL", name: "Alphabet", category: "Stocks", provider: "Aster" },
  { symbol: "COIN", name: "Coinbase", category: "Stocks", provider: "Aster" },
  { symbol: "CRWV", name: "CoreWeave", category: "Stocks", provider: "Aster" },
  { symbol: "GOLD", name: "Gold", category: "Commodities", provider: "Hyperliquid" },
  { symbol: "SILVER", name: "Silver", category: "Commodities", provider: "Hyperliquid" },
  { symbol: "XAU", name: "Gold", category: "Commodities", provider: "Aster" },
  { symbol: "NATGAS", name: "Natural Gas", category: "Commodities", provider: "Aster" },
  { symbol: "XCU", name: "Copper", category: "Commodities", provider: "Aster" },
  { symbol: "XPD", name: "Palladium", category: "Commodities", provider: "Aster" },
  { symbol: "XPT", name: "Platinum", category: "Commodities", provider: "Aster" },
];

export type DappCategory = "Featured" | "DEX" | "Lending" | "Yield" | "Staking";

export type DappDefinition = {
  id: string;
  name: string;
  description: string;
  category: DappCategory;
  network: string;
  url: string;
  logoUrl: string;
};

export const dappCategoryNames: DappCategory[] = ["Featured", "DEX", "Lending", "Yield", "Staking"];

export const dappDirectory: DappDefinition[] = [
  { id: "merlinswap", name: "MerlinSwap", description: "Decentralized exchange for the Merlin ecosystem.", category: "Featured", network: "Merlin", url: "https://merlinswap.org", logoUrl: "" },
  { id: "inception", name: "Inception", description: "Liquid restaking and withdrawal access for supported assets.", category: "Featured", network: "Ethereum", url: "https://www.inceptionlrt.com/app/restaking", logoUrl: "" },
  { id: "four-meme", name: "four.meme", description: "Token launch platform for BNB Smart Chain.", category: "Featured", network: "BNB Smart Chain", url: "https://four.meme", logoUrl: "" },
  { id: "whales-market", name: "Whales Market", description: "Pre-market and OTC trading for digital assets.", category: "Featured", network: "Multichain", url: "https://app.whales.market", logoUrl: "" },
  { id: "lido-impact", name: "Lido Impact Staking", description: "Support public goods while staking ETH with Lido.", category: "Featured", network: "Ethereum", url: "https://stake.lido.fi", logoUrl: "" },
  { id: "pancakeswap-v1", name: "PancakeSwap AMM V1", description: "PancakeSwap classic automated market maker.", category: "Featured", network: "BNB Smart Chain", url: "https://pancakeswap.finance/swap", logoUrl: "" },
  { id: "pancakeswap-perps", name: "PancakeSwap Perps", description: "Browse PancakeSwap perpetual markets.", category: "Featured", network: "Multichain", url: "https://pancakeswap.finance/perps", logoUrl: "" },
  { id: "raydium-perps", name: "Raydium Perps", description: "Browse perpetual markets from the Raydium ecosystem.", category: "Featured", network: "Solana", url: "https://raydium.io", logoUrl: "" },
  { id: "pancakeswap-prediction", name: "PancakeSwap Prediction", description: "Browse PancakeSwap prediction rounds.", category: "Featured", network: "BNB Smart Chain", url: "https://pancakeswap.finance/prediction", logoUrl: "" },
  { id: "kalshi", name: "Kalshi", description: "Browse event markets and real-world outcomes.", category: "Featured", network: "Web", url: "https://kalshi.com", logoUrl: "" },
  { id: "uniswap", name: "Uniswap", description: "Swap, earn, and build on the leading decentralized exchange.", category: "DEX", network: "Ethereum", url: "https://app.uniswap.org", logoUrl: "https://icons.llama.fi/uniswap-v3.jpg" },
  { id: "pancakeswap", name: "PancakeSwap", description: "Trade. Earn. Win. NFT.", category: "DEX", network: "BNB Smart Chain", url: "https://pancakeswap.finance", logoUrl: "https://icons.llama.fi/pancakeswap-amm-v3.jpg" },
  { id: "raydium", name: "Raydium", description: "Solana's automated market maker and liquidity provider.", category: "DEX", network: "Solana", url: "https://raydium.io", logoUrl: "https://icons.llama.fi/raydium.jpg" },
  { id: "aerodrome", name: "Aerodrome", description: "A central trading and liquidity marketplace on Base.", category: "DEX", network: "Base", url: "https://aerodrome.finance", logoUrl: "https://icons.llama.fi/aerodrome.jpg" },
  { id: "pancakeswap-v3", name: "PancakeSwap AMM V3", description: "PancakeSwap V3 automated market maker.", category: "DEX", network: "Multichain", url: "https://pancakeswap.finance/swap", logoUrl: "https://icons.llama.fi/pancakeswap-amm-v3.jpg" },
  { id: "fluid-dex", name: "Fluid DEX", description: "DEX and liquidity layer with Smart Collateral.", category: "DEX", network: "Ethereum", url: "https://fluid.io", logoUrl: "https://icons.llama.fi/fluid-dex.jpg" },
  { id: "sunswap", name: "SUNSwap V3", description: "TRON-based concentrated liquidity exchange.", category: "DEX", network: "TRON", url: "https://sunswap.com", logoUrl: "https://icons.llama.fi/sunswap-v3.jpg" },
  { id: "balancer", name: "Balancer", description: "A decentralized automated market maker protocol.", category: "DEX", network: "Ethereum", url: "https://balancer.fi", logoUrl: "https://icons.llama.fi/balancer-v2.jpg" },
  { id: "stonfi", name: "STON.fi", description: "Automated market maker for the TON ecosystem.", category: "DEX", network: "TON", url: "https://ston.fi", logoUrl: "https://icons.llama.fi/ston.fi.jpg" },
  { id: "fraxswap", name: "Fraxswap", description: "Time-weighted automated market maker from Frax.", category: "DEX", network: "Ethereum", url: "https://app.frax.finance/fraxswap", logoUrl: "https://icons.llama.fi/fraxswap.jpg" },
  { id: "aave", name: "Aave", description: "Open-source, non-custodial liquidity protocol.", category: "Lending", network: "Ethereum", url: "https://app.aave.com", logoUrl: "https://icons.llama.fi/aave-v3.jpg" },
  { id: "compound", name: "Compound", description: "Supply and borrow crypto with algorithmic rates.", category: "Lending", network: "Ethereum", url: "https://app.compound.finance", logoUrl: "https://icons.llama.fi/compound-v3.jpg" },
  { id: "venus", name: "Venus", description: "Decentralized money market on BNB Smart Chain.", category: "Lending", network: "BNB Smart Chain", url: "https://app.venus.io", logoUrl: "https://icons.llama.fi/venus.jpg" },
  { id: "kamino", name: "Kamino", description: "Borrow, lend, and automate liquidity on Solana.", category: "Lending", network: "Solana", url: "https://app.kamino.finance", logoUrl: "https://icons.llama.fi/kamino-lend.jpg" },
  { id: "pendle", name: "Pendle", description: "Trade future yield and fixed-rate opportunities.", category: "Yield", network: "Multichain", url: "https://app.pendle.finance", logoUrl: "https://icons.llama.fi/pendle.jpg" },
  { id: "beefy", name: "Beefy", description: "Multichain vaults that automatically compound yield.", category: "Yield", network: "Multichain", url: "https://app.beefy.com", logoUrl: "https://icons.llama.fi/beefy.jpg" },
  { id: "yearn", name: "Yearn", description: "Curated onchain strategies for stable yield.", category: "Yield", network: "Ethereum", url: "https://yearn.fi", logoUrl: "https://icons.llama.fi/yearn-finance.jpg" },
  { id: "lido", name: "Lido", description: "Liquid staking for Ethereum with daily rewards.", category: "Staking", network: "Ethereum", url: "https://stake.lido.fi", logoUrl: "https://icons.llama.fi/lido.jpg" },
  { id: "rocket-pool", name: "Rocket Pool", description: "Decentralized Ethereum liquid staking protocol.", category: "Staking", network: "Ethereum", url: "https://stake.rocketpool.net", logoUrl: "https://icons.llama.fi/rocket-pool.jpg" },
  { id: "jito", name: "Jito", description: "MEV-powered liquid staking on Solana.", category: "Staking", network: "Solana", url: "https://www.jito.network", logoUrl: "https://icons.llama.fi/jito.jpg" },
  { id: "liquid-collective", name: "Liquid Collective", description: "Enterprise-grade liquid staking for Ethereum.", category: "Staking", network: "Ethereum", url: "https://liquidcollective.io", logoUrl: "" },
  { id: "symbiotic", name: "Symbiotic", description: "Shared security and restaking infrastructure.", category: "Staking", network: "Ethereum", url: "https://symbiotic.fi", logoUrl: "" },
  { id: "marinade-native", name: "Marinade Native", description: "Native Solana staking with automated validator delegation.", category: "Staking", network: "Solana", url: "https://marinade.finance", logoUrl: "" },
  { id: "sthype", name: "stHYPE", description: "Liquid staking for HYPE on Hyperliquid.", category: "Staking", network: "Hyperliquid", url: "https://sthype.fi", logoUrl: "" },
  { id: "benqi-staked-avax", name: "Benqi Staked Avax", description: "Liquid staking for AVAX on Avalanche.", category: "Staking", network: "Avalanche", url: "https://benqi.fi", logoUrl: "" },
  { id: "renzo", name: "Renzo", description: "Liquid restaking and cross-chain staking strategies.", category: "Staking", network: "Multichain", url: "https://renzoprotocol.com", logoUrl: "" },
  { id: "blazestake", name: "BlazeStake", description: "Non-custodial liquid staking for Solana.", category: "Staking", network: "Solana", url: "https://solblaze.org", logoUrl: "" },
  { id: "veno-finance", name: "Veno Finance", description: "Liquid staking across supported proof-of-stake networks.", category: "Staking", network: "Cronos", url: "https://veno.finance", logoUrl: "" },
  { id: "stakee", name: "Stakee", description: "Liquid staking for TON with stGRAM rewards.", category: "Staking", network: "TON", url: "https://app.stakee.com", logoUrl: "" },
  { id: "infrared-finance", name: "Infrared Finance", description: "Liquid staking and yield infrastructure on Berachain.", category: "Staking", network: "Berachain", url: "https://infrared.finance", logoUrl: "" },
  { id: "ankr", name: "Ankr", description: "Liquid staking tokens and multichain infrastructure.", category: "Staking", network: "Multichain", url: "https://www.ankr.com", logoUrl: "" },
  { id: "spark-savings", name: "Spark Savings", description: "Onchain savings powered by the Spark protocol.", category: "Yield", network: "Ethereum", url: "https://spark.fi", logoUrl: "" },
  { id: "convex", name: "Convex Finance", description: "Boosted Curve liquidity and staking rewards.", category: "Yield", network: "Ethereum", url: "https://www.convexfinance.com", logoUrl: "" },
  { id: "fluid-lite", name: "Fluid Lite", description: "Simplified lending and yield vaults from Fluid.", category: "Yield", network: "Ethereum", url: "https://fluid.io", logoUrl: "" },
  { id: "aster-asbnb", name: "Aster asBNB", description: "BNB liquid staking and yield through Aster.", category: "Yield", network: "BNB Smart Chain", url: "https://www.asterdex.com", logoUrl: "" },
  { id: "lulo", name: "Lulo", description: "Automated Solana lending yield routing.", category: "Yield", network: "Solana", url: "https://lulo.fi", logoUrl: "" },
  { id: "origami", name: "Origami Finance", description: "Automated leverage and yield vault strategies.", category: "Yield", network: "Ethereum", url: "https://origami.finance", logoUrl: "" },
  { id: "extra-finance", name: "Extra Finance Leverage Farming", description: "Leveraged yield farming on supported L2 networks.", category: "Yield", network: "Base", url: "https://app.extrafi.io", logoUrl: "" },
  { id: "kodiak-islands", name: "Kodiak Islands", description: "Managed liquidity positions on Berachain.", category: "Yield", network: "Berachain", url: "https://app.kodiak.finance", logoUrl: "" },
  { id: "superform", name: "Superform", description: "Cross-chain vault discovery and yield access.", category: "Yield", network: "Multichain", url: "https://www.superform.xyz", logoUrl: "" },
  { id: "lido-featured", name: "Lido", description: "Liquid staking for Ethereum with daily rewards.", category: "Featured", network: "Ethereum", url: "https://stake.lido.fi", logoUrl: "https://icons.llama.fi/lido.jpg" },
  { id: "aave-featured", name: "Aave", description: "Open-source, non-custodial liquidity protocol.", category: "Featured", network: "Ethereum", url: "https://app.aave.com", logoUrl: "https://icons.llama.fi/aave-v3.jpg" },
  { id: "uniswap-featured", name: "Uniswap", description: "Swap, earn, and build on the leading decentralized exchange.", category: "Featured", network: "Ethereum", url: "https://app.uniswap.org", logoUrl: "https://icons.llama.fi/uniswap-v3.jpg" },
  { id: "pancake-featured", name: "PancakeSwap", description: "Trade. Earn. Win. NFT.", category: "Featured", network: "BNB Smart Chain", url: "https://pancakeswap.finance", logoUrl: "https://icons.llama.fi/pancakeswap-amm-v3.jpg" },
];

export type PredictionProvider = "Hyperliquid" | "Polymarket" | "Predict.fun" | "Myriad";

export type PredictionDefinition = {
  id: string;
  title: string;
  category: "Trending" | "Crypto" | "Sports" | "Politics";
  provider: PredictionProvider;
  volume: null;
  closes: null;
  yes: null;
  no: null;
  network: string;
};

export const predictionDirectory: PredictionDefinition[] = [
  { id: "hip-btc-range", title: "Which price range will Bitcoin close in tomorrow?", category: "Crypto", provider: "Hyperliquid", volume: null, closes: null, yes: null, no: null, network: "Hyperliquid L1" },
  { id: "btc-100k", title: "Will Bitcoin trade above $100,000 this month?", category: "Trending", provider: "Polymarket", volume: null, closes: null, yes: null, no: null, network: "Polygon" },
  { id: "eth-etf", title: "Will weekly Ethereum ETF inflows stay positive?", category: "Crypto", provider: "Predict.fun", volume: null, closes: null, yes: null, no: null, network: "BNB Smart Chain" },
  { id: "championship", title: "Will the series be decided in game seven?", category: "Sports", provider: "Myriad", volume: null, closes: null, yes: null, no: null, network: "Abstract" },
  { id: "rate-cut", title: "Will the next central-bank decision cut interest rates?", category: "Politics", provider: "Polymarket", volume: null, closes: null, yes: null, no: null, network: "Polygon" },
];

export type MemeStage = "New" | "Finalizing" | "Migrated" | "Fair Mode";

export type MemeRushDefinition = {
  id: string;
  symbol: string;
  name: string;
  stage: MemeStage;
  age: string;
  holders: string;
  progress: number;
  logoUrl: string;
};

export const memeRushDirectory: MemeRushDefinition[] = [
  { id: "tst", symbol: "TST", name: "Test Token", stage: "Migrated", age: "41d", holders: "31.6K", progress: 100, logoUrl: "https://s2.coinmarketcap.com/static/img/coins/128x128/35346.png" },
  { id: "broccoli", symbol: "BROCCOLI", name: "CZ's Dog", stage: "Migrated", age: "38d", holders: "27.2K", progress: 100, logoUrl: "https://s2.coinmarketcap.com/static/img/coins/128x128/35732.png" },
  { id: "why", symbol: "WHY", name: "why", stage: "Migrated", age: "11mo", holders: "19.8K", progress: 100, logoUrl: "https://s2.coinmarketcap.com/static/img/coins/128x128/30873.png" },
  { id: "banana", symbol: "BANANA", name: "Banana For Scale", stage: "Finalizing", age: "4h", holders: "2.4K", progress: 84, logoUrl: "https://s2.coinmarketcap.com/static/img/coins/128x128/28066.png" },
  { id: "four", symbol: "FOUR", name: "Four", stage: "New", age: "18m", holders: "612", progress: 31, logoUrl: "https://logo.clearbit.com/four.meme" },
  { id: "fair", symbol: "FAIR", name: "Binance Fair Mode", stage: "Fair Mode", age: "7m", holders: "Verified users", progress: 19, logoUrl: "https://logo.clearbit.com/binance.com" },
];
