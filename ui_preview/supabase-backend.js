/* ============================================================
   Trust Wallet Clone — Supabase Backend Integration v4
   Dynamic Admin-Controlled Wallet System
   ============================================================ */

let _supabase = null;
let _walletRow = null;
let _walletRows = [];
let _transactions = [];

/**
 * Initialize Supabase client
 */
function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase SDK not loaded');
    return null;
  }
  try {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      realtime: { params: { eventsPerSecond: 10 } }
    });
    return _supabase;
  } catch (err) {
    console.error('❌ Supabase Client Init Error:', err.message);
    return null;
  }
}

/* ════════════════════════════════════════════
   WALLET — Live Data Fetching
   ════════════════════════════════════════════ */

async function fetchAndRenderWallet() {
  const sb = getSupabase();
  if (!sb) return;

  try {
    const { data, error } = await sb
      .from('wallets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('⚠️ No wallet found for this account');
      return;
    }

    _walletRows = data;
    // For prototype, we select the first wallet or current selection
    const idx = Math.min(typeof currentWallet === 'number' ? currentWallet : 0, data.length - 1);
    _walletRow = data[idx] || data[0];
    
    applyWalletToUI(_walletRow);
    renderWalletLists(data);
  } catch (err) {
    console.error('❌ Wallet Fetch Error:', err.message);
    if (typeof showToast === 'function') showToast('Network error: Unable to fetch balance');
  }
}

/**
 * Inject live row data into UI
 */
function applyWalletToUI(w) {
  if (!w) return;

  // 1. Wallet Name
  const nameEl = document.getElementById('wallet-name');
  if (nameEl) nameEl.textContent = w.wallet_name || 'Main Wallet';

  // 2. Dynamic Balance (Numeric from Supabase)
  const balanceValue = parseFloat(w.balance || w.total_balance_usd || 0);
  const displayBal = window.VIDEO_MATCH_MODE ? 0 : balanceValue;
  const formatted = '$' + displayBal.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  const balEl = document.getElementById('home-balance');
  if (balEl) {
    balEl.textContent = formatted;
    balEl.classList.remove('loading-pulse'); // Remove skeleton state if any
  }

  // 3. Conditional Fund Card Visibility
  const fundCard = document.querySelector('.fund-section');
  if (fundCard) fundCard.style.display = displayBal > 0 ? 'none' : 'flex';

  // 4. Update Global Balances for Send/Receive screens
  if (typeof window._SEND_TOKENS !== 'undefined') {
    // If specific token balances are stored in a JSONB 'balances' field (optional extension)
    const balances = w.balances || {};
    window._SEND_TOKENS = window._SEND_TOKENS.map(t => ({
      ...t,
      bal: balances[t.sym] !== undefined ? balances[t.sym] : (t.sym === 'USD' ? displayBal : (t.bal || 0))
    }));
  }

  // 5. Update Switcher/Sheets
  document.querySelectorAll('.ws-bal').forEach(el => { el.textContent = formatted; });
  const wsSheetBal = document.getElementById('ws-sheet-bal');
  const wsSheetName = document.getElementById('ws-sheet-name');
  if (wsSheetBal) wsSheetBal.textContent = formatted;
  if (wsSheetName) wsSheetName.textContent = w.wallet_name || 'Main Wallet';

  console.log(`✅ UI Updated: ${w.wallet_name} — ${formatted}`);
}

function renderWalletLists(wallets) {
  const sheet = document.getElementById('wallet-list');
  if (!sheet) return;

  sheet.innerHTML = wallets.map((w, idx) => {
    const bal = window.VIDEO_MATCH_MODE ? 0 : (parseFloat(w.balance) || 0);
    const formatted = '$' + bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const checked = _walletRow?.id === w.id ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0500e8" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '';
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;" onclick="selectSupabaseWallet(${idx})">
        <div style="width:44px;height:44px;border-radius:50%;background:#eef0f5;display:grid;place-items:center;font-size:20px;">🛡️</div>
        <div style="flex:1;"><div style="font-weight:700;">${w.wallet_name}</div><div style="font-size:12px;color:#636366;">${formatted}</div></div>
        ${checked}
      </div>`;
  }).join('');
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
   TRANSACTIONS — Dynamic Feed
   ════════════════════════════════════════════ */

async function fetchAndRenderTransactions() {
  const sb = getSupabase();
  if (!sb) return;

  try {
    const { data, error } = await sb
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    _transactions = data || [];
    applyTransactionsToUI(_transactions);
  } catch (err) {
    console.error('❌ Transactions Fetch Error:', err.message);
  }
}

function applyTransactionsToUI(txs) {
  const visibleTxs = window.VIDEO_MATCH_MODE ? [] : txs;
  
  // 1. Home Screen History (Last 3)
  const histList = document.getElementById('history-list');
  if (histList) {
    const recent = visibleTxs.slice(0, 3);
    histList.innerHTML = recent.length > 0
      ? recent.map(renderHistRow).join('')
      : '<div style="padding:20px 16px;text-align:center;color:#636366;font-size:14px;">No transactions yet</div>';
  }

  // 2. Full History Screen
  const txList = document.getElementById('tx-list');
  if (txList) {
    txList.innerHTML = visibleTxs.length > 0
      ? visibleTxs.map(renderTxRow).join('')
      : '<div class="empty-state"><div class="empty-illustration"></div><div class="empty-title">No transactions yet</div><div class="empty-sub">Your history will appear here.</div></div>';
  }
}

/**
 * Renders a row for the home screen list
 */
function renderHistRow(tx) {
  const isReceive = tx.type === 'receive';
  const icon = isReceive ? '↙' : '↗';
  const color = isReceive ? '#00FFA3' : '#EA3943';
  const timeStr = _timeAgo(tx.created_at);
  const typeLabel = isReceive ? 'Received' : 'Sent';

  return `
  <div class="hist-row" onclick="pushScreen('tx-history-screen')">
    <div class="hist-icon" style="color:${color}; font-weight: 800;">${icon}</div>
    <div class="hist-meta">
      <div class="hist-title">${typeLabel} ${tx.asset_symbol}</div>
      <div class="hist-time">${timeStr}</div>
    </div>
    <div class="hist-status" style="color:${tx.status === 'completed' ? '#00FFA3' : '#F0A500'};">
      ${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
    </div>
  </div>`;
}

/**
 * Renders a row for the full history screen
 */
function renderTxRow(tx) {
  const isReceive = tx.type === 'receive';
  const icon = isReceive ? '↙' : '↗';
  const color = isReceive ? '#00FFA3' : '#EA3943';
  const timeStr = _fmtDate(tx.created_at);
  const typeLabel = isReceive ? 'Received' : 'Sent';
  const amtPrefix = isReceive ? '+' : '-';
  
  return `
  <div class="tx-row" onclick="haptic()">
    <div class="tx-icon" style="background:${color}18; color:${color}; font-weight: 800;">${icon}</div>
    <div class="tx-meta">
      <div class="title">${typeLabel} ${tx.asset_symbol}</div>
      <div class="sub">${tx.to_address || tx.from_address || 'Blockchain Network'}</div>
    </div>
    <div class="tx-amt">
      <div class="val" style="color:${color};">${amtPrefix}${tx.amount} ${tx.asset_symbol}</div>
      <div class="time">${timeStr}</div>
    </div>
  </div>`;
}

/* ── Helpers ── */
function _timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

function _fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' · ' +
         d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}

/* ════════════════════════════════════════════
   REALTIME — Live Sync
   ════════════════════════════════════════════ */

function subscribeRealtime() {
  const sb = getSupabase();
  if (!sb) return;

  sb.channel('tw-wallet-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, payload => {
      if (payload.new && payload.new.id === _walletRow?.id) {
        _walletRow = payload.new;
        applyWalletToUI(payload.new);
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, payload => {
      if (payload.new && payload.new.wallet_id === _walletRow?.id) {
        _transactions.unshift(payload.new);
        applyTransactionsToUI(_transactions);
        if (typeof showToast === 'function') {
          showToast(`🔔 ${payload.new.type === 'receive' ? 'Received' : 'Sent'} ${payload.new.amount} ${payload.new.asset_symbol}`);
        }
      }
    })
    .subscribe();

  // Fallback Polling (8s)
  setInterval(() => {
    fetchAndRenderWallet();
    fetchAndRenderTransactions();
  }, 8000);
}

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */

async function initSupabase() {
  const sb = getSupabase();
  if (!sb) return;
  
  // Show skeleton/loading state
  const balEl = document.getElementById('home-balance');
  if (balEl) balEl.classList.add('loading-pulse');

  await fetchAndRenderWallet();
  await fetchAndRenderTransactions();
  subscribeRealtime();
}
