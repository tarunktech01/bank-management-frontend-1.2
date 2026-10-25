/* =====================================================================
   data.js  -  DEMO DATA LAYER  (works in the browser using localStorage)

   NEXT SEMESTER (backend): replace the body of each Api function with a
   fetch('/api/....') call to your PHP / Node server that talks to MySQL.
   The screens (HTML + app.js + admin.js) will NOT need any change,
   because they only call these Api functions.
   ===================================================================== */

const Store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};

/* ---------- small helpers ---------- */
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const money = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const calcEmi = (p, rate, years) => {
  const m = rate / 1200, n = years * 12;
  return m === 0 ? p / n : p * m * Math.pow(1 + m, n) / (Math.pow(1 + m, n) - 1);
};
const LOAN_RATES = { Home: 8.5, Car: 9.5, Personal: 12, Education: 9, Gold: 10 };
const MIN_BALANCE = 500;
const BANK = { name: 'HP Bank', fullName: 'Hamara Paisa Bank', tagline: 'Hamara Paisa, Hamara Bharosa', ifsc: 'HPBK0001001', branch: 'Main Branch' };
/* demo joke scheme (Hera Pheri style). Real banks never promise to double money. */
const SCHEME = { name: 'HP Double Dhamaka Yojana', days: 21, min: 1000, max: 50000, step: 500, multiplier: 2 };
const fmtAcc = a => String(a).slice(0, 4) + ' ' + String(a).slice(4);

/* ---------- bill payment & recharge services (demo) ---------- */
const BILL_CATS = {
  mobile:    { label: 'Mobile Recharge',  icon: '📱', kind: 'recharge', idLabel: 'Mobile Number', digits: true, providers: ['Jio', 'Airtel', 'Vi', 'BSNL'], plans: [149, 239, 299, 399, 599, 749] },
  dth:       { label: 'DTH Recharge',     icon: '📺', kind: 'recharge', idLabel: 'Subscriber ID', providers: ['Tata Play', 'Dish TV', 'Sun Direct', 'Videocon d2h'], plans: [200, 350, 500, 800] },
  fastag:    { label: 'FASTag Recharge',  icon: '🛣️', kind: 'recharge', idLabel: 'Vehicle Number', providers: ['Bank FASTag', 'Other FASTag'], plans: [500, 1000, 2000] },
  electricity: { label: 'Electricity',    icon: '💡', kind: 'bill', idLabel: 'Consumer Number', providers: ['UPPCL', 'BSES Delhi', 'MSEDCL', 'Tata Power'] },
  water:     { label: 'Water Bill',       icon: '🚰', kind: 'bill', idLabel: 'Connection ID', providers: ['Jal Board', 'Municipal Corporation'] },
  gas:       { label: 'Gas / LPG',        icon: '🔥', kind: 'bill', idLabel: 'Customer ID', providers: ['Indane', 'Bharat Gas', 'Piped Gas (PNG)'] },
  broadband: { label: 'Broadband / WiFi', icon: '🌐', kind: 'bill', idLabel: 'Account Number', providers: ['JioFiber', 'Airtel Xstream', 'ACT Fibernet', 'BSNL Broadband'] },
  postpaid:  { label: 'Postpaid Mobile',  icon: '📞', kind: 'bill', idLabel: 'Mobile Number', digits: true, providers: ['Jio', 'Airtel', 'Vi', 'BSNL'] },
  insurance: { label: 'Insurance',        icon: '🛡️', kind: 'bill', idLabel: 'Policy Number', providers: ['LIC', 'Star Health', 'Bajaj Allianz'] },
  education: { label: 'School / College Fee', icon: '🎓', kind: 'bill', idLabel: 'Student ID', providers: ['School Fee', 'College Fee', 'Exam Fee'] }
};
/* demo only: makes a believable bill amount from the number typed. A real backend will fetch the real bill. */
const demoBill = ref => {
  let h = 0; for (const c of String(ref)) h = (h * 31 + c.charCodeAt(0)) % 100000;
  const due = new Date(); due.setDate(due.getDate() + 3 + (h % 10));
  return { name: 'Demo Customer', amount: 300 + (h % 2400), due: due.toISOString() };
};

function toast(msg, isErr) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.className = 'toast' + (isErr ? ' err' : ''), 2800);
}

/* ---------- dark mode ---------- */
function applyTheme() { document.body.classList.toggle('dark', Store.get('sb_dark', false)); }
function toggleTheme() { Store.set('sb_dark', !Store.get('sb_dark', false)); applyTheme(); }
document.addEventListener('DOMContentLoaded', applyTheme);

/* ---------- simple bar chart (pure HTML/CSS) ---------- */
function barChart(items) {
  const max = Math.max(...items.map(i => i.value), 1);
  return `<div class="chart-wrap"><div class="chart">` +
    items.map(i => `<div class="bar" style="height:${Math.max(4, i.value / max * 100)}%" title="${esc(i.label)}: ${money(i.value)}"><span>${esc(i.label)}</span></div>`).join('') +
    `</div></div>`;
}
function last7Days(txns, type) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const total = txns.filter(t => t.type === type && new Date(t.date).toDateString() === key).reduce((s, t) => s + t.amount, 0);
    out.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value: total });
  }
  return out;
}

/* =====================================================================
   Api  -  every function here becomes a backend call later
   ===================================================================== */
const Api = {
  /* ----- storage shortcuts ----- */
  _users() { return Store.get('sb_users', []); },
  _txns() { return Store.get('sb_txns', []); },
  _loans() { return Store.get('sb_loans', []); },
  _bens() { return Store.get('sb_bens', []); },
  _notes() { return Store.get('sb_notes', []); },

  /* ----- first-time demo data ----- */
  init() {
    if (Store.get('sb_seeded')) return;
    const users = [
      { id: 1, name: 'Rahul Sharma', email: 'rahul@demo.com', phone: '9876543210', city: 'Delhi', password: '1234', role: 'customer', accNo: '1000000001', accType: 'Savings', balance: 45250, status: 'active', created: daysAgo(90) },
      { id: 2, name: 'Priya Verma', email: 'priya@demo.com', phone: '9812345678', city: 'Jaipur', password: '1234', role: 'customer', accNo: '1000000002', accType: 'Savings', balance: 82000, status: 'active', created: daysAgo(60) },
      { id: 3, name: 'Amit Singh', email: 'amit@demo.com', phone: '9898989898', city: 'Lucknow', password: '1234', role: 'customer', accNo: '1000000003', accType: 'Current', balance: 120500, status: 'active', created: daysAgo(40) },
      { id: 4, name: 'Bank Admin', email: 'admin@demo.com', phone: '9000000000', city: 'Delhi', password: 'admin123', role: 'admin', accNo: '', accType: '', balance: 0, status: 'active', created: daysAgo(120) }
    ];
    const txns = []; let n = 1;
    const add = (acc, type, amount, desc, d) => txns.push({ id: 'TXN' + (100000 + n++), accNo: acc, type, amount, desc, date: daysAgo(d) });
    add('1000000001', 'credit', 50000, 'Opening deposit', 90);
    add('1000000001', 'credit', 30000, 'Salary credit', 20);
    add('1000000001', 'debit', 1850, 'Bill: Electricity - UPPCL (4521780)', 14);
    add('1000000001', 'debit', 5000, 'Cash withdrawal', 10);
    add('1000000001', 'debit', 2400, 'Transfer to 1000000002 Rent', 6);
    add('1000000001', 'credit', 1500, 'Transfer from 1000000003 Refund', 4);
    add('1000000001', 'debit', 899, 'Bill: Mobile Recharge - Airtel (9876543210)', 3);
    add('1000000001', 'debit', 3200, 'Grocery shopping', 1);
    add('1000000001', 'debit', 650, 'Movie tickets', 0);
    add('1000000002', 'credit', 82000, 'Opening deposit', 60);
    add('1000000002', 'credit', 2400, 'Transfer from 1000000001 Rent', 6);
    add('1000000003', 'credit', 120500, 'Opening deposit', 40);
    add('1000000003', 'debit', 1500, 'Transfer to 1000000001 Refund', 4);
    const loans = [
      { id: 'LN1001', userId: 2, accNo: '1000000002', name: 'Priya Verma', type: 'Home', amount: 2500000, years: 15, rate: 8.5, emi: calcEmi(2500000, 8.5, 15), status: 'pending', date: daysAgo(2) },
      { id: 'LN1002', userId: 1, accNo: '1000000001', name: 'Rahul Sharma', type: 'Education', amount: 300000, years: 5, rate: 9, emi: calcEmi(300000, 9, 5), status: 'approved', date: daysAgo(30) }
    ];
    const bens = [{ userId: 1, accNo: '1000000002', name: 'Priya Verma' }];
    const notes = [
      { id: 1, userId: 1, text: 'Welcome to HP Bank! Your account is active.', date: daysAgo(90), read: false },
      { id: 2, userId: 1, text: 'Your education loan LN1002 was approved.', date: daysAgo(28), read: false }
    ];
    const schemes = [
      { id: 'DD1001', userId: 2, accNo: '1000000002', name: 'Priya Verma', amount: 5000, payout: 10000, start: daysAgo(5), maturity: daysAgo(-16), status: 'active' }
    ];
    Store.set('sb_schemes', schemes);
    Store.set('sb_users', users); Store.set('sb_txns', txns); Store.set('sb_loans', loans);
    Store.set('sb_bens', bens); Store.set('sb_notes', notes); Store.set('sb_seeded', 1);
  },

  /* ----- session ----- */
  current() { const id = Store.get('sb_session'); return this._users().find(u => u.id === id) || null; },
  requireLogin(role) {
    const u = this.current();
    if (!u || (role && u.role !== role)) { location.href = 'login.html'; return null; }
    return u;
  },
  login(email, pass) {
    const u = this._users().find(x => x.email === String(email).trim().toLowerCase() && x.password === pass);
    if (!u) return { ok: false, msg: 'Wrong email or password.' };
    if (u.status === 'blocked') return { ok: false, msg: 'Your account is blocked. Please contact the bank.' };
    Store.set('sb_session', u.id);
    return { ok: true, user: u };
  },
  logout() { localStorage.removeItem('sb_session'); location.href = 'login.html'; },

  register(d) {
    const users = this._users();
    const email = d.email.trim().toLowerCase();
    if (users.some(u => u.email === email)) return { ok: false, msg: 'This email is already registered.' };
    if (d.password.length < 4) return { ok: false, msg: 'Password must be at least 4 characters.' };
    if (!/^\d{10}$/.test(d.phone)) return { ok: false, msg: 'Enter a valid 10 digit mobile number.' };
    const opening = Number(d.opening);
    if (!(opening >= MIN_BALANCE)) return { ok: false, msg: 'Opening deposit must be at least ₹' + MIN_BALANCE + '.' };
    const accNo = String(Math.max(1000000000, ...users.map(u => Number(u.accNo) || 0)) + 1);
    const user = { id: Math.max(0, ...users.map(u => u.id)) + 1, name: d.name.trim(), email, phone: d.phone, city: d.city || '', password: d.password, role: 'customer', accNo, accType: d.accType, balance: opening, status: 'active', created: new Date().toISOString() };
    users.push(user); Store.set('sb_users', users);
    this._addTxn(accNo, 'credit', opening, 'Opening deposit');
    this._notify(user.id, 'Welcome to HP Bank! Your account ' + accNo + ' is ready.');
    return { ok: true, user };
  },

  /* ----- internal helpers ----- */
  _addTxn(accNo, type, amount, desc) {
    const t = this._txns();
    const row = { id: 'TXN' + (100000 + t.length + 1 + Math.floor(Math.random() * 900)), accNo, type, amount, desc, date: new Date().toISOString() };
    t.push(row);
    Store.set('sb_txns', t);
    return row;
  },
  _notify(userId, text) {
    const n = this._notes();
    n.push({ id: n.length + 1, userId, text, date: new Date().toISOString(), read: false });
    Store.set('sb_notes', n);
  },
  _update(userId, fn) {
    const users = this._users(); const u = users.find(x => x.id === userId);
    fn(u); Store.set('sb_users', users); return u;
  },

  /* ----- customer: money ----- */
  deposit(amount) {
    amount = Number(amount); const me = this.current();
    if (!(amount > 0)) return { ok: false, msg: 'Enter a valid amount.' };
    if (amount > 200000) return { ok: false, msg: 'Maximum deposit at one time is ₹2,00,000.' };
    this._update(me.id, u => u.balance += amount);
    this._addTxn(me.accNo, 'credit', amount, 'Cash deposit');
    this._notify(me.id, money(amount) + ' deposited to your account.');
    return { ok: true, msg: money(amount) + ' deposited successfully.' };
  },
  withdraw(amount) {
    amount = Number(amount); const me = this.current();
    if (!(amount > 0)) return { ok: false, msg: 'Enter a valid amount.' };
    if (me.balance - amount < MIN_BALANCE) return { ok: false, msg: 'Insufficient balance. ₹' + MIN_BALANCE + ' must remain in the account.' };
    this._update(me.id, u => u.balance -= amount);
    this._addTxn(me.accNo, 'debit', amount, 'Cash withdrawal');
    this._notify(me.id, money(amount) + ' withdrawn from your account.');
    return { ok: true, msg: money(amount) + ' withdrawn successfully.' };
  },
  lookup(accNo) {
    const u = this._users().find(x => x.accNo === String(accNo) && x.role === 'customer');
    return u ? { name: u.name, status: u.status, bank: BANK.name } : null;
  },
  transfer(toAcc, amount, note, saveBen) {
    amount = Number(amount); const me = this.current(); toAcc = String(toAcc).trim();
    const to = this._users().find(x => x.accNo === toAcc && x.role === 'customer');
    if (!to) return { ok: false, msg: 'Receiver account not found.' };
    if (to.id === me.id) return { ok: false, msg: 'You cannot send money to your own account.' };
    if (to.status === 'blocked') return { ok: false, msg: 'Receiver account is blocked.' };
    if (!(amount > 0)) return { ok: false, msg: 'Enter a valid amount.' };
    if (me.balance - amount < MIN_BALANCE) return { ok: false, msg: 'Insufficient balance. ₹' + MIN_BALANCE + ' must remain in the account.' };
    const remark = note ? ' ' + note : '';
    this._update(me.id, u => u.balance -= amount);
    this._update(to.id, u => u.balance += amount);
    this._addTxn(me.accNo, 'debit', amount, 'Transfer to ' + toAcc + remark);
    this._addTxn(toAcc, 'credit', amount, 'Transfer from ' + me.accNo + remark);
    this._notify(me.id, money(amount) + ' sent to ' + to.name + '.');
    this._notify(to.id, money(amount) + ' received from ' + me.name + '.');
    if (saveBen) this.addBeneficiary(toAcc);
    return { ok: true, msg: money(amount) + ' sent to ' + to.name + ' successfully.' };
  },
  history(accNo) { return this._txns().filter(t => t.accNo === accNo).sort((a, b) => new Date(b.date) - new Date(a.date)); },

  /* ----- customer: Double Dhamaka scheme (demo joke) ----- */
  _schemes() { return Store.get('sb_schemes', []); },
  joinScheme(amount) {
    const me = this.current(); amount = Number(amount);
    if (!(amount >= SCHEME.min)) return { ok: false, msg: 'Minimum amount is ' + money(SCHEME.min) + '.' };
    if (amount % SCHEME.step !== 0) return { ok: false, msg: 'Amount must be in multiples of ₹' + SCHEME.step + '.' };
    const list = this._schemes();
    const active = list.filter(s => s.userId === me.id && s.status === 'active').reduce((a, s) => a + s.amount, 0);
    if (active + amount > SCHEME.max) return { ok: false, msg: 'Maximum total investment is ' + money(SCHEME.max) + '.' };
    if (me.balance - amount < MIN_BALANCE) return { ok: false, msg: 'Insufficient balance. ₹' + MIN_BALANCE + ' must remain in the account.' };
    const maturity = new Date(); maturity.setDate(maturity.getDate() + SCHEME.days);
    const s = { id: 'DD' + (1001 + list.length), userId: me.id, accNo: me.accNo, name: me.name, amount, payout: amount * SCHEME.multiplier, start: new Date().toISOString(), maturity: maturity.toISOString(), status: 'active' };
    list.push(s); Store.set('sb_schemes', list);
    this._update(me.id, u => u.balance -= amount);
    this._addTxn(me.accNo, 'debit', amount, 'Scheme: ' + SCHEME.name + ' - invested (' + s.id + ')');
    this._notify(me.id, 'You joined ' + SCHEME.name + ' with ' + money(amount) + '. Payout ' + money(s.payout) + ' on ' + fmtDate(s.maturity) + '.');
    return { ok: true, msg: 'Joined! ' + money(s.payout) + ' will be ready on ' + fmtDate(s.maturity) + '.', scheme: s };
  },
  mySchemes() { const me = this.current(); return this._schemes().filter(s => s.userId === me.id).sort((a, b) => new Date(b.start) - new Date(a.start)); },
  claimScheme(id) {
    const me = this.current(); const list = this._schemes();
    const s = list.find(x => x.id === id && x.userId === me.id);
    if (!s || s.status !== 'active') return { ok: false, msg: 'This investment is not available.' };
    if (new Date(s.maturity) > new Date()) return { ok: false, msg: 'Not matured yet.' };
    s.status = 'claimed'; s.claimed = new Date().toISOString(); Store.set('sb_schemes', list);
    this._update(me.id, u => u.balance += s.payout);
    this._addTxn(me.accNo, 'credit', s.payout, 'Scheme: ' + SCHEME.name + ' - payout (' + s.id + ')');
    this._notify(me.id, money(s.payout) + ' credited from ' + SCHEME.name + ' (' + s.id + ').');
    return { ok: true, msg: money(s.payout) + ' credited to your account.' };
  },
  /* demo helper for viva: moves your running investments 21 days into the past so they mature now */
  fastForwardScheme() {
    const me = this.current(); const list = this._schemes(); let n = 0;
    list.filter(s => s.userId === me.id && s.status === 'active').forEach(s => {
      const back = d => { const x = new Date(d); x.setDate(x.getDate() - SCHEME.days); return x.toISOString(); };
      s.start = back(s.start); s.maturity = back(s.maturity); n++;
    });
    Store.set('sb_schemes', list); return n;
  },
  allSchemes() { return this._schemes().slice().sort((a, b) => new Date(b.start) - new Date(a.start)); },

  /* ----- customer: bills & recharge ----- */
  payBill(catKey, provider, ref, amount) {
    const c = BILL_CATS[catKey]; const me = this.current();
    amount = Number(amount); ref = String(ref).trim();
    if (!c) return { ok: false, msg: 'Invalid service.' };
    if (!provider) return { ok: false, msg: 'Select a provider.' };
    if (c.digits ? !/^\d{10}$/.test(ref) : ref.length < 6) return { ok: false, msg: 'Enter a valid ' + c.idLabel + '.' };
    if (!(amount >= 1)) return { ok: false, msg: 'Enter a valid amount.' };
    if (amount > 50000) return { ok: false, msg: 'Maximum payment at one time is ₹50,000.' };
    if (me.balance - amount < MIN_BALANCE) return { ok: false, msg: 'Insufficient balance. ₹' + MIN_BALANCE + ' must remain in the account.' };
    this._update(me.id, u => u.balance -= amount);
    const txn = this._addTxn(me.accNo, 'debit', amount, 'Bill: ' + c.label + ' - ' + provider + ' (' + ref + ')');
    this._notify(me.id, c.label + ' payment of ' + money(amount) + ' to ' + provider + ' was successful.');
    return { ok: true, msg: c.label + ' payment of ' + money(amount) + ' successful.', txn };
  },
  billHistory() { const me = this.current(); return this.history(me.accNo).filter(t => t.desc.startsWith('Bill:')); },

  /* ----- customer: beneficiaries ----- */
  beneficiaries() { const me = this.current(); return this._bens().filter(b => b.userId === me.id); },
  addBeneficiary(accNo) {
    const me = this.current(); const to = this.lookup(accNo);
    if (!to) return { ok: false, msg: 'Account not found.' };
    const b = this._bens();
    if (!b.some(x => x.userId === me.id && x.accNo === accNo)) { b.push({ userId: me.id, accNo, name: to.name }); Store.set('sb_bens', b); }
    return { ok: true };
  },
  removeBeneficiary(accNo) {
    const me = this.current();
    Store.set('sb_bens', this._bens().filter(x => !(x.userId === me.id && x.accNo === accNo)));
  },

  /* ----- customer: loans ----- */
  myLoans() { const me = this.current(); return this._loans().filter(l => l.userId === me.id).sort((a, b) => new Date(b.date) - new Date(a.date)); },
  applyLoan(type, amount, years) {
    const me = this.current(); amount = Number(amount); years = Number(years);
    if (!(amount >= 10000)) return { ok: false, msg: 'Minimum loan amount is ₹10,000.' };
    const rate = LOAN_RATES[type]; const loans = this._loans();
    loans.push({ id: 'LN' + (1001 + loans.length), userId: me.id, accNo: me.accNo, name: me.name, type, amount, years, rate, emi: calcEmi(amount, rate, years), status: 'pending', date: new Date().toISOString() });
    Store.set('sb_loans', loans);
    this._notify(me.id, type + ' loan application of ' + money(amount) + ' submitted.');
    return { ok: true, msg: 'Loan application submitted. Status: Pending.' };
  },

  /* ----- customer: profile ----- */
  updateProfile(name, phone, city) {
    if (!name.trim()) return { ok: false, msg: 'Name cannot be empty.' };
    if (!/^\d{10}$/.test(phone)) return { ok: false, msg: 'Enter a valid 10 digit mobile number.' };
    this._update(this.current().id, u => { u.name = name.trim(); u.phone = phone; u.city = city.trim(); });
    return { ok: true, msg: 'Profile updated.' };
  },
  changePassword(oldP, newP) {
    const me = this.current();
    if (me.password !== oldP) return { ok: false, msg: 'Old password is wrong.' };
    if (newP.length < 4) return { ok: false, msg: 'New password must be at least 4 characters.' };
    this._update(me.id, u => u.password = newP);
    return { ok: true, msg: 'Password changed successfully.' };
  },

  /* ----- notifications ----- */
  notifications() { const me = this.current(); return this._notes().filter(n => n.userId === me.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8); },
  unreadCount() { const me = this.current(); return this._notes().filter(n => n.userId === me.id && !n.read).length; },
  markAllRead() { const me = this.current(); Store.set('sb_notes', this._notes().map(n => n.userId === me.id ? { ...n, read: true } : n)); },

  /* ----- admin ----- */
  allCustomers() { return this._users().filter(u => u.role === 'customer'); },
  allTxns() { return this._txns().slice().sort((a, b) => new Date(b.date) - new Date(a.date)); },
  allLoans() { return this._loans().slice().sort((a, b) => new Date(b.date) - new Date(a.date)); },
  toggleBlock(userId) {
    const u = this._update(userId, x => x.status = x.status === 'active' ? 'blocked' : 'active');
    return u.status;
  },
  setLoanStatus(id, status) {
    const loans = this._loans(); const l = loans.find(x => x.id === id);
    if (!l || l.status !== 'pending') return;
    l.status = status; Store.set('sb_loans', loans);
    if (status === 'approved') {
      this._update(l.userId, u => u.balance += l.amount);
      this._addTxn(l.accNo, 'credit', l.amount, 'Loan disbursed ' + l.id);
    }
    this._notify(l.userId, 'Your ' + l.type + ' loan ' + l.id + ' was ' + status + '.');
  }
};
Api.init();
