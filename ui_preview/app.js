/* ============================================================
   Trust Wallet UI – Production Application Logic v5
   Real-time market data via CoinGecko API
   ============================================================ */

/* ─────────────── COINGECKO COIN ID MAP ─────────────── */
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
  const liveTokens = buildLiveTokenList();
  tList.innerHTML = renderTrending(liveTokens);
}

function buildLiveTokenList(filter) {
  const syms = ['LINK', 'AAVE', 'DEXE', 'SOL', 'ETH', 'BNB', 'BTC', 'XRP', 'AVAX', 'MATIC', 'ARB', 'TWT'];
  let tokens = syms.map(sym => {
    const d = liveMarketData[sym];
    const net = getParentNetwork(sym);
    if (d) {
      const up = d.change24h >= 0;
      return {
        sym, name: sym,
        price: formatUSD(d.price),
        chg: formatChg(d.change24h),
        mcap: formatUSD(d.mcap),
        vol: formatUSD(d.vol24h),
        up, net
      };
    }
    /* fallback */
    return FALLBACK_HOT_TOKENS.find(t => t.sym === sym) || {
      sym, name: sym, price: '—', chg: '—', mcap: '—', vol: '—', up: false, net
    };
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
  const syms = ['ETH', 'BNB', 'SOL'];
  const tokens = syms.map(sym => {
    const d = liveMarketData[sym];
    if (d) {
      const up = d.change24h >= 0;
      return { sym, name: sym, price: formatUSD(d.price), chg: formatChg(d.change24h), up };
    }
    return FALLBACK_TOP_TRADED.find(t => t.sym === sym) || { sym, name: sym, price: '—', chg: '—', up: false };
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

/* SVG Logo generator */
function logoAsset(sym, size = 42) {
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
    'MATIC': `<circle cx="21" cy="21" r="21" fill="#8247E5"/><path d="M25 15l-4 7 4 7-8-3.5V18.5z" fill="#fff"/>`,
    'AVAX': `<circle cx="21" cy="21" r="21" fill="#E84142"/><path d="M21 11l6 10h-5l-1 2-1-2h-5z" fill="#fff"/>`,
    'USDC': `<circle cx="21" cy="21" r="21" fill="#2775CA"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Inter">USDC</text>`,
    'TWT': `<circle cx="21" cy="21" r="21" fill="#3375BB"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Inter">TWT</text>`,
    'XAUt': `<circle cx="21" cy="21" r="21" fill="#F5A623"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Inter">XAU</text>`,
    'U': `<circle cx="21" cy="21" r="21" fill="#4A4A8A"/><text x="21" y="27" text-anchor="middle" fill="#fff" font-size="16" font-weight="800" font-family="Inter">U</text>`,
    'JLP': `<circle cx="21" cy="21" r="21" fill="#00B0FF"/><path d="M14 18 Q21 12 28 18 Q21 30 14 18z" fill="#fff" opacity=".8"/>`,
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
  const svg = logos[sym] || `<circle cx="21" cy="21" r="21" fill="#333"/><text x="21" y="26" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Inter">${sym.slice(0, 4)}</text>`;
  return `<svg viewBox="0 0 42 42" width="${size}" height="${size}">${svg}</svg>`;
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
    histList.innerHTML = HISTORY_MOCK.map(h => `
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
        ${logoAsset(t.sym, 44)}
        ${t.net && t.net !== t.sym ? netBadgeSmall(t.net, 16) : ''}
      </div>
      <div class="token-info" style="flex:1;">
        <div class="name">${t.name}</div>
        <div class="mcap">${t.mcap} MCap · ${t.vol} Vol</div>
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
      <div class="tc-name">
        ${logoAsset(t.sym, 18)}
        <span style="font-size:12px;color:#8E8E93;font-weight:600;">${t.name}</span>
        <div style="margin-left:auto;">${logoAsset(t.sym, 14)}</div>
      </div>
      <div class="tc-price">${t.price}</div>
      <div class="tc-chg" style="color:${t.up ? '#00FFA3' : '#EA3943'}">${t.chg}</div>
      <div class="tc-chart">${spark(t.up, 110, 36)}</div>
    </div>`).join('');
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
      `<div class="net-pill-box all on" onclick="haptic()">All</div>` +
      nets.map(n => `<div class="net-pill-box" onclick="haptic()">${logoAsset(n, 28)}</div>`).join('') +
      `<div class="net-pill-box more" onclick="pushScreen('select-network-screen')">112 ▾</div>`;
  });
}

function renderReceiveAssets() {
  const container = document.getElementById('receive-asset-list');
  if (!container) return;
  const list = ['BTC', 'ETH', 'SOL', 'BNB', 'TWT', 'USDT', 'USDC'];
  container.innerHTML = list.map(sym => {
    const addr = WALLET_ADDRESSES[sym] || WALLET_ADDRESSES['default'];
    const netMap = { BTC: 'Bitcoin', SOL: 'Solana', BNB: 'BNB Smart Chain', TWT: 'BNB Smart Chain', default: 'Ethereum' };
    const net = netMap[sym] || netMap.default;
    const parent = ['TWT'].includes(sym) ? 'BNB' : (['USDT', 'USDC'].includes(sym) ? 'ETH' : null);
    return `
      <div class="net-row-item">
        <div class="icon" style="position:relative;">
          ${logoAsset(sym, 44)}
          ${parent ? netBadgeSmall(parent, 14) : ''}
        </div>
        <div class="name-wrap">
          <div class="name-line">
            <span class="asset-name">${sym}</span>
            <span class="asset-net">${net}</span>
          </div>
          <div class="asset-addr">${addr}</div>
        </div>
        <div class="actions">
          <button class="action-btn-sm" onclick="haptic()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0 4h4V17m-4 0h4"/></svg></button>
          <button class="action-btn-sm" onclick="copyAddress('${addr}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></button>
        </div>
      </div>`;
  }).join('');
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
        ${c.netSym ? `<div class="net-badge-small">${logoAsset(c.netSym, 12)}</div>` : ''}
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
        ${t.parent ? netBadgeSmall(t.parent, 14) : ''}
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
}

function pushScreen(id) {
  closeTradeMenu();
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

function popScreen() {
  const visible = [...document.querySelectorAll('.push-screen.visible')];
  if (visible.length) visible[visible.length - 1].classList.remove('visible');
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
  haptic();
  const tList = document.getElementById('trending-list');
  if (!tList) return;

  let tokens;
  if (Object.keys(liveMarketData).length > 0) {
    tokens = buildLiveTokenList(filter);
  } else {
    tokens = filter === 'gainers'
      ? [...FALLBACK_HOT_TOKENS].sort((a, b) => parseFloat(b.chg) - parseFloat(a.chg))
      : FALLBACK_HOT_TOKENS;
  }
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
  const txHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
  const amtStr = `-${amt} ${_sendSym}`;
  const usdStr = _sendPrice > 0 ? formatUSD(amt * _sendPrice) : '';

  try {
    /* Use service-role client so RLS doesn't block writes */
    const sbAdmin = window.supabase?.createClient(SUPABASE_URL, SUPABASE_SERVICE);
    if (sbAdmin && typeof _walletRow !== 'undefined' && _walletRow) {

      /* 1 — Insert Sent transaction */
      await sbAdmin.from('transactions').insert({
        type: 'Sent',
        symbol: _sendSym,
        amount: amtStr,
        status: 'Pending',
        icon: '↗',
        color: '#EA3943',
        network: _sendNetwork || null,
        to_address: addr,
        tx_hash: txHash,
        notes: usdStr ? `Value: ${usdStr}` : null,
        created_at: new Date().toISOString()
      });

      /* 2 — Deduct token holding */
      const balances = { ...(_walletRow.balances || {}) };
      balances[_sendSym] = Math.max(0, (_sendBal || 0) - amt);

      /* 3 — Deduct USD total */
      const currentBal = parseFloat(_walletRow.total_balance_usd) || 0;
      const deductUSD = _sendPrice > 0 ? amt * _sendPrice : 0;
      const newBal = Math.max(0, currentBal - deductUSD);

      const { error: wErr } = await sbAdmin.from('wallets').update({
        balances,
        total_balance_usd: newBal,
        updated_at: new Date().toISOString()
      }).eq('id', _walletRow.id);

      if (wErr) console.warn('Wallet update error:', wErr.message);
    }
  } catch (e) {
    console.warn('Supabase send error:', e);
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
  /* Pop all push screens back to home tab */
  while (typeof screenStack !== 'undefined' && screenStack.length > 0) popScreen();
}

/* ─────────────── SWAP SCREEN ─────────────── */

function calcSwap() {
  const from = parseFloat(document.getElementById('from-amount')?.value) || 0;
  /* Use live ETH price if available */
  const ethPrice = getLivePrice('ETH') || 2349.84;
  const to = document.getElementById('to-amount');
  if (to) to.textContent = (from * ethPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* Update rate row */
  const rateEl = document.getElementById('swap-rate-display');
  if (rateEl) rateEl.textContent = `1 ETH ≈ ${formatUSD(ethPrice)}`;
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
    renderPopularNetworks();
    renderCurrencies();
    renderBuyCryptos();
    updateBuyDisplay();
    updateBuySelectors();
    populateSendAssetScreens();

    /* Initial render with fallback data */
    const tList = document.getElementById('trending-list');
    if (tList) tList.innerHTML = renderTrending(FALLBACK_HOT_TOKENS);

    const ttScroll = document.getElementById('top-traded-scroll');
    if (ttScroll) ttScroll.innerHTML = renderTopTraded(FALLBACK_TOP_TRADED);

    const wName = document.getElementById('wallet-name');
    if (wName) wName.textContent = WALLETS[currentWallet]?.name || 'Main Wallet 1';

    /* Init search */
    filterAndRenderSearch();

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
