/* =====================================================================
   app.js  -  Customer side (dashboard, transfer, history, loans, profile)
   All data comes from the Api object in data.js
   ===================================================================== */
Api.requireLogin('customer');

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const titles = { dashboard: 'Dashboard', transfer: 'Fund Transfer', money: 'Deposit / Withdraw', bills: 'Bills & Recharge', scheme: 'Double Dhamaka Yojana', history: 'Transaction History', loans: 'Loans & EMI', profile: 'My Profile' };
let currentPage = 'dashboard';

/* ---------- menu, theme, notifications ---------- */
function openMenu() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); }
function closeMenu() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); }
$('#burger').onclick = openMenu;
$('#overlay').onclick = closeMenu;
$('#logoutLink').onclick = () => Api.logout();
$('#themeBtn').onclick = toggleTheme;
$$('.sidebar a[data-page]').forEach(a => a.onclick = () => go(a.dataset.page));

$('#bellBtn').onclick = e => {
  e.stopPropagation();
  const box = $('#notif');
  const list = Api.notifications();
  box.innerHTML = '<h3 style="font-size:.95rem;margin-bottom:6px">Notifications</h3>' +
    (list.length ? list.map(n => `<p>${esc(n.text)}<br><small style="color:var(--muted)">${fmtDate(n.date)}</small></p>`).join('') : '<p>No notifications.</p>');
  box.classList.toggle('show');
  Api.markAllRead(); refreshTop();
};
document.addEventListener('click', e => { if (!e.target.closest('#notif')) $('#notif').classList.remove('show'); });

function refreshTop() {
  const u = Api.current();
  $('#avatar').textContent = u.name.trim()[0].toUpperCase();
  const c = Api.unreadCount();
  $('#badge').style.display = c ? 'flex' : 'none';
  $('#badge').textContent = c;
}

/* ---------- page switching ---------- */
function go(p) {
  currentPage = p;
  $$('.page').forEach(x => x.classList.toggle('active', x.id === 'p-' + p));
  $$('.sidebar a[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === p));
  $('#pageTitle').textContent = titles[p];
  history.replaceState(null, '', '#' + p);
  closeMenu(); render(p); window.scrollTo(0, 0);
}
function render(p) {
  refreshTop();
  ({ dashboard: renderDashboard, transfer: renderTransfer, money: renderMoney, bills: renderBills, scheme: renderScheme, history: renderHistory, loans: renderLoans, profile: renderProfile })[p]();
}

/* ---------- small html pieces ---------- */
function txnRow(t) {
  const cr = t.type === 'credit';
  return `<div class="txn">
    <div class="l"><div class="dot ${cr ? 'cr' : 'dr'}">${cr ? '↓' : '↑'}</div>
      <div><div>${esc(t.desc)}</div><small>${fmtDate(t.date)} · ${t.id}</small></div></div>
    <div class="${cr ? 'cr-t' : 'dr-t'}">${cr ? '+' : '-'}${money(t.amount)}</div></div>`;
}
function msgBox(id, text, ok) { const m = $('#' + id); m.textContent = text; m.className = 'msg ' + (ok ? 'ok' : 'err'); }

/* =====================================================================
   DASHBOARD
   ===================================================================== */
function renderDashboard() {
  const u = Api.current(); const t = Api.history(u.accNo);
  $('#p-dashboard').innerHTML = `
    <h3 style="margin-bottom:14px">Welcome back, ${esc(u.name.split(' ')[0])} 👋</h3>
    <div class="row2">
      <div class="balance-card">
        <div class="bc-top"><div class="bc-bank">🏦 ${BANK.name}</div><span>${esc(u.accType)} Account</span></div>
        <small>Available Balance</small>
        <div class="amt">${money(u.balance)}</div>
        <div class="bc-accno">${fmtAcc(u.accNo)}</div>
        <div class="acc"><span>${esc(u.name)}</span><span>IFSC: ${BANK.ifsc}</span></div>
      </div>
      <div class="card"><h3>Spending (last 7 days)</h3>${barChart(last7Days(t, 'debit'))}</div>
    </div>
    <div class="quick">
      <button onclick="go('transfer')"><span>💸</span>Send Money</button>
      <button onclick="go('bills')"><span>🧾</span>Pay Bills</button>
      <button onclick="go('money')"><span>🏧</span>Deposit</button>
      <button onclick="go('loans')"><span>🏦</span>Loan</button>
      <button onclick="go('history')"><span>📜</span>History</button>
      <button onclick="go('profile')"><span>👤</span>Profile</button>
    </div>
    <div class="card"><h3>Recent Transactions</h3>
      ${t.slice(0, 5).map(txnRow).join('') || '<p>No transactions yet.</p>'}
      <br><a class="btn btn-sm btn-primary" onclick="go('history')">View all</a>
    </div>`;
}

/* =====================================================================
   FUND TRANSFER
   ===================================================================== */
function renderTransfer() {
  const bens = Api.beneficiaries();
  $('#p-transfer').innerHTML = `
    <div class="row2">
      <div class="card"><h3>Send Money</h3>
        <div id="tMsg" class="msg"></div>
        <form id="tForm">
          <div class="field"><label>Receiver Account Number (${BANK.name})</label>
            <input id="tAcc" list="benList" inputmode="numeric" maxlength="10" placeholder="10 digit account number" required>
            <datalist id="benList">${bens.map(b => `<option value="${b.accNo}">${esc(b.name)}</option>`).join('')}</datalist>
            <div id="tName" class="hint" style="text-align:left;margin-top:6px"></div></div>
          <div class="field"><label>Amount (₹)</label><input id="tAmt" type="number" min="1" step="0.01" required></div>
          <div class="field"><label>Remark (optional)</label><input id="tNote" maxlength="30" placeholder="Rent, gift..."></div>
          <label style="display:flex;gap:8px;margin-bottom:16px;align-items:center"><input type="checkbox" id="tSave"> Save as beneficiary</label>
          <button class="btn btn-primary btn-block">Send Money</button>
        </form>
      </div>
      <div class="card"><h3>Saved Beneficiaries</h3>
        ${bens.length ? bens.map(b => `<div class="txn"><div class="l"><div class="avatar">${esc(b.name[0])}</div><div>${esc(b.name)}<br><small>${b.accNo} · ${BANK.name}</small></div></div>
          <div><button class="btn btn-sm btn-primary" data-use="${b.accNo}">Pay</button> <button class="btn btn-sm btn-danger" data-del="${b.accNo}">✕</button></div></div>`).join('') : '<p>No beneficiaries saved yet.</p>'}
      </div>
    </div>`;

  const showName = () => {
    const r = $('#tAcc').value.length === 10 ? Api.lookup($('#tAcc').value) : null;
    $('#tName').textContent = $('#tAcc').value.length < 10 ? '' : (r ? '✔ ' + r.name + ' · ' + r.bank : '✘ Account not found');
    $('#tName').style.color = r ? 'var(--green)' : 'var(--red)';
  };
  $('#tAcc').oninput = showName;
  $$('[data-use]').forEach(b => b.onclick = () => { $('#tAcc').value = b.dataset.use; showName(); $('#tAmt').focus(); });
  $$('[data-del]').forEach(b => b.onclick = () => { Api.removeBeneficiary(b.dataset.del); renderTransfer(); });

  $('#tForm').onsubmit = e => {
    e.preventDefault();
    const to = $('#tAcc').value, amt = $('#tAmt').value;
    const who = Api.lookup(to);
    if (who && !confirm('Send ' + money(amt) + ' to ' + who.name + '?')) return;
    const r = Api.transfer(to, amt, $('#tNote').value, $('#tSave').checked);
    if (!r.ok) return msgBox('tMsg', r.msg);
    toast(r.msg); renderTransfer(); refreshTop();
  };
}

/* =====================================================================
   DEPOSIT / WITHDRAW
   ===================================================================== */
function renderMoney() {
  const u = Api.current();
  $('#p-money').innerHTML = `
    <p style="margin-bottom:16px">Current balance: <b>${money(u.balance)}</b></p>
    <div class="row2">
      <div class="card"><h3>🏧 Deposit Money</h3>
        <div id="dMsg" class="msg"></div>
        <form id="dForm"><div class="field"><label>Amount (₹)</label><input id="dAmt" type="number" min="1" required></div>
        <button class="btn btn-success btn-block">Deposit</button></form></div>
      <div class="card"><h3>💵 Withdraw Money</h3>
        <div id="wMsg" class="msg"></div>
        <form id="wForm"><div class="field"><label>Amount (₹)</label><input id="wAmt" type="number" min="1" required></div>
        <button class="btn btn-danger btn-block">Withdraw</button></form>
        <p class="hint">₹${MIN_BALANCE} minimum balance must remain.</p></div>
    </div>`;
  $('#dForm').onsubmit = e => { e.preventDefault(); const r = Api.deposit($('#dAmt').value); if (!r.ok) return msgBox('dMsg', r.msg); toast(r.msg); renderMoney(); refreshTop(); };
  $('#wForm').onsubmit = e => { e.preventDefault(); const r = Api.withdraw($('#wAmt').value); if (!r.ok) return msgBox('wMsg', r.msg); toast(r.msg); renderMoney(); refreshTop(); };
}

/* =====================================================================
   TRANSACTION HISTORY
   ===================================================================== */
function renderHistory() {
  const u = Api.current(); const all = Api.history(u.accNo);
  $('#p-history').innerHTML = `
    <div class="card">
      <div class="toolbar">
        <input id="hSearch" placeholder="Search description or ID...">
        <select id="hType"><option value="">All</option><option value="credit">Credit</option><option value="debit">Debit</option></select>
        <button class="btn btn-sm btn-primary" id="hCsv">⬇ Download CSV</button>
        <button class="btn btn-sm btn-gold" onclick="window.print()">🖨 Print / PDF</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Txn ID</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody id="hBody"></tbody></table></div>
    </div>`;
  const draw = () => {
    const q = $('#hSearch').value.toLowerCase(), ty = $('#hType').value;
    const rows = all.filter(t => (!ty || t.type === ty) && (t.desc.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)));
    $('#hBody').innerHTML = rows.map(t => `<tr><td>${fmtDate(t.date)}</td><td>${t.id}</td><td>${esc(t.desc)}</td>
      <td><span class="tag ${t.type === 'credit' ? 'approved' : 'rejected'}">${t.type}</span></td>
      <td class="${t.type === 'credit' ? 'cr-t' : 'dr-t'}">${t.type === 'credit' ? '+' : '-'}${money(t.amount)}</td></tr>`).join('') || '<tr><td colspan="5">No transactions found.</td></tr>';
    draw.rows = rows;
  };
  $('#hSearch').oninput = draw; $('#hType').onchange = draw; draw();
  $('#hCsv').onclick = () => {
    const head = 'Date,Txn ID,Description,Type,Amount';
    const body = draw.rows.map(t => [fmtDate(t.date), t.id, '"' + t.desc.replace(/"/g, '""') + '"', t.type, t.amount].join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([head + '\n' + body], { type: 'text/csv' }));
    a.download = 'statement-' + u.accNo + '.csv'; a.click();
  };
}

/* =====================================================================
   LOANS + EMI
   ===================================================================== */
function renderLoans() {
  const loans = Api.myLoans();
  $('#p-loans').innerHTML = `
    <div class="row2">
      <div class="card"><h3>Apply for a Loan</h3>
        <div id="lnMsg" class="msg"></div>
        <form id="lnForm">
          <div class="form-grid">
            <div class="field"><label>Loan Type</label><select id="lnType">${Object.keys(LOAN_RATES).map(k => `<option>${k}</option>`).join('')}</select></div>
            <div class="field"><label>Time (years)</label><select id="lnYears">${[1, 2, 3, 5, 7, 10, 15, 20].map(y => `<option>${y}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>Loan Amount (₹)</label><input id="lnAmt" type="number" min="10000" step="1000" value="100000" required></div>
          <div class="emi-out" id="emiOut"></div><br>
          <button class="btn btn-primary btn-block">Apply Now</button>
        </form>
      </div>
      <div class="card"><h3>Interest Rates</h3>
        <table style="min-width:0"><thead><tr><th>Loan</th><th>Rate (per year)</th></tr></thead><tbody>
        ${Object.entries(LOAN_RATES).map(([k, v]) => `<tr><td>${k} Loan</td><td><b>${v}%</b></td></tr>`).join('')}</tbody></table>
        <p class="hint" style="text-align:left">EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)<br>P = amount, r = monthly rate, n = months</p>
      </div>
    </div>
    <div class="card"><h3>My Loan Applications</h3><div class="table-wrap">
      <table><thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Years</th><th>EMI / month</th><th>Status</th><th>Date</th></tr></thead><tbody>
      ${loans.map(l => `<tr><td>${l.id}</td><td>${l.type}</td><td>${money(l.amount)}</td><td>${l.years}</td><td>${money(l.emi)}</td><td><span class="tag ${l.status}">${l.status}</span></td><td>${fmtDate(l.date)}</td></tr>`).join('') || '<tr><td colspan="7">No loan applications yet.</td></tr>'}
      </tbody></table></div></div>`;

  const calc = () => {
    const p = Number($('#lnAmt').value) || 0, y = Number($('#lnYears').value), r = LOAN_RATES[$('#lnType').value];
    const emi = calcEmi(p, r, y), total = emi * y * 12;
    $('#emiOut').innerHTML = `Monthly EMI<br><b>${money(emi)}</b><br><small>Interest: ${money(total - p)} · Total payable: ${money(total)} (@ ${r}%)</small>`;
  };
  ['#lnAmt', '#lnYears', '#lnType'].forEach(s => { $(s).oninput = calc; $(s).onchange = calc; }); calc();
  $('#lnForm').onsubmit = e => {
    e.preventDefault();
    const r = Api.applyLoan($('#lnType').value, $('#lnAmt').value, $('#lnYears').value);
    if (!r.ok) return msgBox('lnMsg', r.msg);
    toast(r.msg); renderLoans(); refreshTop();
  };
}

/* =====================================================================
   PROFILE
   ===================================================================== */
function renderProfile() {
  const u = Api.current();
  $('#p-profile').innerHTML = `
    <div class="card" style="margin-bottom:22px">
      <div class="profile-head"><div class="avatar">${esc(u.name[0])}</div>
        <div><h3 style="margin:0">${esc(u.name)}</h3><small>${esc(u.email)}</small></div></div>
      <div class="form-grid" style="font-size:.95rem">
        <p><b>Bank:</b> ${BANK.name}</p><p><b>Branch:</b> ${BANK.branch}</p>
        <p><b>Account No:</b> ${u.accNo}</p><p><b>Account Type:</b> ${esc(u.accType)}</p>
        <p><b>IFSC:</b> ${BANK.ifsc}</p>
        <p><b>Status:</b> <span class="tag active">${u.status}</span></p><p><b>Member since:</b> ${fmtDate(u.created)}</p>
      </div>
    </div>
    <div class="row2">
      <div class="card"><h3>Edit Profile</h3><div id="pMsg" class="msg"></div>
        <form id="pForm">
          <div class="field"><label>Full Name</label><input id="pName" value="${esc(u.name)}" required></div>
          <div class="field"><label>Mobile</label><input id="pPhone" value="${esc(u.phone)}" maxlength="10" required></div>
          <div class="field"><label>City</label><input id="pCity" value="${esc(u.city)}"></div>
          <button class="btn btn-primary btn-block">Save Changes</button>
        </form></div>
      <div class="card"><h3>Change Password</h3><div id="cMsg" class="msg"></div>
        <form id="cForm">
          <div class="field"><label>Old Password</label><input type="password" id="cOld" required></div>
          <div class="field"><label>New Password</label><input type="password" id="cNew" minlength="4" required></div>
          <button class="btn btn-gold btn-block">Change Password</button>
        </form></div>
    </div>`;
  $('#pForm').onsubmit = e => { e.preventDefault(); const r = Api.updateProfile($('#pName').value, $('#pPhone').value, $('#pCity').value); if (!r.ok) return msgBox('pMsg', r.msg); toast(r.msg); renderProfile(); refreshTop(); };
  $('#cForm').onsubmit = e => { e.preventDefault(); const r = Api.changePassword($('#cOld').value, $('#cNew').value); if (!r.ok) return msgBox('cMsg', r.msg); toast(r.msg); renderProfile(); };
}

/* =====================================================================
   BILLS & RECHARGE
   ===================================================================== */
let billCat = null, billState = {};

function renderBills() {
  const hist = Api.billHistory();
  $('#p-bills').innerHTML = `
    <div class="card" style="margin-bottom:22px"><h3>Choose a service</h3>
      <div class="cat-grid">${Object.entries(BILL_CATS).map(([k, c]) =>
        `<div class="cat ${k === billCat ? 'sel' : ''}" data-cat="${k}"><span>${c.icon}</span>${c.label}</div>`).join('')}</div></div>
    <div class="row2">
      <div class="card" id="billForm"></div>
      <div class="card"><h3>Recent Bill Payments</h3>${hist.slice(0, 6).map(txnRow).join('') || '<p>No bill payments yet.</p>'}</div>
    </div>`;
  $$('[data-cat]').forEach(el => el.onclick = () => { billCat = el.dataset.cat; billState = {}; renderBills(); });
  drawBillForm();
}

function drawBillForm() {
  const box = $('#billForm');
  if (!billCat) {
    box.innerHTML = `<h3>Pay Bills &amp; Recharge</h3><p>Select a service above to start.</p><p class="hint" style="text-align:left">Balance: ${money(Api.current().balance)}</p>`;
    return;
  }
  const c = BILL_CATS[billCat];

  /* receipt after a successful payment */
  if (billState.done) {
    const d = billState.done;
    box.innerHTML = `<div class="receipt"><div style="font-size:2.4rem">✅</div><h3>Payment Successful</h3>
      <p><b>${money(d.txn.amount)}</b> paid to ${esc(d.prov)}</p>
      <p class="hint">${esc(d.label)} · ${esc(d.ref)}<br>Txn ID: ${d.txn.id} · ${fmtDate(d.txn.date)}</p><br>
      <button class="btn btn-sm btn-gold" onclick="window.print()">🖨 Print Receipt</button>
      <button class="btn btn-sm btn-primary" id="bAgain">Pay another</button></div>`;
    $('#bAgain').onclick = () => { billState = {}; renderBills(); };
    return;
  }

  const isBill = c.kind === 'bill';
  box.innerHTML = `
    <h3>${c.icon} ${c.label}</h3>
    <div id="bMsg" class="msg"></div>
    <form id="bForm">
      <div class="field"><label>Provider / Operator</label>
        <select id="bProv">${c.providers.map(p => `<option>${esc(p)}</option>`).join('')}</select></div>
      <div class="field"><label>${c.idLabel}</label>
        <input id="bRef" ${c.digits ? 'inputmode="numeric" maxlength="10"' : ''} required></div>
      ${isBill
        ? `<button type="button" class="btn btn-gold btn-sm" id="bFetch">Fetch Bill</button><div id="bInfo" style="margin-top:12px"></div>`
        : `<div class="chips">${c.plans.map(p => `<button type="button" class="chip-btn" data-plan="${p}">₹${p}</button>`).join('')}</div>
           <div class="field"><label>Amount (₹)</label><input id="bAmt" type="number" min="1" required></div>`}
      <br><button class="btn btn-primary btn-block">${isBill ? 'Pay Bill' : 'Recharge Now'}</button>
    </form>
    <p class="hint">Balance: ${money(Api.current().balance)}</p>`;

  if (isBill) {
    $('#bRef').oninput = () => { billState.bill = null; $('#bInfo').innerHTML = ''; };
    $('#bFetch').onclick = () => {
      const ref = $('#bRef').value.trim();
      if (c.digits ? !/^\d{10}$/.test(ref) : ref.length < 6) return msgBox('bMsg', 'Enter a valid ' + c.idLabel + ' first.');
      $('#bMsg').className = 'msg';
      const b = demoBill(ref); billState.bill = b;
      $('#bInfo').innerHTML = `<div class="bill-info">Name: <b>${b.name}</b><br>Bill amount: <b>${money(b.amount)}</b><br>Due date: ${fmtDate(b.due)}</div>`;
    };
  } else {
    $$('[data-plan]').forEach(b => b.onclick = () => {
      $('#bAmt').value = b.dataset.plan;
      $$('[data-plan]').forEach(x => x.classList.toggle('sel', x === b));
    });
  }

  $('#bForm').onsubmit = e => {
    e.preventDefault();
    const prov = $('#bProv').value, ref = $('#bRef').value.trim();
    let amt;
    if (isBill) {
      if (!billState.bill) return msgBox('bMsg', 'Please click "Fetch Bill" first.');
      amt = billState.bill.amount;
    } else amt = $('#bAmt').value;
    if (!confirm('Pay ' + money(amt) + ' to ' + prov + ' (' + ref + ')?')) return;
    const r = Api.payBill(billCat, prov, ref, amt);
    if (!r.ok) return msgBox('bMsg', r.msg);
    billState = { done: { txn: r.txn, prov, ref, label: c.label } };
    toast(r.msg); refreshTop(); renderBills();
  };
}

/* =====================================================================
   DOUBLE DHAMAKA YOJANA  (demo joke scheme)
   ===================================================================== */
function renderScheme() {
  const u = Api.current(); const list = Api.mySchemes(); const now = Date.now();
  $('#p-scheme').innerHTML = `
    <div class="scheme-hero">
      <div><div class="tagline" style="margin-bottom:8px">🎉 Sirf kuch din ka offer</div>
        <h2>${SCHEME.name}</h2>
        <p>Aaj lagao, ${SCHEME.days} din baad paao <b>${SCHEME.multiplier}× paisa wapas!</b></p></div>
      <div class="x2">${SCHEME.multiplier}×</div>
    </div>
    <div class="row2">
      <div class="card"><h3>Join the scheme</h3><div id="sMsg" class="msg"></div>
        <form id="sForm">
          <div class="field"><label>Amount to invest (₹)</label>
            <input id="sAmt" type="number" min="${SCHEME.min}" max="${SCHEME.max}" step="${SCHEME.step}" value="${SCHEME.min}" required></div>
          <div class="emi-out" id="sOut"></div><br>
          <button class="btn btn-gold btn-block">Join Scheme</button>
        </form>
        <p class="hint">${money(SCHEME.min)} to ${money(SCHEME.max)} in multiples of ₹${SCHEME.step} · Balance: ${money(u.balance)}</p></div>
      <div class="card"><h3>How it works</h3>
        <ol style="margin-left:18px;line-height:1.9">
          <li>Choose an amount and join. It is deducted from your account.</li>
          <li>Wait ${SCHEME.days} days (watch the progress bar).</li>
          <li>On maturity day press <b>Claim</b> and the payout is credited.</li>
        </ol><br>
        <button class="btn btn-sm btn-primary" id="sFast">⏩ Fast-forward ${SCHEME.days} days (demo)</button>
        <p class="hint" style="text-align:left">For viva: use this button to see the payout without waiting.</p></div>
    </div>
    <div class="card"><h3>My Scheme Investments</h3><div class="table-wrap">
      <table><thead><tr><th>ID</th><th>Invested</th><th>Payout</th><th>Start</th><th>Maturity</th><th>Progress</th><th>Status</th><th>Action</th></tr></thead><tbody>
      ${list.map(s => {
        const total = new Date(s.maturity) - new Date(s.start);
        const pct = s.status === 'claimed' ? 100 : Math.min(100, Math.max(0, (now - new Date(s.start)) / total * 100));
        const ready = s.status === 'active' && new Date(s.maturity) <= now;
        const left = Math.ceil((new Date(s.maturity) - now) / 86400000);
        const tag = s.status === 'claimed' ? '<span class="tag approved">Paid</span>' : ready ? '<span class="tag approved">Ready to claim</span>' : `<span class="tag pending">${left} days left</span>`;
        return `<tr><td>${s.id}</td><td>${money(s.amount)}</td><td><b>${money(s.payout)}</b></td><td>${fmtDate(s.start)}</td><td>${fmtDate(s.maturity)}</td>
          <td><div class="progress"><div style="width:${pct.toFixed(0)}%"></div></div></td><td>${tag}</td>
          <td>${ready ? `<button class="btn btn-sm btn-success" data-claim="${s.id}">Claim</button>` : '-'}</td></tr>`;
      }).join('') || '<tr><td colspan="8">You have not joined yet.</td></tr>'}
      </tbody></table></div></div>`;

  const showOut = () => { const a = Number($('#sAmt').value) || 0; $('#sOut').innerHTML = `Payout after ${SCHEME.days} days<br><b>${money(a * SCHEME.multiplier)}</b>`; };
  $('#sAmt').oninput = showOut; showOut();
  $('#sForm').onsubmit = e => {
    e.preventDefault();
    const a = $('#sAmt').value;
    if (!confirm('Join ' + SCHEME.name + ' with ' + money(a) + ' lagana hai?')) return;
    const r = Api.joinScheme(a);
    if (!r.ok) return msgBox('sMsg', r.msg);
    toast(r.msg); refreshTop(); renderScheme();
  };
  $$('[data-claim]').forEach(b => b.onclick = () => {
    const r = Api.claimScheme(b.dataset.claim);
    if (!r.ok) return toast(r.msg, true);
    toast(r.msg); refreshTop(); renderScheme();
  });
  $('#sFast').onclick = () => {
    const n = Api.fastForwardScheme();
    toast(n ? 'Moved ' + n + ' investment(s) ' + SCHEME.days + ' days ahead. You can claim now.' : 'No running investment to fast-forward.', !n);
    renderScheme();
  };
}

/* ---------- start ---------- */
go(titles[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard');
