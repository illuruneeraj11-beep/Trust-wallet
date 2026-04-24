/* ============================================================
   Trust Wallet Clone — Blockchain Sync Module v1
   Real-time balance fetching via public EVM RPC endpoints
   No API key required for read-only balance calls

   Chains: Ethereum, BNB Smart Chain, Polygon, Avalanche
   Tokens: ETH, BNB, MATIC, AVAX, USDT, USDC, LINK, AAVE, TWT

   Sync layers:
   1. Immediate  — optimistic UI update on send (in app.js)
   2. 30-second  — pending tx auto-confirm → balance reconcile
   3. 60-second  — full on-chain balance re-fetch
   ============================================================ */

/* ─── Public RPC endpoints — no API key needed ─── */
const RPC_ENDPOINTS = {
  ETH:   'https://eth.llamarpc.com',
  BNB:   'https://bsc-dataseed1.binance.org',
  MATIC: 'https://polygon-rpc.com',
  AVAX:  'https://api.avax.network/ext/bc/C/rpc',
};

/* ─── ERC-20 / BEP-20 token contract addresses ─── */
const TOKEN_CONTRACTS = {
  /* Ethereum Mainnet */
  ETH_USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  ETH_USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  ETH_LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  ETH_AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  ETH_UNI:  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  /* BNB Smart Chain */
  BSC_USDT: '0x55d398326f99059fF775485246999027B3197955',
  BSC_USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  BSC_TWT:  '0x4B0F1812e5Df2A09796481Ff14017e6005508003',
};

/* ─── Token decimals ─── */
const TOKEN_DECIMALS = {
  ETH:18, BNB:18, MATIC:18, AVAX:18,
  USDT:6, USDC:6, LINK:18, AAVE:18, UNI:18, TWT:18,
};

/* ─── State ─── */
let _blockchainSyncActive = false;
let _walletAddress         = null;
let _blockchainSyncTimer   = null;
let _pendingPollTimer      = null;
let _lastOnChainSync       = null;

/* ════════════════════════════════════════════
   LOW-LEVEL RPC HELPERS
════════════════════════════════════════════ */

async function _rpcCall(url, method, params = []) {
  const resp = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
    signal:  AbortSignal.timeout(8000),
  });
  const json = await resp.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

/* Fetch native coin balance: ETH / BNB / MATIC / AVAX */
async function _fetchNativeBal(rpcUrl, address) {
  try {
    const hex = await _rpcCall(rpcUrl, 'eth_getBalance', [address, 'latest']);
    return parseInt(hex, 16) / 1e18;
  } catch (e) {
    console.warn(`[rpc] native balance failed (${rpcUrl.split('/')[2]}):`, e.message);
    return null;
  }
}

/* Fetch ERC-20 / BEP-20 balance via eth_call → balanceOf(address) */
async function _fetchTokenBal(rpcUrl, tokenContract, walletAddress, decimals = 18) {
  try {
    const pad  = walletAddress.replace('0x', '').toLowerCase().padStart(64, '0');
    const data = '0x70a08231' + pad; // balanceOf(address)
    const hex  = await _rpcCall(rpcUrl, 'eth_call', [{ to: tokenContract, data }, 'latest']);
    if (!hex || hex === '0x' || hex === '0x0') return 0;
    return parseInt(hex, 16) / Math.pow(10, decimals);
  } catch (e) {
    console.warn(`[rpc] token balance failed (${tokenContract.slice(0,10)}):`, e.message);
    return null;
  }
}

/* ════════════════════════════════════════════
   FULL ON-CHAIN BALANCE SYNC
════════════════════════════════════════════ */

async function syncBlockchainBalances() {
  const address = _walletAddress;
  if (!address || !address.startsWith('0x') || address.length < 42) {
    console.log('🔗 Blockchain sync skipped — no valid EVM address');
    setSyncIndicator('idle', 'No address');
    return null;
  }

  console.log(`🔗 Fetching on-chain balances for ${address.slice(0,10)}…`);
  setSyncIndicator('syncing');

  /* Parallel fetch across all chains & tokens */
  const [
    ethBal, bnbBal, maticBal, avaxBal,
    usdtEth, usdcEth, linkEth, aaveEth,
    usdtBsc, twtBsc, usdcBsc,
  ] = await Promise.all([
    _fetchNativeBal(RPC_ENDPOINTS.ETH,   address),
    _fetchNativeBal(RPC_ENDPOINTS.BNB,   address),
    _fetchNativeBal(RPC_ENDPOINTS.MATIC, address),
    _fetchNativeBal(RPC_ENDPOINTS.AVAX,  address),
    _fetchTokenBal(RPC_ENDPOINTS.ETH, TOKEN_CONTRACTS.ETH_USDT, address, 6),
    _fetchTokenBal(RPC_ENDPOINTS.ETH, TOKEN_CONTRACTS.ETH_USDC, address, 6),
    _fetchTokenBal(RPC_ENDPOINTS.ETH, TOKEN_CONTRACTS.ETH_LINK, address, 18),
    _fetchTokenBal(RPC_ENDPOINTS.ETH, TOKEN_CONTRACTS.ETH_AAVE, address, 18),
    _fetchTokenBal(RPC_ENDPOINTS.BNB, TOKEN_CONTRACTS.BSC_USDT, address, 18),
    _fetchTokenBal(RPC_ENDPOINTS.BNB, TOKEN_CONTRACTS.BSC_TWT,  address, 18),
    _fetchTokenBal(RPC_ENDPOINTS.BNB, TOKEN_CONTRACTS.BSC_USDC, address, 18),
  ]);

  /* Build on-chain balances map */
  const onChain = {};
  const _set = (sym, val, dp = 8) => { if (val !== null && val >= 0) onChain[sym] = parseFloat(val.toFixed(dp)); };

  _set('ETH',   ethBal);
  _set('BNB',   bnbBal);
  _set('MATIC', maticBal, 4);
  _set('AVAX',  avaxBal,  4);

  /* Aggregate USDT across chains */
  const totalUSDT = (usdtEth || 0) + (usdtBsc || 0);
  _set('USDT', totalUSDT, 2);

  const totalUSDC = (usdcEth || 0) + (usdcBsc || 0);
  _set('USDC', totalUSDC, 2);

  if ((linkEth || 0) > 0) _set('LINK', linkEth, 4);
  if ((aaveEth || 0) > 0) _set('AAVE', aaveEth, 4);
  if ((twtBsc  || 0) > 0) _set('TWT',  twtBsc,  4);

  /* Check if we got any non-zero data (demo address = all zeros) */
  const hasData = Object.values(onChain).some(v => v > 0);
  if (!hasData) {
    console.log('ℹ️ All on-chain balances are 0 (demo/empty address)');
    setSyncIndicator('idle', 'No funds on-chain');
    return null;
  }

  /* Calculate USD total from on-chain balances + live prices */
  let totalUSD = 0;
  for (const [sym, bal] of Object.entries(onChain)) {
    const price = (typeof getLivePrice === 'function') ? (getLivePrice(sym) || 0) : 0;
    totalUSD += bal * price;
  }

  /* Push to Supabase so UI gets realtime update */
  try {
    const sbAdmin = window.supabase?.createClient(SUPABASE_URL, SUPABASE_SERVICE);
    if (sbAdmin && typeof _walletRow !== 'undefined' && _walletRow) {
      /* Merge — on-chain wins for keys it has, keep manual entries for the rest */
      const merged  = { ...(_walletRow.balances || {}), ...onChain };
      const finalUSD = totalUSD > 0
        ? parseFloat(totalUSD.toFixed(2))
        : parseFloat(_walletRow.total_balance_usd || 0);

      const { error } = await sbAdmin.from('wallets').update({
        balances:          merged,
        total_balance_usd: finalUSD,
        updated_at:        new Date().toISOString(),
      }).eq('id', _walletRow.id);

      if (error) throw error;
      _lastOnChainSync = new Date();
      console.log(`✅ On-chain sync complete — $${finalUSD.toFixed(2)} USD`);
      setSyncIndicator('synced');
      return onChain;
    }
  } catch (e) {
    console.warn('Supabase blockchain update failed:', e.message);
    setSyncIndicator('error', e.message);
  }
  return null;
}

/* ════════════════════════════════════════════
   PENDING TRANSACTION RECONCILER
   Polls Supabase every 10s, auto-confirms txs
   older than 30s, syncs balance after each confirm
════════════════════════════════════════════ */

let _pendingReconcileRunning = false;

async function reconcilePendingTransactions() {
  if (_pendingReconcileRunning) return;
  _pendingReconcileRunning = true;

  try {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!sb) return;

    const { data: pending } = await sb
      .from('transactions')
      .select('id, type, symbol, amount, created_at, status')
      .eq('status', 'Pending')
      .order('created_at', { ascending: true });

    if (!pending?.length) return;

    const sbAdmin = window.supabase?.createClient(SUPABASE_URL, SUPABASE_SERVICE);
    if (!sbAdmin) return;

    const now = Date.now();
    for (const tx of pending) {
      const ageMs = now - new Date(tx.created_at).getTime();

      if (ageMs >= 30000) {
        /* Confirm the transaction */
        const { error } = await sbAdmin
          .from('transactions')
          .update({ status: 'Confirmed' })
          .eq('id', tx.id);

        if (!error) {
          console.log(`✅ Auto-confirmed: ${tx.type} ${tx.amount} ${tx.symbol} (${Math.round(ageMs/1000)}s old)`);
          if (typeof showToast === 'function') {
            showToast(`✅ ${tx.symbol} transfer Confirmed`);
          }
          /* Re-sync balance after confirmation */
          setTimeout(syncBlockchainBalances, 2000);
        }
      } else {
        /* Schedule precise re-check when this tx hits 30s */
        const msLeft = 30000 - ageMs;
        setTimeout(() => {
          _pendingReconcileRunning = false;
          reconcilePendingTransactions();
        }, msLeft + 1000);
      }
    }
  } finally {
    _pendingReconcileRunning = false;
  }
}

/* ════════════════════════════════════════════
   INSTANT OPTIMISTIC UPDATE
   Called immediately after validateAndSend()
   so the UI shows the new balance before
   any network round-trip completes
════════════════════════════════════════════ */

function applyOptimisticSend(sym, amount, priceUSD) {
  if (typeof _walletRow === 'undefined' || !_walletRow) return;

  /* Update local state so UI re-renders without waiting for Supabase */
  const balances = { ...(_walletRow.balances || {}) };
  balances[sym] = Math.max(0, (parseFloat(balances[sym]) || 0) - amount);

  const currentUSD = parseFloat(_walletRow.total_balance_usd) || 0;
  const deductUSD  = priceUSD > 0 ? amount * priceUSD : 0;
  const newUSD     = Math.max(0, currentUSD - deductUSD);

  /* Patch local _walletRow so next render uses updated values */
  _walletRow = { ..._walletRow, balances, total_balance_usd: newUSD };

  /* Immediately apply to UI */
  if (typeof applyWalletToUI === 'function') applyWalletToUI(_walletRow);

  console.log(`⚡ Optimistic update: ${sym} −${amount}, balance now $${newUSD.toFixed(2)}`);
}

/* ════════════════════════════════════════════
   SYNC STATUS INDICATOR
════════════════════════════════════════════ */

function setSyncIndicator(status, detail = '') {
  const map = {
    syncing: { text: '⟳ Syncing…',       color: '#F0A500' },
    synced:  { text: '● Live',            color: '#00FFA3' },
    idle:    { text: '○ Ready',           color: '#636366' },
    error:   { text: '⚠ Sync Error',     color: '#EA3943' },
  };
  const s = map[status] || map.idle;

  /* Update any badge elements in the UI */
  document.querySelectorAll('.chain-sync-badge').forEach(el => {
    el.textContent = s.text;
    el.style.color = s.color;
  });

  /* Update last-sync timestamps */
  if (status === 'synced' && _lastOnChainSync) {
    document.querySelectorAll('.chain-sync-time').forEach(el => {
      el.textContent = 'Synced ' + _lastOnChainSync.toLocaleTimeString();
    });
  }

  console.log(`[BlockchainSync] ${s.text}${detail ? ' — ' + detail : ''}`);
}

/* ════════════════════════════════════════════
   INIT — called from initSupabase() after
   wallet row is loaded
════════════════════════════════════════════ */

async function startBlockchainSync() {
  if (_blockchainSyncActive) return;
  _blockchainSyncActive = true;

  /* Read wallet address from Supabase row */
  _walletAddress = (typeof _walletRow !== 'undefined' && _walletRow?.address)
    ? _walletRow.address
    : null;

  console.log(`🔗 Blockchain sync — address: ${_walletAddress || 'not set'}`);

  /* 1. Immediate on-chain balance fetch */
  await syncBlockchainBalances();

  /* 2. Immediate pending tx check */
  reconcilePendingTransactions();

  /* 3. Pending tx poller — every 10 seconds */
  _pendingPollTimer = setInterval(reconcilePendingTransactions, 10000);

  /* 4. Full on-chain re-sync — every 60 seconds */
  _blockchainSyncTimer = setInterval(async () => {
    /* Re-read address in case admin updated it */
    if (typeof _walletRow !== 'undefined' && _walletRow?.address) {
      _walletAddress = _walletRow.address;
    }
    await syncBlockchainBalances();
  }, 60000);

  console.log('✅ Blockchain sync active: on-chain 60s | pending-confirm 10s | optimistic instant');
}
