/* ============================================================
   Trust Wallet Clone — Supabase Backend v6
   Aligned with Phase 1 Schema (gemini-code-1778916450935.md)
   Supports: Phase 1 (DB) + Phase 2 (Auth Guard) + Phase 5 (Portfolio)
   ============================================================ */

let _supabase = null;
let _walletData = [];     // rows from user_wallets (joined with assets + networks)
let _txData    = [];      // rows from wallet_transactions

/* ─────────────────────────────────────────
   CLIENT
───────────────────────────────────────── */
function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined' || typeof SUPABASE_ANON === 'undefined') return null;
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _supabase;
}

/* ─────────────────────────────────────────
   PHASE 2 — AUTH GUARD (PIN)
───────────────────────────────────────── */
function initAuthGuard() {
  const overlay = document.createElement('div');
  overlay.id    = 'auth-guard';
  overlay.className = 'guard-overlay';
  overlay.innerHTML = `
    <div style="text-align:center; margin-bottom:32px;">
      <div style="width:64px;height:64px;border-radius:20px;background:#0052FF;display:grid;place-items:center;margin:0 auto 16px;font-size:32px;">🛡️</div>
      <div style="font-size:20px;font-weight:800;color:#fff;">Trust Wallet</div>
      <div style="font-size:13px;color:#636366;margin-top:4px;">Enter your passcode</div>
    </div>
    <div class="pin-dots" id="pin-dots">
      <div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>
      <div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>
    </div>
    <div class="pin-pad">
      ${[1,2,3,4,5,6,7,8,9].map(n=>`<div class="pin-btn" onclick="inputPin(${n})">${n}</div>`).join('')}
      <div></div>
      <div class="pin-btn" onclick="inputPin(0)">0</div>
      <div class="pin-btn" onclick="clearLastPin()" style="font-size:18px;">⌫</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

let _pin = '';
window.inputPin = (n) => {
  if (_pin.length >= 6) return;
  _pin += String(n);
  _renderPinDots();
  if (_pin.length === 6) setTimeout(_unlockAndFetch, 350);
};
window.clearLastPin = () => {
  _pin = _pin.slice(0, -1);
  _renderPinDots();
};
function _renderPinDots() {
  document.querySelectorAll('#pin-dots .pin-dot').forEach((d, i) => {
    d.classList.toggle('filled', i < _pin.length);
  });
}
function _unlockAndFetch() {
  const guard = document.getElementById('auth-guard');
  if (!guard) return;
  guard.style.transition = 'opacity .4s ease, transform .4s ease';
  guard.style.opacity    = '0';
  guard.style.transform  = 'scale(1.05)';
  setTimeout(() => { guard.remove(); _startLifecycle(); }, 420);
}

/* ─────────────────────────────────────────
   LIFECYCLE
───────────────────────────────────────── */
async function _startLifecycle() {
  const sb = getSupabase();
  if (!sb) { console.error('❌ Supabase not initialised'); return; }
  console.log('🚀 Trust Wallet backend started');

  // Initial load
  await _fetchAll();

  // Realtime subscriptions
  sb.channel('tw-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' },      _fetchAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions'}, _fetchAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' },            _fetchAll)
    .subscribe(status => console.log('📡 Realtime:', status));

  // Polling fallback every 10 s
  setInterval(_fetchAll, 10_000);
}

/* ─────────────────────────────────────────
   PHASE 1 — DATA FETCHING
   Exact join: user_wallets -> assets -> networks
───────────────────────────────────────── */
async function _fetchAll() {
  const sb = getSupabase();
  if (!sb) return;

  try {
    // 1. user_wallets joined to assets, assets joined to networks
    const { data: wallets, error: wErr } = await sb
      .from('user_wallets')
      .select(`
        id,
        balance_amount,
        wallet_address,
        assets (
          id, symbol, name, market_price, price_change_24h, coingecko_id,
          networks ( id, name, short_name )
        )
      `);

    if (wErr) throw new Error('user_wallets query: ' + wErr.message);
    _walletData = wallets || [];
    console.log('📦 user_wallets rows:', _walletData.length);

    // 2. wallet_transactions joined to assets
    const { data: txs, error: tErr } = await sb
      .from('wallet_transactions')
      .select(`
        id, type, amount, counterparty_address, tx_hash, status, created_at,
        assets ( symbol, name )
      `)
      .order('created_at', { ascending: false });

    if (tErr) throw new Error('wallet_transactions query: ' + tErr.message);
    _txData = txs || [];
    console.log('📋 wallet_transactions rows:', _txData.length);

    // 3. Update UI
    _rehydrateAll();

  } catch (err) {
    console.error('❌ Fetch error:', err.message);
  }
}

/* ─────────────────────────────────────────
   PHASE 5 — PORTFOLIO CALCULATION
   Portfolio = Σ (balance_amount × market_price)
───────────────────────────────────────── */
function _rehydrateAll() {
  _updateHomeBalance();
  _renderTransactionHistory();
  _renderReceiveList();
}

function _updateHomeBalance() {
  let total = 0;

  for (const row of _walletData) {
    const asset  = row.assets;
    const price  = parseFloat(asset?.market_price)  || 0;
    const amount = parseFloat(row.balance_amount)   || 0;
    const sub    = price * amount;

    console.log(`  ${asset?.symbol || '?'}: ${amount} × $${price} = $${sub}`);
    total += sub;
  }

  console.log('💰 Portfolio total:', total);

  const formatted = '$' + total.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Write to #home-balance
  const el = document.getElementById('home-balance');
  if (el) {
    el.textContent = formatted;
    el.classList.remove('loading-pulse');
    el.style.color = '#000';          // keep the black colour from before
  }

  // Also update wallet-sheet balance labels
  const sheetBal = document.getElementById('ws-sheet-bal');
  if (sheetBal) sheetBal.textContent = formatted;
}

/* ─────────────────────────────────────────
   TRANSACTION HISTORY
───────────────────────────────────────── */
function _renderTransactionHistory() {
  const histEl = document.getElementById('history-list');
  const txEl   = document.getElementById('tx-list');

  if (!_txData.length) {
    const empty = '<div style="padding:24px;text-align:center;color:#636366;font-size:14px;">No transactions yet</div>';
    if (histEl) histEl.innerHTML = empty;
    if (txEl)   txEl.innerHTML   = empty;
    return;
  }

  const html = _txData.map(tx => {
    const isReceive = tx.type === 'receive';
    const color     = isReceive ? '#00FFA3' : '#EA3943';
    const prefix    = isReceive ? '+' : '-';
    const label     = isReceive ? 'Received' : 'Sent';
    const symbol    = tx.assets?.symbol || '?';
    const status    = tx.status || 'completed';
    const statusCol = status === 'completed' ? '#00FFA3' : (status === 'pending' ? '#F0A500' : '#EA3943');

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #111;cursor:pointer;" onclick="if(typeof pushScreen==='function')pushScreen('tx-history-screen')">
        <div style="width:40px;height:40px;border-radius:50%;background:${color}18;display:grid;place-items:center;font-size:18px;flex-shrink:0;color:${color};">
          ${isReceive ? '↙' : '↗'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:14px;">${label} ${symbol}</div>
          <div style="font-size:12px;color:#636366;margin-top:2px;">${_timeAgo(tx.created_at)}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-weight:700;color:${color};font-size:14px;">${prefix}${parseFloat(tx.amount).toFixed(4)} ${symbol}</div>
          <div style="font-size:11px;color:${statusCol};margin-top:2px;">${status}</div>
        </div>
      </div>`;
  }).join('');

  if (histEl) histEl.innerHTML = html;
  if (txEl)   txEl.innerHTML   = html;
}

/* ─────────────────────────────────────────
   RECEIVE SCREEN — ASSET SELECTOR
───────────────────────────────────────── */
let _receiveFilter = 'All';

function _renderReceiveList() {
  const netRow  = document.getElementById('receive-net-filters');
  const popList = document.getElementById('receive-asset-list');
  const allList = document.getElementById('receive-all-list');
  if (!netRow && !popList && !allList) return;

  // Build unique network names from live data
  const netNames = ['All', ...new Set(
    _walletData.map(r => r.assets?.networks?.name).filter(Boolean)
  )];

  if (netRow) {
    netRow.innerHTML = netNames.map(n => `
      <div class="net-pill ${n === _receiveFilter ? 'active' : ''}"
           onclick="setReceiveFilter('${n}')">${n}</div>
    `).join('');
  }

  const filtered = _receiveFilter === 'All'
    ? _walletData
    : _walletData.filter(r => r.assets?.networks?.name === _receiveFilter);

  const rows = filtered.map(row => {
    const asset   = row.assets;
    const net     = asset?.networks;
    const addr    = row.wallet_address || '';
    const short   = addr.length > 14
      ? addr.slice(0, 7) + '...' + addr.slice(-6)
      : addr;

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #111;cursor:pointer;"
           onclick="openQRDetails('${row.id}')">
        <div class="coin-icon-wrap" style="position:relative;flex-shrink:0;">
          <img src="assets/coins/${asset?.symbol}.png" style="width:36px;height:36px;border-radius:50%;"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div style="display:none;width:36px;height:36px;border-radius:50%;background:#1C1C1E;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;">
            ${(asset?.symbol || '?').slice(0,2)}
          </div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:700;font-size:15px;">${asset?.symbol || '?'}</span>
            <span style="background:#1C1C1E;color:#8E8E93;font-size:10px;padding:2px 7px;border-radius:6px;font-weight:700;">${net?.name || ''}</span>
          </div>
          <div style="font-size:12px;color:#636366;margin-top:3px;font-family:monospace;">${short}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <div style="width:32px;height:32px;border-radius:8px;background:#1C1C1E;display:grid;place-items:center;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#8E8E93" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div style="width:32px;height:32px;border-radius:8px;background:#1C1C1E;display:grid;place-items:center;"
               onclick="event.stopPropagation();navigator.clipboard.writeText('${addr}').then(()=>showToast('Address copied!'))">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#8E8E93" stroke-width="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </div>
        </div>
      </div>`;
  }).join('');

  if (popList) popList.innerHTML = rows || '<div style="padding:20px;text-align:center;color:#636366;font-size:13px;">No assets configured yet</div>';
  if (allList) allList.innerHTML = '';   // flat list — everything already in popList
}

window.setReceiveFilter = (net) => { _receiveFilter = net; _renderReceiveList(); };

/* ─────────────────────────────────────────
   QR DETAILS SCREEN
───────────────────────────────────────── */
window.openQRDetails = (rowId) => {
  const row = _walletData.find(r => r.id === rowId);
  if (!row) return;
  const asset = row.assets;

  const addr = row.wallet_address || '';

  const cautionEl = document.getElementById('qr-caution-text');
  const nameEl    = document.getElementById('qr-asset-name');
  const iconEl    = document.getElementById('qr-asset-icon');
  const addrEl    = document.getElementById('qr-address-val');
  const qrEl      = document.getElementById('qrcode');

  if (cautionEl) cautionEl.textContent = `Only send ${asset?.name || asset?.symbol} (${asset?.symbol}) to this address. Other assets will be lost forever.`;
  if (nameEl)    nameEl.textContent = asset?.name || asset?.symbol || '';
  if (iconEl)    iconEl.src = `assets/coins/${asset?.symbol}.png`;
  if (addrEl)    addrEl.textContent = addr;

  // Generate QR
  if (qrEl) {
    qrEl.innerHTML = '';
    if (typeof QRCode !== 'undefined' && addr) {
      new QRCode(qrEl, {
        text: addr, width: 180, height: 180,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  if (typeof pushScreen === 'function') pushScreen('receive-details-screen');
};

window.copyQRAddress = () => {
  const addr = document.getElementById('qr-address-val')?.textContent;
  if (addr) navigator.clipboard.writeText(addr).then(() => showToast('Address copied!'));
};

/* ─────────────────────────────────────────
   TOAST (if not already defined in app.js)
───────────────────────────────────────── */
window.showToast = window.showToast || function(msg) {
  let t = document.getElementById('tw-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tw-toast';
    t.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1C1C1E;color:#fff;padding:10px 22px;border-radius:24px;font-size:13px;font-weight:700;z-index:10000;transition:opacity .3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.style.opacity = '0', 2200);
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function _timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400)return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

/* ─────────────────────────────────────────
   ENTRY POINT — called from app.js
───────────────────────────────────────── */
async function initSupabase() {
  initAuthGuard();
}
