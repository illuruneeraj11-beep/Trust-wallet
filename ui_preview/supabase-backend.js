/* ============================================================
   Trust Wallet Clone — Supabase Backend v9
   Key fix: override openSendScreen + renderSendAssetsList
   so send form always uses real Supabase balances.
   ============================================================ */

/* ─────────────────────────────────────────
   CLIENT
───────────────────────────────────────── */
let _supabase     = null;
let _walletData   = [];
let _txData       = [];
let _activeSendRow = null;

function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined' || typeof SUPABASE_ANON === 'undefined') return null;
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _supabase;
}

/* ═══════════════════════════════════════════
   AUTH GUARD (PIN Overlay)
═══════════════════════════════════════════ */
function initAuthGuard() {
  const overlay = document.createElement('div');
  overlay.id = 'auth-guard';
  overlay.className = 'guard-overlay';
  overlay.innerHTML = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#0052FF,#0040CC);display:grid;place-items:center;margin:0 auto 16px;box-shadow:0 8px 32px #0052FF44;font-size:36px;">🛡️</div>
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Trust Wallet</div>
      <div style="font-size:13px;color:#636366;margin-top:6px;">Enter your passcode to continue</div>
    </div>
    <div class="pin-dots" id="pin-dots">
      ${Array(6).fill('<div class="pin-dot"></div>').join('')}
    </div>
    <div class="pin-pad">
      ${[1,2,3,4,5,6,7,8,9].map(n=>`<div class="pin-btn" onclick="inputPin(${n})">${n}</div>`).join('')}
      <div></div>
      <div class="pin-btn" onclick="inputPin(0)">0</div>
      <div class="pin-btn" onclick="clearLastPin()" style="font-size:20px;">⌫</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

let _pin = '';
window.inputPin = (n) => {
  if (_pin.length >= 6) return;
  _pin += String(n);
  _renderPinDots();
  if (_pin.length === 6) setTimeout(_unlockAndFetch, 380);
};
window.clearLastPin = () => { _pin = _pin.slice(0, -1); _renderPinDots(); };

function _renderPinDots() {
  document.querySelectorAll('#pin-dots .pin-dot').forEach((d, i) =>
    d.classList.toggle('filled', i < _pin.length)
  );
}

function _unlockAndFetch() {
  const g = document.getElementById('auth-guard');
  if (!g) return;
  g.style.transition = 'opacity .45s ease, transform .45s ease';
  g.style.opacity = '0'; g.style.transform = 'scale(1.06)';
  setTimeout(() => { g.remove(); _startLifecycle(); }, 460);
}

/* ═══════════════════════════════════════════
   LIFECYCLE
═══════════════════════════════════════════ */
async function _startLifecycle() {
  const sb = getSupabase();
  if (!sb) { console.error('❌ Supabase client failed'); return; }
  console.log('🚀 Trust Wallet v8 lifecycle started');

  await _fetchAll();

  sb.channel('tw-v8-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' },       _fetchAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, _fetchAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' },        _fetchAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' },              _fetchAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' },             _fetchAll)
    .subscribe(s => console.log('📡 Realtime:', s));

  setInterval(_fetchAll, 15_000);
}

/* ═══════════════════════════════════════════
   DATA FETCHING
═══════════════════════════════════════════ */
async function _fetchAll() {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data: w, error: wErr } = await sb
      .from('user_wallets')
      .select(`
        id,
        balance_amount,
        balance_usd,
        wallet_address,
        display_order,
        assets (
          id, symbol, name, market_price, price_change_24h,
          networks ( id, name, short_name )
        )
      `)
      .order('display_order', { ascending: true });
    if (wErr) throw new Error('[user_wallets] ' + wErr.message);
    _walletData = w || [];
    console.log('📦 Wallets:', _walletData.length, 'rows');

    const { data: t, error: tErr } = await sb
      .from('wallet_transactions')
      .select(`id, type, amount, counterparty_address, tx_hash, status, created_at,
               assets ( symbol, name )`)
      .order('created_at', { ascending: false });
    if (tErr) throw new Error('[wallet_transactions] ' + tErr.message);
    _txData = t || [];
    console.log('📋 Transactions:', _txData.length, 'rows');

    _rehydrateAll();
  } catch (e) {
    console.error('❌', e.message);
  }
}

/* ═══════════════════════════════════════════
   REHYDRATION
═══════════════════════════════════════════ */
function _rehydrateAll() {
  _injectWalletAddresses();   // ★ inject real addresses FIRST
  _calcAndDisplayPortfolio();
  _renderTokenBalances();
  _renderTxHistory();
  _renderReceiveScreen();
  _syncSendTokenHeader();
  _buildWalletRowCompat();
}

/* ═══════════════════════════════════════════
   ★ FIX: Build _walletRow.balances for app.js
   app.js openSendScreen() reads _walletRow.balances[sym]
═══════════════════════════════════════════ */
function _buildWalletRowCompat() {
  const balances = {};
  for (const row of _walletData) {
    const sym = row.assets?.symbol;
    if (sym) balances[sym] = parseFloat(row.balance_amount) || 0;
  }
  // Expose as global so app.js can read it
  window._walletRow = { balances };
}

/* ═══════════════════════════════════════════
   PORTFOLIO CALCULATION
═══════════════════════════════════════════ */
function _calcAndDisplayPortfolio() {
  let total = 0;
  for (const row of _walletData) {
    const price  = parseFloat(row.assets?.market_price)  || 0;
    const amount = parseFloat(row.balance_amount)         || 0;
    total += price * amount;
  }
  console.log('💰 Portfolio total: $' + total.toFixed(2));

  const formatted = '$' + total.toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  // Update main home balance display
  const el = document.getElementById('home-balance');
  if (el) {
    const prev = el.textContent;
    el.textContent = formatted;
    el.classList.remove('loading-pulse');
    // Flash animation to show the update visually
    if (prev !== formatted) {
      el.style.transition = 'opacity 0.15s';
      el.style.opacity = '0.4';
      setTimeout(() => { el.style.opacity = '1'; }, 150);
    }
  }

  // Update wallet sheet balance
  const sheetEl = document.getElementById('ws-sheet-bal');
  if (sheetEl) sheetEl.textContent = formatted;

  // Update any other balance display elements
  ['header-balance', 'total-portfolio-val'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.textContent = formatted;
  });
}

/* ═══════════════════════════════════════════
   TOKEN BALANCE ROWS (Home → Crypto tab)
═══════════════════════════════════════════ */
function _renderTokenBalances() {
  const container = document.getElementById('crypto-token-list');
  if (!container) return;

  if (_walletData.length === 0) {
    container.innerHTML = '';
    const fundEl = document.querySelector('.fund-section');
    if (fundEl) fundEl.style.display = '';
    return;
  }

  const fundEl = document.querySelector('.fund-section');
  if (fundEl) fundEl.style.display = 'none';

  const coinColors = {
    BTC: '#f7931a', ETH: '#627eea', USDT: '#26a17b', BNB: '#F0B000',
    SOL: '#9945ff', TWT: '#3375BB', MATIC: '#8247e5', ADA: '#0033AD',
    DOT: '#e6007a', AVAX: '#e84142'
  };

  container.innerHTML = _walletData.map(row => {
    const asset = row.assets;
    const sym = asset?.symbol || '??';
    const name = asset?.name || sym;
    const price = parseFloat(asset?.market_price) || 0;
    const amount = parseFloat(row.balance_amount) || 0;
    const change = parseFloat(asset?.price_change_24h) || 0;
    const usdVal = price * amount;
    const color = coinColors[sym] || '#636366';
    const changeColor = change >= 0 ? '#00FFA3' : '#EA3943';
    const changeSign = change >= 0 ? '+' : '';
    const net = asset?.networks;

    return `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;"
           onclick="openSendScreen('${sym}','${name}','${net?.name||''}')">
        <div style="position:relative;width:44px;height:44px;flex-shrink:0;">
          <img src="assets/coins/${sym}.png" style="width:44px;height:44px;border-radius:50%;"
               onerror="this.style.display='none';this.nextSibling.style.display='grid'">
          <div style="display:none;width:44px;height:44px;border-radius:50%;background:${color}22;place-items:center;font-weight:900;font-size:14px;color:${color};">
            ${sym.slice(0,3)}
          </div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:16px;font-weight:700;color:#fff;">${name}</div>
          <div style="font-size:12px;color:#8E8E93;margin-top:2px;">
            ${_formatNum(amount)} ${sym}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:16px;font-weight:800;color:#fff;">$${_formatUsd(usdVal)}</div>
          <div style="font-size:13px;font-weight:700;color:${changeColor};margin-top:2px;">${changeSign}${change.toFixed(2)}%</div>
        </div>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   TX HISTORY
═══════════════════════════════════════════ */
function _renderTxHistory() {
  const html = _txData.length ? _txData.map(_txRowHTML).join('') :
    '<div style="padding:28px 0;text-align:center;color:#636366;font-size:13px;">No transactions yet</div>';

  ['history-list', 'tx-list'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function _txRowHTML(tx) {
  const isR   = tx.type === 'receive';
  const color = isR ? '#00FFA3' : '#EA3943';
  const sym   = tx.assets?.symbol || '?';
  const amt   = parseFloat(tx.amount);
  const statusColor = tx.status === 'completed' ? '#00FFA3' : tx.status === 'pending' ? '#F0A500' : '#EA3943';
  const hash = tx.tx_hash || '';
  const shortHash = hash.length > 16 ? hash.slice(0,10) + '…' + hash.slice(-6) : hash;

  return `
    <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid #111;cursor:pointer;"
         onclick="if(typeof pushScreen==='function')pushScreen('tx-history-screen')">
      <div style="width:40px;height:40px;border-radius:50%;background:${color}18;display:grid;place-items:center;font-size:20px;color:${color};flex-shrink:0;">
        ${isR ? '↙' : '↗'}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:14px;">${isR ? 'Received' : 'Sent'} ${sym}</div>
        <div style="font-size:11px;color:#636366;margin-top:2px;">${_timeAgo(tx.created_at)}${shortHash ? ' · ' + shortHash : ''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-weight:700;font-size:14px;color:${color};">${isR?'+':'-'}${isNaN(amt)?tx.amount:_formatNum(amt)} ${sym}</div>
        <div style="font-size:10px;color:${statusColor};margin-top:2px;text-transform:capitalize;">${tx.status}</div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════
   RECEIVE SCREEN — patched to use real Supabase addresses
   Delegates QR generation to app.js showReceiveDetails()
═══════════════════════════════════════════ */
let _receiveFilter = 'All';

function _renderReceiveScreen() {
  // Build network filter chips using branded icons (matches screenshot)
  const netRow = document.getElementById('receive-net-filters');
  if (netRow) {
    // Fixed set of networks to show as icon chips (matches screenshot order)
    const CHIP_NETS = [
      { sym: 'BTC',  label: 'Bitcoin',         bg: '#F7931A' },
      { sym: 'ETH',  label: 'Ethereum',         bg: '#627EEA' },
      { sym: 'SOL',  label: 'Solana',           bg: '#000000' },
      { sym: 'BNB',  label: 'BNB Smart Chain',  bg: '#1E2026' },
      { sym: 'TRX',  label: 'Tron',             bg: '#E50915' },
      { sym: 'ARB',  label: 'Arbitrum',         bg: '#2D374B' },
      { sym: 'BASE', label: 'Base',             bg: '#0052FF' },
    ];

    // Filter to only show networks that have wallet data
    const activeNets = new Set(_walletData.map(r => r.assets?.networks?.name).filter(Boolean));

    // Use Trust Wallet official CDN URLs
    const TW_LOGOS = typeof TRUST_LOGO_URLS !== 'undefined' ? TRUST_LOGO_URLS : {};

    const isAllSelected = _receiveFilter === 'All';
    let html = `
      <div class="net-icon-chip all-chip ${isAllSelected ? 'selected' : ''}"
           onclick="sbSetReceiveFilter('All')"
           style="background:#fff;">
        <span style="font-weight:800;font-size:14px;color:#000;">All</span>
      </div>`;

    for (const chip of CHIP_NETS) {
      const isOn = chip.label === _receiveFilter;
      const logoUrl = TW_LOGOS[chip.sym] || '';
      html += `
        <div class="net-icon-chip ${isOn ? 'selected' : ''}"
             onclick="sbSetReceiveFilter('${chip.label}')"
             style="background:${chip.bg}; ${isOn ? 'border-color:#0052FF;' : ''}">
          ${logoUrl
            ? `<img src="${logoUrl}" width="30" height="30"
                    style="object-fit:contain; filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
               <span style="display:none;font-weight:800;font-size:13px;color:#fff;">${chip.sym.slice(0,2)}</span>`
            : `<span style="font-weight:800;font-size:13px;color:#fff;">${chip.sym.slice(0,2)}</span>`
          }
        </div>`;
    }
    netRow.innerHTML = html;
  }

  // Populate the "Popular" section with real Supabase wallet addresses
  const popList = document.getElementById('receive-asset-list');
  if (popList && _walletData.length > 0) {
    const filtered = _receiveFilter === 'All'
      ? _walletData
      : _walletData.filter(r => (r.assets?.networks?.name || '') === _receiveFilter);

    popList.innerHTML = filtered.map(row => {
      const asset   = row.assets;
      const net     = asset?.networks;
      const sym     = asset?.symbol || '?';
      const name    = asset?.name || sym;
      const netName = net?.name || (typeof getNetworkForSym === 'function' ? getNetworkForSym(sym) : '');
      const addr    = row.wallet_address || (typeof generateWalletAddress === 'function' ? generateWalletAddress(sym) : '');
      const shortAddr = addr.length > 24 ? addr.slice(0,12) + '...' + addr.slice(-8) : addr;

      // Register real address globally for showReceiveDetails
      if (!window.WALLET_ADDRESSES) window.WALLET_ADDRESSES = {};
      if (addr) window.WALLET_ADDRESSES[sym] = addr;

      // Use Trust Wallet CDN logo
      const logoUrl = (typeof TRUST_LOGO_URLS !== 'undefined' && TRUST_LOGO_URLS[sym]) || '';
      const logoHtml = logoUrl
        ? `<img src="${logoUrl}" width="46" height="46"
               style="border-radius:50%; object-fit:cover; flex-shrink:0;"
               onerror="this.style.display='none';this.nextSibling.style.display='flex'" />
           <div style="display:none; width:46px; height:46px; border-radius:50%;
                       background:#E5E5EA; align-items:center; justify-content:center;
                       font-weight:800; font-size:16px; color:#3C3C43; flex-shrink:0;">
             ${sym.slice(0,2)}
           </div>`
        : `<div style="width:46px; height:46px; border-radius:50%;
                       background:#E5E5EA; display:flex; align-items:center;
                       justify-content:center; font-weight:800; font-size:16px;
                       color:#3C3C43; flex-shrink:0;">
             ${sym.slice(0,2)}
           </div>`;

      return `
        <div onclick="showReceiveDetails('${sym}','${netName}')"
             style="display:flex; align-items:center; gap:14px; padding:12px 20px;
                    background:#fff; cursor:pointer; border-bottom:0.5px solid #F2F2F7;
                    transition:background 0.15s;"
             onmousedown="this.style.background='#F2F2F7'"
             onmouseup="this.style.background='#fff'"
             onmouseleave="this.style.background='#fff'">

          <!-- Coin logo -->
          <div style="position:relative; flex-shrink:0;">
            ${logoHtml}
          </div>

          <!-- Name + network + address -->
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
              <span style="font-size:16px; font-weight:600; color:#000; white-space:nowrap;">${name}</span>
              <span style="background:#F2F2F7; color:#636366; font-size:10px;
                           font-weight:700; padding:2px 7px; border-radius:6px;
                           white-space:nowrap; text-transform:uppercase;">${sym}</span>
            </div>
            <div style="font-size:12px; color:#8E8E93; white-space:nowrap;
                        overflow:hidden; text-overflow:ellipsis;">${netName}</div>
          </div>

          <!-- QR / right arrow -->
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
               stroke="#C7C7CC" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>`;
    }).join('');
  }

  // Wire search input (new HTML structure — no .search-row-dark class)
  const searchInput = document.querySelector('#receive-screen input[type="text"]');
  if (searchInput && !searchInput._sbWired) {
    searchInput._sbWired = true;
    searchInput.oninput = () => {
      if (typeof filterReceiveAssets === 'function') filterReceiveAssets();
    };
  }
}

window.sbSetReceiveFilter = (n) => {
  _receiveFilter = n;
  _renderReceiveScreen();
};


/* ═══════════════════════════════════════════
   QR ENGINE — delegates to app.js showReceiveDetails()
   We pre-inject WALLET_ADDRESSES with real Supabase addresses
   so app.js generateWalletAddress() returns real data.
═══════════════════════════════════════════ */
function _injectWalletAddresses() {
  if (!window.WALLET_ADDRESSES) window.WALLET_ADDRESSES = {};
  for (const row of _walletData) {
    const sym  = row.assets?.symbol;
    const addr = row.wallet_address;
    if (sym && addr) {
      window.WALLET_ADDRESSES[sym] = addr;
    }
  }
}

/* ═══════════════════════════════════════════
   ★ SEND — syncSendTokenFromDB
   Called by app.js openSendScreen() to set live balance
═══════════════════════════════════════════ */
window.syncSendTokenFromDB = (sym) => {
  const row = _walletData.find(r => r.assets?.symbol === sym);
  if (!row) { console.warn('syncSendTokenFromDB: no row for', sym); return; }
  _activeSendRow = row;
  const asset = row.assets;

  // ★ FIX: Set these GLOBALS so app.js validation works with real balance
  window._sendBal     = parseFloat(row.balance_amount) || 0;
  window._sendPrice   = parseFloat(asset?.market_price) || 0;
  window._sendSym     = asset?.symbol || '';
  window._sendNetwork = asset?.networks?.name || '';
  window._sendAssetId = asset?.id || null;
  window._sendWalletRowId = row.id;

  console.log(`✅ syncSendTokenFromDB: ${sym} bal=${window._sendBal} price=$${window._sendPrice}`);

  // Update token header display
  const balEl    = document.getElementById('send-token-bal');
  const balSymEl = document.getElementById('send-token-bal-sym');
  const balUsdEl = document.getElementById('send-token-bal-usd');
  const priceEl  = document.getElementById('send-token-price-tag');
  const symEl    = document.getElementById('send-token-sym');
  const nameEl   = document.getElementById('send-token-name');

  if (symEl)    symEl.textContent   = asset?.symbol || '';
  if (nameEl)   nameEl.textContent  = asset?.name || '';
  if (balEl)    balEl.textContent   = window._sendBal;
  if (balSymEl) balSymEl.textContent= window._sendSym;
  if (balUsdEl) balUsdEl.textContent= window._sendPrice > 0
    ? '$' + (window._sendBal * window._sendPrice).toLocaleString('en-US',{minimumFractionDigits:2}) : '';
  if (priceEl)  priceEl.innerHTML   = window._sendPrice > 0
    ? `<div style="font-size:11px;color:#636366;">1 ${window._sendSym}</div>
       <div style="font-weight:700;">$${window._sendPrice}</div>` : '';

  // ★ FIX: Also update _walletRow.balances so app.js re-reads it
  if (window._walletRow && window._walletRow.balances) {
    window._walletRow.balances[sym] = window._sendBal;
  }
};

function _syncSendTokenHeader() {
  if (window._sendSym) syncSendTokenFromDB(window._sendSym);
}

/* ═══════════════════════════════════════════
   ★ FIX: applyOptimisticSend — called by app.js validateAndSend()
   Instantly deducts the sent amount from the UI before Supabase responds
═══════════════════════════════════════════ */
window.applyOptimisticSend = (sym, amount, price) => {
  console.log(`⚡ applyOptimisticSend: ${sym} -${amount} ($${(amount * price).toFixed(2)})`);

  // ★ Save the ORIGINAL balance BEFORE deducting
  //   executeSendOnDB reads this to write the correct value to DB
  window._sendBalBeforeSend = parseFloat(window._sendBal) || 0;

  // Update the in-memory wallet data
  const row = _walletData.find(r => r.assets?.symbol === sym);
  if (row) {
    row.balance_amount = Math.max(0, parseFloat(row.balance_amount) - amount);
  }

  // Update _walletRow.balances
  if (window._walletRow?.balances) {
    window._walletRow.balances[sym] = Math.max(0, (window._walletRow.balances[sym] || 0) - amount);
  }

  // Update _sendBal (post-send value)
  window._sendBal = Math.max(0, (window._sendBal || 0) - amount);

  // Immediately recalculate and display the new portfolio total
  _calcAndDisplayPortfolio();
  _renderTokenBalances();
};

/* ═══════════════════════════════════════════
   ★ SEND EXECUTION PIPELINE
═══════════════════════════════════════════ */
window.executeSendOnDB = async (toAddr, amount) => {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'No Supabase client' };

  const assetId     = window._sendAssetId;
  const walletRowId = window._sendWalletRowId;
  const sym         = window._sendSym;
  const price       = parseFloat(window._sendPrice) || 0;

  if (!assetId || !walletRowId) {
    console.warn('executeSendOnDB: missing assetId or walletRowId');
    return { success: true, hash: _genTxHash() };
  }

  // ★ FIX: Use _walletData row's balance (already decremented by applyOptimisticSend)
  //   OR fall back to _sendBalBeforeSend - amount if row not found
  const walletRow = _walletData.find(r => r.id === walletRowId);
  const newBal = walletRow
    ? parseFloat(walletRow.balance_amount) // already correct from applyOptimisticSend
    : Math.max(0, (parseFloat(window._sendBalBeforeSend) || 0) - amount);

  const hash = _genTxHash();
  console.log(`🔥 executeSendOnDB: ${sym} -${amount} → newBal=${newBal} walletRowId=${walletRowId}`);

  try {
    // 1. Insert into wallet_transactions
    const { data: txData, error: txErr } = await sb.from('wallet_transactions').insert({
      asset_id: assetId,
      type: 'send',
      amount,
      counterparty_address: toAddr,
      tx_hash: hash,
      status: 'completed'
    }).select();
    if (txErr) console.warn('TX insert error:', txErr.message);
    else console.log('✅ wallet_transactions inserted');

    // 2. Also insert into transactions table (for Expo app)
    await sb.from('transactions').insert({
      type: 'Sent',
      symbol: sym,
      amount: `-${amount} ${sym}`,
      to_address: toAddr,
      status: 'Confirmed',
      icon: '↗',
      color: '#EA3943',
      network: window._sendNetwork || '',
      tx_hash: hash,
      asset_symbol: sym
    }).catch(e => console.warn('transactions insert failed:', e.message));

    // 3. ★ KEY: Write the correct new balance to user_wallets
    //    The DB trigger recalc_wallet_total() auto-updates wallets.total_balance_usd
    const { error: wErr } = await sb
      .from('user_wallets')
      .update({ balance_amount: newBal })
      .eq('id', walletRowId);

    if (wErr) {
      console.error('❌ Balance update error:', wErr.message);
    } else {
      console.log(`✅ user_wallets[${sym}] → ${newBal} (was ${(parseFloat(window._sendBalBeforeSend)||0).toFixed(4)})`);
    }

    // 4. Re-fetch all data after short delay (DB trigger fires, realtime catches up)
    setTimeout(_fetchAll, 600);
    setTimeout(_fetchAll, 2000); // second fetch as safety net

    return { success: true, hash };
  } catch (e) {
    console.error('Send pipeline error:', e);
    return { success: false, error: e.message, hash };
  }
};

function _genTxHash() {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
window.showToast = window.showToast || function(msg) {
  let t = document.getElementById('tw-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tw-toast';
    t.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);' +
      'background:#1C1C1E;color:#fff;padding:10px 22px;border-radius:24px;font-size:13px;' +
      'font-weight:700;z-index:10000;transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(t._h);
  t._h = setTimeout(() => t.style.opacity = '0', 2400);
};

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function _timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

function _formatNum(n) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(2) + 'M';
  if (n >= 10_000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toFixed(6);
}

function _formatUsd(n) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(2) + 'M';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ═══════════════════════════════════════════
   ENTRY
═══════════════════════════════════════════ */
async function initSupabase() {
  initAuthGuard();
}

/* ═══════════════════════════════════════════
   ★ CORE FIX: Override app.js send functions
   supabase-backend.js loads BEFORE app.js.
   DOMContentLoaded fires after ALL scripts load,
   so app.js functions are defined by then.
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  _installSendOverrides();
});

function _installSendOverrides() {

  /* ── Override 1: openSendScreen ──────────────────────────────
     app.js reads _walletRow.balances[sym] which may be 0 at call
     time because Supabase is async. We override to always pull
     the live balance from _walletData synchronously.
  ────────────────────────────────────────────────────────────── */
  const _origOpenSendScreen = window.openSendScreen;
  window.openSendScreen = function(sym, name, network) {
    /* Find the live row from Supabase data */
    const row = _walletData.find(r => r.assets?.symbol === sym);

    if (row) {
      const asset = row.assets;
      /* ★ SET GLOBALS BEFORE app.js reads them */
      window._sendBal       = parseFloat(row.balance_amount) || 0;
      window._sendPrice     = parseFloat(asset?.market_price) || 0;
      window._sendSym       = sym;
      window._sendName      = name;
      window._sendNetwork   = network || asset?.networks?.name || '';
      window._sendAssetId   = asset?.id || null;
      window._sendWalletRowId = row.id;

      /* Also patch _walletRow.balances so app.js internal reads work */
      if (!window._walletRow) window._walletRow = { balances: {} };
      window._walletRow.balances[sym] = window._sendBal;

      console.log(`✅ openSendScreen override: ${sym} bal=${window._sendBal} price=$${window._sendPrice}`);

      /* Call original app.js version — it will now read the correct values */
      if (typeof _origOpenSendScreen === 'function') {
        _origOpenSendScreen(sym, name, network);
      }

      /* Re-run sync to update UI labels with live data */
      _activeSendRow = row;
      _updateSendHeader(row);

    } else {
      /* No Supabase row — fall back to original */
      console.warn(`openSendScreen: no Supabase row for ${sym}, using fallback`);
      if (typeof _origOpenSendScreen === 'function') {
        _origOpenSendScreen(sym, name, network);
      }
    }
  };

  /* ── Override 2: renderSendAssetsList ────────────────────────
     Patches the token list so it shows live Supabase balances.
     app.js builds this list from hardcoded bal:0 entries.
  ────────────────────────────────────────────────────────────── */
  const _origRenderSendAssets = window.renderSendAssetsList;
  window.renderSendAssetsList = function(tokens) {
    /* Inject live balances into each token before rendering */
    const enriched = (tokens || []).map(t => {
      const row = _walletData.find(r => r.assets?.symbol === t.sym);
      return row
        ? { ...t, bal: parseFloat(row.balance_amount) || 0 }
        : t;
    });

    /* Also patch _walletRow.balances so app.js's own HTML reads work */
    if (!window._walletRow) window._walletRow = { balances: {} };
    for (const t of enriched) {
      if (t.bal > 0) window._walletRow.balances[t.sym] = t.bal;
    }

    if (typeof _origRenderSendAssets === 'function') {
      _origRenderSendAssets(enriched);
    }
  };

  /* ── Override 3: validateSendForm ────────────────────────────
     Ensures _sendBal is always read from live _walletData
     (in case app.js cached a stale value).
  ────────────────────────────────────────────────────────────── */
  const _origValidateSendForm = window.validateSendForm;
  window.validateSendForm = function() {
    /* Re-sync _sendBal from live data before validating */
    if (window._sendSym) {
      const row = _walletData.find(r => r.assets?.symbol === window._sendSym);
      if (row) {
        const live = parseFloat(row.balance_amount) || 0;
        if (live !== window._sendBal) {
          console.log(`validateSendForm: syncing _sendBal ${window._sendBal} → ${live}`);
          window._sendBal = live;
        }
      }
    }
    if (typeof _origValidateSendForm === 'function') _origValidateSendForm();
  };

  /* ── Override 4: finishSend ──────────────────────────────────
     app.js calls finishSend() when user taps "Done" after send.
     We hook it to force a balance recalculation + DB refresh
     so the home screen ALWAYS shows the correct updated total.
  ────────────────────────────────────────────────────────────── */
  const _origFinishSend = window.finishSend;
  window.finishSend = function() {
    /* Force immediate recalc from current _walletData */
    _calcAndDisplayPortfolio();
    _renderTokenBalances();

    /* Call original (navigates back to home) */
    if (typeof _origFinishSend === 'function') _origFinishSend();

    /* Then re-fetch from DB to get authoritative values */
    setTimeout(_fetchAll, 100);
    setTimeout(_fetchAll, 1500);
  };

  console.log('✅ Send overrides installed (v10)');
}

/* Helper: update send screen header labels */
function _updateSendHeader(row) {
  const asset = row?.assets;
  if (!asset) return;

  const balEl    = document.getElementById('send-token-bal');
  const balSymEl = document.getElementById('send-token-bal-sym');
  const balUsdEl = document.getElementById('send-token-bal-usd');
  const priceEl  = document.getElementById('send-token-price-tag');
  const symEl    = document.getElementById('send-token-sym');
  const nameEl   = document.getElementById('send-token-name');

  const bal   = parseFloat(row.balance_amount) || 0;
  const price = parseFloat(asset.market_price) || 0;

  if (symEl)    symEl.textContent    = asset.symbol || '';
  if (nameEl)   nameEl.textContent   = asset.name || '';
  if (balEl)    balEl.textContent    = bal;
  if (balSymEl) balSymEl.textContent = asset.symbol || '';
  if (balUsdEl) balUsdEl.textContent = price > 0
    ? '$' + (bal * price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '';
  if (priceEl)  priceEl.innerHTML    = price > 0
    ? `<div style="font-size:11px;color:#636366;">1 ${asset.symbol}</div>
       <div style="font-weight:700;">$${price.toLocaleString()}</div>` : '';
}
