/* ============================================================
   Trust Wallet Clone — Supabase Backend Integration v3
   Layers: Realtime subscription + 8s poll + blockchain sync
   ============================================================ */

let _supabase = null;
let _walletRow = null;    // exposed globally so renderSendAssetsList can read balances
let _walletRows = [];
let _transactions = [];

/* ── Init Supabase client (anon key — read-only on wallet app) ── */
function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined') {
    console.warn('⚠️ Supabase SDK not loaded');
    return null;
  }
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    realtime: { params: { eventsPerSecond: 10 } }
  });
  return _supabase;
}

/* ════════════════════════════════════════════
   WALLET — fetch & render
════════════════════════════════════════════ */

async function fetchAndRenderWallet() {
  const sb = getSupabase();
  if (!sb) return;

  const { data, error } = await sb
    .from('wallets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.warn('Wallet fetch error:', error.message); return; }
  if (!data || data.length === 0)  { console.warn('No wallet row found'); return; }

  _walletRows = data;
  const idx = Math.min(typeof currentWallet === 'number' ? currentWallet : 0, data.length - 1);
  _walletRow = data[idx] || data[0];
  applyWalletToUI(_walletRow);
  renderWalletLists(data);
}

function applyWalletToUI(w) {
  if (!w) return;

  /* 1 — Wallet name */
  const nameEl = document.getElementById('wallet-name');
  if (nameEl) nameEl.textContent = w.wallet_name || 'Main Wallet 1';

  /* 2 — Total balance — always display as USD (value is stored in USD in Supabase) */
  const bal       = parseFloat(w.total_balance_usd) || 0;
  const displayBal = window.VIDEO_MATCH_MODE ? 0 : bal;
  const formatted = '$' + displayBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const balEl  = document.getElementById('home-balance');
  const balRow = document.getElementById('home-bal-row');

  if (balEl) balEl.textContent = formatted;

  /* Show/hide balance row */
  if (balRow) {
    balRow.style.cssText = displayBal > 0
      ? 'display:block !important'
      : 'display:none';
  }

  /* 3 — Hide fund card when balance > 0 */
  const fundCard = document.querySelector('.fund-section');
  if (fundCard) fundCard.style.display = displayBal > 0 ? 'none' : 'flex';

  /* 4 — Token holdings */
  const balances = w.balances || {};
  if (typeof window._SEND_TOKENS !== 'undefined') {
    window._SEND_TOKENS = window._SEND_TOKENS.map(t => ({
      ...t,
      bal: balances[t.sym] !== undefined ? balances[t.sym] : (t.bal || 0)
    }));
  }

  /* 5 — Wallet switcher PUSH screen (.ws-bal) */
  document.querySelectorAll('.ws-bal').forEach(el => { el.textContent = formatted; });

  /* 6 — Wallet SELECT bottom sheet balance + name */
  const wsSheetBal  = document.getElementById('ws-sheet-bal');
  const wsSheetName = document.getElementById('ws-sheet-name');
  if (wsSheetBal)  wsSheetBal.textContent  = formatted;
  if (wsSheetName) wsSheetName.textContent = w.wallet_name || 'Main Wallet 1';

  console.log(`✅ Wallet: ${w.wallet_name} — ${formatted}`);
}

function renderWalletLists(wallets) {
  const rows = wallets || [];
  const sheet = document.getElementById('wallet-list');
  if (sheet) {
    sheet.innerHTML = rows.map((w, idx) => {
      const bal = window.VIDEO_MATCH_MODE ? 0 : (parseFloat(w.total_balance_usd) || 0);
      const formatted = '$' + bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const checked = _walletRow?.id === w.id ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0500e8" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '';
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;" onclick="selectSupabaseWallet(${idx})">
          <div style="width:44px;height:44px;border-radius:50%;background:#eef0f5;display:grid;place-items:center;font-size:20px;">W</div>
          <div style="flex:1;"><div style="font-weight:700;">${w.wallet_name || `Main Wallet ${idx + 1}`}</div><div style="font-size:12px;color:#636366;">${formatted}</div></div>
          ${checked}
        </div>`;
    }).join('');
  }
}

function selectSupabaseWallet(idx) {
  currentWallet = idx;
  if (_walletRows[idx]) {
    _walletRow = _walletRows[idx];
    applyWalletToUI(_walletRow);
    if (typeof renderSendAssetsList === 'function') renderSendAssetsList(window._SEND_TOKENS || []);
  }
  if (typeof closeBottomSheets === 'function') closeBottomSheets();
}

/* ════════════════════════════════════════════
   TRANSACTIONS — fetch & render
════════════════════════════════════════════ */

async function fetchAndRenderTransactions() {
  const sb = getSupabase();
  if (!sb) return;

  const { data, error } = await sb
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { console.warn('Transactions fetch error:', error.message); return; }
  _transactions = data || [];
  applyTransactionsToUI(_transactions);
  console.log(`✅ Transactions loaded: ${_transactions.length}`);
}

function applyTransactionsToUI(txs) {
  const visibleTxs = window.VIDEO_MATCH_MODE ? [] : txs;
  /* Home screen — last 3 */
  const histList = document.getElementById('history-list');
  if (histList) {
    const recent = visibleTxs.slice(0, 3);
    histList.innerHTML = window.VIDEO_MATCH_MODE
      ? '<div class="home-history-empty" onclick="pushScreen(\'tx-history-screen\')"><img src="assets/illustrations/FUND_WALLET.png" alt=""><div class="empty-main">No transactions yet</div><div class="empty-sub">Can&rsquo;t find your transaction?</div><div class="empty-link">Check explorer</div></div>'
      : recent.length > 0
      ? recent.map(renderHistRow).join('')
      : '<div style="padding:20px 16px;text-align:center;color:#636366;font-size:14px;">No transactions yet</div>';
  }

  /* Full tx-history screen */
  const txList = document.getElementById('tx-list');
  if (txList) {
    txList.innerHTML = visibleTxs.length > 0
      ? visibleTxs.map(renderTxRow).join('')
      : '<div class="empty-state"><div class="empty-illustration"></div><div class="empty-title">No transactions yet</div><div class="empty-sub">Can&rsquo;t find your transaction?</div><div class="empty-link">Check explorer</div></div>';
  }
}

function renderHistRow(tx) {
  const icon        = tx.icon  || _iconFor(tx.type);
  const color       = tx.color || _colorFor(tx.type);
  const statusColor = tx.status === 'Confirmed' ? '#00FFA3' : (tx.status === 'Failed' ? '#EA3943' : '#F0A500');
  const timeStr     = tx.time_label || _timeAgo(tx.created_at);
  return `
  <div class="hist-row" onclick="pushScreen('tx-history-screen')">
    <div class="hist-icon" style="color:${color};">${icon}</div>
    <div class="hist-meta">
      <div class="hist-title">${tx.type} ${tx.symbol}</div>
      <div class="hist-time">${timeStr}</div>
    </div>
    <div class="hist-status" style="color:${statusColor};">${tx.status || 'Confirmed'}</div>
  </div>`;
}

function renderTxRow(tx) {
  const icon     = tx.icon  || _iconFor(tx.type);
  const color    = tx.color || _colorFor(tx.type);
  const isPos    = tx.type === 'Received' || tx.type === 'Buy';
  const isSwap   = tx.type === 'Swap';
  const amtColor = isPos ? '#00FFA3' : (isSwap ? '#627EEA' : '#EA3943');
  const timeStr  = tx.time_label || _fmtDate(tx.created_at);
  const sub      = [tx.network, tx.notes, tx.tx_hash ? tx.tx_hash.slice(0,12)+'…' : ''].filter(Boolean).join(' · ');
  return `
  <div class="tx-row" onclick="haptic()">
    <div class="tx-icon" style="background:${color}18;color:${color};">${icon}</div>
    <div class="tx-meta">
      <div class="title">${tx.type} ${tx.symbol}</div>
      <div class="sub">${sub || ''}</div>
    </div>
    <div class="tx-amt">
      <div class="val" style="color:${amtColor};">${tx.amount}</div>
      <div class="time">${timeStr}</div>
    </div>
  </div>`;
}

/* ── helpers ── */
function _iconFor(type)  { return { Received:'↙', Sent:'↗', Swap:'⇄', Buy:'💳', Sell:'↗' }[type] || '•'; }
function _colorFor(type) { return { Received:'#00FFA3', Sent:'#EA3943', Swap:'#627EEA', Buy:'#8E8E93', Sell:'#EA3943' }[type] || '#636366'; }
function _timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d  > 0) return `${d}d ago`;
  if (h  > 0) return `${h}h ago`;
  if (m  > 0) return `${m}m ago`;
  return 'just now';
}
function _fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' · ' +
         d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}

/* ════════════════════════════════════════════
   REALTIME SUBSCRIPTIONS
════════════════════════════════════════════ */

function subscribeRealtime() {
  const sb = getSupabase();
  if (!sb) return;

  sb.channel('tw-wallet-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' },
      payload => {
        console.log('🔄 Wallet realtime update received');
        if (payload.new) {
          _walletRow = payload.new;
          applyWalletToUI(payload.new);
          if (typeof showToast === 'function') showToast('💰 Wallet balance updated');
        }
      })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' },
      payload => {
        console.log('🆕 New transaction received via realtime');
        if (payload.new) {
          _transactions.unshift(payload.new);
          applyTransactionsToUI(_transactions);
          const tx = payload.new;
          if (typeof showToast === 'function') showToast(`${tx.icon || _iconFor(tx.type)} ${tx.type} ${tx.amount} ${tx.symbol}`);
        }
      })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' },
      payload => {
        const idx = _transactions.findIndex(t => t.id === payload.new?.id);
        if (idx !== -1) { _transactions[idx] = payload.new; applyTransactionsToUI(_transactions); }
      })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' },
      payload => {
        _transactions = _transactions.filter(t => t.id !== payload.old?.id);
        applyTransactionsToUI(_transactions);
      })
    .subscribe(status => console.log('📡 Realtime status:', status));

  /* Polling fallback — re-fetch every 8 seconds in case realtime lags */
  setInterval(async () => {
    await fetchAndRenderWallet();
    await fetchAndRenderTransactions();
  }, 8000);

  console.log('📡 Realtime subscriptions + polling fallback active');
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

async function initSupabase() {
  const sb = getSupabase();
  if (!sb) { console.warn('⚠️ Supabase unavailable — offline mode'); return; }
  console.log(`🚀 Connecting to Supabase [${SUPABASE_URL}]`);
  await fetchAndRenderWallet();
  await fetchAndRenderTransactions();
  subscribeRealtime();

  /* Start blockchain sync after wallet row is loaded */
  if (typeof startBlockchainSync === 'function') {
    await startBlockchainSync();
  }

  console.log('✅ Supabase backend + blockchain sync ready');
}

