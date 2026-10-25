/* =====================================================================
   admin.js  -  Admin panel (overview, customers, transactions, loans)
   ===================================================================== */
Api.requireLogin('admin');

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const titles = { overview: 'Overview', customers: 'Customers', txns: 'All Transactions', loans: 'Loan Requests' };

function openMenu() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); }
function closeMenu() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); }
$('#burger').onclick = openMenu;
$('#overlay').onclick = closeMenu;
$('#logoutLink').onclick = () => Api.logout();
$('#themeBtn').onclick = toggleTheme;
$$('.sidebar a[data-page]').forEach(a => a.onclick = () => go(a.dataset.page));

function go(p) {
  $$('.page').forEach(x => x.classList.toggle('active', x.id === 'p-' + p));
  $$('.sidebar a[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === p));
  $('#pageTitle').textContent = titles[p];
  history.replaceState(null, '', '#' + p);
  closeMenu(); window.scrollTo(0, 0);
  ({ overview: renderOverview, customers: renderCustomers, txns: renderTxns, loans: renderLoans })[p]();
}

/* ---------- OVERVIEW ---------- */
function renderOverview() {
  const cust = Api.allCustomers(), txns = Api.allTxns(), loans = Api.allLoans();
  const total = cust.reduce((s, u) => s + u.balance, 0);
  const pending = loans.filter(l => l.status === 'pending');
  const stat = (ico, label, val) => `<div class="card" style="text-align:center"><div style="font-size:2rem">${ico}</div><h2 style="color:var(--blue2);margin:4px 0">${val}</h2><small>${label}</small></div>`;
  $('#p-overview').innerHTML = `
    <div class="grid" style="margin-bottom:22px">
      ${stat('👥', 'Total Customers', cust.length)}
      ${stat('💰', 'Total Bank Balance', money(total))}
      ${stat('🔁', 'Total Transactions', txns.length)}
      ${stat('⏳', 'Pending Loans', pending.length)}
    </div>
    <div class="row2">
      <div class="card"><h3>Deposits / Credits (last 7 days)</h3>${barChart(last7Days(txns, 'credit'))}</div>
      <div class="card"><h3>Withdrawals / Debits (last 7 days)</h3>${barChart(last7Days(txns, 'debit'))}</div>
    </div>
    <div class="card"><h3>Latest Transactions</h3>
      ${txns.slice(0, 5).map(t => `<div class="txn"><div class="l"><div class="dot ${t.type === 'credit' ? 'cr' : 'dr'}">${t.type === 'credit' ? '↓' : '↑'}</div>
        <div>${esc(t.desc)}<br><small>A/C ${t.accNo} · ${fmtDate(t.date)}</small></div></div>
        <div class="${t.type === 'credit' ? 'cr-t' : 'dr-t'}">${money(t.amount)}</div></div>`).join('')}
    </div>`;
}

/* ---------- CUSTOMERS ---------- */
function renderCustomers() {
  $('#p-customers').innerHTML = `
    <div class="card">
      <div class="toolbar"><input id="cSearch" placeholder="Search name, email or account number..."></div>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Account</th><th>Type</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody id="cBody"></tbody></table></div>
    </div>`;
  const draw = () => {
    const q = $('#cSearch').value.toLowerCase();
    $('#cBody').innerHTML = Api.allCustomers().filter(u => (u.name + u.email + u.accNo).toLowerCase().includes(q)).map(u => `
      <tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.accNo}</td><td>${esc(u.accType)}</td><td>${money(u.balance)}</td>
      <td><span class="tag ${u.status}">${u.status}</span></td>
      <td><button class="btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}" data-block="${u.id}">${u.status === 'active' ? 'Block' : 'Unblock'}</button></td></tr>`).join('') || '<tr><td colspan="7">No customers found.</td></tr>';
    $$('[data-block]').forEach(b => b.onclick = () => { const s = Api.toggleBlock(Number(b.dataset.block)); toast('Account ' + s); draw(); });
  };
  $('#cSearch').oninput = draw; draw();
}

/* ---------- ALL TRANSACTIONS ---------- */
function renderTxns() {
  $('#p-txns').innerHTML = `
    <div class="card">
      <div class="toolbar"><input id="tSearch" placeholder="Search account, ID or description...">
        <select id="tType"><option value="">All</option><option value="credit">Credit</option><option value="debit">Debit</option></select></div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Txn ID</th><th>Account</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody id="tBody"></tbody></table></div>
    </div>`;
  const draw = () => {
    const q = $('#tSearch').value.toLowerCase(), ty = $('#tType').value;
    $('#tBody').innerHTML = Api.allTxns().filter(t => (!ty || t.type === ty) && (t.desc + t.id + t.accNo).toLowerCase().includes(q)).map(t => `
      <tr><td>${fmtDate(t.date)}</td><td>${t.id}</td><td>${t.accNo}</td><td>${esc(t.desc)}</td>
      <td><span class="tag ${t.type === 'credit' ? 'approved' : 'rejected'}">${t.type}</span></td>
      <td class="${t.type === 'credit' ? 'cr-t' : 'dr-t'}">${money(t.amount)}</td></tr>`).join('') || '<tr><td colspan="6">Nothing found.</td></tr>';
  };
  $('#tSearch').oninput = draw; $('#tType').onchange = draw; draw();
}

/* ---------- LOANS ---------- */
function renderLoans() {
  $('#p-loans').innerHTML = `
    <div class="card"><div class="table-wrap"><table><thead><tr><th>ID</th><th>Customer</th><th>Type</th><th>Amount</th><th>Years</th><th>EMI</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
    ${Api.allLoans().map(l => `<tr><td>${l.id}</td><td>${esc(l.name)}<br><small>${l.accNo}</small></td><td>${l.type}</td><td>${money(l.amount)}</td><td>${l.years}</td><td>${money(l.emi)}</td><td>${fmtDate(l.date)}</td>
      <td><span class="tag ${l.status}">${l.status}</span></td>
      <td>${l.status === 'pending' ? `<button class="btn btn-sm btn-success" data-ok="${l.id}">Approve</button> <button class="btn btn-sm btn-danger" data-no="${l.id}">Reject</button>` : '-'}</td></tr>`).join('') || '<tr><td colspan="9">No loan requests.</td></tr>'}
    </tbody></table></div></div>`;
  $$('[data-ok]').forEach(b => b.onclick = () => { Api.setLoanStatus(b.dataset.ok, 'approved'); toast('Loan approved and amount credited'); renderLoans(); });
  $$('[data-no]').forEach(b => b.onclick = () => { Api.setLoanStatus(b.dataset.no, 'rejected'); toast('Loan rejected', true); renderLoans(); });
}

go(titles[location.hash.slice(1)] ? location.hash.slice(1) : 'overview');
