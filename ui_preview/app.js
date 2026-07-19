/* ============================================================
   Trust Wallet UI – Production Application Logic v5
   Real-time market data via CoinGecko API
   ============================================================ */

/* ─────────────── COINGECKO COIN ID MAP ─────────────── */
window.VIDEO_MATCH_MODE = false;

const COIN_ID_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  TRX: 'tron', ARB: 'arbitrum', BASE: 'base', OP: 'optimism',
  MATIC: 'matic-network', ZKSYNC: 'zksync', LTC: 'litecoin',
  DOGE: 'dogecoin', XRP: 'ripple', ADA: 'cardano', DOT: 'polkadot',
  AVAX: 'avalanche-2', LINK: 'chainlink', ATOM: 'cosmos',
  ALGO: 'algorand', XLM: 'stellar', BCH: 'bitcoin-cash',
  FIL: 'filecoin', HBAR: 'hedera-hashgraph', ICP: 'internet-computer',
  VET: 'vechain', NEAR: 'near', FTM: 'fantom', THETA: 'theta-token',
  XTZ: 'tezos', EOS: 'eos', AAVE: 'aave', MKR: 'maker', KAVA: 'kava',
  CELO: 'celo', ONE: 'harmony', ZEC: 'zcash', ETC: 'ethereum-classic',
  RON: 'ronin', SEI: 'sei-network', SUI: 'sui', APT: 'aptos',
  INJ: 'injective-protocol', OSMO: 'osmosis', TIA: 'celestia',
  DASH: 'dash', CRO: 'crypto-com-chain', BERA: 'berachain-bera',
  USDT: 'tether', USDC: 'usd-coin', TWT: 'trust-wallet-token',
  DEXE: 'dexe', ASTR: 'astar', XAUt: 'tether-gold', JLP: 'jupiter-perps-lp',
  U: 'unison', MANTA: 'manta-network', STARS: 'stargaze', JUNO: 'juno-network',
  KSM: 'kusama', MANTLE: 'mantle', SCROLL: 'scroll', LINEA: 'linea',
  BLAST: 'blast',
};

/* ─────────────── STATIC DATA ─────────────── */

const ALL_NETWORKS_DATA = [
  { sym: 'BTC', name: 'Bitcoin', popular: true },
  { sym: 'ETH', name: 'Ethereum', popular: true },
  { sym: 'SOL', name: 'Solana', popular: true },
  { sym: 'BNB', name: 'BNB Smart Chain', popular: true },
  { sym: 'TRX', name: 'Tron', popular: true },
  { sym: 'ARB', name: 'Arbitrum', popular: true },
  { sym: 'BASE', name: 'Base', popular: true },
  { sym: 'OP', name: 'Optimism' },
  { sym: 'MATIC', name: 'Polygon' },
  { sym: 'ZKSYNC', name: 'zkSync Era' },
  { sym: 'LTC', name: 'Litecoin' },
  { sym: 'DOGE', name: 'Dogecoin' },
  { sym: 'XRP', name: 'XRP Ledger' },
  { sym: 'ADA', name: 'Cardano' },
  { sym: 'DOT', name: 'Polkadot' },
  { sym: 'AVAX', name: 'Avalanche' },
  { sym: 'LINK', name: 'Chainlink' },
  { sym: 'ATOM', name: 'Cosmos' },
  { sym: 'ALGO', name: 'Algorand' },
  { sym: 'XLM', name: 'Stellar' },
  { sym: 'BCH', name: 'Bitcoin Cash' },
  { sym: 'FIL', name: 'Filecoin' },
  { sym: 'HBAR', name: 'Hedera' },
  { sym: 'ICP', name: 'Internet Computer' },
  { sym: 'VET', name: 'VeChain' },
  { sym: 'NEAR', name: 'NEAR Protocol' },
  { sym: 'FTM', name: 'Fantom' },
  { sym: 'THETA', name: 'Theta Network' },
  { sym: 'XTZ', name: 'Tezos' },
  { sym: 'EOS', name: 'EOS' },
  { sym: 'AAVE', name: 'Aave' },
  { sym: 'MKR', name: 'Maker' },
  { sym: 'KAVA', name: 'Kava' },
  { sym: 'CELO', name: 'Celo' },
  { sym: 'ONE', name: 'Harmony' },
  { sym: 'ZEC', name: 'Zcash' },
  { sym: 'ETC', name: 'Ethereum Classic' },
  { sym: 'RON', name: 'Ronin' },
  { sym: 'SEI', name: 'Sei' },
  { sym: 'SUI', name: 'Sui' },
  { sym: 'APT', name: 'Aptos' },
  { sym: 'INJ', name: 'Injective' },
  { sym: 'OSMO', name: 'Osmosis' },
  { sym: 'TIA', name: 'Celestia' },
  { sym: 'DASH', name: 'Dash' },
  { sym: 'MANTA', name: 'Manta Pacific' },
  { sym: 'MANTLE', name: 'Mantle Network' },
  { sym: 'SCROLL', name: 'Scroll' },
  { sym: 'LINEA', name: 'Linea' },
  { sym: 'BLAST', name: 'Blast' },
  { sym: 'CRO', name: 'Cronos' },
  { sym: 'BERA', name: 'Berachain' },
  { sym: 'KSM', name: 'Kusama' },
  { sym: 'ATOM', name: 'Cosmos Hub' },
  { sym: 'JUNO', name: 'Juno' },
  { sym: 'STARS', name: 'Stargaze' },
  { sym: 'OSMO', name: 'Osmosis DEX' },
  { sym: 'XLM', name: 'Stellar Lumens' },
  { sym: 'ALGO', name: 'Algorand Network' },
  { sym: 'VET', name: 'VeChain Thor' },
];

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', rate: 83.50 },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', rate: 1.00 },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', rate: 0.92 },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', rate: 0.79 },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', rate: 154.2 },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.53 },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.37 },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', rate: 0.90 },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67 },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', rate: 1.34 },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', rate: 5.05 },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', rate: 7.24 },
];

const BUY_CRYPTO = [
  { sym: 'USDT', name: 'Tether USD', network: 'BNB Smart Chain', netSym: 'BNB' },
  { sym: 'USDT', name: 'Tether USD', network: 'Ethereum', netSym: 'ETH' },
  { sym: 'USDT', name: 'Tether USD', network: 'Tron', netSym: 'TRX' },
  { sym: 'ETH', name: 'Ethereum', network: 'Ethereum', netSym: 'ETH' },
  { sym: 'BTC', name: 'Bitcoin', network: 'Bitcoin', netSym: 'BTC' },
  { sym: 'SOL', name: 'Solana', network: 'Solana', netSym: 'SOL' },
  { sym: 'BNB', name: 'BNB Smart Chain', network: 'BNB Smart Chain', netSym: 'BNB' },
];

/* Fallback data if API fails */
const FALLBACK_HOT_TOKENS = [
  { sym: 'LINK', name: 'LINK', price: '$9.29', chg: '-4.08%', mcap: '$6.75B', vol: '$555.68M', up: false, net: 'ETH' },
  { sym: 'XAUt', name: 'XAUt', price: '$4,782.65', chg: '-1.10%', mcap: '$2.68B', vol: '$86.45M', up: false, net: 'ETH' },
  { sym: 'AAVE', name: 'AAVE', price: '$103.68', chg: '-11.74%', mcap: '$1.60B', vol: '$468.30M', up: false, net: 'ETH' },
  { sym: 'DEXE', name: 'DEXE', price: '$14.48', chg: '+19.48%', mcap: '$1.21B', vol: '$48.19M', up: true, net: 'BNB' },
  { sym: 'SOL', name: 'Solana', price: '$86.16', chg: '-3.51%', mcap: '$39.5B', vol: '$2.1B', up: false, net: 'SOL' },
  { sym: 'ETH', name: 'Ethereum', price: '$2,349.84', chg: '-3.32%', mcap: '$282B', vol: '$14.2B', up: false, net: 'ETH' },
  { sym: 'BNB', name: 'BNB', price: '$630.12', chg: '-1.81%', mcap: '$91.5B', vol: '$1.8B', up: false, net: 'BNB' },
];

const FALLBACK_TOP_TRADED = [
  { sym: 'ETH', name: 'Ethereum', price: '$2,349.84', chg: '-3.32%', up: false },
  { sym: 'BNB', name: 'BNB Smart', price: '$630.12', chg: '-1.81%', up: false },
  { sym: 'SOL', name: 'Solana', price: '$86.16', chg: '-3.51%', up: false },
];

const PREDICTIONS = [
  {
    id: 1,
    title: 'Strait of Hormuz traffic returns to normal by end of April?',
    vol: '$16.74M', participants: '👥',
    provider: 'Polymarket',
    end: Date.now() + 11 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 23 * 1000,
    img: 'https://images.unsplash.com/photo-1544986581-efac02cfaa73?w=100&h=100&fit=crop'
  },
  {
    id: 2,
    title: 'Will the Iranian government last until April 30?',
    vol: '$326K', participants: '👥',
    provider: 'Polymarket',
    end: Date.now() + 11 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 23 * 1000,
    img: null
  }
];

const PERPS_DATA = [
  { sym: 'ETH', pair: 'ETHUSDT', leverage: '200x', vol: '$162.9K Vol', color: '#627EEA' },
  { sym: 'SOL', pair: 'SOLUSDT', leverage: '100x', vol: '$688K Vol', color: '#9945FF' },
  { sym: 'BTC', pair: 'BTCUSDT', leverage: '200x', vol: '$7.6K Vol', color: '#F7931A' },
];

const EARN_YIELD = [
  { sym: 'STARS', name: 'STARS', apy: '31.15%', color: '#FFD700', bg: '#1A1800' },
  { sym: 'JUNO', name: 'JUNO', apy: '27.16%', color: '#FF4B8A', bg: '#1A0010' },
  { sym: 'KSM', name: 'KSM', apy: '15.28%', color: '#fff', bg: '#1A1A1A' },
];

const HISTORY_MOCK = [
  { type: 'Received', sym: 'USDT', amt: '+1,250', time: '14m ago', status: 'Confirmed', icon: '↙', color: '#00FFA3' },
  { type: 'Swap', sym: 'ETH → USDT', amt: '0.5 ETH', time: '1h ago', status: 'Confirmed', icon: '⇄', color: '#627EEA' },
  { type: 'Sent', sym: 'USDC', amt: '-120', time: '2h ago', status: 'Pending', icon: '↗', color: '#EA3943' },
];

const WALLETS = [
  { name: 'Main Wallet 1', bal: '$0.00' },
];

const WALLET_ADDRESSES = {
  'BTC': 'bc1q7x2...rpg34e',
  'ETH': '0x93d7E...087A15',
  'SOL': '7zwDZqJ...TCjtGS',
  'BNB': '0x93d7E...087A15',
  'default': '0x93d7E...087A15'
};

/* ─────────────── STATE ─────────────── */

let currentWallet = 0;
let buyAmount = '3705';
let selectedCurrency = CURRENCIES.find(c => c.code === 'USD') || CURRENCIES[0]; // default USD
let selectedCrypto = BUY_CRYPTO[0];
let sendNetworkFilter = 'all';
let currentNetworkFilter = 'all';
let currentSearchQuery = '';
let currentTrendingFilter = 'hot';
let currentDappCategory = 'Featured';
let liveMarketData = {};   // { coinId: { price, change24h, mcap, vol24h } }
let apiPollingTimer = null;
let isApiFetching = false;

/* Syms to track live */
const TRACKED_SYMS = [
  'BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'MATIC', 'ARB', 'LINK', 'AAVE', 'DEXE',
  'USDT', 'USDC', 'XRP', 'ADA', 'DOGE', 'LTC', 'AVAX', 'OP', 'BASE', 'TWT',
  'DOT', 'ATOM', 'FTM', 'NEAR', 'INJ', 'SUI', 'APT', 'TIA', 'SEI', 'OSMO',
  'ALGO', 'XLM', 'VET', 'HBAR', 'ICP', 'FIL', 'DASH', 'ZEC', 'ETC', 'BCH',
  'XAUt', 'KSM', 'JUNO', 'STARS',
];

/* Video capture fixture data. These keep the UI faithful to the supplied Trust Wallet recording. */
const VIDEO_TOP_TRADED = [
  { sym:'ETH', name:'Ethereum', price:'$2,312.56', chg:'-1.00%', up:false },
  { sym:'BNB', name:'BNB Smart Chain', price:'$636.28', chg:'-0.48%', up:false },
  { sym:'XAUt', name:'Tether Gold', price:'$4,692.15', chg:'+0.13%', up:true },
  { sym:'BTC', name:'Bitcoin', price:'$63,842.10', chg:'+1.42%', up:true },
  { sym:'USDT', name:'Tether', price:'$1.00', chg:'+0.01%', up:true },
  { sym:'SOL', name:'Solana', price:'$146.38', chg:'+3.12%', up:true },
  { sym:'XRP', name:'XRP', price:'$0.61', chg:'+2.07%', up:true },
  { sym:'USDC', name:'USD Coin', price:'$1.00', chg:'+0.00%', up:true },
  { sym:'DOGE', name:'Dogecoin', price:'$0.16', chg:'-0.74%', up:false },
  { sym:'TRX', name:'TRON', price:'$0.12', chg:'+1.24%', up:true },
  { sym:'ADA', name:'Cardano', price:'$0.45', chg:'-0.58%', up:false },
  { sym:'AVAX', name:'Avalanche', price:'$28.77', chg:'+2.26%', up:true },
  { sym:'LINK', name:'Chainlink', price:'$14.82', chg:'+0.94%', up:true },
  { sym:'DOT', name:'Polkadot', price:'$6.82', chg:'-0.22%', up:false },
  { sym:'NEAR', name:'NEAR', price:'$5.74', chg:'+2.62%', up:true },
  { sym:'APT', name:'Aptos', price:'$9.84', chg:'-0.66%', up:false },
  { sym:'SUI', name:'Sui', price:'$1.48', chg:'+5.09%', up:true },
  { sym:'ATOM', name:'Cosmos', price:'$8.27', chg:'+0.31%', up:true },
  { sym:'LTC', name:'Litecoin', price:'$82.43', chg:'+0.73%', up:true },
  { sym:'AAVE', name:'Aave', price:'$103.68', chg:'+2.43%', up:true },
  { sym:'ARB', name:'Arbitrum', price:'$1.12', chg:'+1.59%', up:true },
  { sym:'OP', name:'Optimism', price:'$2.71', chg:'-0.93%', up:false },
  { sym:'MATIC', name:'Polygon', price:'$0.71', chg:'-0.37%', up:false },
  { sym:'BCH', name:'Bitcoin Cash', price:'$496.35', chg:'+4.21%', up:true },
  { sym:'HBAR', name:'Hedera', price:'$0.098', chg:'+2.82%', up:true },
  { sym:'TON', name:'Toncoin', price:'$6.41', chg:'+1.88%', up:true },
  { sym:'SHIB', name:'Shiba Inu', price:'$0.0000231', chg:'-1.36%', up:false },
  { sym:'PAXG', name:'PAX Gold', price:'$4,699.22', chg:'+0.27%', up:true },
  { sym:'XLM', name:'Stellar', price:'$0.12', chg:'+0.48%', up:true },
  { sym:'ICP', name:'Internet Comp.', price:'$10.56', chg:'-1.28%', up:false },
  { sym:'ETC', name:'Ethereum Classic', price:'$28.34', chg:'+0.66%', up:true },
  { sym:'FIL', name:'Filecoin', price:'$6.15', chg:'-0.84%', up:false },
  { sym:'CRO', name:'Cronos', price:'$0.13', chg:'+1.76%', up:true },
  { sym:'PEPE', name:'Pepe', price:'$0.0000108', chg:'-3.14%', up:false },
  { sym:'XMR', name:'Monero', price:'$142.08', chg:'+0.42%', up:true },
  { sym:'TAO', name:'Bittensor', price:'$422.19', chg:'+6.84%', up:true },
  { sym:'ONDO', name:'Ondo', price:'$0.97', chg:'+2.91%', up:true },
  { sym:'RNDR', name:'Render', price:'$7.84', chg:'+3.56%', up:true },
  { sym:'MNT', name:'Mantle', price:'$0.84', chg:'+1.44%', up:true },
  { sym:'KAS', name:'Kaspa', price:'$0.16', chg:'-0.29%', up:false },
  { sym:'VET', name:'VeChain', price:'$0.034', chg:'-1.17%', up:false },
  { sym:'UNI', name:'Uniswap', price:'$8.19', chg:'+1.11%', up:true },
];

const VIDEO_TRENDING_TOKENS = [
  { sym:'WSTETH', name:'WSTETH', price:'$2,846.35', chg:'-0.73%', mcap:'$9.98B MCap', vol:'$27.10M Vol', up:false },
  { sym:'AETHWETH', name:'AETHWETH', price:'$2,315.60', chg:'-0.67%', mcap:'$5.18B MCap', vol:'$21.90M Vol', up:false },
  { sym:'XAUt', name:'XAUt', price:'$4,692.15', chg:'+0.13%', mcap:'$2.63B MCap', vol:'$181.69M Vol', up:true },
  { sym:'PAXG', name:'PAXG', price:'$4,699.22', chg:'+0.27%', mcap:'$2.26B MCap', vol:'$158.29M Vol', up:true },
  { sym:'DEXE', name:'DEXE', price:'$12.92', chg:'+1.52%', mcap:'$1.08B MCap', vol:'$36.02M Vol', up:true },
  { sym:'U', name:'U', price:'$0.9998', chg:'-0.02%', mcap:'$1.06B MCap', vol:'$171.76M Vol', up:false },
  { sym:'TRUMP', name:'TRUMP', price:'$2.86', chg:'-0.49%', mcap:'$664.59M MCap', vol:'$273.0M Vol', up:false },
  { sym:'PUMP', name:'PUMP', price:'$0.001778', chg:'-1.30%', mcap:'$590.31M MCap', vol:'$43.07M Vol', up:false },
  { sym:'PENGU', name:'PENGU', price:'$0.008347', chg:'-1.31%', mcap:'$524.67M MCap', vol:'$167.08M Vol', up:false },
  { sym:'VIRTUAL', name:'VIRTUAL', price:'$0.7006', chg:'-0.05%', mcap:'$459.80M MCap', vol:'$63.38M Vol', up:false },
  { sym:'VVV', name:'VVV', price:'$8.76', chg:'+2.40%', mcap:'$403.39M MCap', vol:'$8.56M Vol', up:true },
  { sym:'AERO', name:'AERO', price:'$0.4226', chg:'-2.78%', mcap:'$391.40M MCap', vol:'$15.70M Vol', up:false },
  { sym:'H', name:'H', price:'$0.1395', chg:'-2.14%', mcap:'$365.68M MCap', vol:'$32.65M Vol', up:false },
  { sym:'BINANCE_LIFE', name:'币安人生', price:'$0.3351', chg:'-9.54%', mcap:'$335.09M MCap', vol:'$34.13M Vol', up:false },
  { sym:'KITE', name:'KITE', price:'$0.1460', chg:'-5.86%', mcap:'$262.81M MCap', vol:'$45.57M Vol', up:false },
  { sym:'CYS', name:'CYS', price:'$0.5155', chg:'+0.01%', mcap:'$246.45M MCap', vol:'$8.18M Vol', up:true },
  { sym:'FARTCOIN', name:'Fartcoin', price:'$0.1987', chg:'-1.17%', mcap:'$198.66M MCap', vol:'$19.63M Vol', up:false },
  { sym:'SKYAI', name:'SKYAI', price:'$0.1951', chg:'-13.60%', mcap:'$195.07M MCap', vol:'$24.64M Vol', up:false },
  { sym:'APXUSD', name:'apxUSD', price:'$1.0000', chg:'-0.00%', mcap:'$194.98M MCap', vol:'$10.11M Vol', up:false },
  { sym:'CHIP', name:'CHIP', price:'$0.0869', chg:'-19.44%', mcap:'$173.72M MCap', vol:'$1.11B Vol', up:false },
  { sym:'FF', name:'FF', price:'$0.0722', chg:'+0.24%', mcap:'$169.01M MCap', vol:'$17.74M Vol', up:true },
  { sym:'CRCLX', name:'CRCLX', price:'$99.46', chg:'-0.89%', mcap:'$168.63M MCap', vol:'$19.89M Vol', up:false },
  { sym:'RIVER', name:'RIVER', price:'$6.60', chg:'+11.32%', mcap:'$129.26M MCap', vol:'$54.52M Vol', up:true },
  { sym:'UB', name:'UB', price:'$0.0465', chg:'-11.12%', mcap:'$116.20M MCap', vol:'$43.98M Vol', up:false },
  { sym:'DBT', name:'DBT', price:'$0.1139', chg:'+0.08%', mcap:'$113.87M MCap', vol:'$7.49M Vol', up:true },
  { sym:'SKR', name:'SKR', price:'$0.0198', chg:'+29.95%', mcap:'$104.70M MCap', vol:'$150.4M Vol', up:true },
  { sym:'COLLECT', name:'COLLECT', price:'$0.0341', chg:'-0.18%', mcap:'$102.27M MCap', vol:'$4.89M Vol', up:false },
  { sym:'BANANA', name:'BANANA', price:'$0.009080', chg:'-10.75%', mcap:'$90.80M MCap', vol:'$22.94M Vol', up:false },
  { sym:'TSLAX', name:'TSLAX', price:'$375.32', chg:'+0.47%', mcap:'$84.56M MCap', vol:'$38.08M Vol', up:true },
  { sym:'SOON', name:'SOON', price:'$0.1779', chg:'-9.05%', mcap:'$82.05M MCap', vol:'$882.30K Vol', up:false },
  { sym:'RTX', name:'RTX', price:'$1.50', chg:'+0.01%', mcap:'$75.36M MCap', vol:'$6.29M Vol', up:true },
  { sym:'ST', name:'ST', price:'$0.0627', chg:'-0.11%', mcap:'$62.52M MCap', vol:'$3.91M Vol', up:false },
  { sym:'BAS', name:'BAS', price:'$0.0187', chg:'+3.72%', mcap:'$46.67M MCap', vol:'$20.27M Vol', up:true },
  { sym:'ZBT', name:'ZBT', price:'$0.1462', chg:'+27.27%', mcap:'$40.82M MCap', vol:'$97.82M Vol', up:true },
  { sym:'Q', name:'Q', price:'$0.0105', chg:'+4.15%', mcap:'$39.68M MCap', vol:'$12.23M Vol', up:true },
  { sym:'MUSD', name:'mUSD', price:'$0.9997', chg:'-0.04%', mcap:'$32.75M MCap', vol:'$10.04M Vol', up:false },
  { sym:'RAVE', name:'RAVE', price:'$0.9299', chg:'-0.12%', mcap:'$30.54M MCap', vol:'$30.25M Vol', up:false },
  { sym:'C', name:'C', price:'$0.0861', chg:'-3.40%', mcap:'$29.29M MCap', vol:'$24.11M Vol', up:false },
  { sym:'PIPPIN', name:'pippin', price:'$0.0276', chg:'+10.07%', mcap:'$27.58M MCap', vol:'$9.80M Vol', up:true },
  { sym:'FOLKS', name:'FOLKS', price:'$1.45', chg:'-0.05%', mcap:'$21.04M MCap', vol:'$5.57M Vol', up:false },
  { sym:'IN', name:'IN', price:'$0.0673', chg:'+6.97%', mcap:'$20.89M MCap', vol:'$12.97M Vol', up:true },
  { sym:'ARIA', name:'ARIA', price:'$0.0659', chg:'-4.92%', mcap:'$20.59M MCap', vol:'$5.89M Vol', up:false },
  { sym:'ON', name:'ON', price:'$0.1322', chg:'-10.04%', mcap:'$19.07M MCap', vol:'$4.45M Vol', up:false },
  { sym:'MAGA', name:'MAGA', price:'$0.0192', chg:'+0.16%', mcap:'$18.76M MCap', vol:'$2.61M Vol', up:true },
  { sym:'LIBRA', name:'Libra', price:'$0.0181', chg:'-0.11%', mcap:'$18.13M MCap', vol:'$7.36M Vol', up:false },
  { sym:'PRL', name:'PRL', price:'$0.2073', chg:'+0.05%', mcap:'$18.07M MCap', vol:'$2.78M Vol', up:true },
  { sym:'BSB', name:'BSB', price:'$0.4322', chg:'+0.08%', mcap:'$17.74M MCap', vol:'$16.10M Vol', up:true },
  { sym:'CLO', name:'CLO', price:'$0.1351', chg:'+7.65%', mcap:'$17.45M MCap', vol:'$4.87M Vol', up:true },
  { sym:'CLO', name:'CLO', price:'$0.1351', chg:'+7.65%', mcap:'$17.45M MCap', vol:'$4.87M Vol', up:true },
  { sym:'PYBOBO', name:'PYBOBO', price:'$0.0007363', chg:'-3.81%', mcap:'$17.27M MCap', vol:'$5.28M Vol', up:false },
  { sym:'ZEREBRO', name:'ZEREBRO', price:'$0.0168', chg:'+7.13%', mcap:'$16.83M MCap', vol:'$13.30M Vol', up:true },
  { sym:'ARTX', name:'ARTX', price:'$0.2177', chg:'-0.07%', mcap:'$15.95M MCap', vol:'$6.48M Vol', up:false },
  { sym:'BELIEF', name:'BELIEF', price:'$0.0148', chg:'+0.06%', mcap:'$13.91M MCap', vol:'$3.03M Vol', up:true },
  { sym:'TRADOOR', name:'TRADOOR', price:'$0.8884', chg:'-89.13%', mcap:'$12.75M MCap', vol:'$203.51M Vol', up:false },
  { sym:'SPIKE', name:'SPIKE', price:'$0.0127', chg:'+0.30%', mcap:'$12.70M MCap', vol:'$2.16M Vol', up:true },
  { sym:'FLORK', name:'FLORK', price:'$0.00001205', chg:'+1.07%', mcap:'$12.05M MCap', vol:'$10.53M Vol', up:true },
  { sym:'BLESS', name:'BLESS', price:'$0.006173', chg:'-3.73%', mcap:'$11.99M MCap', vol:'$10.81M Vol', up:false },
  { sym:'MEXICANUNC', name:'mexicanunc', price:'$0.0117', chg:'+4672.61%', mcap:'$11.74M MCap', vol:'$21.19M Vol', up:true },
  { sym:'CR7', name:'CR7', price:'$0.0117', chg:'+4107.65%', mcap:'$11.67M MCap', vol:'$8.42M Vol', up:true },
  { sym:'BURNIE', name:'BURNIE', price:'$0.0118', chg:'+0.70%', mcap:'$11.40M MCap', vol:'$6.67M Vol', up:true },
  { sym:'AIA', name:'AIA', price:'$0.0596', chg:'-1.36%', mcap:'$11.25M MCap', vol:'$11.38M Vol', up:false },
  { sym:'OPG', name:'OPG', price:'$0.2756', chg:'-0.15%', mcap:'$10.36M MCap', vol:'$15.07M Vol', up:false },
  { sym:'SENT', name:'SENT', price:'$0.0192', chg:'-0.07%', mcap:'$8.58M MCap', vol:'$3.42M Vol', up:false },
  { sym:'ZAMA', name:'ZAMA', price:'$0.0333', chg:'+0.18%', mcap:'$8.24M MCap', vol:'$8.19M Vol', up:true },
  { sym:'AKE', name:'AKE', price:'$0.0003546', chg:'-7.73%', mcap:'$8.08M MCap', vol:'$4.56M Vol', up:false },
  { sym:'UNC', name:'unc', price:'$0.007703', chg:'+0.11%', mcap:'$7.70M MCap', vol:'$2.33M Vol', up:true },
  { sym:'BASED', name:'BASED', price:'$0.1238', chg:'-0.09%', mcap:'$6.55M MCap', vol:'$19.04M Vol', up:false },
  { sym:'STRIKE', name:'STRIKE', price:'$0.0301', chg:'+24.13%', mcap:'$6.32M MCap', vol:'$3.22M Vol', up:true },
  { sym:'IR', name:'IR', price:'$0.0282', chg:'-29.96%', mcap:'$5.79M MCap', vol:'$13.07M Vol', up:false },
  { sym:'ROBO', name:'ROBO', price:'$0.0239', chg:'+0.17%', mcap:'$4.75M MCap', vol:'$11.36M Vol', up:true },
  { sym:'EDGE', name:'EDGE', price:'$1.46', chg:'+0.04%', mcap:'$4.74M MCap', vol:'$2.32M Vol', up:true },
  { sym:'ASTEROID', name:'ASTEROID', price:'$0.004331', chg:'+0.84%', mcap:'$4.33M MCap', vol:'$2.77M Vol', up:true },
  { sym:'POWER', name:'POWER', price:'$0.0963', chg:'+0.04%', mcap:'$4.04M MCap', vol:'$2.76M Vol', up:true },
  { sym:'TOKEN', name:'TOKEN', price:'$0.003473', chg:'+17.68%', mcap:'$3.47M MCap', vol:'$7.55M Vol', up:true },
  { sym:'AIB', name:'AIB', price:'$0.002960', chg:'-0.38%', mcap:'$2.96M MCap', vol:'$16.53M Vol', up:false },
  { sym:'OPENAI', name:'OPENAI', price:'$1,431.10', chg:'-0.09%', mcap:'$2.24M MCap', vol:'$3.89M Vol', up:false },
  { sym:'SPACE', name:'SPACE', price:'$0.006502', chg:'+0.02%', mcap:'$1.82M MCap', vol:'$2.05M Vol', up:true },
  { sym:'NEURALINK', name:'NEURALINK', price:'$346.47', chg:'-0.00%', mcap:'$1.73M MCap', vol:'$6.77M Vol', up:false },
  { sym:'INX', name:'INX', price:'$0.009659', chg:'+0.06%', mcap:'$1.62M MCap', vol:'$4.20M Vol', up:true },
  { sym:'SAM', name:'SAM', price:'$0.001400', chg:'+2.69%', mcap:'$1.40M MCap', vol:'$2.51M Vol', up:true },
  { sym:'DGRAM', name:'DGRAM', price:'$0.0004947', chg:'-0.23%', mcap:'$1.25M MCap', vol:'$2.98M Vol', up:false },
];

const EXTRA_VIDEO_TRENDING_TOKENS = [
  { sym:'LQX', name:'LQX', price:'$0.0824', chg:'+1.84%', mcap:'$1.18M MCap', vol:'$1.91M Vol', up:true },
  { sym:'NOVA', name:'NOVA', price:'$0.0146', chg:'-3.21%', mcap:'$1.12M MCap', vol:'$842.10K Vol', up:false },
  { sym:'ORBIT', name:'ORBIT', price:'$0.2035', chg:'+6.42%', mcap:'$1.08M MCap', vol:'$3.42M Vol', up:true },
  { sym:'KILO', name:'KILO', price:'$0.0579', chg:'-1.12%', mcap:'$1.04M MCap', vol:'$1.73M Vol', up:false },
  { sym:'MINT', name:'MINT', price:'$0.009281', chg:'+0.94%', mcap:'$996.40K MCap', vol:'$1.27M Vol', up:true },
  { sym:'WAVE', name:'WAVE', price:'$0.1175', chg:'-4.44%', mcap:'$972.18K MCap', vol:'$2.04M Vol', up:false },
  { sym:'DASHX', name:'DASHX', price:'$0.6312', chg:'+2.05%', mcap:'$948.73K MCap', vol:'$4.86M Vol', up:true },
  { sym:'MOBY', name:'MOBY', price:'$0.0225', chg:'-0.71%', mcap:'$925.21K MCap', vol:'$701.20K Vol', up:false },
  { sym:'ALPHAO', name:'AlphaO', price:'$0.0743', chg:'+9.11%', mcap:'$903.42K MCap', vol:'$2.88M Vol', up:true },
  { sym:'PRISM', name:'PRISM', price:'$0.3057', chg:'-8.27%', mcap:'$884.63K MCap', vol:'$3.14M Vol', up:false },
  { sym:'SORAI', name:'SORAI', price:'$0.005845', chg:'+13.45%', mcap:'$860.52K MCap', vol:'$1.98M Vol', up:true },
  { sym:'HALO', name:'HALO', price:'$0.1684', chg:'-2.03%', mcap:'$844.70K MCap', vol:'$1.35M Vol', up:false },
  { sym:'MYTH', name:'MYTH', price:'$0.0413', chg:'+0.62%', mcap:'$826.91K MCap', vol:'$914.77K Vol', up:true },
  { sym:'TIDE', name:'TIDE', price:'$0.0946', chg:'-5.18%', mcap:'$802.16K MCap', vol:'$2.47M Vol', up:false },
  { sym:'QUARK', name:'QUARK', price:'$0.0128', chg:'+3.36%', mcap:'$784.39K MCap', vol:'$1.12M Vol', up:true },
  { sym:'NIM', name:'NIM', price:'$0.4338', chg:'-0.56%', mcap:'$768.84K MCap', vol:'$2.61M Vol', up:false },
  { sym:'EON', name:'EON', price:'$1.2810', chg:'+4.88%', mcap:'$744.10K MCap', vol:'$5.42M Vol', up:true },
  { sym:'PIX', name:'PIX', price:'$0.003472', chg:'-9.04%', mcap:'$721.67K MCap', vol:'$1.46M Vol', up:false },
  { sym:'KODA', name:'KODA', price:'$0.0588', chg:'+7.21%', mcap:'$699.12K MCap', vol:'$1.72M Vol', up:true },
  { sym:'GIGA', name:'GIGA', price:'$0.8142', chg:'-1.66%', mcap:'$675.48K MCap', vol:'$2.08M Vol', up:false },
  { sym:'LUNAQ', name:'LUNAQ', price:'$0.0259', chg:'+5.04%', mcap:'$648.37K MCap', vol:'$980.11K Vol', up:true },
  { sym:'VELA', name:'VELA', price:'$0.3184', chg:'-6.28%', mcap:'$626.92K MCap', vol:'$2.77M Vol', up:false },
  { sym:'RIFT', name:'RIFT', price:'$0.0871', chg:'+1.17%', mcap:'$604.26K MCap', vol:'$1.03M Vol', up:true },
  { sym:'OPAL', name:'OPAL', price:'$0.006129', chg:'-2.42%', mcap:'$582.75K MCap', vol:'$711.96K Vol', up:false },
  { sym:'ZION', name:'ZION', price:'$0.1496', chg:'+8.63%', mcap:'$560.84K MCap', vol:'$1.94M Vol', up:true },
  { sym:'AURX', name:'AURX', price:'$1.9044', chg:'-0.22%', mcap:'$538.09K MCap', vol:'$3.62M Vol', up:false },
  { sym:'DRIFTX', name:'DRIFTX', price:'$0.0467', chg:'+2.70%', mcap:'$519.36K MCap', vol:'$908.34K Vol', up:true },
  { sym:'BLINK', name:'BLINK', price:'$0.01074', chg:'-7.76%', mcap:'$498.72K MCap', vol:'$1.55M Vol', up:false },
  { sym:'MESH', name:'MESH', price:'$0.2221', chg:'+10.24%', mcap:'$476.40K MCap', vol:'$2.11M Vol', up:true },
  { sym:'FUSEX', name:'FUSEX', price:'$0.0312', chg:'-3.58%', mcap:'$454.22K MCap', vol:'$1.22M Vol', up:false },
  { sym:'ECHO', name:'ECHO', price:'$0.0728', chg:'+0.44%', mcap:'$432.10K MCap', vol:'$694.81K Vol', up:true },
  { sym:'GLOW', name:'GLOW', price:'$0.0189', chg:'-11.32%', mcap:'$417.54K MCap', vol:'$1.90M Vol', up:false },
  { sym:'MAV', name:'MAV', price:'$0.2950', chg:'+3.14%', mcap:'$401.87K MCap', vol:'$1.41M Vol', up:true },
  { sym:'NODEX', name:'NODEX', price:'$0.005391', chg:'-1.91%', mcap:'$388.24K MCap', vol:'$509.17K Vol', up:false },
  { sym:'YAK', name:'YAK', price:'$1.1407', chg:'+12.06%', mcap:'$372.88K MCap', vol:'$2.65M Vol', up:true },
  { sym:'TANGO', name:'TANGO', price:'$0.0266', chg:'-4.70%', mcap:'$360.29K MCap', vol:'$1.02M Vol', up:false },
  { sym:'ARC', name:'ARC', price:'$0.0915', chg:'+2.38%', mcap:'$344.51K MCap', vol:'$876.50K Vol', up:true },
  { sym:'GLINT', name:'GLINT', price:'$0.004812', chg:'-0.84%', mcap:'$331.20K MCap', vol:'$412.33K Vol', up:false },
  { sym:'POLAR', name:'POLAR', price:'$0.6118', chg:'+6.90%', mcap:'$318.74K MCap', vol:'$1.76M Vol', up:true },
  { sym:'CIRRUS', name:'CIRRUS', price:'$0.0135', chg:'-8.02%', mcap:'$306.96K MCap', vol:'$943.75K Vol', up:false },
  { sym:'BYTE', name:'BYTE', price:'$0.0378', chg:'+1.42%', mcap:'$294.03K MCap', vol:'$615.27K Vol', up:true },
  { sym:'NEXA', name:'NEXA', price:'$0.1786', chg:'-2.98%', mcap:'$282.66K MCap', vol:'$1.11M Vol', up:false },
  { sym:'TORQ', name:'TORQ', price:'$0.007864', chg:'+14.82%', mcap:'$270.88K MCap', vol:'$1.38M Vol', up:true },
  { sym:'KAPPA', name:'KAPPA', price:'$0.0532', chg:'-6.14%', mcap:'$259.19K MCap', vol:'$821.66K Vol', up:false },
  { sym:'NOVAI', name:'Novai', price:'$0.4120', chg:'+0.73%', mcap:'$248.47K MCap', vol:'$1.27M Vol', up:true },
  { sym:'EMBER', name:'EMBER', price:'$0.0157', chg:'-1.08%', mcap:'$236.75K MCap', vol:'$584.92K Vol', up:false },
  { sym:'FLUXA', name:'FLUXA', price:'$0.2294', chg:'+4.11%', mcap:'$224.06K MCap', vol:'$1.05M Vol', up:true },
  { sym:'SNOW', name:'SNOW', price:'$0.008312', chg:'-12.34%', mcap:'$213.54K MCap', vol:'$978.64K Vol', up:false },
  { sym:'MORPH', name:'MORPH', price:'$0.0641', chg:'+2.86%', mcap:'$201.83K MCap', vol:'$742.21K Vol', up:true },
  { sym:'DELTA7', name:'DELTA7', price:'$0.3417', chg:'-0.49%', mcap:'$190.27K MCap', vol:'$1.66M Vol', up:false },
  { sym:'IONX', name:'IONX', price:'$0.01106', chg:'+9.54%', mcap:'$178.40K MCap', vol:'$884.39K Vol', up:true },
  { sym:'SKYR', name:'SKYR', price:'$0.0245', chg:'-3.63%', mcap:'$166.79K MCap', vol:'$501.77K Vol', up:false },
  { sym:'CLOUD', name:'CLOUD', price:'$0.1491', chg:'+5.32%', mcap:'$154.12K MCap', vol:'$931.42K Vol', up:true },
  { sym:'RUNEQ', name:'RUNEQ', price:'$0.006804', chg:'-2.27%', mcap:'$143.55K MCap', vol:'$620.03K Vol', up:false },
  { sym:'AXIS', name:'AXIS', price:'$0.0927', chg:'+7.03%', mcap:'$132.97K MCap', vol:'$804.18K Vol', up:true },
  { sym:'MIRR', name:'MIRR', price:'$0.0174', chg:'-5.75%', mcap:'$121.28K MCap', vol:'$466.89K Vol', up:false },
];

VIDEO_TRENDING_TOKENS.push(...EXTRA_VIDEO_TRENDING_TOKENS);

const SELECT_SYMBOL_TOKENS = [
  { sym:'ASTER', name:'ASTER', lev:'x200', vol:'28.7M', price:'$0.6694', chg:'-0.14', up:false },
  { sym:'BTC', name:'BTC', lev:'x200', vol:'938.2M', price:'$78,232.5', chg:'+0.64', up:true },
  { sym:'ETH', name:'ETH', lev:'x200', vol:'374.9M', price:'$2,329.22', chg:'-0.04', up:false },
  { sym:'BNB', name:'BNB', lev:'x200', vol:'15.9M', price:'$639.09', chg:'+0.74', up:true },
  { sym:'SOL', name:'SOL', lev:'x100', vol:'52.9M', price:'$86.53', chg:'+0.67', up:true },
  { sym:'XRP', name:'XRP', lev:'x100', vol:'15.2M', price:'$1.4399', chg:'+1.65', up:true },
  { sym:'DOGE', name:'DOGE', lev:'x25', vol:'16.9M', price:'$0.09842', chg:'+1.99', up:true },
  { sym:'HYPE', name:'HYPE', lev:'x300', vol:'7.6M', price:'$41.072', chg:'-0.18', up:false },
  { sym:'ADA', name:'ADA', lev:'x75', vol:'180.8K', price:'$0.2512', chg:'+1.57', up:true },
  { sym:'CLO', name:'CLO', lev:'x50', vol:'47.5K', price:'$0.13520', chg:'-0.56', up:false },
  { sym:'RECALL', name:'RECALL', lev:'x40', vol:'18.8K', price:'$0.04914', chg:'+5.83', up:true },
  { sym:'ZBT', name:'ZBT', lev:'x50', vol:'9.5K', price:'$0.11967', chg:'+8.37', up:true },
  { sym:'LAB', name:'LAB', lev:'x40', vol:'602.7K', price:'$0.74674', chg:'+9.84', up:true },
  { sym:'RIVER', name:'RIVER', lev:'x20', vol:'121.6K', price:'$6.307', chg:'+7.42', up:true },
  { sym:'BLUAI', name:'BLUAI', lev:'x10', vol:'70.7K', price:'$0.010495', chg:'-7.56', up:false },
  { sym:'TURTLE', name:'TURTLE', lev:'x50', vol:'46.1K', price:'$0.04658', chg:'-1.82', up:false },
  { sym:'APR', name:'APR', lev:'x50', vol:'9.4K', price:'$0.17556', chg:'+0.61', up:true },
  { sym:'ON', name:'ON', lev:'x50', vol:'25.5K', price:'$0.13890', chg:'-26.95', up:false },
  { sym:'BASED', name:'BASED', lev:'x50', vol:'60.8K', price:'$0.13101', chg:'-2.42', up:false },
  { sym:'AIOT', name:'AIOT', lev:'x20', vol:'7K', price:'$0.04489', chg:'+4.22', up:true },
  { sym:'SWARMS', name:'SWARMS', lev:'x20', vol:'13.6K', price:'$0.018773', chg:'+5.87', up:true },
  { sym:'BTCDOM', name:'BTCDOM', lev:'x20', vol:'1.2K', price:'$5,451.2', chg:'+0.67', up:true },
  { sym:'GENIUS', name:'GENIUS', lev:'x20', vol:'5.1M', price:'$0.6354', chg:'-11.66', up:false },
];

const DAPP_CATEGORIES = {
  Featured: [
    ['Aave','Aave is an Open Source and Non-Custodial liquidity protocol.','A'],
    ['Aster','Decentralized perpetual contracts. Multi-chain liquidity.','A'],
    ['Four','FOUR.meme is a go-to platform for easy meme launches.','4'],
  ],
  DEX: [
    ['Meteora','Liquidity infrastructure for Solana decentralized finance.','M'],
    ['Aerodrome','The central trading and liquidity marketplace.','A'],
    ['Balancer','Automated portfolio manager and trading protocol.','B'],
    ['Camelot','Camelot is a highly efficient DEX that supports Arbitrum.','C'],
    ['Momentum','Sui DeFi liquidity engine.','M'],
    ['Sushi','A leading multi-chain DEX deployed across networks.','S'],
    ['Pump Swap','The native dex for pump.fun.','P'],
    ['SUN','First integrated platform for stable swaps.','S'],
    ['1inch.io','Token Swap Aggregator.','1'],
    ['Trader Joe','Trader Joe is powered by the Liquidity Book.','J'],
  ],
  Lending: [
    ['Ethena','Yield-bearing, delta-neutral synthetic dollar protocol.','E'],
    ['PancakeSwap','The flippening coming. Stack SYRUP and earn.','P'],
    ['Convex Finance','Deposit liquidity, earn boosted rewards.','C'],
    ['Beefy','The Multichain Yield Optimizer.','B'],
    ['Summer.fi','Borrow, Multiply and Earn on the assets you hold.','S'],
    ['Harvest Finance','A community-built platform for DeFi yields.','H'],
    ['yearn.finance','Decentralized finance platform for yield.','Y'],
    ['InstaDApp','Bring DeFi to the masses.','I'],
    ['MakerDAO','Builders of Dai, a digital currency.','M'],
  ],
  Yield: [
    ['Ethena','Yield-bearing, delta-neutral synthetic dollar protocol.','E'],
    ['PancakeSwap','The flippening is coming. Stack $CAKE and earn.','P'],
    ['Convex Finance','Deposit liquidity, earn boosted rewards.','C'],
    ['Beefy','The Multichain Yield Optimizer.','B'],
    ['Summer.fi','Borrow, Multiply and Earn on the assets you hold.','S'],
    ['Harvest Finance','A community-built platform for DeFi yields.','H'],
    ['yearn.finance','Decentralized finance (DeFi) platform.','Y'],
    ['InstaDApp','Bring DeFi to the masses.','I'],
    ['MakerDAO','Builders of Dai, a digital currency that anyone can use.','M'],
  ],
  BSC: [
    ['PancakeSwap','The leading DEX and yield marketplace on BSC.','P'],
    ['Venus','A decentralized marketplace for lenders and borrowers.','V'],
    ['Alpaca Finance','Leveraged yield farming on BNB Chain.','A'],
  ],
  Solana: [
    ['Sanctum','Solana liquid staking and restaking.','S'],
    ['Raydium','An on-chain order book AMM powering swaps.','R'],
    ['Jito','MEV-Boosted Staking Rewards.','J'],
    ['Orca','Orca is the easiest way to exchange tokens.','O'],
    ['Marginfi','Connecting liquidity across DeFi.','M'],
    ['Jupiter Exchange','A cutting-edge platform offering a routing engine.','J'],
    ['Kamino Finance',"Solana's lending, liquidity & leverage platform.",'K'],
    ['Pump.Fun','PUMP.FUN is a lively platform for coin launches.','P'],
  ],
  Sonic: [
    ['Aave','Aave is an Open Source and Non-Custodial liquidity protocol.','A'],
    ['Pendle','Pendle Finance is a protocol that enables yield trading.','P'],
    ['Veda','Veda is the leading DeFi vault platform.','V'],
    ['Silo','Silo Finance creates permissionless lending markets.','S'],
    ['Beets','The Flagship LST Hub on Sonic. From Beets.','B'],
    ['Rings','Rings is a meta-stablecoin for USD liquidity.','R'],
    ['Avalon Labs','The Liquidity Hub For BTC LSDFi and lending.','A'],
  ],
  'Liquid Staking': [
    ['Binance staked ETH','Stake ETH and get WBETH as the tokenized reward.','B'],
    ['Rocket Pool','Decentralised Ethereum Staking Protocol.','R'],
    ['Jito','MEV-Boosted Staking Rewards.','J'],
    ['Stader','Non-custodial & secure liquid staking.','S'],
    ['Marinade','The easiest way to stake Solana - liquid staking.','M'],
    ['Frax Ether','Frax Ether is a liquid ETH staking derivative.','F'],
    ['Veno Finance','Easy and reliable liquid staking on multiple chains.','V'],
    ['pStake','Securely liquid stake the biggest crypto assets.','P'],
    ['Lido Staking','The Lido Ethereum Liquid Staking Protocol.','L'],
  ],
  Marketplaces: [
    ['Blur','The NFT marketplace for pro traders.','B'],
    ['Magic Eden','The NFT Marketplace Solana deserves.','M'],
    ['Element Market','The first community-driven aggregator marketplace.','E'],
    ['LooksRare','LooksRare is a next generation NFT marketplace.','L'],
    ['AirNFTs','NFT marketplace built on Binance Smart Chain.','A'],
    ['Rarible','NFT Marketplace. Turn your products into NFTs.','R'],
    ['OpenSea','Peer-to-peer marketplace for rare digital items.','O'],
  ],
  Social: [
    ['Phi','Build your web3 cities from your wallet activity.','P'],
    ['Lens Protocol','Designed to empower creators to own their graph.','L'],
    ['Galxe','Galxe is the leading Web3 infrastructure network.','G'],
    ['QuestN','A Quest protocol dedicated to ID and growth.','Q'],
    ['Playbux','Seamless connectivity to reality, blockchain and games.','P'],
    ['Morpho','Morpho is an on-chain peer-to-peer lending layer.','M'],
    ['Justlend','JustLend is a TRON-powered coin market.','J'],
    ['Venus','A decentralized marketplace for lending.','V'],
    ['ZeroLend','ZeroLend is a powerful decentralized lending market.','Z'],
    ['Cream','C.R.E.A.M. Finance is a decentralized lending protocol.','C'],
    ['Spark Lend','Spark is an at-scale stablecoin allocation market.','S'],
    ['Maple Finance','Institutional DeFi lending and growth.','M'],
    ['Compound Finance','Compound is an algorithmic autonomous protocol.','C'],
    ['Kamino Finance','Solana lending, liquidity and leverage.','K'],
    ['Instadapp','Bring DeFi to the masses.','I'],
  ],
  Games: [
    ['Alien Worlds','Innovative Metaverse where explorers compete.','A'],
    ['Axie Infinity','Collecting, raising, and battling fantasy creatures.','A'],
    ['CARV','Building the largest Modular identity layer.','C'],
  ],
};

const VIDEO_NETWORKS = [
  ['ARB','Arbitrum'], ['BASE','Base'], ['ACALA','Acala'], ['ACAEVM','Acala EVM'],
  ['AE','Aeternity'], ['AGORIC','Agoric'], ['AION','Aion'], ['AKT','Akash'],
  ['ALGO','Algorand'], ['VET','VeChain'], ['VIA','Viacoin'], ['VIC','Viction'],
  ['WAN','Wanchain'], ['WAVES','Waves'], ['XRP','XRP'], ['ZEC','Zcash'],
  ['ZETA','Zeta EVM'], ['ZIL','Zilliqa'], ['ZKLINK','zkLink Nova Mainnet'],
];

VIDEO_NETWORKS.forEach(([sym, name]) => {
  if (!ALL_NETWORKS_DATA.some(n => n.name === name)) ALL_NETWORKS_DATA.push({ sym, name });
});

/* ─────────────── CoinGecko API ─────────────── */

async function fetchMarketData() {
  if (isApiFetching) return;
  isApiFetching = true;
  try {
    const ids = TRACKED_SYMS
      .map(s => COIN_ID_MAP[s])
      .filter(Boolean)
      .join(',');

    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    /* Build reverse id→sym map */
    const idToSym = {};
    for (const [sym, id] of Object.entries(COIN_ID_MAP)) idToSym[id] = sym;

    data.forEach(coin => {
      const sym = idToSym[coin.id] || coin.symbol.toUpperCase();
      liveMarketData[sym] = {
        price: coin.current_price || 0,
        change24h: coin.price_change_percentage_24h || 0,
        mcap: coin.market_cap || 0,
        vol24h: coin.total_volume || 0,
        name: coin.name
      };
    });

    updateAllLiveUI();
    console.log('✅ Market data updated:', Object.keys(liveMarketData).length, 'coins');
  } catch (err) {
    console.warn('⚠️ Market data fetch failed:', err.message);
    /* Keep existing data, don't crash UI */
  } finally {
    isApiFetching = false;
  }
}

function startPolling(intervalMs = 60000) {
  fetchMarketData(); // immediate first fetch
  if (apiPollingTimer) clearInterval(apiPollingTimer);
  apiPollingTimer = setInterval(fetchMarketData, intervalMs);
}

function getLivePrice(sym) {
  const d = liveMarketData[sym];
  if (!d || !d.price) return null;
  return d.price;
}

function formatPrice(usdPrice, currency) {
  if (usdPrice === null || usdPrice === undefined) return null;
  const cur = currency || selectedCurrency;
  const converted = usdPrice * cur.rate;
  const prefix = cur.code === 'USD' ? '$' : cur.code + ' ';
  if (converted >= 1e9) return prefix + (converted / 1e9).toFixed(2) + 'B';
  if (converted >= 1e6) return prefix + (converted / 1e6).toFixed(2) + 'M';
  if (converted >= 1000) return prefix + converted.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (converted >= 1) return prefix + converted.toFixed(2);
  return prefix + converted.toPrecision(4);
}

function formatUSD(val) {
  if (!val) return '$0.00';
  if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
  if (val >= 1000) return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + val.toFixed(2);
}

function formatChg(pct) {
  if (pct === null || pct === undefined) return '0.00%';
  const sign = pct >= 0 ? '+' : '';
  return sign + pct.toFixed(2) + '%';
}

/* ─────────────── LIVE UI UPDATES ─────────────── */

function updateAllLiveUI() {
  updateTrendingListLive();
  updateTopTradedLive();
  updateWatchlistLive();
  updateSendAssetsLive();
  updateSearchResultsLive();
}

function updateTrendingListLive() {
  const tList = document.getElementById('trending-list');
  if (!tList) return;
  /* Build live tokens from market data */
  const liveTokens = buildLiveTokenList(currentTrendingFilter);
  tList.innerHTML = renderTrending(liveTokens);
}

function buildLiveTokenList(filter) {
  const base = (typeof VIDEO_TRENDING_TOKENS !== 'undefined' ? VIDEO_TRENDING_TOKENS : FALLBACK_HOT_TOKENS);
  if (typeof VIDEO_TRENDING_TOKENS !== 'undefined') {
    let fixed = [...base];
    if (filter === 'gainers') {
      fixed = fixed.sort((a, b) => parseFloat(b.chg) - parseFloat(a.chg));
    }
    return fixed;
  }
  let tokens = base.map(token => {
    const sym = token.sym;
    const d = liveMarketData[sym];
    const net = token.net || getParentNetwork(sym);
    if (d) {
      const up = d.change24h >= 0;
      return {
        ...token,
        sym, name: token.name || sym,
        price: formatUSD(d.price),
        chg: formatChg(d.change24h),
        mcap: token.mcap || formatUSD(d.mcap),
        vol: token.vol || formatUSD(d.vol24h),
        up, net
      };
    }
    /* fallback */
    return { ...token, net };
  });

  if (filter === 'gainers') {
    tokens = tokens.sort((a, b) => {
      const pa = parseFloat(a.chg);
      const pb = parseFloat(b.chg);
      return pb - pa;
    });
  }
  return tokens;
}

function updateTopTradedLive() {
  const ttScroll = document.getElementById('top-traded-scroll');
  if (!ttScroll) return;
  if (typeof VIDEO_TOP_TRADED !== 'undefined') {
    ttScroll.innerHTML = renderTopTraded(VIDEO_TOP_TRADED);
    return;
  }
  const base = (typeof VIDEO_TOP_TRADED !== 'undefined' ? VIDEO_TOP_TRADED : FALLBACK_TOP_TRADED);
  const tokens = base.map(token => {
    const sym = token.sym;
    const d = liveMarketData[sym];
    if (d) {
      const up = d.change24h >= 0;
      return { ...token, sym, name: token.name || sym, price: formatUSD(d.price), chg: formatChg(d.change24h), up };
    }
    return token || { sym, name: sym, price: '$0.00', chg: '+0.00%', up: true };
  });
  ttScroll.innerHTML = renderTopTraded(tokens);
}

function updateWatchlistLive() {
  const rows = document.querySelectorAll('.watchlist-row[data-sym]');
  rows.forEach(row => {
    const sym = row.getAttribute('data-sym');
    const d = liveMarketData[sym];
    if (!d) return;
    const valEl = row.querySelector('.val');
    const chgEl = row.querySelector('.chg');
    const capEl = row.querySelector('.cap');
    const up = d.change24h >= 0;
    if (valEl) valEl.textContent = formatUSD(d.price);
    if (chgEl) { chgEl.textContent = formatChg(d.change24h); chgEl.className = 'chg ' + (up ? 'up' : 'down'); }
    if (capEl) capEl.textContent = formatUSD(d.mcap) + ' MCap';
  });
}

function updateSendAssetsLive() {
  const container = document.getElementById('send-asset-results');
  if (!container) return;
  container.querySelectorAll('.net-row-item[data-sym]').forEach(row => {
    const sym = row.getAttribute('data-sym');
    const d = liveMarketData[sym];
    if (!d) return;
    const priceEl = row.querySelector('.live-price');
    if (priceEl) priceEl.textContent = formatUSD(d.price);
  });
}

function updateSearchResultsLive() {
  const container = document.getElementById('search-results');
  if (!container) return;
  container.querySelectorAll('.search-row[data-sym]').forEach(row => {
    const sym = row.getAttribute('data-sym');
    const d = liveMarketData[sym];
    if (!d) return;
    const prEl = row.querySelector('.live-price');
    if (prEl) prEl.textContent = formatUSD(d.price);
  });
}

/* ─────────────── UTILITY ─────────────── */

function haptic() {
  if (window.navigator?.vibrate) window.navigator.vibrate(10);
}

function pulseTap(el) {
  if (!el) return;
  el.style.opacity = '0.7';
  setTimeout(() => { el.style.opacity = ''; }, 140);
}

function getParentNetwork(sym) {
  const map = {
    USDT: 'ETH', USDC: 'ETH', LINK: 'ETH', AAVE: 'ETH',
    DEXE: 'BNB', TWT: 'BNB',
    JLP: 'SOL',
    XAUt: 'ETH',
    U: 'ETH',
  };
  return map[sym] || null;
}

/* Video-first logo generator */
const VIDEO_ICON_BASE = 'assets/tokens/';
const TRENDING_SCREENSHOT_ICON_BASE = 'assets/trending-screens/';
const DAPP_SCREENSHOT_ICON_BASE = 'assets/dapp-screens/';

const TRENDING_SCREENSHOT_ICON_MAP = {
  AERO:'AERO.png', AETHWETH:'AETHWETH.png', AIA:'AIA.png', AIB:'AIB.png',
  AKE:'AKE_2.png', APXUSD:'APXUSD.png', ARIA:'ARIA.png', ARTX:'ARTX.png',
  ASTEROID:'ASTEROID.png', BANANA:'BANANA.png', BAS:'BAS.png', BASED:'BASED.png',
  BELIEF:'BELIEF.png', BINANCE_LIFE:'BINANCE_LIFE.png', BLESS:'BLESS.png',
  BSB:'BSB.png', BURNIE:'BURNIE.png', C:'C.png', CHIP:'CHIP.png', CLO:'CLO.png',
  COLLECT:'COLLECT.png', CR7:'CR7.png', CRCLX:'CRCLX.png', CYS:'CYS.png',
  DBT:'DBT.png', DEXE:'DEXE.png', DGRAM:'DGRAM.png', EDGE:'EDGE.png',
  FARTCOIN:'FARTCOIN.png', FF:'FF.png', FLORK:'FLORK.png', FOLKS:'FOLKS.png',
  H:'H.png', IN:'IN.png', INX:'INX.png', IR:'IR.png', KITE:'KITE.png',
  LIBRA:'LIBRA.png', MAGA:'MAGA.png', MEXICANUNC:'MEXICANUNC.png',
  MUSD:'MUSD.png', NEURALINK:'NEURALINK.png', ON:'ON.png', OPENAI:'OPENAI.png',
  OPG:'OPG.png', PAXG:'PAXG.png', PENGU:'PENGU.png', PIPPIN:'PIPPIN.png',
  POWER:'POWER.png', PRL:'PRL.png', PUMP:'PUMP.png', PYBOBO:'PYBOBO.png',
  Q:'Q.png', RAVE:'RAVE.png', RIVER:'RIVER.png', ROBO:'ROBO.png', RTX:'RTX.png',
  SAM:'SAM.png', SENT:'SENT.png', SKR:'SKR.png', SKYAI:'SKYAI.png', SOON:'SOON.png',
  SPACE:'SPACE.png', SPIKE:'SPIKE.png', ST:'ST.png', STRIKE:'STRIKE.png',
  TOKEN:'TOKEN.png', TRADOOR:'TRADOOR.png', TRUMP:'TRUMP.png', TSLAX:'TSLAX.png',
  U:'U.png', UB:'UB.png', UNC:'UNC.png', VIRTUAL:'VIRTUAL.png', VVV:'VVV.png',
  WSTETH:'WSTETH.png', XAUT:'XAUT.png', ZAMA:'ZAMA.png', ZBT:'ZBT.png',
  ZEREBRO:'ZEREBRO.png'
};

const DAPP_SCREENSHOT_ICON_MAP = {
  'Aave':'AAVE.png',
  'AirNFTs':'AIRNFTS.png',
  'Aster':'ASTER.png',
  'Avalon Labs':'AVALON_LABS.png',
  'Beefy':'BEEFY.png',
  'Beets':'BEETS.png',
  'Binance staked ETH':'BINANCE_STAKED_ETH.png',
  'Blur':'BLUR.png',
  'Convex Finance':'CONVEX_FINANCE.png',
  'Element Market':'ELEMENT_MARKET.png',
  'Ethena':'ETHENA.png',
  'Four':'FOUR.png',
  'Frax Ether':'FRAX_ETHER.png',
  'Galxe':'GALXE.png',
  'Harvest Finance':'HARVEST_FINANCE.png',
  'InstaDApp':'INSTADAPP.png',
  'Jito':'JITO.png',
  'Jupiter Exchange':'JUPITER_EXCHANGE.png',
  'Kamino Finance':'KAMINO_FINANCE.png',
  'Lens Protocol':'LENS_PROTOCOL.png',
  'Lido Staking':'LIDO_STAKING.png',
  'LooksRare':'LOOKSRARE.png',
  'Magic Eden':'MAGIC_EDEN.png',
  'MakerDAO':'MAKERDAO.png',
  'Marginfi':'MARGINFI.png',
  'Marinade':'MARINADE.png',
  'OpenSea':'OPENSEA.png',
  'Orca':'ORCA.png',
  'PancakeSwap':'PANCAKESWAP.png',
  'Pendle':'PENDLE.png',
  'Phi':'PHI.png',
  'Playbux':'PLAYBUX.png',
  'pStake':'PSTAKE.png',
  'Pump.Fun':'PUMP_FUN.png',
  'QuestN':'QUESTN.png',
  'Rarible':'RARIBLE.png',
  'Raydium':'RAYDIUM.png',
  'Rings':'RINGS.png',
  'Rocket Pool':'ROCKET_POOL.png',
  'Sanctum':'SANCTUM.png',
  'Silo':'SILO.png',
  'Stader':'STADER.png',
  'Summer.fi':'SUMMER_FI.png',
  'Veda':'VEDA.png',
  'Veno Finance':'VENO_FINANCE.png',
  'yearn.finance':'YEARN_FINANCE.png'
};

const VIDEO_TOKEN_ICON_MAP = {
  AAVE: 'AAVE.png',
  ADA: 'ADA.png',
  AETHWETH: 'AETHWETH.png',
  AGT: 'AGT.png',
  AIOT: 'AIOT.png',
  AKE: 'AKE.png',
  APR: 'APR.png',
  APXUSD: 'APXUSD.png',
  ARTX: 'ARTX.png',
  ASTER: 'ASTER.png',
  BASED: 'BASED.png',
  BAY: 'BAY.png',
  BLUAI: 'BLUAI.png',
  BNB: 'BNB.png',
  BSU: 'BSU.png',
  BTC: 'BTC.png',
  BTCDOM: 'BTCDOM.png',
  CLO: 'CLO.png',
  CROSS: 'CROSS.png',
  CYS: 'CYS.png',
  D: 'D.png',
  DAKE: 'DEXE.png',
  DBR: 'DBR.png',
  DEXE: 'DEXE.png',
  DOGE: 'DOGE.png',
  ENA: 'ENA.png',
  ETH: 'ETH.png',
  FART: 'FARTCOIN.png',
  FARTCOIN: 'FARTCOIN.png',
  FF: 'FF.png',
  FHE: 'FHE.png',
  GENIUS: 'GENIUS.png',
  HYPE: 'HYPE.png',
  INTCON: 'INTCON.png',
  IR: 'IR.png',
  JUP: 'JUP.png',
  KITE: 'KITE.png',
  LAB: 'LAB.png',
  LINK: 'LINK.png',
  OFFICIAL: 'OFFICIAL.png',
  ON: 'ON.png',
  PAXG: 'PAXG.png',
  PIPPIN: 'PIPPIN.png',
  PRL: 'PRL.png',
  PROMPT: 'PROMPT.png',
  PYBOBO: 'PYBOBO.png',
  RECALL: 'RECALL.png',
  RED: 'RED.png',
  RIVER: 'RIVER.png',
  SIGMA: 'SIGMA.png',
  SKY: 'SKY.png',
  SKYAI: 'SKYAI.png',
  SOL: 'SOL.png',
  SPARK: 'SPARK.png',
  SWARMS: 'SWARMS.png',
  TOKEN: 'TOKEN.png',
  TREE: 'TREE.png',
  TURTLE: 'TURTLE.png',
  TWT: 'SWAP_TWT.png',
  U: 'U.png',
  UP: 'UP.png',
  WFLI: 'WFLI.png',
  WOJAK: 'WOJAK.png',
  XAUT: 'XAUT.png',
  XRP: 'XRP.png',
  ZBT: 'ZBT.png',
  ZEREBRO: 'ZEREBRO.png'
};

const VIDEO_EMBEDDED_BADGE_SYMBOLS = new Set([
  'AAVE', 'AETHWETH', 'AGT', 'APXUSD', 'ARTX', 'BSU', 'CYS', 'DBR', 'DEXE', 'ENA',
  'FART', 'FARTCOIN', 'FF', 'FHE', 'INTCON', 'KITE', 'LINK', 'PAXG',
  'PROMPT', 'PYBOBO', 'SIGMA', 'SKYAI', 'TWT', 'U', 'UP', 'XAUT'
]);

const PREMIUM_CRYPTO_ICON_BASE = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/';

const TRUST_LOGO_URLS = {
  BTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  SOL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
  TWT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x4B0F1812e5Df2A09796481Ff14017e6005508003/logo.png',
  XRP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
  DOGE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png',
  ADA: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
  DOT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png',
  AVAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
  MATIC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  TRX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
  ARB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  BASE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
  OP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  LTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png',
  ATOM: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png',
  NEAR: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png',
  SUI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png',
  APT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png',
  VET: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/vechain/info/logo.png',
  ZEC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zcash/info/logo.png',
  ACALA: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/acala/info/logo.png',
  ALGO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/algorand/info/logo.png',
  WAVES: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/waves/info/logo.png',
  ZIL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zilliqa/info/logo.png',
  USDT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
  USDC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  LINK: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  AAVE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
  BCH: `${PREMIUM_CRYPTO_ICON_BASE}bch.png`,
  HBAR: `${PREMIUM_CRYPTO_ICON_BASE}hbar.png`,
  TON: `${PREMIUM_CRYPTO_ICON_BASE}ton.png`,
  SHIB: `${PREMIUM_CRYPTO_ICON_BASE}shib.png`,
  PAXG: `${PREMIUM_CRYPTO_ICON_BASE}paxg.png`,
  XLM: `${PREMIUM_CRYPTO_ICON_BASE}xlm.png`,
  ICP: `${PREMIUM_CRYPTO_ICON_BASE}icp.png`,
  ETC: `${PREMIUM_CRYPTO_ICON_BASE}etc.png`,
  FIL: `${PREMIUM_CRYPTO_ICON_BASE}fil.png`,
  CRO: `${PREMIUM_CRYPTO_ICON_BASE}cro.png`,
  PEPE: `${PREMIUM_CRYPTO_ICON_BASE}pepe.png`,
  XMR: `${PREMIUM_CRYPTO_ICON_BASE}xmr.png`,
  TAO: `${PREMIUM_CRYPTO_ICON_BASE}tao.png`,
  ONDO: `${PREMIUM_CRYPTO_ICON_BASE}ondo.png`,
  RNDR: `${PREMIUM_CRYPTO_ICON_BASE}rndr.png`,
  MNT: `${PREMIUM_CRYPTO_ICON_BASE}mnt.png`,
  KAS: `${PREMIUM_CRYPTO_ICON_BASE}kas.png`,
  UNI: `${PREMIUM_CRYPTO_ICON_BASE}uni.png`,
  XAUT: `${PREMIUM_CRYPTO_ICON_BASE}xaut.png`,
  DEXE: `${PREMIUM_CRYPTO_ICON_BASE}dexe.png`
};

function normalizeLogoKey(sym) {
  return String(sym || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function imageLogo(src, size = 42, className = 'tw-asset-logo', fallbackSrc = '') {
  const fallbackAttr = fallbackSrc
    ? ` onerror="if(this.dataset.fallbackLoaded==='1'){this.onerror=null;return;}this.dataset.fallbackLoaded='1';this.src='${fallbackSrc}';"`
    : '';
  return `<img class="${className}" src="${src}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer"${fallbackAttr}>`;
}

function assetHasVideoBadge(sym) {
  return VIDEO_EMBEDDED_BADGE_SYMBOLS.has(normalizeLogoKey(sym));
}

function fallbackSvgLogoAsset(sym, size = 42) {
  const logos = {
    'BTC': `<circle cx="21" cy="21" r="21" fill="#F7931A"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="16" font-weight="700" font-family="Inter">₿</text>`,
    'ETH': `<circle cx="21" cy="21" r="21" fill="#1A1A2E"/><path d="M21 8l-9 13h18zM12 23l9 13 9-13z" fill="#fff" opacity=".85"/>`,
    'SOL': `<circle cx="21" cy="21" r="21" fill="#9945FF"/><rect x="12" y="15" width="18" height="3" rx="1.5" fill="#fff"/><rect x="12" y="19.5" width="18" height="3" rx="1.5" fill="#fff"/><rect x="12" y="24" width="18" height="3" rx="1.5" fill="#fff"/>`,
    'USDT': `<circle cx="21" cy="21" r="21" fill="#26A17B"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="16" font-weight="700" font-family="Inter">T</text>`,
    'BNB': `<circle cx="21" cy="21" r="21" fill="#F3BA2F"/><path d="M21 14l3.5 3.5L21 21l-3.5-3.5zM14 21l3.5-3.5 3.5 3.5-3.5 3.5zM28 21l-3.5 3.5-3.5-3.5 3.5-3.5zM21 28l-3.5-3.5L21 21l3.5 3.5z" fill="#111"/>`,
    'TRX': `<circle cx="21" cy="21" r="21" fill="#FF060A"/><path d="M21 12l8 14-8 4-8-4z" fill="none" stroke="#fff" stroke-width="2.5"/>`,
    'XRP': `<circle cx="21" cy="21" r="21" fill="#1A1A1A"/><path d="M14 14l7 7 7-7M14 28l7-7 7 7" stroke="#fff" stroke-width="2.5" fill="none"/>`,
    'LINK': `<circle cx="21" cy="21" r="21" fill="#2A5ADA"/><path d="M21 10l4 7h-8zM13 21l4-7v14zM29 21l-4 7V14zM21 32l-4-7h8z" fill="#fff"/>`,
    'AAVE': `<circle cx="21" cy="21" r="21" fill="#B6509E"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="12" font-weight="800" font-family="Inter">AAVE</text>`,
    'DEXE': `<circle cx="21" cy="21" r="21" fill="#1A1A1A"/><path d="M12 16l9-6 9 6v10l-9 6-9-6z" fill="none" stroke="#fff" stroke-width="2"/><text x="21" y="24" text-anchor="middle" fill="#fff" font-size="7" font-weight="700" font-family="Inter">DEXE</text>`,
    'ARB': `<circle cx="21" cy="21" r="21" fill="#2D374B"/><path d="M21 10l8 14H13z M21 32l-8-14h16z" fill="#96BEDC"/>`,
    'BASE': `<circle cx="21" cy="21" r="21" fill="#0052FF"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="14" font-weight="800" font-family="Inter">B</text>`,
    'OP': `<circle cx="21" cy="21" r="21" fill="#FF0420"/><circle cx="21" cy="21" r="8" fill="none" stroke="#fff" stroke-width="3"/>`,
    'MATIC': `<circle cx="21" cy="21" r="21" fill="#8247E5"/><path d="M25 15l-4 7h7l-5.7 4.1 2.2 7L21 26.2l-5.9 3.9 2.2-7L11.6 19h7z" fill="#fff"/>`,
    'AVAX': `<circle cx="21" cy="21" r="21" fill="#E84142"/><path d="M21 11l6 10h-5l-1 2-1-2h-5z" fill="#fff"/>`,
    'USDC': `<circle cx="21" cy="21" r="21" fill="#2775CA"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Inter">USDC</text>`,
    'TWT': `<circle cx="21" cy="21" r="21" fill="#3375BB"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Inter">TWT</text>`,
    'XAUt': `<circle cx="21" cy="21" r="21" fill="#F5A623"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Inter">XAU</text>`,
    'U': `<circle cx="21" cy="21" r="21" fill="#4A4A8A"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="16" font-weight="800" font-family="Inter">U</text>`,
    'JLP': `<circle cx="21" cy="21" r="21" fill="#00B0FF"/><path d="M14 18 Q21 12 28 18 L28 28 Q21 34 14 28 Z" fill="#fff" opacity=".8"/>`,
    'DOT': `<circle cx="21" cy="21" r="21" fill="#E6007A"/><circle cx="21" cy="14" r="4" fill="#fff"/><circle cx="21" cy="28" r="4" fill="#fff"/><circle cx="14" cy="17.5" r="4" fill="#fff"/><circle cx="28" cy="17.5" r="4" fill="#fff"/><circle cx="14" cy="24.5" r="4" fill="#fff"/><circle cx="28" cy="24.5" r="4" fill="#fff"/>`,
    'ATOM': `<circle cx="21" cy="21" r="21" fill="#2E3148"/><ellipse cx="21" cy="21" rx="8" ry="4.5" fill="none" stroke="#6F7390" stroke-width="2" transform="rotate(0 21 21)"/><ellipse cx="21" cy="21" rx="8" ry="4.5" fill="none" stroke="#6F7390" stroke-width="2" transform="rotate(60 21 21)"/><ellipse cx="21" cy="21" rx="8" ry="4.5" fill="none" stroke="#6F7390" stroke-width="2" transform="rotate(120 21 21)"/><circle cx="21" cy="21" r="2.5" fill="#fff"/>`,
    'DOGE': `<circle cx="21" cy="21" r="21" fill="#C3A634"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="13" font-weight="800" font-family="Inter">Ð</text>`,
    'LTC': `<circle cx="21" cy="21" r="21" fill="#345D9D"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="16" font-weight="700" font-family="Inter">Ł</text>`,
    'ADA': `<circle cx="21" cy="21" r="21" fill="#3CC8C8"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="14" font-weight="800" font-family="Inter">₳</text>`,
    'XRP': `<circle cx="21" cy="21" r="21" fill="#1A1A1A"/><path d="M14 14l7 7 7-7M14 28l7-7 7 7" stroke="#fff" stroke-width="2.5" fill="none"/>`,
    'INJ': `<circle cx="21" cy="21" r="21" fill="#0CE4CA"/><text x="21" y="27" text-anchor="middle" fill="#000" font-size="12" font-weight="800" font-family="Inter">INJ</text>`,
    'SUI': `<circle cx="21" cy="21" r="21" fill="#6FBCF0"/><path d="M15 16 Q21 10 27 16 L27 28 Q21 34 15 28 Z" fill="#fff" opacity=".85"/>`,
    'APT': `<circle cx="21" cy="21" r="21" fill="#00C2FF"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="12" font-weight="800" font-family="Inter">APT</text>`,
    'NEAR': `<circle cx="21" cy="21" r="21" fill="#000"/><path d="M13 28V14l8 12V14" stroke="#fff" stroke-width="2.5" fill="none"/><path d="M29 14v14l-8-12v12" stroke="#fff" stroke-width="2.5" fill="none"/>`,
    'KSM': `<circle cx="21" cy="21" r="21" fill="#000"/><circle cx="21" cy="21" r="8" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="21" cy="10" r="3" fill="#fff"/><circle cx="21" cy="32" r="3" fill="#fff"/>`,
    'JUNO': `<circle cx="21" cy="21" r="21" fill="#F0827D"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="11" font-weight="800" font-family="Inter">JUNO</text>`,
    'STARS': `<circle cx="21" cy="21" r="21" fill="#DB2777"/><path d="M21 12l2.4 7h7l-5.7 4.1 2.2 7L21 26.2l-5.9 3.9 2.2-7L11.6 19h7z" fill="#fff"/>`,
  };
  const rawSym = String(sym || '?');
  const key = logos[rawSym] ? rawSym : normalizeLogoKey(rawSym);
  const label = (key || rawSym).slice(0, 4);
  const svg = logos[rawSym] || logos[key] || `<circle cx="21" cy="21" r="21" fill="#eef1f7"/><circle cx="21" cy="21" r="17.5" fill="#111827"/><circle cx="21" cy="21" r="17.5" fill="none" stroke="#ffffff2f"/><text x="21" y="25.5" text-anchor="middle" fill="#fff" font-size="9" font-weight="800" font-family="Inter">${label}</text>`;
  return `<svg viewBox="0 0 42 42" width="${size}" height="${size}">${svg}</svg>`;
}

function logoAsset(sym, size = 42) {
  const key = normalizeLogoKey(sym);
  const trusted = TRUST_LOGO_URLS[key];
  const video = VIDEO_TOKEN_ICON_MAP[key];
  if (trusted) return imageLogo(trusted, size, 'tw-asset-logo', video ? `${VIDEO_ICON_BASE}${video}` : '');

  if (video) return imageLogo(`${VIDEO_ICON_BASE}${video}`, size);

  return fallbackSvgLogoAsset(sym, size);
}

function hasTrendingScreenshotIcon(sym) {
  return Boolean(TRENDING_SCREENSHOT_ICON_MAP[normalizeLogoKey(sym)]);
}

function trendingLogoAsset(sym, size = 42) {
  const key = normalizeLogoKey(sym);
  const exact = TRENDING_SCREENSHOT_ICON_MAP[key];
  if (exact) return imageLogo(`${TRENDING_SCREENSHOT_ICON_BASE}${exact}`, size, 'tw-asset-logo screenshot-token-logo');
  return logoAsset(sym, size);
}

function netBadgeSmall(netSym, size = 14) {
  if (!netSym) return '';
  return `<div class="net-badge-small">${logoAsset(netSym, size)}</div>`;
}

/* Sparkline chart */
function spark(up, w = 100, h = 40, color) {
  const c = color || (up ? '#00C878' : '#EA3943');
  const pts = [];
  let y = up ? h * 0.75 : h * 0.25;
  const step = w / 14;
  for (let i = 0; i <= 14; i++) {
    const drift = (seededRand(i * 7 + w) - 0.5) * 8;
    y = Math.max(3, Math.min(h - 3, y + drift + (up ? -1.5 : 1.8)));
    pts.push(`${i * step},${y}`);
  }
  const d = `M${pts.join(' L')}`;
  const fillPts = `${pts[0]} L${pts.join(' L')} L${w},${h} L0,${h}Z`;
  const id = `sg${Math.random().toString(36).slice(2, 6)}`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c}" stop-opacity=".25"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${d}" fill="none" stroke="${c}" stroke-width="1.8"/>
    <path d="M${fillPts}" fill="url(#${id})"/>
  </svg>`;
}

/* Seeded random for consistent sparklines */
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function formatTimeLeft(end) {
  const diff = end - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / (24 * 3600 * 1000));
  const h = Math.floor((diff % (24 * 3600 * 1000)) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${d}D ${h}H ${m}M ${s}S`;
}

/* ─────────────── RENDER FUNCTIONS ─────────────── */

function renderDashModules() {
  /* Predictions */
  const pList = document.getElementById('prediction-list');
  if (pList) {
    pList.innerHTML = PREDICTIONS.map(p => {
      const imgHtml = p.img
        ? `<img src="${p.img}" class="predict-img" onerror="this.style.display='none'">`
        : `<div class="predict-img" style="background:#1A1A3A;display:grid;place-items:center;font-size:20px;">🏳️</div>`;
      return `
        <div class="predict-card">
          <div class="predict-top">
            ${imgHtml}
            <div class="predict-meta-right">${p.vol} ${p.participants}</div>
          </div>
          <div class="predict-title">${p.title}</div>
          <div class="predict-btns">
            <button class="p-btn yes" onclick="haptic()">Yes</button>
            <button class="p-btn no" onclick="haptic()">No</button>
          </div>
          <div class="predict-footer">
            <span class="timer" data-end="${p.end}" style="display:flex;align-items:center;gap:4px;">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${formatTimeLeft(p.end)}
            </span>
            <span class="provider">${p.provider} 🌐</span>
          </div>
        </div>`;
    }).join('');
  }

  /* Perps */
  const perpList = document.getElementById('perps-list');
  if (perpList) {
    perpList.innerHTML = PERPS_DATA.map(p => `
      <div class="perp-card" onclick="haptic()">
        <div class="perp-top">
          <div class="perp-icon" style="background:${p.color}22;">
            ${logoAsset(p.sym, 24)}
          </div>
          <div class="perp-pair">${p.pair}</div>
        </div>
        <div class="perp-main">Trade ${p.sym} with up to ${p.leverage} leverage</div>
        <div class="perp-label">${p.vol}</div>
      </div>`).join('');
  }

  /* Earn */
  const earnList = document.getElementById('earn-list');
  if (earnList) {
    earnList.innerHTML = EARN_YIELD.map(e => `
        <div class="earn-card" onclick="haptic()">
          <div class="earn-icon" style="background:${e.bg}; color:${e.color};">
            ${logoAsset(e.sym, 32)}
          </div>
          <div class="earn-text">Earn up to</div>
          <div class="earn-apy">${e.apy} APY</div>
          <div class="earn-on">on ${e.name}</div>
        </div>`).join('');
  }

  /* History */
  const histList = document.getElementById('history-list');
  if (histList) {
    histList.innerHTML = window.VIDEO_MATCH_MODE ? `
      <div class="home-history-empty" onclick="pushScreen('tx-history-screen')">
        <img src="assets/illustrations/FUND_WALLET.png" alt="">
        <div class="empty-main">No transactions yet</div>
        <div class="empty-sub">Can't find your transaction?</div>
        <div class="empty-link">Check explorer</div>
      </div>` : HISTORY_MOCK.map(h => `
      <div class="hist-row" onclick="haptic()">
        <div class="hist-icon" style="color:${h.color};">${h.icon}</div>
        <div class="hist-meta">
          <div class="hist-title">${h.type} ${h.sym}</div>
          <div class="hist-time">${h.time}</div>
        </div>
        <div class="hist-status" style="color:${h.status === 'Confirmed' ? '#00FFA3' : '#EA3943'}">${h.status}</div>
      </div>`).join('');
  }
}

function renderTrending(tokens) {
  return tokens.map(t => `
    <div class="token-row" onclick="haptic();openDetail('${t.sym}','${t.price}','${t.chg}',${t.up})">
      <div class="token-icon-wrap">
        ${trendingLogoAsset(t.sym, 44)}
        ${t.net && t.net !== t.sym && !assetHasVideoBadge(t.sym) && !hasTrendingScreenshotIcon(t.sym) ? netBadgeSmall(t.net, 16) : ''}
      </div>
      <div class="token-info" style="flex:1;">
        <div class="name">${t.name}</div>
        <div class="mcap">${t.mcap}${String(t.mcap).includes('MCap') ? '' : ' MCap'} &middot; ${t.vol}${String(t.vol).includes('Vol') ? '' : ' Vol'}</div>
      </div>
      <div class="token-right">
        <div class="price">${t.price}</div>
        <div class="change" style="color:${t.up ? '#00FFA3' : '#EA3943'}">${t.chg}</div>
      </div>
    </div>`).join('');
}

function renderTopTraded(tokens) {
  return tokens.map(t => `
    <div class="traded-card" onclick="haptic();openDetail('${t.sym}','${t.price}','${t.chg}',${t.up})">
      <div class="tc-head">
        <div class="tc-name">
          <span class="tc-title">${t.name}</span>
        </div>
        <div class="tc-logo">${logoAsset(t.sym, 38)}</div>
      </div>
      <div class="tc-price">${t.price}</div>
      <div class="tc-chg" style="color:${t.up ? '#00FFA3' : '#EA3943'}">${t.chg}</div>
      <div class="tc-chart">${spark(t.up, 110, 36)}</div>
    </div>`).join('');
}

/* Brand background colors for each network's icon chip */
const NETWORK_BRAND_COLORS = {
  BTC:  { bg: '#F7931A', fg: '#fff' },
  ETH:  { bg: '#627EEA', fg: '#fff' },
  SOL:  { bg: '#000000', fg: '#fff' },
  BNB:  { bg: '#1E2026', fg: '#F3BA2F' },
  TRX:  { bg: '#E50915', fg: '#fff' },
  ARB:  { bg: '#2D374B', fg: '#fff' },
  BASE: { bg: '#0052FF', fg: '#fff' },
  OP:   { bg: '#FF0420', fg: '#fff' },
  MATIC:{ bg: '#8247E5', fg: '#fff' },
  ATOM: { bg: '#2E3148', fg: '#fff' },
  AVAX: { bg: '#E84142', fg: '#fff' },
  LTC:  { bg: '#B0B0B0', fg: '#fff' },
  XRP:  { bg: '#00AAE4', fg: '#fff' },
  ADA:  { bg: '#0033AD', fg: '#fff' },
  DOT:  { bg: '#E6007A', fg: '#fff' },
  DOGE: { bg: '#C2A633', fg: '#fff' },
  NEAR: { bg: '#000000', fg: '#fff' },
  SUI:  { bg: '#4CA3FF', fg: '#fff' },
};

function _netIconPill(sym, isSelected, onclick) {
  const brand = NETWORK_BRAND_COLORS[sym] || { bg: '#1C1C1E', fg: '#fff' };
  const logoUrl = (typeof TRUST_LOGO_URLS !== 'undefined' && TRUST_LOGO_URLS[sym]) || '';
  const border = isSelected ? '2px solid #0052FF' : '2px solid transparent';
  return `
    <div class="net-icon-chip ${isSelected ? 'selected' : ''}" onclick="${onclick}"
         style="background:${brand.bg}; border:${border};">
      ${logoUrl
        ? `<img src="${logoUrl}" width="28" height="28" style="object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25));" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><span style="display:none;font-weight:800;font-size:13px;color:${brand.fg};">${sym.slice(0,2)}</span>`
        : `<span style="font-weight:800;font-size:13px;color:${brand.fg};">${sym.slice(0,2)}</span>`
      }
    </div>`;
}

function renderReceiveFilters() {
  const containers = [
    document.getElementById('receive-net-filters'),
    document.getElementById('send-network-filters')
  ];
  const nets = ['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'ARB', 'BASE'];
  containers.forEach(container => {
    if (!container) return;
    container.innerHTML =
      `<div class="net-icon-chip all-chip selected" onclick="haptic()" style="background:#fff;border:2px solid #0052FF;"><span style="font-weight:800;font-size:14px;color:#000;">All</span></div>` +
      nets.map(n => _netIconPill(n, false, 'haptic()')).join('') +
      `<div class="net-icon-chip more-chip" onclick="pushScreen('select-network-screen')" style="background:#F2F2F7;"><span style="font-size:11px;font-weight:700;color:#636366;">112+</span></div>`;
  });
}

function getNetworkForSym(sym) {
  const netMap = {
    BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB Smart Chain',
    TRX: 'Tron', ARB: 'Arbitrum', BASE: 'Base', OP: 'Optimism',
    MATIC: 'Polygon', ZKSYNC: 'zkSync Era', LTC: 'Litecoin',
    DOGE: 'Dogecoin', XRP: 'XRP Ledger', ADA: 'Cardano', DOT: 'Polkadot',
    AVAX: 'Avalanche', LINK: 'Chainlink', ATOM: 'Cosmos',
    ALGO: 'Algorand', XLM: 'Stellar', BCH: 'Bitcoin Cash',
    FIL: 'Filecoin', HBAR: 'Hedera', ICP: 'Internet Computer',
    VET: 'VeChain', NEAR: 'NEAR Protocol', FTM: 'Fantom',
    THETA: 'Theta Network', XTZ: 'Tezos', EOS: 'EOS',
    AAVE: 'Ethereum', MKR: 'Ethereum', KAVA: 'Kava', CELO: 'Celo',
    ONE: 'Harmony', ZEC: 'Zcash', ETC: 'Ethereum Classic',
    RON: 'Ronin', SEI: 'Sei', SUI: 'Sui', APT: 'Aptos',
    INJ: 'Injective', OSMO: 'Osmosis', TIA: 'Celestia',
    DASH: 'Dash', CRO: 'Cronos', BERA: 'Berachain',
    USDT: 'Ethereum', USDC: 'Ethereum', TWT: 'BNB Smart Chain',
    MANTA: 'Manta Pacific', MANTLE: 'Mantle Network', SCROLL: 'Scroll',
    LINEA: 'Linea', BLAST: 'Blast', KSM: 'Kusama',
    JUNO: 'Juno', STARS: 'Stargaze',
  };
  return netMap[sym] || 'Ethereum';
}

function generateWalletAddress(sym) {
  if (WALLET_ADDRESSES[sym]) return WALLET_ADDRESSES[sym];
  const btcLike = ['BTC', 'LTC', 'BCH', 'DASH', 'ZEC', 'DOGE'];
  const solLike = ['SOL'];
  const cosmosLike = ['ATOM', 'OSMO', 'JUNO', 'STARS', 'TIA', 'KAVA', 'SEI'];
  const hash = sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hex = (n) => n.toString(16).padStart(4, '0');
  if (btcLike.includes(sym)) return `bc1q${hex(hash)}...${hex(hash*7).slice(0,5)}`;
  if (solLike.includes(sym)) return `${hex(hash*3).toUpperCase()}...${hex(hash*11).toUpperCase()}`;
  if (cosmosLike.includes(sym)) {
    const prefix = sym === 'ATOM' ? 'cosmos' : sym.toLowerCase();
    return `${prefix}1${hex(hash*2)}...${hex(hash*5)}`;
  }
  if (['XRP'].includes(sym)) return `r${hex(hash*13).toUpperCase()}...${hex(hash*17).toUpperCase()}`;
  if (['XLM'].includes(sym)) return `G${hex(hash*19).toUpperCase()}...${hex(hash*23).toUpperCase()}`;
  if (['ADA'].includes(sym)) return `addr1${hex(hash*4)}...${hex(hash*9)}`;
  if (['DOT', 'KSM'].includes(sym)) return `1${hex(hash*6).toUpperCase()}...${hex(hash*8).toUpperCase()}`;
  if (['ALGO'].includes(sym)) return `${hex(hash*21).toUpperCase()}...${hex(hash*31).toUpperCase()}`;
  if (['NEAR'].includes(sym)) return `${sym.toLowerCase()}.near`;
  if (['APT', 'SUI'].includes(sym)) return `0x${hex(hash*14)}...${hex(hash*18)}`;
  if (['HBAR'].includes(sym)) return `0.0.${hash * 1234}`;
  if (['ICP'].includes(sym)) return `${hex(hash*33)}...${hex(hash*37)}`;
  if (['FIL'].includes(sym)) return `f1${hex(hash*12)}...${hex(hash*16)}`;
  if (['THETA'].includes(sym)) return `0x${hex(hash*22)}...${hex(hash*26)}`;
  if (['EOS'].includes(sym)) return `${sym.toLowerCase()}wallet`;
  if (['XTZ'].includes(sym)) return `tz1${hex(hash*15)}...${hex(hash*20)}`;
  return `0x${hex(hash*2)}${hex(hash*3).slice(0,2)}...${hex(hash*7).slice(0,6)}`;
}

function getParentNetworkSym(sym) {
  const map = {
    TWT: 'BNB', USDT: 'ETH', USDC: 'ETH', LINK: 'ETH', AAVE: 'ETH',
    MKR: 'ETH', DEXE: 'BNB',
  };
  return map[sym] || null;
}

function renderReceiveAssets() {
  const container = document.getElementById('receive-asset-list');
  if (!container) return;
  const list = ['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'ARB', 'BASE', 'TWT', 'USDT', 'USDC'];
  container.innerHTML = list.map(sym => {
    const addr = generateWalletAddress(sym);
    const net = getNetworkForSym(sym);
    const parent = getParentNetworkSym(sym);
    return `
      <div class="net-row-item" onclick="showReceiveDetails('${sym}', '${net}')">
        <div class="icon" style="position:relative;">
          ${logoAsset(sym, 44)}
          ${parent && !assetHasVideoBadge(sym) ? netBadgeSmall(parent, 14) : ''}
        </div>
        <div class="name-wrap">
          <div class="name-line">
            <span class="asset-name">${sym}</span>
            <span class="asset-net">${net}</span>
          </div>
          <div class="asset-addr">${addr}</div>
        </div>
        <div class="actions">
          <button class="action-btn-sm" onclick="event.stopPropagation(); showReceiveDetails('${sym}', '${net}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0 4h4V17m-4 0h4"/></svg></button>
          <button class="action-btn-sm" onclick="event.stopPropagation(); copyAddress('${addr}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></button>
        </div>
      </div>`;
  }).join('');
}

/* Render all cryptos in the "All crypto" section of Receive */
function renderReceiveAllCryptos(filter) {
  const container = document.getElementById('receive-all-list');
  if (!container) return;
  /* Build unique list from ALL_NETWORKS_DATA + extra well-known tokens */
  const extraTokens = [
    { sym: 'USDT', name: 'Tether USD' }, { sym: 'USDC', name: 'USD Coin' },
    { sym: 'LINK', name: 'Chainlink' }, { sym: 'AAVE', name: 'Aave' },
    { sym: 'MKR', name: 'Maker' }, { sym: 'TWT', name: 'Trust Wallet Token' },
    { sym: 'DEXE', name: 'DeXe' }, { sym: 'UNI', name: 'Uniswap' },
    { sym: 'SHIB', name: 'Shiba Inu' }, { sym: 'PEPE', name: 'Pepe' },
    { sym: 'TON', name: 'Toncoin' }, { sym: 'XMR', name: 'Monero' },
    { sym: 'TAO', name: 'Bittensor' }, { sym: 'ONDO', name: 'Ondo' },
    { sym: 'RNDR', name: 'Render' }, { sym: 'KAS', name: 'Kaspa' },
    { sym: 'PAXG', name: 'PAX Gold' },
  ];
  const seen = new Set();
  const allCrypto = [];
  /* Popular list syms to exclude from A-Z */
  const popularSyms = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'ARB', 'BASE', 'TWT', 'USDT', 'USDC']);

  ALL_NETWORKS_DATA.forEach(n => {
    if (!seen.has(n.sym) && !popularSyms.has(n.sym)) {
      seen.add(n.sym);
      allCrypto.push({ sym: n.sym, name: n.name });
    }
  });
  extraTokens.forEach(t => {
    if (!seen.has(t.sym) && !popularSyms.has(t.sym)) {
      seen.add(t.sym);
      allCrypto.push(t);
    }
  });

  /* Sort A-Z */
  allCrypto.sort((a, b) => a.name.localeCompare(b.name));

  /* Apply filter */
  let filtered = allCrypto;
  if (filter && filter.trim()) {
    const q = filter.toLowerCase();
    filtered = allCrypto.filter(c => c.sym.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  container.innerHTML = filtered.map(c => {
    const net = getNetworkForSym(c.sym);
    const addr = generateWalletAddress(c.sym);
    const parent = getParentNetworkSym(c.sym);
    return `
      <div class="net-row-item" onclick="showReceiveDetails('${c.sym}', '${net}')">
        <div class="icon" style="position:relative;">
          ${logoAsset(c.sym, 44)}
          ${parent ? netBadgeSmall(parent, 14) : ''}
        </div>
        <div class="name-wrap">
          <div class="name-line">
            <span class="asset-name">${c.sym}</span>
            <span class="asset-net">${net}</span>
          </div>
          <div class="asset-addr">${addr}</div>
        </div>
        <div class="actions">
          <button class="action-btn-sm" onclick="event.stopPropagation(); showReceiveDetails('${c.sym}', '${net}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0 4h4V17m-4 0h4"/></svg></button>
          <button class="action-btn-sm" onclick="event.stopPropagation(); copyAddress('${addr}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></button>
        </div>
      </div>`;
  }).join('');
}

/* Show QR code receive details for a specific crypto */
let currentReceiveSym = '';
let currentReceiveAddr = '';

function showReceiveDetails(sym, network) {
  haptic();
  currentReceiveSym = sym;
  const addr = generateWalletAddress(sym);
  currentReceiveAddr = addr;
  const net = network || getNetworkForSym(sym);

  /* Update caution text */
  const cautionEl = document.getElementById('qr-caution-text');
  if (cautionEl) {
    cautionEl.textContent = `Only send ${sym} (${net}) assets to this address. Other assets will be lost forever.`;
  }

  /* Update asset badge */
  const iconEl = document.getElementById('qr-asset-icon');
  const nameEl = document.getElementById('qr-asset-name');
  const symbolTag = document.querySelector('.asset-symbol-tag');

  if (iconEl) {
    /* Replace the img with the logoAsset HTML */
    const wrapper = iconEl.parentElement;
    if (wrapper) {
      const existingLogo = wrapper.querySelector('.qr-logo-replace');
      if (existingLogo) existingLogo.remove();
      iconEl.style.display = 'none';
      const logoDiv = document.createElement('span');
      logoDiv.className = 'qr-logo-replace';
      logoDiv.innerHTML = logoAsset(sym, 32);
      wrapper.insertBefore(logoDiv, iconEl);
    }
  }
  if (nameEl) nameEl.textContent = net;
  if (symbolTag) symbolTag.textContent = sym;

  /* Update address */
  const addrEl = document.getElementById('qr-address-val');
  if (addrEl) addrEl.textContent = addr;

  /* Generate QR code */
  const qrContainer = document.getElementById('qrcode');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
          text: addr,
          width: 180,
          height: 180,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        /* Fallback: render a visual QR placeholder */
        qrContainer.innerHTML = renderFallbackQR(sym);
      }
    } catch (e) {
      console.warn('QR generation failed:', e);
      qrContainer.innerHTML = renderFallbackQR(sym);
    }
  }

  pushScreen('receive-details-screen');
}

function renderFallbackQR(sym) {
  /* Generate a deterministic visual grid pattern as QR fallback */
  const hash = sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let svg = '<svg viewBox="0 0 180 180" width="180" height="180">';
  svg += '<rect width="180" height="180" fill="#fff"/>';
  /* Corner markers */
  const drawMarker = (x, y) => {
    svg += `<rect x="${x}" y="${y}" width="42" height="42" fill="#000"/>`;
    svg += `<rect x="${x+6}" y="${y+6}" width="30" height="30" fill="#fff"/>`;
    svg += `<rect x="${x+12}" y="${y+12}" width="18" height="18" fill="#000"/>`;
  };
  drawMarker(6, 6);
  drawMarker(132, 6);
  drawMarker(6, 132);
  /* Data modules */
  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 25; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 16) || (r > 16 && c < 8)) continue;
      const val = ((hash * (r + 1) * (c + 1) + r * 7 + c * 13) % 100);
      if (val < 40) {
        svg += `<rect x="${c * 6.8 + 6}" y="${r * 6.8 + 6}" width="5.8" height="5.8" fill="#000"/>`;
      }
    }
  }
  svg += '</svg>';
  return svg;
}

function copyQRAddress() {
  haptic();
  const addr = currentReceiveAddr || document.getElementById('qr-address-val')?.textContent || '';
  if (navigator.clipboard && addr) {
    navigator.clipboard.writeText(addr)
      .then(() => showToast('✅ Address copied!'))
      .catch(() => showToast('Address: ' + addr));
  } else {
    showToast('Address: ' + addr);
  }
}

/* Receive screen search filter */
function filterReceiveAssets() {
  const input = document.querySelector('#receive-screen input[type="text"]');
  const query = input ? input.value.trim() : '';

  /* Filter popular section */
  const popularContainer = document.getElementById('receive-asset-list');
  if (popularContainer) {
    const rows = popularContainer.querySelectorAll('.net-row-item');
    rows.forEach(row => {
      const name = row.querySelector('.asset-name')?.textContent || '';
      const net = row.querySelector('.asset-net')?.textContent || '';
      const match = !query || name.toLowerCase().includes(query.toLowerCase()) || net.toLowerCase().includes(query.toLowerCase());
      row.style.display = match ? '' : 'none';
    });
  }

  /* Re-render all crypto with filter */
  renderReceiveAllCryptos(query);

  /* Toggle section titles visibility */
  const popularTitle = document.querySelector('#receive-screen .net-list-section-title:first-of-type');
  const allTitle = document.querySelectorAll('#receive-screen .net-list-section-title')[1];
  if (query) {
    if (popularTitle) popularTitle.style.display = 'none';
    if (allTitle) allTitle.textContent = 'Search results';
  } else {
    if (popularTitle) popularTitle.style.display = '';
    if (allTitle) allTitle.textContent = 'All crypto';
  }
}

function renderPopularNetworks() {
  const popular = ALL_NETWORKS_DATA.filter(n => n.popular);
  const container = document.getElementById('popular-networks-list');
  if (container) {
    container.innerHTML = popular.map(n => `
      <div class="net-row-item" onclick="selectNetworkOption('${n.name}')">
        <div class="icon">${logoAsset(n.sym, 44)}</div>
        <div class="name-wrap"><div class="asset-name">${n.name}</div></div>
        <div class="custom-radio ${sendNetworkFilter === n.sym ? 'on' : ''}"></div>
      </div>`).join('');
  }
  const azContainer = document.getElementById('az-networks-list');
  if (azContainer) {
    const az = ALL_NETWORKS_DATA.filter(n => !n.popular).sort((a, b) => a.name.localeCompare(b.name));
    azContainer.innerHTML = az.map(n => `
      <div class="net-row-item" onclick="selectNetworkOption('${n.name}')">
        <div class="icon">${logoAsset(n.sym, 44)}</div>
        <div class="name-wrap"><div class="asset-name">${n.name}</div></div>
        <div class="custom-radio"></div>
      </div>`).join('');
  }
}

function selectNetworkOption(name) {
  haptic();
  showToast(`Network: ${name}`);
  setTimeout(() => popScreen(), 300);
}

function renderCurrencies() {
  const list = document.getElementById('cur-list');
  if (!list) return;
  list.innerHTML = CURRENCIES.map(c => `
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;" onclick="setBuyCurrency('${c.code}')">
      <span style="font-size:22px;">${c.flag}</span>
      <div style="flex:1;">
        <div style="font-weight:700;">${c.code}</div>
        <div style="font-size:12px;color:#636366;">${c.name}</div>
      </div>
      <div class="custom-radio ${selectedCurrency.code === c.code ? 'on' : ''}"></div>
    </div>`).join('');
}

function renderBuyCryptos() {
  const list = document.getElementById('buy-crypto-list');
  if (!list) return;
  list.innerHTML = BUY_CRYPTO.map((c, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;" onclick="setBuyCrypto(${i})">
      <div style="position:relative;width:36px;height:36px;">
        ${logoAsset(c.sym, 36)}
        ${c.netSym && !assetHasVideoBadge(c.sym) ? `<div class="net-badge-small">${logoAsset(c.netSym, 12)}</div>` : ''}
      </div>
      <div style="flex:1;">
        <div style="font-weight:700;">${c.sym}</div>
        <div style="font-size:12px;color:#636366;">${c.network}</div>
      </div>
      <div class="custom-radio ${selectedCrypto.network === c.network && selectedCrypto.sym === c.sym ? 'on' : ''}"></div>
    </div>`).join('');
}

function updateBuyDisplay() {
  const display = document.getElementById('buy-amount-display');
  const cryptoVal = document.getElementById('buy-crypto-val');
  if (display) display.textContent = buyAmount || '0';
  if (cryptoVal) {
    const sym = selectedCrypto.sym;
    const livePrice = getLivePrice(sym);
    const rate = livePrice || 100.21;
    const convertedUSD = parseFloat(buyAmount) / selectedCurrency.rate;
    const tokenVal = convertedUSD / rate;
    cryptoVal.textContent = isNaN(tokenVal) ? '0.00000' : tokenVal.toFixed(5) + ' ' + sym;
  }
}

function updateBuySelectors() {
  const curBtn = document.getElementById('buy-cur-btn');
  if (curBtn) curBtn.innerHTML = `<span style="font-size:18px;">${selectedCurrency.flag}</span><span style="font-weight:700;">${selectedCurrency.code}</span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
  const cryptoBtn = document.getElementById('buy-crypto-btn');
  if (cryptoBtn) cryptoBtn.innerHTML = `${logoAsset(selectedCrypto.sym, 20)}<span style="font-weight:700;">${selectedCrypto.sym}</span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
}

function populateSendAssetScreens() {
  const SEND_TOKENS = [
    { sym: 'BTC', name: 'Bitcoin', network: 'Bitcoin', bal: 0 },
    { sym: 'ETH', name: 'Ethereum', network: 'Ethereum', bal: 0 },
    { sym: 'USDT', name: 'Tether USD', network: 'Ethereum', parent: 'ETH', bal: 0 },
    { sym: 'USDC', name: 'USD Coin', network: 'Ethereum', parent: 'ETH', bal: 0 },
    { sym: 'SOL', name: 'Solana', network: 'Solana', bal: 0 },
    { sym: 'BNB', name: 'BNB', network: 'BNB Smart Chain', bal: 0 },
    { sym: 'TWT', name: 'Trust Wallet Token', network: 'BNB Smart Chain', parent: 'BNB', bal: 0 },
    { sym: 'TRX', name: 'Tron', network: 'Tron', bal: 0 },
    { sym: 'XRP', name: 'XRP', network: 'XRP Ledger', bal: 0 },
    { sym: 'AVAX', name: 'Avalanche', network: 'Avalanche', bal: 0 },
    { sym: 'MATIC', name: 'Polygon', network: 'Polygon', bal: 0 },
    { sym: 'LINK', name: 'Chainlink', network: 'Ethereum', parent: 'ETH', bal: 0 },
    { sym: 'AAVE', name: 'Aave', network: 'Ethereum', parent: 'ETH', bal: 0 },
    { sym: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', bal: 0 },
    { sym: 'ADA', name: 'Cardano', network: 'Cardano', bal: 0 },
    { sym: 'DOT', name: 'Polkadot', network: 'Polkadot', bal: 0 },
    { sym: 'ATOM', name: 'Cosmos', network: 'Cosmos Hub', bal: 0 },
    { sym: 'INJ', name: 'Injective', network: 'Injective', bal: 0 },
    { sym: 'SUI', name: 'Sui', network: 'Sui', bal: 0 },
    { sym: 'APT', name: 'Aptos', network: 'Aptos', bal: 0 },
  ];
  window._SEND_TOKENS = SEND_TOKENS;

  const filterRow = document.getElementById('send-network-filters');
  if (filterRow) {
    filterRow.innerHTML = `<div class="net-pill-box all on" onclick="filterSendByNet('all',this)">All</div>`;
    ['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'ARB', 'BASE'].forEach(sym => {
      const box = document.createElement('div');
      box.className = 'net-pill-box';
      box.innerHTML = logoAsset(sym, 28);
      box.onclick = () => filterSendByNet(sym, box);
      filterRow.appendChild(box);
    });
    const moreBox = document.createElement('div');
    moreBox.className = 'net-pill-box more';
    moreBox.textContent = '112 ▾';
    moreBox.onclick = () => pushScreen('select-network-screen');
    filterRow.appendChild(moreBox);
  }

  renderSendAssetsList(SEND_TOKENS);
}

function filterSendByNet(net, el) {
  sendNetworkFilter = net;
  haptic();
  if (el) {
    const row = document.getElementById('send-network-filters');
    if (row) row.querySelectorAll('.net-pill-box').forEach(p => p.classList.remove('on'));
    el.classList.add('on');
  }
  filterSendAssets();
}

function filterSendAssets() {
  const query = document.getElementById('send-asset-search-input')?.value.toLowerCase().trim() || '';
  const tokens = window._SEND_TOKENS || [];
  let filtered = tokens.filter(t => {
    const mNet = sendNetworkFilter === 'all' || t.network.toLowerCase().includes(sendNetworkFilter.toLowerCase()) || t.sym.toLowerCase() === sendNetworkFilter.toLowerCase();
    const mQ = !query || t.sym.toLowerCase().includes(query) || t.name.toLowerCase().includes(query);
    return mNet && mQ;
  });
  renderSendAssetsList(filtered);
}

function renderSendAssetsList(tokens) {
  const container = document.getElementById('send-asset-results');
  const empty = document.getElementById('send-empty-state');
  if (!container) return;
  if (tokens.length === 0) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  /* Pull live wallet balances if Supabase has loaded them */
  const liveBals = (typeof _walletRow !== 'undefined' && _walletRow?.balances) ? _walletRow.balances : {};

  container.innerHTML = tokens.map(t => {
    const d = liveMarketData[t.sym];
    const priceStr = d ? formatUSD(d.price) : '$0.00';
    const tokenBal = liveBals[t.sym] ?? t.bal ?? 0;
    const balUSD = d ? formatUSD(tokenBal * d.price) : '';
    return `
    <div class="net-row-item" data-sym="${t.sym}" onclick="openSendScreen('${t.sym}','${t.name}','${t.network}')">
      <div class="icon" style="position:relative;">
        ${logoAsset(t.sym, 44)}
        ${t.parent && !assetHasVideoBadge(t.sym) ? netBadgeSmall(t.parent, 14) : ''}
      </div>
      <div class="name-wrap">
        <div class="name-line">
          <span class="asset-name">${t.name}</span>
          <span class="asset-net" style="font-size:12px;color:#636366;">${t.sym}</span>
        </div>
        <div style="font-size:12px;color:#636366;">${t.network}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;">${tokenBal > 0 ? tokenBal + ' ' + t.sym : '0 ' + t.sym}</div>
        <div class="live-price" style="font-size:12px;color:#636366;">${tokenBal > 0 && balUSD ? balUSD : priceStr}</div>
      </div>
    </div>`;
  }).join('');
}

/* ─────────────── NAVIGATION ─────────────── */

function show(id, btn, navId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navId) {
    const nav = document.getElementById(navId);
    if (nav) nav.classList.add('active');
  }
  closeTradeMenu();
  updateBottomNavVisibility();
}

const PUSH_SCREENS_WITH_BOTTOM_NAV = new Set(['explore-dapps-screen']);

function updateBottomNavVisibility() {
  const visible = [...document.querySelectorAll('.push-screen.visible')];
  const shouldHide = visible.some(screen => !PUSH_SCREENS_WITH_BOTTOM_NAV.has(screen.id));
  document.body.classList.toggle('hide-bottom-nav', shouldHide);
}

function pushScreen(id) {
  closeTradeMenu();
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('visible');
    el.scrollTop = 0;
  }
  updateBottomNavVisibility();
}

function popScreen() {
  const visible = [...document.querySelectorAll('.push-screen.visible')];
  if (visible.length) visible[visible.length - 1].classList.remove('visible');
  updateBottomNavVisibility();
}

function closeAllPushScreens() {
  document.querySelectorAll('.push-screen.visible').forEach(screen => screen.classList.remove('visible'));
  updateBottomNavVisibility();
}

function toggleSwitch(el) {
  if (!el) return;
  el.classList.toggle('on');
}

function openSettingsPlaceholder(title, subtitle) {
  const header = document.getElementById('placeholder-header');
  const heading = document.getElementById('placeholder-title');
  const body = document.getElementById('placeholder-sub');
  if (header) header.textContent = title || 'Settings';
  if (heading) heading.textContent = title || 'Settings';
  if (body) body.textContent = subtitle || 'This option is connected for the prototype.';
  pushScreen('settings-placeholder-screen');
}

function createMockWallet() {
  openSettingsPlaceholder('Add wallet', 'Create, import, or restore wallet actions are connected for the prototype.');
}

function openRewardsFromSettings() {
  closeAllPushScreens();
  show('rewards', null, 'nav-rewards');
}

/* Rewards screen Active/Past tab switcher */
function rwTab(section, tab) {
  haptic();
  const activeEl = document.getElementById(`rw-${section}-active`);
  const pastEl   = document.getElementById(`rw-${section}-past`);
  if (!activeEl || !pastEl) return;
  if (tab === 'active') {
    activeEl.style.background = '#000'; activeEl.style.color = '#fff'; activeEl.style.fontWeight = '700';
    pastEl.style.background = 'transparent'; pastEl.style.color = '#8E8E93'; pastEl.style.fontWeight = '600';
  } else {
    pastEl.style.background = '#000'; pastEl.style.color = '#fff'; pastEl.style.fontWeight = '700';
    activeEl.style.background = 'transparent'; activeEl.style.color = '#8E8E93'; activeEl.style.fontWeight = '600';
  }
}

function toggleTradeMenu(forceOpen) {
  const overlay = document.getElementById('trade-menu-overlay');
  if (!overlay) return;
  if (forceOpen) overlay.classList.add('open');
  else overlay.classList.toggle('open');
}

function closeTradeMenu() {
  const overlay = document.getElementById('trade-menu-overlay');
  if (overlay) overlay.classList.remove('open');
}

function openBottomSheet(id) {
  document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('open'));
  const sheet = document.getElementById(id);
  if (sheet) sheet.classList.add('open');
  const overlay = document.getElementById('sheet-overlay');
  if (overlay) overlay.style.display = 'block';
}

function closeBottomSheets() {
  document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('open'));
  const overlay = document.getElementById('sheet-overlay');
  if (overlay) overlay.style.display = 'none';
}

/* ─────────────── UI ACTIONS ─────────────── */

function setHomeTab(tabId, tabEl) {
  const tabBar = tabEl.closest('.tab-bar');
  if (!tabBar) return;
  tabBar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  const panelMap = { crypto: 'home-panel-crypto', watchlist: 'home-panel-watchlist', nfts: 'home-panel-nfts' };
  document.querySelectorAll('#home .home-tab-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(panelMap[tabId]);
  if (target) target.classList.add('active');
}

function setTrendingFilter(btn, filter) {
  document.querySelectorAll('.filter-row .fpill').forEach(p => p.classList.remove('sel'));
  btn.classList.add('sel');
  currentTrendingFilter = filter;
  haptic();
  const tList = document.getElementById('trending-list');
  if (!tList) return;

  let tokens = buildLiveTokenList(filter);
  tList.innerHTML = renderTrending(tokens);
}

function setTxChip(el) {
  const group = el.closest('.tx-controls');
  if (group) {
    group.querySelectorAll('.tx-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }
}

function setTf(btn) {
  document.querySelectorAll('.tf').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  haptic();
  const up = btn.textContent.includes('1H') || btn.textContent.includes('All');
  const chartWrap = document.getElementById('detail-chart');
  if (chartWrap) chartWrap.innerHTML = spark(up, 340, 140, up ? '#00FFA3' : '#EA3943');
}

function detailTab(el) {
  document.querySelectorAll('.detail-tabs span').forEach(s => s.classList.remove('on'));
  el.classList.add('on');
  haptic();
}

function openDetail(sym, price, chg, up) {
  const d = document.getElementById('detail-screen');
  if (!d) return;

  /* Use live price if available */
  const liveData = liveMarketData[sym];
  const livePrice = liveData ? formatUSD(liveData.price) : price;
  const liveChg = liveData ? formatChg(liveData.change24h) : chg;
  const liveUp = liveData ? liveData.change24h >= 0 : up;

  d.querySelectorAll('.detail-sym').forEach(el => el.textContent = sym);
  const priceEl = d.querySelector('.detail-price');
  if (priceEl) priceEl.textContent = livePrice;
  const chgEl = d.querySelector('.detail-chg');
  if (chgEl) {
    chgEl.textContent = liveChg;
    chgEl.className = 'detail-chg ' + (liveUp ? 'green' : 'red');
  }
  const logoWrap = d.querySelector('.detail-logo');
  if (logoWrap) logoWrap.innerHTML = logoAsset(sym, 64);
  const chartWrap = document.getElementById('detail-chart');
  if (chartWrap) chartWrap.innerHTML = spark(liveUp, 340, 140, liveUp ? '#00FFA3' : '#EA3943');

  /* Populate holdings card */
  const mcapEl = d.querySelector('.detail-mcap');
  if (mcapEl && liveData) mcapEl.textContent = formatUSD(liveData.mcap);
  const volEl = d.querySelector('.detail-vol');
  if (volEl && liveData) volEl.textContent = formatUSD(liveData.vol24h);

  pushScreen('detail-screen');
}

/* ─── Active send state ─── */
let _sendSym = '';
let _sendName = '';
let _sendNetwork = '';
let _sendBal = 0;   // token balance from Supabase
let _sendPrice = 0;   // USD price from live market

function openSendScreen(sym, name, network) {
  haptic();
  _sendSym = sym;
  _sendName = name;
  _sendNetwork = network;

  /* Pull balance from Supabase wallet row */
  const balances = (typeof _walletRow !== 'undefined' && _walletRow?.balances) ? _walletRow.balances : {};
  _sendBal = parseFloat(balances[sym]) || 0;
  _sendPrice = getLivePrice(sym) || 0;

  /* Token logo */
  const logoEl = document.getElementById('send-token-logo');
  if (logoEl && typeof logoAsset === 'function') logoEl.innerHTML = logoAsset(sym, 40);

  /* Token name & sym */
  const symEl = document.getElementById('send-token-sym');
  const nameEl = document.getElementById('send-token-name');
  const balEl = document.getElementById('send-token-bal');
  const balSymEl = document.getElementById('send-token-bal-sym');
  const balUsdEl = document.getElementById('send-token-bal-usd');
  const priceEl = document.getElementById('send-token-price-tag');

  if (symEl) symEl.textContent = sym;
  if (nameEl) nameEl.textContent = name;
  if (balEl) balEl.textContent = _sendBal;
  if (balSymEl) balSymEl.textContent = sym;
  if (balUsdEl) balUsdEl.textContent = _sendPrice > 0 ? formatUSD(_sendBal * _sendPrice) : '';
  if (priceEl) priceEl.innerHTML = _sendPrice > 0
    ? `<div style="font-size:11px;color:#636366;">1 ${sym}</div><div style="font-weight:700;">${formatUSD(_sendPrice)}</div>`
    : '';

  /* Reset form */
  const addrInp = document.getElementById('send-addr-input');
  const amtInp = document.getElementById('send-amount-input');
  if (addrInp) addrInp.value = '';
  if (amtInp) amtInp.value = '';

  const errMsg = document.getElementById('send-err-msg');
  const revPanel = document.getElementById('send-review-panel');
  const submitBtn = document.getElementById('send-submit-btn');
  const usdHint = document.getElementById('send-usd-hint');

  if (errMsg) { errMsg.style.display = 'none'; errMsg.textContent = ''; }
  if (revPanel) revPanel.style.display = 'none';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '.4'; submitBtn.style.cursor = 'not-allowed'; }
  if (usdHint) usdHint.textContent = '\u2248 $0.00';

  pushScreen('send-screen');

  /* Phase 3: sync live balance from DB for the selected token */
  if (typeof syncSendTokenFromDB === 'function') syncSendTokenFromDB(sym);
}

function onSendAmountInput() {
  const amtInp = document.getElementById('send-amount-input');
  const usdHint = document.getElementById('send-usd-hint');
  const feeHint = document.getElementById('send-fee-hint');
  const amt = parseFloat(amtInp?.value) || 0;

  /* USD estimate */
  if (usdHint) {
    usdHint.textContent = amt > 0 && _sendPrice > 0
      ? '\u2248 ' + formatUSD(amt * _sendPrice)
      : '\u2248 $0.00';
  }

  /* Network fee hint */
  const feeUSD = _sendNetwork === 'Bitcoin' ? 3.50 : _sendNetwork === 'Ethereum' ? 2.14 : 0.05;
  if (feeHint) feeHint.textContent = 'Fee: ~' + formatUSD(feeUSD);

  validateSendForm();
}

function setSendMax() {
  haptic();
  const amtInp = document.getElementById('send-amount-input');
  if (amtInp) amtInp.value = _sendBal > 0 ? _sendBal : '';
  onSendAmountInput();
}

function validateSendForm() {
  const addr = document.getElementById('send-addr-input')?.value.trim();
  const amt = parseFloat(document.getElementById('send-amount-input')?.value) || 0;
  const submitBtn = document.getElementById('send-submit-btn');
  const errMsg = document.getElementById('send-err-msg');
  const revPanel = document.getElementById('send-review-panel');

  let err = '';
  if (amt > 0 && amt > _sendBal) err = `Insufficient balance. You have ${_sendBal} ${_sendSym}.`;

  if (errMsg) {
    if (err) { errMsg.textContent = err; errMsg.style.display = 'block'; }
    else { errMsg.style.display = 'none'; }
  }

  const isValid = addr && addr.length >= 10 && amt > 0 && amt <= _sendBal && !err;

  if (submitBtn) {
    submitBtn.disabled = !isValid;
    submitBtn.style.opacity = isValid ? '1' : '.4';
    submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }

  /* Update review panel */
  if (revPanel) {
    if (isValid) {
      revPanel.style.display = 'block';
      const revAmt = document.getElementById('rev-amount');
      const revUsd = document.getElementById('rev-usd');
      const revAddr = document.getElementById('rev-addr');
      const revNet = document.getElementById('rev-network');
      if (revAmt) revAmt.textContent = `-${amt} ${_sendSym}`;
      if (revUsd) revUsd.textContent = _sendPrice > 0 ? formatUSD(amt * _sendPrice) : '—';
      if (revAddr) revAddr.textContent = addr;
      if (revNet) revNet.textContent = _sendNetwork || '—';
    } else {
      revPanel.style.display = 'none';
    }
  }
}

function selectWallet(idx) {
  currentWallet = idx;
  const wName = document.getElementById('wallet-name');
  if (wName && WALLETS[idx]) wName.textContent = WALLETS[idx].name;
  haptic();
  popScreen();
}

/* ─────────────── BUY KEYPADS ─────────────── */

function keypadInput(key) {
  haptic();
  if (key === 'del') {
    buyAmount = buyAmount.slice(0, -1);
    if (!buyAmount) buyAmount = '0';
  } else if (key === '.') {
    if (!buyAmount.includes('.')) buyAmount += '.';
  } else {
    if (buyAmount === '0') buyAmount = key;
    else buyAmount += key;
    /* Cap at reasonable input length */
    if (buyAmount.length > 10) { buyAmount = buyAmount.slice(0, -1); return; }
  }
  updateBuyDisplay();
}

function setBuyCurrency(code) {
  selectedCurrency = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  renderCurrencies();
  updateBuySelectors();
  updateBuyDisplay();
  closeBottomSheets();
}

function setBuyCrypto(index) {
  selectedCrypto = BUY_CRYPTO[index];
  renderBuyCryptos();
  updateBuySelectors();
  updateBuyDisplay();
  closeBottomSheets();
}

/* ─────────────── SEND SCREEN VALIDATION ─────────────── */

async function validateAndSend() {
  const addr = document.getElementById('send-addr-input')?.value.trim();
  const amt = parseFloat(document.getElementById('send-amount-input')?.value) || 0;

  if (!addr || addr.length < 10) { showToast('⚠️ Enter a valid recipient address'); return; }
  if (!amt || amt <= 0) { showToast('⚠️ Enter an amount'); return; }
  if (amt > _sendBal) { showToast('⚠️ Insufficient balance'); return; }

  /* Disable button while processing */
  const btn = document.getElementById('send-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; btn.style.opacity = '.6'; }

  haptic();

  /* ⚡ Instant optimistic UI update — deduct balance before Supabase responds */
  if (typeof applyOptimisticSend === 'function') {
    applyOptimisticSend(_sendSym, amt, _sendPrice);
  }

  /* Fake tx hash */
  let txHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
  const amtStr = `-${amt} ${_sendSym}`;

  try {
    /* Phase 5: write wallet_transaction + deduct user_wallets balance */
    if (typeof executeSendOnDB === 'function') {
      const result = await executeSendOnDB(addr, amt);
      if (result?.hash) txHash = result.hash;
    }
  } catch (e) {
    console.warn('DB send error:', e);
  }

  /* Populate success screen */
  const succAmt = document.getElementById('succ-amount');
  const succAddr = document.getElementById('succ-addr');
  const succHash = document.getElementById('succ-hash');
  if (succAmt) succAmt.textContent = amtStr;
  if (succAddr) succAddr.textContent = addr;
  if (succHash) succHash.textContent = txHash.slice(0, 22) + '…';

  pushScreen('success-screen');
}

function finishSend() {
  haptic();
  closeAllPushScreens();
  show('home', null, 'nav-home');
}

/* ─────────────── SWAP SCREEN ─────────────── */

function calcSwap() {
  const from = parseFloat(document.getElementById('from-amount')?.value) || 0;
  /* Video flow uses BNB -> TWT. */
  const bnbPrice = getLivePrice('BNB') || 639.09;
  const twtPrice = getLivePrice('TWT') || 0.0856;
  const rate = bnbPrice / twtPrice;
  const to = document.getElementById('to-amount');
  if (to) to.textContent = (from * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* Update rate row */
  const rateEl = document.getElementById('swap-rate-display');
  if (rateEl) rateEl.textContent = `1 BNB = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} TWT`;
}

/* ─────────────── SEARCH ─────────────── */

const SEARCH_TOKENS = [
  { sym: 'BTC', name: 'Bitcoin', network: 'Bitcoin' },
  { sym: 'ETH', name: 'Ethereum', network: 'Ethereum' },
  { sym: 'SOL', name: 'Solana', network: 'Solana' },
  { sym: 'BNB', name: 'BNB Smart Chain', network: 'BNB Smart Chain' },
  { sym: 'TRX', name: 'Tron', network: 'Tron' },
  { sym: 'MATIC', name: 'Polygon', network: 'Ethereum' },
  { sym: 'ARB', name: 'Arbitrum', network: 'Arbitrum' },
  { sym: 'BASE', name: 'Base', network: 'Base' },
  { sym: 'OP', name: 'Optimism', network: 'Optimism' },
  { sym: 'USDT', name: 'Tether USD', network: 'Ethereum' },
  { sym: 'USDC', name: 'USD Coin', network: 'Ethereum' },
  { sym: 'XRP', name: 'XRP', network: 'XRP Ledger' },
  { sym: 'ADA', name: 'Cardano', network: 'Cardano' },
  { sym: 'DOGE', name: 'Dogecoin', network: 'Dogecoin' },
  { sym: 'LTC', name: 'Litecoin', network: 'Litecoin' },
  { sym: 'LINK', name: 'Chainlink', network: 'Ethereum' },
  { sym: 'AAVE', name: 'Aave', network: 'Ethereum' },
  { sym: 'DEXE', name: 'DeXe', network: 'BNB Smart Chain' },
  { sym: 'AVAX', name: 'Avalanche', network: 'Avalanche' },
  { sym: 'DOT', name: 'Polkadot', network: 'Polkadot' },
];

function doSearch(query) {
  currentSearchQuery = query.toLowerCase().trim();
  filterAndRenderSearch();
}

function filterNetwork(btn, network) {
  document.querySelectorAll('.search-chip').forEach(c => c.classList.remove('on'));
  btn.classList.add('on');
  currentNetworkFilter = network;
  filterAndRenderSearch();
}

function filterAndRenderSearch() {
  let filtered = SEARCH_TOKENS;
  if (currentNetworkFilter !== 'all') {
    const netMap = {
      eth: ['ETH', 'USDT', 'USDC', 'LINK', 'AAVE', 'MATIC', 'ARB', 'BASE', 'OP'],
      sol: ['SOL'],
      bnb: ['BNB', 'DEXE'],
      btc: ['BTC'],
    };
    const allowed = netMap[currentNetworkFilter] || [];
    filtered = filtered.filter(t => allowed.includes(t.sym));
  }
  if (currentSearchQuery) {
    filtered = filtered.filter(t =>
      t.sym.toLowerCase().includes(currentSearchQuery) ||
      t.name.toLowerCase().includes(currentSearchQuery)
    );
  }
  const container = document.getElementById('search-results');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#636366;font-size:15px;">No results for "${currentSearchQuery}"</div>`;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const d = liveMarketData[t.sym];
    const priceStr = d ? formatUSD(d.price) : '';
    const chgPct = d ? formatChg(d.change24h) : '';
    const chgColor = d && d.change24h >= 0 ? '#00FFA3' : '#EA3943';
    return `
    <div class="search-row" data-sym="${t.sym}" onclick="openDetail('${t.sym}','${priceStr}','${chgPct}',${d ? d.change24h >= 0 : false});popScreen()">
      <div class="search-icon" style="position:relative;">${logoAsset(t.sym, 44)}</div>
      <div class="search-meta" style="flex:1;">
        <div class="sym">${t.sym}</div>
        <div class="name">${t.name}</div>
      </div>
      ${d ? `<div style="text-align:right;"><div style="font-size:14px;font-weight:700;">${priceStr}</div><div class="live-price" style="font-size:12px;color:${chgColor};font-weight:700;">${chgPct}</div></div>` : ''}
      <div style="font-size:12px;color:#636366;background:#1C1C1E;padding:4px 10px;border-radius:12px;margin-left:8px;">${t.network}</div>
    </div>`;
  }).join('');
}

function filterNetworksList() {
  const query = document.getElementById('network-search-input')?.value.toLowerCase().trim() || '';
  const allNets = ALL_NETWORKS_DATA;
  const filtered = query ? allNets.filter(n => n.name.toLowerCase().includes(query) || n.sym.toLowerCase().includes(query)) : allNets;
  const container = document.getElementById('popular-networks-list');
  if (container) {
    container.innerHTML = filtered.map(n => `
      <div class="net-row-item" onclick="selectNetworkOption('${n.name}')">
        <div class="icon">${logoAsset(n.sym, 44)}</div>
        <div class="name-wrap"><div class="asset-name">${n.name}</div></div>
        <div class="custom-radio"></div>
      </div>`).join('');
  }
}

function selectNetFilter(net) {
  sendNetworkFilter = net;
  filterSendAssets();
  haptic();
  setTimeout(() => popScreen(), 200);
}

function copyAddress(addr) {
  haptic();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(addr)
      .then(() => showToast('✅ Address copied!'))
      .catch(() => showToast('Address: ' + addr));
  } else {
    showToast('Address: ' + addr);
  }
}

function showToast(msg, duration = 2200) {
  /* Remove existing toasts */
  document.querySelectorAll('.tw-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'tw-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position:absolute; bottom:110px; left:50%; transform:translateX(-50%);
    background:#1C1C1E; color:#fff; padding:10px 20px; border-radius:20px;
    font-weight:700; font-size:13px; z-index:9999; white-space:nowrap;
    border:1px solid #333; box-shadow:0 4px 20px rgba(0,0,0,0.5);
    animation:toastFade ${duration}ms forwards;
  `;
  /* Inject keyframe if not present */
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `@keyframes toastFade { 0%{opacity:0;transform:translateX(-50%) translateY(10px)} 15%{opacity:1;transform:translateX(-50%) translateY(0)} 80%{opacity:1} 100%{opacity:0} }`;
    document.head.appendChild(style);
  }
  document.querySelector('.phone')?.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ───────────── VIDEO SCREEN RENDERERS ───────────── */

const DAPP_VIDEO_ICON_MAP = {
  'Aave': 'DAPP_Aave.png',
  'Aster': 'DAPP_Aster.png',
  'Four': 'DAPP_Four.png',
  'Meteora': 'DAPP_Meteora.png',
  'Aerodrome': 'DAPP_Aerodrome.png',
  'Balancer': 'DAPP_Balancer.png',
  'Camelot': 'DAPP_Camelot.png',
  'Momentum': 'DAPP_Momentum.png',
  'Sushi': 'DAPP_Sushi.png',
  'Pump Swap': 'DAPP_Pump_Swap.png',
  'SUN': 'DAPP_SUN.png',
  '1inch.io': 'DAPP_1inch_io.png',
  'Trader Joe': 'DAPP_Trader_Joe.png',
  'Ethena': 'DAPP_Ethena.png',
  'PancakeSwap': 'DAPP_PancakeSwap.png',
  'Convex Finance': 'DAPP_Convex_Finance.png',
  'Beefy': 'DAPP_Beefy.png',
  'Summer.fi': 'DAPP_Summer_fi.png',
  'Harvest Finance': 'DAPP_Harvest_Finance.png',
  'yearn.finance': 'DAPP_yearn_finance.png',
  'InstaDApp': 'DAPP_InstaDApp.png',
  'Instadapp': 'DAPP_Instadapp.png',
  'MakerDAO': 'DAPP_MakerDAO.png',
  'Sanctum': 'DAPP_Sanctum.png',
  'Raydium': 'DAPP_Raydium.png',
  'Jito': 'DAPP_Jito.png',
  'Orca': 'DAPP_Orca.png',
  'Marginfi': 'DAPP_Marginfi.png',
  'Jupiter Exchange': 'DAPP_Jupiter_Exchange.png',
  'Kamino Finance': 'DAPP_Kamino_Finance.png',
  'Pump.Fun': 'DAPP_Pump_Fun.png',
  'Phi': 'DAPP_Phi.png',
  'Lens Protocol': 'DAPP_Lens_Protocol.png',
  'Galxe': 'DAPP_Galxe.png',
  'QuestN': 'DAPP_QuestN.png',
  'Playbux': 'DAPP_Playbux.png',
  'Morpho': 'DAPP_Morpho.png',
  'Justlend': 'DAPP_Justlend.png',
  'Venus': 'DAPP_Venus.png',
  'ZeroLend': 'DAPP_ZeroLend.png',
  'Cream': 'DAPP_Cream.png',
  'Spark Lend': 'DAPP_Spark_Lend.png',
  'Maple Finance': 'DAPP_Maple_Finance.png',
  'Compound Finance': 'DAPP_Compound_Finance.png',
  'Alien Worlds': 'DAPP_Alien_Worlds.png',
  'Axie Infinity': 'DAPP_Axie_Infinity.png',
  'CARV': 'DAPP_CARV.png',
  'Trust Wallet': 'DAPP_Trust_Moon.png'
};

const DAPP_ICON_DOMAINS = {
  'Aave':'aave.com',
  'Aster':'asterdex.com',
  'Four':'four.meme',
  'Meteora':'meteora.ag',
  'Aerodrome':'aerodrome.finance',
  'Balancer':'balancer.fi',
  'Camelot':'camelot.exchange',
  'Momentum':'momentum.xyz',
  'Sushi':'sushi.com',
  'Pump Swap':'pump.fun',
  'SUN':'sun.io',
  '1inch.io':'1inch.io',
  'Trader Joe':'traderjoexyz.com',
  'Ethena':'ethena.fi',
  'PancakeSwap':'pancakeswap.finance',
  'Convex Finance':'convexfinance.com',
  'Beefy':'beefy.finance',
  'Summer.fi':'summer.fi',
  'Harvest Finance':'harvest.finance',
  'yearn.finance':'yearn.fi',
  'InstaDApp':'instadapp.io',
  'Instadapp':'instadapp.io',
  'MakerDAO':'makerdao.com',
  'Venus':'venus.io',
  'Alpaca Finance':'alpacafinance.org',
  'Sanctum':'sanctum.so',
  'Raydium':'raydium.io',
  'Jito':'jito.network',
  'Orca':'orca.so',
  'Marginfi':'marginfi.com',
  'Jupiter Exchange':'jup.ag',
  'Kamino Finance':'kamino.finance',
  'Pump.Fun':'pump.fun',
  'Shadow Exchange':'shadow.so',
  'Beets':'beets.fi',
  'Silo Finance':'silo.finance',
  'Marinade':'marinade.finance',
  'Alien Worlds':'alienworlds.io',
  'Axie Infinity':'axieinfinity.com',
  'CARV':'carv.io',
  'Phi':'philand.xyz',
  'Lens Protocol':'lens.xyz',
  'Galxe':'galxe.com',
  'QuestN':'questn.com',
  'Playbux':'playbux.co',
  'Morpho':'morpho.org',
  'Justlend':'justlend.org',
  'ZeroLend':'zerolend.xyz',
  'Cream':'cream.finance',
  'Spark Lend':'spark.fi',
  'Maple Finance':'maple.finance',
  'Compound Finance':'compound.finance',
  'Trust Wallet':'trustwallet.com'
};

function fallbackInitial(label, size = 42) {
  const ch = (label || '?').trim().charAt(0).toUpperCase();
  const colors = ['#244BFF','#19A7CE','#F3BA2F','#8B5CF6','#16A46F','#FF6B6B','#111827'];
  const bg = colors[Math.abs(ch.charCodeAt(0) || 0) % colors.length];
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;background:${bg};color:#fff;font-weight:900;font-size:${Math.max(12, size * .42)}px;">${ch}</div>`;
}

function brandIcon(label, size = 42) {
  const screenshot = DAPP_SCREENSHOT_ICON_MAP[label];
  if (screenshot) return imageLogo(`${DAPP_SCREENSHOT_ICON_BASE}${screenshot}`, size, 'tw-asset-logo dapp-screenshot-logo');

  const local = DAPP_VIDEO_ICON_MAP[label];
  if (local) return imageLogo(`${VIDEO_ICON_BASE}${local}`, size, 'tw-asset-logo dapp-asset-logo');

  const domain = DAPP_ICON_DOMAINS[label];
  if (!domain) return fallbackInitial(label, size);
  const src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  const fallback = (label || '?').trim().charAt(0).toUpperCase();
  return `<div class="brand-icon" style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;background:#fff;display:grid;place-items:center;">
    <img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.textContent='${fallback}';this.parentElement.style.background='#e8e9ee';this.parentElement.style.color='#15171d';this.parentElement.style.fontWeight='900';"/>
  </div>`;
}

function symbolIcon(sym, size = 42) {
  return logoAsset(sym, size);
}

function videoInitialIcon(label, size = 42) {
  const maybeSym = String(label || '').toUpperCase();
  if (/^[A-Z0-9]{1,8}$/.test(maybeSym)) return symbolIcon(maybeSym, size);
  return brandIcon(label, size);
}

function renderDappTabs(containerId, selected) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Object.keys(DAPP_CATEGORIES).map(cat =>
    `<span class="dapp-tab ${cat === selected ? 'active on' : ''}" onclick="setDappCategory('${cat.replace(/'/g, "\\'")}')">${cat}</span>`
  ).join('');
  requestAnimationFrame(() => {
    const active = el.querySelector('.dapp-tab.active');
    if (!active) return;
    el.scrollLeft = selected === 'Games'
      ? el.scrollWidth
      : Math.max(0, active.offsetLeft - (el.clientWidth - active.clientWidth) / 2);
  });
}

function dappRow(item, index) {
  const [name, desc] = item;
  const freeLogo = ['Jito','Marinade','Harvest Finance','Element Market','Pendle','Veda','Phi','Avalon Labs','Rings','Pump.Fun'].includes(name);
  return `
    <div class="video-row" onclick="haptic()">
      <div class="video-rank">${index + 1}</div>
      <div class="video-icon dapp-logo-wrap ${freeLogo ? 'dapp-logo-free' : 'dapp-logo-round'}">${brandIcon(name, 42)}</div>
      <div class="video-meta">
        <div class="video-name">${name}</div>
        <div class="video-desc">${desc}</div>
      </div>
    </div>`;
}

function renderDiscoverDapps(category = currentDappCategory) {
  currentDappCategory = category;
  renderDappTabs('discover-dapp-tabs', category);
  const list = document.getElementById('discover-dapp-list');
  if (list) list.innerHTML = (DAPP_CATEGORIES[category] || DAPP_CATEGORIES.Featured).slice(0, 3).map(dappRow).join('');
  const latest = document.getElementById('discover-latest-list');
  if (latest) {
    latest.innerHTML = `
      <div class="section-card" style="margin:0;">
        <div class="video-row" onclick="haptic()">
          <div class="video-icon">${brandIcon('Trust Wallet', 42)}</div>
          <div class="video-meta">
            <div class="video-name">Introducing Trust Moon</div>
            <div class="video-desc">Our accelerator is live! Grow any project with Trust.</div>
          </div>
        </div>
        <div class="view-all" onclick="haptic()">View all &rsaquo;</div>
      </div>`;
  }
}

function renderFullDapps(category = currentDappCategory) {
  currentDappCategory = category;
  renderDappTabs('full-dapp-tabs', category);
  const list = document.getElementById('full-dapp-list');
  if (list) list.innerHTML = (DAPP_CATEGORIES[category] || DAPP_CATEGORIES.Featured).map(dappRow).join('');
}

function setDappCategory(category) {
  haptic();
  renderDiscoverDapps(category);
  renderFullDapps(category);
}

function renderSelectSymbols() {
  const q = document.getElementById('symbol-search-input')?.value.toLowerCase().trim() || '';
  const list = document.getElementById('symbol-results');
  if (!list) return;
  const filtered = SELECT_SYMBOL_TOKENS.filter(t => !q || t.sym.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  list.innerHTML = filtered.map(t => `
    <div class="symbol-row" onclick="haptic();popScreen()">
      <div class="symbol-star">★</div>
      <div class="video-icon">${videoInitialIcon(t.sym, 42)}</div>
      <div class="video-meta">
        <div class="video-name">${t.sym} <span style="font-size:11px;color:#8b8f99;">${t.lev}</span></div>
        <div class="video-desc">Vol: ${t.vol}</div>
      </div>
      <div class="symbol-price">${t.price}<div class="symbol-change ${t.up ? 'green' : 'red'}">${t.chg}%</div></div>
    </div>`).join('');
}

function renderVideoMarkets() {
  const perps = document.getElementById('perps-market-list');
  if (perps) {
    perps.innerHTML = SELECT_SYMBOL_TOKENS.slice(0, 7).map(t => `
      <div class="video-row" onclick="haptic()">
        <div class="video-icon">${videoInitialIcon(t.sym, 42)}</div>
        <div class="video-meta"><div class="video-name">${t.sym} <span style="font-size:11px;color:#8b8f99;">${t.lev}</span></div><div class="video-desc">Vol: ${t.vol}</div></div>
        <div class="symbol-price">${t.price}<div class="symbol-change ${t.up ? 'green' : 'red'}">${t.chg}%</div></div>
      </div>`).join('') + '<div class="view-all" onclick="pushScreen(\'select-symbol-screen\')">View all &rsaquo;</div>';
  }
  const meme = document.getElementById('meme-rush-list');
  if (meme) {
    const rows = [
      ['XiaoAn','$10.32K','-0.05%'], ['Alpha','$263.9K','-16.98%'],
      ['PENGUIN','$2.74M','+0.87%'], ['67','$2.65M','+0.57%'],
      ['MOODENG','$2.64M','-5.68%'], ['QUQ','$2.46M','+13.92%'],
      ['CLAWD','$2.34M','-0.15%'], ['DONKEY','$1.58M','+1.17%'],
      ['HOUSE','$1.54M','+0.09%'], ['Lobstar','$1.48M','+13.78%'],
    ];
    meme.innerHTML = rows.map((r, i) => `
      <div class="symbol-row" onclick="haptic()">
        <div class="symbol-star">${i < 2 ? '⚲' : ''}</div>
        <div class="video-icon">${videoInitialIcon(r[0], 42)}</div>
        <div class="video-meta"><div class="video-name">${r[0]}</div><div class="video-desc">${i + 1}m age</div></div>
        <div class="symbol-price">${r[1]}<div class="symbol-change ${r[2].startsWith('+') ? 'green' : 'red'}">${r[2]}</div></div>
      </div>`).join('');
  }
}

function bindVideoInteractions() {
  document.querySelectorAll('.dapps-card .view-all').forEach(el => {
    el.onclick = () => pushScreen('explore-dapps-screen');
  });
  document.querySelectorAll('#trade-screen .swap-sel').forEach(el => {
    el.style.cursor = 'pointer';
    el.onclick = () => pushScreen('select-symbol-screen');
  });
  const addWalletBtn = document.querySelector('#wallet-sheet [style*="dashed"]')?.parentElement;
  if (addWalletBtn) addWalletBtn.onclick = createMockWallet;
}

function getSupabaseWriteClient() {
  if (!window.supabase || typeof SUPABASE_URL === 'undefined' || !SUPABASE_ANON) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

async function createMockWallet() {
  haptic();
  const sb = getSupabaseWriteClient();
  const idx = ((typeof _walletRows !== 'undefined' && _walletRows.length) ? _walletRows.length : WALLETS.length) + 1;
  const address = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  if (!sb) {
    showToast(`Created local Wallet ${idx}`);
    return;
  }
  const { error } = await sb.from('wallets').insert({
    wallet_name: idx === 2 ? 'DeFi Vault' : `Main Wallet ${idx}`,
    address,
    balances: {},
    total_balance_usd: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  if (error) { showToast('Wallet create blocked by Supabase policy'); console.warn(error.message); return; }
  showToast(`Wallet ${idx} created`);
  if (typeof fetchAndRenderWallet === 'function') await fetchAndRenderWallet();
}

function renderVideoExperience() {
  renderDiscoverDapps(currentDappCategory);
  renderFullDapps(currentDappCategory);
  renderSelectSymbols();
  renderVideoMarkets();
  bindVideoInteractions();
  const tList = document.getElementById('trending-list');
  if (tList) tList.innerHTML = renderTrending(buildLiveTokenList(currentTrendingFilter));
  const ttScroll = document.getElementById('top-traded-scroll');
  if (ttScroll) ttScroll.innerHTML = renderTopTraded(VIDEO_TOP_TRADED);
}

function applyPreviewRouteFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const navMap = {
    home: 'nav-home',
    trending: 'nav-trending',
    rewards: 'nav-rewards',
    discover: 'nav-discover'
  };
  if (tab && navMap[tab]) show(tab, null, navMap[tab]);
  const category = params.get('cat');
  if (category && DAPP_CATEGORIES[category]) setDappCategory(category);
  const homeTab = params.get('homeTab');
  if (homeTab) {
    const tabEl = [...document.querySelectorAll('#home .tab-bar .tab')]
      .find(el => el.textContent.trim().toLowerCase() === homeTab.toLowerCase());
    if (tabEl) setHomeTab(homeTab.toLowerCase(), tabEl);
  }
  const push = params.get('push');
  if (push && document.getElementById(push)) pushScreen(push);
}

/* ─────────────── TIMERS ─────────────── */

setInterval(() => {
  document.querySelectorAll('.timer').forEach(el => {
    const end = parseInt(el.getAttribute('data-end'));
    if (!isNaN(end)) {
      el.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${formatTimeLeft(end)}`;
    }
  });
}, 1000);

/* Live price ticker in header - subtle pulsing dot indicator */
function updateLiveDot() {
  const dot = document.getElementById('live-indicator');
  if (dot) {
    dot.style.background = '#00FFA3';
    setTimeout(() => { if (dot) dot.style.background = '#333'; }, 500);
  }
}

/* ─────────────── INIT ─────────────── */

window.addEventListener('DOMContentLoaded', () => {
  try {
    /* Render static modules */
    renderDashModules();
    renderReceiveFilters();
    renderReceiveAssets();
    renderReceiveAllCryptos();
    renderPopularNetworks();
    renderCurrencies();
    renderBuyCryptos();
    updateBuyDisplay();
    updateBuySelectors();
    populateSendAssetScreens();

    /* Initial render with fallback data */
    const tList = document.getElementById('trending-list');
    if (tList) tList.innerHTML = renderTrending(buildLiveTokenList(currentTrendingFilter));

    const ttScroll = document.getElementById('top-traded-scroll');
    if (ttScroll) ttScroll.innerHTML = renderTopTraded(VIDEO_TOP_TRADED);

    const wName = document.getElementById('wallet-name');
    if (wName) wName.textContent = WALLETS[currentWallet]?.name || 'Main Wallet 1';

    /* Init search */
    filterAndRenderSearch();
    renderVideoExperience();
    applyPreviewRouteFromQuery();

    /* Start real-time market data polling */
    startPolling(60000); // refresh every 60 seconds

    /* Connect Supabase backend — live wallet balance + transaction history */
    if (typeof initSupabase === 'function') {
      initSupabase();
    }

    console.log('✅ Trust Wallet UI v5 initialized with live market data + Supabase backend');
  } catch (e) {
    console.error('Init error:', e);
  }
});

